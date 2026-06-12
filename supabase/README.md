# Supabase

This folder contains the database foundation for the World Cup 2026 platform.

## Structure

- `config.toml`: local Supabase project settings.
- `migrations/`: SQL migrations for schema, RLS, grants, and helper functions.
- `seed.sql`: generated seed data for groups, teams, venues, matches, match stages, and bracket metadata.

## Execution order

1. Apply migrations in filename order.
2. Regenerate the seed file when source data changes:

   ```bash
   npm run seed:sql
   ```

3. Run `seed.sql` after migrations using your deployment workflow, Supabase Dashboard SQL editor, or SQL runner.

## Notes

- The Supabase CLI was not installed in the local environment when this folder was created, so the migration file was authored manually.
- Apply migrations through the Supabase CLI, Dashboard SQL editor, or your preferred deployment workflow.
- The migration explicitly grants Data API access to `anon` and `authenticated` where needed because new Supabase projects may not expose public tables automatically.
- Regenerate `seed.sql` with `npm run seed:sql` whenever `src/data/stages.ts`, `src/data/teams.ts`, `src/data/venues.ts`, or `src/data/matches.ts` changes.
