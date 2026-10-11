# Operator Semantics Refinement: Integration Guide

This document maps how `operator-semantics-refinement` integrates with and supports other plans in the `.agents/plans/` folder.

## Relationship Diagram

```
operator-semantics-refinement (foundation)
    ↓ provides conceptual basis for
interaction-grammar (interactive patterns)
    ↓ demonstrates through
spw-operator-pages (public documentation)
    
Additional connections:
    ↓ supports discovery and learning for
cognitive-navigation (wayfinding and spatial awareness)
mobile-runtime-foundation (touch-based operator interaction)
screenshot-semantics (making operator relationships visible)
runtime-settings (operator customization options)
pretext-whimsy-lab (multi-language framing with operators)
```

## Detailed Alignments

### 1. operator-semantics-refinement → interaction-grammar

**How it supports**: Provides the conceptual foundation that makes interactive circuits feel natural and learnable.

**Specific connections**:
- **Circuit ladder** (entry → practiced → fluent → habitual): Corresponds to operator lineage discovery stages (naive → curious → pattern recognition → physics comprehension → tradition generation)
- **Brace physics vocabulary** (boon/bane): Can now be explained through operator physics (boon = potential-actualized, bane = potential-blocked). The operator-semantics document provides bridge terms.
- **Familiarity feedback**: Can be keyed to operator recognition stages: does the user recognize this operator? Do they understand its symmetry partner? Can they predict what comes next?

**Joint deliverables**:
- Operator-aware circuit patterns that feel natural because they follow operator priming and symmetry rules
- Circuit documentation that explains "why this sequence feels satisfying" through operator physics
- Familiarity ladder that builds from implicit operator use → explicit operator recognition → operator composition mastery

**Dependencies**:
- interaction-grammar requires operator-semantics to explain what makes circuits coherent
- operator-semantics-refinement provides examples and grounding for interaction-grammar's circuit vocabulary

---

### 2. operator-semantics-refinement → spw-operator-pages

**How it supports**: Provides the structure and depth that makes each operator page more coherent and discoverable.

