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

## One-paste provisioning (empty project)

To provision a brand-new Supabase project in a single SQL editor paste:

```bash
npm run seed:sql       # regenerate seed.sql from src/data
npm run db:setup-sql   # bundle migrations + seed into supabase/setup.generated.sql
```

Paste the contents of `supabase/setup.generated.sql` (gitignored) into the
Supabase Dashboard SQL editor and run it once. It applies every migration in
order and then the seed upserts; reruns are safe because everything is
idempotent (`create ... if not exists` / `on conflict` upserts).

Alternatively, after migrations exist you can push only the schedule data
through the REST API with the service-role key:

```bash
npm run import:schedule   # reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
```

## Promote an admin

Admin APIs and the `/admin` dashboard require `profiles.role = 'admin'`.
After signing up through the app, run:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

## Notes

- The Supabase CLI was not installed in the local environment when this folder was created, so the migration file was authored manually.
- Apply migrations through the Supabase CLI, Dashboard SQL editor, or your preferred deployment workflow.
- The migration explicitly grants Data API access to `anon` and `authenticated` where needed because new Supabase projects may not expose public tables automatically.
- Regenerate `seed.sql` with `npm run seed:sql` whenever `src/data/stages.ts`, `src/data/teams.ts`, `src/data/venues.ts`, or `src/data/matches.ts` changes.
