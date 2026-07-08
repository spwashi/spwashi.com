# Standalone JavaScript Script Audit

Date: 2026-07-07
Operation: audit
Scope: every `public/js/**/*.js` file, evaluated as if its file boundary had to stand alone.

This audit is heuristic. It does not claim a file can run without its imports or browser APIs. It asks whether the file has a coherent standalone responsibility, predictable side effects, and a clear next maintenance move.

## Grade Legend

- A: clean standalone boundary; portable, declarative, or tightly scoped.
- B: bounded feature script; local DOM/runtime assumptions are acceptable.
- C: mixed boundary; keep behavior, but extract repeated primitives or clarify ownership when touched.
- D: overloaded boundary; split before adding substantial new behavior.
- G: generated typed output; regenerate from `public/ts`, do not hand-edit.

## Summary

- Files audited: 189
- A clean: 87
- B bounded: 59
- C mixed: 25
- D overloaded: 11
- G generated: 7

## Priority Queue

These are the files whose standalone boundary is weakest. Treat this as a queue for the next time nearby behavior changes, not as a mandate to refactor everything at once.

| Grade | File | Evidence | First move |
| --- | --- | --- | --- |
| D | `public/js/runtime/shell-disclosure.js` | 2284 lines, 5 imports, 32 event refs, 0 storage refs, 66 direct dataset writes | Split measurement, disclosure state, and utility controls. |
| D | `public/js/runtime/experiential.js` | 2185 lines, 7 imports, 50 event refs, 0 storage refs, 53 direct dataset writes | Split breadcrumb, sample dock, memos, and learning/bookmarks. |
| D | `public/js/kernel/site-settings-engine.js` | 1336 lines, 9 imports, 14 event refs, 10 storage refs, 16 direct dataset writes | Move JSON storage reads/writes behind shared storage helpers. |
| D | `public/js/interface/composition.js` | 1242 lines, 10 imports, 15 event refs, 4 storage refs, 39 direct dataset writes | Split cauldron storage/rendering/actions from capture and reward feedback. |
| D | `public/js/kernel/site-settings-ui.js` | 1238 lines, 7 imports, 24 event refs, 0 storage refs, 30 direct dataset writes | Prefer kernel/dom-contracts dataset writers for projection state. |
| D | `public/js/modules/design/experiments.js` | 1229 lines, 3 imports, 13 event refs, 3 storage refs, 68 direct dataset writes | Split route labs by variable/rule/material/ecology ownership. |
| D | `public/js/interface/haptics.js` | 1169 lines, 4 imports, 22 event refs, 6 storage refs, 57 direct dataset writes | Extract grounding storage/checkpoints from gesture behavior. |
| D | `public/js/modules/rpg-wednesday/index.js` | 1163 lines, 12 imports, 18 event refs, 0 storage refs, 14 direct dataset writes | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| D | `public/js/interface/state-inspector.js` | 1104 lines, 2 imports, 14 event refs, 3 storage refs, 72 direct dataset writes | Rename/split satchel chrome from state serialization/actions. |
| D | `public/js/media/image-metaphysics.js` | 987 lines, 3 imports, 27 event refs, 6 storage refs, 87 direct dataset writes | Extract prompt/visit storage and image controls. |
| D | `public/js/interface/contextual-ui.js` | 726 lines, 3 imports, 15 event refs, 0 storage refs, 48 direct dataset writes | Split route discovery, nav fit, and contextual annotations. |

## Mixed Boundary Watchlist

