# ERTH | إرث

Arabic-first, bilingual public website and local admin preview for an independent student-led organization.

## Run locally

Requirements: Node.js 20.9+ and npm.

```powershell
npm.cmd install
npm.cmd run dev -- --port 3010
```

Open http://localhost:3010. Using an explicit port avoids accidentally viewing a different application already running on port 3000. The local site needs no account, production credential, or external database. To verify a production build and its HTTP behavior:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd start -- --port 3010
npm.cmd run test:http
```

`test:http` expects the production server at `http://127.0.0.1:3010`; set `ERTH_BASE_URL` if you choose another port.

With the production server running, verify HTTP routes, UTF-8 rendering, navigation, private join submissions, and admin restrictions using `npm.cmd run test:http`. The default test URL is `http://127.0.0.1:3010`; override it with `ERTH_BASE_URL` if needed.

The UI uses Arabic by default. Use the language control in the header to switch between Arabic/RTL and English/LTR.

## Routes

- `/` — Home
- `/about` — About ERTH
- `/tracks`, `/tracks/academic`, `/tracks/community` — Organization tracks
- `/projects` — Published projects, with an honest empty state until approved projects exist
- `/join` — Validated expression-of-interest form; submissions are private and pending review
- `/team` — Approved public team profiles (empty until real approved records exist)
- `/contact` — Validated contact and partnership form
- `/privacy` — Development privacy and data notice
- `/admin` — Local development administration preview

Unknown routes render a not-found page.

## Local admin preview: important limitation

The admin screen has a deliberately visible local-preview warning. Its one-click preview cookie is **not authentication** and is trivial to reproduce; it is not safe for real or confidential information and must not be exposed to the public internet. The JSON store under `.local-data/` is development-only, unencrypted, and has no production backup or retention guarantees. The contact endpoint has basic in-process rate limiting, which resets when the process restarts and is not suitable as production anti-abuse protection.

Working local actions in development mode: review/search inquiries and update status; receive and review private join applications; create initiatives, team profiles, and partner entries; publish/archive those records; approve a team profile for public display; change site status; inspect the audit trail; and export inquiry metadata to CSV. The export omits message bodies and neutralizes spreadsheet formula prefixes. Join application review changes application status only; it never provisions an account or grants permissions. The preview-login route and all demo manager access are disabled in production builds. Durable join-request storage, account provisioning, permission assignment, and media upload require approved production integrations.

To remove local development records, stop the server and delete the specific `.local-data` folder.

## Architecture and data safety

- Public content is static, with no fabricated activities, partners, team members, testimonials, or metrics.
- Contact submission is validated by the server, checks consent, includes a honeypot, and stores only the fields needed to reply.
- Join applications are validated server-side, rate-limited in-process, consent-gated, and stored privately in the development JSON store. No public route returns application records.
- Navigation includes home, about, tracks, projects, join, team, and contact in both wide and mobile layouts.
- Source and documentation files use UTF-8; generated HTML declares UTF-8 and Next.js serves `text/html; charset=utf-8`.
- Private inquiry APIs require the local preview cookie; the separate public-content endpoint returns only published initiatives/partners and explicitly approved team profiles. Public pages never load or render admin records.
- Authorization helpers deny by default and coordinator permissions are explicit. The local preview grants manager-demo access only and is not a substitute for real identity/authentication.
- `.local-data/`, environment files, dependencies, and build output are ignored by Git.
- IBM Plex fonts currently load from Google Fonts; this makes a browser request to Google. Self-host the approved font files before launch if third-party font requests are not acceptable for the privacy policy.
- `.env.example` contains placeholders only. No Supabase credentials are required or supplied.

## Database preparation

`supabase/migrations/20261019000000_initial_schema.sql` defines the planned PostgreSQL schema, constraints, indexes, permission helpers, and RLS policies. It has **not** been applied to any project. Review and test it in a non-production Supabase project before use. Provision exactly one manager through a separate, reviewed, authenticated bootstrap process; no manager account is seeded here.

See [docs/PERMISSIONS.md](./docs/PERMISSIONS.md) for the role/permission matrix and [docs/OPERATIONS.md](./docs/OPERATIONS.md) for privacy, retention, backup, and recovery guidance.

Before enabling production authentication, replace the local preview mechanism with Supabase Auth, verified server-side sessions, strict server-side permission checks, and tested RLS. Do not expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.

## Privacy, retention, backups, and external integrations

This repository contains a development privacy notice, not a legal compliance claim. Before launch:

1. Have the privacy notice and retention period reviewed for applicable law; set deletion and archival schedules for inquiries, join requests, exports, and audit records.
2. Approve and configure Supabase Auth, PostgreSQL, private media storage, server-side secrets, email delivery, and anti-abuse service if needed. No external integration is currently active.
3. Choose backup encryption, access, frequency, retention, and recovery-point objectives; test restoration before storing real records.
4. Configure durable distributed rate limiting and server-validated Turnstile (or equivalent) if adopted.
5. Validate status handling and maintenance notices, operational monitoring, export expiry, audit review, and authorization tests before launch.
6. Review accessibility, translations, metadata/domain, approved imagery, content, legal notices, and deployment settings.

There is no deployment configuration or Supabase, authentication, email, storage, or anti-spam service connection performed by this project. The public CSS does request IBM Plex fonts from Google's font CDN.
