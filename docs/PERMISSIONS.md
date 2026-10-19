# Authorization and permission matrix

## Authority model

- **Manager:** the sole unrestricted administrative role. Only the manager can approve/reject coordinator requests, assign/revoke permissions, suspend coordinator access, control global settings, and perform manager-only actions.
- **Coordinator:** receives no access by default. The manager must approve a request, provision an authenticated account, and assign each permission. Access must be denied on both route handlers and protected database records when the permission is missing.
- A coordinator cannot change their role, grant or revoke anyone's access, approve their own application, or become a manager.

The local preview is **not an authentication implementation**. It only simulates a manager for local testing and is intentionally not safe for real data or public exposure.

## Permission identifiers

| Area | Permissions | Intended scope |
|---|---|---|
| Dashboard | `dashboard.view` | View the overview |
| Members | `members.view`, `members.create`, `members.update`, `members.archive` | Team records only; member publication requires approved consent |
| Initiatives | `initiatives.view`, `initiatives.create`, `initiatives.update`, `initiatives.publish`, `initiatives.archive` | Initiative records; publication and archival are separate capabilities |
| Partners | `partners.view`, `partners.create`, `partners.update`, `partners.archive` | Partner records; publish only verified, approved relationship details |
| Inquiries | `inquiries.view`, `inquiries.respond`, `inquiries.archive` | Private contact requests; never exposed through public content APIs |
| Content | `content.view`, `content.update` | Public site copy and managed content |
| Media | `media.manage` | Approved assets after private storage and validation are configured |
| Exports | `exports.create` | Explicitly scoped and audited exports |
| Audit | `audit.view` | Read-only access to sensitive-action events |
| Global settings | Manager only | Publication state, account/access administration, and global configuration |
| Join requests | Manager only | Read private applications and record approve/reject decisions; an application decision does not provision an account or grant permissions |

## Enforcement locations

- `src/lib/authorization.mjs`: deny-by-default permission checks, covered by `npm.cmd test`.
- Join-request review is explicitly manager-only; public visitors may submit an application but there is no public list/read endpoint for applications.
- `src/app/api/admin/route.ts`: server-side checks for the local manager preview; every mutation is guarded and validated.
- `supabase/migrations/20261019000000_initial_schema.sql`: planned RLS helpers and policies. Review and exercise these against a disposable Supabase project before any production use. This migration has not been applied.

## Production acceptance gates

Before launch, replace the preview cookie with verified Supabase Auth sessions, provision exactly one manager through a reviewed out-of-band process, implement permission administration, verify RLS with authenticated/unauthenticated test identities, and test direct API access for every role/permission combination. Do not regard hidden navigation or client-side controls as authorization.
