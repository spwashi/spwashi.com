/** Shared temporal trace state for mirrors, spell output, and floating chip copy. */
export const cauldronTrace = {
  lastGesture: '',
  lastPlantedTrail: '',
};

export function recordGestureTrace(ingredient = {}) {
  const next = ingredient.gestureHistory || ingredient.primedBy || ingredient.chargeContext || '';
  if (next) cauldronTrace.lastGesture = next;
}

export function recordPlantedTrail(signature = '') {
  if (signature) cauldronTrace.lastPlantedTrail = signature;
}