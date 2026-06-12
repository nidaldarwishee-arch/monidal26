# Supabase

This folder contains the database foundation for the World Cup 2026 platform.

## Structure

- `config.toml`: local Supabase project settings.
- `migrations/`: SQL migrations for schema, RLS, grants, and helper functions.

## Notes

- The Supabase CLI was not installed in the local environment when this folder was created, so the migration file was authored manually.
- Apply migrations through the Supabase CLI, Dashboard SQL editor, or your preferred deployment workflow.
- The migration explicitly grants Data API access to `anon` and `authenticated` where needed because new Supabase projects may not expose public tables automatically.
