/**
 * component-interaction-semantics.js
 * ---------------------------------------------------------------------------
 * Interaction, lifecycle, and theming-physics inference for component targets.
 * Consumed by component-semantics.js; maps to interaction-vocabulary phases.
 */

import { normalizeText, normalizeToken, unique } from '/public/js/semantic/semantic-utils.js';
import {
  INTERACTION_CONTRACT_HINTS,
  phaseFromGestureContract,
  phaseFromInteractionContract,
} from '/public/js/runtime/interaction-vocabulary.js';

export const LIFECYCLE_BEATS = Object.freeze([
  'rest',
  'approach',
  'gather',
  'commit',
  'release',
  'settle',
]);

export const PHYSICS_PROFILES = Object.freeze({
  light: { mass: 0.88, damping: 0.72, stiffness: 0.62 },
  balanced: { mass: 1, damping: 0.82, stiffness: 0.78 },
  charged: { mass: 1.14, damping: 0.9, stiffness: 0.92 },
  scene: { mass: 1.08, damping: 0.86, stiffness: 0.84 },
});

const ROLE_GESTURE_CONTRACTS = Object.freeze({
  control: 'tap:prime hold:inspect',
  tool: 'tap:prime hold:inspect',
  probe: 'tap:inspect hold:prime',
  lab: 'tap:inspect hold:prime swipe:toggle-lens',
  routing: 'tap:ground navigate',
  registry: 'tap:ground hold:inspect',
  schema: 'tap:inspect hold:prime',
  artifact: 'tap:prime swipe:toggle-lens hold:inspect',
  surface: 'tap:prime hold:inspect',
  orientation: 'tap:prime hold:inspect',
  reference: 'tap:prime hold:inspect',
  telemetry: 'tap:inspect',
  status: 'tap:prime',
});

const ROLE_INTERACTION_CONTRACTS = Object.freeze({
  control: 'tap ground navigate',
  tool: 'tap ground navigate',
  routing: 'tap ground navigate',
  registry: 'tap ground settle',
  probe: 'tap charge navigate',
  lab: 'image-study',
  artifact: 'image-study',
});

const INTERACTIVITY_BEAT = Object.freeze({
  ambient: 'rest',
  viewable: 'rest',
  navigable: 'approach',
  inspectable: 'gather',
  controllable: 'gather',
  reactive: 'commit',
});

const STANCE_BEAT = Object.freeze({
  entry: 'approach',
  ground: 'settle',
  exit: 'release',
});

const POSTURE_PHASE = Object.freeze({
  mise: 'prime',
  reduction: 'charge',
  ferment: 'inspect',
});

function tokenizeList(value = '') {
  return normalizeText(value)
    .split(/[\s,]+/)
    .map(normalizeToken)
    .filter(Boolean);
}

export function inferGestureContract(el, snapshotBase = {}) {
  const authored = normalizeText(el.dataset.spwGestureContract || '');
  if (authored) return authored;

  if (el.matches?.('.spw-scene-bed, [data-spw-scene-posture]')) {
    return 'tap:prime hold:inspect swipe:toggle-lens';
  }
  if (el.querySelector?.('[data-blog-interpreter], [data-blog-input]')) {
    return 'tap:prime hold:inspect';
  }
  if (el.querySelector?.('[data-design-ecology-specimen], [data-design-material-bench]')) {
    return 'tap:prime hold:inspect swipe:toggle-lens';
  }

  return ROLE_GESTURE_CONTRACTS[snapshotBase.role] || 'tap:prime hold:inspect';
}

export function inferInteractionContract(el, snapshotBase = {}) {
  const authored = normalizeText(el.dataset.spwInteractionContract || '');
  if (authored) return authored;

  if (el.matches?.('[data-blog-interpreter]')) return 'image-study';
  if (el.matches?.('[data-design-ecology-specimen]')) return 'tap ground navigate';
  if (el.querySelector?.('[data-spw-image-interaction-state], [data-spw-image-surface]')) {
    return 'image-study';
  }

  return ROLE_INTERACTION_CONTRACTS[snapshotBase.role] || '';
}

export function inferLifecycleBeat(el, snapshotBase = {}) {
  if (el.dataset.spwLifecycleBeat) return normalizeToken(el.dataset.spwLifecycleBeat);

  const loopState = normalizeToken(el.dataset.spwLoopState || '');
  if (loopState === 'preview') return 'approach';
  if (loopState === 'activated') return 'commit';
  if (loopState === 'resolved') return 'release';

  const liminality = normalizeToken(el.dataset.spwLiminality || '');
  if (liminality === 'entry' || liminality === 'threshold') return 'approach';
  if (liminality === 'exit') return 'release';

  const stanceBeat = STANCE_BEAT[snapshotBase.stance];
  if (stanceBeat && snapshotBase.stance !== 'ground') return stanceBeat;

  const interactivityBeat = INTERACTIVITY_BEAT[snapshotBase.interactivity];
  if (interactivityBeat) return interactivityBeat;

  if (snapshotBase.role === 'orientation' || snapshotBase.importance === 'primary') return 'approach';
  return 'rest';
}

