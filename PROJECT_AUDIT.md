# Project Audit

Audit date: 2026-06-12

Scope: current repository review after adding the Supabase foundation and authentication routes. Validation run: `npm.cmd run typecheck` and `npm.cmd run build`.

## 1. Existing architecture

- Stack: Next.js 15 App Router, React 19, TypeScript strict mode, Tailwind CSS v4, next-intl, next-themes, Leaflet/react-leaflet, Supabase SSR/client libraries.
- Routing: localized app routes live under `src/app/[locale]`; `next-intl` uses `en` and `ar` with `localePrefix: "as-needed"`. English is the default route and Arabic uses `/ar`.
- Layout: `src/app/[locale]/layout.tsx` sets `lang` and `dir`, loads Google fonts via `next/font`, and wraps pages with theme, i18n, header, footer, bottom nav, PWA prompt, and service worker registration.
- Supabase structure now exists under `supabase/` with `config.toml`, `README.md`, and SQL migrations in `supabase/migrations/`.
- Supabase app helpers now live in `src/lib/supabase/`:
  - `env.ts` reads public Supabase configuration safely.
  - `client.ts` creates the browser client.
  - `server.ts` creates the cookie-aware server client.
  - `middleware.ts` refreshes auth cookies in Next middleware.
  - `auth.ts` contains route protection and current-user/profile helpers.
  - `actions.ts` contains sign-in, sign-up, and sign-out server actions.
  - `database.types.ts` provides typed table contracts for the authored schema.
- Middleware now composes next-intl routing with Supabase session refresh in `src/middleware.ts`.
- Data layer is still primarily static TypeScript in `src/data/teams.ts`, `src/data/venues.ts`, `src/data/matches.ts`, and `src/data/results.ts`.
- Client state still uses `src/lib/store.ts` localStorage for profile, predictions, favorites, saved matches, and local admin results.
- Server state merges `SEED_RESULTS` with Supabase `match_results` rows when Supabase is configured.

## 2. Existing pages

- `/` and `/ar`: home page with hero, quick links, tournament counts, next kickoff, upcoming matches, and featured matches.
- `/matches` and `/ar/matches`: match explorer with filters by date, round, group, team, and venue.
- `/matches/[n]` and `/ar/matches/[n]`: statically generated match details for all 104 matches, including kickoff, venue, calendar export, share, progression links, prediction form, feeder matches, and group meetings.
- `/groups` and `/ar/groups`: 12 group tabs with standings and fixtures.
- `/rounds` and `/ar/rounds`: round explorer, knockout bracket, and predicted bracket toggle.
- `/map` and `/ar/map`: Leaflet venue map with group path, knockout path, and team journey modes.
- `/calendar` and `/ar/calendar`: month/list calendar plus ICS export controls.
- `/login` and `/ar/login`: Supabase email/password sign-in form.
- `/register` and `/ar/register`: Supabase email/password registration form.
- `/auth` and `/ar/auth`: compatibility route that redirects to localized `/login`.
- `/dashboard` and `/ar/dashboard`: protected dashboard route; unauthenticated users redirect to login with a `next` parameter.
- `/admin` and `/ar/admin`: existing result entry dashboard; role handling still depends on existing admin code and RLS/API checks.
- `/auth/callback`: server route for exchanging Supabase auth codes and redirecting to the requested next path.

## 3. Existing APIs

- `GET /api/matches`: returns resolved matches, with filters for `round`, `group`, `team`, `venue`, and UTC `date`.
- `GET /api/matches/[n]`: returns one resolved match, bracket progression targets, and feeder matches.
- `GET /api/groups`: returns group IDs with static teams and match numbers.
- `GET /api/standings`: returns live group standings and best third-place ranking from seeded/database results.
- `GET /api/bracket`: returns resolved knockout matches and progression connections.
- `GET /api/calendar/ics`: returns an ICS file for all matches, selected matches, team/team list, group, saved, or favorites scopes.
- `GET /api/predictions`: returns the signed-in user's Supabase predictions.
- `POST /api/predictions`: validates and upserts a signed-in user's Supabase prediction.
- `POST /api/results`: admin-only result publishing endpoint with validation and `admin_logs` insert.

Important API wiring notes:

- Prediction and admin UI still also write directly to Supabase from browser components. The server APIs exist, but UI write paths are not yet fully centralized through them.
- Public read APIs still resolve mostly from static data and derived local logic rather than Supabase tables.

## 4. Existing components

- Layout/navigation/PWA: `SiteHeader`, `BottomNav`, `SiteFooter`, `LanguageSwitcher`, `ThemeProvider`, `ThemeToggle`, `PWAInstallPrompt`, `ServiceWorkerRegister`.
- UI primitives: `Button`, `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Badge`, `Input`, `Label`, `Select`.
- Match/tournament display: `HomeLive`, `Countdown`, `MatchCard`, `MatchDetail`, `MatchesExplorer`, `GroupTabs`, `GroupTable`, `RoundsExplorer`, `RoundTabs`, `BracketTree`, `TeamLabel`, `TeamFlag`.
- Calendar: `CalendarExplorer`, `CalendarExportButton`.
- Map: `MapSection`, `MatchMap`.
- Auth/user/admin: `AuthForm`, legacy `AuthPanel`, `UserDashboard`, `AdminDashboard`, `AdminResultEditor`, `PredictionForm`.

