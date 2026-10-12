# Plan: smut-today-crew

**Status 2026-10-12.** The creator set a new direction for smut.today: a crew world, its staff as the leads, a story you can put together, daily variance with pins, and no attachment to the current URLs. Nothing is built yet. The 2026-10-12 copy pass (0e2942ae) is what ships at the October 13 close. Next slice: the village and the first arc, for the October 26 close. It is gated on the creator's answers to the open questions.

**Related:** [workers-wonder-kit](../workers-wonder-kit/PLAN.md) (worker shell) · [model-collaborator-lore-surfaces](../model-collaborator-lore-surfaces/PLAN.md) (credit, consent, usage) · [topic-building-blocks](../topic-building-blocks/PLAN.md) (the culture field's six ways).

## The world, as the creator set it

- A crew works for an actress who has a team on TikTok, and for a musician who has a band.
- The actress and the musician are asexual participants with respect to smut.today. They respect their team and look past their own history to make sure the team is taken care of. They employ and protect; they are never in the heat.
- The emphasis is on the staff: who they fuck, and how they relate to each other. The first arc belongs to the musician's drummer and the actress's head writer.
- Everyone is a composite in an invented job. No name, look, timeline, tour stop, habit or storyline traces back to a real person; drafts are read back for that before they ship.

## What the site does now (measured)

- `workers/smut-today/src/index.js`, one file. Two stories, `meeting` and `train`. Each has a pace (`slow` or `dirty`), a pairing, tags, a body, the phrases it keeps, and three linger questions with answers.
- The day's lead is `STORIES[dayIndex % 2]`, where `dayIndex` is a UTC day, so it turns at 7pm Central.
- One cookie, set only when the reader asks (`/settle/`), holds pace, type size and motion; one button forgets it.
- No script runs on any page (CSP `default-src 'none'`). Routes: `/`, `/to-you/`, `/pitches/`, `/settle/`, `/meeting/`, `/train/`, `/today.json`.

## The eight ways in

Every person and every scene carries the same eight facets, so a reader can follow any one of them across the world:

| Facet | On a person | On a scene |
|---|---|---|
| identity | how they name themselves, what they are working out | what this scene lets them be |
| communication | how they ask, check in, say no, make up | the ask, made legible on the page |
| desire | what they want, at what pace | the heat, and its tags |
| village | who looks after them, and whom they look after | the care around the scene: a meal, a covered shift, a group chat |
| work | the real job: call sheets, load-in, a writers' room, an edit | the work the scene happens around, and does not break |
| oscillation | who they are close to this leg, who they drift from | where the pair sits in its pull and release |
| tradition | the crew rituals they keep | which ritual the scene falls on, sorted by the culture field's six ways (regard, gather, give, cross, keep time, remember) |
| scene | where they go to be alone | the place: a bus bunk, a green room, the writers' room, the laundry at the rented house |

## Putting a story together

The page offers today's draw. Each slot is a pin the reader can hold:

- **who**: a pair, or a trio
- **where**: a place
- **when**: a ritual, or a leg of the tour
- **pace**: slow or dirty (the existing setting)
- **facet**: which of the eight ways to read it through

**Daily variance.** Each day draws a value for every slot that is not pinned, seeded by the reader's own date (`request.cf.timezone`), not UTC. The draw shows the authored scene that best fits the slots, and the beats around it: a group-chat line, a call-sheet note, a tradition card.

**Pins.** A pin is a link. It works with no script, in the same one cookie, set only when asked and forgotten with one button. Pins can also travel in the address, so a pinned draw can be shared.

**Writing it.** The prose is authored, by the creator or drafted for the creator's edit, as scenes and short beats tagged with the eight facets and the slots. The page assembles authored pieces and does not generate text. Whether that holds is open question 1.

## Addresses

The current scheme can go. A proposal, readable aloud:

- `/` today's draw, with your pins
- `/crew/` the village: everyone, their jobs, and who is tangled with whom (HTML, no script)
- `/crew/<who>/` one person, through the eight facets
- `/<who>-and-<who>/` a pair's arc in order
- `/at/<place>/` and `/on/<ritual>/` the places and the traditions
- `/settle/` becomes the pins page
- `/today.json` gains the draw and the pins

`/meeting/`, `/train/`, `/to-you/` and `/pitches/` redirect to their new homes, or retire (open question 4).

## Slices

1. **The village and the first arc** (target: the October 26 close). `/crew/` with the roster slots the creator fills, and the drummer and head writer's first scene in the eight facets. The day turns at the reader's own midnight.
2. **Today's draw with two pins** (who and where), stored in the one cookie and carried in the address.
3. **Places and traditions**, each with its own page, linked from every scene that uses them.
4. **Oscillation over time**: a tour-leg line showing who is close this leg, so returning readers see the village move.
5. **Assemble**: a plain form that composes all five slots, with a shareable result.

## Guards

- Adults only, and every encounter consents on the page. The communication facet is where that shows.
- The actress and the musician are never sexual on this site.
- Composites only; every draft gets an identifiability read-back. No real person, and no one the creator has worked with or planned to cast.
- The register is sensory, not schema: labels read as rooms, doors, heat and waiting (the 2026-09-19 rule).
- No script is needed for anything, the one-cookie promise holds, and nothing is stored about a reader.
- No pay, terms or casting call in site copy. Collaboration with people who act happens on Discord and TikTok, off-site.

## Validation

- `npm run check:workers`; `node --check`; every route rendered through the fetch handler before and after.
- Phone stills through the harness phone viewport.
- The creator reads the first arc in a browser before it ships.

## Open questions

These are in `index.spw` as wonder blocks.

1. Who writes the prose: the creator, a draft for the creator to edit, or text generated per visit? This plan assumes authored.
2. Is putting a story together the reader's act, the creator's authoring tool, or both?
3. Does the crew get names, or roles only?
4. The two stories, the letter and the shelf: fold them into the crew world, keep them in a hall of their own, or retire them?
5. What are the hard limits?
