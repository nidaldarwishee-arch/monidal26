import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { deflateSync } from "node:zlib";

const root = process.cwd();
const iconDir = join(root, "public", "icons");

const COLORS = {
  bg: [5, 11, 20, 255],
  pitch: [21, 128, 61, 255],
  pitchDark: [10, 83, 45, 255],
  white: [255, 255, 255, 255],
  line: [232, 245, 235, 210],
  black: [15, 23, 42, 255],
  gold: [245, 158, 11, 255],
};

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

const crcTable = makeCrcTable();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function createPng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rawRow = y * (width * 4 + 1);
    const srcRow = y * width * 4;
    raw[rawRow] = 0;
    rgba.copy(raw, rawRow + 1, srcRow, srcRow + width * 4);
  }

  const header = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    header,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function setPixel(buffer, width, x, y, color) {
  if (x < 0 || y < 0 || x >= width) return;
  const index = (Math.floor(y) * width + Math.floor(x)) * 4;
  const alpha = color[3] / 255;
  const inverse = 1 - alpha;
  buffer[index] = Math.round(color[0] * alpha + buffer[index] * inverse);
  buffer[index + 1] = Math.round(color[1] * alpha + buffer[index + 1] * inverse);
  buffer[index + 2] = Math.round(color[2] * alpha + buffer[index + 2] * inverse);
  buffer[index + 3] = 255;
}

function fill(buffer, width, height, color) {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) setPixel(buffer, width, x, y, color);
  }
}

function circle(buffer, width, height, cx, cy, radius, color) {
  const r2 = radius * radius;
  for (let y = Math.max(0, cy - radius); y < Math.min(height, cy + radius); y += 1) {
    for (let x = Math.max(0, cx - radius); x < Math.min(width, cx + radius); x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) setPixel(buffer, width, x, y, color);
    }
  }
}

function rect(buffer, width, height, x, y, w, h, color) {
  for (let py = Math.max(0, y); py < Math.min(height, y + h); py += 1) {
    for (let px = Math.max(0, x); px < Math.min(width, x + w); px += 1) {
      setPixel(buffer, width, px, py, color);
    }
  }
}

function line(buffer, width, height, x0, y0, x1, y1, thickness, color) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= steps; i += 1) {
    const t = steps === 0 ? 0 : i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    circle(buffer, width, height, x, y, thickness / 2, color);
  }
}

const DIGITS = {
  2: ["111", "001", "001", "111", "100", "100", "111"],
  6: ["111", "100", "100", "111", "101", "101", "111"],
};

function digit(buffer, width, height, value, x, y, scale, color) {
  const rows = DIGITS[value];
  rows.forEach((row, rowIndex) => {
    [...row].forEach((cell, colIndex) => {
      if (cell === "1") rect(buffer, width, height, x + colIndex * scale, y + rowIndex * scale, scale, scale, color);
    });
  });
}

function drawIcon(size, maskable = false) {
  const buffer = Buffer.alloc(size * size * 4);
  fill(buffer, size, size, COLORS.bg);

  const center = size / 2;
  const safe = maskable ? size * 0.42 : size * 0.46;
  circle(buffer, size, size, center, center, safe, COLORS.pitchDark);
  circle(buffer, size, size, center, center, safe * 0.9, COLORS.pitch);

  line(buffer, size, size, center - safe * 0.68, center, center + safe * 0.68, center, Math.max(2, size * 0.015), COLORS.line);
  line(buffer, size, size, center, center - safe * 0.68, center, center + safe * 0.68, Math.max(2, size * 0.015), COLORS.line);
  circle(buffer, size, size, center, center, safe * 0.28, [255, 255, 255, 60]);

  const ballR = size * 0.18;
  circle(buffer, size, size, center, center - safe * 0.08, ballR, COLORS.white);
  circle(buffer, size, size, center, center - safe * 0.08, ballR * 0.34, COLORS.black);
  circle(buffer, size, size, center - ballR * 0.55, center - safe * 0.1, ballR * 0.15, COLORS.black);
  circle(buffer, size, size, center + ballR * 0.55, center - safe * 0.1, ballR * 0.15, COLORS.black);
  circle(buffer, size, size, center, center - safe * 0.08 + ballR * 0.55, ballR * 0.15, COLORS.black);

  const scale = Math.max(3, Math.floor(size / 42));
  const digitY = Math.floor(center + safe * 0.34);
  digit(buffer, size, size, 2, Math.floor(center - scale * 7), digitY, scale, COLORS.gold);
  digit(buffer, size, size, 6, Math.floor(center + scale * 1.5), digitY, scale, COLORS.gold);

  return createPng(size, size, buffer);
}

function writeAsset(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

mkdirSync(iconDir, { recursive: true });
writeAsset(join(iconDir, "icon-192.png"), drawIcon(192));
writeAsset(join(iconDir, "icon-512.png"), drawIcon(512));
writeAsset(join(iconDir, "icon-512-maskable.png"), drawIcon(512, true));
writeAsset(join(iconDir, "apple-touch-icon.png"), drawIcon(180));
writeAsset(join(iconDir, "favicon-32.png"), drawIcon(32));
writeAsset(
  join(root, "public", "favicon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#050b14"/>
  <circle cx="32" cy="30" r="25" fill="#15803d"/>
  <path d="M12 30h40M32 9v42" stroke="#e8f5eb" stroke-width="2" opacity=".7"/>
  <circle cx="32" cy="28" r="12" fill="#fff"/>
  <circle cx="32" cy="28" r="4" fill="#0f172a"/>
  <circle cx="25" cy="27" r="2" fill="#0f172a"/>
  <circle cx="39" cy="27" r="2" fill="#0f172a"/>
  <path d="M22 48h8v3h-12v-8h8v-3h-8v-3h12v8h-8zM35 37h12v3h-8v3h8v8h-12zM39 46v2h4v-2z" fill="#f59e0b"/>
</svg>
`
);

console.log(`Generated icons in ${iconDir}`);
