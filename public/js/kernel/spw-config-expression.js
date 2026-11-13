/**
 * spw-config-expression.js
 * --------------------------------------------------------------------------
 * Pure, dependency-free combinatoric serializer and parser for Spw-native
 * configuration lines, machine-empathy summaries, and precipitated reasons
 * to wonder across ecosystem sites.
 *
 * Canonical shape:
 *   @<stance>(<process>)[<theme>.<color>]{<author>+<climate>|<layout>.<density>}<wonder.resonance>
 */

const KNOWN_STANCES = new Set(['witness', 'composer', 'explorer', 'integrator', 'overflow']);
const KNOWN_PROCESSES = new Set(['breath', 'scan', 'trace', 'compose']);
const KNOWN_COLORS = new Set(['auto', 'light', 'dark']);
const KNOWN_THEMES = new Set([
  'neutral-paper',
  'oxide-ledger',
  'electric-studio',
  'ritual-vellum',
  'copper-brace',
  'glass-console',
  'banked-ember',
]);
const KNOWN_AUTHORS = new Set(['draft', 'revise', 'polish', 'publish', 'archive']);
const KNOWN_CLIMATES = new Set(['orient', 'anchor', 'weave', 'rehearse', 'offer']);
const KNOWN_LAYOUTS = new Set(['reading', 'newspaper', 'wide', 'atlas']);
const KNOWN_DENSITIES = new Set(['dense', 'soft', 'roomy']);
const KNOWN_WONDER_MEMORY = new Set(['off', 'nearby', 'sitewide']);
const KNOWN_RESONANCE = new Set(['local', 'field', 'choral']);
const KNOWN_INTERACTION = new Set(['calm', 'responsive', 'expressive']);
const KNOWN_FLAVORS = new Set(['culinary', 'garden', 'studio', 'runtime']);

const EMPATHY_PROCESS_COPY = Object.freeze({
  breath: Object.freeze({
    label: 'breath',
    cadence: '1.32× unhurried slot reveal & gentle hover patience',
    pull: 'soft magnetic tether (0.32)',
  }),
  scan: Object.freeze({
    label: 'scan',
    cadence: '0.72× brisk reveal for quick orientation',
    pull: 'moderate magnetic tether (0.52)',
  }),
  trace: Object.freeze({
    label: 'trace',
    cadence: '1.04× balanced timing tuned for following kin',
    pull: 'high magnetic affinity across kin (0.96)',
  }),
  compose: Object.freeze({
    label: 'compose',
    cadence: '0.88× responsive turn cadence ready for synthesis',
    pull: 'strong component attraction (0.82)',
  }),
});

const EMPATHY_STANCE_COPY = Object.freeze({
  witness: 'keeps background calm and yields 28% extra hover/dwell grace',
  composer: 'brings controls and action handles forward with direct response',
  explorer: 'lights wonder probes, questions, and neighbor bridges first',
  integrator: 'weights semantic expressions and cross-surface synthesis panels',
  overflow: 'allows generous traces and dense connections to stay open together',
});

export function formatSettingsSpwExpression(settings = {}, { defaults = null, compact = false } = {}) {
  const s = settings || {};
  const d = defaults || {};

  const stance = s.metacognitiveStance || 'witness';
  const process = s.processAttention || 'breath';
  const theme = s.themePack || 'neutral-paper';
  const color = s.colorMode || 'auto';
  const author = s.authorMode || 'draft';
  const climate = s.currentDevelopmentalClimate || 'orient';
  const layout = s.layoutTuner || 'reading';
  const density = s.componentDensity || 'soft';
  const wonder = s.wonderMemory || 'nearby';
  const resonance = s.fieldResonance || 'field';

  if (!compact || !defaults) {
    return `@${stance}(${process})[${theme}.${color}]{${author}+${climate}|${layout}.${density}}<${wonder}.${resonance}>`;
  }

  const parts = [];
  if (stance !== d.metacognitiveStance) parts.push(`@${stance}`);
  if (process !== d.processAttention) parts.push(`(${process})`);

  const look = [
    theme !== d.themePack ? theme : '',
    color !== d.colorMode ? color : '',
  ].filter(Boolean);
  if (look.length) parts.push(`[${look.join('.')}]`);

  const work = [
    author !== d.authorMode ? author : '',
    climate !== d.currentDevelopmentalClimate ? climate : '',
  ].filter(Boolean);
  const frame = [
    layout !== d.layoutTuner ? layout : '',
    density !== d.componentDensity ? density : '',
  ].filter(Boolean);
  const body = [work.join('+'), frame.join('.')].filter(Boolean).join('|');
  if (body) parts.push(`{${body}}`);

  const field = [
    wonder !== d.wonderMemory ? wonder : '',
    resonance !== d.fieldResonance ? resonance : '',
  ].filter(Boolean);
  if (field.length) parts.push(`<${field.join('.')}>`);

  return parts.join('') || `@${stance}(${process})[${theme}.${color}]{${author}+${climate}}`;
}

