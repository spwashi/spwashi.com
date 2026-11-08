# Folio worktable

**Status 2026-11-06.** Since 2026-10-10: the October drop has its own page, `/design/folios/october-2026/` (2c95bf13, 2026-10-31), with thirty-six folios (Honk Bazongas restored in 5482751f), five panels, forty-two cutout arrangements and thirty-one scratchpad pages, a new `pads/` kind named for the creator's word. Its record is `.spw/surfaces/folio-archive/release-2026-10-31.spw`. The weekly five moved from 2026-W40 to 2026-W44 (5884cc59), and a tall scan now lies whole on the folio plate (9571af62). Earlier: the release shelf (7a95da5b), the request card at `#folio-request`, the primes demo (8703ed24) and the calendar demo (27b616e8). Next: the slices below; every one of them is the creator's call except slice 4. October has passed with the calendar demo unreviewed, so its question has changed (`wip.spw#wonder_folio_worktable_calendar`).

**Related:** [ecosystem-offer-2026-10](../archive/ecosystem-offer-2026-10/PLAN.md) (archived) · [lore-land-marketing](../archive/lore-land-marketing/PLAN.md) (archived) · [visual-capture-ecology](../archive/visual-capture-ecology/PLAN.md). **Absorbed 2026-10-06:** [professional-skill-development-worldbuilding](../archive/professional-skill-development-worldbuilding/PLAN.md) · [skill-folio-operating-system](../archive/skill-folio-operating-system/PLAN.md).

Public goal: see the studies, try a reading, and distinguish future folio purchases from current commissioned work.

## Next slices

1. **The week's five (2026-W45).** `public/data/folio-highres.json` ends at 2026-W44. `npm run folio:highres:rotate -- --ids=… --release=<scan day> --dry-run` first (W44 drew from `folio-2026-10-20-*`), then the same command without `--dry-run`. Which five, one per thread as in W44, is the creator's call each week. Verify: the week appears in the JSON, and the Home and Now strips redraw at rest from it.
2. **The calendar's question.** `/design/experiments/folios/calendar/` is still linked only from the experiments shelf, and it lays out September's thirty-one folios as "October, one folio a day". The October page lays its month out by kind, not by day. Gate: the creator, in the wonder.
3. **The primes demo.** `/design/experiments/folios/primes/` steps the September 28 primes in scan order, unreviewed since 8703ed24. Since 1a84b975 several primes open topic pages, so the review can now ask whether the walk belongs on a route. Gate: the creator's look.
4. **A folio says where it opens (proposal, ungated to mock).** The creator wants their art to link pages and to open more pages (2026-11-05). Twelve pages now open on scans (1a84b975; midjourney-design-concepts, "The creator's own art, first and between pages"). A piece's popover on `/design/folios/` or `/design/folios/october-2026/` could carry one line naming the page it opens, such as "opens /topics/", so that the shelf becomes a door and not only a display. It is static HTML in the existing `folio-view` popover, with no script and no new attribute. Verify: each such line links a page whose first figure uses that piece's stem. The wording is the creator's at a look.
5. **The first request.** Whether a request has arrived through `#folio-request` only the creator can say. Sales stay closed until forms, prices and shipping are set ("Minting direction" below).

Glass over the work, read from lore.land's plans on 2026-11-08 ([lore-land-plans.spw](../ecosystem-architecture/lore-land-plans.spw)): a kept reading is a recipe, a link or a spell, before it is an object. Slice 4, a folio saying where it opens, is the local form of a path that has a way on. A reader's marks stay out of inventory. The week's five and the calendar question stay the creator's calls.

Kept from the first audit (2026-09-05), which the release shelf answered by moving the studies ahead of the method: no invented inventory, folio prices, checkout, biological claims or runtime state; seed studies are not scans or inventory; service prices pair amounts with deliverables.

## Later bounded slices
- First scan: retain master, publish derivative with dimensions, material, date, front/back and detail views. Confirm original versus reproduction, price, shipping and availability before purchase.
- Pricing: visible planning ladder is on `#folio-prices` ($35 / $75 / $150, Seed 3-for-$95, prints quoted). Still not live offers; shipping unset.
- Component design: kinetic study now has a rest/open radio probe (no JS).
- Metabiology: botanical study now has rest/branch/fold/stop radios; artistic, reduced-motion safe.
- Promo cycle: live JSON is asserted in `scripts/tests/engagement-features.test.mjs` (`pickDaily` on Thursday 2026-09-03). Fixture selection remains data-driven. Today’s weekday may not show the folio card.
- QA stills: not a fifth catalog component. Region ecology ids `folio-fold-probe`, `folio-growth-probe`, `folio-prices`. Named stills `folio-fold-rest` / `folio-fold-open` / `folio-growth-rest` / `folio-growth-branch` / `folio-prices`. Check `folio-fold-open-reduced`. Capture prepare now checks radios. `npm run visual:stills -- --ids folio-fold-open,folio-growth-branch,folio-prices`

## Validation
Preflight: module selector audit (13 existing orphans), visual checks, folio browser inspection.
After edit: check:local, diff whitespace, disclosure and link smoke.

