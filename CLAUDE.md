# Catholic Guide — notes for Claude Code

Daily Mass readings, prayers and hymns (phone first, English + Tamil) and a content portal for the editorial team.
Owner: Vinoth (vinoth@genixtec.com). README.md covers running, configuration and seed logins; this file covers
the decisions and gotchas behind the code.

## Stack and layout

- `backend/` — Java 21, Spring Boot 3.5, Spring Security, Spring Data JPA (Hibernate), Flyway, PostgreSQL 16. Package `org.catholicguide`, one package per feature (`auth`, `users`, `calendar`, `readings`, `prayers`, `songs`, `categories`, `settings`, `activity`, `publicapi`, `portal`).
- `frontend/` — React 18 + TypeScript + Vite + react-router 6. Plain CSS (no Tailwind/CSS-in-JS), no state library. `src/site/` is the public site, `src/portal/` the portal, `src/lib/` shared helpers.
- `scripts/gen_calendar.py` — generates the liturgical-calendar SQL that is in `V2__reference_data.sql`.
- Commands: `cd backend && mvn test` (needs a `catholic_guide_test` Postgres DB; tests wipe it), `cd frontend && npm test && npm run build`, `docker compose up --build` for everything on :8081.

## Design source

The UI implements the Claude Design canvas "Catholic Guide — website" (https://claude.ai/code/artifact/5faef156-ee5d-4025-8a6c-379866041ca8, private to the owner unless shared).
Its design-system tokens are copied into `frontend/src/styles/tokens.css` (light + dark). Board → route:
Phone/Desktop Today → `/`, Readings → `/readings/:date`, Prayers → `/prayers/:slug`, Songs → `/songs/:slug`,
phone reader → `site/Reader.tsx`, Portal sign-in → `/portal/sign-in`, Dashboard → `/portal`, Readings calendar →
`/portal/readings`, Reading editor → `/portal/readings/:date?lang=ta`, Prayer/Song editor → `/portal/prayers/:id`,
`/portal/songs/:id`, Users/Activity/Settings → `/portal/users|activity|settings`.
Deliberately not built: audio player, chord charts, sheet music (dropped from the final design).

## Core rules (keep these true)

- **Draft vs live.** Readings (`reading_sets` + `reading_parts`), prayer translations and songs each have an editable working copy plus a published snapshot (`published` JSONB, or `published_title/body` for prayers). Public endpoints read only the snapshot. *Save draft* never changes the public site; *Publish* copies working → snapshot; *Unpublish* clears it. `has_changes` = live but edited → status `CHANGES` ("Unpublished changes"). Status is computed in `common/ContentStatus`.
- **Languages.** Readings and prayers have one translation per enabled language. Songs are never translated: one song = one language. Languages flagged `songs_only` (Latin) get no reading/prayer tab. Public site falls back to English when the visitor's language isn't published, and says so.
- **Song rights.** `NEEDS_CHECKING` can't be published; `LICENSED` needs a licence number (`SongService.publish`).
- **Placeholders never go live.** Bracketed seed text (`[தமிழ் வாசகம் — …]`, `[Composer]`) is draft-only by design. Don't publish invented scripture, prayer or hymn text; real text must come from a licensed source.
- **Roles.** EDITOR: all content. ADMIN: also users, activity, settings (enforced in `SecurityConfig` and on the frontend with `RequireAuth admin`). Users can't change their own role/status; the portal must keep ≥1 active admin (`UserService.update`).

## Auth

Passwordless. `POST /api/auth/code` emails a 6-digit code (always 202, so it never reveals who has access); `POST /api/auth/verify` sets the session cookie.
Codes and session tokens are stored only as SHA-256 hashes. 5 attempts per code, 30 s resend cooldown, expiry and session length come from the `settings` table (admin-editable).
Cookie `cg_session` is HttpOnly, `SameSite=Strict`, `Path=/api`; CSRF protection is disabled *because* of SameSite=Strict.
Consequence: **the site and API must share one origin** (Vite dev proxy, nginx in Docker, or a rewrite rule on any host). Hosting the API on a different domain will break portal sign-in.
`MAIL_ENABLED=false` (default) writes codes to the backend log instead of emailing.

## Backend gotchas

- `spring.jpa.open-in-view=false`. Anything that maps entities to DTOs must run inside a transaction: portal controllers are `@Transactional` per method, or use `portal/ReadingEditorAssembler`. Don't call a `@Transactional` method on `this` (self-invocation skips the proxy); that's why the assembler exists.
- `Clock` bean (`config/ClockConfig`) uses `APP_TIMEZONE` (default Asia/Kolkata) and decides "today". Use it; never call `LocalDate.now()` without it.
- Every content change calls `ActivityService.record(verb, item)`; the reading editor's "Version history" link filters the activity log by the item label.
- Flyway: V1 schema, V2 languages/settings/categories/calendar, V3 seed content. **Never edit an applied migration**; add `V4__…`. Hibernate runs with `ddl-auto=validate`.
- Reading body format: verse numbers in brackets (`[7] But to every one…`), blank line = new paragraph. Parsed in `readings/ReadingText.java` (backend, one-line summaries) and `frontend/src/lib/readingText.ts` (rendering).

## Liturgical calendar

`liturgical_days` (colour, cycle) + `liturgical_day_names` (per-language name, season label, saint, short label, "coming up" note) only covers **1 Oct – 31 Dec 2026**. Pages for later dates 404 until more days are added.
To extend: adapt `scripts/gen_calendar.py` (it hard-codes the 2026 Advent/Christmas dates and a feast list) and add the output as a new migration. Tamil day names are generated only for Ordinary Time, following the pattern in the design.
The reading editor creates a missing day on save, but with no names.

## Frontend conventions

- Colours, fonts and spacing come from CSS variables in `styles/tokens.css`; the day's liturgical colour is applied by wrapping a page in `season-<COLOUR>` (sets `--accent`, `--accent-tint`). Don't hard-code hex values in components.
- Phone layout below 760px (`useIsPhone()` in `lib/prefs.tsx`) renders different components (tab bar, full-screen `Reader`), not just CSS. The portal collapses its sidebar below 900px.
- Data fetching: `useApi(url)` in `lib/useApi.ts`; mutations via `api.post/put/del` in `lib/api.ts`. Visitor preferences (language, theme, text size, bookmarks, reader hint) live in localStorage via `PrefsProvider`.
- `Reader` pushes a history entry so the phone Back button closes it; pass it a stable `onClose` (it keeps it in a ref).
- Interface strings: `lib/i18n.ts` (English + partial Tamil, falling back to English). **Tamil strings and generated Tamil day names have not been reviewed by a Tamil speaker yet.**
- Accessibility is part of the design: real buttons and links, labels on every input, 44px touch targets, status shown by shape (filled / ring / dashed) and not by colour alone.

## Choices made without the owner (revisit if they disagree)

- Weekday devotions on Today (`PublicSiteService.DEVOTIONS`): Mon Eternal Rest, Tue St Michael, Wed/Thu Morning Offering, Fri Act of Contrition, Sat Memorare, Sun Our Father. Rosary mysteries by weekday are in `lib/i18n.ts`.
- "Coming up" lists days with `liturgical_days.highlight = true` (solemnities, All Souls, Advent 1). "Hymn for today" uses `hymn_song_id`, otherwise a published English hymn picked by day of year.
- The Prayers "month of the Holy Souls" notice shows from 15 October to the end of November.
- The design's "Lumen remembers your choice" was reworded (Lumen looked like a leftover name).
- The seed marks "Eternal Rest" and "O Come, O Come, Emmanuel" as live with unpublished edits, so the dashboard has examples of that state.

## State of testing

- Passing: backend `mvn test` (8 tests, including sign-in → publish Tamil → public site and the song-rights rule) and frontend `npm test` / `npm run build`.
- Compared by screenshot against the design: desktop Today, phone Today + reader + Songs, portal dashboard, Tamil reading editor. Other screens, dark mode and the portal on phone were built but not visually reviewed.
- Demo data: seeded readings exist only for 24 Oct 2026 (English live, Tamil draft) and 25 Oct (English draft). Use `/?date=2026-10-24` to see a full Today page.

## Known rough edges

- Phone Today always says "Today's Gospel", even when viewing another date (desktop handles it).
- Portal times use the browser's time zone, not `APP_TIMEZONE`.
- Readings search matches citation and text in the published JSON; no ranking.
- The repo's first commit came from GitHub's Java `.gitignore` template, which ignores `*.jar` (fine today: no jars are committed).

## Open items

- Not deployed anywhere yet. Plan discussed with the owner: Neon (Postgres) + Render (backend Docker + static frontend with an `/api/*` rewrite to keep one origin). Nothing for it is in the repo yet.
- Real email for sign-in codes and invites needs SMTP settings (`MAIL_ENABLED=true`, `SMTP_*`, `MAIL_FROM`), and `APP_COOKIE_SECURE=true` behind HTTPS.
- No rate limiting on `/api/auth/code` beyond the per-user cooldown; add IP limiting before going public.
- Real Tamil readings, prayers and hymns need licensed sources; the "Ask for prayer" box shows only when `VITE_PRAYER_REQUEST_EMAIL` is set.
- No CI pipeline.