function splitTokens(raw = '') {
  return String(raw || '')
    .trim()
    .split(/[\s.+|;,/]+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}

export function parseSettingsSpwExpression(expression = '', { validateSetting = null } = {}) {
  const text = String(expression || '').trim();
  const candidates = {};
  const rejected = [];

  if (!text) return { partial: candidates, recognized: [], rejected };

  const stanceMatch = text.match(/@([a-z-]+)/i);
  if (stanceMatch) {
    const token = stanceMatch[1].toLowerCase();
    if (KNOWN_STANCES.has(token)) candidates.metacognitiveStance = token;
    else rejected.push(`@${token}`);
  }

  const parenMatch = text.match(/\(([^)]+)\)/);
  if (parenMatch) {
    for (const token of splitTokens(parenMatch[1])) {
      if (KNOWN_PROCESSES.has(token)) candidates.processAttention = token;
      else if (KNOWN_INTERACTION.has(token)) candidates.interactionTuner = token;
      else rejected.push(token);
    }
  }

  const bracketMatch = text.match(/\[([^\]]+)\]/);
  if (bracketMatch) {
    for (const token of splitTokens(bracketMatch[1])) {
      if (KNOWN_THEMES.has(token)) candidates.themePack = token;
      else if (KNOWN_COLORS.has(token)) candidates.colorMode = token;
      else if (KNOWN_FLAVORS.has(token)) candidates.pedagogicalFlavor = token;
      else rejected.push(token);
    }
  }

  const braceMatch = text.match(/\{([^}]+)\}/);
  if (braceMatch) {
    for (const token of splitTokens(braceMatch[1])) {
      if (token.includes('=')) {
        const [k, v] = token.split('=', 2);
        if (k && v) candidates[k] = v;
        continue;
      }
      if (KNOWN_AUTHORS.has(token)) candidates.authorMode = token;
      else if (KNOWN_CLIMATES.has(token)) candidates.currentDevelopmentalClimate = token;
      else if (KNOWN_LAYOUTS.has(token)) candidates.layoutTuner = token;
      else if (KNOWN_DENSITIES.has(token)) candidates.componentDensity = token;
      else if (KNOWN_INTERACTION.has(token)) candidates.interactionTuner = token;
      else rejected.push(token);
    }
  }

  const angleMatch = text.match(/<([^>]+)>/);
  if (angleMatch) {
    for (const token of splitTokens(angleMatch[1])) {
      if (KNOWN_WONDER_MEMORY.has(token)) candidates.wonderMemory = token;
      else if (KNOWN_RESONANCE.has(token)) candidates.fieldResonance = token;
      else if (KNOWN_FLAVORS.has(token)) candidates.pedagogicalFlavor = token;
      else rejected.push(token);
    }
  }

  if (typeof validateSetting !== 'function') {
    return {
      partial: candidates,
      recognized: Object.keys(candidates),
      rejected,
    };
  }

  const partial = {};
  for (const [key, value] of Object.entries(candidates)) {
    if (validateSetting(key, value)?.valid) partial[key] = value;
    else rejected.push(`${key}:${value}`);
  }

  return {
    partial,
    recognized: Object.keys(partial),
    rejected,
  };
}

export function describeMachineEmpathy(settings = {}) {
  const process = EMPATHY_PROCESS_COPY[settings.processAttention] || EMPATHY_PROCESS_COPY.breath;
  const stance = settings.metacognitiveStance || 'witness';
  const stanceNote = EMPATHY_STANCE_COPY[stance] || EMPATHY_STANCE_COPY.witness;
  const interaction = settings.interactionTuner || 'responsive';

  return Object.freeze({
    stance,
    process: process.label,
    cadence: process.cadence,
    pull: process.pull,
    title: `@${stance}(${process.label}) · ${interaction}`,
    summary: `Stance ${stanceNote}; arc runs ${process.cadence} with ${process.pull}.`,
    spwSignature: formatSettingsSpwExpression(settings),
  });
}

export function precipitateWonderReason(settings = {}, context = {}) {
  const s = settings || {};
  const stance = s.metacognitiveStance || 'witness';
  const process = s.processAttention || 'breath';
  const climate = s.currentDevelopmentalClimate || 'orient';
  const author = s.authorMode || 'draft';

  const rawWonder = String(context.wonder || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .join('+');
  const wonderPart = rawWonder || s.fieldResonance || 'field';
  const route = String(context.route || '/').trim() || '/';
  const expr = String(context.expression || '').trim();
  const body = expr ? `${route}|${expr}` : `${route}|${author}+${climate}`;

  return `?[${wonderPart}]{${body}}<@${stance}(${process}){${s.wonderMemory || 'nearby'}}>` ;
}
