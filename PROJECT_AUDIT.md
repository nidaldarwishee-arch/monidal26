# Project Audit

Audit date: 2026-06-12

Scope: static repository review plus `npm.cmd run build`, `npx.cmd tsc --noEmit --pretty false`, and `npm.cmd run lint`. No implementation code was changed.

## 1. Existing architecture

- Stack: Next.js 15 App Router, React 19, TypeScript strict mode, Tailwind CSS v4, next-intl, next-themes, Leaflet/react-leaflet, Supabase SSR/client libraries.
- Routing: app routes live under `src/app/[locale]`; `next-intl` uses locales `en` and `ar` with `localePrefix: "as-needed"`. English is the default route (`/`), Arabic uses `/ar`.
- Layout: `src/app/[locale]/layout.tsx` sets `lang` and `dir` (`rtl` for Arabic), loads Google fonts via `next/font`, wraps pages in theme, i18n, header, footer, bottom nav, PWA prompt, and service-worker registration.
- Data layer: tournament source data is static TypeScript in `src/data/teams.ts`, `src/data/venues.ts`, `src/data/matches.ts`, and `src/data/results.ts`.
- Domain layer: standings, bracket resolution, time formatting, local state, server data merging, and ICS generation live in `src/lib`.
- Supabase integration is optional. `getSupabaseServer()` and `getSupabaseBrowser()` return `null` when public Supabase env vars are missing, and the app falls back to browser-only local demo mode.
- Server state: official results are derived from hardcoded `SEED_RESULTS` plus Supabase `match_results` rows when configured.
- Client state: `src/lib/store.ts` keeps profile, predictions, favorites, saved matches, and local admin results in localStorage under `wc26:v1`.
- UI architecture: route pages are thin and delegate most behavior to reusable client components under `src/components`.
- Middleware: `src/middleware.ts` only runs next-intl routing. There is no Supabase session refresh in middleware.

## 2. Existing pages

- `/` and `/ar`: home page with hero, quick links, hardcoded tournament counts, next kickoff, today's/upcoming matches, and featured matches.
- `/matches` and `/ar/matches`: all matches with filters by date, round, group, team, and venue.
- `/matches/[n]` and `/ar/matches/[n]`: statically generated match details for all 104 matches, with kickoff times, venue link, calendar export, share, progression links, prediction form, feeder matches, and group meetings.
- `/groups` and `/ar/groups`: 12 group tabs with standings and fixtures.
- `/rounds` and `/ar/rounds`: group/knockout round explorer plus bracket tree and predicted bracket toggle.
- `/map` and `/ar/map`: Leaflet venue map with group path, knockout path, and team journey modes.
- `/calendar` and `/ar/calendar`: month/list calendar plus ICS export controls.
- `/auth` and `/ar/auth`: email/password and magic-link auth when Supabase is configured; local profile fallback otherwise.
- `/dashboard` and `/ar/dashboard`: user hub for favorites, saved matches, predictions, prediction score, and local reset.
- `/admin` and `/ar/admin`: result entry dashboard; role-gated only when Supabase is configured, open in demo mode.

## 3. Existing APIs

- `GET /api/matches`: returns resolved matches, with filters for `round`, `group`, `team`, `venue`, and UTC `date`.
- `GET /api/matches/[n]`: returns one resolved match, bracket progression targets, and feeder matches.
- `GET /api/groups`: returns group IDs with static teams and match numbers.
- `GET /api/standings`: returns live group standings and best third-place ranking from seeded/database results.
- `GET /api/bracket`: returns resolved knockout matches and progression connections.
- `GET /api/calendar/ics`: returns an ICS file for `all`, `matches:...`, `team:...`, `teams:...`, or `group:...` scope.
- `GET /api/predictions`: returns signed-in user's Supabase predictions.
- `POST /api/predictions`: validates and upserts a signed-in user's Supabase prediction.
- `POST /api/results`: admin-only result publishing endpoint with validation and an `admin_logs` insert.

Important API wiring note: the UI does not consistently use these write APIs. `useSavePrediction()` writes directly to Supabase from the browser, and `AdminResultEditor` writes/deletes `match_results` directly from the browser instead of using `/api/predictions` or `/api/results`.

