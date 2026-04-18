# Author RPG Notebooks

## Goal

Improve the site’s journaling, note-taking, and character-development affordances for two overlapping audiences:

- authors who need a clean bridge from private fragments into publishable surfaces
- RPG players who need a clean bridge from session residue into cast, world, and arc memory

The feature should strengthen the existing local-first posture. Private notes stay private by default; public routes teach what should move from scratch material into stable canon.

## Scope

- Add author-facing notebook guidance on the craft route.
- Deepen the character-sheet builder so it supports richer character-development prompts instead of only high-level translation.
- Refine RPG Wednesday’s local gameplay kit so it separates scratch notes from canon candidates and character beats.
- Teach the journal-to-canon flow in the public RPG routes.
- Keep the work hand-authored and legible; prefer route HTML and one existing runtime module over a new subsystem.

## Affected Files

- `.agents/plans/author-rpg-notebooks/PLAN.md`
- `.agents/plans/rpg-local-gameplay/rpg-local-gameplay.spw`
- `topics/craft/index.html`
- `tools/character-sheet/index.html`
- `play/rpg-wednesday/index.html`
- `play/rpg-wednesday/sessions/index.html`
- `public/js/rpg-wednesday.js`

## Runtime And Semantic Seams

- The RPG local gameplay state already models `notes` and `seeds`. If new note lanes are added, they should remain explicitly local and be described in the existing `rpg-local-gameplay.spw` artifact.
- The character-sheet builder already supports additional section rows through the current DOM-driven indexing. Prefer extending that surface instead of introducing a second character schema.
- Author-facing craft changes should teach a repeatable note loop without adding storage or a new tool unless the existing surfaces cannot carry the idea.

## Out Of Scope

- cloud sync
- multi-user campaign notes
- a full author notebook application
- generated cast/world/session pages
- new build tooling or route moves

## Validation

- `git diff --check`
- `node --check public/js/rpg-wednesday.js`
- targeted `rg` checks for new journal/canon terminology
- `npm run build`