export function inferInteractionPhaseAffinity(el, snapshotBase = {}) {
  if (el.dataset.spwInteractionPhaseAffinity) {
    return normalizeToken(el.dataset.spwInteractionPhaseAffinity);
  }

  const contract = snapshotBase.interactionContract || inferInteractionContract(el, snapshotBase);
  const contractPhase = phaseFromInteractionContract(contract);
  if (contractPhase) return contractPhase;

  const gestureContract = snapshotBase.gestureContract || inferGestureContract(el, snapshotBase);
  const gesturePhase = phaseFromGestureContract(gestureContract);
  if (gesturePhase) return gesturePhase;

  const posture = normalizeToken(el.dataset.spwScenePosture || el.closest?.('[data-spw-scene-posture]')?.dataset?.spwScenePosture || '');
  if (POSTURE_PHASE[posture]) return POSTURE_PHASE[posture];

  const beat = snapshotBase.lifecycleBeat || inferLifecycleBeat(el, snapshotBase);
  const beatPhase = Object.freeze({
    rest: 'idle',
    approach: 'approach',
    gather: 'prime',
    commit: 'charge',
    release: 'inspect',
    settle: 'settle',
  })[beat];

  return beatPhase || 'idle';
}

export function inferPhysicsProfile(el, snapshotBase = {}) {
  if (el.dataset.spwPhysicsProfile) return normalizeToken(el.dataset.spwPhysicsProfile);

  if (el.matches?.('.spw-scene-bed, [data-spw-scene-posture]') || el.closest?.('.spw-scene-bed')) {
    return 'scene';
  }
  if (snapshotBase.interactivity === 'controllable' || snapshotBase.interactivity === 'reactive') {
    return 'charged';
  }
  if (snapshotBase.role === 'probe' || snapshotBase.role === 'lab' || snapshotBase.role === 'schema') {
    return 'charged';
  }
  if (snapshotBase.interactivity === 'ambient' || snapshotBase.interactivity === 'viewable') {
    return 'light';
  }
  return 'balanced';
}

export function inferCopyDepth(el, snapshotBase = {}) {
  if (el.dataset.spwCopyDepth) return normalizeToken(el.dataset.spwCopyDepth);

  if (snapshotBase.role === 'control' || snapshotBase.role === 'schema' || snapshotBase.context === 'settings') {
    return 'technical';
  }
  if (snapshotBase.density === 'dense' || snapshotBase.inspectability === 'deep') return 'dense';
  if (snapshotBase.role === 'probe' || snapshotBase.role === 'lab' || snapshotBase.interactivity === 'inspectable') {
    return 'rich';
  }
  if (snapshotBase.importance === 'primary' || snapshotBase.stance === 'entry') return 'entry';
  if (el.dataset.spwWonder || normalizeToken(el.dataset.spwContext || '') === 'theatrical') return 'genre';
  return 'normal';
}

export function inferPaletteDepth(el, snapshotBase = {}) {
  if (el.dataset.spwPaletteDepth) return normalizeToken(el.dataset.spwPaletteDepth);

  const material = normalizeToken(
    el.dataset.spwMetamaterial
    || el.dataset.spwMaterialContext?.split?.(/\s+/)?.[0]
    || '',
  );

  if (material === 'contrast' || snapshotBase.importance === 'primary') return 'deep';
  if (material === 'glass' || snapshotBase.interactivity === 'reactive') return 'mid';
  if (material === 'matte') return 'shallow';
  if (snapshotBase.role === 'orientation') return 'mid';
  return 'balanced';
}

export function inferThemingPosture(el, snapshotBase = {}) {
  const authored = normalizeToken(el.dataset.spwScenePosture || el.dataset.spwThemingPosture || '');
  if (authored) return authored;

  const host = el.closest?.('[data-spw-scene-posture]');
  if (host?.dataset?.spwScenePosture) return normalizeToken(host.dataset.spwScenePosture);

  if (snapshotBase.role === 'probe' || snapshotBase.role === 'lab') return 'ferment';
  if (snapshotBase.role === 'schema' || snapshotBase.density === 'dense') return 'reduction';
  if (snapshotBase.role === 'orientation' || snapshotBase.kind === 'hook') return 'mise';
  return 'neutral';
}

export function inferInteractionAffordances(el, snapshotBase = {}) {
  const affordances = [];

  const gestureContract = snapshotBase.gestureContract || inferGestureContract(el, snapshotBase);
  if (gestureContract.includes('hold:')) affordances.push('hold-inspect');
  if (gestureContract.includes('swipe:')) affordances.push('swipe-cycle');
  if (gestureContract.includes('tap:discover') || gestureContract.includes('discover')) {
    affordances.push('discover');
  }

  const interactionContract = snapshotBase.interactionContract || inferInteractionContract(el, snapshotBase);
  if (interactionContract && INTERACTION_CONTRACT_HINTS[interactionContract.toLowerCase()]) {
    affordances.push('contract-navigate');
  }

  if (el.querySelector?.('[data-spw-scroll-rail], .frame-grid--media, .spw-visual-link-board__grid')) {
    affordances.push('swipe-rail');
  }
  if (el.querySelector?.('[data-spw-gesture-contract], [data-spw-interaction-contract]')) {
    affordances.push('gesture-contract');
  }
  if (el.querySelector?.('[data-spw-loop-state], [data-spw-arc]')) affordances.push('arc-sequence');
  if (el.querySelector?.('[data-spw-image-interaction-state], [data-spw-image-surface]')) {
    affordances.push('image-lens');
  }
  if (snapshotBase.physicsProfile === 'scene' || snapshotBase.themingPosture !== 'neutral') {
    affordances.push('theming-physics');
  }
  if (snapshotBase.lifecycleBeat && snapshotBase.lifecycleBeat !== 'rest') {
    affordances.push('lifecycle-beat');
  }

  return unique(affordances);
}