## 5. Existing PWA features

- `src/app/manifest.ts` defines app metadata, standalone display, theme/background colors, icon references, and shortcuts.
- `src/app/[locale]/layout.tsx` adds manifest metadata, Apple web app settings, theme colors, and icon metadata.
- `public/sw.js` includes precache, network-first handling for pages/APIs, cache-first handling for static assets/icons/flags/map tiles, network-only handling for ICS downloads, cache cleanup, push notification handling, and notification click handling.
- `ServiceWorkerRegister` registers `/sw.js` in production.
- `PWAInstallPrompt` listens for `beforeinstallprompt` and stores dismissal in localStorage.

PWA gaps:

- `public/icons` still does not exist, but manifest and metadata reference icon files there.
- `package.json` still references missing scripts for icon generation and data import/seed.
- No offline page exists.
- Push handlers exist, but there is no subscription UI, push backend, VAPID setup, or notification preferences.
- Manifest shortcuts are default-route/English only.

## 6. Existing calendar features

- Calendar page supports month and list views for June/July 2026.
- Export UI supports all matches, favorite teams, one group, and saved matches.
- Per-match calendar button supports ICS download and Google Calendar deep link.
- `buildICS()` creates calendar events with UID, DTSTAMP, DTSTART, DTEND, SUMMARY, LOCATION, DESCRIPTION, URL, and one display alarm.
- ICS export route supports all matches, selected match numbers, one team, multiple teams, one group, saved matches, and favorite teams.

Calendar gaps:

- Team-scope ICS export still checks static group-stage slots, so it does not include resolved knockout matches for a team.
- Arabic ICS descriptions can use `/ar/matches/...`, but event `URL` still uses the default `/matches/...` route.
- ICS folding uses character length, not byte/octet length, which can be invalid for Arabic text.
- Calendar month navigation is hardcoded to June and July 2026.
- There is no webcal feed, user-specific secure calendar URL, timezone selector, or persisted reminder preference.

## 7. Existing World Cup functionality

- Static 48-team dataset with group assignment, English/Arabic names, flag ISO codes, and host markers.
- Static 16-venue dataset with English/Arabic names, city, country, coordinates, timezone, and capacity.
- Static 104-match schedule with UTC kickoff times, venue IDs, group-stage slots, knockout placeholders, and match numbers.
- Group standings engine with points, goal difference, goals for, head-to-head mini-table handling, and alphabetical fallback.
- Best third-place ranking returns the top 8 third-placed teams.
- Bracket engine resolves direct team slots, group winners/runners-up, best third-place slots, previous-match winners/losers, and champion display after the final.
- Third-place allocation for the Round of 32 is handled with backtracking against allowed group sets.
- Predictions can preview bracket progression and score user accuracy.
- Admin result entry updates standings/bracket immediately in demo/local state and can write official results to Supabase when configured.
- Interactive map shows venues, per-venue matches, group paths, knockout connections, and team journeys.

World Cup data caveat:

- The repo still treats hardcoded files as the tournament source of truth. There is no verified import pipeline, provenance metadata, validation test, or external sync in this repository yet.

## 8. Missing features

- Supabase migrations are authored but not applied from this environment. The Supabase CLI is not installed locally.
- Supabase tables created in migrations are not seeded with the static World Cup teams, groups, venues, matches, or bracket data yet.
- User favorites, saved matches, and dashboard preferences are not fully hydrated from Supabase after login.
- Prediction UI still primarily uses localStorage and direct browser writes rather than a complete server API flow.
- Admin UI still performs some direct browser writes to `match_results`; it should use `/api/results` consistently so role checks and audit logging always run.
- Admin role management is not implemented.
- No production data ingestion path exists for official FIFA data.
- Predictions, maps, and bracket UI were intentionally not expanded in this phase.
- No tests exist for RLS expectations, API auth, standings, tiebreakers, bracket resolution, third-place allocation, ICS generation, or PWA behavior.
- No ESLint config exists; `next lint` is deprecated and not CI-safe.
- Missing referenced package scripts remain: `scripts/generate-icons.mjs`, `scripts/generate-seed-sql.mjs`, and `scripts/import-schedule.mjs`.
- Demo/local mode is still available when Supabase env vars are absent. Production should fail closed or clearly disable write/admin flows.

## 9. Build errors

Current validation:

- `npm.cmd run typecheck`: passed.
- `npm.cmd run build`: passed after network access was allowed for `next/font` to fetch Google Fonts.

Resolved blockers in this phase:

- Removed unsupported `asChild` usage from `CalendarExportButton`.
- Added `typecheck` script.
- Typed Supabase cookie adapters.
- Added typed Supabase database contracts so table reads/writes no longer infer as `never`.
- Aligned app code with the migration column name `winner_team_id`.
- Added `admin_logs` migration/type because `/api/results` already writes audit entries.

