# Plan: rpg-boonwap-fabric

Extend the public RPG Wednesday fabric so BoonWAP, Slibbon Bap, Mr. BaneWAP, WAPboy, Honk Bazongas, Gravy Davis, and the surrounding boon/bane/bone/bonk/honk combinatorics read as a coherent research genre rather than scattered private lore.

## Public Goal

RPG Wednesday and its neighboring public surfaces should make the combinatoric fabric legible enough that players, collaborators, designers, and read-aloud agents can all follow the same canon pressure. The public copy should make six things legible:

- Mr. BoonWAP already exists in the campaign logic and should be treated as a touchy reality question rather than a joke about whether he is "real"
- the relational development is closer to flirtation, offers, refusals, and repairs over time than explicit moral lecture
- boon, bane, bone, bonk, and honk behave like operational transforms that can recombine into names, moods, and capture-card logic
- WAP means Wonder About Pi(e), and WAPboy / Gravy Davis / Honk Bazongas should read like a usable serial-lore triangle instead of throwaway jokes
- capture cards should stay screenshottable, read-aloud friendly, and handoff-ready for SVG, JSON, and later video or wizard surfaces
- designers arriving through RPG Wednesday should have a clear onboarding path into components and a clear DM route through contact

## Scope

- **In scope**: copy changes on the main RPG Wednesday route, cast register, session-writing guidance, design-components onboarding, contact CTA, lore/topic adjacency, and boonhonk framing so the canon can accumulate in the same places the rest of the campaign memory already uses.
- **Out of scope**: new art assets, dedicated lore subpages for each character, large route restructuring, or JavaScript/runtime changes.

## Likely Files

```text
[NEW] .agents/plans/rpg-boonwap-fabric/PLAN.md
[MOD] play/rpg-wednesday/index.html
[MOD] play/rpg-wednesday/cast/index.html
[MOD] play/rpg-wednesday/sessions/index.html
[MOD] design/components/index.html
[MOD] contact/index.html
[MOD] topics/index.html
[MOD] about/index.html
[MOD] about/website/index.html
[MOD] about/domains/lore.land/index.html
```

## Integration Seams

- `play/rpg-wednesday/index.html`: orient the reader, name the active cast pressure, add a clearer boonhonk/lore grammar, and connect capture cards to read-aloud, JSON, and SVG handoff seams
- `play/rpg-wednesday/cast/index.html`: describe what belongs in cast memory and explicitly reserve space for BoonWAP, BaneWAP, Slibbon Bap, WAPboy, Honk Bazongas, and Gravy Davis once the register hardens
- `play/rpg-wednesday/sessions/index.html`: guide session notes toward recurring relational beats, name drift, read-aloud hooks, and careful treatment of touchy existence questions
- `design/components/index.html`: make the page an onboarding route for designers who want to help shape RPG Wednesday capture cards and SVG handoffs
- `contact/index.html`: provide a clear DM ask for curious designers arriving from component or RPG surfaces
- `topics/index.html` and lore/about surfaces: make the neighboring routes more obviously part of the same boonhonk and serial-lore fabric

## Risks

- The copy can turn didactic if it explains the consent/agency dimension too directly.
- The "is he real?" question can flatten the character if treated as a gimmick instead of a pressure point.
- Too much lore density on placeholder routes could outrun the actual session log.
- The boon/bane/bone/bonk/honk language can become noise if the operational meaning is not kept close to the copy.
- Screen-reader or read-aloud hooks can feel bolted on if they are described as accessibility extras instead of part of the narrative contract.

## Validation

- `git diff --check`
- `npm run check`
- targeted `rg` checks for `BoonWAP`, `WAPboy`, `Gravy Davis`, `Honk Bazongas`, `Willby Spillzus`, and `Wonder About Pi(e)`

## Out Of Scope

- New cast pages
- New session entries
- Shared CSS refactors
- New JSON feeds or video runtimes