## 4. Existing components

- Layout/navigation/PWA: `SiteHeader`, `BottomNav`, `SiteFooter`, `LanguageSwitcher`, `ThemeProvider`, `ThemeToggle`, `PWAInstallPrompt`, `ServiceWorkerRegister`.
- UI primitives: `Button`, `Card`, `CardHeader`, `CardTitle`, `CardContent`, `Badge`, `Input`, `Label`, `Select`.
- Match/tournament display: `HomeLive`, `Countdown`, `MatchCard`, `MatchDetail`, `MatchesExplorer`, `GroupTabs`, `GroupTable`, `RoundsExplorer`, `RoundTabs`, `BracketTree`, `TeamLabel`, `TeamFlag`.
- Calendar: `CalendarExplorer`, `CalendarExportButton`.
- Map: `MapSection`, `MatchMap`.
- Auth/user/admin: `AuthPanel`, `UserDashboard`, `AdminDashboard`, `AdminResultEditor`, `PredictionForm`.

## 5. Existing PWA features

- `src/app/manifest.ts` defines app name, short name, description, start URL, scope, standalone display, portrait orientation, theme/background colors, English language metadata, icon references, and shortcuts.
- `src/app/[locale]/layout.tsx` adds manifest metadata, Apple web app settings, theme colors, and icon metadata.
- `public/sw.js` includes:
  - install-time precache for selected shell routes and `/api/matches`;
  - network-first strategy for same-origin pages/APIs;
  - cache-first strategy for Next static assets, `/icons/`, flag images, and CARTO map tiles;
  - network-only handling for calendar ICS downloads;
  - cache cleanup by version;
  - push notification and notification click handlers.
- `ServiceWorkerRegister` registers `/sw.js` only in production.
- `PWAInstallPrompt` listens for `beforeinstallprompt` and stores dismissal in localStorage.

PWA gaps:

- `public/icons` does not exist, but the manifest and metadata reference `/icons/icon-192.png`, `/icons/icon-512.png`, `/icons/icon-512-maskable.png`, and `/icons/apple-touch-icon.png`.
- `package.json` has an `icons` script pointing to `scripts/generate-icons.mjs`, but there is no `scripts` directory.
- No offline page exists.
- Push handlers exist, but there is no subscription UI, push service, VAPID/backend integration, or notification preferences.
- Manifest shortcuts are English/default-route only.

## 6. Existing calendar features

- Calendar page supports month and list views for June/July 2026.
- Export UI supports all matches, favorite teams, one group, and saved matches.
- Per-match calendar button supports ICS download and Google Calendar deep link.
- `buildICS()` creates RFC 5545-style events with UID, DTSTAMP, DTSTART, DTEND, SUMMARY, LOCATION, DESCRIPTION, URL, and a one-hour display alarm.
- ICS export scopes support all matches, selected match numbers, one/multiple teams, and one group.

Calendar issues:

- Team-scope ICS export only checks static `h`/`a` slots in `MATCHES`, so it does not include resolved knockout matches for a team even though the route comment says it should.
- Arabic ICS descriptions use `/ar/matches/...`, but event `URL` always uses `/matches/...`.
- ICS folding uses character length, not octet length, which can be invalid for Arabic/non-ASCII text.
- Calendar month navigation is hardcoded to June and July 2026.
- There is no webcal/subscribed calendar URL, user-specific secure calendar feed, timezone selector, or reminder preference persistence.

## 7. Existing World Cup functionality

- Static 48-team dataset, including group assignment, English/Arabic names, flag ISO codes, and host markers.
- Static 16-venue dataset, including English/Arabic names, city, country, coordinates, timezone, and capacity.
- Static 104-match schedule with UTC kickoff times, venue IDs, group-stage slots, knockout placeholders, and match numbers.
- Group standings engine with points, goal difference, goals for, head-to-head mini-table handling, and alphabetical fallback.
- Best third-place ranking returns top 8 third-placed teams.
- Bracket engine resolves:
  - direct team slots;
  - group winners/runners-up;
  - best third-place slots;
  - winners/losers of previous matches;
  - champion display after final result.