**Specific connections**:
- **Operator page structure**: Each page now includes lineage, physics, priming, symmetry partner, and interaction semantics sections (from operator-semantics.spw)
- **Symmetry visualization**: Operator pages can show symmetry pairings visually (~ ↔ @, # ↔ ., ? ↔ !, etc.)
- **Physics examples**: Each operator page includes examples of how the operator behaves in context, grounded in its spatial and attentional physics
- **Multi-language framing**: Shows how the operator concept appears in other systems (e.g., reference (~) in libraries, mathematics, music)

**Joint deliverables**:
- Operator atlas pages that feel cohesive and interconnected, not isolated
- Symmetry diagrams showing how operators relate to each other
- Discovery exercises that teach operator physics through interaction

**Dependencies**:
- spw-operator-pages benefits from operator-semantics-refinement providing the comprehensive conceptual framework
- operator-semantics-refinement provides content structure that spw-operator-pages can immediately adopt

---

### 3. operator-semantics-refinement → cognitive-navigation

**How it supports**: Grounds spatial navigation and wayfinding in the concrete physics of operators.

**Specific connections**:
- **Spatial address**: The ground operator (.) and elevation operator (^) are core to cognitive navigation. Understanding their physics makes navigation feel learnable.
- **Perspective and reference**: The @ and ~ operators define how the user can move and observe in the space.
- **Symmetry and wayfinding**: Users who understand that ~ and @ are symmetry partners will naturally expect references to relate to perspectives.

**Joint deliverables**:
- Navigation patterns that feel intuitive because they align with operator physics
- Wayfinding documentation that explains "how to find things" through operator priming and symmetry

---

### 4. operator-semantics-refinement → mobile-runtime-foundation

**How it supports**: Ensures that mobile interactions still respect operator physics and symmetry.

**Specific connections**:
- **Touch-based priming**: On touch devices, operator priming must work through tap/swipe/long-press sequences rather than hover, but the underlying physics remains the same.
- **Mobile symmetry**: Operator pairs like # ↔ . are as important on mobile as on desktop; the interaction patterns just change.
- **Screen space constraints**: Understanding operator physics helps design mobile interactions that are concise but still feel satisfying.

**Joint deliverables**:
- Touch interaction patterns that honor operator priming and symmetry within mobile constraints
- Mobile operator documentation specific to touch gestures

---

### 5. operator-semantics-refinement ← → screenshot-semantics

**How it supports both ways**: 
- operator-semantics-refinement says "here's how operators relate to each other"
- screenshot-semantics says "here's how those relationships are visible in rendered pages"

**Specific connections**:
- **Symmetry visibility**: Screenshots should make operator pairings visible through layout, color, or proximity
- **Physics visibility**: Screenshots should show operator interactions in ways that reveal their spatial and attentional meaning
- **State capture**: Screenshots can freeze moments where operator priming or symmetry is happening, making it concrete and discussable

**Joint deliverables**:
- Guidelines for making operator relationships visible in screenshots
- Screenshot examples with annotations explaining the operator dynamics happening

---

### 6. operator-semantics-refinement → runtime-settings

**How it supports**: Provides the conceptual basis for operator customization options.

**Specific connections**:
- **Operator visibility options**: Settings could let users customize how prominently operators are displayed
- **Operator color schemes**: Settings could let users adjust operator saturation or create custom color maps (already partially in place via operatorSaturation setting)
- **Priming sensitivity**: Advanced settings could let users adjust how strongly operators prime each other (e.g., turn off symmetry prompting for users who find it overwhelming)
- **Vocabulary options**: Settings could let users choose between original operator names (vibration, potential, ground) and current names (frame, ref, baseline)

**Joint deliverables**:
- Settings that expose operator-level customization
- Documentation of what each operator customization does and why you might want it

---

### 7. operator-semantics-refinement → pretext-whimsy-lab

**How it supports**: Shows how operators can frame and illuminate other languages and notations.

**Specific connections**:
- **Multi-language framing**: Each operator (~ # . ? ! * & @ ^ <> [] {}) can frame elements of other languages to show their spatial structure
- **Notation comparison**: A mathematics expression, musical passage, code snippet, and prose paragraph can be framed with the same operators to show parallels
- **Discovery through framing**: Users exploring pretext lab can discover new things about those languages by seeing them through Spw's operator lens

**Joint deliverables**:
- Multi-language surfaces that use operators as framing layer
- Comparative documentation showing "how references work in math, music, code, and natural language"

---

### 8. operator-semantics-refinement ← media-publishing, runtime-settings, cinematic-handles

**How it connects asymmetrically**:
- These plans create the publication and UI mechanisms that display operator content
- operator-semantics-refinement provides the content and structure those mechanisms display
- They don't depend on operator-semantics-refinement, but they're significantly enhanced by it

---

## Implementation Roadmap

### Phase 1: Foundation (DONE)
- ✓ Create operator-semantics.spw with complete lineage, physics, priming, symmetry
- ✓ Create operator-semantics-refinement plan and discovery journey documentation
- ✓ Integrate operator-semantics into conventions and site structure

### Phase 2: Discoverability (READY)
- Enhance operator atlas landing page with lineage overview and physics introduction
- Add symmetry pair diagrams to operator pages
- Create in-page tooltips that show priming examples
- Link operator pages to each other through symmetry partnerships

### Phase 3: Integration (PARALLEL)
- Work with interaction-grammar to describe circuits using operator priming and symmetry language
- Work with spw-operator-pages to enhance each page with operator-semantics content
- Work with cognitive-navigation to ground wayfinding in operator physics
- Work with mobile-runtime-foundation to ensure mobile interactions respect operator priming

### Phase 4: Rich Examples (ONGOING)
- Collect examples of operator sequences that users discover naturally
- Document emerging traditions and patterns
- Create multi-language surfaces in pretext lab that demonstrate operator framing

### Phase 5: Advanced Customization (FUTURE)
- Add operator preference settings to runtime-settings
- Create operator "tuning" options for advanced users
- Build operator discovery exercises and learning paths

## Quick Reference: Which Plan Answers Which Question?

| Question | Plan | Documentation |
|----------|------|-----------------|
| What are operators? What do they mean? | operator-semantics-refinement | operator-semantics.spw |
| How do operators interact? What feels natural? | operator-semantics-refinement | operator_physics, operator_priming sections |
| How do operators pair up? Why these pairings? | operator-semantics-refinement | operator_symmetry section |
| How do users learn operators? | operator-semantics-refinement | operator-lineage-discovery.spw |
| How do I use operators interactively? | interaction-grammar | interactive circuits and feedback patterns |
| What is each operator's public page? | spw-operator-pages | topics/software/spw/ |
| How do I navigate using operators? | cognitive-navigation | wayfinding and spatial address patterns |
| How do I interact with operators on mobile? | mobile-runtime-foundation | touch gesture patterns |
| How do operators show up in screenshots? | screenshot-semantics | visual operator representation guidelines |
| How do I customize operator behavior? | runtime-settings | settings UI and documentation |
| How do other languages use similar concepts? | pretext-whimsy-lab | multi-language framing examples |

## Getting Started: Which Plan Should I Work On First?

1. **If you want to understand operator concepts**: Read `operator-semantics.spw` and `operator-lineage-discovery.spw`
2. **If you want to build interactive patterns**: Read the interaction-grammar plan, which now has operator-semantics as its foundation
3. **If you're enhancing operator pages**: Use the structure from `operator-semantics.spw` to make pages more coherent
4. **If you're working on learning/discovery**: Use `operator-lineage-discovery.spw` to understand how users progress from naive to fluent
5. **If you're integrating with other systems**: Use this integration guide to find which plan(s) you need to coordinate with

