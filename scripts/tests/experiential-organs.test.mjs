import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SPW_SAMPLE_DOCK_CONTRACT,
  initSampleDock,
  renderSampleDock,
  selectSampleIndex,
  pinSampleIndex,
  clearSamplePin,
  cycleSampleIndex,
} from '../../public/js/runtime/experiential/sample-dock.js';

import {
  SPW_BREADCRUMB_SPELL_CONTRACT,
  BREADCRUMB_ROUTE_REGISTRY,
  initSpellBreadcrumbs,
  renderBreadcrumbSpell,
  navigateSpellPathTarget,
  syncSpellPathHash,
  slugify,
  humanizePathPart,
  titleFromPath,
  describeBreadcrumbRoute,
  describeBreadcrumbSummary,
  collectRelatedBreadcrumbRoutes,
} from '../../public/js/runtime/experiential/breadcrumb-spell.js';

import {
  SPW_EXPERIENTIAL_CONTRACT,
  SPW_MODULE_EXPORT,
  initSpwExperiential,
  syncExperientialSurface,
} from '../../public/js/runtime/experiential.js';

import {
  SPW_MODULE_EXPORT as RESONANCE_PROBE_EXPORT,
  initResonanceProbe,
} from '../../public/js/runtime/attention/resonance-probe.js';

import {
  ATTENTION_ARCHITECTURE_CONTRACT,
  SPW_ATTENTION_ARCHITECTURE_CONTRACT,
  SPW_MODULE_EXPORT as ATTENTION_ARCHITECTURE_EXPORT,
  describeAttentionArchitecture,
  initSpwAttentionArchitecture,
} from '../../public/js/runtime/attention-architecture.js';

test('sample dock organ contract exposes frozen definition and public API', () => {
  assert.equal(SPW_SAMPLE_DOCK_CONTRACT.id, 'sample-dock');
  assert.equal(SPW_SAMPLE_DOCK_CONTRACT.mount, 'initSampleDock');
  assert.ok(Array.isArray(SPW_SAMPLE_DOCK_CONTRACT.dataset));
  assert.ok(SPW_SAMPLE_DOCK_CONTRACT.dataset.includes('spwSampleState'));
  assert.ok(SPW_SAMPLE_DOCK_CONTRACT.dataset.includes('spwSampleCount'));
  assert.ok(SPW_SAMPLE_DOCK_CONTRACT.dataset.includes('spwLearnerConfidence'));

  assert.equal(typeof initSampleDock, 'function');
  assert.equal(typeof renderSampleDock, 'function');
  assert.equal(typeof selectSampleIndex, 'function');
  assert.equal(typeof pinSampleIndex, 'function');
  assert.equal(typeof clearSamplePin, 'function');
  assert.equal(typeof cycleSampleIndex, 'function');
});

test('breadcrumb spell organ contract exposes frozen definition and public API', () => {
  assert.equal(SPW_BREADCRUMB_SPELL_CONTRACT.id, 'breadcrumb-spell');
  assert.equal(SPW_BREADCRUMB_SPELL_CONTRACT.mount, 'initSpellBreadcrumbs');
  assert.ok(Array.isArray(SPW_BREADCRUMB_SPELL_CONTRACT.dataset));
  assert.ok(SPW_BREADCRUMB_SPELL_CONTRACT.dataset.includes('spwSpellPathState'));
  assert.ok(SPW_BREADCRUMB_SPELL_CONTRACT.dataset.includes('spwBreadcrumbSurface'));
  assert.ok(SPW_BREADCRUMB_SPELL_CONTRACT.dataset.includes('spwDeepLink'));

  assert.equal(typeof initSpellBreadcrumbs, 'function');
  assert.equal(typeof renderBreadcrumbSpell, 'function');
  assert.equal(typeof navigateSpellPathTarget, 'function');
  assert.equal(typeof syncSpellPathHash, 'function');
});

test('experiential orchestrator contract names decomposed organs and exports mount handle', () => {
  assert.equal(SPW_EXPERIENTIAL_CONTRACT.id, 'experiential');
  assert.equal(SPW_EXPERIENTIAL_CONTRACT.mount, 'initSpwExperiential');
  assert.deepEqual(SPW_EXPERIENTIAL_CONTRACT.organs, [
    'sample-dock',
    'breadcrumb-spell',
    'contextual-memos',
    'operator-learning',
    'bookmark-registry',
    'qa-beat-gestures',
  ]);

  assert.equal(SPW_MODULE_EXPORT.id, 'experiential');
  assert.equal(typeof SPW_MODULE_EXPORT.mount, 'function');
  assert.equal(typeof SPW_MODULE_EXPORT.refresh, 'function');
  assert.equal(typeof initSpwExperiential, 'function');
  assert.equal(typeof syncExperientialSurface, 'function');
});

