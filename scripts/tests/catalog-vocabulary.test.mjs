import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CATALOG_DEF_FIELD_KINDS,
  CATALOG_DEF_FIELDS,
  EFFECT_SCOPE_TIER,
  EFFECT_SCOPE_TIERS,
  EFFECT_SCOPE_VALUES,
  ENGAGE_KIND_VALUES,
  MODULE_DEFS,
  MODULE_DIMENSION_VALUES,
} from '../../public/js/runtime/catalog/index.js';
import { MODULE_UPDATE_ROLES, MODULE_UPDATE_SCOPES } from '../../public/js/runtime/catalog/updates-contract.js';
import { ENGAGE_KINDS } from '../../public/js/kernel/engagement.js';

const DERIVED_FIELDS = new Set(['cost', 'costClass', 'costLabel', 'orchestration']);

test('every effectScope token is closed and belongs to a host tier', () => {
  for (const token of EFFECT_SCOPE_VALUES) {
    assert.ok(EFFECT_SCOPE_TIERS.includes(EFFECT_SCOPE_TIER[token]), token);
  }
  assert.deepEqual(Object.keys(EFFECT_SCOPE_TIER).sort(), [...EFFECT_SCOPE_VALUES].sort());
});

test('catalog effect fields are token arrays the runtime can act on', () => {
  for (const def of MODULE_DEFS) {
    assert.ok(Array.isArray(def.effectScope), `${def.id} effectScope is an array`);
    for (const token of def.effectScope) {
      assert.ok(EFFECT_SCOPE_VALUES.includes(token), `${def.id} effectScope ${token}`);
    }
    assert.ok(Array.isArray(def.evaluates), `${def.id} evaluates is an array`);
    for (const token of def.evaluates) {
      assert.ok(MODULE_DIMENSION_VALUES.includes(token), `${def.id} evaluates ${token}`);
    }
  }
});

test('engages names only intents the kernel resolves', () => {
  assert.deepEqual([...ENGAGE_KIND_VALUES].sort(), [...ENGAGE_KINDS].sort());
  for (const def of MODULE_DEFS) {
    if (def.engages == null) continue;
    assert.ok(Array.isArray(def.engages) && def.engages.length, `${def.id} engages is a non-empty array`);
    for (const kind of def.engages) assert.ok(ENGAGE_KIND_VALUES.includes(kind), `${def.id} engages ${kind}`);
  }
});

test('every update names a role, so every module has a computable offer', () => {
  for (const def of MODULE_DEFS) {
    for (const entry of def.updates || []) {
      const [first, second] = String(entry).split(':');
      const role = MODULE_UPDATE_SCOPES.includes(first) ? second : first;
      assert.ok(MODULE_UPDATE_ROLES.includes(role), `${def.id} update ${entry}`);
    }
  }
});

test('authored fields are registered with a kind and a reader', () => {
  for (const [field, entry] of Object.entries(CATALOG_DEF_FIELDS)) {
    assert.ok(CATALOG_DEF_FIELD_KINDS.includes(entry.kind), `${field} kind`);
    assert.ok(entry.readers, `${field} readers`);
  }
  for (const def of MODULE_DEFS) {
    for (const key of Object.keys(def)) {
      if (DERIVED_FIELDS.has(key)) continue;
      assert.ok(CATALOG_DEF_FIELDS[key], `${def.id} authors unregistered field ${key}`);
    }
  }
});

test('describes is the only voice field', () => {
  const voices = Object.entries(CATALOG_DEF_FIELDS).filter(([, entry]) => entry.kind === 'voice');
  assert.deepEqual(voices.map(([field]) => field), ['describes']);
});

test('every contract reads back as one Spw sentence, facet by facet', async () => {
  const { formatModuleContractSpwLines } = await import('../../public/js/runtime/catalog/contract-spw.js');
  for (const def of MODULE_DEFS) {
    const lines = formatModuleContractSpwLines(def);
    assert.match(lines[0], /^#>[a-z0-9_]+ #:(core|feature|region|enhancement)$/, `${def.id} address`);
    assert.match(lines[1], /^\$\[[^\]]+\]/, `${def.id} substrate`);
    assert.match(lines[2], /^~\[(immediate|visible|idle|interaction|invited|region|settled)\]/, `${def.id} potential`);
    assert.ok(!lines.some((line) => line.includes('[[')), `${def.id} has no doubled brackets`);
    if (def.updates?.length) assert.ok(lines.some((line) => line.startsWith('![')), `${def.id} acts`);
  }
});