| Grade | File | Evidence | First move |
| --- | --- | --- | --- |
| C | `public/js/runtime/module-catalog.js` | 1806 lines, 2 imports, 0 event refs, 1 storage refs, 0 direct dataset writes | Consider generated/typed module-def registry later. |
| C | `public/js/modules/math/diagrams.js` | 1625 lines, 0 imports, 18 event refs, 0 storage refs, 7 direct dataset writes | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| C | `public/js/semantic/pretext-physics.js` | 1476 lines, 3 imports, 4 event refs, 0 storage refs, 22 direct dataset writes | Prefer kernel/dom-contracts dataset writers for projection state. |
| C | `public/js/runtime/module-loader.js` | 1403 lines, 5 imports, 13 event refs, 0 storage refs, 0 direct dataset writes | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| C | `public/js/kernel/instrumentation.js` | 1330 lines, 1 imports, 0 event refs, 0 storage refs, 15 direct dataset writes | Prefer kernel/dom-contracts dataset writers for projection state. |
| C | `public/js/runtime/page-anatomy.js` | 1139 lines, 2 imports, 17 event refs, 2 storage refs, 11 direct dataset writes | Move JSON storage reads/writes behind shared storage helpers. |
| C | `public/js/runtime/brace-gestures.js` | 1132 lines, 4 imports, 11 event refs, 0 storage refs, 14 direct dataset writes | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| C | `public/js/semantic/component-semantics.js` | 1098 lines, 6 imports, 2 event refs, 0 storage refs, 2 direct dataset writes | Mark as refactor candidate when touched next. |
| C | `public/js/runtime/region-menu.js` | 1061 lines, 4 imports, 15 event refs, 0 storage refs, 26 direct dataset writes | Prefer kernel/dom-contracts dataset writers for projection state. |
| C | `public/js/site.js` | 1035 lines, 13 imports, 4 event refs, 0 storage refs, 11 direct dataset writes | Keep as boot shell; extract only policy/helper seams. |
| C | `public/js/runtime/attention/section-handle.js` | 1016 lines, 4 imports, 8 event refs, 0 storage refs, 8 direct dataset writes | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| C | `public/js/interface/discovery-notices.js` | 939 lines, 3 imports, 19 event refs, 4 storage refs, 25 direct dataset writes | Move JSON storage reads/writes behind shared storage helpers. |
| C | `public/js/runtime/state-inspector.js` | 930 lines, 3 imports, 18 event refs, 0 storage refs, 28 direct dataset writes | Rename as state-block inspector; keep per-component mutation isolated. |
| C | `public/js/runtime/spells.js` | 909 lines, 7 imports, 12 event refs, 3 storage refs, 21 direct dataset writes | Move JSON storage reads/writes behind shared storage helpers. |
| C | `public/js/modules/services/configurator.js` | 771 lines, 2 imports, 15 event refs, 0 storage refs, 18 direct dataset writes | Prefer kernel/dom-contracts dataset writers for projection state. |
| C | `public/js/interface/semantic-chrome.js` | 763 lines, 3 imports, 12 event refs, 0 storage refs, 21 direct dataset writes | Prefer kernel/dom-contracts dataset writers for projection state. |
| C | `public/js/interface/console.js` | 756 lines, 5 imports, 21 event refs, 2 storage refs, 14 direct dataset writes | Move JSON storage reads/writes behind shared storage helpers. |
| C | `public/js/runtime/page-state.js` | 707 lines, 1 imports, 13 event refs, 3 storage refs, 30 direct dataset writes | Move JSON storage reads/writes behind shared storage helpers. |
| C | `public/js/semantic/narrative-instrumentation.js` | 701 lines, 2 imports, 9 event refs, 0 storage refs, 20 direct dataset writes | Prefer kernel/dom-contracts dataset writers for projection state. |
| C | `public/js/modules/widgets/boonhonk-mixer.js` | 675 lines, 0 imports, 8 event refs, 4 storage refs, 23 direct dataset writes | Move JSON storage reads/writes behind shared storage helpers. |
| C | `public/js/modules/profile/tool.js` | 655 lines, 1 imports, 21 event refs, 2 storage refs, 6 direct dataset writes | Move JSON storage reads/writes behind shared storage helpers. |
| C | `public/js/modules/tools/budgeting.js` | 639 lines, 0 imports, 17 event refs, 4 storage refs, 19 direct dataset writes | Move JSON storage reads/writes behind shared storage helpers. |
| C | `public/js/modules/blog/specimens.js` | 507 lines, 0 imports, 16 event refs, 0 storage refs, 2 direct dataset writes | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| C | `public/js/modules/cards/seed-card.js` | 499 lines, 0 imports, 8 event refs, 5 storage refs, 10 direct dataset writes | Move JSON storage reads/writes behind shared storage helpers. |
| C | `public/js/runtime/pwa-update-handler.js` | 487 lines, 2 imports, 10 event refs, 7 storage refs, 1 direct dataset writes | Move JSON storage reads/writes behind shared storage helpers. |

## Per-File Register

