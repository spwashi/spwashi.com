/**
 * change-only-paths.mjs — raw DOM writes on a module's repeat paths.
 *
 * A module that declares `rests: ['change-only']` promises that a repeat pass
 * writes only what moved. The repeat passes are the ones the page runs without
 * a reader asking: a measured lane, a DOM sync task, an observer callback. This
 * reads a module's files as syntax trees, starts at every callback handed to
 * one of those, follows calls by name through the module's own files, and
 * reports each raw `x.dataset.y = …` or `x.textContent = …` it reaches.
 *
 * Not reported:
 *   - a write through a kernel helper (writeDatasetValue and its kin compare first)
 *   - a write inside its own guard: `if (el.textContent !== text) el.textContent = text`
 *   - a write in a listener registered with addEventListener, which runs when a
 *     reader acts, not when the page repeats itself
 *
 * Calls are followed by identifier, so two functions with one name in a file
 * are both followed. Method calls (`thing.sync()`) are not followed. The check
 * can therefore miss a write behind a method; it does not invent one.
 */

import ts from 'typescript';

/** Functions that take a callback the page will run again without a reader. */
export const REPEAT_ROOT_CALLS = Object.freeze({
  createMeasuredLane: 'measured lane',
  requestMeasuredFrame: 'measured lane',
  registerDomSyncTask: 'sync task',
  observeAddedMatches: 'observer',
  observeIntersections: 'observer',
});

export const REPEAT_ROOT_CONSTRUCTORS = Object.freeze({
  MutationObserver: 'observer',
  ResizeObserver: 'observer',
  IntersectionObserver: 'observer',
});

const isFunctionNode = (node) => ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node);

function readFile(file, text) {
  const tree = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const functions = new Map();
  const imports = new Map();
  const note = (name, node) => {
    if (!functions.has(name)) functions.set(name, []);
    functions.get(name).push(node);
  };
  const visit = (node) => {
    if (ts.isFunctionDeclaration(node) && node.name) note(node.name.text, node);
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && isFunctionNode(node.initializer)) {
      note(node.name.text, node.initializer);
    }
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const bindings = node.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        for (const element of bindings.elements) {
          imports.set(element.name.text, { specifier: node.moduleSpecifier.text, name: (element.propertyName || element.name).text });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return { file, text, tree, functions, imports };
}

/** `x.dataset.y`, `x.dataset[y]` or `x.textContent` on the left of a plain `=`. */
function rawWriteTarget(node) {
  if (!ts.isBinaryExpression(node) || node.operatorToken.kind !== ts.SyntaxKind.EqualsToken) return '';
  const left = node.left;
  if (ts.isPropertyAccessExpression(left)) {
    if (left.name.text === 'textContent') return 'textContent';
    if (ts.isPropertyAccessExpression(left.expression) && left.expression.name.text === 'dataset') return 'dataset';
  }
  if (ts.isElementAccessExpression(left) && ts.isPropertyAccessExpression(left.expression) && left.expression.name.text === 'dataset') {
    return 'dataset';
  }
  return '';
}

/** True when the write sits under `if (<same target> !== …)`: it already writes only on change. */
function isGuarded(node, tree) {
  const target = node.left.getText(tree);
  for (let parent = node.parent; parent && !isFunctionNode(parent); parent = parent.parent) {
    if (!ts.isIfStatement(parent)) continue;
    let compares = false;
    const look = (inner) => {
      if (
        ts.isBinaryExpression(inner)
        && (inner.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken || inner.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsToken)
        && (inner.left.getText(tree) === target || inner.right.getText(tree) === target)
      ) compares = true;
      ts.forEachChild(inner, look);
    };
    look(parent.expression);
    if (compares) return true;
  }
  return false;
}

/**
 * @param {Map<string, string>} sources file → source text, the module's own files
 * @param {{ resolve?: (fromFile: string, specifier: string) => string | null }} [options]
 * @returns {{ file: string, line: number, text: string, kind: string, root: string, trail: string[] }[]}
 */
export function scanChangeOnlyPaths(sources, { resolve = () => null } = {}) {
  const files = new Map([...sources].map(([file, text]) => [file, readFile(file, text)]));
  const findings = new Map();
  const seen = new Set();

  const targetsOf = (name, info) => {
    const local = info.functions.get(name);
    if (local) return local.map((node) => ({ node, info }));
    const imported = info.imports.get(name);
    if (!imported) return [];
    const other = files.get(resolve(info.file, imported.specifier) || '');
    return (other?.functions.get(imported.name) || []).map((node) => ({ node, info: other }));
  };

  const follow = (name, info, root, trail) => {
    for (const target of targetsOf(name, info)) {
      const key = `${target.info.file}:${target.node.pos}`;
      if (seen.has(key)) continue;
      seen.add(key);
      walk(target.node, target.info, root, [...trail, name]);
    }
  };

  function walk(node, info, root, trail) {
    const kind = rawWriteTarget(node);
    if (kind && !isGuarded(node, info.tree)) {
      const { line } = info.tree.getLineAndCharacterOfPosition(node.getStart(info.tree));
      const key = `${info.file}:${line}`;
      if (!findings.has(key)) {
        findings.set(key, { file: info.file, line: line + 1, text: node.getText(info.tree).split('\n')[0].trim(), kind, root, trail });
      }
    }
    if (ts.isCallExpression(node)) {
      if (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'addEventListener') {
        walk(node.expression, info, root, trail);
        return;
      }
      if (ts.isIdentifier(node.expression)) follow(node.expression.text, info, root, trail);
    }
    ts.forEachChild(node, (child) => walk(child, info, root, trail));
  }

  const startAt = (argument, info, root) => {
    if (ts.isIdentifier(argument)) follow(argument.text, info, root, []);
    else walk(argument, info, root, []);
  };

  for (const info of files.values()) {
    const findRoots = (node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && REPEAT_ROOT_CALLS[node.expression.text]) {
        node.arguments.forEach((argument) => startAt(argument, info, REPEAT_ROOT_CALLS[node.expression.text]));
      }
      if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && REPEAT_ROOT_CONSTRUCTORS[node.expression.text]) {
        (node.arguments || []).forEach((argument) => startAt(argument, info, REPEAT_ROOT_CONSTRUCTORS[node.expression.text]));
      }
      ts.forEachChild(node, findRoots);
    };
    findRoots(info.tree);
  }

  return [...findings.values()].sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}
