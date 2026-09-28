const FAMILIARITY_LADDER = Object.freeze(['fresh', 'familiar', 'practiced', 'fluent', 'habitual']);
const LIMINALITY_LADDER = Object.freeze(['entry', 'threshold', 'settled', 'nested', 'projected', 'deep']);

const normalizeToken = (value = '') => String(value)
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const toPathname = (value = '') => {
  try {
    return new URL(value, window.location.href).pathname;
  } catch {
    return '';
  }
};

const clampLevel = (index, ladder) => Math.max(0, Math.min(ladder.length - 1, index));

function inferFamiliarityLevel(signalCount = 0) {
  const count = Math.max(0, Number(signalCount) || 0);

  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 8) return 3;
  return 4;
}

function boostFamiliarityLevel(level, recentPath = null, currentPath = '', currentSurface = '') {
  if (!recentPath) return level;

  const recentPathname = recentPath.href ? toPathname(recentPath.href) : '';
  const recentTokens = Array.isArray(recentPath.tokens)
    ? recentPath.tokens.map(normalizeToken).filter(Boolean)
    : [];
  const currentSurfaceToken = normalizeToken(currentSurface);
  const currentPathToken = normalizeToken(currentPath);

  const matchedPath = Boolean(currentPath && recentPathname && recentPathname === currentPath);
  const matchedSurface = Boolean(currentSurfaceToken && recentTokens.includes(currentSurfaceToken));
  const matchedRoute = Boolean(currentPathToken && recentTokens.includes(currentPathToken));
  const denseRecent = recentTokens.length >= 4;

  if (matchedPath || matchedSurface || matchedRoute || denseRecent) {
    return level + 1;
  }

  return level;
}

export function describeFamiliarity({
  signalCount = 0,
  recentPath = null,
  currentPath = '',
  currentSurface = '',
} = {}) {
  const level = boostFamiliarityLevel(
    inferFamiliarityLevel(signalCount),
    recentPath,
    currentPath,
    currentSurface
  );

  return FAMILIARITY_LADDER[clampLevel(level, FAMILIARITY_LADDER)];
}

export function describeLiminality({
  pageLiminality = '',
  pageTransitionPhase = '',
  pageArrival = '',
} = {}) {
  const explicit = normalizeToken(pageLiminality);
  if (LIMINALITY_LADDER.includes(explicit)) return explicit;

  const transition = normalizeToken(pageTransitionPhase);
  if (LIMINALITY_LADDER.includes(transition)) return transition;

  const arrival = normalizeToken(pageArrival);
  if (LIMINALITY_LADDER.includes(arrival)) return arrival;

  if (['entering', 'returning', 'restored'].includes(arrival)) {
    return 'threshold';
  }

  if (arrival === 'settled' || transition === 'settled' || !arrival) {
    return 'settled';
  }

  return 'threshold';
}

export function describeCognitiveState(input = {}) {
  const familiarity = describeFamiliarity(input);
  const liminality = describeLiminality(input);

  return {
    familiarity,
    liminality,
    gradient: `${familiarity} · ${liminality}`,
  };
}
