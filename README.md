# Catholic Guide

Daily Mass readings, prayers and hymns — phone first, in English and Tamil — plus a content portal where the editorial team writes, translates and publishes them.

- **frontend/** — React 18 + TypeScript + Vite. The public site (Today, Readings, Prayers, Songs, full-screen phone reader) and the portal under `/portal`.
- **backend/** — Java 21, Spring Boot 3.5, Spring Security, JPA, Flyway.
- **Database** — PostgreSQL 16.

## Run it

### With Docker

```sh
docker compose up --build
```

Open http://localhost:8081 for the site and http://localhost:8081/portal for the portal.

### For development

```sh
# 1. Postgres
createuser catholic_guide -P            # password: catholic_guide
createdb catholic_guide -O catholic_guide

# 2. API on :8080 (Flyway creates the schema and starter content)
cd backend && mvn spring-boot:run

# 3. Site on :5173 (proxies /api to :8080)
cd frontend && npm install && npm run dev
```

### Signing in to the portal

There are no passwords: enter your email and the API emails a 6-digit code. With `MAIL_ENABLED=false` (the default) the code is written to the backend log instead:

```
Mail disabled — would send to vinoth@genixtec.com: Your Catholic Guide sign-in code
Your sign-in code is 190417.
```

The seed data includes an admin (`vinoth@genixtec.com`) and an editor (`arul.raj@example.org`). To email real codes set `MAIL_ENABLED=true`, `MAIL_FROM` and `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`.

## Configuration

| Variable | Default | |
|---|---|---|
| `DATABASE_URL` / `DATABASE_USERNAME` / `DATABASE_PASSWORD` | local `catholic_guide` | |
| `APP_TIMEZONE` | `Asia/Kolkata` | Decides which day is "today" |
| `APP_SITE_URL` | `http://localhost:5173` | Used in invite emails |
| `APP_COOKIE_SECURE` | `false` | Set `true` behind HTTPS |
| `MAIL_ENABLED` | `false` | |
| `VITE_PRAYER_REQUEST_EMAIL` (frontend build) | unset | Shows "Ask for prayer" on Prayers when set |

## How content works

- **Draft vs live.** Every reading set, prayer translation and song has a working copy and a published snapshot. *Save draft* only changes the working copy; *Publish* copies it to the snapshot the public site reads; *Unpublish* removes the snapshot. A live item with saved edits shows as "Unpublished changes".
- **Languages.** Readings and prayers have one translation per turned-on language (Settings → Languages). Songs aren't translated; each song is in one language. Latin is "songs only". Visitors reading in a language that isn't published yet see English, with a note.
- **Rights.** Songs marked *Needs checking* can't be published; *Licensed* songs need a licence number.
- **Roles.** Editors manage and publish content. Admins can also invite users, change roles, deactivate accounts, see the activity log and change settings. The portal always keeps one active admin.
- **Calendar.** `V2__reference_data.sql` holds the liturgical calendar for October–December 2026 (Ordinary Time, Advent, Christmas; Year A/B). Add later years as new Flyway migrations; the reading editor also creates a day if one is missing.
- **Reading text format.** Verse numbers in square brackets (`[7] But to every one…`), a blank line between paragraphs.

## Tests

```sh
cd backend && mvn test        # needs a catholic_guide_test database (reset by each test)
cd frontend && npm test
```

## Placeholders to replace before launch

Bracketed text in the seed data (`[தமிழ் வாசகம் — …]`, `[Composer]`, `[Full litany text]`) marks content that must come from a licensed source; none of it is published. Tamil interface strings are in `frontend/src/lib/i18n.ts` — have a Tamil-speaking editor review them.
