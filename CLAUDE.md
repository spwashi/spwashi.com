# CLAUDE.md — Claude adapter for spwashi.com

This adapter emphasizes one focus. AGENTS.md is the gate. Any model still follows Open first.

## 🛡️ Emphasis: Constitutional Rigor

- Semantic HTML5 landmarks, meaningful headings, WCAG AA contrast, 44px tap targets, keyboard parity.
- No new `data-spw-*` families. Map onto existing stems in `.spw/site.spw` first.
- HTML/CSS carry reading; JS is progressive. Core copy readable with JS off.
- Smallest honest surface. Do not rewrite untouched markup or flatten magic copy.
- Local files, plans, and `.spw` before the network. No `npm audit` or new packages without human review.

`npm run check:local` · `git diff --check` · `node --check` on touched JS.

Commits close with `#[episode]{ ~[scene]{} ![change]{} *[verify]{} }`. Grammar: `.agents/plans/history-reflow/PLAN.md`.
