# GPT.md — GPT / Codex / Copilot adapter for spwashi.com

This adapter emphasizes one focus. AGENTS.md is the gate. Any model still follows Open first.

## 📐 Emphasis: Contract Exactness

- No React, Vue, Svelte, Tailwind, CSS-in-JS, or unapproved `npm install`.
- Browser ESM imports use explicit `.js` paths. Do not import `.ts` in client modules.
- CSS layer order: `reset → tokens → shell → typography → grammar → components → systems → routes → handles → effects → ornament`. `!important` only in `ornament`. Never `contain:layout` or `position:relative` on `html`.
- Prove contracts with `npm run check:runtime`, `npm run check:css`, `npm run typecheck`, then `npm run check:local`.

## Computer-use (verify-first)

Codex / GPT computer-use sessions: verify-first (`npm run audit:module-selectors`, `npm run visual:checks`, one pocket route). One named patch. Stop. Do not “implement from plans.”

Commits close with `#[episode]{ ~[scene]{} ![change]{} *[verify]{} }`. Grammar: `.agents/plans/history-reflow/PLAN.md`.
