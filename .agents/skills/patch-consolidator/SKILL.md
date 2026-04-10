# Patch Consolidator Skill

**Purpose:** Analyze git changes, identify semantic clusters, suggest consolidation, and generate patch metadata aligned with Spw principles.

**Invocation:** `/patch-consolidator` or `/patch-consolidator [options]`

## Overview

The patch consolidator helps you move from scattered changes to meaningful, semantically coherent patches through **mindful consolidation cycles**.

Rather than committing arbitrary diffs, it:
1. **Identifies clusters** of related changes (files that serve the same idea)
2. **Maps projections** (how does this idea manifest across idea→design→implementation→instance?)
3. **Suggests consolidation** (which changes should be grouped into one patch?)
4. **Generates metadata** (operator, phase, valence, dimension, dependencies)
5. **Tracks as precipitate** (crystallized, stable semantic unit)

## Workflow

### 1. Analyze Current Changes

```bash
/patch-consolidator analyze
```

Shows:
- All unstaged and staged changes
- Files grouped by semantic region (CSS, JS, HTML, conventions, assets)
- Suggested operator affinity (what operator is each file serving?)
- Cross-layer dependencies (CSS that pairs with JS, etc.)

**Output example:**
```
ANALYSIS: Current Changes
=========================

Operator ^ (frame):
  CSS:  public/css/cognitive-handles.css (new)
  JS:   public/js/cognitive-handles.js (new)
  HTML: index.html, about/index.html (modified)
  Spw:  .spw/conventions/cognitive-navigation.spw (modified)
  
  → Complete idea: visual handles for frame navigation
  → Slices present: design, implementation, instance (missing idea-level docs?)
  → Phase: expression (manifest stage)

Operator ~ (reference):
  CSS:  public/css/style.css (modified)
  
  → Partial idea: style consolidation
  → Slices present: design only
  → Needs: implementation clarity

SUGGESTIONS:
  1. Consolidate operator ^ changes into one patch (handles are complete)
  2. Clarify operator ~ changes (style updates need semantic grounding)
```

### 2. Suggest Clusters

```bash
/patch-consolidator suggest-clusters
```

Recommends how to group changes into coherent patches:

**Output example:**
```
SUGGESTED PATCHES:
==================

Patch 1: "Cognitive Handles Framework"
  Operator: ^
  Phase: expression
  Valence: boon
  Dimension: abstraction
  
  Files to stage together:
    public/css/cognitive-handles.css
    public/js/cognitive-handles.js
    index.html
    about/index.html
    .spw/conventions/cognitive-navigation.spw
  
  Projections:
    ✓ Design level (specification exists)
    ✓ Implementation level (CSS + JS complete)
    ✓ Instance level (markup updated)
    ✗ Idea level (document the core concept)
  
  Suggested commit message:
    #[^] — cognitive handles across abstraction levels
           (idea: visual affordances for frame depth navigation)
           (design: six handle types)
           (impl: CSS + JS + data attrs)
           (instance: all frames updated)

Patch 2: "Style Consolidation"
  Operator: ~
  Phase: potential
  Valence: (needs clarification)
  
  Files to stage:
    public/css/style.css
  
  ⚠️  Incomplete: Only one layer (CSS). What's the semantic core?
      Suggest: cluster with related JS or convention changes.
```

### 3. Map Projections

```bash
/patch-consolidator projections [operator or file]
```

Show how a change manifests across all dimensions:

**Example: `patch-consolidator projections ^`**

```
PROJECTION MAP: Operator ^
===========================

IDEA LEVEL (conception):
  "Users should understand frame structure visually"
  Location: .spw/conventions/cognitive-navigation.spw

DESIGN LEVEL (potential):
  6 handle types: primary, corner, dimensional, relational, anchor, portal
  Colors: entry (blue), concept (purple), instance (gold), relation (green)
  Location: .spw/conventions/cognitive-navigation.spw + public/css/cognitive-handles.css

IMPLEMENTATION LEVEL (kinetic):
  Languages: CSS, JavaScript
  Data attributes: [data-cognitive-handle], [data-handle-corner], etc.
  Locations: public/css/cognitive-handles.css, public/js/cognitive-handles.js

INSTANCE LEVEL (manifest):
  Where: All .site-frame elements
  Interaction: Hover reveals handle, click navigates
  Visual: Color-coded by abstraction level, positioned on left edge
  Locations: index.html, about/index.html, topics/software/index.html, etc.

LAYER PROJECTIONS:
  Semantic:    cognitive-navigation.spw (naming, concepts)
  HTML:        data attributes + element classes
  CSS:         visual styling + hover effects
  JS:          interactivity + state management
  Convention:  documented pattern for reuse

PHASE IN CYCLE:
  Conception:  ✓ (idea documented)
  Potential:   ✓ (design specified)
  Kinetic:     ✓ (implementation active)
  Manifest:    ✓ (deployed and working)
  Return:      (integration phase—still happening)
```

