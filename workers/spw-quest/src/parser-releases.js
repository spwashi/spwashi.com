// spw.quest/parser/: dated parser releases, served from the worker's static assets (env.ASSETS).
// carry-parser-release.mjs copies a workbench release into assets/parser/<release>/ and
// rewrites assets/parser/index.json; this module only reads what it carried.
//
// A release is a day (YYYY.MM.DD). Its files are named by offset (full/00.min.js, 00.js…)
// and never change, so they cache for a year. manifest.json and the release page name the
// release's current offset, which the workbench may move forward with a re-cut, so they,
// the index and /parser/latest.js keep a short cache.
import { WORKBENCH } from "./quest.js";
import { PAPER_CSS } from "./paper.js";
import { BASE_SECURITY, escapeHtml, htmlResponse, layout, wantsJson } from "../../lib/shell.js";

export const RELEASE_SCHEMA = "spw.parser-release/1";
export const INDEX_SCHEMA = "spw.parser-index/1";
export const RELEASE_PATTERN = /^\d{4}\.\d{2}\.\d{2}$/;
/** A file inside a release: at most one folder deep, no segment starting with a dot. */
export const FILE_PATTERN = /^(?:[A-Za-z0-9_-]+\/)?[A-Za-z0-9_-][A-Za-z0-9._-]*$/;
export const IMMUTABLE = "public, max-age=31536000, immutable";
const SHORT = "public, max-age=300";
const INDEX_PATH = "/parser/index.json";
const LATEST_PATH = "/parser/latest.js";

/** Newest release first; within a day, the higher offset first. */
export const newestFirst = (a, b) => b.release.localeCompare(a.release) || String(b.offset).localeCompare(String(a.offset));

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

async function readIndex(fetchAsset) {
  const index = await readJson(fetchAsset, INDEX_PATH);
  const releases = (Array.isArray(index?.releases) ? index.releases : [])
    .filter((entry) => RELEASE_PATTERN.test(entry?.release || "")).sort(newestFirst);
  return { schema: INDEX_SCHEMA, releases };
}

async function readManifest(fetchAsset, release) {
  const manifest = await readJson(fetchAsset, `/parser/${release}/manifest.json`);
  return manifest?.release === release && Array.isArray(manifest.files) ? manifest : null;
}

/** The paths a 404 offers: the index, every release, and the files of the release asked about. */
function existingPaths(index, manifest) {
  const releases = index.releases.flatMap((entry) => [`/parser/${entry.release}/`, `/parser/${entry.release}/manifest.json`]);
  const files = manifest ? [`/parser/${manifest.release}/`, `/parser/${manifest.release}/manifest.json`,
    ...manifest.files.map((file) => `/parser/${manifest.release}/${file.path}`)] : [];
  return [...new Set(["/parser/", INDEX_PATH, LATEST_PATH, ...releases, ...files])];
}

