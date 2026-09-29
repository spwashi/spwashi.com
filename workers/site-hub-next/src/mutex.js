/**
 * mutex.buzz — the lock.
 *
 * One concept holds the frame at a time. A hold is time-boxed to the season
 * clock: cycles close on the 13th, the 26th, and the last day of the month
 * (UTC). When nothing else holds the lock, a laminated folio does, so the
 * resting state is the work itself. Waiting holders line up in public.
 *
 *   /           what the lock is, with the current holder framed
 *   /now/       the current holder, embeddable by attention.productions
 *   /now.json   the same, for machines
 */
import { escapeHtml } from "../../lib/shell.js";

export const HOST = "mutex.buzz";

/** Resting holders: one laminated folio per cycle, from the September 26 release. */
export const FOLIOS = Object.freeze({
  A: {
    kind: "folio",
    title: "Lined stage facade",
    image: "https://spwashi.com/public/images/assets/folios/folio-lined-stage-facade-hero.webp",
    width: 1024,
    height: 808,
    alt: "Pale yellow and violet wash over lined paper, a row of faint pencil cards above a wide stage-like facade",
    href: "https://spwashi.com/design/folios/#folio-25",
  },
  B: {
    kind: "folio",
    title: "Teal Stripes Vibes wash",
    image: "https://spwashi.com/public/images/assets/folios/folio-teal-stripes-vibes-wash-hero.webp",
    width: 803,
    height: 1024,
    alt: "Violet and teal wash over a small pink panel and a Teal Stripes Vibes label",
    href: "https://spwashi.com/design/folios/#folio-16",
  },
  C: {
    kind: "folio",
    title: "factshift cabinet",
    image: "https://spwashi.com/public/images/assets/folios/folio-factshift-cabinet-hero.webp",
    width: 795,
    height: 1024,
    alt: "A cabinet of ink drawers and slots washed in pink and sea green, with factshift.com lettered small",
    href: "https://spwashi.com/design/folios/#folio-17",
  },
});

/**
 * Agreed holds, each for one cycle: { kind, title, image, width, height, alt,
 * href, cycleStart: "YYYY-MM-DD" }. A hold starts at a close and releases at
 * the next. Empty today: the folios rest in the frame.
 */
export const HOLDS = Object.freeze([]);

/** Holders waiting their turn, in order. Being next is visible; nobody pays to jump it mid-cycle. */
export const QUEUE = Object.freeze([]);

const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

/** The cycle a date sits in: A to the 13th, B to the 26th, C to month's end. */
export function cycleFor(date) {
  const y = date.getUTCFullYear(), m = date.getUTCMonth(), d = date.getUTCDate();
  const index = d <= 13 ? 0 : d <= 26 ? 1 : 2;
  const startDay = [1, 14, 27][index];
  const since = new Date(Date.UTC(y, m, startDay));
  const releasesAt = index < 2 ? new Date(Date.UTC(y, m, [14, 27][index])) : new Date(Date.UTC(y, m + 1, 1));
  return { cycle: "ABC"[index], since, releasesAt };
}

export function holderFor(date) {
  const c = cycleFor(date);
  const held = HOLDS.find((h) => h.cycleStart === ymd(c.since));
  const holder = held || FOLIOS[c.cycle];
  return {
    ...holder,
    cycle: c.cycle,
    since: c.since.toISOString(),
    releasesAt: c.releasesAt.toISOString(),
    queue: QUEUE.map(({ title, kind }) => ({ title, kind })),
  };
}

const monthDay = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });

const SECURITY = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
};

const FRAME_ANCESTORS = "frame-ancestors 'self' https://attention.productions";

function html(body, { cache = "public, max-age=300", csp }) {
  return new Response(body, {
    headers: {
      ...SECURITY,
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": cache,
      "Content-Security-Policy": csp,
      "X-Robots-Tag": "index, follow",
    },
  });
}

/** Seconds until the lock changes hands, so caches turn over at the close. */
const untilRelease = (holder, now) => Math.max(60, Math.floor((Date.parse(holder.releasesAt) - now.getTime()) / 1000));