### 4. Generate Patch Metadata

```bash
/patch-consolidator generate-metadata [patch-name]
```

Creates a `.spw/patches/yyyy-mm-dd-NNN-{name}.spw` file with full semantics:

**Output:**
```spw
#>cognitive_handles_patch
#:patches #!versioning

^"metadata"{
  patch_id: "2026-04-10-001"
  date: "2026-04-10T14:30:00Z"
  operator: "^"
  phase: "expression"
  valence: "boon"
  dimension: "abstraction"
  
  summary: "Visual handles for navigating frame abstraction"
  
  files_touched: [
    "public/css/cognitive-handles.css",
    "public/js/cognitive-handles.js",
    "index.html", "about/index.html",
    ".spw/conventions/cognitive-navigation.spw"
  ]
  
  commit_hashes: ["abc1234", "def5678"]
}

^"projections"{
  idea_level: "Users understand frame depth through visual affordances"
  design_level: "Six handle types at specific positions"
  implementation_level: "CSS + JS + semantic data attributes"
  instance_level: "All frames have interactive, color-coded handles"
}

^"dependencies"{
  depends_on: []
  enables: ["dimensional-breadcrumbs", "relational-visualization"]
  complements: ["phase-indicators"]
}
```

### 5. Review & Consolidate

```bash
/patch-consolidator review [patch-name]
```

Shows:
- All changes in the patch
- Projection coverage (is every slice represented?)
- Dependencies (does this patch complete an idea?)
- Suggested git add commands to stage the patch

### 6. Commit with Semantics

```bash
/patch-consolidator commit [patch-name] --message "description"
```

Stages all files for the patch and commits with Spw semantics:

**Commit message format:**
```
#[operator] — patch-name (short description)

Projections:
  Idea: Core concept or observation
  Design: Architectural choices
  Implementation: Code, styles, scripts
  Instance: Where this manifests

Operator: ^ (frame)
Phase: expression
Valence: boon
Dimension: abstraction
Depends: []
Enables: [dimensional-breadcrumbs]
```

## Options

```
--analyze              Show current changes grouped by semantics
--suggest-clusters    Recommend patch consolidation
--projections [op]    Show how a change manifests across dimensions
--generate-metadata   Create patch metadata file
--review [patch]      Review patch before committing
--commit [patch]      Stage and commit as semantic patch
--phase [phase]       Filter by spirit phase
--operator [op]       Filter by Spw operator
--detailed            Show file-by-file projections
--dry-run             Show what would happen without changes
```

## Integration

- **Git hooks:** Pre-commit hook can suggest consolidation based on staged files
- **Settings:** Semantic density setting controls clustering granularity
- **Electromagnetic containers:** Each patch treated as a container with charge state = manifestation phase
- **Spirit cycles:** Consolidation aligned with spirit cycle phases
- **Cognitive handles:** Navigate patch history like navigating frames

## Example Session

```bash
# 1. See what you've been working on
$ /patch-consolidator analyze

# 2. Get suggestions for grouping changes
$ /patch-consolidator suggest-clusters

# 3. Map how your changes manifest across layers
$ /patch-consolidator projections ^

# 4. Review the "cognitive-handles" patch before committing
$ /patch-consolidator review cognitive-handles

# 5. Commit with full semantic metadata
$ /patch-consolidator commit cognitive-handles \
  --message "Add visual affordances for navigating frame abstraction"

# 6. Next patch
$ /patch-consolidator analyze
```

## Benefits

✓ **Readable history** — Git log tells the story of ideas becoming real  
✓ **Discoverability** — Find patches by operator, phase, or dimension  
✓ **Reusability** — Patterns become clear and portable  
✓ **Cognitive alignment** — Consolidation follows how you actually think  
✓ **Collaboration** — Patches communicate intent, not just diffs  
✓ **Self-documenting** — Version history becomes project documentation  

## Technical Details

- Reads `git diff` and `git status`
- Infers semantic operators from file paths and content
- Groups files by service (which operator are they serving?)
- Generates Spw metadata in `.spw/patches/` directory
- Integrates with git workflow (uses `git add`, `git commit`)
- Respects `.spw/conventions/` for semantic grounding
