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

export const MODULE_UPDATE_KIND_LABELS = Object.freeze({
  attr: 'attrs',
  'css-var': 'css vars',
  aria: 'aria',
  class: 'classes',
  event: 'events',
  selector: 'selectors',
  property: 'properties',
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

const DATASET_SEPARATOR = '|';
const LIST_SEPARATOR = ' ';

function cleanToken(value = '') {
  return String(value).trim().replace(/\s+/g, ' ');
}

function normalizeKind(value = '') {
  const token = cleanToken(value).toLowerCase();
  return KIND_ALIASES[token] || (MODULE_UPDATE_KINDS.includes(token) ? token : 'attr');
}

function isKnownKindToken(value = '') {
  const token = cleanToken(value).toLowerCase();
  return KIND_ALIASES[token] != null || MODULE_UPDATE_KINDS.includes(token);
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
  return `${scope}${entry.kind}:${entry.name}`;
}

function parseStructuredUpdate(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const name = cleanToken(entry.name || entry.key || entry.token || entry.target || '');
  if (!name) return null;
  const kind = entry.kind ? normalizeKind(entry.kind) : inferKindFromName(name);
  const scope = cleanToken(entry.scope || entry.surface || entry.owner || '') || null;
  return { kind, name, scope, raw: name };
}

function parseStringUpdate(entry = '', allowScope = true) {
  const raw = cleanToken(entry);
  if (!raw) return null;

  if (allowScope) {
    const scopeMatch = raw.match(/^([a-z]+):(.+)$/i);
    if (scopeMatch && MODULE_UPDATE_SCOPES.includes(scopeMatch[1].toLowerCase())) {
      const inner = parseStringUpdate(scopeMatch[2], false);
      if (!inner) return null;
      return { ...inner, scope: scopeMatch[1].toLowerCase(), raw };
    }
  }

  const explicit = raw.match(/^([a-z-]+):(.+)$/i);
  if (explicit && isKnownKindToken(explicit[1])) {
    const kind = normalizeKind(explicit[1]);
    const name = cleanToken(explicit[2]);
    if (!name) return null;
    return { kind, name, scope: null, raw };
  }

  const kind = inferKindFromName(raw);
  return { kind, name: raw, scope: null, raw };
}

export function classifyModuleUpdate(entry) {
  if (typeof entry === 'string') return parseStringUpdate(entry);
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

export function groupModuleUpdatesByKind(updates) {
  const grouped = Object.fromEntries(MODULE_UPDATE_KINDS.map((kind) => [kind, []]));
  normalizeModuleUpdates(updates).forEach((entry) => {
    if (!grouped[entry.kind]) grouped[entry.kind] = [];
    grouped[entry.kind].push(entry.name);
  });
  return grouped;
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

export function serializeModuleUpdatesContract(updates) {
  return summarizeModuleUpdates(updates, { separator: DATASET_SEPARATOR });
}

export function listModuleUpdateNames(updates, kind = null) {
  const normalized = normalizeModuleUpdates(updates);
  if (!kind) return normalized.map((entry) => entry.name);
  return normalized.filter((entry) => entry.kind === kind).map((entry) => entry.name);
}

export function describeModuleUpdates(updates) {
  const normalized = normalizeModuleUpdates(updates);
  const grouped = groupModuleUpdatesByKind(updates);
  const kinds = MODULE_UPDATE_KINDS.filter((kind) => grouped[kind]?.length);
  const scopes = [...new Set(normalized.map((entry) => entry.scope).filter(Boolean))];

  return {
    count: normalized.length,
    kinds,
    scopes,
    grouped,
    items: normalized,
    summary: summarizeModuleUpdates(updates),
    spell: formatModuleUpdatesSpell(updates),
    readable: formatModuleUpdatesReadable(updates),
    brief: formatModuleUpdatesBrief(updates),
  };
}

export function validateModuleUpdateToken(token = '') {
  const parsed = classifyModuleUpdate(token);
  if (!parsed) return { valid: false, reason: 'empty-token' };

  const { kind, name, scope } = parsed;
  if (scope && !MODULE_UPDATE_SCOPES.includes(scope)) {
    return { valid: false, reason: 'scope-shape', parsed };
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
  kindLabels: MODULE_UPDATE_KIND_LABELS,
  aliases: KIND_ALIASES,
  portableUse:
    'Declare module updates as flat strings or kind:name objects; normalizeModuleUpdates() groups attrs, css vars, aria, classes, events, selectors, and properties for inspection.',
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
  ]),
  datasetFields: Object.freeze({
    all: 'data-spw-module-updates',
    contract: 'data-spw-module-updates-contract',
    attrs: 'data-spw-module-updates-attrs',
    cssVars: 'data-spw-module-updates-vars',
    aria: 'data-spw-module-updates-aria',
    classes: 'data-spw-module-updates-classes',
    events: 'data-spw-module-updates-events',
    kinds: 'data-spw-module-updates-kinds',
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
  changed = writeDatasetValue(target, 'spwModuleUpdatesKinds', contract.kinds.join(' '), { separator: LIST_SEPARATOR }) || changed;
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