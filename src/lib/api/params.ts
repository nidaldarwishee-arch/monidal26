export function parseMatchNumberParam(value: string): number | null {
  const matchN = Number(value);
  return Number.isInteger(matchN) && matchN >= 1 && matchN <= 104 ? matchN : null;
}
