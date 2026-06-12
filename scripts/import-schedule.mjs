/**
 * Imports the schedule from src/data into Supabase through the REST API.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, read from
 * the environment or .env.local. Run after migrations have created the schema:
 *
 *   npm run import:schedule
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadScheduleRows, projectRoot } from "./lib/schedule-data.mjs";

async function loadEnvLocal() {
  let raw;
  try {
    raw = await readFile(path.join(projectRoot, ".env.local"), "utf8");
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2].trim();
  }
}

await loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (environment or .env.local)."
  );
  process.exit(1);
}

async function upsert(table, rows, conflictColumns, { ignoreDuplicates = false } = {}) {
  const endpoint = new URL(`/rest/v1/${table}`, url);
  endpoint.searchParams.set("on_conflict", conflictColumns.join(","));
  const resolution = ignoreDuplicates ? "ignore-duplicates" : "merge-duplicates";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: `resolution=${resolution},return=minimal`,
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Upsert into ${table} failed (HTTP ${response.status}): ${body}`);
  }
  console.log(`${table}: upserted ${rows.length} rows`);
}

const { stages, groups, teams, venues, matches, bracketNodes, bracketConnections } =
  await loadScheduleRows();

await upsert("match_stages", stages, ["id"]);
await upsert("groups", groups, ["id"]);
await upsert("teams", teams, ["id"]);
await upsert("venues", venues, ["id"]);
await upsert("matches", matches, ["match_n"]);
await upsert("bracket_nodes", bracketNodes, ["match_n"]);
await upsert(
  "bracket_connections",
  bracketConnections,
  ["from_match_n", "to_match_n", "connection_type"],
  { ignoreDuplicates: true }
);

console.log("Schedule import complete.");
