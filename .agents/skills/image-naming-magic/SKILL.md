# Image Naming Magic Skill

Develop whimsical spirit-based image names grounded in Spw semantics through visual analysis and interactive conversation.

## When to Use

- After obtaining a new image (Midjourney render, illustration, motif)
- Before organizing into asset folders
- To establish thematic mapping (operator, valence, spirit phase, liminality)
- To build naming lexicon patterns over time

## Workflow

```bash
/image-naming-magic [image-path]
```

**Interactive process:**

1. **Visual Analysis** — Script extracts:
   - Dominant color(s) and palette (ImageMagick `identify`)
   - Image dimensions and aspect ratio
   - Luminance distribution (bright/dark/midtone balance)
   - Composition hints (centered, edge-heavy, layered)

2. **Initial Name Suggestions** — Generate 5–10 candidates from:
   - Spw operators (frame/ref/action/stream/object) mapped to visual qualities
   - Valence pentad (boon/bane/bone/bonk/honk) from color warmth + tension
   - Spirit cycle phase (initiation/resistance/transformation/expression/return)
   - Quality descriptors (calm/bright/wistful/charged/threshold/etc.)

3. **User Refinement** — Conversation:
   ```
   You: "This feels like a threshold moment, very composed and introspective"
   Skill: "Suggesting: threshold-stillness, mirror-depth, portal-pause"
   ```

4. **Lexicon Building** — Track patterns:
   - Record chosen names and reasoning
   - Note operator-valence-phase combinations used
   - Suggest similar combinations for future images

5. **Write .spw Sidecar** — Generate file with:
   - `whimsy_name` chosen by user
   - Visual analysis metadata
   - Thematic mapping
   - Alt-text suggestion

## Semantic Vocabulary

**Operators → Visual Qualities:**
- `frame` (^) → bounded, contained, still, architectural
- `ref` (~) → distant, pointing, thread-like, relational
- `action` (@) → directed, active, calling, operative
- `stream` (&) → flowing, temporal, patterned, rhythmic
- `object` (*) → concrete, rendered, present, material

**Valence Pentad:**
- `boon` — growth, warm, generous, left-side motion
- `bane` — friction, cool, resistant, right-side motion
- `bone` — stable, neutral, centered, foundational
- `bonk` — collision, bright, striking, immediate impact
- `honk` — signal, resonant, calling, alert

**Spirit Phases:**
- `initiation` — entry, threshold, new, awakening
- `resistance` — difficulty, pressure, tension, encounter
- `transformation` — pivot, revelation, rupture, crossing
- `expression` — manifestation, projection, becoming, articulationreturn` — settling, aftermath, integration, arrival

## Examples

**Constellation overlay (boon-force):**
```
Visual: Warm gradient, left-pointing, expansive motion
Analysis: Dominant warm color, luminance gradient, asymmetric composition
Skill: "Sensing warm generative motion... boon operator? Growth energy?"
You: "Yes, exactly — positive force, abundant"
Skill: "Proposing: boon-force, growth-glow, expansion-pulse"
You: "boon-force. That's it."
Result: whimsy_name = "boon-force"
```

**Midjourney favicon render:**
```
Visual: Teal gradient, centered, geometric, composed
Analysis: Cool color dominant, vertically balanced, sharp edges, digital
Skill: "Cool, centered, architectural... frame or threshold quality?"
You: "Threshold — it's calming but suggests crossing over"
Skill: "Proposing: threshold-portal, passage-calm, boundary-stillness, poise-crossing"
You: "threshold-stillness"
Result: whimsy_name = "threshold-stillness"
```

## Output Artifacts

1. **Name suggestions** — 5–10 candidates with reasoning
2. **.spw sidecar draft** — ready to review and commit
3. **Lexicon entry** — tracks naming pattern for reuse
4. **Alt-text suggestion** — auto-generated description

## Integration

- **Pairs with `/image-optimize`** — Run naming first, then optimize
- **Pairs with folder reorganization** — Name, then move to appropriate surface directory
- **Builds over time** — Lexicon grows; future images reference prior choices
- **Idempotent** — Re-running updates sidecar without breaking prior work

## Heuristics

- Names should be **2–3 words**, hyphenated (kebab-case)
- Should evoke **feeling + structure** not literal description
- Should be **grounded in Spw semantics** — operators, valence, phases
- Should be **memorable** — poetic but not obscure
- Should **surprise pleasingly** — whimsical but justified by image

## Future Extensions

- Batch naming (label 10 images at once)
- Lexicon export/search (find prior names with similar qualities)
- Visual reference links (this image reminds me of...)
- Naming contests (suggest multiple variants, user votes)
