# Plan: author-craft-ramps

Create author-facing topic routes that make HTML, CSS, SVG, motifs, and file traditions feel approachable for a creative writer.

## Goal

Build a small `/topics/craft/` cluster for a BookTok-adjacent author friend who may not identify as technical but is willing to explore HTML and CSS in fragments. The highest-value first pass should make the web feel like a sensory book object, an illustrator collaboration surface, and a playful file tradition. Taste note: **bookish wonder without beige nostalgia** — tactile, screenshot-worthy, and useful enough to hand to a creative collaborator.

## Scope

- **In scope**: topic index, craft landing page, fragments route, SVG storytelling route, file traditions route, localized craft CSS, internal links from high-traffic surfaces, manifest and service worker cache updates.
- **Out of scope**: build tooling, CMS, external image generation, account features, automated screenshot capture, or a full course.

## Hypothesis

A creative author is more likely to try web fragments when the first screen feels like a page they can use: a small prompt card, a motif, a visible code fragment, or a file tree that suggests play. The site should provide ramps that a developer friend could extend into paid illustration, motif systems, book sites, and local PWA prompts.

## Files

[NEW] `.agents/plans/author-craft-ramps/PLAN.md` - human-facing plan.
[NEW] `.agents/plans/author-craft-ramps/wip.spw` - living task state.
[NEW] `.agents/plans/author-craft-ramps/author-craft-ramps.spw` - distilled craft ramp contract.
[NEW] `topics/index.html` - topic register.
[EXISTING] `topics/craft/index.html` - author craft landing page from the prior handoff.
[EXISTING] `topics/craft/fragments/index.html` - HTML/CSS fragment ramp from the prior handoff.
[EXISTING] `topics/craft/svg/index.html` - SVG storytelling and illustrator handoff ramp from the prior handoff.
[EXISTING] `topics/craft/files/index.html` - files as creative substrate ramp from the prior handoff.
[MOD] `public/css/craft-surface.css` - harden localized craft styles with screenshot cards and SVG hosts.
[MOD] `public/css/style.css` - import the localized craft stylesheet.
[MOD] `index.html` - link craft cluster from artifact and surface registers.
[MOD] `topics/software/index.html` - cross-link craft as the non-developer application path.
[MOD] `about/website/index.html` - add the craft cluster as a developed surface.
[MOD] `sw.js` - cache new topic routes and craft stylesheet.
[MOD] `manifest.webmanifest` - add Craft shortcut and bump version.
[MOD] `public/data/media-focus.json` - surface Craft as a featured topic.

Craft guard:
- First screens must offer an immediately usable prompt, fragment, or map.
- Do not make a landing page where the page should be a usable ramp.
- Keep HTML hand-authored and readable; no framework or build step.
- Avoid dominant beige/cream/sand/tan, purple-blue, dark slate, or espresso palettes.
- Use stable dimensions for prompt cards and SVG hosts so screenshots are predictable.
- Use inline SVG only as meaningful story/motif material that an illustrator could replace or extend.
- Internal links should reward real visitors without turning every paragraph into navigation noise.

## Commits

1. `#[craft] — capture author craft ramp plan and synthesis contract`
2. `&[topics] — add author-facing craft topic routes`
3. `.[craft] — add localized craft surface styling and screenshot-ready motif cards`
4. `&[pwa] — register craft routes in navigation, focus data, manifest, and service worker`
5. `![craft] — verify static routes, JSON, JS, CSS hygiene, and Spw review`

Fuzz strategy:
- Explore loop: inspect existing route/nav/PWA patterns and the untracked craft stylesheet.
- Stabilize loop: `node --check` for touched JS when applicable, manifest JSON parse, route grep, `git diff --check`.
- Ship gate: `spw-commit-review --scope=changed --no-state`.

## Agentic Hygiene

- Base reference: `main@18c89c4f998c52b60d0b91e7ec88e2b8e59ae146`.
- Rebase cadence: before commit if this work is committed.
- Hygiene split: preserve existing untracked blog plan/page/module work. The craft route files already exist on HEAD from the prior handoff; this pass adds the topic register, discovery wiring, PWA registration, focus data, and CSS hardening.

## Dependencies

- `svg-surface-integration` - craft SVGs should be meaningful story surfaces, not decorative noise.
- `screenshot-semantics` - prompt and motif cards should read well in still images.
- `media-publishing` - craft pages should be discoverable through current site registers.

## Failure Modes

- **Hard**: the pages talk about creativity but do not give a visitor anything concrete to try.
- **Hard**: the craft cluster becomes a developer tutorial instead of an author ramp.
- **Soft**: book sensory cues turn into nostalgic beige styling rather than a distinct site-local motif system.
- **Soft**: SVGs look ornamental but do not help with storytelling or illustrator collaboration.
- **Non-negotiable**: the routes must remain readable without JavaScript and usable as static PWA pages.

## Validation

- **Hypotheses**: an author can open `/topics/craft/`, choose a ramp, and understand one concrete next step; a developer friend can see where they could help; screenshots capture prompt cards and motifs without needing runtime context.
- **Negative controls**: software routes, blog route, and PWA cache behavior remain intact.
- **Demo sequence**: open `/topics/`, follow Craft, open Fragments, inspect one code/result pair, open SVG Storytelling, inspect one motif, open File Traditions, follow a cross-link to Blog or Software.

## Spw Artifact

`.agents/plans/author-craft-ramps/author-craft-ramps.spw`
