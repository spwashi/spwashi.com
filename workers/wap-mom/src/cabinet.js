/**
 * The cabinet: filings received before the old wish form closed. Nothing new
 * arrives. It stays behind CABINET_KEY so stored emails can be read and
 * discarded.
 */
import { BASE_SECURITY, escapeHtml, framed, htmlPrivate, jsonResponse, masthead } from "./layout.js";

function cookiesOf(request) {
  const raw = request.headers.get("cookie") || "";
  const out = {};
  for (const part of raw.split(";")) {
    const cut = part.indexOf("=");
    if (cut === -1) continue;
    out[part.slice(0, cut).trim()] = decodeURIComponent(part.slice(cut + 1).trim());
  }
  return out;
}

async function secretsEqual(provided, expected) {
  if (!expected) return false;
  const enc = new TextEncoder();
  const a = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(String(provided))));
  const b = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(String(expected))));
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a[i] || 0) ^ (b[i] || 0);
  return diff === 0;
}

async function unlocked(request, env) {
  const expected = env?.CABINET_KEY;
  if (!expected) return false;
  const header = request.headers.get("authorization") || "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const provided = bearer || cookiesOf(request).wap_cabinet || "";
  if (!provided) return false;
  return secretsEqual(provided, expected);
}

const clipField = (value, max) => String(value || "").trim().slice(0, max);
const excerpt = (filing) => String(filing.helpful || filing.sexy || filing.wonder || "").slice(0, 140);

function cabinetPage(body, title = "Cabinet") {
  return framed({
    title: `${title} — wap.mom`,
    description: "Cabinet.",
    canonical: "https://wap.mom/cabinet",
    robots: "noindex, nofollow",
    body: `${masthead({ compact: true })}
<h1>Cabinet.</h1>
<p class="muted">Filings received before the form closed. Nothing new arrives here. Read, keep, or discard.</p>
${body}`,
  });
}

function renderLogin(notice = "") {
  const banner = notice ? `<p class="muted">${escapeHtml(notice)}</p>` : "";
  return cabinetPage(`${banner}
<form method="post" action="/cabinet">
  <label for="key">Key</label>
  <input id="key" name="key" type="password" autocomplete="current-password" required>
  <button type="submit">Open</button>
</form>`);
}

function renderList(filings, status, notice = "") {
  const banner = notice ? `<p class="muted">${escapeHtml(notice)}</p>` : "";
  const filters = ["open", "kept", "shelved", "all"]
    .map((s) => (s === status ? `<li><strong>${escapeHtml(s)}</strong></li>` : `<li><a href="/cabinet?status=${encodeURIComponent(s)}">${escapeHtml(s)}</a></li>`))
    .join("");
  const items = filings.length
    ? filings
        .map(
          (f) => `<div class="slot">
  <p class="kicker caps">${escapeHtml(f.status || "open")} · ${escapeHtml(f.received || "")}${f.reach ? " · email on file" : ""}</p>
  <h2><a href="/cabinet/${escapeHtml(f.id)}">${escapeHtml(f.office || f.id)}</a></h2>
  <p>${escapeHtml(excerpt(f))}</p>
</div>`
        )
        .join("")
    : `<p class="muted">No filings in this drawer.</p>`;
  return cabinetPage(`<ul class="links">${filters}</ul>
${banner}
<p class="muted">${filings.length} shown.</p>
${items}`);
}

function renderItem(filing, notice = "") {
  const banner = notice ? `<p class="muted">${escapeHtml(notice)}</p>` : "";
  const processed = filing.processed
    ? `<p class="muted">Last: ${escapeHtml(filing.processed.action)} · ${escapeHtml(filing.processed.at)}${filing.processed.note ? ` · ${escapeHtml(filing.processed.note)}` : ""}</p>`
    : "";
  const field = (name, value) => (value ? `<p class="kicker caps">${name}</p><p>${escapeHtml(value)}</p>` : "");
  return cabinetPage(
    `${banner}
<article>
  <p class="kicker caps">${escapeHtml(filing.status || "open")} · ${escapeHtml(filing.received || "")}</p>
  ${field("Office", filing.office)}
  ${field("Serves", filing.serves)}
  ${field("Name", filing.from)}
  ${field("Email", filing.reach)}
  ${field("Wish", filing.sexy)}
  ${field("Wish", filing.helpful)}
  ${field("Wish", !filing.sexy && !filing.helpful ? filing.wonder : "")}
  ${processed}
  <form method="post" action="/cabinet/${escapeHtml(filing.id)}">
    <label for="note">Note</label>
    <input id="note" name="note" maxlength="500" value="${escapeHtml(filing.processed?.note || "")}">
    <button type="submit" name="action" value="keep">Keep</button>
    <button type="submit" name="action" value="shelve">Shelve</button>
    <button type="submit" name="action" value="open">Reopen</button>
    <button type="submit" name="action" value="discard">Discard</button>
  </form>
</article>`,
    `Filing ${filing.id}`
  );
}

