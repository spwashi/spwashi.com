# Discovery Notice Popups

## Public Goal
- Improve site discoverability with small dismissible pop-ups that surface useful internal pages and offers.
- Keep the notices schedule-driven so the surface can change by day or week without hand-editing routes.

## Working Contract
- The source of truth is JSON in `public/data/`.
- The runtime chooses notices based on the current day or week.
- Dismissal is local to the browser and should suppress repeated interruptions for the relevant notice.
- The notices should feel like helpful guidance, not modal interruption.

## Likely Files
- `public/data/promo-wonder-cycle.json` or a new site notice feed in `public/data/`
- `public/js/site.js`
- a new shared runtime module in `public/js/`
- shared CSS in `public/css/spw-chrome.css` or `public/css/spw-components.css`
- `.spw/` notes if the notice contract becomes a durable site concept

## Risks
- Overusing the surface could make the site feel noisy.
- Dismissal scope needs to be predictable so day/week notices do not disappear too aggressively.
- The styling must stay subordinate to the shell, not compete with page content.

## Validation
- `git diff --check`
- `node --check` on touched JS modules
- `npm run check`
- browser smoke check on the home page and one content route

## Out of Scope
- Full ad network integration
- Server-side personalization
- Modal blocking behavior
