# Plan: audience-onboarding-copy

Refine the public copy on the main entrance routes so the site better orients experienced professionals, emerging students, and collaborators from adjacent careers.

## Goal

Make the home, about, services, topics, and tools surfaces read like a credible invitation into a decentralized team: one that can onboard developers, illustrators, authors, and a college freshman who is still deciding what they want to study. The copy should assume the reader is smart, busy, and professionally fluent, while also naming the internal routes that help them start.

## Scope

- **In scope**: route intro copy, internal links, section labels, and page-level metadata on the primary entry surfaces.
- **Out of scope**: visual redesign, new runtime behavior, new routes, or restructuring the overall site taxonomy.

## Files

[NEW] `.agents/plans/audience-onboarding-copy/PLAN.md`
[MOD] `index.html`
[MOD] `about/index.html`
[MOD] `services/index.html`
[MOD] `topics/index.html`
[MOD] `tools/index.html`

## Copy Strategy

- Lead with the creator identity first, then the site surface.
- Make internal references explicit enough that a visitor can self-select a next stop without needing prior context.
- Frame the site as a place to join work, explore tools, and find neighboring topics.
- Include a light ramp for college-freshman curiosity without talking down to the reader.
- Preserve the site’s professional register and avoid generic “for everyone” language.

## Validation

- `git diff --check`
- targeted `rg` for the updated route labels and links
- visual spot check in a browser if the diff shifts hierarchy or nav density

## Risks

- Copy can become over-guided if every paragraph turns into navigation.
- The professional tone can flatten if the newcomer ramp is over-explained.
- Internal references should increase clarity, not create a second menu.
