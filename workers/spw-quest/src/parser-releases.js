// spw.quest/parser/: parser releases and prereleases, served from the worker's static assets (env.ASSETS).
// carry-parser-release.mjs copies a workbench cut into assets/parser/<name>/ and rewrites the
// index it belongs to; this module only reads what it carried.
//
// One folder per name: a release day (YYYY.MM.DD), a prerelease headed for a day
// (YYYY.MM.DD-pre.N), or a patch of a published day (YYYY.MM.DD-patch.N). Within a day the
// order is ours, not semver's: pre.N < the release < patch.N; across days, by day. A folder holds
// what its manifest lists: parser.js, the default, byte for byte full.min.js; full, lite, and from
// workbench c17f57a on, reader and workbench, each min and debug with a map; manifest.json. The page
// reads the variants from the manifest, so an older folder simply lists fewer. A name is cut once and its bytes
// never change, so its files cache for a year. Releases and patches are published: tracked in
// git and listed in index.json. Prereleases are gitignored, deploy from the working tree, are
// listed in prereleases.json, and a pruned one simply 404s. /parser/latest.js moves to the
// newest release or patch and never to a prerelease; /parser/next.js moves to the newest
// prerelease. Pages, manifests and indexes keep a short cache.
import { WORKBENCH } from "./quest.js";
import { PAPER_CSS, PAPER_HEAD } from "./paper.js";
import { PAGE_CSS, masthead, page } from "./page.js";
import { BASE_SECURITY, escapeHtml, layout, wantsJson } from "../../lib/shell.js";

export const RELEASE_SCHEMA = "spw.parser-release/2";
export const INDEX_SCHEMA = "spw.parser-index/2";
export const PRE_INDEX_SCHEMA = "spw.parser-prerelease-index/1";
/** A name: a release day, a prerelease headed for it (-pre.N), or a patch of it (-patch.N); N from 1. */
export const NAME_PATTERN = /^(\d{4}\.\d{2}\.\d{2})(?:-(pre|patch)\.([1-9]\d*))?$/;
/** A file inside a name's folder: flat, and not starting with a dot. */
export const FILE_PATTERN = /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/;
/** The default file of every name: the same bytes as full.min.js. */
export const DEFAULT_FILE = "parser.js";
export const IMMUTABLE = "public, max-age=31536000, immutable";
const SHORT = "public, max-age=300";
/** next.js and the prerelease index move whenever a prerelease is carried or pruned. */
const MINUTE = "public, max-age=60";
const INDEX_PATH = "/parser/index.json";
const PRE_INDEX_PATH = "/parser/prereleases.json";
const LATEST_PATH = "/parser/latest.js";
const NEXT_PATH = "/parser/next.js";

/** YYYY.MM.DD that names a day the calendar has. */
export function isCalendarDay(day) {
  const [year, month, date] = String(day).split(".").map(Number);
  const time = new Date(Date.UTC(year, month - 1, date));
  return time.getUTCFullYear() === year && time.getUTCMonth() === month - 1 && time.getUTCDate() === date;
}

/** What a name says: its kind, its day, and a prerelease's or patch's number; null for anything else. */
export function readName(name) {
  const match = NAME_PATTERN.exec(typeof name === "string" ? name : "");
  if (!match) return null;
  const [, day, suffix, n] = match;
  if (suffix === "pre") return { name, kind: "prerelease", day, pre: Number(n) };
  if (suffix === "patch") return { name, kind: "patch", day, patch: Number(n) };
  return { name, kind: "release", day };
}

/** Published builds (index.json, latest.js) are releases and patches; prereleases are not. */
export const isPublished = (kind) => kind === "release" || kind === "patch";

/** Where a name sits within its day: pre.N, then the release, then patch.N. */
const TIER = { prerelease: 0, release: 1, patch: 2 };

/** Newest first: the later day; within a day, patch.N over the release over pre.N, and the higher N. */
export const newestFirst = (a, b) => {
  const [x, y] = [readName(a.name), readName(b.name)];
  return y.day.localeCompare(x.day) || TIER[y.kind] - TIER[x.kind] || (y.pre ?? y.patch ?? 0) - (x.pre ?? x.patch ?? 0);
};

/** What every parser file carries, whichever site imports it. */
const FILE_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cross-Origin-Resource-Policy": "cross-origin",
  "X-Content-Type-Options": "nosniff",
};

