/**
 * Shared primitives for page-copy measurement audits.
 *
 * Collect authored route copy, optionally measure it in Chrome (Pretext),
 * then let a named audit summarize and print. JSON stays on stdout / --out;
 * judgments belong in `.spw/audits/`.
 */

import { access, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  CdpSession,
  closePageTarget,
  createChromeProfileDir,
  evaluateProbe,
  installShutdown,
  killProcessTree,
  navigateAndProbe,
  newPageTarget,
  openChrome,
  pickFreePort,
  resolveChrome,
  spawnDevServer,
  waitForHttp,
} from './chrome-headless-harness.mjs';
import { renderTemplate } from '../template.mjs';
import { listSourceRouteFiles } from '../typed/sitemap/topology.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const PRETEXT_CDN = 'https://esm.sh/@chenglou/pretext?bundle';

export const PRETEXT_BANDS = Object.freeze({
  phone: { width: 320 - 32, widthClass: 'sm' },
  tablet: { width: 768 - 64, widthClass: 'lg' },
  desktop: { width: 1200 - 128, widthClass: 'xl' },
});

export const FALLBACK_FONTS = Object.freeze({
  body: { font: '16px system-ui, sans-serif', lineHeightPx: 27 },
  heading: { font: '700 28px system-ui, sans-serif', lineHeightPx: 34 },
  subheading: { font: '600 20px system-ui, sans-serif', lineHeightPx: 26 },
  label: { font: '500 14px system-ui, sans-serif', lineHeightPx: 18 },
});

const BLOCK_RE = /<(h1|h2|h3|h4|p|li|blockquote|figcaption|dt|dd)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
export const MAX_BLOCKS_PER_BATCH = 60;

export function toRoutePath(repoPath) {
  if (repoPath === 'index.html') return '/';
  return `/${String(repoPath).replace(/index\.html$/, '')}`;
}

export function kindForTag(tag) {
  if (tag === 'h1' || tag === 'h2') return 'heading';
  if (tag === 'h3' || tag === 'h4') return 'subheading';
  if (tag === 'p' || tag === 'blockquote') return 'body';
  return 'label';
}

export function stripMarkup(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{\{[^}]+\}\}/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractMainHtml(html) {
  const match = String(html || '').match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  return match ? match[1] : String(html || '');
}

export function classifyExpressionShape(expression = '') {
  const value = String(expression || '').trim();
  if (!value) return 'empty';
  if (/^[?~@&^#!.]/.test(value)) return 'operator-led';
  if (/\}\s*[~&^@]/.test(value)) return 'compound';
  if (/<[^>]+>\s*$/.test(value)) return 'projection';
  if (value.includes(':') && !value.includes('[')) return 'colon';
  if (/\[[^\]]*\]/.test(value) && /\{[^}]*\}/.test(value)) return 'plain';
  return 'other';
}

export function decodeSpwAttr(value = '') {
  return String(value || '')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, '&');
}

export function readSpwAttr(attrs = '', name) {
  const key = String(name || '').replace(/^data-spw-/i, '');
  if (!key) return '';
  const match = new RegExp(`data-spw-${key}\\s*=\\s*"([^"]*)"`, 'i').exec(String(attrs));
  return match ? decodeSpwAttr(match[1].trim()) : '';
}

export function readSemanticExpression(attrs = '') {
  return readSpwAttr(attrs, 'semantic-expression');
}

export function parseCopyUnit(id = '') {
  const value = String(id || '').trim();
  const parts = value ? value.split('.').filter((part) => part.length > 0) : [];
  const valid = parts.length >= 3 && parts.every((part) => /^[A-Za-z][A-Za-z0-9_-]*$/.test(part));
  let shape = 'empty';
  if (parts.length === 1 || parts.length === 2) shape = 'short';
  else if (parts.length === 3) shape = 'triple';
  else if (parts.length > 3) shape = 'nested';
  return {
    id: value,
    parts,
    arity: parts.length,
    namespace: parts[0] || '',
    cluster: parts[1] || '',
    slot: parts.slice(2).join('.') || '',
    shape,
    valid,
  };
}

export function extractPageMeta(html = '') {
  const body = /<body\b([^>]*)>/i.exec(String(html));
  const attrs = body ? body[1] : '';
  const related = readSpwAttr(attrs, 'related-routes');
  return {
    surface: readSpwAttr(attrs, 'surface'),
    pageFamily: readSpwAttr(attrs, 'page-family'),
    pageRole: readSpwAttr(attrs, 'page-role'),
    relatedRoutes: related
      ? related.split('|').map((route) => route.trim()).filter(Boolean)
      : [],
  };
}

