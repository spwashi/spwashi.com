# Plan: operator-semantics-refinement

Refine Spw operators to be more true to the established lore and original set, with room for interpretation based on the physics of the language and traditions that emerge through acknowledgment of symmetry and priming.

## Goal

The desired end state is a coherent operator system where:

1. **Lineage is clear**: Users understand how operators evolved from the original set (~ # . ? ! * & @ ^ <> [] {}) to current implementation, and why the evolution makes sense.
2. **Physics is discoverable**: Operators behave according to underlying principles (spatial relationships, containment, reference, projection, etc.) that can be felt through interaction and explained through documentation.
3. **Symmetry is legible**: Users recognize that operators have natural pairing relationships (~ pairs with @, # pairs with ., ? pairs with !) that create coherent dynamics.
4. **Priming is meaningful**: Operator sequences feel natural because each operator sets up expectation for what comes next. A sequence like ~(#frame) ?! feels inevitable rather than arbitrary.
5. **Interpretation emerges**: Over time, users develop intuitions about how operators work together, discovering traditions and patterns that are grounded in physics rather than arbitrarily imposed.

## Scope

- **In scope**: operator lineage documentation; physics explanations for each operator; symmetry pair mappings; priming rules and examples; interaction pattern descriptions; discoverability enhancements; alignment with interaction-grammar and spw-operator-pages plans.
- **Out of scope**: implementing operator-based UI widgets (that's interaction-grammar); rewriting operator atlas pages (that's spw-operator-pages); changing the HTML structure (that's mobile-runtime-foundation).

## Files

- [NEW] .spw/conventions/operator-semantics.spw — comprehensive operator lineage, physics, symmetry, priming, and interpretation emergence
- [MOD] .spw/conventions/index.spw — add reference to operator-semantics
- [MOD] .spw/site.spw — add operator-semantics to workbench roots
- [NEW] .agents/plans/operator-semantics-refinement/PLAN.md (this file)
- [NEW] .agents/plans/operator-semantics-refinement/operator-lineage-discovery.spw — how users discover and learn operator lineage
- [MOD?] topics/software/spw/index.html — enhance operator atlas landing page with lineage and physics overview
- [MOD?] public/js/spw-interaction-runtime.js — consider adding operator-aware interaction patterns based on priming rules
- [MOD?] public/css/style.css — consider enhancing operator visibility and grouping by symmetry pairs

## Craft Guard

- **Lineage must be honest**: Original meanings should be preserved and explained, not hidden. Adaptations should be justified in context.
- **Physics must be testable**: Operator behavior should match the physics description. If the physics says "ground should be reachable from any depth," that should be true in the system.
- **Symmetry should be discoverable**: Users should be able to find symmetry documentation without extensive searching. Consider visual/conceptual grouping in operator atlas.
- **Priming should be natural**: Operator sequences should feel inevitable to users, not requiring memorization. The physics should make the sequence obvious.
- **Interpretation must be user-driven**: The system should support user discovery of traditions, not impose them. Documentation should explain how to find patterns, not dictate what patterns mean.

## Dependencies

- **interaction-grammar** — This plan works in parallel. The operator-semantics refinement provides the conceptual foundation; interaction-grammar builds the interactive patterns on top of it. A user who understands operator physics will naturally discover interaction circuits.
- **spw-operator-pages** — The operator atlas pages should reference operator-semantics for physics, symmetry, and priming explanations. Each page becomes more coherent when its subject operator's relationships are visible.
- **mobile-runtime-foundation** — Mobile interactions must still respect operator priming and symmetry. Touch-based patterns should still feel natural and governed by operator physics.
- **screenshot-semantics** — Operators and their symmetry pairings are worth capturing in screenshots. The documentation should show how operator relationships are visible in the rendered page.

## Commits

1. `&[conventions] — add refined operator semantics with lineage, physics, priming, and symmetry` (DONE)
2. `&[plans] — create operator-semantics-refinement plan and integration documentation`
3. `![docs] — enhance operator atlas landing page with lineage and physics overview (optional, from interaction-grammar plan)`
4. `&[runtime] — consider operator-aware interaction patterns based on symmetry and priming (deferred to interaction-grammar)`

## Validation

**Hypotheses**:
- Operators will feel less arbitrary once their lineage is documented.
- Users will recognize operator symmetry without being told explicitly.
- Operator sequences will feel natural when priming is understood.
- New users will intuitively discover operator patterns over time.

**Negative controls**:
- Original operators are still documented and referenced.
- Physics explanations match actual behavior.
- Symmetry is discoverable without extensive documentation.
- Priming rules are examples, not laws (users may find their own patterns).

**Demo sequence**:
1. Read operator-semantics.spw → understand lineage and physics
2. Visit operator atlas pages → recognize symmetry pairings
3. Interact with site for 5-10 minutes → feel operator sequences becoming natural
4. Check interaction logs/console → see which operator patterns the user gravitates toward
5. Read interaction emergence section → recognize patterns you discovered yourself

## Agentic Hygiene

- Rebase target: `main@a2a9da0` (latest operator-semantics commit)
- Rebase cadence: after this commit, before interaction-grammar integration
- Hygiene split: none

## Integration Points

### With interaction-grammar

The interaction-grammar plan builds interactive circuits that users practice and become fluent with. This operator-semantics refinement explains **why** those circuits feel natural. When a user discovers that #name ? ! is a satisfying circuit (orient, wonder, act), the operator-semantics document explains that # primes wonder, and wonder naturally leads to action.

### With spw-operator-pages

Each operator page becomes more powerful when it includes:
- Where it appears in the original set (lineage)
- Its physics (spatial act, priming property, symmetry partner)
- Example sequences showing how it pairs with symmetric operators
- Link to discovery exercises (from interpretation-emergence section)

### With screenshot-semantics

Operator pairs create visible relationships in the interface. A screenshot showing ~(#frame) naturally displays reference threading and frame naming. The documentation should point out how to see these relationships.

## Future Extensions

1. **Interactive operator explorer**: Visualization showing operator symmetry pairs, priming sequences, and composition examples.
2. **Operator discovery exercises**: Guided explorations that teach operator behavior through spatial interaction rather than text.
3. **Operator "tuning" settings**: Advanced option to adjust how strongly operators prime each other, or to explore alternative symmetry pairings.
4. **Multi-language framing**: Document how other languages (music notation, mathematics, code) have their own "operators" that follow similar physics and symmetry.

## Related Concepts

- **Operator physics** — The spatial and attentional relationships that operators encode. Understood through feel first, explanation second.
- **Priming** — How one operator sets up expectations for the next, creating coherent sequences.
- **Symmetry** — Operator pairs that create dynamics through relationship rather than isolation. Where there is potential, there must be perspective.
- **Emergence** — How traditions and new patterns arise from users interacting with the physics and symmetry of operators.
- **Lore** — The accumulated understanding of what operators mean, how they work together, and what purposes they serve. Grows through use and acknowledgment.