const contentType = (path) => /\.(map|json)$/.test(path) ? "application/json; charset=UTF-8" : "text/javascript; charset=UTF-8";

export const isParserPath = (pathname) => pathname === "/parser" || pathname.startsWith("/parser/");

function assetFetcher(env, origin) {
  const assets = env?.ASSETS;
  return (path) => assets ? assets.fetch(new Request(new URL(path, origin))) : Promise.resolve(new Response(null, { status: 404 }));
}

async function readJson(fetchAsset, path) {
  const response = await fetchAsset(path);
  if (!response.ok) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/** An index's entries that pass `keep`, newest first; empty when the file is not there (prereleases.json is not in git). */
async function readIndex(fetchAsset, path, key, keep) {
  const index = await readJson(fetchAsset, path);
  return (Array.isArray(index?.[key]) ? index[key] : [])
    .filter((entry) => keep(readName(entry?.name)?.kind)).sort(newestFirst);
}

/** releases: the published builds (releases and patches) from index.json; prereleases from prereleases.json. */
async function readIndexes(fetchAsset) {
  const [releases, prereleases] = await Promise.all([
    readIndex(fetchAsset, INDEX_PATH, "releases", isPublished),
    readIndex(fetchAsset, PRE_INDEX_PATH, "prereleases", (kind) => kind === "prerelease"),
  ]);
  return { releases, prereleases };
}

async function readManifest(fetchAsset, name) {
  const manifest = await readJson(fetchAsset, `/parser/${name}/manifest.json`);
  return manifest?.name === name && Array.isArray(manifest.files) ? manifest : null;
}

/** The paths a 404 offers: the indexes, every name's page and manifest, and the files of the name asked about. */
function existingPaths({ releases, prereleases }, manifest) {
  const pages = (name) => [`/parser/${name}/`, `/parser/${name}/manifest.json`];
  const files = manifest ? [...pages(manifest.name), ...manifest.files.map((file) => `/parser/${manifest.name}/${file.path}`)] : [];
  return [...new Set([
    "/parser/", INDEX_PATH, LATEST_PATH, PRE_INDEX_PATH, ...(prereleases.length ? [NEXT_PATH] : []),
    ...releases.flatMap((entry) => pages(entry.name)), ...prereleases.flatMap((entry) => pages(entry.name)), ...files,
  ])];
}

function notFound(request, url, paths, note = "") {
  const headers = { ...BASE_SECURITY, ...FILE_HEADERS, "Cache-Control": MINUTE };
  if (wantsJson(request)) {
    return new Response(JSON.stringify({ error: "not_found", path: url.pathname, ...(note ? { note } : {}), paths }, null, 2), {
      status: 404, headers: { ...headers, "Content-Type": "application/json; charset=UTF-8" } });
  }
  return new Response(`Not found: ${url.pathname}\n${note ? `${note}\n` : ""}\nThese paths exist:\n${paths.join("\n")}\n`, {
    status: 404, headers: { ...headers, "Content-Type": "text/plain; charset=UTF-8" } });
}

const redirect = (location, status, extra = {}) =>
  new Response(null, { status, headers: { ...BASE_SECURITY, ...extra, Location: location } });

async function serveFile(fetchAsset, path, cache) {
  const asset = await fetchAsset(path);
  if (!asset.ok) return null;
  const headers = { ...BASE_SECURITY, ...FILE_HEADERS, "Content-Type": contentType(path), "Cache-Control": cache };
  const etag = asset.headers.get("etag");
  if (etag) headers.ETag = etag;
  return new Response(asset.body, { status: 200, headers });
}

const indexJson = (index) => new Response(`${JSON.stringify(index, null, 2)}\n`, {
  headers: { ...BASE_SECURITY, ...FILE_HEADERS, "Content-Type": "application/json; charset=UTF-8", "Cache-Control": MINUTE } });

const RELEASE_CSS = `.releases { list-style: none; margin: 1rem 0 1.5rem; padding: 0; }
    .releases li { display: flex; flex-wrap: wrap; align-items: baseline; gap: .2rem .8rem; padding: .6rem 0; border-top: 1px solid var(--line); }
    .releases li:last-child { border-bottom: 1px solid var(--line); }
    .releases strong { font: 600 1.05rem var(--mono); font-variant-numeric: tabular-nums; }
    .file { margin: 2rem 0 0; padding-top: 1.2rem; border-top: 1px solid var(--line); }
    .file h2 { display: flex; flex-wrap: wrap; align-items: baseline; gap: .2rem .6rem; font-size: 1.05rem; }
    .file h2 code { font-size: 1em; overflow-wrap: anywhere; }
    .badge { padding: .05rem .5rem; border: 1px solid var(--accent); border-radius: var(--pill); color: var(--accent); font: .74rem/1.5 var(--mono); }
    .fields dd { font-variant-numeric: tabular-nums; }
    .fields dd code { overflow-wrap: anywhere; }`;

const revision12 = (entry) => escapeHtml(String(entry.revision || "").slice(0, 12));

function releaseItem(entry) {
  const base = `/parser/${escapeHtml(entry.name)}/`;
  const patch = readName(entry.name).kind === "patch";
  return `<li><a href="${base}"><strong>${escapeHtml(entry.name)}</strong></a>${patch ? ` <span class="badge">patch</span>` : ""}
      <span class="note">workbench <code>${revision12(entry)}</code> · <a href="${base}${DEFAULT_FILE}"><code>${DEFAULT_FILE}</code></a></span></li>`;
}

/** One prerelease in a list: its name, labelled, the day it is headed for, and a way to read the guide with it. */
function prereleaseItem(entry) {
  const name = escapeHtml(entry.name);
  return `<li><a href="/parser/${name}/"><strong>${name}</strong></a> <span class="badge">prerelease</span>
      <span class="note">headed for <code>${escapeHtml(readName(entry.name).day)}</code> · workbench <code>${revision12(entry)}</code> · <a href="/parser/${name}/${DEFAULT_FILE}"><code>${DEFAULT_FILE}</code></a> · <a href="/?parser=${name}">read the guide with it</a></span></li>`;
}

function renderIndex({ releases, prereleases }) {
  const pre = prereleases.length ? `
<h2 id="prereleases">Prereleases</h2>
<p>Each is headed for a release day and is here to be tried before it is one. <code>/parser.js</code> and <code>latest.js</code> never serve a prerelease, and a prerelease can be pruned, after which its paths answer 404.</p>
<ul class="releases">
    ${prereleases.map(prereleaseItem).join("\n    ")}
  </ul>
<p><a href="${PRE_INDEX_PATH}"><code>prereleases.json</code></a> lists them for a program. <a href="${NEXT_PATH}"><code>next.js</code></a> redirects to the newest prerelease, a minute at a time.</p>` : "";
  return layout({
    title: "spw.quest — parser releases",
    description: "Dated builds of the Spw parser, newest first. A dated path never changes.",
    canonical: "https://spw.quest/parser/",
    head: PAPER_HEAD,
    themeCss: `${PAPER_CSS}\n    ${PAGE_CSS}\n    main > :not(.masthead) { max-width: 52rem; }\n    ${RELEASE_CSS}`,
    body: `${masthead("/parser/")}
<h1>Parser releases</h1>
<p class="lede">Dated builds of the Spw parser, newest first. A file under a dated path never changes, so another page can import it by its full address. A published day is never cut again; a fix to it is a patch, <code>-patch.1</code> and on, listed above its day.</p>
${releases.length ? `<ul class="releases">\n    ${releases.map(releaseItem).join("\n    ")}\n  </ul>` : `<p>No release has been carried here yet.</p>`}
<p><a href="${INDEX_PATH}"><code>index.json</code></a> lists the same releases for a program. <a href="${LATEST_PATH}"><code>latest.js</code></a> redirects to the newest release; it moves, so it is for trying a release, not for importing one.</p>${pre}`,
  });
}

/** What each variant is for, as the workbench's release script describes it. */
const VARIANT_WORDS = {
  full: "The parser: parse and parseExpression.",
  lite: "The scanner: marks operators and braces without parsing.",
  reader: "What the editor reads from a file: highlighted HTML, the outline, the anchors and the role stream, with parse.",
  workbench: "Seed's whole API, the runtime (runSpw and hot sessions), the reader, and the form under a caret (formAt, formHover).",
};

/** The import line a page would write: the full parser reads, lite scans, the reader highlights, the workbench runs. */
function importLine(variant, url) {
  if (variant === "full") return `import { parse } from "${url}";`;
  if (variant === "lite") return `import { scan } from "${url}";`;
  if (variant === "reader") return `import { parse, highlightHtml, outline, anchors } from "${url}";`;
  if (variant === "workbench") return `import { parse, runSpw, highlightHtml } from "${url}";`;
  return `import * as spw from "${url}";`;
}

function fileSection(manifest, file, origin) {
  const id = file.path.replace(/[^A-Za-z0-9]+/g, "-");
  const url = `${origin}/parser/${manifest.name}/${file.path}`;
  const target = typeof file.alias === "string" ? manifest.files.find((other) => other.path === file.alias) : null;
  const variant = file.variant ?? target?.variant;
  const form = file.form ?? target?.form;
  const facts = [
    ["Variant", `${escapeHtml(variant ?? "—")}${VARIANT_WORDS[variant] ? ` <span class="note">${escapeHtml(VARIANT_WORDS[variant])}</span>` : ""}`],
    ["Form", escapeHtml(form ?? "—")],
    ...(file.kind ? [["Kind", escapeHtml(file.kind)]] : []),
    ...(target ? [["Same bytes as", `<a href="${escapeHtml(file.alias)}"><code>${escapeHtml(file.alias)}</code></a>`]] : []),
    ["Bytes", escapeHtml(Number(file.bytes).toLocaleString("en-US"))],
    ["sha256", `<code>${escapeHtml(file.sha256)}</code>`],
    ["Integrity", `<code>${escapeHtml(file.integrity)}</code>`],
  ].map(([term, value]) => `<dt>${term}</dt><dd>${value}</dd>`).join("\n    ");
  const lines = /\.js$/.test(file.path) ? `
  <figure class="codeblock">
    <figcaption><span>import</span><button type="button" data-copy="import-${id}">Copy</button></figcaption>
    <pre id="import-${id}">${escapeHtml(importLine(variant, url))}</pre>
  </figure>
  <figure class="codeblock">
    <figcaption><span>script tag</span><button type="button" data-copy="script-${id}">Copy</button></figcaption>
    <pre id="script-${id}">${escapeHtml(`<script type="module" src="${url}" integrity="${file.integrity}" crossorigin="anonymous"></script>`)}</pre>
  </figure>` : "";
  const isDefault = file.path === manifest.default?.path;
  return `<section class="file" id="file-${id}" aria-labelledby="title-${id}">
  <h2 id="title-${id}"><a href="${escapeHtml(file.path)}"><code>${escapeHtml(file.path)}</code></a>${isDefault ? ` <span class="badge">default</span>` : ""}${target ? ` <span class="badge">alias</span>` : ""}</h2>
  <dl class="fields">
    ${facts}
  </dl>${lines}
</section>`;
}

/** How a page names each kind, what it says first, and what its day is to it. */
const KIND_WORDS = {
  release: { label: "", day: "Release day",
    lede: () => "Every file here was cut together from one workbench revision. A file never changes once it is here; import it by its full address, with its integrity." },
  patch: { label: "patch ", day: "Patch of",
    lede: (day) => `A patch of ${day}: that day is published and never cut again, so its fix is cut here, from one later workbench revision. A file never changes once it is here; import it by its full address, with its integrity.` },
  prerelease: { label: "prerelease ", day: "Headed for",
    lede: (day) => `A prerelease headed for ${day}: every file here was cut together from one workbench revision, to be tried before that day. <code>/parser.js</code> and <code>/parser/latest.js</code> never serve it. A file never changes once it is here; if the prerelease is pruned, its paths answer 404.` },
};

function renderRelease(manifest, origin) {
  const { workbench = {}, name } = manifest;
  const { kind, day } = readName(name);
  const words = KIND_WORDS[kind];
  const pre = kind === "prerelease";
  const revision = String(workbench.revision || "");
  const def = manifest.default || {};
  const target = manifest.files.find((file) => file.path === def.path)?.alias;
  return layout({
    title: `spw.quest — parser ${words.label}${name}`,
    description: `Spw parser ${kind} ${name}: every file with its size, hash and integrity, cut from one workbench revision.`,
    canonical: `https://spw.quest/parser/${name}/`,
    head: PAPER_HEAD,
    themeCss: `${PAPER_CSS}\n    ${PAGE_CSS}\n    main > :not(.masthead) { max-width: 52rem; }\n    ${RELEASE_CSS}`,
    body: `${masthead("/parser/")}
<p class="kicker"><a href="/parser/">parser</a> · ${pre ? `<a href="/parser/#prereleases">prereleases</a> · ` : ""}${escapeHtml(name)}</p>
<h1>Parser ${words.label}${escapeHtml(name)}</h1>
<p class="lede">${words.lede(escapeHtml(day))}</p>
<dl class="fields">
  <dt>Workbench</dt><dd>${escapeHtml(workbench.package ?? "")} ${escapeHtml(workbench.version ?? "")} at <a href="${escapeHtml(`${WORKBENCH.repository}/commit/${revision}`)}"><code>${escapeHtml(revision)}</code></a>${manifest.dirty ? " (cut from a tree with uncommitted changes)" : ""}</dd>
  <dt>Grammar</dt><dd>${escapeHtml(typeof manifest.grammar === "string" ? manifest.grammar : JSON.stringify(manifest.grammar ?? null))}</dd>
  <dt>${words.day}</dt><dd><code>${escapeHtml(day)}</code></dd>
  <dt>Default</dt><dd>${escapeHtml([def.variant, def.form].filter(Boolean).join(" "))}, <a href="${escapeHtml(def.path ?? "")}"><code>${escapeHtml(def.path ?? "")}</code></a>${target ? `, the same bytes as <a href="${escapeHtml(target)}"><code>${escapeHtml(target)}</code></a>` : ""}</dd>
  <dt>Manifest</dt><dd><a href="manifest.json"><code>manifest.json</code></a></dd>
  <dt>Try it</dt><dd><a href="/?parser=${escapeHtml(name)}">the guide, read with this build</a></dd>
</dl>
${manifest.files.map((file) => fileSection(manifest, file, origin)).join("\n")}
<p><a href="/parser/">All releases</a> · <a href="${INDEX_PATH}">index.json</a>${pre ? ` · <a href="${PRE_INDEX_PATH}">prereleases.json</a>` : ""}</p>`,
  });
}

async function route(request, url, fetchAsset) {
  const path = url.pathname;
  if (path === "/parser") return redirect("/parser/", 301);
  const [, name, rest] = path.match(/^\/parser\/([^/]+)(?:\/(.*))?$/) || [];
  const named = readName(name);
  if (named && rest === undefined) return redirect(`/parser/${name}/`, 301);
  if (named && rest === "manifest.json") {
    const manifest = await serveFile(fetchAsset, path, SHORT);
    if (manifest) return manifest;
  } else if (named && rest === "") {
    const manifest = await readManifest(fetchAsset, name);
    if (manifest) return page(renderRelease(manifest, url.origin), { cache: SHORT });
  } else if (named && FILE_PATTERN.test(rest)) {
    const file = await serveFile(fetchAsset, path, IMMUTABLE);
    if (file) return file;
  }
  const indexes = await readIndexes(fetchAsset);
  if (named) return notFound(request, url, existingPaths(indexes, await readManifest(fetchAsset, name)));
  if (path === "/parser/") return page(renderIndex(indexes), { cache: SHORT });
  if (path === INDEX_PATH) {
    const file = await serveFile(fetchAsset, path, SHORT);
    if (file) return file;
  }
  if (path === PRE_INDEX_PATH) return indexJson({ schema: PRE_INDEX_SCHEMA, prereleases: indexes.prereleases });
  // latest.js reads only index.json, which lists releases and patches, so it never lands on a prerelease.
  if (path === LATEST_PATH && indexes.releases.length) {
    return redirect(`/parser/${indexes.releases[0].name}/${DEFAULT_FILE}`, 302, { ...FILE_HEADERS, "Cache-Control": SHORT });
  }
  if (path === NEXT_PATH && indexes.prereleases.length) {
    return redirect(`/parser/${indexes.prereleases[0].name}/${DEFAULT_FILE}`, 302, { ...FILE_HEADERS, "Cache-Control": MINUTE });
  }
  const note = path === NEXT_PATH ? `No prerelease has been carried, so next.js has nowhere to go; ${LATEST_PATH} is the newest published build.` : "";
  return notFound(request, url, existingPaths(indexes), note);
}

/** GET and HEAD for /parser and everything under /parser/. */
export async function handleParser(request, url, env) {
  if (!["GET", "HEAD"].includes(request.method)) {
    return new Response("Method not allowed", { status: 405, headers: { ...BASE_SECURITY, Allow: "GET, HEAD" } });
  }
  const response = await route(request, url, assetFetcher(env, url.origin));
  if (request.method !== "HEAD") return response;
  await response.body?.cancel();
  return new Response(null, { status: response.status, headers: response.headers });
}
