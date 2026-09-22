# Quest workbench and feedback entry

Operation: align. Fixity: experimental presentation; stable consumer/workbench ownership.
Named patch: source-backed initialization and reference-first feedback entry.

## Goal and evidence

Quest should let a repository-local agent initialize `.spw/_workbench` from a short
request. Read the mounted quick-start, ownership document, and initializer at
`3eaab637767222ffe248449da7262a251c4c608b`; the previous prompt never mounted it.
The existing feedback form had no storage and returned 501. Its site list imposed
the host cluster on the visitor. The user prefers signed-in identity and permissions,
allows HTTP routing for identity clustering, and favors low-friction surfaces first.

## This patch

- `workers/feedback-quest/src/quest.js`: one pinned recipe for browser and agents.
- `src/index.js`: quest routes bypass climate; feedback references use hostnames,
  preserve context links, and expose no catalog. Draft-only state is explicit.
- Worker route tests, cluster check, and deployment notes.
- No new dependencies, provisioning, identity claims, or public ingestion.

## Deployment direction

Keep the existing Worker deployment address for this source update. Quest is an
independent request branch now and can become a separate Worker with static assets
when the guide grows. Do not couple its availability to feedback probes or storage.
Keep climate's existing machine endpoints compatible while feedback evolves.

Next feedback slice: accept low-friction references/invitations; provision a private
R2 bucket for payloads and D1 for site registrations, verified subjects, memberships,
and receipts. Route context is an unverified grouping signal, never a read grant.
Choose/configure the identity provider before enabling inbox reads. Verify tokens
server-side and check membership for every site-specific action. A shared provider
session may personalize entry; unsigned headers, referrers, and URL labels may not.
Public intake, if enabled, needs bounded payloads, rate limits, and retention rules.
Do not enumerate tenants. Keep processing behind a service binding or queue.
These are proposed seams, not provisioned services or an implemented auth system.

## Verification

Run route tests through `npm run check:workers`, syntax checks, copy accessor census,
and `npm run check:local`. Exercise the pinned initializer in a temporary consumer
using existing dependencies, then doctor. Live Claude URL discovery requires the
updated Worker to be deployed and the agent to have tool permissions.

Verified: four route tests; init + doctor in a temporary Git consumer with a linked
existing workbench/dependency tree; repeat init preserved the index. Wrangler 4.135.0
dry-run bundled successfully (no bindings). Fresh dependency installation and live
Claude discovery were not exercised. Deployment awaits Wrangler authentication.
