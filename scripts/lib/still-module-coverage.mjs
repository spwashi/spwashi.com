/**
 * Join still recipes to the module catalog and fixture seats.
 *
 * visual:layout modules are visitor overlays a named still must prove.
 * visual:inspect and debugOnly are capture-hide chrome, not still subjects.
 * Recipe fixtureId must resolve to an ecology/component seat, or be the recipe id.
 */

const OVERLAY_SCOPE_RE = /floating-chrome|popover/;
const OVERLAY_DESCRIBES_RE = /\b(dialog|popover|menu|hints?|disclosure|toast|drawer)\b/i;

export function moduleLoadFile(def = {}) {
  const src = typeof def.load === 'function' ? def.load.toString() : '';
  const match = src.match(/import\(\s*['"]([^'"]+)['"]\s*\)/);
  if (!match) return null;
  try {
    return new URL(match[1], 'https://spwashi.local/public/js/runtime/catalog/').pathname.replace(/^\//, '');
  } catch {
    return null;
  }
}

export function stillCaptureRole(def = {}) {
  if (def.debugOnly) return 'inspect';
  if (def.visual === 'inspect') return 'inspect';
  if (def.visual === 'layout') return 'visitor';
  if (def.visual === 'behavior') return 'behavior';
  if (def.visual === 'express') return 'environment';
  return 'none';
}

function recipeFiles(recipe = {}) {
  return (recipe.sourceFiles || []).map((file) => String(file).replace(/^\//, ''));
}

function recipeCoversFile(recipe, file) {
  if (!file) return false;
  return recipeFiles(recipe).some((entry) => entry === file || entry.endsWith(`/${file}`) || file.endsWith(entry));
}

export function danglingStillFixtureIds(
  recipes = [],
  { ecologyFixtures = [], componentFixtures = [] } = {},
) {
  const seats = new Set([
    ...ecologyFixtures.map((fixture) => fixture.id),
    ...componentFixtures.map((fixture) => fixture.id),
  ]);
  const dangling = [];
  for (const recipe of recipes) {
    const fixtureId = recipe.fixtureId || recipe.id;
    if (!fixtureId) continue;
    if (fixtureId === recipe.id) continue;
    if (seats.has(fixtureId)) continue;
    dangling.push({ id: recipe.id, fixtureId });
  }
  return dangling;
}

export function accountStillCoverage({
  modules = [],
  recipes = [],
  checks = [],
  ecologyFixtures = [],
  componentFixtures = [],
} = {}) {
  const catalog = [...recipes, ...checks];
  const visitor = [];
  const behavior = [];
  const environment = [];
  const inspect = [];
  const unguardedOverlays = [];

  for (const def of modules) {
    if (!def?.id) continue;
    const role = stillCaptureRole(def);
    const file = moduleLoadFile(def);
    const coveredBy = catalog.filter((recipe) => recipeCoversFile(recipe, file)).map((recipe) => recipe.id);
    const row = { id: def.id, file, coveredBy };
    if (role === 'visitor') visitor.push(row);
    else if (role === 'behavior') behavior.push(row);
    else if (role === 'environment') environment.push(row);
    else if (role === 'inspect') inspect.push(row);
    else {
      const scope = String(def.effectScope || '');
      const describes = String(def.describes || '');
      if (OVERLAY_SCOPE_RE.test(scope) || OVERLAY_DESCRIBES_RE.test(describes)) {
        unguardedOverlays.push({ id: def.id, file, scope, describes });
      }
    }
  }

  const covered = (rows) => rows.filter((row) => row.coveredBy.length).map((row) => row.id);
  const miss = (rows) => rows.filter((row) => !row.coveredBy.length).map((row) => row.id);

  return {
    visitor: visitor.map((row) => row.id),
    visitorCovered: covered(visitor),
    visitorMiss: miss(visitor),
    behavior: behavior.map((row) => row.id),
    behaviorCovered: covered(behavior),
    behaviorMiss: miss(behavior),
    environment: environment.map((row) => row.id),
    environmentCovered: covered(environment),
    environmentMiss: miss(environment),
    inspect: inspect.map((row) => row.id),
    unguardedOverlays: unguardedOverlays.map((row) => row.id),
    danglingFixtureIds: danglingStillFixtureIds(catalog, { ecologyFixtures, componentFixtures }),
  };
}

export function formatStillCoverage(report = {}) {
  const line = (label, ids = []) => `${label}  ${ids.length ? ids.join(', ') : 'none'}`;
  return [
    line('visitor      ', report.visitor),
    line('visitor miss ', report.visitorMiss),
    line('behavior     ', report.behavior),
    line('behavior miss', report.behaviorMiss),
    line('environment  ', report.environment),
    line('env miss     ', report.environmentMiss),
    line('unguarded    ', report.unguardedOverlays),
  ].join('\n');
}
