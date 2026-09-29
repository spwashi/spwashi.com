# Projects hub
Operation: prime. Fixity: experimental. Focus: memory consequence. Element: earth.
A public /projects/ room for the work itself, not a portfolio grid of blurbs.
First three: /projects/spw-workbench/, /projects/spwashi-com/, /projects/folios/.
Each leaf: what it is, how it works, touch it live, time spent, lineage, what it taught.
The hub adds the line of public repositories that led here (2016 onward).

Owners: projects/*/index.html; surface `projects` in scripts/ts/css-manifest.mts
(empty scope: core CSS and behaviors only) with scripts/typed/css-manifest.mjs rebuilt.
Evidence and census: .spw/caches/repo-time-2026-09.spw.
Inbound links: about/website/ (one sentence in the "Make a page" paragraph),
topics/software/spw/ (one row in "How these contracts leave the atlas").

Conventions:
- Every number comes from git or a tracked record, dated 2026-09-29.
- Time spent = first commit, commits, active days; say it is a rough clock.
- Link the real surfaces (/tools/spw-parser/, /design/folios/, /about/website/)
  rather than restating them. Do not duplicate the folio shelf.
- Public GitHub repos only. No author names or emails. No degree framing.
- Mentoring stays in the cache as questions for the creator; no public copy yet.
- Copy units projects.<slug>.<slot> carry a semantic expression.
- No new data-spw-* families; page_family register (hub) and chronicle (leaves).

Open:
- Nav: should Projects join PUBLIC_NAV_ITEMS? That also means sw.js CORE_ROUTES.
- More projects: which lineage repos earn a leaf (factshift, D3v7 by weight)?
- Mentoring: does a public room exist, and in whose words?
- The folio shelf hero pill still reads "31 scanned"; the body and sidecars say 58.
- Numbers go stale; refresh on each release close or move them to a generated readout.

Validate: node scripts/check-site.mjs; npm run manifest:staged after staging;
npm run check:local -- --allow-dirty; npm run audit:copy:accessor;
npm run audit:route-links; git diff --check.
