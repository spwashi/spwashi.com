# topic-building-blocks

## Public Goal
Topics read as a course, not only a shelf. Each area has building blocks in order, each leaf points to a next page, and portals from the fields of the creator's peers, mentors, and family route into the topics where those fields' questions already live.

## Voice
First person, the creator as a creative director with sixteen years in engineering who consults on software and works in A&R. Adult education is the stated focus (`/topics/andragogy/`); pedagogy stays the broader learning-science route. Never name private people; name roles (a close friend, my sibling, family reviewers).

## Landed 2026-09-22
- Software stubs: programs, data-structures (building blocks); protocols, databases, testing, version-control, performance, security, editor-tooling, language-models, visualization (working practice). Hub: `#building-blocks` (ordered) and `#working-practice`.
- Math stubs: logic, linear-algebra, probability, optimization, forecasting. Hub: `#building-blocks`, logic → forecasting.
- `/topics/andragogy/` hub and `/topics/andragogy/develop-your-sound/` field guide (A&R frame; for engineers, researchers, data storytellers; no degree framing).
- `/topics/fields/` hub with eight portals: industrial-engineering, human-development, educational-psychology, electrical-engineering, geology, counseling, teaching, development (human, software, spiritual).
- `/topics/biochemistry/`: five abstract patterns (energy currency, redox, enzymes, networks, light harvesting).
- Portals rewritten in the hub's principles form (a 13:48 edit, not this session's, retitled the hub "Principles From Neighboring Curricula" and rewrote electrical-engineering; the other seven followed it). Each principle is a living term (`data-spw-concept`) and each card carries a `data-spw-semantic-expression`: 76 expressions joined the harvest (768 → 844).
- Every portal, the andragogy and biochemistry hubs, and linear-algebra and logic carry a "Parallel and Competing Theories" frame: theories that arose elsewhere, in parallel or in competition, and extended the field.
- Regional lenses on the fields hub: China and India with U.S. technical and academic infrastructure; Africa, Europe, and Australia on social infrastructure; Central and South America on cultural infrastructure.
- Route bridges on browser, compression, distributed, renderers, schedulers, film/release-rhythm, knowledge-bases/markdown; geometry listed on the software hub.
- `scripts/tests/topic-wiring.test.mjs`: every topic leaf is listed by its nearest hub and links a neighboring topic.

## Stub shape
Hero (what it is, why it matters here, 2 chips + hub chip) → Essentials (2–4 reference cards to stable, authoritative sources) → `spw-route-bridge` (3–5 neighbors, each with a one-line reason). Write each body by hand; the skeleton is the template contract, the content is not.

## Remaining
- PNSB knowledge base: the creator wants one eventually, grounded in abstract biochemistry first. Reading PNSB as purple non-sulfur bacteria is unconfirmed — confirm before any public page names it. Leaves grow under `/topics/biochemistry/`.
- Pedagogy and andragogy are two of the site's several kinds of play, in the creator's framing: self-directed play that wonders outward, and an introspective practice of play toward wisdom and a recursive relationship with society and environment. Both routes keep their names; each hub states the pairing.
- More portals as more peers and mentors name their fields.
- Parallel theories for the remaining building-block stubs (programs, data structures, probability, optimization, forecasting, and the working-practice pages) — cite only what a stable source attributes; no filler.
- Living-term convention: wrap a principle where the page first defines it; slug = `data-spw-concept`, title = one-line gloss. Expression shape for cards: `principle|theory|model|channel|pattern[slug]{parts}<scope>`.
- Stubs deepen one at a time into textbook-like pages (see `pure-math-routes`), keeping the stub shape's final bridge.

## Validation
`node --test scripts/tests/topic-wiring.test.mjs` · `npm run manifest` · `node --import ./scripts/lib/register-public-imports.mjs scripts/check-site.mjs` · `npm run audit:copy:accessor` · `git diff --check`

## Non-Goals
- No new components or `data-spw-*` families; stubs reuse `ref-card`, `spw-route-bridge`, `frame-operators`.
- No generated filler: a stub with nothing specific to say waits.
