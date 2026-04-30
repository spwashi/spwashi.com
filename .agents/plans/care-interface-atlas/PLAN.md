# Care Interface Atlas

## Public Goal

Make Spwashi more useful for engineers and other analytical processors who have tried therapy, run into translation barriers, and need non-clinical language, cards, community protocols, and safety boundaries before or alongside licensed care.

## Minimal File Set

- `care/index.html`: new public care-interface route with model, engineer entry, cards, community protocols, social/video bridge, and safety boundary.
- `services/index.html`: route the care mention toward the broader `/care/` surface while preserving the service register.
- `services/care/index.html`: keep the existing practice/intake page but add a clear bridge to `/care/`.
- `topics/mental-health/index.html`: point the topic route toward the new care interface instead of treating the service page as the main care door.
- `.spw/site.spw` and `.spw/surfaces.spw`: name the new care interface as a public surface.

## Semantic And Runtime Notes

- `data-spw-surface="care"` names the broad public surface.
- `data-spw-feature` names coherent clusters: care model, engineer translation, care cards, community protocols, social prompts, safety boundaries.
- No new runtime state is introduced.
- No clinical diagnosis, therapy replacement, or crisis-care behavior is introduced.

## Boundaries

- Do not build the whole proposed route tree in this patch.
- Do not add AI chatbot behavior or mental-health data collection.
- Do not use the page to promise treatment outcomes.
- Keep `/services/care/` available for the existing local intake tool.

## Validation

- `git diff --check`
- targeted `rg` checks for `/care/` and `data-spw-feature`
- `npm run check`
