function expressionFragment(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\[\]{}()<>]/g, '-');
}

function transformationFragment(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\[\]{}()<]/g, '-');
}

function expressionToken(value) {
  return expressionFragment(value)
    .replace(/[^A-Za-z0-9_.:-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function quotedState(value) {
  return expressionFragment(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

/**
 * Serialize a durable interaction transition as experimental Spw narration.
 *
 * This leaf deliberately has no DOM or parser dependency so hot interaction
 * paths can annotate an existing event without loading expression inspection.
 */
export function formatMicrointeractionExpression(options = {}) {
  const inputValue = expressionToken(options.input);
  const gestureValue = expressionFragment(options.gesture);
  const transformValue = transformationFragment(options.transform);
  const directionsValue = expressionFragment(options.directions);
  const destinationValue = expressionToken(options.destination);
  const registerValue = expressionToken(options.register);
  const stateValue = quotedState(options.state);

  const input = inputValue ? `<${inputValue}>` : '';
  const gesture = gestureValue ? `{ ${gestureValue} }` : '';
  const transform = transformValue ? `(( ${transformValue} ))` : '';
  const directions = directionsValue ? `{ ${directionsValue} }` : '';
  const destination = destinationValue ? `<${destinationValue}>` : '';

  let register = '';
  if (registerValue && stateValue) {
    register = `[reg=${registerValue}@"${stateValue}"]`;
  } else if (registerValue) {
    register = `[reg=${registerValue}]`;
  } else if (stateValue) {
    register = `[@"${stateValue}"]`;
  }

  return [input, gesture, transform, directions, destination, register]
    .filter(Boolean)
    .join(' ');
}

export const SPW_INTERACTION_EXPRESSION_CONTRACT = Object.freeze({
  authority: 'event-narration',
  persistence: 'none',
  layoutAuthority: false,
  event: 'sigil:transition',
});
