/**
 * Project a .spw source into a room: title, named blocks, and the
 * document slots a reader can scan without a server.
 */

import { parse } from '/public/js/semantic/spw-workbench-parser.js';

export const ROOM_SLOTS = Object.freeze([
  'seed',
  'source',
  'axes',
  'clusters',
  'bridges',
  'operators',
  'queries',
]);

const SLOT_NAMES = new Set(ROOM_SLOTS);

function unwrap(value) {
  return String(value ?? '').replace(/^['"`]|['"`]$/g, '');
}

function textOf(node) {
  if (!node || typeof node !== 'object') return '';
  if (node.type === 'Literal') return unwrap(node.token?.value);
  if (node.type === 'Identifier') return node.token?.value || '';
  if (node.type === 'ProseChunk') return String(node.text || '').trim();
  if (node.type === 'Particle') return node.name?.value || '';
  if (node.type === 'PathRef') return unwrap(node.path?.token?.value || node.raw || '');
  if (node.type === 'Expression' && node.terms?.length === 1) return textOf(node.terms[0]);
  return '';
}

function identOf(node) {
  const term = node?.type === 'Expression' && node.terms?.length === 1 ? node.terms[0] : node;
  return term?.type === 'Identifier' ? term.token?.value || '' : '';
}

function isEquals(node) {
  const term = node?.type === 'Expression' && node.terms?.length === 1 ? node.terms[0] : node;
  return term?.type === 'Operation' && term.operator?.value === '=';
}

export function itemsFromSequence(sequence) {
  const expressions = sequence?.expressions || [];
  const items = [];
  for (let index = 0; index < expressions.length; index += 1) {
    const name = identOf(expressions[index]);
    if (name && isEquals(expressions[index + 1])) {
      const value = textOf(expressions[index + 2]);
      items.push(value ? `${name} — ${value}` : name);
      index += 2;
      continue;
    }
    const text = textOf(expressions[index]);
    if (text) items.push(text);
  }
  return items;
}

function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  if (node.type) visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((entry) => walk(entry, visit));
    else walk(value, visit);
  }
}

function emptySlots() {
  return Object.fromEntries(ROOM_SLOTS.map((slot) => [slot, []]));
}

export function projectSpwRoom(source, name = '') {
  const input = String(source ?? '');
  const slots = emptySlots();
  const blocks = [];
  const links = [];
  let title = '';
  let parsed = null;
  let thrown = '';

  try {
    parsed = parse(input);
  } catch (error) {
    thrown = error instanceof Error ? error.message : String(error);
  }

  if (parsed?.ast) {
    walk(parsed.ast, (node) => {
      if (node.type === 'Particle' && node.aim === '>' && node.name?.value && !title) {
        title = node.name.value;
      }
      if (node.type === 'PathRef') {
        const path = textOf(node);
        if (path) links.push(path);
      }
      if (node.type === 'Operation' && node.operator?.value === '^') {
        const blockName = unwrap(node.subject?.token?.value || '');
        if (!blockName) return;
        const items = itemsFromSequence(node.body?.sequence);
        blocks.push({ name: blockName, items });
        if (SLOT_NAMES.has(blockName)) slots[blockName] = items;
      }
    });
  }

  const fileTitle = String(name || '').replace(/\.spw$/i, '');
  return {
    title: title || fileTitle || 'Spw document',
    name: name || '',
    slots,
    blocks,
    links,
    ok: Boolean(parsed?.success) && !parsed?.errors?.length && !thrown,
    errorCount: thrown ? 1 : (parsed?.errors?.length || 0),
    message: thrown || '',
  };
}
