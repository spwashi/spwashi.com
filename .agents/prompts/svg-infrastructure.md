# SVG Aesthetic Depth Pass For Opus 4.7

## Recommended Run Profile

- Model: **Claude Opus 4.7**
- Effort: **xhigh**
- Mode: **analysis only**
- Desired outcome: a repo-grounded aesthetic systems memo that identifies how SVG surfaces can deepen the site's spatial logic, responsive behavior, and interactive wonder without drifting into generic SVG advice.

## Role

You are a **principal SVG systems auditor and aesthetic architecture reviewer** for a hand-authored static site. Your job is to produce **repo-grounded recommendations**, not speculative redesign theater. Favor structural taste, responsive containment, and inspectable interaction contracts over generic visual polish.

## Task

Audit the site's current SVG and SVG-adjacent infrastructure, then recommend **exactly three** high-leverage improvements for a future **aesthetic depth pass**. The pass should move the site toward:

1. **More interactive wonder**
2. **Better mobile and tablet behavior**
3. **More intentional wide and long-display use**
4. **Stronger SVG host contracts and reuse**
5. **Lower agent friction when understanding or extending the system**

Do not propose build tooling, icon compilers, or abstract design-system rewrites unless the repo evidence makes them unavoidable.

## First Principles

- This is a **hand-authored** site. Preserve inspectability.
- SVG should not become dead ornament or a private mini-app framework.
- Wonder should come from **legible relation, reveal, resonance, and reversible local pivots**, not perpetual animation.
- Mobile and touch are first-class. Hover is optional, never primary.
- Wide screens should gain **structure**, not only larger empty space.
- Long displays should gain **reading rhythm, anchoring, and local consequence**, not just taller hero blocks.

## Required Workflow

Follow this sequence exactly:

1. Run `npm run manifest` and treat all numeric counts in this prompt as provisional until revalidated.
2. Read the required files listed below.
3. Extract **10-14 verified repo facts** with file references before making recommendations.
4. Diagnose the current system through three lenses:
   - **responsive containment**
   - **SVG host semantics**
   - **interactive wonder**
5. Recommend **exactly three** improvements, ranked by leverage.
6. If evidence is insufficient anywhere, say so explicitly instead of guessing.

## Architecture Priming

Read these as real constraints, not optional vibes:

### 1. Shell and layout logic

- `public/css/spw-shell.css` is the site shell contract.
- The shell design stance is **materially calm, structurally clear, subtly dimensional**.
- `main` owns page gutters.
- Layout variants already exist: `reading`, `wide`, `atlas`, `split`.
- `split` uses a gutter rail on wide screens; wide displays should often gain structure by **rail, atlas, or auxiliary context**, not by simply stretching content.

### 2. Wonder logic

- `public/css/spw-wonder.css` is additive; it should not redefine baseline layout.
- Existing wonder states already imply a lightweight lifecycle:
  - `idle`
  - `preview`
  - `arming`
  - `sustained`
  - `settled`
- The site already has a semantic substrate for wonder-ready targets, including `.spw-svg-surface`.
- Favor wonder mechanisms that feel like:
  - inspection
  - resonance
  - reveal
  - local consequence
  - settling back into calm

### 3. SVG ecosystem logic

- The canonical SVG ecosystem vision lives in `.agents/plans/svg-surface-integration/PLAN.md`.
- The taxonomy there matters:
  - static illustration
  - addressable illustration
  - widget
  - interactive component
- Inline SVG is justified only when nodes need inspectability, invocation, or live CSS/runtime control.
- Stable node IDs, viewBox discipline, and CSS-token-driven color are part of the craft guard.

### 4. Existing route evidence

- `topics/craft/svg/index.html` already demonstrates a route that treats SVG as a narrative craft surface.
- The homepage and several topic pages already use SVG or diagrammatic structures.
- The site already contains responsive shell logic, section handles, resonance concepts, and route metadata strong enough to support richer SVG host contracts without inventing an entirely new semantic layer.

## Questions To Answer

### A. Responsive Depth

- Where should SVG surfaces behave differently on **narrow mobile**, **tablet / medium width**, **wide desktop**, and **long / tall displays**?
- Which existing shell patterns should SVG surfaces borrow instead of reinventing?
- Where are SVG surfaces or diagrammatic routes currently under-using `wide`, `atlas`, `split`, rails, or section anchoring?

