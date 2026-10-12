# History: history-reflow

The August 2026 reflow this plan was written for. It ran, and the result was pushed.
The method, the commit grammar and the recipe stay in [PLAN.md](./PLAN.md).
Moved here 2026-10-10.

## Sequence as it stood (2026-08)

27 commits ahead of upstream, in apply order:

```
 1  &[design]      Give the paper motif a mobile role instead of switching it off
 2  &[css]         Normalize width breakpoints onto a ladder real usage already chose
 3  .[css]         Name the stylesheet ecology, and slice work so sessions can run in parallel
 4  .[conventions] Give the two unsurfaced systems a place in the tree
 5  &[skills]      Give skills an adjacent measurement cluster instead of numbers in prose
 6  &[skills]      Give every skill a generated surface, and refresh the prose alongside
 7  &[skills]      State what each skill is worth, with the evidence and the headroom
 8  &[skills]      Rewrite value as inspectable facets, and widen the walk that would have caught the rot
 9  &[components]  Rederive the surface primitives and give them named containers
10  .[conventions] Prime depth perspectives and corpus completion
11  .[conventions] Prime compound expressions — the grammar holds them, the corpus does not
12  .[conventions] Prime the component biome — why nothing here has evolved exchange
13  &[design]      Make density read as shade — canopy, understory, succession
14  &[runtime]     Make gathering pay — cauldron collection banks expression salience
15  ^seed[semantic] Join operator position to geometry — an unclaimed role is a niche
16  ^seed[language] Press an expression herbarium — verified formations, stable beside exotic
17  &[spw]         Index the corpus by its own axes, and compress a surface back into the language
18  &[philosophy]  Bring the oldest questions forward into the probeable form
19  &[theory]      Introduce forms into the component-behaviour stands, and repair four invisible surfaces
20  ^seed[spw]     Build the return pass — probe output lifted into corpus
21  &[design]      Land the material optics model and give it a surface
22  &[interface]   Wire the niche resolver into the cauldron, where its input exists
23  &[interface]   Improve what the cauldron digests — capture the nearest context, not the page's
24  &[interface]   Give a gathered fragment three slots instead of one dot-list
25  &[runtime]     Make pruning compost — the one place the cauldron shrinks now feeds something
26  .[conventions] Make the cauldron describable — metabolism, slots, weights, and what an editor writes
27  &[design]      Give the design hub an interior, and return nine off-ladder shells to the ladder
```

## Target sequence

**27 → 21.** Six squashes, each joining work that revised itself within one
session. Nothing is squashed merely for being adjacent.

| keep | squash into it | why |
|---|---|---|
| 5 skills measurement cluster | 6 generated surface | one act: skills gain adjacent structure |
| 7 what each skill is worth | 8 rewrite as facets + widen walk | 8 rewrites 7's own output; the facet form is the settled one |
| 10 depth perspectives | 11 compound expressions, 12 component biome | three primes, one operation, one landing |
| 18 philosophy forward | 19 theory stands | both bring old surfaces into the probeable form |
| 22 niche resolver | 23 cauldron digestion | see *Retrospect* — 22 shrinks to a note inside 23 |
| 24 three slots | 25 compost | both are cauldron metabolism; 26 states them |

All other commits stand alone.

## Retrospect — theory applied at each step

Each of these is understanding that arrived **after** the commit it belongs to,
and the rewritten message carried it.

1. **Canopy and material are one model.** Commit 13 ships canopy and commit 21
   ships material optics; neither knows about the other. The settled statement is
   `&incomplete_alone: canopy ^ material` — canopy says how much light arrives,
   material says what the surface does with it. Both messages should say so.

2. **Operator spaces was built ahead of its input.** Commit 15 introduces it and
   commit 22 wires it, and the honest finding is that 1 of 461 authored
   expressions yields an operator at all. It is low value and should **shrink,
   not grow**: fold it into the cauldron digestion commit as a supporting note
   rather than giving it two commits of its own.

3. **Three measurements converge on one absence.** Zero of 461 expressions use
   `^` lift; philosophy sat 126 days stale while caches were one day old; the
   attention field has sources and gradients and no sink. Commit 20 builds the
   return pass — its message should name all three, because that convergence is
   what justifies it.

4. **Fixity carries two senses.** Surface settledness (`fixed | stable | tending
   | experimental`) and operator position (`prefix | infix | postfix`). Commits
   touching either should say which they mean. `position` is already returned by
   `splitOperatorExpression` and was being discarded.

5. **The ladder is a distance calculation.** Commit 27 maps off-ladder liminality
   values; the reason is that an unordered value has no distance, which is why
   the ladder is not widened. That reasoning applies retroactively to the
   arrival work and should be stated where the bands are first defined.

6. **The dot was carrying six relations.** Commit 24 splits the expression into
   three slots. The general form — one separator standing in for several
   distinct relations — is the same failure as the `fixity` collision, and worth
   naming once as a pattern rather than twice as incidents.

## Claim probes used in August

| claim | probe | expected |
|---|---|---|
| canopy shades density | grid containers with 6+ children | ≥1, else canopy is inert |
| arrival discharges | `npm run reasons` conductive count | >0 |
| expressions resonate | manifest entry count vs authored HTML | equal, else stale manifest |
| material tokens used | `var(--material-` consumers | >0 per token, or record the unconsumed |
| skill surfaces resolve | `npm run spw:integrity` | all citations resolve |

## Appendix: the August run's brief

Moved from `BRIEF.md` on 2026-10-12. It was the hand-off for the 28-commit reflow, which ran in August; its "target sequence" and "retrospect items" are the sections above.

### Read, in this order

1. `.agents/plans/history-reflow/PLAN.md` — target sequence, retrospect items,
   per-step probes, recovery. Everything operational is there.
2. `git log --oneline @{u}..HEAD` — the 28 commits you are reshaping.
3. `.spw/conventions/skill-invocation.spw#rigor` — the six rules the messages
   must hold to. `#measurement_before_invariant` is the one that matters most.

Nothing else is required reading. Skim `.spw/caches/delegation-parcels-2026-08.spw`
only to confirm no other parcel claims the files you touch.

### Do

Reshape the unpushed history so each commit states the settled understanding
rather than the path taken to it. Squash where a commit revised its own earlier
work. Audit the markup against each commit's claim, and where the markup does not
back the claim, either add it at that step or say so in the message.

The end tree must be byte-identical unless an audit finding changed it.

### Prune self-referentiality

The current messages talk about themselves too much: 7 uses of "this session",
5 of "the pass", 3 first-person. Remove all of it.

- **Cut** references to sessions, passes, agents, models, or who did the work.
- **Cut** narration of what was tried and abandoned. State what is true now.
- **Cut** meta-commentary about the commit being a commit.
- **Keep** measurements, probes, refusals, and the reason a choice was made.

Test: if a sentence would not survive being read a year from now by someone who
was not there, it is self-reference. A number with its probe survives. "This pass
found…" does not.

The same applies to `.spw` surfaces you touch. A convention describing the corpus
is fine; a convention describing the writing of itself is not.

### Do not

- Reference commit hashes in `.spw` or in plans — they do not survive the rebase.
- `git stash` in this tree. Other sessions lose work that way.
- Squash for count. Coherence is the metric.
- Hand-edit generated files — regenerate with `npm run manifest`,
  `spw:dimensions`, `spw-precipitate`.

### Verify

`node scripts/check-site.mjs` after every step. At the end:

```bash
npm run spw:integrity
git diff prereflow-backup HEAD --stat   # empty, or explained by audit findings
```

Recovery: `git rebase --abort`, or `git reset --hard prereflow-backup`.