Remaining build/process notes:

- Restricted sandbox build initially failed with `EACCES` while fetching Google Fonts through `next/font`. The same build passed when rerun with network permission.
- Lint remains unresolved because the repo has no ESLint config and `next lint` is deprecated.

## 10. Recommendations

1. Apply and verify Supabase migrations.
   - Install/use Supabase CLI or run the SQL in the Supabase dashboard.
   - Verify RLS policies with real authenticated, anonymous, and admin users.

2. Seed production data.
   - Create a verified import/seed pipeline for groups, teams, venues, matches, and bracket nodes.
   - Add provenance fields or documentation for the official data source.

3. Centralize write paths.
   - Route predictions through `/api/predictions`.
   - Route admin results through `/api/results`.
   - Hydrate dashboard state from Supabase on login.

4. Harden authentication and authorization.
   - Add admin role management that cannot be self-assigned by users.
   - Decide whether production should fail closed when Supabase env vars are missing.
   - Add tests for protected dashboard, admin checks, and RLS-sensitive flows.

5. Complete PWA assets and behavior.
   - Generate `public/icons` assets.
   - Add an offline fallback page.
   - Add push subscription storage and backend delivery before exposing push as a real feature.

6. Improve calendar export.
   - Use resolved matches for team calendar exports.
   - Make ICS URLs locale-aware.
   - Fold ICS lines by octets for Arabic-safe output.

7. Add focused tests and CI checks.
   - Cover standings, bracket propagation, third-place allocation, ICS output, auth APIs, and Supabase/local data merging.
   - Replace deprecated lint workflow with ESLint CLI plus a checked-in config.

## Supabase foundation completed in this phase

- Added `supabase/config.toml`.
- Added `supabase/README.md`.
- Added migrations:
  - `202606120001_supabase_foundation.sql`
  - `202606120002_admin_logs.sql`
- Created tables:
  - `profiles`
  - `teams`
  - `groups`
  - `venues`
  - `matches`
  - `match_results`
  - `user_predictions`
  - `user_favorite_teams`
  - `calendar_events`
  - `bracket_nodes`
  - `bracket_connections`
  - `admin_logs`
- Enabled RLS on authored tables.
- Added policies for public match viewing, authenticated user-owned rows, and admin management.
- Added Supabase browser, server, middleware, env, auth, server action, and database type helpers.
- Added `/login`, `/register`, `/dashboard` protection, and `/auth/callback`.
- Updated navigation/auth links to the new login route.
- Added localized auth messages.

## Mock and hardcoded data inventory

Mock/demo runtime data:

- `src/lib/store.ts`: localStorage state under `wc26:v1` for profile, predictions, favorites, saved matches, and local admin results.
- `src/components/auth-panel.tsx`: legacy local sign-in/demo profile flow remains in the repository.
- `src/components/admin-dashboard.tsx` and `src/components/admin-result-editor.tsx`: demo/local result entry remains available.
- `src/lib/hooks.ts`: official client results merge `SEED_RESULTS`, Supabase rows, and local demo admin results.
- `src/components/pwa-install-prompt.tsx`: localStorage dismissal key `wc26:install-dismissed`.

Hardcoded tournament data:

- `src/data/teams.ts`: 48 teams, IDs, flag ISO codes, English/Arabic names, groups, and host markers.
- `src/data/venues.ts`: 16 venues with coordinates, timezones, capacities, city/country labels.
- `src/data/matches.ts`: 104-match schedule, UTC kickoff times, group/round slots, venue assignments, knockout placeholders.
- `src/data/results.ts`: seeded opening result.

Hardcoded UI/product data:

- `src/app/[locale]/page.tsx`: quick links and stat values.
- `src/components/home-live.tsx`: featured match numbers.
- `src/components/calendar-explorer.tsx`: year/month assumptions for June and July 2026.
- `src/components/match-map.tsx`: default map mode/group/team, map center/zoom, country label map, marker letters, and CARTO tile URLs.
- `src/app/manifest.ts`: app metadata, icon paths, and shortcut paths.
- `public/sw.js`: cache version, precache URLs, and push notification fallback copy.
- `src/messages/en.json` and `src/messages/ar.json`: static product copy.

Hardcoded configuration and external services:

- `.env.example`, `src/app/[locale]/layout.tsx`, `src/app/api/calendar/ics/route.ts`, `src/components/calendar-export-button.tsx`, and `src/lib/supabase/actions.ts`: localhost/site URL fallbacks.
- `next.config.ts`, `src/data/teams.ts`, and `src/components/team-flag.tsx`: `flagcdn.com` for flags.
- `src/components/match-map.tsx` and `public/sw.js`: CARTO/OpenStreetMap tile hosts.
- `src/lib/ics.ts`: Google Calendar URL format and `PRODID`.
- Supabase table names are hardcoded across migrations, API routes, hooks, and components.
