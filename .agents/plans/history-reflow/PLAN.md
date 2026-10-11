# Plan: history-reflow

**Status 2026-10-10.** The August 2026 reflow ran and was pushed; its sequence, squash table and retrospect moved to [HISTORY.md](./HISTORY.md). This plan now holds the commit grammar, the reflow method and the rebase recipe; the last rule landed in aa1c9c48 (no operation line in bodies). No sequence is pending. Next: name what each subject symbol means on this site, gated on the creator (`wonder_history_reflow_symbols` in `wip.spw`).

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
| one row per system the commit says landed | the cheapest probe that reaches it | the count or state the claim implies |

The August table, five claims and their probes, is in [HISTORY.md](./HISTORY.md#claim-probes-used-in-august).

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
- **No `Operation: … Fixity: …` line in the body** (creator, 2026-09-27: it reads as
  noise on the line). Open with the prose. If an operation must be named, it lives
  in the `.spw` surface the change touched, not in the commit.

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
