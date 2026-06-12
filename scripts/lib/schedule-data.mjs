import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const projectRoot = path.resolve(__dirname, "..", "..");

export const GROUP_IDS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

export async function loadTypeScriptModule(relativePath) {
  const filename = path.join(projectRoot, relativePath);
  const source = await readFile(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  }).outputText;

  const moduleShim = { exports: {} };
  const context = vm.createContext({
    console,
    exports: moduleShim.exports,
    module: moduleShim,
    require(id) {
      throw new Error(`Unsupported require("${id}") while loading ${relativePath}`);
    },
  });

  new vm.Script(compiled, { filename }).runInContext(context);
  return moduleShim.exports;
}

export function buildBracketNodes(matches) {
  const counters = new Map();
  return matches
    .filter((match) => match.r !== "GS")
    .map((match) => {
      const rowIndex = counters.get(match.r) ?? 0;
      counters.set(match.r, rowIndex + 1);
      return {
        match_n: match.n,
        round: match.r,
        column_index: ["R32", "R16", "QF", "SF", "3P", "F"].indexOf(match.r),
        row_index: rowIndex,
        label: `Match ${match.n}`,
      };
    });
}

export function buildBracketConnections(matches) {
  const connections = [];
  for (const source of matches) {
    for (const target of matches) {
      if (target.h === `W${source.n}` || target.a === `W${source.n}`) {
        connections.push({
          from_match_n: source.n,
          to_match_n: target.n,
          connection_type: "winner",
        });
      }
      if (target.h === `L${source.n}` || target.a === `L${source.n}`) {
        connections.push({
          from_match_n: source.n,
          to_match_n: target.n,
          connection_type: "loser",
        });
      }
    }
  }
  return connections;
}

/** Loads src/data and maps it to database-shaped rows shared by seed and import scripts. */
export async function loadScheduleRows() {
  const { MATCH_STAGES } = await loadTypeScriptModule("src/data/stages.ts");
  const { TEAMS } = await loadTypeScriptModule("src/data/teams.ts");
  const { VENUES } = await loadTypeScriptModule("src/data/venues.ts");
  const { MATCHES } = await loadTypeScriptModule("src/data/matches.ts");

  const groups = GROUP_IDS.map((id) => ({
    id,
    name_en: `Group ${id}`,
    name_ar: `المجموعة ${id}`,
  }));

  const stages = MATCH_STAGES.map((stage) => ({
    id: stage.id,
    name_en: stage.nameEn,
    name_ar: stage.nameAr,
    stage_order: stage.stageOrder,
    is_knockout: stage.isKnockout,
  }));

  const teams = TEAMS.map((team) => ({
    id: team.id,
    group_id: team.group,
    iso: team.iso,
    name_en: team.nameEn,
    name_ar: team.nameAr,
    host: Boolean(team.host),
  }));

  const venues = VENUES.map((venue) => ({
    id: venue.id,
    name_en: venue.nameEn,
    name_ar: venue.nameAr,
    city_en: venue.cityEn,
    city_ar: venue.cityAr,
    country: venue.country,
    lat: venue.lat,
    lng: venue.lng,
    tz: venue.tz,
    capacity: venue.capacity,
  }));

  const matches = MATCHES.map((match) => ({
    match_n: match.n,
    round: match.r,
    group_id: match.g ?? null,
    home_slot: match.h,
    away_slot: match.a,
    kickoff_at: match.t,
    venue_id: match.v,
    status: "scheduled",
  }));

  return {
    stages,
    groups,
    teams,
    venues,
    matches,
    bracketNodes: buildBracketNodes(MATCHES),
    bracketConnections: buildBracketConnections(MATCHES),
  };
}
