# Typography Reading Groove

## Public Goal

Make long-form reading surfaces feel more musical and skimmable while scrolling, especially for audiences who are mostly listening and only partially watching the screen.

## Hypothesis

If the currently leading block of text and its immediate neighbors receive a subtle shared activation state, the page will feel more alive in motion and concepts will remain easier to track in screen recordings.

## Scope

- `public/js/runtime/spw-attention-architecture.js`
- `public/css/typography/spw-typesetting.css`

## Constraints

- progressive enhancement only
- no scroll hijacking
- no layout-shifting typography tricks
- readable on both desktop and touch
- reversible through one selector/attribute family

## Validation

- `git diff --check`
- `node --check public/js/runtime/spw-attention-architecture.js`
- targeted `rg` checks for the reading-groove attributes
