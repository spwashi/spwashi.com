# Voice Grounding Pass

## Public Goal

Make the core site introduction sound more like Spwashi and less like generalized AI-generated creator copy.

## Scope

- `index.html`
- `about/index.html`
- `now/index.html`

## Direction

- replace broad synthetic framing with concrete practice language
- foreground videos, pacing, repetition, and learned communication
- use specific vocabulary from the working philosophy:
  - learning how I learn
  - sharable recursive self-improvement
  - abstraction and heuristics
  - 13-phase pacing
  - subjectivity/objectivity oscillation
  - genre routing

## Constraints

- keep the existing page structures
- patch copy and route-local markup only
- avoid turning the site into a manifesto wall

## Validation

- `git diff --check`
- targeted `rg` checks for inserted phrases