- Third-place allocation for Round of 32 is handled with backtracking against allowed group sets.
- Predictions can preview bracket progression and score user accuracy.
- Admin result entry updates standings/bracket immediately in demo mode and can write to Supabase when configured.
- Interactive map shows venues, per-venue matches, group paths, knockout connections, and team journeys.

World Cup data caveat:

- The repo claims the team/group/schedule files are official, but the source of truth is hardcoded and there is no import script, migration, provenance metadata, validation test, or external sync in the repository. Treat this as hardcoded tournament data until validated against the official feed/source.

## 8. Missing features

- Supabase migrations/schema are missing. `.env.example` references `/supabase/migrations`, but no `supabase` directory exists.
- Required database tables are implied but not defined in repo: `profiles`, `match_results`, `user_predictions`, and `admin_logs`.
- RLS policies are not present, despite code relying on RLS for predictions and admin results.
- No server-side auth callback route or Supabase session-refresh middleware is present.
- User profile/favorites/saved matches are not fully persisted to Supabase.
- Existing Supabase predictions are not hydrated into local UI state after login; the app saves predictions to Supabase but primarily reads from localStorage.
- Admin UI bypasses `/api/results`, so server-side admin validation and `admin_logs` are skipped on the main admin workflow.
- Demo/local mode is available by default whenever Supabase env vars are absent. There is no production guard that fails closed.
- No README exists, although UI/env copy references README setup instructions.
- Package scripts reference missing files:
  - `scripts/generate-icons.mjs`
  - `scripts/generate-seed-sql.mjs`
  - `scripts/import-schedule.mjs`
- No tests exist for standings, tiebreakers, bracket resolution, third-place allocation, ICS generation, API auth, or PWA behavior.
- No ESLint config exists; the lint command prompts interactively.
- No `typecheck` script exists.
- No Vercel configuration is present. This is not strictly required for Next.js, but production env/build expectations are undocumented.
- No Supabase Realtime/live updates are wired.
- No protected admin role management flow exists.
- No production data ingestion path is present for official FIFA data.
- No notification subscription backend exists.

## 9. Build errors

Commands run:

- `npm run build` failed in PowerShell because `npm.ps1` is blocked by local execution policy.
- `npm.cmd run build` inside the restricted sandbox initially failed when `next/font` could not fetch Google Fonts.
- `npm.cmd run build` with unrestricted execution fetched fonts, compiled webpack, then failed during type checking.

Actual build blocker:

```text
src/components/calendar-export-button.tsx:38:67
Property 'asChild' does not exist on type 'ButtonProps'.
```

Additional TypeScript errors from `npx.cmd tsc --noEmit --pretty false`:

```text
src/components/calendar-export-button.tsx(38,67): Property 'asChild' does not exist on type 'ButtonProps'.
src/lib/supabase/server.ts(24,16): Parameter 'cookiesToSet' implicitly has an 'any' type.
src/lib/supabase/server.ts(26,37): Binding element 'name' implicitly has an 'any' type.
src/lib/supabase/server.ts(26,43): Binding element 'value' implicitly has an 'any' type.
src/lib/supabase/server.ts(26,50): Binding element 'options' implicitly has an 'any' type.
```

Lint status:

- `npm.cmd run lint` runs `next lint`, which is deprecated and prompts to configure ESLint because no ESLint config exists. This is not CI-safe.

Generated artifacts from verification:

- The build/typecheck created ignored generated files/directories: `.next`, `next-env.d.ts`, and `tsconfig.tsbuildinfo`.

## 10. Recommendations

1. Fix build/typecheck first.
   - Remove the unsupported `asChild` prop from `CalendarExportButton`.
   - Type the Supabase cookie adapter in `src/lib/supabase/server.ts`.
   - Add a `typecheck` script.
   - Replace `next lint` with ESLint CLI and a checked-in ESLint config.

2. Decide the production data source.
   - Move teams, venues, matches, and official results into Supabase or generate the static files from a verified import pipeline.
   - Add provenance fields/source metadata and automated validation.
   - Restore/create the missing import and seed scripts or remove the package scripts.