test('breadcrumb route registry contains canonical public routes', () => {
  assert.ok(BREADCRUMB_ROUTE_REGISTRY['/']);
  assert.equal(BREADCRUMB_ROUTE_REGISTRY['/'].label, 'Home');

  assert.ok(BREADCRUMB_ROUTE_REGISTRY['/about/']);
  assert.equal(BREADCRUMB_ROUTE_REGISTRY['/about/'].label, 'About');

  assert.ok(BREADCRUMB_ROUTE_REGISTRY['/design/']);
  assert.equal(BREADCRUMB_ROUTE_REGISTRY['/design/'].label, 'Design');

  assert.ok(BREADCRUMB_ROUTE_REGISTRY['/curriculum/']);
  assert.equal(BREADCRUMB_ROUTE_REGISTRY['/curriculum/'].label, 'Curriculum');
});

test('breadcrumb string and path utilities normalize predictably', () => {
  assert.equal(slugify('Route Sorter Anchor!'), 'route-sorter-anchor');
  assert.equal(slugify(''), '');

  assert.equal(humanizePathPart('route_sorter'), 'route sorter');
  assert.equal(humanizePathPart('!special_topic'), 'special topic');

  assert.equal(titleFromPath('/design/folios/'), 'Folios');
  assert.equal(titleFromPath('/curriculum/'), 'Curriculum');
  assert.equal(titleFromPath('/'), 'Home');

  const routeDesc = describeBreadcrumbRoute('/about/');
  assert.equal(routeDesc.href, '/about/');
  assert.equal(routeDesc.label, 'About');

  const summary = describeBreadcrumbSummary({
    surface: 'design',
    routeParts: ['design', 'folios'],
    pageResponsibility: 'visual study',
    pagePrimaryAction: 'explore folios',
    activeFrameSigil: '#>folio-hero',
    activeMode: null,
  });
  assert.equal(summary, 'folios · visual study · #>folio-hero');
});

test('attention resonance probe exposes relation and block-echo capabilities', () => {
  assert.equal(RESONANCE_PROBE_EXPORT.id, 'attention-resonance-probe');
  assert.match(RESONANCE_PROBE_EXPORT.describes, /relation/);
  assert.match(RESONANCE_PROBE_EXPORT.effectScope, /block-echo/);
  assert.equal(typeof initResonanceProbe, 'function');
});

test('attention architecture exposes frozen contract, module export, and relation triad attributes', () => {
  assert.equal(SPW_ATTENTION_ARCHITECTURE_CONTRACT.id, 'attention-architecture');
  assert.equal(SPW_ATTENTION_ARCHITECTURE_CONTRACT.mount, 'initSpwAttentionArchitecture');
  assert.deepEqual(SPW_ATTENTION_ARCHITECTURE_CONTRACT.organs, [
    'scroll-cadence',
    'section-handle',
    'resonance-probe',
    'reading-groove',
    'pinch-scale',
  ]);

  assert.equal(ATTENTION_ARCHITECTURE_EXPORT.id, 'attention-architecture');
  assert.equal(typeof ATTENTION_ARCHITECTURE_EXPORT.mount, 'function');
  assert.equal(typeof ATTENTION_ARCHITECTURE_EXPORT.describe, 'function');
  assert.equal(typeof initSpwAttentionArchitecture, 'function');

  assert.equal(ATTENTION_ARCHITECTURE_CONTRACT.attributes.probeRelation, 'data-spw-probe-relation');
  assert.equal(ATTENTION_ARCHITECTURE_CONTRACT.attributes.blockResonance, 'data-spw-block-resonance');
  assert.equal(ATTENTION_ARCHITECTURE_CONTRACT.attributes.probeFamily, 'data-spw-resonance-family');
  assert.equal(ATTENTION_ARCHITECTURE_CONTRACT.attributes.targetKin, 'data-spw-target-kin');

  const snapshot = describeAttentionArchitecture(document);
  assert.ok(snapshot.ready);
  assert.ok('probeRelation' in snapshot);
  assert.ok('blockResonanceCount' in snapshot);
  assert.ok('probeFamily' in snapshot);
});