## Minting direction — 2026-09-05
User is open to original sales, with a preference for a minting process supporting originals, prints and derivative collages. This supersedes the earlier format uncertainty; exact formats and prices remain provisional.
Operation: align; fixity: tending. Owner: folio route. Minting currently means documentation and release; no token platform is assumed.
Source record: stable ID, master front/back scans and detail photo, dimensions, materials, known creation/overpainting dates, motifs, verified story/process links. Preserve unknown dates as unknown.
Release record: separate ID, source ID(s), original/print/collage, handmade/printed, dimensions, substrate/finish, edition policy, proof approval, price/currency, inclusion list, delivery terms, availability. A collage may have multiple sources. A sold original does not erase the source or automatically retire print offers.
Before accepting orders, explicitly settle reproduction permissions and buyer usage terms; do not imply sale transfers all rights. Do not promise a digital download unless it is in the offer.

### Proposed prices from user-supplied Grok advice
Originals only: Seed $28–45, Chapter $65–95, Landmark $125–180, Relic $200–275 or hold. Public copy labels these as working ranges, not live offers.
Candidate first asks: $35 / $75 / $150. A 3-for-$95 bundle would apply only to selected $35 Seed originals (normally $105), not any three tiers. Not yet an offer.
Prints and collages need independent cost/format decisions; physical uniqueness and narrative tier are separate axes.
Do not adopt unverified claims about inventory count, TikTok demand, market comparables or cheap shipping. Determine packed weight, dimensions and destinations before setting shipping.
Candidate release size: small named selection, not all inventory. Confirm counts after the first scan census.
First scan census, 2026-09-25: thirty-one folios, the September 26 release set. Masters untracked under `public/images/renders/_raw/folio-scans-2026-09-26/`; AVIF/WebP derivatives and sidecars in `public/images/assets/folios/`; record `.spw/surfaces/folio-archive/release-2026-09-26.spw`, which also primes an October calendar (thirty-one days, thirty-one folios). Form, price, and availability stay unset until the creator sets them.
Third scan set, 2026-09-28: eight square scraps, one collectible by another maker (anonymized, back held), and twenty-five folio primes (cutouts rearranged on a clear sheet; the lid keyed to transparent). Record `.spw/surfaces/folio-archive/release-2026-09-28.spw` holds the cutout census and the Grok Imagine seat. Primes demo, 2026-09-28: `/design/experiments/folios/primes/` steps the primes in scan order with no script; approve or redirect it in a browser before any route shows the set.
Weekly five, 2026-09-26: `npm run folio:highres:rotate -- --ids=…` opens the next week in one move (files, sidecars, record, page links, audit); dry-run first. Which five is the creator's call each week.
Calendar demo, 2026-09-26: `/design/experiments/folios/calendar/` is the one demo month the seed asks for — October in scan order, grid from the date, print rules. Approve or redirect it in a browser (scan order vs chosen days, site page vs printable) before any route work.
Release shelf, 2026-09-25: `/design/folios/#release-set` lays the thirty-one out after the intro. Tiles open native popovers (no JS) with the display/hero scan and full alt text; a thread filter reuses the probe pill with `:has()` and a CSS counter reports what shows; `*ask_for_this_one` jumps to the order card and, with JS, fills its piece field (`seed-card.js` `fill`). Rules live in `components/folio-shelf.css`, loaded by the `folio-shelf` behavior scope so the website route bundle stays under its 140 KiB budget. Not yet seen in a browser.

Material intake is recorded in [minting.spw](minting.spw): standard printer paper, often 3M lamination sheets. Public copy omits supplier brand. Measure exact dimensions per piece rather than assume Letter versus A4; record sidedness and actual laminate during intake.
Custom work: creator welcomes custom collages and makes new art from developing lore.land RPG stories. A fresh artwork becomes a new source, rather than being mislabeled as a derivative of an older scan. Quote custom scope individually; no custom price or turnaround is established.

## Landing access — 2026-09-05
Operation: align; fixity: tending. Public goal: a reader arriving at Home, About, Services, Now, Play, RPG Wednesday, lore.land, or Design can reach the folio worktable without hunting.
Owner: those route HTML files plus `public/data/promo-wonder-cycle.json`.
Do not open sales. Do not mix working folio bands into live commission prices. Do not publish chat identities or treat community art as inventory.
Proof: Art chip, collect-a-folio links, and one promo/wonder pair that names originals, prints, collages, the lore.land pantry, and RPG Wednesday.
Landing copy is in the person-magazine / design-surface clusters. Do not let a model rewrite it for whimsy. First-fold copy should stay local to the room it sits in — see `.spw/caches/copy-hypermedia-key-2026-09.spw`.

## Request card and soil prime — 2026-09-17
Operation: align; fixity: tending. Owner: folio route plus `public/js/modules/cards/seed-card.js`.
`/design/folios/#folio-request` hosts a seed card (`data-template="folio"`, `data-templates="folio"`): piece, form, story, range, relay; copied as a Spw block; browser storage only. Sales stay closed; the card is the ask. The seed-card mount list gained the `folios` surface, and a host can now scope its templates so a request card never pivots into a new-year seed.
The creator's framing — folios as soil artists add nutrients to over years, years of TikTok lore, a Wonder About Pi(e) clown-lore series that teaches design and computer science, and where parent discernment must not sit — is cached at `.spw/caches/folio-soil-ecosystem-2026-09.spw` as a prime, not route copy. `product-lines.spw#folio_editions` names the card as proof and next action.
Next: confirm one request arrives through the card; document two series before "soil" reaches the route.
