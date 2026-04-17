# Plan: svg-aesthetic-depth-pass

Prime a future Opus 4.7 analysis so it can recommend a stronger SVG and diagrammatic depth pass for the site without defaulting to generic SVG best practices or isolated visual tweaks.

## Goal

The desired end state is a prompt + architecture brief pair that makes a downstream model start from the site's actual shape:

- hand-authored HTML
- shell-driven responsive layouts
- additive wonder states
- SVG host contracts
- diagrammatic warmth + inspectable restraint

The immediate task is not implementation. It is to make the later analysis phase **cheaper to ground, more aesthetically coherent, and more attentive to mobile, tablet, wide, and long-display behavior**.

## Question

How should SVG-backed surfaces deepen the site's existing spatial logic and interactive wonder without breaking the calm shell, the mobile-first contract, or the agent-readable structure?

## Hypothesis

The future analysis will be better if the model is primed with:

1. the shell's real layout variants and gutter ownership
2. the current wonder / delight / charge lifecycle
3. the SVG taxonomy and host rules already captured in `svg-surface-integration`
4. concrete sample routes that already act as diagrammatic surfaces

Without this priming, the model is more likely to recommend:

- generic animation
- hero inflation
- asset churn
- private SVG semantics
- desktop-first spatial decisions

## Priming Truths

### Shell and display logic

- `public/css/spw-shell.css` defines the site shell and should remain trustworthy even on pages with minimal markup.
- The shell stance is materially calm, structurally clear, and subtly dimensional.
- `main` owns the page gutter.
- `data-spw-layout` already defines `reading`, `wide`, `atlas`, and `split`.
- `split` introduces a rail on large screens; wide display optimization should often use **secondary context, rails, and spatial hierarchy** instead of raw expansion.
- Long-display optimization should favor **anchoring, sectional rhythm, and local consequence**, not only taller hero regions.

### Wonder and interaction logic

- `public/css/spw-wonder.css` is additive and should not redefine baseline layout.
- Existing wonder-ready targets include cards, panels, chips, topics, and `.spw-svg-surface`.
- The shared lifecycle already suggests:
  - idle
  - preview
  - arming
  - sustained
  - settled
- Wonder should usually feel like:
  - a relation becoming visible
  - a cluster becoming resonant
  - a local surface becoming richer, then settling

### SVG logic

- `.agents/plans/svg-surface-integration/PLAN.md` and `.agents/plans/svg-surface-integration/svg-surface-integration.spw` are the canonical local references.
- The SVG taxonomy already distinguishes:
  - static illustration
  - addressable illustration
  - widget
  - interactive component
- Inline SVG is justified when nodes need inspectability, invocation, or live CSS/runtime control.
- Stable node IDs, explicit host contracts, and CSS-token-driven color are part of the craft guard.

### Existing route evidence

- `topics/craft/svg/index.html` already acts as a craft-facing SVG storytelling route.
- `index.html` already uses `data-spw-layout="wide"` and includes inline SVG-driven diagrammatic surfaces.
- `about/index.html` and long reading pages already use section-handle and reading-oriented framing.
- The site already has enough metadata and shared runtime structure to support stronger SVG host contracts without inventing a parallel ontology.

## Artifact Set

- `.agents/prompts/svg-infrastructure.md`
- `.agents/state/svg-aesthetic-depth-pass-memo.md`
- `.agents/plans/svg-aesthetic-depth-pass/PLAN.md`
- `.agents/plans/svg-surface-integration/PLAN.md`
- `.agents/plans/svg-surface-integration/svg-surface-integration.spw`
- `.agents/plans/agentic-dev-contracts/PLAN.md`
- `public/css/spw-shell.css`
- `public/css/spw-wonder.css`
- `public/css/spw-chrome.css`
- `topics/craft/svg/index.html`
- `index.html`

## Local Memo Role

`.agents/state/svg-aesthetic-depth-pass-memo.md` is the downstream orientation memo. It should be treated as a fast-start brief for Opus, not as unquestionable truth. It exists to compress:

- manifest-backed findings
- shell and breakpoint opportunities
- SVG host contract gaps
- wonder / resonance opportunities

The prompt should still require Opus to verify repo facts before leaning on the memo's conclusions.

## What The Downstream Analysis Should Care About

- Whether SVG surfaces are currently too isolated from the shell's display logic
- Whether mobile and tablet states need smaller, clearer, more progressive reveal patterns
- Whether wide and long displays need rails, sectional satellites, or multi-plane host behavior
- Whether wonder is currently too static, too decorative, or too weakly tied to inspectable relation
- Whether manifest / route contracts should expose more SVG-specific host metadata for agents

## Evaluation Criteria

The later Opus memo should be considered strong if it:

- regenerates the manifest instead of trusting stale counts
- extracts verified repo facts before recommending changes
- proposes exactly three improvements
- gives a real breakpoint/display strategy for each improvement
- treats wonder as structural and interactive, not merely animated
- leaves implementation cheaper for future agents to understand and verify

## Validation

- `git diff --check`
- `rg -n "svg-aesthetic-depth-pass|SVG Aesthetic Depth Pass For Opus 4.7" .agents/prompts .agents/plans`