export function buildInteractionGenome(snapshotBase = {}) {
  const tokens = [];

  if (snapshotBase.lifecycleBeat) tokens.push(`beat-${snapshotBase.lifecycleBeat}`);
  if (snapshotBase.interactionPhaseAffinity) {
    tokens.push(`phase-${snapshotBase.interactionPhaseAffinity}`);
  }
  if (snapshotBase.physicsProfile) tokens.push(`physics-${snapshotBase.physicsProfile}`);
  if (snapshotBase.copyDepth) tokens.push(`copy-depth-${snapshotBase.copyDepth}`);
  if (snapshotBase.paletteDepth) tokens.push(`palette-depth-${snapshotBase.paletteDepth}`);
  if (snapshotBase.themingPosture && snapshotBase.themingPosture !== 'neutral') {
    tokens.push(`posture-${snapshotBase.themingPosture}`);
  }

  return tokens.join(' ');
}

export function snapshotInteractionSemantics(el, snapshotBase = {}) {
  const gestureContract = inferGestureContract(el, snapshotBase);
  const interactionContract = inferInteractionContract(el, snapshotBase);
  const lifecycleBeat = inferLifecycleBeat(el, snapshotBase);
  const interactionPhaseAffinity = inferInteractionPhaseAffinity(el, {
    ...snapshotBase,
    gestureContract,
    interactionContract,
    lifecycleBeat,
  });
  const physicsProfile = inferPhysicsProfile(el, snapshotBase);
  const copyDepth = inferCopyDepth(el, snapshotBase);
  const paletteDepth = inferPaletteDepth(el, snapshotBase);
  const themingPosture = inferThemingPosture(el, snapshotBase);
  const interactionAffordances = inferInteractionAffordances(el, {
    ...snapshotBase,
    gestureContract,
    interactionContract,
    lifecycleBeat,
    physicsProfile,
    themingPosture,
  });
  const interactionGenome = buildInteractionGenome({
    lifecycleBeat,
    interactionPhaseAffinity,
    physicsProfile,
    copyDepth,
    paletteDepth,
    themingPosture,
  });
  const physics = PHYSICS_PROFILES[physicsProfile] || PHYSICS_PROFILES.balanced;

  return {
    gestureContract,
    interactionContract,
    lifecycleBeat,
    interactionPhaseAffinity,
    physicsProfile,
    physicsMass: String(physics.mass),
    physicsDamping: String(physics.damping),
    physicsStiffness: String(physics.stiffness),
    copyDepth,
    paletteDepth,
    themingPosture,
    interactionAffordances,
    interactionGenome,
  };
}

export function applyInteractionSemantics(el, snapshot, options = {}) {
  const { overwrite = true } = options;
  const write = (key, value, resolvedKey) => {
    if (!value) return;
    if (overwrite || !el.dataset[key]) {
      el.dataset[key] = value;
    }
    if (resolvedKey) el.dataset[resolvedKey] = value;
  };

  write('spwGestureContract', snapshot.gestureContract, 'spwGestureContractResolved');
  write('spwInteractionContract', snapshot.interactionContract, 'spwInteractionContractResolved');
  write('spwLifecycleBeat', snapshot.lifecycleBeat, 'spwLifecycleBeatResolved');
  write('spwInteractionPhaseAffinity', snapshot.interactionPhaseAffinity);
  write('spwPhysicsProfile', snapshot.physicsProfile, 'spwPhysicsProfileResolved');
  write('spwPhysicsMass', snapshot.physicsMass);
  write('spwPhysicsDamping', snapshot.physicsDamping);
  write('spwPhysicsStiffness', snapshot.physicsStiffness);

  if (!el.dataset.spwCopyDepth) {
    el.dataset.spwCopyDepthResolved = snapshot.copyDepth;
  }
  write('spwPaletteDepth', snapshot.paletteDepth, 'spwPaletteDepthResolved');
  write('spwThemingPosture', snapshot.themingPosture, 'spwThemingPostureResolved');

  if (snapshot.interactionAffordances?.length) {
    const mergedAffordances = unique([
      ...tokenizeList(el.dataset.spwAffordances || ''),
      ...snapshot.interactionAffordances,
    ]);
    if (mergedAffordances.length) el.dataset.spwAffordances = mergedAffordances.join(' ');
  }
}