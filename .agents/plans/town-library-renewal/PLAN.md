# Town and library renewal

**Status 2026-11-06.** Landed in 8d6a1e09: the Town Atlas origin, rewritten in `town/index.html#town-origin`. The town began as a table someone left out; everything in it is built from what was set out on purpose (a gift) or thrown away (a find); the characters gather because each is waiting for someone else to say their reason out loud; the small quarter keeps other hours at ankle height. Four arrivals (dawn, noon, night, Wednesday) form a native exclusive `<details name="town-arrival">` group, and each gives a reason to open another page: the library garden, the character sheet, guide cards, spellcraft, the looks in Settings, materials, RPG Wednesday, lore.land. The card sentence and the rumor line are kept from the old story. Owed: a browser look at the arrivals.

Operation: align (copy) and prime (world). Fixity: experimental.
Creator, 2026-11-06: the origin story is stale; the library needs updating; the reason for the characters needs deepening; more imaginative and interactive surface area; reasons to link to other pages; connect Spw expressions and spells; textures, and reasons to discover more theming configurations.
Owners: `town/index.html`, `play/rpg-wednesday/library/index.html`, `play/rpg-wednesday/character/`, `play/rpg-wednesday/world/`; `.spw/scenes/brainstorms/`; `.spw/caches/pantry-ingredients-2026-11.spw`.
Rules: no new `data-spw-*` families; interactive pieces are native first (details, links) and JS only as enhancement; a feel is approved in a browser before it spreads to another route.
Related: [spellcraft-authoring](../spellcraft-authoring/PLAN.md) (spells) · [settings-theme-wiring](../settings-theme-wiring/FIX.md) (looks) · [cauldron-lens-composition](../cauldron-lens-composition/PLAN.md) (expressions) · [model-collaborator-lore-surfaces](../model-collaborator-lore-surfaces/PLAN.md).

## Next slices — 2026-11-06

1. **Look at the arrivals.** Desktop and pocket, in a browser: does the exclusive group read as one choice, and does each link land where its sentence promises? Decide between the native default and a panel treatment. Sensors: `npm run audit:page-structure`, `npm run audit:copy:accessor`.
2. **The library, renewed.** `play/rpg-wednesday/library/`: the Front Desk tells the new origin in one line (the card on the table); the Garden receives the dawn arrival's question; each guide card gains a reason to exist said by another guide, which is the town's rule. Drafts wait for the creator's words. Open first: `.spw/conventions/copy-accessor.spw`.
3. **The characters' reasons.** For each guide (Grounding Rod, Cask, Avalanche Evan) and each of the cast (WAPboy, Honk Bazongas, Gravy Davis): what they carry into town, and who at the table can say why it exists. A `.spw` cache first, in the creator's words, before any route copy.
4. **Spells from found words.** The night arrival hands a scrap to spellcraft. Probe whether `#wander-spells` can take a word from the town through a link alone, with no new storage. Coordinate with spellcraft-authoring.
5. **Hours as looks.** The pantry's mood axis `hour` (dawn on paper, noon, night in a darker look) maps onto presets that already exist in `/settings/#aisle-looks` and `/design/materials/#staged-theme-sets`. Map them; do not add new ones. Coordinate with settings-theme-wiring.
6. **The small quarter on a page.** Once the creator names it (the cloud in `.spw/scenes/brainstorms/small-quarter.spw`), a district panel in `#town-districts`.

## Held for the creator

- The new origin's words: they replace a story the creator called stale, so the creator reads them first.
- The small quarter's name and district.
- Whether the town takes Post-Nut Clarity's rule (built from what humans discard or make available) or keeps its own: `wonder_small_quarter_rule`.

Validate: `audit:page-structure`, `audit:copy:accessor`, `check:local`, and `manifest:staged` at commit.
