---
name: spw-interactive-medium
description: Play, scene, and practice-bed behavior—device-aware tokens, keyboard scenes, topical payloads. Not for ordinary editorial reading routes.
---

# Spw Interactive Medium for spwashi.com

Read first:

- `../_shared/site-workflow.md`
- `../_shared/site-vs-workbench.md`
- `references/interactive-medium-rails.md` when implementing

## Intent (honest)

This stack grew because play/practice routes needed shared device and scene
grammar. It is easy to over-apply on reading pages. **Default reading routes
should stay light.**

## When to use

- Route is play, practice, scene, film, or campaign—not only reading
- Scene beds, lane focus, keyboard potentiation, staged reveals
- Module CSS must respect viewport/pointer without forking media queries
- LM/editor handoff serialization is an explicit product need

## When not to use

- Editorial copy or static curriculum pages
- Adding “intensity” for its own sake on the home/about reading path
- Serializing everything “for the agent” without a consumer

## Workflow

1. Classify register: `scene` | `play` | `workshop`/`lab` | keep `reading` light.
2. Reuse shell device state; let `interactive-medium.js` own medium tokens—do not re-detect.
3. Patch smallest surface: HTML bed → tokens → systems CSS → tail modulator → catalog (prefer non-immediate).
4. Wire `.spw` / slices only when the contract is reused across routes.
5. Validate snapshots only if handoff is in scope:
   - `__SPW_INTERACTIVE_MEDIUM__`, page-anatomy, topical-payload

## Owners (do not duplicate)

| Concern | Owner |
|---------|--------|
| Lanes + local memory | `scene-interaction.js` |
| Potentiation / scene stack | `spw-key-events.js` |
| Device + register tokens | `interactive-medium.js` + tail CSS |
| Topics/handles/scene state | `topical-payload.js` |

## Edges

- Coarse + narrow → touch-field; suppress hover lifts
- Reduced motion → dampen tokens; no gratuitous transforms
- Boot: shell-disclosure before interactive-medium
- Deduplicate hosts when scoring intensity

## Validation

- `node --check` on touched modules
- Smoke one practice + one play route, narrow and wide
- `check:runtime` if catalog changed
