# Data operations, privacy, and recovery

## Local development data

Contact inquiries and dashboard records are stored as JSON under `.local-data/store.json`. This is unencrypted, local-only development storage with no retention schedule, access controls, or backup guarantees. Do not enter real or confidential information. To reset test data, stop the application and remove the `.local-data` directory.

The local preview's CSV export contains inquiry metadata (not message bodies). Handle exported files as private, store them only in an approved location, and delete them after testing. The demo does not provide export-file retention or secure deletion.

## Production data lifecycle (must be approved before launch)

Before real inquiries or member data are accepted:

1. Approve a privacy notice and purpose-specific retention periods with the organization and qualified legal review. The current website notice is a development disclosure, not a compliance representation. Join applications contain a name, email, area of interest, motivation, consent, status, and timestamp; define their deletion/archival period before accepting real applications.
2. Define deletion/archival schedules for inquiries, join requests, profiles, exports, and audit records. Keep only the information needed for the documented purpose; avoid logging message bodies, credentials, or tokens.
3. Configure private database/storage access, transport encryption, managed secret storage, MFA for the manager, monitoring, and incident response.
4. Select backup frequency, encryption, access owners, geographic/retention requirements, and recovery-point/recovery-time objectives with the chosen provider. These are intentionally unset rather than guessed.

## Supabase backup and recovery runbook (after approval)

1. Confirm the target project and environment with the manager; never restore over production as an experiment.
2. Take and verify a pre-change backup using the approved Supabase plan/tooling. Preserve backup metadata and access logs in the approved restricted location.
3. Restore first to an isolated, non-production project. Apply reviewed migrations, verify row counts and RLS behavior using least-privileged test users, and inspect the application with synthetic records only.
4. Obtain explicit manager approval for production recovery. Schedule the recovery, record the incident/change reference, and use the provider's documented restore process.
5. Verify public pages contain only approved content, confirm admin authorization and audit functionality, check inquiry intake, and obtain manager sign-off. Retain or dispose of temporary backups according to the approved retention policy.

No backup, recovery, Supabase project, or external service has been configured or operated by this local build.

## External integrations awaiting approval

- Supabase Auth, PostgreSQL, and private media storage; no project credentials are present.
- A production email/notification provider, if desired.
- A distributed rate limiter and server-verified anti-spam provider (such as Turnstile), if selected.
- Managed backup, monitoring, and secret-storage providers.
- Google Fonts CDN for IBM Plex fonts is currently requested by the browser; self-host approved font assets if a third-party font request is not accepted by the privacy review.

Do not deploy this local preview. The current preview cookie, JSON data store, in-memory rate limiter, and development-only security posture must be replaced first.