async function listFilings(env, status) {
  if (!env?.FILINGS) return [];
  const keys = [];
  let cursor;
  do {
    const listed = await env.FILINGS.list({ prefix: "filing:", cursor });
    keys.push(...listed.keys);
    cursor = listed.list_complete ? undefined : listed.cursor;
  } while (cursor);
  const rows = await Promise.all(keys.map((k) => env.FILINGS.get(k.name)));
  return rows
    .map((raw) => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .filter((f) => (status === "all" ? true : (f.status || "open") === status))
    .sort((a, b) => String(b.received || "").localeCompare(String(a.received || "")));
}

const wantedStatus = (url) => {
  const status = url.searchParams.get("status") || "open";
  return ["open", "kept", "shelved", "all"].includes(status) ? status : "open";
};

/* Returns a Response for /cabinet paths, or null for anything else. */
export async function cabinet(request, env, url) {
  const path = url.pathname;
  if (path === "/cabinet" && request.method === "POST") {
    if (!env?.CABINET_KEY) return htmlPrivate(renderLogin("The lock is not cut."), 503);
    const form = await request.formData();
    const key = String(form.get("key") || "");
    if (!(await secretsEqual(key, env.CABINET_KEY))) return htmlPrivate(renderLogin("That key does not open the cabinet."), 401);
    return new Response(null, {
      status: 303,
      headers: {
        ...BASE_SECURITY,
        Location: "https://wap.mom/cabinet",
        "Set-Cookie": `wap_cabinet=${encodeURIComponent(key)}; Path=/cabinet; HttpOnly; Secure; SameSite=Strict; Max-Age=1209600`,
      },
    });
  }
  if (path === "/cabinet" || path === "/cabinet/") {
    if (!(await unlocked(request, env))) return htmlPrivate(renderLogin());
    const status = wantedStatus(url);
    return htmlPrivate(renderList(await listFilings(env, status), status));
  }
  if (path === "/cabinet.json") {
    if (!(await unlocked(request, env))) {
      return new Response(JSON.stringify({ error: "locked" }), {
        status: 401,
        headers: { ...BASE_SECURITY, "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
      });
    }
    const status = wantedStatus(url);
    return jsonResponse({ status, filings: await listFilings(env, status) }, { cache: "no-store", robots: "noindex" });
  }
  const item = path.match(/^\/cabinet\/([^/]+)\/?$/);
  if (!item) return null;
  if (!(await unlocked(request, env))) return htmlPrivate(renderLogin());
  const id = decodeURIComponent(item[1]);
  const key = `filing:${id}`;
  const raw = await env.FILINGS?.get(key);
  if (!raw) return htmlPrivate(renderList([], "open", "That filing is gone."), 404);
  const filing = JSON.parse(raw);
  if (request.method !== "POST") return htmlPrivate(renderItem(filing));
  const form = await request.formData();
  const action = String(form.get("action") || "");
  if (action === "discard") {
    await env.FILINGS.delete(key);
    return Response.redirect("https://wap.mom/cabinet", 303);
  }
  const next = { keep: "kept", shelve: "shelved", open: "open" }[action];
  if (!next) return htmlPrivate(renderItem(filing, "Keep, shelve, reopen, or discard."), 400);
  filing.status = next;
  filing.processed = { at: new Date().toISOString(), action, note: clipField(form.get("note"), 500) || null };
  await env.FILINGS.put(key, JSON.stringify(filing));
  return Response.redirect(`https://wap.mom/cabinet/${encodeURIComponent(id)}`, 303);
}