function notFound(request, url, paths) {
  const headers = { ...BASE_SECURITY, ...FILE_HEADERS, "Cache-Control": "public, max-age=60" };
  if (wantsJson(request)) {
    return new Response(JSON.stringify({ error: "not_found", path: url.pathname, paths }, null, 2), {
      status: 404, headers: { ...headers, "Content-Type": "application/json; charset=UTF-8" } });
  }
  return new Response(`Not found: ${url.pathname}\n\nThese paths exist:\n${paths.join("\n")}\n`, {
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

function renderIndex(index) {
  const items = index.releases.map((entry) => {
    const base = `/parser/${escapeHtml(entry.release)}/`;
    const offset = escapeHtml(entry.offset);
    const variant = escapeHtml([entry.default?.variant, entry.default?.form].filter(Boolean).join(" "));
    return `<li><a href="${base}"><strong>${escapeHtml(entry.release)}</strong></a>
      <span class="note">workbench <code>${escapeHtml(String(entry.revision || "").slice(0, 12))}</code> · ${variant} at <a href="${base}${offset}.js"><code>${offset}.js</code></a></span></li>`;
  }).join("\n    ");
  return layout({
    title: "spw.quest — parser releases",
    description: "Dated builds of the Spw parser, newest first. A dated path never changes.",
    canonical: "https://spw.quest/parser/",
    themeCss: `${PAPER_CSS}\n    ${RELEASE_CSS}`,
    body: `<p class="kicker"><a href="/">spw.quest</a> · parser</p>
<h1>Parser releases</h1>
<p class="lede">Dated builds of the Spw parser, newest first. A file under a dated path never changes, so another page can import it by its full address.</p>
${index.releases.length ? `<ul class="releases">\n    ${items}\n  </ul>` : `<p>No release has been carried here yet.</p>`}
<p><a href="${INDEX_PATH}"><code>index.json</code></a> lists the same releases for a program. <a href="${LATEST_PATH}"><code>latest.js</code></a> redirects to the newest release; it moves, so it is for trying a release, not for importing one.</p>`,
  });
}

/** The import line a page would write: the full parser reads, lite scans. */
function importLine(variant, url) {
  if (variant === "full") return `import { parse } from "${url}";`;
  if (variant === "lite") return `import { scan } from "${url}";`;
  return `import * as spw from "${url}";`;
}

function fileSection(manifest, file, origin) {
  const id = file.path.replace(/[^A-Za-z0-9]+/g, "-");
  const url = `${origin}/parser/${manifest.release}/${file.path}`;
  const target = typeof file.alias === "string" ? manifest.files.find((other) => other.path === file.alias) : null;
  const variant = file.variant ?? target?.variant;
  const form = file.form ?? target?.form;
  const facts = [
    ["Variant", escapeHtml(variant ?? "—")],
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

function renderRelease(manifest, origin) {
  const { workbench = {}, release, offset } = manifest;
  const revision = String(workbench.revision || "");
  const def = manifest.default || {};
  return layout({
    title: `spw.quest — parser ${release}`,
    description: `Spw parser release ${release}: every file with its size, hash and integrity, cut from one workbench revision.`,
    canonical: `https://spw.quest/parser/${release}/`,
    themeCss: `${PAPER_CSS}\n    ${RELEASE_CSS}`,
    body: `<p class="kicker"><a href="/">spw.quest</a> · <a href="/parser/">parser</a> · ${escapeHtml(release)}</p>
<h1>Parser ${escapeHtml(release)}</h1>
<p class="lede">Every file here was cut together from one workbench revision. A file never changes once it is here; import it by its full address, with its integrity.</p>
<dl class="fields">
  <dt>Workbench</dt><dd>${escapeHtml(workbench.package ?? "")} ${escapeHtml(workbench.version ?? "")} at <a href="${escapeHtml(`${WORKBENCH.repository}/commit/${revision}`)}"><code>${escapeHtml(revision)}</code></a>${manifest.dirty ? " (cut from a tree with uncommitted changes)" : ""}</dd>
  <dt>Grammar</dt><dd>${escapeHtml(typeof manifest.grammar === "string" ? manifest.grammar : JSON.stringify(manifest.grammar ?? null))}</dd>
  <dt>Offset</dt><dd><code>${escapeHtml(offset)}</code></dd>
  <dt>Default</dt><dd>${escapeHtml([def.variant, def.form].filter(Boolean).join(" "))}, <a href="${escapeHtml(def.path ?? "")}"><code>${escapeHtml(def.path ?? "")}</code></a>; <a href="${escapeHtml(offset)}.js"><code>${escapeHtml(offset)}.js</code></a> is the same bytes</dd>
  <dt>Manifest</dt><dd><a href="manifest.json"><code>manifest.json</code></a></dd>
</dl>
${manifest.files.map((file) => fileSection(manifest, file, origin)).join("\n")}
<p><a href="/parser/">All releases</a> · <a href="${INDEX_PATH}">index.json</a></p>`,
  });
}

async function route(request, url, fetchAsset) {
  const path = url.pathname;
  if (path === "/parser") return redirect("/parser/", 301);
  const [, release, rest] = path.match(/^\/parser\/(\d{4}\.\d{2}\.\d{2})(?:\/(.*))?$/) || [];
  if (release && rest === undefined) return redirect(`/parser/${release}/`, 301);
  if (release && rest === "manifest.json") {
    const manifest = await serveFile(fetchAsset, path, SHORT);
    if (manifest) return manifest;
  } else if (release && rest === "") {
    const manifest = await readManifest(fetchAsset, release);
    if (manifest) return htmlResponse(renderRelease(manifest, url.origin), { cache: SHORT });
  } else if (release && FILE_PATTERN.test(rest)) {
    const file = await serveFile(fetchAsset, path, IMMUTABLE);
    if (file) return file;
  }
  const index = await readIndex(fetchAsset);
  if (release) return notFound(request, url, existingPaths(index, await readManifest(fetchAsset, release)));
  if (path === "/parser/") return htmlResponse(renderIndex(index), { cache: SHORT });
  if (path === INDEX_PATH) {
    const file = await serveFile(fetchAsset, path, SHORT);
    if (file) return file;
  }
  if (path === LATEST_PATH && index.releases.length) {
    const newest = index.releases[0];
    return redirect(`/parser/${newest.release}/${newest.offset}.js`, 302, { ...FILE_HEADERS, "Cache-Control": SHORT });
  }
  return notFound(request, url, existingPaths(index));
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
