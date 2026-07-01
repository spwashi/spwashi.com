/**
 * effect-interpretation.js
 * ---------------------------------------------------------------------------
 * Projects Spw-native effect legends onto image studies: operator sigils, lens
 * capacities, visual cues, and interaction state readouts.
 */

import {
  getOperatorDefinition,
  getOperatorGeometry,
} from '/public/js/kernel/shared.js';

const FIGURE_SELECTOR = [
  '.topic-photo-card',
  '.image-study',
  '[data-spw-image-reward]',
  '[data-spw-image-discovery]',
  '.frame-card-media',
  '[data-spw-image-surface]',
].join(', ');

const LENS_VIEW_LABELS = Object.freeze({
  probe: 'Evidence',
  frame: 'Structure',
  ref: 'Lineage',
  object: 'Commission',
  integrate: 'Circulation',
  stream: 'Rhythm',
  baseline: 'Tactile',
  route: 'Path',
  potential: 'Motif',
  surface: 'Surface',
  action: 'Action',
});

const IMAGE_LENS_SEMANTICS = Object.freeze({
  probe: {
    sigil: '?',
    capacity: 'ask',
    expression: 'lens[probe]{wonder.aperture}',
    hint: 'open inquiry without forcing closure',
  },
  frame: {
    sigil: '#>',
    capacity: 'address',
    expression: 'lens[frame]{name.structure}',
    hint: 'name the structural resonance field',
  },
  ref: {
    sigil: '~',
    capacity: 'thread',
    expression: 'lens[ref]{lineage.memory}',
    hint: 'follow source without collapsing the path',
  },
  object: {
    sigil: '^',
    capacity: 'commission',
    expression: 'lens[object]{lift.relation}',
    hint: 'lift the commission threshold into view',
  },
  integrate: {
    sigil: '^',
    capacity: 'circulate',
    expression: 'lens[integrate]{bind.circulation}',
    hint: 'bind parts into shared circulation memory',
  },
  stream: {
    sigil: '*',
    capacity: 'rhythm',
    expression: 'lens[stream]{flow.cadence}',
    hint: 'read release rhythm and material flow',
  },
  baseline: {
    sigil: '.',
    capacity: 'settle',
    expression: 'lens[baseline]{ground.tactile}',
    hint: 'return to tactile ground and handled surface',
  },
  route: {
    sigil: '<',
    capacity: 'path',
    expression: 'lens[route]{scope.entry}',
    hint: 'scope the topical entry and next door',
  },
  potential: {
    sigil: '~',
    capacity: 'defer',
    expression: 'lens[potential]{hold.motif}',
    hint: 'keep motif pressure available without collapse',
  },
  surface: {
    sigil: '>',
    capacity: 'project',
    expression: 'lens[surface]{render.edge}',
    hint: 'project the rendered edge of the surface',
  },
  action: {
    sigil: '!',
    capacity: 'commit',
    expression: 'lens[action]{force.move}',
    hint: 'commit a move with observable consequence',
  },
});

const STATE_LABELS = Object.freeze({
  idle: '',
  primed: 'Focused',
  inspecting: 'inspecting',
  lensed: 'view shifted',
  discovered: 'discovered',
});

