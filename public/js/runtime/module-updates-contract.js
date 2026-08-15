/**
 * module-updates-contract.js
 * --------------------------------------------------------------------------
 * Normalizes module `updates` declarations into inspectable, grouped contracts.
 * Catalog authors keep flat strings; runtime derives kind, scope, and summaries.
 */

import { writeDatasetValue } from '../kernel/dom-contracts.js';

export const MODULE_UPDATE_KINDS = Object.freeze([
  'attr',
  'css-var',
  'aria',
  'class',
  'event',
  'selector',
  'property',
]);

export const MODULE_UPDATE_SCOPES = Object.freeze([
  'html',
  'root',
  'body',
  'document',
  'frame',
]);

/**
 * Topology roles — why a module writes a surface, not only what kind it is.
 * Flourishes are ornamental residue (pulses, ledger halos, reward chrome);
 * structural is identity/layout grammar; residue is precipitated memory.
 */
export const MODULE_UPDATE_ROLES = Object.freeze([
  'structural',
  'flourish',
  'inspect',
  'residue',
  'measure',
  'diagnostic',
]);

export const MODULE_UPDATE_KIND_LABELS = Object.freeze({
  attr: 'attrs',
  'css-var': 'css vars',
  aria: 'aria',
  class: 'classes',
  event: 'events',
  selector: 'selectors',
  property: 'properties',
});

export const MODULE_UPDATE_ROLE_LABELS = Object.freeze({
  structural: 'structure',
  flourish: 'flourishes',
  inspect: 'inspect',
  residue: 'residue',
  measure: 'measure',
  diagnostic: 'diagnostics',
});

const KIND_ALIASES = Object.freeze({
  attribute: 'attr',
  attributes: 'attr',
  dataset: 'attr',
  var: 'css-var',
  'css-var': 'css-var',
  css: 'css-var',
  style: 'property',
  property: 'property',
  class: 'class',
  aria: 'aria',
  event: 'event',
  selector: 'selector',
});

const ROLE_ALIASES = Object.freeze({
  structural: 'structural',
  structure: 'structural',
  flourish: 'flourish',
  flourishes: 'flourish',
  ornament: 'flourish',
  pulse: 'flourish',
  inspect: 'inspect',
  inspection: 'inspect',
  residue: 'residue',
  memory: 'residue',
  measure: 'measure',
  metric: 'measure',
  diagnostic: 'diagnostic',
  diagnostics: 'diagnostic',
  debug: 'diagnostic',
});

const DATASET_SEPARATOR = '|';
const LIST_SEPARATOR = ' ';

function cleanToken(value = '') {
  return String(value).trim().replace(/\s+/g, ' ');
}

function normalizeKind(value = '') {
  const token = cleanToken(value).toLowerCase();
  return KIND_ALIASES[token] || (MODULE_UPDATE_KINDS.includes(token) ? token : 'attr');
}

function normalizeRole(value = '') {
  const token = cleanToken(value).toLowerCase();
  if (!token) return null;
  return ROLE_ALIASES[token] || (MODULE_UPDATE_ROLES.includes(token) ? token : null);
}

function isKnownKindToken(value = '') {
  const token = cleanToken(value).toLowerCase();
  return KIND_ALIASES[token] != null || MODULE_UPDATE_KINDS.includes(token);
}

function isKnownRoleToken(value = '') {
  return Boolean(normalizeRole(value));
}

