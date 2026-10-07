# Wonder kin on core routes

Operation: align. Fixity: tending. Focus: navigability between pages that ask the same wonder questions.

## Public goal
A reader on a core route can see, with JS off, which other routes ask at least two of the same questions the page asks, and why each is worth the step.

## What "kin" means here
Two routes are kin when their body `data-spw-wonder` words share two or more entries. The seven canonical types are questions (where am I, what the rules are, what is carried, what responds, what could be asked, what points elsewhere, what differs); the common expanded words consequence and locality read as what follows and what stays local. Kin was computed from `public/data/site-search-index.json` on 2026-09-20 and hand-picked to six stops per route, favoring core routes and hubs over deep leaves.

## Surface
- Core routes (`sw.js` CORE_ROUTES): `/`, `/about/`, `/topics/`, `/play/`, `/design/folios/`, `/services/`, `/settings/`, `/blog/`, `/topics/craft/`, `/topics/software/`.
- Each closes `<main>` with `section#wonder-kin`. The body form follows page role, all from existing components: routing hubs (`/topics/`, `/services/`) get the `.spw-route-bridge` card grid; reading registers (`/about/`, `/blog/`, `/topics/craft/`, `/topics/software/`, `/design/folios/`) get the lighter `.spw-reason-strip`; control and play surfaces (`/`, `/settings/`, `/play/`) get a `.frame-operators` chip run whose chip text encodes the shared questions as bracket stems (`>craft[respond.differ]`; orient rules carry respond ask point differ follow local). The lede on chip pages teaches the stems once. Links carry the shared words on `data-spw-wonder`, a stem navigation-spells already reads on links.
- Do not put `data-spw-operator` on bridge card links: the inline-handle rule in `sigils-and-chips.css` flattens `[data-spw-operator]` links inside `li` to running text.
- `related_routes` on each core route gains the kin hrefs it lacked, so the breadcrumb spell and page metadata see them without new code.
- `/blog/` body wonder aligned to `orientation resonance projection`, which its `<main>` and every frame already asked. `/design/folios/` body and main aligned from four loose words to `memory resonance projection`.
- `breadcrumb-spell.js` `describeBreadcrumbRoute` borrows label and note from an authored bridge link before humanizing the path.
- Convention: `wonder-architecture.spw#authoring.kin`.

## Not done
- No new CSS, attribute family, or module. No kin on non-core routes.
- No automatic kin computation at build time; the lists are authored copy and should be re-read when a body wonder changes.

## Validation
`npm run manifest`, `npm run audit:copy:accessor`, `node --check` on the touched JS, module tests, `npm run check:local`, `git diff --check`, and a browser look at one closing section at desk and pocket widths.
