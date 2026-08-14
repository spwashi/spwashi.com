# Plan: history-reflow

## Public Goal

Rewrite the unpushed sequence so each commit reads as though we knew then what we
know now — theory applied with retrospect, churn squashed, and the HTML audited
at each step for whether the markup actually backs the claim the commit makes.

This is **not** a mechanical squash. A mechanical squash reduces commit count and
leaves every commit still narrating the path it wandered. The goal is that each
surviving commit states the settled understanding, and that the tree at each step
is one a reader could check.

The end state must be byte-identical to the start. Only messages, boundaries and
— where the audit finds a gap — additional markup change.

## Identification

Commits are named by **subject line**, never by hash. Hashes do not survive the
first rebase step, so any plan that references them invalidates itself as it runs.

Establish a safety anchor before touching anything:

```bash
git tag -f prereflow-backup HEAD
git rev-parse HEAD^{tree} > /tmp/prereflow.tree
```

Recovery at any point: `git rebase --abort`, or `git reset --hard prereflow-backup`.

## Preconditions

1. **Clean working tree.** A rebase refuses otherwise.
2. **Never `git stash` in this tree** — concurrent sessions lose work that way.
   If the tree is dirty, land it as its own commit first or wait.
3. No other session is mid-rebase.

## Current sequence

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

## Retrospect — theory to apply at each step

The point of the pass. Each of these is understanding that arrived **after** the
commit it belongs to, and the rewritten message should carry it.

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

## HTML audit at each step

Before rewording a commit, check the claim against the markup **at that commit**.
This is where the pass earns its keep: several commits state a system landed
without checking anything reaches it.

For each commit, from its own checkout:

```bash
git checkout <commit> -- . 2>/dev/null   # or rebase --edit-todo stop point
node scripts/check-site.mjs
```

Then the claim-specific probe:

| claim | probe | expected |
|---|---|---|
| canopy shades density | grid containers with 6+ children | ≥1, else canopy is inert |
| arrival discharges | `npm run reasons` conductive count | >0 |
| expressions resonate | manifest entry count vs authored HTML | equal, else stale manifest |
| material tokens used | `var(--material-` consumers | >0 per token, or record the unconsumed |
| skill surfaces resolve | `npm run spw:integrity` | all citations resolve |

**If a probe fails at a step, that is a finding, not a blocker.** Record it in the
rewritten message rather than quietly fixing it — a commit that claims more than
it delivered is exactly what this pass exists to correct.

Where the audit shows markup *should* have changed and did not, applying it is in
scope. Prefer adding the missing markup at the step that claimed it over leaving
a commit that overstates.

## Message discipline

- **Keep every `*verify*` line absorbed by a squash.** Each states a measurement
  and the date it was true. Losing them loses the evidence.
- **One `#[episode]{}` per commit**, with `~[scene]{}`, `![change]{}`, `*[verify]{}`.
- **No archaeology.** Do not narrate what was tried and abandoned; state the
  settled understanding. Prune orphaned excuses.
- **No references to sessions, agents, or hashes.** The history is the product,
  not a record of who produced it.
- Subject: `symbol[category] imperative subject`, under ~72 chars.

## Execution

Interactive flags are unavailable in some harnesses. Drive non-interactively:

```bash
GIT_SEQUENCE_EDITOR="sed -i '' -E 's/^pick (<sha7> .*)/squash \1/'" \
GIT_EDITOR="cp /tmp/reflow/msgN.txt" \
git rebase -i <base>
```

Compose messages to files first. The editor is invoked once per reword or squash
group, in apply order, so a counter-based dispenser is required when several
groups are handled in one rebase. Doing one squash per rebase is slower and far
easier to verify — prefer it.

## Verification

After every step:

```bash
node scripts/check-site.mjs
```

At the end, the tree must be identical **unless** the audit added markup:

```bash
test "$(git rev-parse HEAD^{tree})" = "$(cat /tmp/prereflow.tree)" \
  && echo "tree identical" || git diff prereflow-backup HEAD --stat
```

A non-empty diff is acceptable only if every file in it was changed by a
documented audit finding. Anything else means content was lost.

Then:

```bash
npm run spw:integrity     # all citations resolve
npm run reasons           # conductive count unchanged or improved
node scripts/spw-precipitate.mjs   # deltas against the last precipitate
git log --oneline @{u}..HEAD
```

## Stop conditions

- Tree differs and the difference is not explained by a recorded audit finding.
- `check-site` fails at any step and the failure is not the finding being recorded.
- More than two rebase conflicts in a single squash — the boundary is wrong;
  re-slice rather than resolve.
- The rewritten sequence exceeds the original count.

## Not in scope

- Squashing commits that stand alone. Count is not the metric; coherence is.
- Changing generated artifacts by hand — regenerate them (`npm run manifest`,
  `spw:dimensions`, `spw-precipitate`) or leave them.
- Pushing. This plan ends with a reviewable local history.
