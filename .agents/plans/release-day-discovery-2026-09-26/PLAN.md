# Release-day discovery — September 26, 2026

## Public goal

Turn the release into an invitation to explore Spwashi's art, learn the site's
interactions, and understand the shared practice behind software, learning, and play.

## One patch

- Operation: `align`; fixity: `tending`; focus: visitor discovery.
- Writer + designer; commons; resonance; quiet intensity; element: water (route flow).
- Output: a coherent release and interaction-learning path through existing pages.
- Audience: curious readers, artists, learners, builders, and potential collaborators.
- Offer: explore scanned art, try an interaction, understand a design choice.
- Proof: 31-folio shelf, living terms, existing design specimens, September 26 record.
- Resonance: a drawing, a rule, and a shared practice can teach each other.
- Extension: carry a question, a prompt, a study, or a concrete commission brief away.
- Next action: open a folio, follow the interaction guide, or compare a design specimen.

## Surfaces and boundaries

- `index.html`: creator-first opener, release note, learning paths, ethos, static promo.
- `now/index.html`: current release, concrete receipts, next questions; keep dated history.
- `design/index.html`, `design/ornaments/index.html`, `design/composition/index.html`:
  invitations grounded in the controls and specimens those routes already contain.
- `public/data/promo-wonder-cycle.json`, `public/ts/promo-wonder-cycle.ts`:
  matching authored feed/fallback copy; rebuild generated runtime and route indexes.
- Preserve identity, route anchors, existing controls, commercial terms, and metadata
  unrelated to the copy. No CSS, new runtime behavior, dependencies, or semantic family.
- The October folio calendar stays an unlinked demo; no promised completion date.

## Validation

- Before: copy/accessor census, module selectors, Home pocket opening.
- After: copy/accessor, manifest, local contracts/tests, changed-link and HTML review.
- Pocket stills: Home and Now; browser review of the design invitation.
- `git diff --check`; keep September 13 validation explicitly historical.

## Evidence

- Initial tree clean at `d989bf65`; 31-folio shelf is present and interactive.
- Home promo still announced September 19 and ten days until September 26.
- Now's opening still said September 22 while its notebook reached September 25.
- `spw:plan:status` reports no active workbench feature plan for this branch;
  this site-local note owns the patch.
- Initial visual command could not bind localhost in the sandbox; rerun with
  local-preview permission.

## Handoff — Claude, same day

Codex ran out of credits after the edits and before verification.

- Kept: the release facts. Stale dates (Home promo, Now opener), the promo feed and
  its TS and static fallbacks in sync, September 13 receipts kept as history.
- Not kept: the voice. Sigil chips flattened to plain English, the first-person
  notes on Now replaced, "explore" +32/−2, audience role hooks rewritten, meta and
  headings outside the release. Design pages had nothing stale; they stay at HEAD.
- Landed instead: routes reset to HEAD, then the release facts in the page's own
  voice and the September 13 close's pattern (kicker, h1, lede, receipts, gate,
  status). The promo keeps the release set; the cycle and daily questions return
  to the authored ones.
- GPT-6's authored diff is `gpt-6-pass.patch` in this folder, untracked, for lines
  worth lifting by hand.
- Found on the way, landed as their own patches: the folio shelf's flip nested
  views and hid its controls below the view's fold; thread pills ignored a mouse
  (brace capture on labels); the dev server exhausted file watchers on
  `.references/`. Discharge travel for the shelf: interaction-microstates.spw.
