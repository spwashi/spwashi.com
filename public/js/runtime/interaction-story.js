/**
 * A hop, gather, or swipe is one story told by several existing attributes.
 * This module only reads them. It does not invent a parallel family.
 */
import { formatMicrointeractionExpression } from '../semantic/interaction-expression.js';

const PHASE_EVENT = 'spw:interaction-phase';

export function readInteractionStory(root = document) {
  const doc = root?.nodeType === 9 ? root : root?.ownerDocument || document;
  const html = doc.documentElement;
  const phase = html?.dataset?.spwInteractionPhase || 'idle';
  const pulse = html?.dataset?.spwMicrointeractionPulse || '';
  const landmark = doc.querySelector?.('.spw-page-landmarks a[aria-current="location"]');
  const liminality = landmark?.closest?.('[data-spw-liminality]')?.dataset?.spwLiminality || '';
  const loop = landmark?.dataset?.spwLoopState || '';
  const hash = String(doc.defaultView?.location?.hash || '').replace(/^#/, '');
  const cauldron = html?.dataset?.spwCauldronResonance || '';
  const handle = doc.querySelector?.('[data-spw-handle-phase]');
  const handlePhase = handle?.getAttribute('data-spw-handle-phase') || '';
  const source = html?.dataset?.spwInteractionPhase ? phase : '';

  const reading = [
    pulse || phase,
    liminality ? `at ${liminality}` : '',
    hash ? `#${hash}` : '',
    cauldron,
  ].filter(Boolean).join(' · ') || 'idle';

  const expression = formatMicrointeractionExpression({
    input: hash || 'page',
    gesture: pulse || phase,
    transform: `!${phase} ~> $${pulse || 'rest'}`,
    destination: hash || handlePhase || 'page',
    register: liminality || 'room',
    state: loop || phase,
  });

  return {
    phase,
    pulse,
    liminality,
    loop,
    hash,
    cauldron,
    handlePhase,
    source,
    reading,
    expression,
  };
}

export { PHASE_EVENT };
