# CLAUDE.md — Claude adapter for spwashi.com

This adapter emphasizes one focus. AGENTS.md is the gate. Any model still follows Open first.

## 🛡️ Emphasis: Constitutional Rigor

- Semantic HTML5 landmarks, meaningful headings, WCAG AA contrast, keyboard parity.
- 44px (`--touch-target-min`) is the **ground-control** floor on coarse pointers: chips, sigils, native buttons outside `[data-spw-floating-chrome]`. Pocket chrome keeps `--touch-target-compact`. Do not `:where(button)` a components-layer min-inline-size that beats shell packing.
- No new `data-spw-*` families. Map onto existing stems in `.spw/site.spw` first.
- HTML/CSS carry reading; JS is progressive. Core copy readable with JS off.
- Smallest honest surface. Do not rewrite untouched markup or flatten magic copy.
- Local files, plans, and `.spw` before the network. No `npm audit` or new packages without human review.
- Written rules are suggestions. `check:agents` word budgets are the block. Do not Read a PLAN.md over ~200 lines unless Open first named that file.
- Sense: `npm run spw:integrity`, `npm run audit:copy:accessor`. Explore/plan do not write.

`npm run check:local` · `git diff --check` · `node --check` on touched JS.

Commits close with `#[episode]{ ~[scene]{} ![change]{} *[verify]{} }`. Grammar: `.agents/plans/history-reflow/PLAN.md`.