function renderNow(holder) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(`${holder.title} holds the lock — mutex.buzz`)}</title>
<meta name="description" content="${escapeHtml(`${holder.title} holds the frame for cycle ${holder.cycle}, through ${monthDay(new Date(Date.parse(holder.releasesAt) - 1).toISOString())}.`)}">
<link rel="canonical" href="https://mutex.buzz/now/">
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body { background: #0d0a10; color: #f6f0ea; font: 14px/1.4 ui-sans-serif, system-ui, sans-serif; }
  a { color: inherit; }
  .frame { position: relative; display: block; height: 100%; min-height: 240px; overflow: hidden; text-decoration: none; }
  .frame img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: radial-gradient(ellipse at center, #241a2a 0%, #0d0a10 70%); }
  .lock { position: absolute; left: 12px; right: 12px; bottom: 12px; display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 12px; padding: 10px 12px; border-radius: 10px; background: rgba(13,10,16,.72); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(246,240,234,.16); }
  .lock strong { font-size: 15px; }
  .lock span { color: #c9bccd; font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; }
  .frame:focus-visible { outline: 2px solid #c8ff00; outline-offset: -4px; }
</style>
</head>
<body>
<a class="frame" href="${escapeHtml(holder.href)}" target="_top" rel="noopener">
  <img src="${escapeHtml(holder.image)}" width="${holder.width}" height="${holder.height}" alt="${escapeHtml(holder.alt)}">
  <p class="lock"><strong>${escapeHtml(holder.title)}</strong><span>${escapeHtml(`holds the lock · cycle ${holder.cycle} · ${monthDay(holder.since)} through ${monthDay(new Date(Date.parse(holder.releasesAt) - 1).toISOString())}`)}</span></p>
</a>
</body>
</html>`;
}

function renderHome(holder) {
  const queue = holder.queue.length
    ? `<ol>${holder.queue.map((q) => `<li>${escapeHtml(q.title)}</li>`).join("")}</ol>`
    : `<p class="quiet">Nobody is waiting. The folio rests in the frame.</p>`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>mutex.buzz — one concept in the frame at a time</title>
<meta name="description" content="A lock on attention: one concept holds the frame, each hold releases at a close, and a laminated folio holds it the rest of the time.">
<link rel="canonical" href="https://mutex.buzz/">
<style>
  :root { color-scheme: dark; --bg:#0d0a10; --fg:#f6f0ea; --muted:#c9bccd; --line:rgba(246,240,234,.18); --accent:#c8ff00; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; background: var(--bg); color: var(--fg); font: 16px/1.55 ui-sans-serif, system-ui, sans-serif; }
  main { width: min(64rem, calc(100% - 32px)); margin: 0 auto; padding: 40px 0 48px; display: grid; gap: 28px; grid-template-columns: minmax(0, 1fr); }
  @media (min-width: 52rem) { main { grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); align-items: center; min-height: 100vh; padding: 32px 0; } }
  h1 { margin: 0 0 12px; font-size: clamp(2.2rem, 6vw, 3.6rem); line-height: .98; letter-spacing: -.045em; }
  h1 code { color: var(--accent); font-size: .78em; }
  p { margin: 0 0 12px; max-width: 34rem; }
  .kicker { color: var(--muted); font: 13px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; margin-bottom: 14px; }
  .rules { list-style: none; margin: 18px 0; padding: 0; display: grid; gap: 8px; }
  .rules li { padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; }
  .rules b { color: var(--accent); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; margin-right: 8px; }
  .quiet { color: var(--muted); }
  a { color: #9ad7ff; text-underline-offset: 3px; }
  .held { margin: 0; aspect-ratio: 4 / 3; border: 1px solid var(--line); border-radius: 16px; overflow: hidden; background: #0d0a10; }
  .held iframe { display: block; width: 100%; height: 100%; border: 0; }
  .data { font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--muted); }
</style>
</head>
<body>
<main>
  <section aria-labelledby="t">
    <p class="kicker">mutex.buzz · a lock on attention</p>
    <h1 id="t">One concept in the frame <code>at a time</code>.</h1>
    <p>A mutex lets one thread in and makes the rest wait. This one does that for attention: whatever holds the lock is the single thing the frame shows.</p>
    <ul class="rules">
      <li><b>hold</b>A hold starts at a close and releases at the next: the 13th, the 26th, and the last day of the month.</li>
      <li><b>rest</b>When nothing else holds it, a laminated folio does. The resting state is the work itself.</li>
      <li><b>wait</b>Anyone waiting lines up in public, in order.</li>
    </ul>
    <h2 class="kicker">Waiting</h2>
    ${queue}
    <p class="data"><a href="/now/">/now/</a> · <a href="/now.json">/now.json</a> · framed on <a href="https://attention.productions/">attention.productions</a></p>
  </section>
  <figure class="held">
    <iframe src="/now/" title="${escapeHtml(`What holds the lock now: ${holder.title}`)}" loading="lazy"></iframe>
  </figure>
</main>
</body>
</html>`;
}

const nowFrom = (env) => (env && env.NOW ? new Date(env.NOW) : new Date());

export async function handleMutex(request, env = {}) {
  if (!["GET", "HEAD"].includes(request.method)) {
    return new Response("Method not allowed\n", { status: 405, headers: { ...SECURITY, Allow: "GET, HEAD" } });
  }
  const url = new URL(request.url);
  const now = nowFrom(env);
  const holder = holderFor(now);
  const turnover = `public, max-age=${Math.min(300, untilRelease(holder, now))}`;
  let res;
  if (url.pathname === "/now.json") {
    res = new Response(`${JSON.stringify({ schema: "mutex.now.v1", ...holder }, null, 2)}\n`, {
      headers: { ...SECURITY, "Content-Type": "application/json; charset=UTF-8", "Cache-Control": turnover, "Access-Control-Allow-Origin": "*", "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'" },
    });
  } else if (url.pathname === "/now/" || url.pathname === "/now") {
    res = html(renderNow(holder), { cache: turnover, csp: `default-src 'none'; img-src https://spwashi.com; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; ${FRAME_ANCESTORS}` });
  } else if (url.pathname === "/" || url.pathname === "") {
    res = html(renderHome(holder), { cache: turnover, csp: `default-src 'none'; frame-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'` });
  } else if (url.pathname === "/robots.txt") {
    res = new Response("User-agent: *\nAllow: /\n", { headers: { ...SECURITY, "Content-Type": "text/plain; charset=UTF-8" } });
  } else {
    res = new Response("Not found\n", { status: 404, headers: { ...SECURITY, "Content-Type": "text/plain; charset=UTF-8" } });
  }
  return request.method === "HEAD" ? new Response(null, { status: res.status, headers: res.headers }) : res;
}
