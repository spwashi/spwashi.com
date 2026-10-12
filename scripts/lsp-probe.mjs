/**
 * lsp-probe — ask the Spw language server what the editor would show.
 *
 * The workbench's VS Code extension talks to spw-lsp over stdio. This starts
 * the same server from the pinned workbench, opens one file, and prints what a
 * request returns, so an editor finding can be reproduced from a terminal and
 * checked again after a workbench bump. The asks it backs are in
 * .spw/reviews/upstream-workbench-recommendations.spw#week_2026_10_11.
 *
 *   node scripts/lsp-probe.mjs <repo> <file> hover <line:char> [...]
 *   node scripts/lsp-probe.mjs <repo> <file> tokens [fromLine-toLine]
 *   node scripts/lsp-probe.mjs <repo> <file> definition <line:char> [...]
 *   node scripts/lsp-probe.mjs <repo> <file> references <line:char>
 *   node scripts/lsp-probe.mjs <repo> <file> symbols
 *   node scripts/lsp-probe.mjs <repo> <file> workspace <query>
 *   node scripts/lsp-probe.mjs <repo> <file> diagnostics
 *
 * Lines and characters are 1-based. WAIT (ms, default 4000) lets the server
 * index the workspace before the request; counts drawn from the index stay
 * partial for a few minutes on a cold start.
 */
import { Buffer } from 'node:buffer';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const [repo, file, mode, ...rest] = process.argv.slice(2);
const server = spawn(process.execPath, [
  '--import', path.join(repo, '.spw/_workbench/node_modules/tsx/dist/loader.mjs'),
  path.join(repo, '.spw/_workbench/packages/spw-lsp/src/stdio-server.ts'), '--stdio',
], { cwd: repo, stdio: ['pipe', 'pipe', 'ignore'] });

let buffer = Buffer.alloc(0);
const diagnostics = new Map();
const pending = new Map();
server.stdout.on('data', (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  for (;;) {
    const head = buffer.indexOf('\r\n\r\n');
    if (head < 0) return;
    const length = Number(/Content-Length: (\d+)/i.exec(buffer.subarray(0, head).toString())?.[1]);
    if (buffer.length < head + 4 + length) return;
    const message = JSON.parse(buffer.subarray(head + 4, head + 4 + length).toString());
    buffer = buffer.subarray(head + 4 + length);
    if (message.method === 'textDocument/publishDiagnostics') diagnostics.set(message.params.uri, message.params.diagnostics);
    if (message.id !== undefined && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    } else if (message.id !== undefined && message.method) {
      send({ jsonrpc: '2.0', id: message.id, result: null });
    }
  }
});
const send = (message) => {
  const body = JSON.stringify(message);
  server.stdin.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
};
let nextId = 1;
const request = (method, params) => new Promise((resolve) => {
  const id = nextId++;
  pending.set(id, resolve);
  send({ jsonrpc: '2.0', id, method, params });
});

const rootUri = pathToFileURL(repo).href;
const uri = pathToFileURL(path.resolve(repo, file)).href;
const text = fs.readFileSync(path.resolve(repo, file), 'utf8');
const lines = text.split('\n');
const rel = (u) => path.relative(repo, fileURLToPath(u));
const at = (p) => `${p.line + 1}:${p.character + 1}`;

const init = await request('initialize', { processId: process.pid, rootUri, capabilities: {}, workspaceFolders: [{ uri: rootUri, name: 'site' }] });
send({ jsonrpc: '2.0', method: 'initialized', params: {} });
send({ jsonrpc: '2.0', method: 'textDocument/didOpen', params: { textDocument: { uri, languageId: 'spw', version: 1, text } } });
await new Promise((r) => setTimeout(r, Number(process.env.WAIT || 4000)));

if (mode === 'tokens') {
  const legend = init.result?.capabilities?.semanticTokensProvider?.legend ?? { tokenTypes: [], tokenModifiers: [] };
  const [from, to] = (rest[0] || `1-${lines.length}`).split('-').map(Number);
  const result = await request('textDocument/semanticTokens/full', { textDocument: { uri } });
  const data = result?.result?.data ?? [];
  let line = 0;
  let char = 0;
  for (let i = 0; i < data.length; i += 5) {
    const [dl, dc, len, type, mods] = data.slice(i, i + 5);
    line += dl;
    char = dl ? dc : char + dc;
    if (line + 1 < from || line + 1 > to) continue;
    const names = legend.tokenModifiers.filter((_, bit) => mods & (1 << bit));
    const slice = (lines[line] ?? '').slice(char, char + len);
    console.log(`${line + 1}:${char + 1}\t${legend.tokenTypes[type]}${names.length ? '.' + names.join('.') : ''}\t${JSON.stringify(slice)}`);
  }
} else if (mode === 'definition' || mode === 'references') {
  for (const position of rest) {
    const [l, c] = position.split(':').map(Number);
    const method = mode === 'definition' ? 'textDocument/definition' : 'textDocument/references';
    const params = { textDocument: { uri }, position: { line: l - 1, character: c - 1 }, context: { includeDeclaration: true } };
    const result = (await request(method, params))?.result;
    const list = [].concat(result ?? []);
    console.log(`=== ${mode} ${position} «${(lines[l - 1] ?? '').trim().slice(0, 70)}» → ${list.length}`);
    for (const loc of list.slice(0, 12)) {
      const target = loc.targetUri ?? loc.uri;
      const range = loc.targetSelectionRange ?? loc.targetRange ?? loc.range;
      console.log(`  ${rel(target)}:${at(range.start)}`);
    }
  }
} else if (mode === 'symbols') {
  const result = (await request('textDocument/documentSymbol', { textDocument: { uri } }))?.result ?? [];
  const walk = (items, depth) => {
    for (const s of items) {
      const range = s.selectionRange ?? s.range ?? s.location?.range;
      console.log(`${'  '.repeat(depth)}${s.name}  [kind ${s.kind}]  ${range ? at(range.start) : ''}`);
      if (s.children) walk(s.children, depth + 1);
    }
  };
  walk(result, 0);
} else if (mode === 'hover') {
  for (const position of rest) {
    const [l, c] = position.split(':').map(Number);
    const result = (await request('textDocument/hover', { textDocument: { uri }, position: { line: l - 1, character: c - 1 } }))?.result;
    const contents = result?.contents;
    const value = typeof contents === 'string' ? contents
      : contents?.value ?? (Array.isArray(contents) ? contents.map((part) => part.value ?? part).join('\n') : null);
    console.log(`=== hover ${position} «${(lines[l - 1] ?? '').trim().slice(0, 70)}»`);
    console.log(value ? value.trim() : '(no hover)');
  }
} else if (mode === 'diagnostics') {
  const list = diagnostics.get(uri) ?? [];
  console.log(`=== diagnostics ${file} → ${list.length}`);
  for (const d of list.slice(0, 20)) console.log(`  ${at(d.range.start)} [${d.source}/${d.severity}] ${d.message}  «${(lines[d.range.start.line] ?? '').trim().slice(0, 60)}»`);
} else if (mode === 'workspace') {
  const result = (await request('workspace/symbol', { query: rest[0] ?? '' }))?.result ?? [];
  console.log(`=== workspace/symbol «${rest[0]}» → ${result.length}`);
  for (const s of result.slice(0, 15)) console.log(`  ${s.name}  [kind ${s.kind}]  ${rel(s.location.uri)}:${at(s.location.range.start)}`);
}
server.kill();
process.exit(0);
