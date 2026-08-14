# Brief — history reflow

## Read, in this order

1. `.agents/plans/history-reflow/PLAN.md` — target sequence, retrospect items,
   per-step probes, recovery. Everything operational is there.
2. `git log --oneline @{u}..HEAD` — the 28 commits you are reshaping.
3. `.spw/conventions/skill-invocation.spw#rigor` — the six rules the messages
   must hold to. `#measurement_before_invariant` is the one that matters most.

Nothing else is required reading. Skim `.spw/caches/delegation-parcels-2026-08.spw`
only to confirm no other parcel claims the files you touch.

## Do

Reshape the unpushed history so each commit states the settled understanding
rather than the path taken to it. Squash where a commit revised its own earlier
work. Audit the markup against each commit's claim, and where the markup does not
back the claim, either add it at that step or say so in the message.

The end tree must be byte-identical unless an audit finding changed it.

## Prune self-referentiality

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

## Do not

- Reference commit hashes in `.spw` or in plans — they do not survive the rebase.
- `git stash` in this tree. Other sessions lose work that way.
- Squash for count. Coherence is the metric.
- Hand-edit generated files — regenerate with `npm run manifest`,
  `spw:dimensions`, `spw-precipitate`.

## Verify

`node scripts/check-site.mjs` after every step. At the end:

```bash
npm run spw:integrity
git diff prereflow-backup HEAD --stat   # empty, or explained by audit findings
```

Recovery: `git rebase --abort`, or `git reset --hard prereflow-backup`.