function inferKindFromName(name = '') {
  const token = cleanToken(name);
  if (!token) return 'attr';
  if (token.startsWith('--')) return 'css-var';
  if (token.startsWith('aria-')) return 'aria';
  if (token.startsWith('.')) return 'class';
  if (token.startsWith('spw:') || /^[a-z][a-z0-9-]*:[a-z0-9-]+$/.test(token)) return 'event';
  if (/^[#.[]/.test(token) || token.includes(' ')) return 'selector';
  return 'attr';
}

function moduleUpdateKey(entry) {
  const scope = entry?.scope ? `${entry.scope}:` : '';
  const role = entry?.role ? `${entry.role}:` : '';
  return `${scope}${role}${entry.kind}:${entry.name}`;
}

function parseStructuredUpdate(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const name = cleanToken(entry.name || entry.key || entry.token || entry.target || '');
  if (!name) return null;
  const kind = entry.kind ? normalizeKind(entry.kind) : inferKindFromName(name);
  const scope = cleanToken(entry.scope || entry.surface || entry.owner || '') || null;
  const role = normalizeRole(entry.role || entry.topology || entry.purpose || '') || null;
  return { kind, name, scope, role, raw: name };
}

/**
 * Parse string update tokens.
 * Order of prefixes (each optional, left-to-right):
 *   scope:  html|root|body|document|frame
 *   role:   structural|flourish|inspect|residue|measure|diagnostic
 *   kind:   attr|css-var|aria|class|event|selector|property
 * Examples:
 *   data-spw-effects
 *   html:data-spw-effects
 *   flourish:data-spw-effects
 *   html:flourish:--spw-effect-charge
 *   residue:event:effect:recorded
 */
function parseStringUpdate(entry = '', options = {}) {
  const allowScope = options.allowScope !== false;
  const allowRole = options.allowRole !== false;
  const raw = cleanToken(entry);
  if (!raw) return null;

  if (allowScope) {
    const scopeMatch = raw.match(/^([a-z]+):(.+)$/i);
    if (scopeMatch && MODULE_UPDATE_SCOPES.includes(scopeMatch[1].toLowerCase())) {
      const inner = parseStringUpdate(scopeMatch[2], { allowScope: false, allowRole });
      if (!inner) return null;
      return { ...inner, scope: scopeMatch[1].toLowerCase(), raw };
    }
  }

  if (allowRole) {
    const roleMatch = raw.match(/^([a-z]+):(.+)$/i);
    if (roleMatch && isKnownRoleToken(roleMatch[1])) {
      const inner = parseStringUpdate(roleMatch[2], { allowScope: false, allowRole: false });
      if (!inner) return null;
      return { ...inner, role: normalizeRole(roleMatch[1]), raw };
    }
  }

  const explicit = raw.match(/^([a-z-]+):(.+)$/i);
  if (explicit && isKnownKindToken(explicit[1])) {
    const kind = normalizeKind(explicit[1]);
    const name = cleanToken(explicit[2]);
    if (!name) return null;
    return { kind, name, scope: null, role: null, raw };
  }

  const kind = inferKindFromName(raw);
  return { kind, name: raw, scope: null, role: null, raw };
}

export function classifyModuleUpdate(entry) {
  if (typeof entry === 'string') return parseStringUpdate(entry, { allowScope: true, allowRole: true });
  return parseStructuredUpdate(entry);
}

export function coerceModuleUpdates(updates) {
  return normalizeModuleUpdates(updates);
}

export function normalizeModuleUpdates(updates) {
  if (!updates) return [];
  const source = Array.isArray(updates) ? updates : [updates];
  const seen = new Set();
  const normalized = [];

  source.forEach((entry) => {
    const parsed = classifyModuleUpdate(entry);
    if (!parsed) return;
    const key = moduleUpdateKey(parsed);
    if (seen.has(key)) return;
    seen.add(key);
    normalized.push(parsed);
  });

  return normalized;
}

export function mergeModuleUpdates(...sources) {
  return normalizeModuleUpdates(sources.flat().filter(Boolean));
}

function groupModuleUpdatesByKind(updates) {
  const grouped = Object.fromEntries(MODULE_UPDATE_KINDS.map((kind) => [kind, []]));
  normalizeModuleUpdates(updates).forEach((entry) => {
    if (!grouped[entry.kind]) grouped[entry.kind] = [];
    grouped[entry.kind].push(entry.name);
  });
  return grouped;
}

export function groupModuleUpdatesByRole(updates) {
  const grouped = Object.fromEntries(MODULE_UPDATE_ROLES.map((role) => [role, []]));
  grouped.unspecified = [];
  normalizeModuleUpdates(updates).forEach((entry) => {
    const role = entry.role || 'unspecified';
    if (!grouped[role]) grouped[role] = [];
    grouped[role].push(entry.name);
  });
  return grouped;
}

export function listModuleUpdatesByRole(updates, role = 'flourish') {
  const wanted = normalizeRole(role);
  if (!wanted) return [];
  return normalizeModuleUpdates(updates)
    .filter((entry) => entry.role === wanted)
    .map((entry) => entry.name);
}

/**
 * Compact topology summary: kinds + roles for inspectors and flourish CSS.
 * Example: "attr:3|css-var:2|role:flourish:4|role:residue:1"
 */
export function summarizeModuleUpdatesTopology(updates, options = {}) {
  const { separator = '|' } = options;
  const kindPart = summarizeModuleUpdates(updates, { separator });
  const byRole = groupModuleUpdatesByRole(updates);
  const rolePart = MODULE_UPDATE_ROLES
    .filter((role) => byRole[role]?.length)
    .map((role) => `role:${role}:${byRole[role].length}`)
    .join(separator);
  return [kindPart, rolePart].filter(Boolean).join(separator);
}

export function summarizeModuleUpdates(updates, options = {}) {
  const { separator = '|' } = options;
  const grouped = groupModuleUpdatesByKind(updates);
  return MODULE_UPDATE_KINDS
    .filter((kind) => grouped[kind]?.length)
    .map((kind) => `${kind}:${grouped[kind].join(',')}`)
    .join(separator);
}

export function formatModuleUpdatesSpell(updates) {
  const grouped = groupModuleUpdatesByKind(updates);
  const parts = MODULE_UPDATE_KINDS
    .filter((kind) => grouped[kind]?.length)
    .map((kind) => `${kind}:${grouped[kind].join('+')}`);
  return parts.length ? `{updates:${parts.join('|')}}` : '';
}

export function formatModuleUpdatesReadable(updates, options = {}) {
  const { maxPerKind = 3, separator = ' · ' } = options;
  const grouped = groupModuleUpdatesByKind(updates);
  const parts = MODULE_UPDATE_KINDS
    .filter((kind) => grouped[kind]?.length)
    .map((kind) => {
      const label = MODULE_UPDATE_KIND_LABELS[kind] || kind;
      const names = grouped[kind];
      const shown = names.slice(0, maxPerKind).join(', ');
      const overflow = names.length > maxPerKind ? ` +${names.length - maxPerKind}` : '';
      return `${label} (${names.length}): ${shown}${overflow}`;
    });
  return parts.join(separator);
}

export function formatModuleUpdatesBrief(updates) {
  const normalized = normalizeModuleUpdates(updates);
  if (!normalized.length) return '';
  const grouped = groupModuleUpdatesByKind(updates);
  const kinds = MODULE_UPDATE_KINDS.filter((kind) => grouped[kind]?.length);
  const kindLabels = kinds.map((kind) => MODULE_UPDATE_KIND_LABELS[kind] || kind);
  return `${normalized.length} update${normalized.length === 1 ? '' : 's'} · ${kindLabels.join(', ')}`;
}

function listModuleUpdateNames(updates, kind = null) {
  const normalized = normalizeModuleUpdates(updates);
  if (!kind) return normalized.map((entry) => entry.name);
  return normalized.filter((entry) => entry.kind === kind).map((entry) => entry.name);
}

export function describeModuleUpdates(updates) {
  const normalized = normalizeModuleUpdates(updates);
  const grouped = groupModuleUpdatesByKind(updates);
  const byRole = groupModuleUpdatesByRole(updates);
  const kinds = MODULE_UPDATE_KINDS.filter((kind) => grouped[kind]?.length);
  const roles = MODULE_UPDATE_ROLES.filter((role) => byRole[role]?.length);
  const scopes = [...new Set(normalized.map((entry) => entry.scope).filter(Boolean))];
  const flourishes = listModuleUpdatesByRole(updates, 'flourish');

  return {
    count: normalized.length,
    kinds,
    roles,
    scopes,
    grouped,
    byRole,
    flourishes,
    items: normalized,
    summary: summarizeModuleUpdates(updates),
    topology: summarizeModuleUpdatesTopology(updates),
    spell: formatModuleUpdatesSpell(updates),
    readable: formatModuleUpdatesReadable(updates),
    brief: formatModuleUpdatesBrief(updates),
  };
}

export function validateModuleUpdateToken(token = '') {
  const parsed = classifyModuleUpdate(token);
  if (!parsed) return { valid: false, reason: 'empty-token' };

  const { kind, name, scope, role } = parsed;
  if (scope && !MODULE_UPDATE_SCOPES.includes(scope)) {
    return { valid: false, reason: 'scope-shape', parsed };
  }
  if (role && !MODULE_UPDATE_ROLES.includes(role)) {
    return { valid: false, reason: 'role-shape', parsed };
  }
  if (kind === 'attr' && !/^(data-[a-z0-9-]+|aria-[a-z0-9-]+|[a-z][a-z0-9-]*)$/.test(name)) {
    return { valid: false, reason: 'attr-shape', parsed };
  }
  if (kind === 'css-var' && !/^--[a-z0-9-]+$/.test(name)) {
    return { valid: false, reason: 'css-var-shape', parsed };
  }
  if (kind === 'aria' && !/^aria-[a-z0-9-]+$/.test(name)) {
    return { valid: false, reason: 'aria-shape', parsed };
  }
  if (kind === 'class' && !/^\.[a-z0-9_-]+$/.test(name)) {
    return { valid: false, reason: 'class-shape', parsed };
  }
  if (kind === 'event' && !/^[a-z][a-z0-9-]*:[a-z0-9-]+$/.test(name)) {
    return { valid: false, reason: 'event-shape', parsed };
  }
  if (kind === 'selector' && !/^[#.[]/.test(name) && !name.includes(' ')) {
    return { valid: false, reason: 'selector-shape', parsed };
  }
  if (kind === 'property' && !/^[a-z-]+$/.test(name)) {
    return { valid: false, reason: 'property-shape', parsed };
  }
  return { valid: true, parsed };
}

export function buildModuleUpdatesIndex(modules = []) {
  const index = new Map();

  modules.forEach((module) => {
    const id = module?.baseId || module?.id;
    if (!id) return;

    normalizeModuleUpdates(module.updates).forEach((entry) => {
      const key = moduleUpdateKey(entry);
      const owners = index.get(key) || [];
      owners.push({ id, scope: entry.scope || null });
      index.set(key, owners);
    });
  });

  return index;
}

export function findModuleUpdateConflicts(modules = []) {
  const index = buildModuleUpdatesIndex(modules);
  const conflicts = [];

  index.forEach((owners, key) => {
    if (owners.length > 1) {
      conflicts.push({ key, owners });
    }
  });

  return conflicts;
}

export function findModuleUpdateOwners(modules = [], query = '') {
  const parsed = classifyModuleUpdate(query);
  if (!parsed) return [];
  const key = moduleUpdateKey(parsed);
  return buildModuleUpdatesIndex(modules).get(key) || [];
}

export function readModuleUpdatesFromTarget(target) {
  if (!(target instanceof HTMLElement)) return describeModuleUpdates([]);

  const { dataset } = target;
  if (dataset.spwModuleUpdatesContract) {
    const items = [];
    dataset.spwModuleUpdatesContract.split(DATASET_SEPARATOR).forEach((group) => {
      const splitAt = group.indexOf(':');
      if (splitAt < 0) return;
      const kind = normalizeKind(group.slice(0, splitAt));
      const names = group.slice(splitAt + 1).split(',').map(cleanToken).filter(Boolean);
      names.forEach((name) => {
        items.push({ kind, name, scope: null, raw: name });
      });
    });
    return describeModuleUpdates(items);
  }

  if (dataset.spwModuleUpdates) {
    return describeModuleUpdates(dataset.spwModuleUpdates.split(/\s+/).filter(Boolean));
  }

  return describeModuleUpdates([]);
}

export const SPW_MODULE_UPDATES_CONTRACT = Object.freeze({
  kinds: MODULE_UPDATE_KINDS,
  scopes: MODULE_UPDATE_SCOPES,
  roles: MODULE_UPDATE_ROLES,
  kindLabels: MODULE_UPDATE_KIND_LABELS,
  roleLabels: MODULE_UPDATE_ROLE_LABELS,
  aliases: KIND_ALIASES,
  roleAliases: ROLE_ALIASES,
  portableUse:
    'Declare module updates as flat strings or objects; optional scope: and role: prefixes (html:flourish:--token). normalizeModuleUpdates() groups by kind and topology role for inspect + flourish CSS.',
  stringForms: Object.freeze([
    'data-spw-example',
    '--spw-example-token',
    'aria-expanded',
    '.spw-example',
    'spw:example-event',
    'attr:data-spw-example',
    'css-var:--spw-example-token',
    'html:data-spw-example',
    'root:--spw-example-token',
    'flourish:data-spw-effects',
    'html:flourish:--spw-effect-charge',
    'residue:event:effect:recorded',
  ]),
  datasetFields: Object.freeze({
    all: 'data-spw-module-updates',
    contract: 'data-spw-module-updates-contract',
    topology: 'data-spw-module-updates-topology',
    attrs: 'data-spw-module-updates-attrs',
    cssVars: 'data-spw-module-updates-vars',
    aria: 'data-spw-module-updates-aria',
    classes: 'data-spw-module-updates-classes',
    events: 'data-spw-module-updates-events',
    kinds: 'data-spw-module-updates-kinds',
    roles: 'data-spw-module-updates-roles',
    flourishes: 'data-spw-module-updates-flourishes',
    scopes: 'data-spw-module-updates-scopes',
    count: 'data-spw-module-updates-count',
    spell: 'data-spw-module-updates-spell',
    readable: 'data-spw-module-updates-readable',
    brief: 'data-spw-module-updates-brief',
  }),
});

export function annotateModuleUpdatesTarget(target, updates) {
  if (!(target instanceof HTMLElement)) return false;

  const contract = describeModuleUpdates(updates);
  if (!contract.count) return false;

  const grouped = contract.grouped;
  let changed = false;
  changed = writeDatasetValue(target, 'spwModuleUpdates', listModuleUpdateNames(updates), { separator: LIST_SEPARATOR }) || changed;
  changed = writeDatasetValue(target, 'spwModuleUpdatesContract', contract.summary, { separator: DATASET_SEPARATOR }) || changed;
  changed = writeDatasetValue(target, 'spwModuleUpdatesTopology', contract.topology || null, { separator: DATASET_SEPARATOR }) || changed;
  changed = writeDatasetValue(target, 'spwModuleUpdatesKinds', contract.kinds.join(' '), { separator: LIST_SEPARATOR }) || changed;
  changed = writeDatasetValue(target, 'spwModuleUpdatesRoles', contract.roles.join(' ') || null, { separator: LIST_SEPARATOR }) || changed;
  changed = writeDatasetValue(target, 'spwModuleUpdatesFlourishes', contract.flourishes.join(' ') || null, { separator: LIST_SEPARATOR }) || changed;
  changed = writeDatasetValue(target, 'spwModuleUpdatesCount', String(contract.count)) || changed;
  changed = writeDatasetValue(target, 'spwModuleUpdatesSpell', contract.spell || null) || changed;
  changed = writeDatasetValue(target, 'spwModuleUpdatesReadable', contract.readable || null) || changed;
  changed = writeDatasetValue(target, 'spwModuleUpdatesBrief', contract.brief || null) || changed;
  changed = writeDatasetValue(target, 'spwModuleUpdatesScopes', contract.scopes.join(' ') || null) || changed;
  changed = writeDatasetValue(target, 'spwModuleUpdatesAttrs', grouped.attr?.join(' ') || null) || changed;
  changed = writeDatasetValue(target, 'spwModuleUpdatesVars', grouped['css-var']?.join(' ') || null) || changed;
  changed = writeDatasetValue(target, 'spwModuleUpdatesAria', grouped.aria?.join(' ') || null) || changed;
  changed = writeDatasetValue(target, 'spwModuleUpdatesClasses', grouped.class?.join(' ') || null) || changed;
  changed = writeDatasetValue(target, 'spwModuleUpdatesEvents', grouped.event?.join(' ') || null) || changed;
  return changed;
}

export function normalizeSubfeatures(subfeatures) {
  if (!subfeatures) return [];
  const list = Array.isArray(subfeatures) ? subfeatures : String(subfeatures).split(/[\s,]+/);
  return [...new Set(list.map(cleanToken).filter(Boolean))];
}

export function normalizeTriggers(triggers) {
  if (!triggers) return [];
  const list = Array.isArray(triggers) ? triggers : String(triggers).split(/[\s,]+/);
  return [...new Set(list.map(cleanToken).filter(Boolean))];
}

export function normalizeAffordances(affordances) {
  if (!affordances) return [];
  const list = Array.isArray(affordances) ? affordances : String(affordances).split(/[\s,]+/);
  return [...new Set(list.map(cleanToken).filter(Boolean))];
}

export function normalizeElectrostatics(electrostatics = {}) {
  if (!electrostatics || typeof electrostatics !== 'object') return null;
  const role = cleanToken(electrostatics.role || '');
  const discharge = cleanToken(electrostatics.discharge || '');
  const dielectric = Boolean(electrostatics.dielectric);
  const field = cleanToken(electrostatics.field || '');
  return {
    role: role || null,
    discharge: discharge || null,
    dielectric,
    field: field || null,
  };
}

export function describeModuleAffordanceStory(def) {
  const id = def?.id || 'anonymous';
  const subfeatures = normalizeSubfeatures(def?.subfeatures);
  const triggers = normalizeTriggers(def?.triggers);
  const affordances = normalizeAffordances(def?.affordances);
  const electrostatics = normalizeElectrostatics(def?.electrostatics);

  return {
    id,
    subfeatures,
    triggers,
    affordances,
    electrostatics,
    summary: affordances.length
      ? `${id} awakens on [${triggers.join(', ') || 'default'}] to enable (${affordances.join(', ')}) via <${electrostatics?.role || 'organelle'}>`
      : `${id} (${def?.describes || 'runtime module'})`,
  };
}