export function extractCopyUnitHosts(html) {
  const pageMeta = extractPageMeta(html);
  const main = extractMainHtml(html);
  const blocks = [];
  const seen = new Set();

  const push = (tag, attrs, inner, { requireUnit = true } = {}) => {
    const copyUnit = readSpwAttr(attrs, 'copy-unit');
    if (requireUnit && !copyUnit) return;
    const text = stripMarkup(inner);
    const key = `${copyUnit || 'gap'}::${tag}::${text.slice(0, 80)}`;
    if (seen.has(key)) return;
    seen.add(key);
    const parsed = parseCopyUnit(copyUnit);
    const className = /\bclass\s*=\s*"([^"]*)"/i.exec(String(attrs))?.[1] || '';
    blocks.push({
      tag,
      kind: copyUnit ? kindForTag(tag) : 'gap',
      text,
      chars: text.length,
      html: inner,
      copyUnit,
      expression: readSpwAttr(attrs, 'semantic-expression'),
      copyDepth: readSpwAttr(attrs, 'copy-depth'),
      textualRole: readSpwAttr(attrs, 'textual-role'),
      locale: readSpwAttr(attrs, 'locale'),
      className,
      ...parsed,
      ...pageMeta,
    });
  };

  for (const match of main.matchAll(/<([a-z][a-z0-9]*)\b([^>]*data-spw-copy-unit\s*=\s*"[^"]+"[^>]*)>([\s\S]*?)<\/\1>/gi)) {
    push(match[1].toLowerCase(), match[2], match[3], { requireUnit: true });
  }

  for (const match of main.matchAll(/<([a-z][a-z0-9]*)\b([^>]*\bclass\s*=\s*"[^"]*\bhook-lede\b[^"]*"[^>]*)>([\s\S]*?)<\/\1>/gi)) {
    if (/data-spw-copy-unit\s*=/i.test(match[2])) continue;
    push(match[1].toLowerCase(), match[2], match[3], { requireUnit: false });
  }

  if (!blocks.length) {
    blocks.push({
      tag: 'body',
      kind: 'meta',
      text: '',
      chars: 0,
      html: '',
      copyUnit: '',
      expression: '',
      copyDepth: '',
      textualRole: '',
      locale: '',
      className: '',
      ...parseCopyUnit(''),
      ...pageMeta,
    });
  }

  return blocks;
}