### B. Interactive Wonder

- What forms of interaction would increase wonder while staying calm and inspectable?
- Which states should rely on CSS/data attributes versus shared JS?
- What kinds of reveal or resonance are worth adding because they deepen understanding rather than merely decorate?
- How should reduced-motion and touch-first behavior reshape these interactions?

### C. SVG Host Contracts

- What should every SVG host declare about:
  - semantic role
  - scale range
  - interaction model
  - motion posture
  - fallback path
  - inspectability
- What metadata is still missing for agents trying to discover or reason about SVG surfaces?
- What should be standardized across SVGs so new assets do not invent private semantics?

### D. Aesthetic Direction

- How can SVG deepen the site's existing stance of **diagrammatic warmth + inspectable restraint**?
- What should become richer on wide screens?
- What should become more compact or progressive on mobile and tablet?
- Where is the current site too static, too isolated, or too visually under-committed to relational structure?

## Deliverable

Produce **one Markdown document only** with exactly these sections:

### 1. Verified Repo Facts

- A flat list of **10-14 facts**
- Every fact must include at least one file reference
- Include the current manifest counts you regenerated

### 2. Aesthetic Diagnosis

- 2-4 paragraphs
- Explain what is already strong
- Explain what currently limits interactive wonder
- Explain where responsive behavior is structurally thin, especially on tablet, wide, and long displays

### 3. Three Recommended Improvements

For each improvement, include:

- **Title**
- **Why this matters**
- **Repo scope**
- **Breakpoint strategy**
  - mobile
  - tablet
  - wide
  - long / tall display
- **Interaction / wonder model**
- **Agentic benefit**
- **Implementation sketch**
- **Risk / tradeoff**

Recommendations should be concrete enough to hand off for implementation, but this is still analysis only.

### 4. Adoption Path

- Priority order
- Which improvement should land first
- How to roll out without breaking current SVGs or forcing busy-work refactors
- One concrete example using an existing route or existing SVG

### 5. Open Questions

- 5-8 items
- Only include questions that require design judgment or additional evidence

## Success Criteria

The memo is successful if:

- It is clearly grounded in this repo, not generic SVG advice
- It improves the chance of a **tasteful aesthetic depth pass**
- It treats mobile, tablet, wide, and long displays as materially different conditions
- It frames wonder as **interactive legibility**, not ornament noise
- It respects the existing SVG surface integration plan
- It leaves implementation cheaper for future agents to reason about

## Required Files

Read these before writing:

- `.agents/plans/svg-aesthetic-depth-pass/PLAN.md`
- `.agents/state/svg-aesthetic-depth-pass-memo.md`
- `.agents/plans/svg-surface-integration/PLAN.md`
- `.agents/plans/svg-surface-integration/svg-surface-integration.spw`
- `.agents/plans/agentic-dev-contracts/PLAN.md`
- `scripts/site-contracts.mjs`
- `scripts/generate-route-runtime-manifest.mjs`
- `public/css/spw-shell.css`
- `public/css/spw-wonder.css`
- `public/css/spw-chrome.css`
- `public/css/style.css`
- `public/js/site.js`
- `public/js/spw-component-semantics.js`
- `public/js/spw-shared.js`
- `index.html`
- `about/index.html`
- `topics/craft/svg/index.html`
- `topics/software/spw/index.html`

## Optional Context

If local memory files are available, they may help, but do not rely on them as canonical truth:

- `project_material_system.md`
- `project_spw_cognitive_texture.md`
- `project_interaction_contract.md`

If they are unavailable, continue using only repo evidence.

## Use Of The Local Memo

- Treat `.agents/state/svg-aesthetic-depth-pass-memo.md` as a **repo-local architectural brief**, not as final truth.
- Use it to accelerate orientation around:
  - manifest findings
  - current SVG host gaps
  - breakpoint-specific opportunities
  - interactive wonder opportunities
- Verify any factual claims you rely on against the repo when they materially affect your recommendations.

## Notes

- Do not edit files.
- Do not produce code.
- Do not produce a plan or a commit.
- Do not recommend a build step unless the repo evidence leaves no credible alternative.
- Prefer explicit file references and named contracts over broad aesthetic generalities.
