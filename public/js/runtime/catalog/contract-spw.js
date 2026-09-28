/**
 * contract-spw.js — a module contract, read back as one Spw sentence.
 *
 * Derived, never authored: the flat catalog fields stay the source, and this
 * projection is what an inspector, the runtime atlas, or a caption on camera
 * shows. Facets follow the table in
 * .agents/plans/module-contract-overhaul/PLAN.md ("Contract Facets In Spw");
 * that operator mapping is the plan's named human decision, so treat these
 * lines as the proposal it describes until the creator settles it.
 *
 *   #>id #:layer            address and layer
 *   $[selector]{reach}       substrate: where it mounts, what it touches
 *   ~[when]{timingArc}       potential: when it wakes
 *   ?[dimensions]            probes: the rail dimensions it is read along
 *   ![role]{names}           acts: what it writes, one clause per role
 *   %[cost]                  measure: the budget label
 *   (visual)                 scene: first-paint permission, when declared
 *
 * Operators follow kernel/operator-detection.js.
 */

import { classifyModuleUpdate } from './updates-contract.js';

const ROLE_ORDER = ['residue', 'measure', 'structural', 'inspect', 'temporal', 'flourish', 'diagnostic'];

function handle(value = '') {
  return String(value).trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase();
}

function tokens(value) {
  if (value == null || value === '') return [];
  return (Array.isArray(value) ? value : String(value).split(/[\s,]+/)).map((entry) => String(entry).trim()).filter(Boolean);
}

function selectorHead(selector = '') {
  let first = String(selector || '').split(',')[0].trim();
  if (!first) return 'document';
  // Attribute selectors already wear brackets; inside $[…] they would read as
  // nested modes, so each condition is written plain and space-separated.
  first = first.replace(/\[([^\]]+)\]/g, ' $1 ').replace(/\s+/g, ' ').trim();
  return first.length > 48 ? `${first.slice(0, 45)}…` : first;
}

/** Group `updates` by role, in the scheduler's offer order. */
export function groupModuleUpdates(updates = []) {
  const groups = new Map();
  for (const entry of tokens(updates)) {
    const parsed = classifyModuleUpdate(entry);
    if (!parsed) continue;
    const role = parsed.role || 'structural';
    if (!groups.has(role)) groups.set(role, []);
    groups.get(role).push(parsed.name);
  }
  return ROLE_ORDER.filter((role) => groups.has(role)).map((role) => ({ role, names: groups.get(role) }));
}

/** One line per facet; empty facets are left out rather than printed as noise. */
export function formatModuleContractSpwLines(def = {}) {
  const lines = [`#>${handle(def.id)} #:${def.layer || 'unknown'}`];
  const reach = tokens(def.effectScope);
  lines.push(`$[${selectorHead(def.selector)}]${reach.length ? `{${reach.join(' ')}}` : ''}`);
  lines.push(`~[${def.when || 'immediate'}]${def.timingArc ? `{${def.timingArc}}` : ''}`);
  const dimensions = tokens(def.evaluates);
  if (dimensions.length) lines.push(`?[${dimensions.join(' ')}]`);
  const acts = groupModuleUpdates(def.updates).map(({ role, names }) => `![${role}]{${names.join(' ')}}`);
  if (acts.length) lines.push(acts.join(' '));
  const cost = def.costLabel || (def.cost ? `${def.cost.commitment}/${def.cost.spend}` : '');
  if (cost) lines.push(`%[${cost}]`);
  if (def.visual) lines.push(`(${def.visual})`);
  return lines;
}

export function formatModuleContractSpw(def = {}) {
  return formatModuleContractSpwLines(def).join('\n');
}

export const SPW_MODULE_CONTRACT_SPW = Object.freeze({
  facets: Object.freeze(['#> address', '#: layer', '$ substrate', '~ potential', '? probes', '! acts', '% measure', '( scene']),
  source: '.agents/plans/module-contract-overhaul/PLAN.md#contract-facets-in-spw',
  status: 'proposal — the operator mapping is the creator\'s call; the projection is derived and changes with it',
});
