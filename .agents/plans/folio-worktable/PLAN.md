# Folio worktable

Public goal: see the studies, try a reading, and distinguish future folio purchases from current commissioned work.

## Audit
Operation: audit; fixity: tending.
Evidence: design/folios/index.html puts two explanatory sections before images. services/index.html#pricing lists a $250 illustration plate and $1,500 interactive cover page. Repository search found no metabiology surface.
Gap: seed studies are not scans or inventory. Folio format, dimensions, edition, price and fulfillment remain undecided.
Comparison: existing folio lenses change readings; service prices pair amounts with deliverables.

## First public slice
Operation: align; fixity: tending. Focus: invitation. Element: air (sequence and disclosure).
Owner: design/folios/index.html; reuse panels and native details.
Audience: art collectors, bridging to component designers.
Offer/proof: explore existing seed images; scans and sales are future intentions.
Resonance/extension: inspect a fold as a component and a branching form as an imagined organism.
Next action: browse studies or follow existing commission prices.
Move studies before methodology, shorten opening, add scan/sale status and existing commission comparisons.
No invented inventory, folio prices, checkout, biological claims or runtime state.

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

Material intake is recorded in [minting.spw](minting.spw): standard printer paper, often 3M lamination sheets. Public copy omits supplier brand. Measure exact dimensions per piece rather than assume Letter versus A4; record sidedness and actual laminate during intake.
Custom work: creator welcomes custom collages and makes new art from developing lore.land RPG stories. A fresh artwork becomes a new source, rather than being mislabeled as a derivative of an older scan. Quote custom scope individually; no custom price or turnaround is established.

## Landing access — 2026-09-05
Operation: align; fixity: tending. Public goal: a reader arriving at Home, About, Services, Now, Play, RPG Wednesday, lore.land, or Design can reach the folio worktable without hunting.
Owner: those route HTML files plus `public/data/promo-wonder-cycle.json`.
Do not open sales. Do not mix working folio bands into live commission prices. Do not publish chat identities or treat community art as inventory.
Proof: Art chip, collect-a-folio links, and one promo/wonder pair that names originals, prints, collages, the lore.land pantry, and RPG Wednesday.