3. Add Supabase schema and RLS.
   - Create migrations for `profiles`, `match_results`, `user_predictions`, `admin_logs`, plus any favorites/saved-match tables.
   - Enable RLS on exposed tables.
   - Protect admin roles so users cannot self-promote.
   - Document env setup in a README.

4. Route writes through server APIs.
   - Make prediction saves use `/api/predictions` and hydrate predictions from Supabase on login.
   - Make admin result publishing use `/api/results` so role checks, validation, and audit logging run consistently.

5. Tighten production mode.
   - Fail closed or clearly disable auth/admin/prediction writes when Supabase is missing in production.
   - Remove demo-mode admin access from production builds.

6. Complete PWA assets and behavior.
   - Add generated icons under `public/icons`.
   - Add an offline fallback route/page.
   - Add push subscription storage and backend delivery before presenting notifications as a real feature.

7. Harden calendar export.
   - Use resolved matches for team-scope exports so knockout matches are included.
   - Make Arabic ICS `URL` locale-aware.
   - Fold ICS lines by octets.
   - Consider webcal feeds for favorites/saved matches.

8. Add focused tests.
   - Cover standings/tiebreakers, third-place ranking/allocation, bracket propagation, ICS output, API auth/validation, and local/Supabase data merging.

9. Reduce hardcoded production assumptions.
   - Centralize constants for site URL, external asset hosts, tournament year, calendar months, featured matches, and static counts.
   - Prefer derived counts from data where possible.

## Mock and hardcoded data inventory

Mock/demo runtime data:

- `src/lib/store.ts`: localStorage state under `wc26:v1` for profile, predictions, favorites, saved matches, and local admin results.
- `src/components/auth-panel.tsx`: local sign-in creates browser-only users with `local-${Date.now()}` IDs and default `Fan` naming.
- `src/components/admin-dashboard.tsx` and `src/components/admin-result-editor.tsx`: demo mode allows local browser result entry.
- `src/lib/hooks.ts`: official client results merge `SEED_RESULTS`, Supabase rows, and local demo admin results.
- `src/components/pwa-install-prompt.tsx`: localStorage dismissal key `wc26:install-dismissed` for install prompt state.

Hardcoded tournament data:

- `src/data/teams.ts`: 48 teams, FIFA-like IDs, flag ISO codes, English/Arabic names, groups, hosts.
- `src/data/venues.ts`: 16 venues with coordinates, timezones, capacities, city/country labels.
- `src/data/matches.ts`: 104-match schedule, UTC kickoff times, group/round slots, venue assignments, knockout placeholders.
- `src/data/results.ts`: seeded opening result `{ matchN: 1, homeGoals: 2, awayGoals: 0, status: "played" }`.

Hardcoded UI/product data:

- `src/app/[locale]/page.tsx`: quick links and stat values `104`, `48`, `16`, `16`.
- `src/components/home-live.tsx`: featured match numbers `[7, 19, 21, 66, 70, 104]`.
- `src/components/calendar-explorer.tsx`: year `2026`, month indexes for June/July, weekday seed date.
- `src/components/match-map.tsx`: default map mode/group/team, map center/zoom, country label map, marker letters, CARTO tile URLs.
- `src/app/manifest.ts`: app metadata, icon paths, shortcut paths.
- `public/sw.js`: cache version `wc26-v1`, precache URLs, push default title/body/icon.
- `src/messages/en.json` and `src/messages/ar.json`: static product copy, including setup references to README and demo mode.

Hardcoded configuration and external services:

- `.env.example`, `src/app/[locale]/layout.tsx`, `src/app/api/calendar/ics/route.ts`, and `src/components/calendar-export-button.tsx`: localhost fallback `http://localhost:3000`.
- `next.config.ts`, `src/data/teams.ts`, and `src/components/team-flag.tsx`: `flagcdn.com` for flags.
- `src/components/match-map.tsx` and `public/sw.js`: CARTO/OpenStreetMap tile hosts.
- `src/lib/ics.ts`: Google Calendar URL format and `PRODID`.
- Supabase table names are hardcoded across API/hooks/components: `profiles`, `match_results`, `user_predictions`, `admin_logs`.
