/**
 * Every sigil table says how it relates to the workbench's philosophy: in
 * harmony with it, extending it, or as a modular mutation of it. The registry
 * is operator-namespace-alignment.spw ^"workbench_relation"; this holds each
 * listed file to the relation the registry names for it.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const REGISTRY = path.join(ROOT, '.spw/language/operator-namespace-alignment.spw');
const RELATIONS = ['harmony', 'extension', 'mutation'];

/** The registry's rows: a file and the relations it declares. */
export function readRegistry(text) {
  const frame = text.slice(text.indexOf('^"workbench_relation"{'));
  const tables = frame.slice(frame.indexOf('tables = #['), frame.indexOf('][reg=set]'));
  return [...tables.matchAll(/`([^`·]+?) · ([a-z, ]+)`/g)].map(([, file, relations]) => ({
    file: file.trim(),
    relations: relations.split(',').map((word) => word.trim()),
  }));
}

/** What a file says about itself: the words after "Workbench relation:" or in a workbench_relation field. */
export function declaredRelations(text) {
  const said = [...text.matchAll(/Workbench relation:([^\n]*)|workbench_relation = "([^"]*)"/g)]
    .map((match) => (match[1] || match[2] || '').toLowerCase())
    .join(' ');
  return RELATIONS.filter((relation) => said.includes(relation));
}

test('the registry defines the three relations and lists the tables', () => {
  const text = fs.readFileSync(REGISTRY, 'utf8');
  for (const relation of RELATIONS) assert.match(text, new RegExp(`^  ${relation} = \``, 'm'), relation);
  const rows = readRegistry(text);
  assert.ok(rows.length >= 30, `${rows.length} tables listed`);
  for (const row of rows) for (const relation of row.relations) assert.ok(RELATIONS.includes(relation), `${row.file}: ${relation}`);
});

test('each listed table says its relation beside itself, and says the one the registry names', () => {
  for (const { file, relations } of readRegistry(fs.readFileSync(REGISTRY, 'utf8'))) {
    const full = path.join(ROOT, file);
    assert.ok(fs.existsSync(full), `${file} exists`);
    const declared = declaredRelations(fs.readFileSync(full, 'utf8'));
    assert.ok(declared.length, `${file} declares a workbench relation`);
    for (const relation of relations) assert.ok(declared.includes(relation), `${file} declares ${relation}`);
  }
});

test('a declaration is read from either form', () => {
  assert.deepEqual(declaredRelations('// Workbench relation: mutation, via the kernel.'), ['mutation']);
  assert.deepEqual(declaredRelations('workbench_relation = "extension: site roles"'), ['extension']);
  assert.deepEqual(declaredRelations('/* Workbench relation: harmony and extension. */'), ['harmony', 'extension']);
  assert.deepEqual(declaredRelations('no claim here'), []);
});
