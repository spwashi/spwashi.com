# Fix: runtime-route-css-regressions

## Failures

| # | File | Test/Error | Class | Priority |
|---|---|---|---|---|
| 1 | public/js/site.js | Imports `./spw-visitation.js`, but no module exists | regression | P0 |
| 2 | topics/software/compilers/index.html | Route content is still compression metadata and body copy | ui-visual | P1 |
| 3 | topics/software/distributed/index.html | Route mixes distributed hero with compression metadata/body and malformed closers | ui-visual | P1 |
| 4 | topics/software/compression/index.html | Extra closing tags and missing `</article></main>` | ui-visual | P1 |
| 5 | topics/software/schedulers/index.html | Missing `</article></main>` before footer | ui-visual | P1 |

## Diagnosis

- The runtime bootstrap regressed during the visitation/image pass: `site.js` was wired to a module that never landed.
- Two new software routes were copied from `compression` and not finished, so the pathname no longer matches the surface content.
- The original long-form software routes inherited malformed HTML structure, which makes layout and CSS behavior less predictable.

## Planned Fixes

### Commit 1: `![runtime] — restore visitation bootstrap and repair software route structure`
- Add `public/js/spw-visitation.js` as the missing bootstrap module.
- Replace `topics/software/compilers/index.html` with a coherent compilers surface.
- Replace `topics/software/distributed/index.html` with a coherent distributed systems surface.
- Remove stray closers from `topics/software/compression/index.html` and restore `</article></main>`.
- Restore `</article></main>` in `topics/software/schedulers/index.html`.
- Ripple risk: medium

## Deferred

- Persona-specific projection semantics in `public/css/spw-grammar.css` are active work from another agent and are not being normalized in this fix.
- Broader CSS architecture cleanup remains deferred to the existing style/grammar planning work.