| Grade | File | Role | Metrics | Boundary read | Next action |
| --- | --- | --- | --- | --- | --- |
| B | `public/js/compose.js` | portable-entry | L303 I0/0 E0 S0 D0 Q0 | portable export facade; watch fan-out as composition surface grows | Keep local; avoid growing cross-feature responsibilities. |
| A | `public/js/interface/accent-palette.js` | interface | L430 I2/4 E2 S0 D0 Q5 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| B | `public/js/interface/arc-lifecycle.js` | interface | L112 I1/1 E5 S0 D13 Q4 | bounded feature script; standalone with local DOM/runtime assumptions | Keep local; avoid growing cross-feature responsibilities. |
| B | `public/js/interface/canvas-accents.js` | interface | L733 I3/1 E7 S0 D0 Q2 | bounded feature script; standalone with local DOM/runtime assumptions | Keep local; avoid growing cross-feature responsibilities. |
| B | `public/js/interface/cauldron/chrome.js` | interface | L148 I5/1 E4 S0 D12 Q11 | bounded feature script; standalone with local DOM/runtime assumptions | Keep local; avoid growing cross-feature responsibilities. |
| A | `public/js/interface/cauldron/contract.js` | interface | L168 I0/6 E0 S0 D1 Q2 | portable or declarative; standalone boundary is clean | Leave alone except normal maintenance. |
| A | `public/js/interface/cauldron/helpers.js` | interface | L29 I0/2 E0 S0 D0 Q0 | portable or declarative; standalone boundary is clean | Leave alone except normal maintenance. |
| B | `public/js/interface/cauldron/resonance.js` | interface | L187 I1/2 E0 S0 D32 Q6 | bounded feature script; standalone with local DOM/runtime assumptions | Prefer kernel/dom-contracts dataset writers for projection state. |
| A | `public/js/interface/cauldron/storage.js` | interface | L66 I3/2 E0 S1 D0 Q0 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/interface/cauldron/trace.js` | interface | L14 I0/1 E0 S0 D0 Q0 | portable or declarative; standalone boundary is clean | Leave alone except normal maintenance. |
| A | `public/js/interface/cauldron/undo.js` | interface | L20 I0/1 E0 S0 D0 Q0 | portable or declarative; standalone boundary is clean | Leave alone except normal maintenance. |
| D | `public/js/interface/composition.js` | interface | L1242 I10/0 E15 S4 D39 Q56 | overloaded standalone boundary; split responsibilities before adding behavior | Split cauldron storage/rendering/actions from capture and reward feedback. |
| C | `public/js/interface/console.js` | interface | L756 I5/0 E21 S2 D14 Q9 | mixed boundary; keep behavior but extract repeated primitives | Move JSON storage reads/writes behind shared storage helpers. |
| D | `public/js/interface/contextual-ui.js` | interface | L726 I3/0 E15 S0 D48 Q44 | overloaded standalone boundary; split responsibilities before adding behavior | Split route discovery, nav fit, and contextual annotations. |
| A | `public/js/interface/developmental-climate.js` | interface | L577 I2/0 E5 S0 D8 Q7 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| C | `public/js/interface/discovery-notices.js` | interface | L939 I3/0 E19 S4 D25 Q15 | mixed boundary; keep behavior but extract repeated primitives | Move JSON storage reads/writes behind shared storage helpers. |
| B | `public/js/interface/guide-badge.js` | interface | L518 I2/0 E7 S3 D24 Q6 | bounded feature script; standalone with local DOM/runtime assumptions | Move JSON storage reads/writes behind shared storage helpers. |
| B | `public/js/interface/guide.js` | interface | L173 I3/0 E2 S0 D12 Q6 | bounded feature script; standalone with local DOM/runtime assumptions | Keep local; avoid growing cross-feature responsibilities. |
| D | `public/js/interface/haptics.js` | interface | L1169 I4/6 E22 S6 D57 Q18 | overloaded standalone boundary; split responsibilities before adding behavior | Extract grounding storage/checkpoints from gesture behavior. |
| B | `public/js/interface/image-discovery-rewards.js` | interface | L134 I1/0 E5 S2 D3 Q5 | bounded feature script; standalone with local DOM/runtime assumptions | Move JSON storage reads/writes behind shared storage helpers. |
| A | `public/js/interface/local-memory-controls.js` | interface | L78 I1/0 E2 S0 D5 Q4 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| B | `public/js/interface/local-notes.js` | interface | L354 I0/0 E5 S3 D2 Q17 | bounded feature script; standalone with local DOM/runtime assumptions | Move JSON storage reads/writes behind shared storage helpers. |
| B | `public/js/interface/logo-runtime.js` | interface | L155 I1/0 E8 S0 D4 Q3 | bounded feature script; standalone with local DOM/runtime assumptions | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| A | `public/js/interface/palette-resonance.js` | interface | L76 I0/4 E0 S0 D0 Q0 | portable or declarative; standalone boundary is clean | Leave alone except normal maintenance. |
| A | `public/js/interface/persona-selector.js` | interface | L88 I2/1 E2 S0 D4 Q2 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| B | `public/js/interface/personas.js` | interface | L117 I4/0 E3 S2 D1 Q0 | bounded feature script; standalone with local DOM/runtime assumptions | Move JSON storage reads/writes behind shared storage helpers. |
| B | `public/js/interface/prompt-utils.js` | interface | L939 I3/0 E6 S1 D26 Q22 | bounded feature script; standalone with local DOM/runtime assumptions | Prefer kernel/dom-contracts dataset writers for projection state. |
| A | `public/js/interface/pronunciation.js` | interface | L90 I3/0 E0 S0 D0 Q0 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| C | `public/js/interface/semantic-chrome.js` | interface | L763 I3/0 E12 S0 D21 Q5 | mixed boundary; keep behavior but extract repeated primitives | Prefer kernel/dom-contracts dataset writers for projection state. |
| D | `public/js/interface/state-inspector.js` | interface | L1104 I2/0 E14 S3 D72 Q27 | overloaded standalone boundary; split responsibilities before adding behavior | Rename/split satchel chrome from state serialization/actions. |
| B | `public/js/interface/topic-discovery.js` | interface | L402 I2/0 E15 S0 D0 Q20 | bounded feature script; standalone with local DOM/runtime assumptions | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| B | `public/js/interface/wonder-memory.js` | interface | L259 I2/2 E0 S0 D32 Q5 | bounded feature script; standalone with local DOM/runtime assumptions | Prefer kernel/dom-contracts dataset writers for projection state. |
| A | `public/js/kernel/bus.js` | kernel | L3 I0/54 E0 S0 D0 Q0 | portable or declarative; standalone boundary is clean | Leave alone except normal maintenance. |
| A | `public/js/kernel/copy.js` | kernel | L124 I2/1 E2 S0 D0 Q0 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/kernel/core.js` | kernel | L86 I3/1 E1 S0 D2 Q2 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/kernel/dom-contracts.js` | kernel | L1419 I1/58 E2 S0 D2 Q8 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/kernel/dom-render.js` | kernel | L402 I2/6 E2 S0 D3 Q0 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/kernel/feed-utils.js` | kernel | L1 I0/2 E0 S0 D0 Q0 | portable or declarative; standalone boundary is clean | Leave alone except normal maintenance. |
| B | `public/js/kernel/hydration.js` | kernel | L156 I0/2 E2 S0 D14 Q0 | bounded feature script; standalone with local DOM/runtime assumptions | Keep local; avoid growing cross-feature responsibilities. |
| C | `public/js/kernel/instrumentation.js` | kernel | L1330 I1/16 E0 S0 D15 Q1 | mixed boundary; keep behavior but extract repeated primitives | Prefer kernel/dom-contracts dataset writers for projection state. |
| A | `public/js/kernel/page-metadata.js` | kernel | L1384 I2/1 E0 S0 D1 Q18 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/kernel/query-composer.js` | kernel | L142 I0/5 E0 S0 D0 Q0 | portable or declarative; standalone boundary is clean | Leave alone except normal maintenance. |
| A | `public/js/kernel/runtime-environment.js` | kernel | L2 I0/3 E0 S0 D0 Q0 | portable or declarative; standalone boundary is clean | Leave alone except normal maintenance. |
| A | `public/js/kernel/settings-query-parity.js` | kernel | L216 I2/3 E0 S0 D0 Q0 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| B | `public/js/kernel/shared.js` | kernel | L1992 I1/29 E6 S0 D6 Q2 | bounded feature script; standalone with local DOM/runtime assumptions | Split operator registry, token/climate, and event helpers carefully. |
| D | `public/js/kernel/site-settings-engine.js` | kernel | L1336 I9/2 E14 S10 D16 Q3 | overloaded standalone boundary; split responsibilities before adding behavior | Move JSON storage reads/writes behind shared storage helpers. |
| A | `public/js/kernel/site-settings-profiles.js` | kernel | L1303 I2/5 E0 S0 D0 Q0 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| D | `public/js/kernel/site-settings-ui.js` | kernel | L1238 I7/1 E24 S0 D30 Q38 | overloaded standalone boundary; split responsibilities before adding behavior | Prefer kernel/dom-contracts dataset writers for projection state. |
| A | `public/js/kernel/site-settings.js` | kernel | L92 I4/16 E0 S0 D0 Q0 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/kernel/states.js` | kernel | L121 I1/0 E1 S0 D8 Q4 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| D | `public/js/media/image-metaphysics.js` | media | L987 I3/0 E27 S6 D87 Q28 | overloaded standalone boundary; split responsibilities before adding behavior | Extract prompt/visit storage and image controls. |
| A | `public/js/media/image-store.js` | media | L102 I0/3 E0 S1 D0 Q0 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/media/svg-filters.js` | media | L237 I1/0 E0 S0 D0 Q0 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| B | `public/js/media/svg-tunability.js` | media | L540 I2/0 E6 S0 D2 Q4 | bounded feature script; standalone with local DOM/runtime assumptions | Keep local; avoid growing cross-feature responsibilities. |
| B | `public/js/modules/blog/attn-register.js` | modules | L538 I0/0 E7 S2 D2 Q10 | bounded feature script; standalone with local DOM/runtime assumptions | Move JSON storage reads/writes behind shared storage helpers. |
| A | `public/js/modules/blog/interpreter.js` | modules | L356 I0/0 E5 S0 D8 Q2 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| C | `public/js/modules/blog/specimens.js` | modules | L507 I0/0 E16 S0 D2 Q29 | mixed boundary; keep behavior but extract repeated primitives | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| B | `public/js/modules/cards/payment-card.js` | modules | L295 I0/0 E8 S3 D9 Q8 | bounded feature script; standalone with local DOM/runtime assumptions | Move JSON storage reads/writes behind shared storage helpers. |
| C | `public/js/modules/cards/seed-card.js` | modules | L499 I0/0 E8 S5 D10 Q30 | mixed boundary; keep behavior but extract repeated primitives | Move JSON storage reads/writes behind shared storage helpers. |
| D | `public/js/modules/design/experiments.js` | modules | L1229 I3/0 E13 S3 D68 Q45 | overloaded standalone boundary; split responsibilities before adding behavior | Split route labs by variable/rule/material/ecology ownership. |
| B | `public/js/modules/design/review-surfaces.js` | modules | L348 I0/0 E4 S0 D11 Q5 | bounded feature script; standalone with local DOM/runtime assumptions | Keep local; avoid growing cross-feature responsibilities. |
| A | `public/js/modules/design/typography-measurement-preview.js` | modules | L169 I1/0 E5 S0 D4 Q10 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| B | `public/js/modules/effects/electromagnetic-containers.js` | modules | L342 I1/0 E15 S0 D8 Q3 | bounded feature script; standalone with local DOM/runtime assumptions | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| A | `public/js/modules/home/section-index.js` | modules | L185 I0/0 E4 S0 D3 Q6 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| C | `public/js/modules/math/diagrams.js` | modules | L1625 I0/0 E18 S0 D7 Q2 | mixed boundary; keep behavior but extract repeated primitives | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| B | `public/js/modules/media/cauldron.js` | modules | L287 I0/0 E7 S0 D1 Q12 | bounded feature script; standalone with local DOM/runtime assumptions | Keep local; avoid growing cross-feature responsibilities. |
| A | `public/js/modules/profile/builder.js` | modules | L161 I0/1 E0 S0 D0 Q0 | portable or declarative; standalone boundary is clean | Leave alone except normal maintenance. |
| C | `public/js/modules/profile/tool.js` | modules | L655 I1/0 E21 S2 D6 Q37 | mixed boundary; keep behavior but extract repeated primitives | Move JSON storage reads/writes behind shared storage helpers. |
| B | `public/js/modules/rpg-wednesday/asset-atlas.js` | modules | L762 I3/1 E12 S0 D1 Q2 | bounded feature script; standalone with local DOM/runtime assumptions | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| B | `public/js/modules/rpg-wednesday/character-lab.js` | modules | L604 I4/1 E7 S0 D10 Q1 | bounded feature script; standalone with local DOM/runtime assumptions | Keep local; avoid growing cross-feature responsibilities. |
| A | `public/js/modules/rpg-wednesday/contract.js` | modules | L51 I0/5 E2 S0 D0 Q0 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/modules/rpg-wednesday/curate.js` | modules | L266 I3/1 E1 S0 D4 Q4 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/modules/rpg-wednesday/dom.js` | modules | L78 I2/6 E0 S0 D0 Q0 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| D | `public/js/modules/rpg-wednesday/index.js` | modules | L1163 I12/0 E18 S0 D14 Q15 | overloaded standalone boundary; split responsibilities before adding behavior | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| B | `public/js/modules/rpg-wednesday/language-evolution.js` | modules | L517 I4/1 E10 S0 D12 Q2 | bounded feature script; standalone with local DOM/runtime assumptions | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| A | `public/js/modules/rpg-wednesday/shortcuts.js` | modules | L125 I0/1 E1 S0 D0 Q1 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| B | `public/js/modules/rpg-wednesday/state.js` | modules | L631 I1/6 E0 S24 D0 Q0 | bounded feature script; standalone with local DOM/runtime assumptions | Move JSON storage reads/writes behind shared storage helpers. |
| B | `public/js/modules/rpg-wednesday/world-lab.js` | modules | L412 I3/1 E8 S0 D10 Q1 | bounded feature script; standalone with local DOM/runtime assumptions | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| B | `public/js/modules/services/care-intake.js` | modules | L327 I0/0 E3 S4 D0 Q14 | bounded feature script; standalone with local DOM/runtime assumptions | Move JSON storage reads/writes behind shared storage helpers. |
| C | `public/js/modules/services/configurator.js` | modules | L771 I2/0 E15 S0 D18 Q6 | mixed boundary; keep behavior but extract repeated primitives | Prefer kernel/dom-contracts dataset writers for projection state. |
| C | `public/js/modules/tools/budgeting.js` | modules | L639 I0/0 E17 S4 D19 Q2 | mixed boundary; keep behavior but extract repeated primitives | Move JSON storage reads/writes behind shared storage helpers. |
| C | `public/js/modules/widgets/boonhonk-mixer.js` | modules | L675 I0/0 E8 S4 D23 Q1 | mixed boundary; keep behavior but extract repeated primitives | Move JSON storage reads/writes behind shared storage helpers. |
| B | `public/js/runtime/annotation-layer.js` | runtime | L410 I2/0 E14 S0 D19 Q2 | bounded feature script; standalone with local DOM/runtime assumptions | Prefer kernel/dom-contracts dataset writers for projection state. |
| A | `public/js/runtime/attention-architecture.js` | runtime | L56 I6/0 E0 S0 D1 Q1 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/runtime/attention/pinch-scale.js` | runtime | L117 I1/1 E4 S0 D0 Q1 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/runtime/attention/reading-groove.js` | runtime | L173 I1/1 E2 S0 D0 Q6 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/runtime/attention/resonance-probe.js` | runtime | L87 I1/1 E4 S0 D0 Q0 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/runtime/attention/scroll-cadence.js` | runtime | L24 I1/1 E0 S0 D0 Q0 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| C | `public/js/runtime/attention/section-handle.js` | runtime | L1016 I4/1 E8 S0 D8 Q33 | mixed boundary; keep behavior but extract repeated primitives | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| A | `public/js/runtime/attention/shared.js` | runtime | L182 I1/7 E0 S0 D0 Q0 | bounded module; reusable with low side-effect pressure | Split operator registry, token/climate, and event helpers carefully. |
| A | `public/js/runtime/behavior-scopes.js` | runtime | L31 I0/0 E0 S0 D0 Q0 | portable or declarative; standalone boundary is clean | Leave alone except normal maintenance. |
| B | `public/js/runtime/brace-actions.js` | runtime | L184 I1/0 E6 S0 D6 Q6 | bounded feature script; standalone with local DOM/runtime assumptions | Keep local; avoid growing cross-feature responsibilities. |
| C | `public/js/runtime/brace-gestures.js` | runtime | L1132 I4/0 E11 S0 D14 Q13 | mixed boundary; keep behavior but extract repeated primitives | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| A | `public/js/runtime/brace-pivots.js` | runtime | L144 I3/0 E3 S0 D3 Q5 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/runtime/charge-field.js` | runtime | L322 I3/0 E0 S0 D9 Q2 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/runtime/cognitive-state.js` | runtime | L103 I0/3 E0 S0 D0 Q0 | portable or declarative; standalone boundary is clean | Leave alone except normal maintenance. |
| B | `public/js/runtime/component-collection.js` | runtime | L294 I2/1 E3 S1 D11 Q0 | bounded feature script; standalone with local DOM/runtime assumptions | Keep local; avoid growing cross-feature responsibilities. |
| A | `public/js/runtime/composition-box-model.js` | runtime | L402 I3/2 E2 S0 D0 Q10 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/runtime/dom-sync-hub.js` | runtime | L158 I1/4 E2 S0 D0 Q0 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| B | `public/js/runtime/effect-ledger.js` | runtime | L109 I1/0 E3 S2 D1 Q0 | bounded feature script; standalone with local DOM/runtime assumptions | Move JSON storage reads/writes behind shared storage helpers. |
| D | `public/js/runtime/experiential.js` | runtime | L2185 I7/0 E50 S0 D53 Q58 | overloaded standalone boundary; split responsibilities before adding behavior | Split breadcrumb, sample dock, memos, and learning/bookmarks. |
| A | `public/js/runtime/frame-metrics.js` | runtime | L194 I1/0 E2 S0 D8 Q5 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| B | `public/js/runtime/frame-navigator.js` | runtime | L635 I3/0 E10 S0 D7 Q14 | bounded feature script; standalone with local DOM/runtime assumptions | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| B | `public/js/runtime/gate.js` | runtime | L45 I1/0 E1 S2 D1 Q0 | bounded feature script; standalone with local DOM/runtime assumptions | Move JSON storage reads/writes behind shared storage helpers. |
| A | `public/js/runtime/gesture-anatomy.js` | runtime | L184 I4/0 E1 S0 D10 Q11 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/runtime/gesture-contract.js` | runtime | L278 I2/1 E0 S0 D0 Q8 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/runtime/hydration-passes.js` | runtime | L81 I2/0 E1 S0 D3 Q0 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/runtime/ingredient-lab.js` | runtime | L82 I0/0 E1 S0 D7 Q5 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/runtime/interaction-loop.js` | runtime | L114 I0/3 E2 S0 D0 Q0 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| B | `public/js/runtime/interaction-progression.js` | runtime | L309 I2/0 E14 S0 D6 Q12 | bounded feature script; standalone with local DOM/runtime assumptions | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| A | `public/js/runtime/interaction-vocabulary.js` | runtime | L107 I0/2 E0 S0 D0 Q0 | portable or declarative; standalone boundary is clean | Leave alone except normal maintenance. |
| B | `public/js/runtime/interactive-medium.js` | runtime | L382 I1/0 E10 S0 D0 Q5 | bounded feature script; standalone with local DOM/runtime assumptions | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| A | `public/js/runtime/layout-assumptions.js` | runtime | L372 I2/0 E1 S0 D4 Q11 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/runtime/layout-shift-audit.js` | runtime | L577 I2/0 E5 S0 D6 Q3 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/runtime/learnability-ledger.js` | runtime | L209 I3/0 E4 S0 D10 Q13 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| B | `public/js/runtime/lens-modes.js` | runtime | L199 I0/2 E0 S0 D19 Q1 | bounded feature script; standalone with local DOM/runtime assumptions | Prefer kernel/dom-contracts dataset writers for projection state. |
| B | `public/js/runtime/loading-ecology.js` | runtime | L461 I3/0 E9 S0 D17 Q1 | bounded feature script; standalone with local DOM/runtime assumptions | Prefer kernel/dom-contracts dataset writers for projection state. |
| C | `public/js/runtime/module-catalog.js` | runtime | L1806 I2/2 E0 S1 D0 Q3 | large registry; okay as catalog, split only by generated/typed schema | Consider generated/typed module-def registry later. |
| A | `public/js/runtime/module-effects.js` | runtime | L89 I1/0 E0 S0 D6 Q0 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| C | `public/js/runtime/module-loader.js` | runtime | L1403 I5/1 E13 S0 D0 Q2 | mixed boundary; keep behavior but extract repeated primitives | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| A | `public/js/runtime/module-updates-contract.js` | runtime | L382 I1/1 E0 S0 D0 Q0 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| B | `public/js/runtime/navigation-locomotion.js` | runtime | L145 I3/0 E6 S0 D7 Q0 | bounded feature script; standalone with local DOM/runtime assumptions | Keep local; avoid growing cross-feature responsibilities. |
| A | `public/js/runtime/navigation-spells.js` | runtime | L470 I3/0 E2 S0 D7 Q17 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/runtime/observation-beats.js` | runtime | L402 I5/0 E3 S0 D8 Q1 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| C | `public/js/runtime/page-anatomy.js` | runtime | L1139 I2/0 E17 S2 D11 Q19 | mixed boundary; keep behavior but extract repeated primitives | Move JSON storage reads/writes behind shared storage helpers. |
| A | `public/js/runtime/page-hooks.js` | runtime | L175 I1/1 E0 S0 D0 Q2 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/runtime/page-region-rail.js` | runtime | L225 I3/0 E0 S0 D7 Q10 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| C | `public/js/runtime/page-state.js` | runtime | L707 I1/3 E13 S3 D30 Q1 | mixed boundary; keep behavior but extract repeated primitives | Move JSON storage reads/writes behind shared storage helpers. |
| B | `public/js/runtime/palette-treat-discovery.js` | runtime | L409 I1/0 E14 S0 D18 Q17 | bounded feature script; standalone with local DOM/runtime assumptions | Prefer kernel/dom-contracts dataset writers for projection state. |
| B | `public/js/runtime/pin-registry.js` | runtime | L42 I0/4 E0 S3 D0 Q0 | bounded feature script; standalone with local DOM/runtime assumptions | Move JSON storage reads/writes behind shared storage helpers. |
| B | `public/js/runtime/precipitation-request.js` | runtime | L69 I1/0 E1 S0 D11 Q0 | bounded feature script; standalone with local DOM/runtime assumptions | Keep local; avoid growing cross-feature responsibilities. |
| B | `public/js/runtime/prepaint-state.js` | runtime | L187 I0/0 E0 S1 D33 Q0 | bounded feature script; standalone with local DOM/runtime assumptions | Prefer kernel/dom-contracts dataset writers for projection state. |
| B | `public/js/runtime/pulse-beat-tuner.js` | runtime | L171 I0/3 E11 S0 D12 Q0 | bounded feature script; standalone with local DOM/runtime assumptions | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| C | `public/js/runtime/pwa-update-handler.js` | runtime | L487 I2/0 E10 S7 D1 Q5 | mixed boundary; keep behavior but extract repeated primitives | Move JSON storage reads/writes behind shared storage helpers. |
| A | `public/js/runtime/reactive-spine.js` | runtime | L118 I1/0 E0 S0 D4 Q3 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| B | `public/js/runtime/region-enhancer.js` | runtime | L71 I1/0 E1 S0 D18 Q2 | bounded feature script; standalone with local DOM/runtime assumptions | Prefer kernel/dom-contracts dataset writers for projection state. |
| C | `public/js/runtime/region-menu.js` | runtime | L1061 I4/1 E15 S0 D26 Q11 | mixed boundary; keep behavior but extract repeated primitives | Prefer kernel/dom-contracts dataset writers for projection state. |
| A | `public/js/runtime/region-profiler.js` | runtime | L495 I3/5 E2 S0 D1 Q1 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| B | `public/js/runtime/reward-ui.js` | runtime | L472 I4/0 E4 S0 D22 Q1 | bounded feature script; standalone with local DOM/runtime assumptions | Prefer kernel/dom-contracts dataset writers for projection state. |
| A | `public/js/runtime/runtime-helpers.js` | runtime | L356 I0/10 E2 S0 D2 Q2 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| B | `public/js/runtime/scene-interaction.js` | runtime | L409 I2/0 E12 S2 D13 Q23 | bounded feature script; standalone with local DOM/runtime assumptions | Move JSON storage reads/writes behind shared storage helpers. |
| B | `public/js/runtime/settings-momentum.js` | runtime | L90 I1/0 E6 S0 D7 Q0 | bounded feature script; standalone with local DOM/runtime assumptions | Keep local; avoid growing cross-feature responsibilities. |
| D | `public/js/runtime/shell-disclosure.js` | runtime | L2284 I5/0 E32 S0 D66 Q104 | overloaded standalone boundary; split responsibilities before adding behavior | Split measurement, disclosure state, and utility controls. |
| A | `public/js/runtime/sigil-anatomy.js` | runtime | L75 I1/0 E1 S0 D4 Q1 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| B | `public/js/runtime/site-core-minimal.js` | runtime | L294 I4/0 E10 S0 D19 Q2 | bounded feature script; standalone with local DOM/runtime assumptions | Prefer kernel/dom-contracts dataset writers for projection state. |
| C | `public/js/runtime/spells.js` | runtime | L909 I7/0 E12 S3 D21 Q10 | mixed boundary; keep behavior but extract repeated primitives | Move JSON storage reads/writes behind shared storage helpers. |
| B | `public/js/runtime/spw-key-events.js` | runtime | L688 I3/0 E18 S0 D9 Q12 | bounded feature script; standalone with local DOM/runtime assumptions | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| C | `public/js/runtime/state-inspector.js` | runtime | L930 I3/0 E18 S0 D28 Q20 | mixed boundary; keep behavior but extract repeated primitives | Rename as state-block inspector; keep per-component mutation isolated. |
| A | `public/js/runtime/state-orchestrator.js` | runtime | L74 I0/0 E1 S0 D0 Q4 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/runtime/topical-payload.js` | runtime | L350 I2/0 E5 S0 D0 Q9 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| B | `public/js/runtime/tuning-discovery.js` | runtime | L322 I3/1 E2 S0 D21 Q13 | bounded feature script; standalone with local DOM/runtime assumptions | Prefer kernel/dom-contracts dataset writers for projection state. |
| A | `public/js/runtime/variant-selection.js` | runtime | L141 I2/0 E4 S0 D6 Q15 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/runtime/visitation.js` | runtime | L60 I1/0 E2 S1 D6 Q0 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/semantic/bare-spw-markup.js` | semantic | L170 I2/0 E0 S0 D8 Q3 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| B | `public/js/semantic/cognitive-surface.js` | semantic | L327 I4/1 E3 S2 D1 Q4 | bounded feature script; standalone with local DOM/runtime assumptions | Move JSON storage reads/writes behind shared storage helpers. |
| A | `public/js/semantic/component-interaction-semantics.js` | semantic | L361 I2/1 E0 S0 D2 Q0 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/semantic/component-relationships.js` | semantic | L152 I2/1 E0 S0 D0 Q2 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| C | `public/js/semantic/component-semantics.js` | semantic | L1098 I6/1 E2 S0 D2 Q6 | mixed boundary; keep behavior but extract repeated primitives | Mark as refactor candidate when touched next. |
| A | `public/js/semantic/concept-salience.js` | semantic | L126 I0/0 E0 S0 D5 Q5 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| B | `public/js/semantic/effect-interpretation.js` | semantic | L356 I1/1 E1 S0 D20 Q11 | bounded feature script; standalone with local DOM/runtime assumptions | Prefer kernel/dom-contracts dataset writers for projection state. |
| B | `public/js/semantic/image-interaction.js` | semantic | L322 I1/0 E16 S0 D14 Q10 | bounded feature script; standalone with local DOM/runtime assumptions | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| A | `public/js/semantic/image-utilization.js` | semantic | L61 I0/0 E0 S0 D2 Q3 | portable or declarative; standalone boundary is clean | Leave alone except normal maintenance. |
| A | `public/js/semantic/lattice.js` | semantic | L111 I2/3 E3 S0 D1 Q2 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| B | `public/js/semantic/link-copy.js` | semantic | L159 I2/2 E0 S0 D13 Q0 | bounded feature script; standalone with local DOM/runtime assumptions | Keep local; avoid growing cross-feature responsibilities. |
| C | `public/js/semantic/narrative-instrumentation.js` | semantic | L701 I2/0 E9 S0 D20 Q16 | mixed boundary; keep behavior but extract repeated primitives | Prefer kernel/dom-contracts dataset writers for projection state. |
| B | `public/js/semantic/operator-interactions.js` | semantic | L495 I3/1 E8 S0 D4 Q9 | bounded feature script; standalone with local DOM/runtime assumptions | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| A | `public/js/semantic/operators.js` | semantic | L66 I4/0 E0 S0 D0 Q2 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/semantic/page-universe.js` | semantic | L189 I1/0 E2 S0 D0 Q10 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| B | `public/js/semantic/pretext-lab.js` | semantic | L347 I1/0 E11 S0 D0 Q24 | bounded feature script; standalone with local DOM/runtime assumptions | Route new custom events through bus unless DOM compatibility requires raw dispatch. |
| A | `public/js/semantic/pretext-measurement-bus.js` | semantic | L208 I1/4 E2 S0 D10 Q3 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| C | `public/js/semantic/pretext-physics.js` | semantic | L1476 I3/0 E4 S0 D22 Q12 | mixed boundary; keep behavior but extract repeated primitives | Prefer kernel/dom-contracts dataset writers for projection state. |
| A | `public/js/semantic/pretext-presets.js` | semantic | L457 I2/0 E3 S0 D0 Q3 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/semantic/pretext-utils.js` | semantic | L18 I0/4 E0 S0 D0 Q0 | portable or declarative; standalone boundary is clean | Leave alone except normal maintenance. |
| A | `public/js/semantic/projection.js` | semantic | L140 I1/0 E3 S0 D2 Q2 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/semantic/recipe-semantics.js` | semantic | L174 I1/0 E2 S0 D2 Q18 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/semantic/role-inference.js` | semantic | L80 I2/3 E0 S0 D0 Q3 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| A | `public/js/semantic/semantic-braces.js` | semantic | L200 I1/4 E0 S0 D1 Q0 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| B | `public/js/semantic/semantic-crossrefs.js` | semantic | L234 I3/0 E6 S0 D4 Q5 | bounded feature script; standalone with local DOM/runtime assumptions | Keep local; avoid growing cross-feature responsibilities. |
| A | `public/js/semantic/semantic-utils.js` | semantic | L30 I0/8 E0 S0 D0 Q0 | portable or declarative; standalone boundary is clean | Leave alone except normal maintenance. |
| B | `public/js/semantic/sigil-annotation.js` | semantic | L206 I1/2 E0 S0 D34 Q2 | bounded feature script; standalone with local DOM/runtime assumptions | Prefer kernel/dom-contracts dataset writers for projection state. |
| A | `public/js/semantic/smart.js` | semantic | L233 I5/0 E1 S0 D2 Q0 | bounded module; reusable with low side-effect pressure | Leave alone except normal maintenance. |
| C | `public/js/site.js` | entrypoint | L1035 I13/0 E4 S0 D11 Q3 | entrypoint orchestration; acceptable large surface, keep extracting helpers | Keep as boot shell; extract only policy/helper seams. |
| G | `public/js/typed/bus.js` | typed | L387 I0/0 E6 S0 D4 Q0 | generated output; do not hand-edit | Regenerate from public/ts; do not edit directly. |
| G | `public/js/typed/feed-utils.js` | typed | L126 I0/2 E0 S0 D0 Q0 | generated output; do not hand-edit | Regenerate from public/ts; do not edit directly. |
| G | `public/js/typed/json-feeds.js` | typed | L165 I0/2 E0 S0 D0 Q0 | generated output; do not hand-edit | Regenerate from public/ts; do not edit directly. |
| G | `public/js/typed/kernel-dom-contracts.js` | typed | L2 I0/2 E0 S0 D0 Q0 | generated output; do not hand-edit | Regenerate from public/ts; do not edit directly. |
| G | `public/js/typed/media-publishing.js` | typed | L132 I3/0 E0 S0 D0 Q2 | generated output; do not hand-edit | Regenerate from public/ts; do not edit directly. |
| G | `public/js/typed/promo-wonder-cycle.js` | typed | L314 I3/0 E0 S0 D6 Q1 | generated output; do not hand-edit | Regenerate from public/ts; do not edit directly. |
| G | `public/js/typed/runtime-environment.js` | typed | L44 I0/0 E0 S0 D1 Q0 | generated output; do not hand-edit | Regenerate from public/ts; do not edit directly. |

## Repeated Behavior Seams

- Storage: repeated safe JSON parse and direct `localStorage` / `sessionStorage` wrappers should converge into a small storage helper before more persistence is added.
- Dataset projection: files with high `D` counts should prefer `kernel/dom-contracts.js` writers so runtime mutation remains auditable.
- Eventing: new behavior should use `kernel/bus.js` first; raw `CustomEvent` should be reserved for public DOM compatibility or element-local events.
- Lens/mode toggles: reuse `runtime/lens-modes.js` instead of repeating `aria-pressed` plus `hidden` panel switching.
- Floating chrome: state inspector, console, discovery notices, section handles, and region menus should keep bottom-lane/overlay competition in shared chrome contracts.

## Reading Notes

- `site.js`, `module-catalog.js`, and `module-loader.js` are large by design. Their grade reflects orchestration pressure, not automatic failure.
- `typed/` rows are included for completeness, but edits belong in `public/ts`.
- A high incoming count can be good for kernel primitives. A high outgoing count on interface/runtime modules is a stronger split signal.

