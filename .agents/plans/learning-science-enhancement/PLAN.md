# Plan: learning-science-enhancement

Enhance the presence and application of Learning Science (LS) principles across the site to make the pedagogical foundation more explicit and effective for the practitioner-artist.

## Goal

The site already uses deep pedagogical models (Constructionism, ZPD, Cognitive Surface), but they are often expressed in site-local jargon. This plan aims to bridge these with established Learning Science terminology (Dual Coding, Signaling, Contiguity, Cognitive Load) to make the "why" behind the design more legible and to strengthen the site's role as a learning environment.

## Objectives

1.  **Enunciate Principles**: Explicitly name and define LS principles on the Pedagogy route.
2.  **Map to Spw**: Create a Rosetta stone between standard LS terms and Spw design language (e.g., signaling -> operator resonance).
3.  **Audit and Upgrade**: Review high-traffic routes (Software, Math, Craft) and add "Pedagogical Notes" or structural markers that highlight these principles in action.
4.  **Enhance Cognitive Surface**: Improve the "Engagement Memory" property by making the residues of learning more tangible.

## Scope

- **In scope**: `topics/pedagogy/index.html` updates, new LS-specific components (e.g., `spw-ls-marker`, `spw-principle-card`), updates to `topics/software/` and `topics/math/` to demonstrate principles.
- **Out of scope**: creating a full learning management system (LMS), adding quizzes, or major architectural changes to the CSS/JS runtime.

## Proposed Principles to Highlight

- **Dual Coding**: Visual studies paired with site-semantics.
- **Signaling / Cuing**: Operator resonance and handle brightness.
- **Spatial Contiguity**: Proximity of explanation and experiment in Field Labs.
- **Segmenting**: The `liminality` sequence and foldable content layers.
- **Coherence**: Stripping away decorative noise in favor of semantic ornament.
- **Practitioner Agency**: The "Mistake-inclusive" correctability of the cognitive surface.

## Files Likely To Change

[MOD] `topics/pedagogy/index.html` - Add explicit LS section and mapping.
[MOD] `public/css/spw-surfaces.css` - Add styles for pedagogical markers.
[MOD] `.spw/philosophy/cognitive-surface.spw` - Align with standard LS terms.
[MOD] `topics/software/index.html` - Add principle annotations.
[MOD] `topics/math/index.html` - Add principle annotations.

## Commits

1. `#[pedagogy] — capture learning science enhancement plan`
2. `&[pedagogy] — upgrade pedagogy route with explicit principles and Spw mapping`
3. `.[design] — add spw-ls-marker component for pedagogical signaling`
4. `*[topics] — annotate software and math routes with learning science highlights`

## Validation

- Principles are clearly defined on `/topics/pedagogy/`.
- A visitor can see a "principle in action" marker on a software or math page.
- The `cognitive-surface.spw` reflects the alignment with learning science.