function lensCues(figure) {
  return (figure.dataset.spwImageLensCues || '')
    .split(/[|,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function visualCueTokens(figure) {
  return (figure.dataset.spwVisualCues || '')
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function lensSemantics(lens) {
  const authored = IMAGE_LENS_SEMANTICS[lens];
  if (authored) return authored;

  const operator = getOperatorDefinition(lens);
  return {
    sigil: operator?.prefix || lens,
    capacity: operator?.pronunciation || operator?.intent || lens,
    expression: `lens[${lens}]{read.view}`,
    hint: operator?.interaction || 'shift the image lens',
  };
}

function applyOperatorSemantics(element, lens) {
  const operator = getOperatorDefinition(lens);
  const geometry = getOperatorGeometry(lens);
  if (!operator) return;

  element.dataset.spwOperator = lens;
  if (geometry) {
    element.dataset.spwOperatorLeftRole = geometry.leftRole;
    element.dataset.spwOperatorRightRole = geometry.rightRole;
    element.dataset.spwOperatorFlow = geometry.flow;
    element.dataset.spwOperatorChargeRole = geometry.chargeRole;
  }
  if (operator.speech) element.dataset.spwOperatorSpeech = operator.speech;
  if (operator.reversibility) element.dataset.spwOperatorReversibility = operator.reversibility;
}

function ensureLegendHost(figure) {
  const summary = figure.querySelector('.study-summary');
  if (summary) return summary;

  let host = figure.querySelector('[data-spw-effect-legend-host]');
  if (host) return host;

  host = document.createElement('div');
  host.className = 'spw-effect-legend-host';
  host.dataset.spwEffectLegendHost = 'true';
  figure.appendChild(host);
  return host;
}

function ensureLegend(figure) {
  const host = ensureLegendHost(figure);
  let legend = host.querySelector('[data-spw-effect-legend]');
  if (legend) return legend;

  legend = document.createElement('div');
  legend.className = 'spw-effect-legend';
  legend.dataset.spwEffectLegend = 'true';
  legend.setAttribute('aria-label', 'Lens capacities');

  const meta = host.querySelector('.meta-cluster');
  if (meta?.nextSibling) {
    meta.parentNode.insertBefore(legend, meta.nextSibling);
  } else if (meta) {
    meta.after(legend);
  } else {
    host.prepend(legend);
  }

  return legend;
}

function ensureCues(figure) {
  const host = ensureLegendHost(figure);
  let cues = host.querySelector('[data-spw-effect-cues]');
  if (cues) return cues;

  cues = document.createElement('div');
  cues.className = 'spw-effect-cues';
  cues.dataset.spwEffectCues = 'true';
  cues.setAttribute('aria-label', 'Visual cues in this image');

  const legend = host.querySelector('[data-spw-effect-legend]');
  if (legend) legend.after(cues);
  else host.appendChild(cues);

  return cues;
}

function ensureStateReadout(figure) {
  let readout = figure.querySelector('[data-spw-effect-state]');
  if (readout) return readout;

  readout = document.createElement('span');
  readout.className = 'spw-effect-state';
  readout.dataset.spwEffectState = 'true';
  readout.setAttribute('aria-live', 'polite');
  figure.appendChild(readout);
  return readout;
}

function buildLensChip(lens, active) {
  const meta = lensSemantics(lens);
  const operator = getOperatorDefinition(lens);
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'spw-effect-chip spw-effect-chip--lens';
  chip.dataset.spwLensChip = lens;
  chip.dataset.spwImageLensCapacity = meta.capacity;
  chip.dataset.spwSemanticExpression = meta.expression;
  chip.dataset.spwSigil = meta.sigil;
  chip.dataset.spwGestureContract = 'tap:select-lens';
  chip.setAttribute('aria-pressed', lens === active ? 'true' : 'false');
  chip.setAttribute(
    'aria-label',
    `${meta.sigil} ${meta.capacity} — ${meta.hint || operator?.interaction || 'shift image lens'}`,
  );
  chip.title = `${meta.sigil} ${meta.capacity}`;

  applyOperatorSemantics(chip, lens);

  const sigil = document.createElement('span');
  sigil.className = 'spw-effect-chip__sigil';
  sigil.setAttribute('aria-hidden', 'true');
  sigil.textContent = meta.sigil;

  const capacity = document.createElement('span');
  capacity.className = 'spw-effect-chip__capacity spw-effect-verb';
  capacity.textContent = meta.capacity;

  chip.append(sigil, capacity);
  return chip;
}

function syncViewPill(figure, lens) {
  const pill = figure.querySelector('.study-summary .meta-cluster .spec-pill');
  if (!(pill instanceof HTMLElement)) return;
  const label = LENS_VIEW_LABELS[lens] || lens;
  pill.textContent = `${label} view`;
  pill.dataset.spwEffectView = lens;
}

function syncLegendChips(figure) {
  const cues = lensCues(figure);
  if (!cues.length) return;

  const legend = ensureLegend(figure);
  const active = figure.dataset.spwImageLensActive || cues[0];
  legend.replaceChildren();

  cues.forEach((lens) => {
    legend.appendChild(buildLensChip(lens, active));
  });

  figure.dataset.spwEffectLegendReady = 'true';
}

function syncVisualCueChips(figure) {
  const tokens = visualCueTokens(figure);
  const cues = ensureCues(figure);

  if (!tokens.length) {
    cues.hidden = true;
    cues.replaceChildren();
    return;
  }

  cues.hidden = false;
  cues.replaceChildren();

  tokens.forEach((token) => {
    const chip = document.createElement('span');
    chip.className = 'spw-effect-cue';
    chip.textContent = token.replace(/-/g, ' ');
    cues.appendChild(chip);
  });
}

function syncStateReadout(figure) {
  const state = figure.dataset.spwImageInteractionState || 'idle';
  const lens = figure.dataset.spwImageLensActive || '';
  const readout = ensureStateReadout(figure);
  const label = STATE_LABELS[state] || '';

  readout.textContent = label;
  readout.dataset.spwEffectStateValue = state;
  readout.hidden = !label;
  readout.classList.toggle('spw-effect-verb', state === 'inspecting' || state === 'discovered' || state === 'lensed');

  figure.dataset.spwEffectReadout = label || lens || '';
  if (lens) syncViewPill(figure, lens);
}

export function syncEffectInterpretation(figure) {
  if (!(figure instanceof HTMLElement) || !figure.matches(FIGURE_SELECTOR)) return;
  syncLegendChips(figure);
  syncVisualCueChips(figure);
  syncStateReadout(figure);
}

export function initEffectInterpretation(root = document) {
  const figures = [...root.querySelectorAll(FIGURE_SELECTOR)];
  figures.forEach(syncEffectInterpretation);

  const onLens = (event) => {
    const figure = event.detail?.figure;
    if (figure instanceof HTMLElement) syncEffectInterpretation(figure);
  };

  root.addEventListener('spw:image-lens', onLens);

  const observer = typeof MutationObserver === 'function'
    ? new MutationObserver((records) => {
      records.forEach((record) => {
        if (!(record.target instanceof HTMLElement)) return;
        if (!record.target.matches(FIGURE_SELECTOR)) return;
        if (record.attributeName === 'data-spw-image-interaction-state'
          || record.attributeName === 'data-spw-image-lens-active') {
          syncEffectInterpretation(record.target);
        }
      });
    })
    : null;

  figures.forEach((figure) => {
    observer?.observe(figure, {
      attributes: true,
      attributeFilter: ['data-spw-image-interaction-state', 'data-spw-image-lens-active'],
    });
  });

  return () => {
    root.removeEventListener('spw:image-lens', onLens);
    observer?.disconnect();
  };
}