export function extractExpressionHosts(html) {
  const main = extractMainHtml(html);
  const blocks = [];
  const seen = new Set();
  for (const match of main.matchAll(/<([a-z][a-z0-9]*)\b([^>]*data-spw-semantic-expression\s*=\s*"[^"]+"[^>]*)>([\s\S]*?)<\/\1>/gi)) {
    const tag = match[1].toLowerCase();
    const expression = readSemanticExpression(match[2]);
    const text = stripMarkup(match[3]);
    if (!expression || !text || text.length < 4) continue;
    const key = `${expression}::${text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    blocks.push({
      tag,
      kind: kindForTag(tag),
      text,
      chars: text.length,
      expression,
    });
  }
  return blocks;
}

export function extractBlocks(html, { minChars = 12, keepShortHeading = true } = {}) {
  const main = extractMainHtml(html);
  const blocks = [];
  BLOCK_RE.lastIndex = 0;
  let match;
  while ((match = BLOCK_RE.exec(main)) !== null) {
    const tag = match[1].toLowerCase();
    const text = stripMarkup(match[2]);
    if (!text) continue;
    if (!(keepShortHeading && tag === 'h1') && text.length < minChars) continue;
    blocks.push({
      tag,
      kind: kindForTag(tag),
      text,
      chars: text.length,
    });
  }
  return blocks;
}

export function classifyWrap(phoneLines = 0, desktopLines = 0) {
  const diff = Math.abs(Math.round(phoneLines) - Math.round(desktopLines));
  if (diff >= 4) return 'volatile';
  if (diff >= 2) return 'responsive';
  return 'stable';
}

export function classifyPageWrap(blocks = []) {
  const n = blocks.length;
  if (!n) return 'stable';
  const volatile = blocks.filter((block) => block.wrap === 'volatile').length;
  const responsive = blocks.filter((block) => block.wrap === 'responsive').length;
  if (volatile / n >= 0.35 || volatile >= 4) return 'volatile';
  if ((responsive + volatile) / n >= 0.25 || (responsive + volatile) >= 3) return 'responsive';
  return 'stable';
}

export function previewText(text, limit = 96) {
  const value = String(text || '');
  return value.length > limit ? `${value.slice(0, limit)}…` : value;
}

export function matchesRouteFilter(repoPath, routePath, filter) {
  if (!filter) return true;
  const needle = String(filter).trim().toLowerCase();
  return repoPath.toLowerCase().includes(needle)
    || routePath.toLowerCase().includes(needle);
}

export async function collectRoutePages({
  filter = null,
  extract = extractBlocks,
  root = ROOT,
} = {}) {
  const pages = [];

  for (const repoPath of listSourceRouteFiles()) {
    const absPath = path.join(root, repoPath);
    try {
      await access(absPath);
    } catch {
      continue;
    }

    const route = toRoutePath(repoPath);
    if (!matchesRouteFilter(repoPath, route, filter)) continue;

    const source = await readFile(absPath, 'utf8');
    const { output } = await renderTemplate(source, { sourceLabel: repoPath });
    const blocks = extract(output);
    pages.push({
      file: repoPath,
      route,
      chars: blocks.reduce((sum, block) => sum + (block.chars || block.text?.length || 0), 0),
      blockCount: blocks.length,
      blocks,
    });
  }

  return pages.sort((a, b) => a.route.localeCompare(b.route));
}

export function chunkPages(pages, maxBlocks = MAX_BLOCKS_PER_BATCH) {
  const batches = [];
  let current = [];
  let count = 0;

  const flush = () => {
    if (!current.length) return;
    batches.push(current);
    current = [];
    count = 0;
  };

  for (const page of pages) {
    const blockCount = page.blockCount ?? page.blocks?.length ?? 0;
    if (blockCount > maxBlocks) {
      flush();
      const blocks = page.blocks || [];
      for (let i = 0; i < blocks.length; i += maxBlocks) {
        const slice = blocks.slice(i, i + maxBlocks);
        batches.push([{
          file: page.file,
          route: page.route,
          chars: page.chars,
          blockCount: slice.length,
          blocks: slice,
        }]);
      }
      continue;
    }
    if (current.length && count + blockCount > maxBlocks) flush();
    current.push(page);
    count += blockCount;
  }
  flush();
  return batches;
}

export function parseAuditArgs(argv = []) {
  const options = {
    base: null,
    chrome: null,
    help: false,
    json: false,
    list: false,
    out: null,
    port: 0,
    route: null,
    timeoutMs: 45000,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--json') options.json = true;
    else if (arg === '--list') options.list = true;
    else if (arg === '--base' && argv[i + 1]) options.base = argv[++i];
    else if (arg.startsWith('--base=')) options.base = arg.slice(7);
    else if (arg === '--chrome' && argv[i + 1]) options.chrome = argv[++i];
    else if (arg.startsWith('--chrome=')) options.chrome = arg.slice(9);
    else if (arg === '--out' && argv[i + 1]) options.out = argv[++i];
    else if (arg.startsWith('--out=')) options.out = arg.slice(6);
    else if (arg === '--route' && argv[i + 1]) options.route = argv[++i];
    else if (arg.startsWith('--route=')) options.route = arg.slice(8);
    else if (arg === '--port' && argv[i + 1]) options.port = Number(argv[++i]) || 0;
  }

  return options;
}

export function printAuditHelp({ name = 'page-copy-audit', description = '', audits = [] } = {}) {
  const lines = [
    `${name} — ${description || 'measure authored route copy'}`,
    '',
    'Usage:',
    `  node scripts/${name}.mjs [audit] [options]`,
    '',
    'Options:',
    '  --list              List registered audits',
    '  --base URL          Reuse a running server (skip dev-server spawn)',
    '  --route PATH        Limit to one route (file path or URL path)',
    '  --out PATH          Write the full JSON report',
    '  --json              Print JSON on stdout',
    '  --chrome PATH       Browser binary',
    '  --port N            Dev-server port when spawning',
    '  -h, --help',
  ];
  if (audits.length) {
    lines.push('', 'Audits:');
    for (const audit of audits) {
      lines.push(`  ${String(audit.id).padEnd(14)} ${audit.title || audit.kind || ''}`);
    }
  }
  console.log(lines.join('\n'));
}

export function fontProbeExpression(fallbacks = FALLBACK_FONTS) {
  return `(() => {
  const lineHeightPxFrom = (style, fontSize, fallbackLh) => {
    const raw = style.lineHeight;
    if (!raw || raw === 'normal') return fallbackLh;
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) return fallbackLh;
    return raw.endsWith('px') ? Math.round(parsed) : Math.round(parsed * fontSize);
  };
  const readFirst = (selector, fallbackFont, fallbackLh, minSize) => {
    for (const el of document.querySelectorAll(selector)) {
      const style = getComputedStyle(el);
      const fontSize = Number.parseFloat(style.fontSize) || 0;
      if (fontSize < minSize) continue;
      if ((el.textContent || '').trim().length < 8) continue;
      const font = \`\${style.fontWeight} \${style.fontSize} \${style.fontFamily}\`.trim();
      return { font, lineHeightPx: lineHeightPxFrom(style, fontSize, fallbackLh) };
    }
    return { font: fallbackFont, lineHeightPx: fallbackLh };
  };
  const root = getComputedStyle(document.documentElement);
  const body = getComputedStyle(document.body);
  const bodySize = body.fontSize || '16px';
  const bodyFamily = body.fontFamily || 'system-ui, sans-serif';
  const tokenLh = Number.parseFloat(root.getPropertyValue('--site-line-height')) || 1.68;
  const bodyLh = tokenLh < 4
    ? Math.round(Number.parseFloat(bodySize) * tokenLh)
    : Math.round(tokenLh || 27);
  return {
    body: { font: \`\${bodySize} \${bodyFamily}\`, lineHeightPx: bodyLh },
    heading: readFirst('main h1, main h2', ${JSON.stringify(fallbacks.heading.font)}, ${fallbacks.heading.lineHeightPx}, 20),
    subheading: readFirst('main h3, main h4', ${JSON.stringify(fallbacks.subheading.font)}, ${fallbacks.subheading.lineHeightPx}, 16),
    label: readFirst('.operator-chip, figcaption, label', ${JSON.stringify(fallbacks.label.font)}, ${fallbacks.label.lineHeightPx}, 12),
  };
})()`;
}

export function pretextMeasureExpression(pages, fonts, bands = PRETEXT_BANDS) {
  return `(async () => {
    const pretext = globalThis.__SPW_PRETEXT__ || await import(${JSON.stringify(PRETEXT_CDN)});
    globalThis.__SPW_PRETEXT__ = pretext;
    const prepareWithSegments = pretext.prepareWithSegments || pretext.default?.prepareWithSegments;
    const layoutWithLines = pretext.layoutWithLines || pretext.default?.layoutWithLines;
    const layout = pretext.layout || pretext.default?.layout;
    if (typeof prepareWithSegments !== 'function') {
      throw new Error('pretext prepareWithSegments unavailable');
    }
    const fonts = ${JSON.stringify(fonts)};
    const bands = ${JSON.stringify(bands)};
    const pages = ${JSON.stringify(pages)};
    const layoutAt = (handle, width, lineHeightPx) => {
      if (typeof layoutWithLines === 'function') return layoutWithLines(handle, width, lineHeightPx);
      return layout(handle, width, lineHeightPx);
    };
    return pages.map((page) => ({
      route: page.route,
      blocks: page.blocks.map((block) => {
        const profile = fonts[block.kind] || fonts.body;
        try {
          const handle = prepareWithSegments(block.text, profile.font, { whiteSpace: 'normal' });
          const measured = {};
          for (const [band, spec] of Object.entries(bands)) {
            const result = layoutAt(handle, spec.width, profile.lineHeightPx) || {};
            const lines = result.lines || [];
            const lineCount = result.lineCount ?? lines.length ?? 0;
            measured[band] = {
              width: spec.width,
              widthClass: spec.widthClass,
              lineCount,
              height: Math.round(result.height ?? (lineCount * profile.lineHeightPx)),
              maxLineWidth: Math.round(lines.reduce((max, line) => Math.max(max, line.width || 0), 0)),
            };
          }
          return {
            tag: block.tag,
            kind: block.kind,
            expression: block.expression || '',
            chars: block.text.length,
            preview: block.text.length > 96 ? \`\${block.text.slice(0, 96)}…\` : block.text,
            bands: measured,
          };
        } catch (error) {
          return {
            tag: block.tag,
            kind: block.kind,
            expression: block.expression || '',
            chars: block.text.length,
            preview: block.text.length > 96 ? \`\${block.text.slice(0, 96)}…\` : block.text,
            error: String(error && error.message ? error.message : error),
            bands: {},
          };
        }
      }),
    }));
  })()`;
}

export function serializePagesForEngine(pages) {
  return pages.map((page) => ({
    route: page.route,
    blocks: (page.blocks || []).map((block) => ({
      tag: block.tag,
      kind: block.kind,
      text: block.text,
      expression: block.expression || '',
    })),
  }));
}

export function mergeMeasuredBlocks(rows = []) {
  const byRoute = new Map();
  for (const row of rows) {
    const existing = byRoute.get(row.route) || [];
    byRoute.set(row.route, existing.concat(row.blocks || []));
  }
  return byRoute;
}

export function summarizePretextBlock(block) {
  const phone = block.bands?.phone?.lineCount || 0;
  const tablet = block.bands?.tablet?.lineCount || 0;
  const desktop = block.bands?.desktop?.lineCount || 0;
  const wrap = classifyWrap(phone, desktop);
  return {
    ...block,
    wrap,
    wrapDelta: Math.abs(phone - desktop),
    phoneLines: phone,
    tabletLines: tablet,
    desktopLines: desktop,
  };
}

export function summarizePretextPage(page, measuredBlocks) {
  const blocks = measuredBlocks.map(summarizePretextBlock);
  const headings = blocks.filter((block) => block.tag === 'h1');
  const bodies = blocks.filter((block) => block.kind === 'body');
  const worst = blocks.reduce((acc, block) => (
    !acc || block.wrapDelta > acc.wrapDelta ? block : acc
  ), null);
  const phoneBodyLines = bodies.reduce((sum, block) => sum + block.phoneLines, 0);
  const desktopBodyLines = bodies.reduce((sum, block) => sum + block.desktopLines, 0);

  return {
    file: page.file,
    route: page.route,
    chars: page.chars,
    blockCount: blocks.length,
    wrap: classifyPageWrap(blocks),
    wrapDelta: Math.abs(phoneBodyLines - desktopBodyLines),
    blockWrap: {
      stable: blocks.filter((block) => block.wrap === 'stable').length,
      responsive: blocks.filter((block) => block.wrap === 'responsive').length,
      volatile: blocks.filter((block) => block.wrap === 'volatile').length,
    },
    phoneBodyLines,
    tabletBodyLines: bodies.reduce((sum, block) => sum + block.tabletLines, 0),
    desktopBodyLines,
    h1: headings[0] ? {
      preview: headings[0].preview,
      phoneLines: headings[0].phoneLines,
      desktopLines: headings[0].desktopLines,
      wrap: headings[0].wrap,
    } : null,
    worstBlock: worst ? {
      tag: worst.tag,
      kind: worst.kind,
      wrap: worst.wrap,
      wrapDelta: worst.wrapDelta,
      phoneLines: worst.phoneLines,
      desktopLines: worst.desktopLines,
      preview: worst.preview,
    } : null,
    blocks,
  };
}

export async function withLocalServer(options, fn) {
  let base = options.base ? String(options.base).replace(/\/$/, '') : null;
  let devChild = null;
  const log = options.log || ((message) => process.stderr.write(`${message}\n`));
  const shutdown = installShutdown([() => killProcessTree(devChild)]);

  try {
    if (!base) {
      const port = options.port > 0 ? options.port : await pickFreePort();
      log(`starting dev-server on ${port}…`);
      const spawned = spawnDevServer(port);
      devChild = spawned.child;
      base = await spawned.ready;
    } else {
      await waitForHttp(base);
    }
    log(`server ${base}`);
    return await fn(base);
  } finally {
    shutdown();
    killProcessTree(devChild);
  }
}

export async function withChromePage({
  chrome,
  base,
  timeoutMs = 45000,
  profilePrefix = 'spw-copy-audit-',
  log = (message) => process.stderr.write(`${message}\n`),
} = {}, fn) {
  const chromePath = await resolveChrome(chrome);
  if (typeof WebSocket === 'undefined') {
    throw new Error('global WebSocket unavailable (Node 22+ required for CDP)');
  }
  if (!chromePath) throw new Error('Chrome/Chromium not found');

  let chromeChild = null;
  let userDataDir = null;
  const debugPort = 9333 + Math.floor(Math.random() * 400);
  const shutdown = installShutdown([() => killProcessTree(chromeChild)]);

  try {
    userDataDir = await createChromeProfileDir(profilePrefix);
    log(`chrome ${chromePath} debug=${debugPort}`);
    chromeChild = await openChrome(chromePath, userDataDir, debugPort);

    const target = await newPageTarget(debugPort);
    const session = new CdpSession(target.webSocketDebuggerUrl);
    await session.open();

    try {
      log(`probing fonts at ${base}/`);
      await navigateAndProbe(session, {
        url: `${base}/`,
        settleMs: 8000,
        timeoutMs,
        retries: 1,
        partialGraceMs: 4000,
        logBrowser: false,
      });

      let fonts = FALLBACK_FONTS;
      try {
        fonts = await evaluateProbe(session, fontProbeExpression(), 8000);
      } catch (error) {
        log(`font probe failed (${error.message}); using fallbacks`);
      }

      return await fn({ session, fonts, chromePath, debugPort });
    } finally {
      session.close();
      await closePageTarget(debugPort, target);
    }
  } finally {
    shutdown();
    killProcessTree(chromeChild);
    if (userDataDir) {
      await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

export async function measurePagesWithPretext(session, pages, fonts, {
  log = (message) => process.stderr.write(`${message}\n`),
} = {}) {
  const measured = [];
  const batches = chunkPages(pages);
  for (const [index, batch] of batches.entries()) {
    log(`batch ${index + 1}/${batches.length} (${batch.length} pages)`);
    const payload = serializePagesForEngine(batch);
    const rows = await evaluateProbe(session, pretextMeasureExpression(payload, fonts), 60000);
    if (!Array.isArray(rows)) throw new Error('pretext batch returned no rows');
    measured.push(...rows);
  }
  return measured;
}

export async function writeAuditReport(report, { json = false, out = null, print } = {}) {
  if (out) {
    const outPath = path.resolve(out);
    await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`);
    process.stderr.write(`wrote ${outPath}\n`);
  }
  if (json) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  else if (typeof print === 'function') print(report);
}

export async function runPageCopyAudit(audit, argv = process.argv.slice(2)) {
  const options = parseAuditArgs(argv);
  const logPrefix = audit.logPrefix || `audit:${audit.id}`;
  const log = (message) => process.stderr.write(`[${logPrefix}] ${message}\n`);

  if (options.help) {
    printAuditHelp({
      name: 'page-copy-audit',
      description: audit.title || audit.kind,
      audits: [audit],
    });
    return 0;
  }

  log('collecting route copy…');
  const pages = await (audit.collect || collectRoutePages)({ filter: options.route });
  if (!pages.length) {
    log('no matching HTML routes');
    return 1;
  }
  log(`${pages.length} pages, ${pages.reduce((sum, page) => sum + page.blockCount, 0)} blocks`);

  const runMeasure = async (ctx = {}) => {
    if (typeof audit.measure === 'function') {
      return audit.measure({ pages, options, log, ...ctx });
    }
    return { measured: [], fonts: null };
  };

  try {
    let measureResult;
    if (audit.needsBrowser) {
      measureResult = await withLocalServer({ ...options, log }, async (base) => (
        withChromePage({
          chrome: options.chrome,
          base,
          timeoutMs: options.timeoutMs,
          profilePrefix: audit.profilePrefix || 'spw-copy-audit-',
          log,
        }, (ctx) => runMeasure({ ...ctx, base }))
      ));
    } else {
      measureResult = await runMeasure();
    }

    const measured = measureResult?.measured || [];
    const fonts = measureResult?.fonts || null;
    const byRoute = mergeMeasuredBlocks(measured);
    const summarize = audit.summarize || summarizePretextPage;
    const summarized = pages.map((page) => summarize(page, byRoute.get(page.route) || page.blocks || []));

    const report = {
      at: new Date().toISOString(),
      kind: audit.kind,
      engine: audit.engine || 'none',
      measureKind: audit.measureKind || 'objective',
      source: audit.source || `scripts/page-copy-audit.mjs ${audit.id}`,
      widths: audit.widths || null,
      fonts,
      pageCount: summarized.length,
      blockCount: summarized.reduce((sum, page) => sum + (page.blockCount || 0), 0),
      chars: summarized.reduce((sum, page) => sum + (page.chars || 0), 0),
      pages: summarized,
      ...(typeof audit.decorateReport === 'function' ? audit.decorateReport(summarized) : {}),
    };

    await writeAuditReport(report, {
      json: options.json,
      out: options.out,
      print: audit.print,
    });
    return 0;
  } catch (error) {
    console.error(`[${logPrefix}] fatal`, error);
    return 1;
  }
}
