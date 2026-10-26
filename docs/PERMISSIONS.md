# Authorization and permission matrix

## Authority model

- **Manager:** the sole role allowed to access the dashboard summary, private inquiries and applications, settings, audit data, and exports, and the only role allowed to manage or publish content. Only the manager can assign/revoke permissions and suspend coordinator access.
- **Coordinator:** receives no access by default. If explicitly granted a content-view permission, the API returns published/approved records only; private records and drafts remain manager-only. Assignments are limited to known permissions that are not manager-only. The authorization helper rejects unknown permissions for every role.
- A coordinator cannot change their role, grant or revoke anyone's access, approve their own application, or become a manager.
- Administrative account creation is intended to be invitation-only. This is not implemented yet: the current project has no production authentication or account provisioning flow.
- MFA is a production requirement for managers; coordinator MFA is recommended. Neither is implemented in the current local preview.

The local preview is **not an authentication implementation**. It only simulates a manager for local testing and is intentionally not safe for real data or public exposure.

## Permission identifiers

| Area | Permissions | Intended scope |
|---|---|---|
| Dashboard | `dashboard.view` | Manager only; the overview returns aggregate counts only |
| Members | `members.view`, `members.create`, `members.update`, `members.archive`, `members.publish` | Assigned coordinators may view approved, non-archived members only; management and publication are manager-only |
| Initiatives | `initiatives.view`, `initiatives.create`, `initiatives.update`, `initiatives.publish`, `initiatives.archive` | Assigned coordinators may view published initiatives only; management and publication are manager-only |
| Partners | `partners.view`, `partners.create`, `partners.update`, `partners.archive`, `partners.publish` | Assigned coordinators may view published partners only; management and publication are manager-only |
| Inquiries | `inquiries.view`, `inquiries.respond`, `inquiries.archive` | Manager only; private contact requests are not exposed through public content APIs |
| Content | `content.view`, `content.update` | Manager only |
| Media | `media.manage` | Manager only; private storage and file validation are not configured |
| Exports | `exports.create` | Manager only; export should be scoped and audited |
| Audit | `audit.view` | Manager only; production append-only storage is not implemented |
| Global settings | `site.settings` | Manager only |
| Join requests | `join_requests.review` | Manager only for reading/reviewing private applications; public visitors may submit only |

## Enforcement locations

- `src/lib/authorization.mjs`: deny-by-default permission checks, covered by `npm.cmd test`.
- `src/lib/admin-api.mjs`: fixed section/action allowlists and field projections. Every section read and action is authorized before local storage access.
- `src/app/api/admin/route.ts`: `GET /api/admin?section=<allowlisted-section>` returns only that section (`overview` is the default and contains aggregate counts only). `POST`/`PATCH` mutations return `{ "ok": true }`, not the store. Sensitive actions are checked server-side; the preview cookie is not authentication.
- `src/components/admin-dashboard.tsx`: fetches overview and section data separately, validates response shapes, and clears section state when changing sections or ending the preview.
- Public join-request submission is separate from administrative review; there is no public list/read endpoint for applications.
- `supabase/migrations/20261019000000_initial_schema.sql`: planned RLS helpers and policies. It has not been applied or verified against a live database. Its policies and SQL grants still require review and alignment with this matrix.
- `permissions` and `managerOnlyPermissions` are application-level policy lists, not a substitute for production authentication, RLS, or SQL privileges.

## Production acceptance gates

Before enabling administration, replace the preview cookie with verified Supabase Auth sessions, provision accounts by invitation only, require MFA for managers, implement permission administration, align a new migration with this matrix, verify SQL grants and RLS with authenticated/unauthenticated test identities, and test direct API access for every role/action combination. Do not regard hidden navigation or client-side controls as authorization.
