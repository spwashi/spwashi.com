/**
 * Shared page shell for the quest and feedback Workers.
 */
export const BASE_SECURITY = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Content-Security-Policy":
    "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
};

export const JSON_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Cross-Origin-Resource-Policy": "cross-origin",
};



export function wantsJson(request) {
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/html")) return false;
  return accept.includes("application/json");
}

export const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function jsonResponse(body, cache, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...BASE_SECURITY,
      ...JSON_CORS,
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": cache,
      "X-Robots-Tag": "noindex",
    },
  });
}


export function htmlResponse(body, extra = {}) {
  return new Response(body, {
    status: extra.status || 200,
    headers: {
      ...BASE_SECURITY,
      "Cross-Origin-Resource-Policy": "same-origin",
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": extra.cache || "public, max-age=120",
      "X-Robots-Tag": "noindex, nofollow",
      ...(extra.timing ? { "Server-Timing": extra.timing } : {}),
    },
  });
}

const SHELL = `
    :root { color-scheme: dark; --bg:#0a1012; --fg:#e8eef1; --muted:#8aa0a8; --line:rgba(94,234,212,.2); --accent:#5eead4; --warn:#e7c27a; --storm:#ff8a7a; --surface:#10181b; --field:#0d1416; --radius:1rem; --pill:999px; --font:ui-sans-serif, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    html { -webkit-text-size-adjust: 100%; }
    body {
      margin: 0; background: var(--bg); color: var(--fg);
      font: 1rem/1.5 var(--font);
      padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
    }
    main { width: min(40rem, calc(100% - 1.5rem)); margin: 0 auto; padding: 1.4rem 0 3rem; }
    body.embed { background: transparent; }
    body.embed main { width: 100%; max-width: none; padding: .75rem .85rem 1rem; }
    body.embed h1 { font-size: 1.15rem; margin: 0 0 .3rem; }
    body.embed article { margin: .3rem 0; padding: .8rem; }
    body.embed footer, body.embed .kicker { display: none; }
    h1 { font-size: clamp(1.7rem, 5vw, 2.5rem); letter-spacing: -.04em; line-height: 1.05; margin: .15rem 0 .7rem; }
    h2 { font-size: 1.05rem; margin: 0 0 .6rem; }
    a { color: var(--accent); }
    .kicker, footer, .note { color: var(--muted); font-size: .9rem; }
    .weather { font-size: clamp(2.4rem, 8vw, 4rem); letter-spacing: -.05em; line-height: .95; margin: .2rem 0 .4rem; }
    .weather[data-weather="haze"] { color: var(--warn); }
    .weather[data-weather="storm"] { color: var(--storm); }
    .score { list-style: none; padding: 0; margin: 1rem 0 0; }
    .score li { display: flex; justify-content: space-between; gap: 1rem; border-top: 1px solid var(--line); padding: .55rem 0; font-variant-numeric: tabular-nums; }
    .chip { display: inline-block; margin: .15rem .35rem .15rem 0; padding: .35rem .7rem; border: 1px solid var(--line); border-radius: 999px; text-decoration: none; min-height: 44px; line-height: 1.7; }
    article { border: 1px solid var(--line); border-radius: var(--radius); padding: 1.1rem 1.15rem; background: var(--surface); margin: 1.2rem 0; }
    code { font-family: ui-monospace, SFMono-Regular, monospace; font-size: .86em; overflow-wrap: anywhere; }
    label { display: block; color: var(--muted); font-size: .88rem; margin: 0 0 .35rem; }
    textarea.prompt, textarea.note, select, input:not(.hp):not([type="radio"]):not([type="checkbox"]) {
      width: 100%;
      max-width: 100%;
      min-height: 44px;
      padding: .75rem .8rem;
      border: 1px solid var(--line);
      border-radius: calc(var(--radius) * .8);
      background: var(--field);
      color: var(--fg);
      font: 1rem/1.45 var(--font);
    }
    fieldset { border: 1px solid var(--line); border-radius: 1rem; margin: 0 0 1rem; padding: .8rem 1rem 1rem; }
    fieldset legend { color: var(--muted); padding: 0 .3rem; }
    fieldset label { display: flex; align-items: center; gap: .6rem; min-height: 44px; margin: 0; color: var(--fg); }
    .codeblock { margin: 1rem 0 1.2rem; border: 1px solid var(--line); border-radius: calc(var(--radius) * .9); background: var(--field); overflow: hidden; }
    .actions { display: flex; flex-wrap: wrap; gap: .5rem; }
    .actions button { flex: 1 1 9rem; margin-top: .6rem; }
    .codeblock figcaption { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .6rem; min-height: 44px; padding: .25rem .4rem .25rem .85rem; border-bottom: 1px solid var(--line); color: var(--muted); font: .82rem/1.3 ui-monospace, SFMono-Regular, monospace; }
    .codeblock figcaption a { color: var(--muted); }
    .codeblock pre { margin: 0; padding: .85rem 1rem 1rem; overflow-x: auto; white-space: pre; font: .84rem/1.6 ui-monospace, SFMono-Regular, monospace; }
    .codeblock button { margin: 0; min-height: 44px; padding: .35rem .85rem; }
    textarea.prompt {
      min-height: 14rem;
      font: .82rem/1.45 ui-monospace, SFMono-Regular, monospace;
      resize: vertical;
    }
    textarea.note { min-height: 8rem; resize: vertical; }
    .hp { position: absolute; left: -9999px; }
    button {
      appearance: none; margin-top: 1rem; min-height: 44px; padding: .55rem 1.1rem;
      border-radius: var(--pill); border: 1px solid var(--accent); background: transparent; color: var(--accent);
      font: inherit; cursor: pointer;
    }
    .command { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem; margin: 0; }
    .command code { font-size: 1rem; padding: .65rem .8rem; border: 1px solid var(--line); border-radius: .8rem; background: var(--field); }
    button.quiet { margin-top: 0; }
    ol { padding-left: 1.2rem; }
    ol li { margin: .35rem 0; }
    button:focus-visible, a:focus-visible, summary:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible, [tabindex="-1"]:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
    .skip { position: absolute; left: .75rem; top: -4rem; z-index: 2; padding: .6rem 1rem; border-radius: var(--pill); background: var(--bg); border: 1px solid var(--accent); }
    .skip:focus { top: calc(.75rem + env(safe-area-inset-top)); }
    main:focus { outline: none; }
    .js .no-js-only { display: none; }
    .panel { margin: 1.2rem 0; padding: 1rem 1.1rem 1.1rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
    .panel > label:not(:first-child), .panel > .hint + label { margin-top: 1rem; }
    .hint { margin: -.15rem 0 .5rem; color: var(--muted); font-size: .88rem; }
    .error { margin: 0 0 .5rem; color: var(--storm); font-size: .92rem; font-weight: 600; }
    [aria-invalid="true"] { border-color: var(--storm) !important; }
    .error-summary { margin: 1rem 0; padding: .8rem 1rem; border: 2px solid var(--storm); border-radius: var(--radius); }
    .error-summary p { margin: 0 0 .3rem; font-weight: 600; }
    .error-summary ul { margin: 0; padding-left: 1.2rem; }
    .error-summary a { color: var(--fg); }
    .count { margin: .35rem 0 0; color: var(--muted); font-size: .85rem; font-variant-numeric: tabular-nums; }
    .count[data-state="short"], .count[data-state="long"] { color: var(--warn); }
    .choices, fieldset:has(> .choice) { display: grid; gap: .5rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr)); }
    fieldset:has(> .choice) legend { grid-column: 1 / -1; }
    fieldset label.choice { display: grid; grid-template-columns: auto 1fr; align-items: start; gap: .6rem; min-height: 44px; margin: 0; padding: .6rem .75rem; border: 1px solid var(--line); border-radius: calc(var(--radius) * .8); background: var(--field); cursor: pointer; }
    label.choice input { margin: .2rem 0 0; width: 1.1rem; height: 1.1rem; accent-color: var(--accent); }
    label.choice > span { display: grid; gap: .1rem; }
    label.choice strong { color: var(--fg); font-weight: 600; }
    label.choice span span { color: var(--muted); font-size: .86rem; line-height: 1.35; }
    label.choice:has(input:checked) { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
    label.choice:has(input:focus-visible) { outline: 2px solid var(--accent); outline-offset: 2px; }
    label.choice.compact span span { display: none; }
    button.secondary { border-color: var(--line); color: var(--fg); }
    button[aria-busy="true"] { opacity: .7; cursor: progress; }
    .preview { padding: 1rem; border: 1px dashed var(--line); border-radius: var(--radius); }
    .preview iframe { display: block; }
    .problems { margin: .5rem 0 0; padding-left: 1.2rem; color: var(--warn); }
    .card-from { color: var(--muted); margin: -.4rem 0 1rem; }
    .tabs { margin: 1.2rem 0; }
    .tablist { display: none; }
    .tabs-ready .tablist { display: flex; flex-wrap: wrap; gap: .25rem; border-bottom: 1px solid var(--line); }
    .tablist [role="tab"] { margin: 0 0 -1px; min-height: 44px; padding: .5rem 1rem; border: 1px solid transparent; border-bottom: 0; border-radius: calc(var(--radius) * .7) calc(var(--radius) * .7) 0 0; background: transparent; color: var(--muted); }
    .tablist [role="tab"]:hover { color: var(--fg); }
    .tablist [role="tab"][aria-selected="true"] { border-color: var(--line); background: var(--bg); color: var(--fg); font-weight: 600; box-shadow: inset 0 2px 0 var(--accent); }
    .tabpanel { padding: .9rem 0 0; }
    .tabpanel + .tabpanel { margin-top: 1.4rem; }
    .tabs-ready .tabpanel + .tabpanel { margin-top: 0; }
    .tabpanel:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; }
    .tabpanel .note { margin: 0 0 .6rem; }
    label.check { display: flex; align-items: center; gap: .55rem; min-height: 44px; margin: 0; color: var(--fg); font-size: .95rem; cursor: pointer; }
    label.check input { width: 1.1rem; height: 1.1rem; accent-color: var(--accent); }
    details { margin: .8rem 0; }
    summary { min-height: 44px; display: flex; align-items: center; cursor: pointer; color: var(--accent); }
    .fields { display: grid; grid-template-columns: minmax(7rem, max-content) 1fr; gap: .5rem 1rem; margin: .6rem 0 0; }
    .fields dt { margin: 0; }
    .fields dd { margin: 0; color: var(--muted); }
    @media (max-width: 40rem) { .fields { grid-template-columns: 1fr; } .fields dd { margin-bottom: .4rem; } }
    .lede { font-size: 1.12rem; line-height: 1.45; margin: 0 0 1rem; }
    .visit { margin: .15rem 0 .8rem; }
    .visit a { display: inline-flex; align-items: center; min-height: 44px; }
    .steps { list-style: none; counter-reset: step; padding: 0; margin: 1.4rem 0 .8rem; display: grid; gap: .7rem; }
    .steps li { counter-increment: step; display: grid; grid-template-columns: 2rem 1fr; gap: .2rem .6rem; margin: 0; }
    .steps li::before { content: counter(step); grid-row: span 2; display: grid; place-items: center; width: 2rem; height: 2rem; border: 1px solid var(--line); border-radius: 50%; color: var(--accent); font-variant-numeric: tabular-nums; }
    .steps strong { display: block; }
    .doors { list-style: none; padding: 0; margin: .8rem 0 0; display: grid; gap: .5rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr)); }
    .doors li { margin: 0; }
    .door { display: flex; flex-direction: column; justify-content: center; gap: .1rem; min-height: 44px; height: 100%; padding: .6rem .9rem; border: 1px solid var(--line); border-radius: .9rem; text-decoration: none; color: var(--fg); background: var(--field); }
    .door strong { color: var(--accent); font-weight: 600; }
    .door span { color: var(--muted); font-size: .9rem; }
    .door:hover { border-color: var(--accent); }
    .door[aria-current="page"] { border-color: var(--accent); background: rgba(94,234,212,.08); }
    .actions .door { flex: 1 1 9rem; margin-top: .6rem; }
    .card { position: relative; margin: 1.2rem 0; padding: 1.4rem 1.4rem 1.1rem; border: 1px solid var(--accent); border-radius: calc(var(--radius) * 1.2); background: linear-gradient(160deg, var(--surface), var(--field) 60%); overflow: hidden; }
    .card.sample { transform: rotate(-1deg); }
    @media (prefers-reduced-motion: reduce) { .card.sample { transform: none; } }
    .card header { display: grid; gap: .45rem; padding-right: 7rem; }
    .card footer { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: .4rem 1rem; }
    .card-kind { color: var(--accent); text-transform: uppercase; letter-spacing: .12em; font-size: .78rem; }
    .card-site { font-size: clamp(1.3rem, 4.5vw, 1.8rem); font-weight: 650; letter-spacing: -.03em; overflow-wrap: anywhere; }
    .card-prompt { color: var(--muted); font-style: italic; margin: .5rem 0 0; }
    .card-note { margin: 1rem 0 1.1rem; padding: 0 0 0 1rem; border-left: 2px solid var(--accent); font-size: 1.12rem; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; }
    .card footer { padding-top: .8rem; border-top: 1px solid var(--line); color: var(--muted); font: .82rem/1.3 ui-monospace, SFMono-Regular, monospace; }
    .card-address { color: var(--fg); }
    .card-stamp:empty { display: none; }
    .card-stamp { position: absolute; top: 1rem; right: 1rem; margin: 0; padding: .2rem .6rem; border: 2px solid var(--warn); border-radius: .4rem; color: var(--warn); font: 700 .78rem/1.3 ui-monospace, SFMono-Regular, monospace; letter-spacing: .08em; text-transform: uppercase; transform: rotate(-7deg); opacity: 0; }
    .card[data-sent="true"] .card-stamp { opacity: 1; }
    .door strong { overflow-wrap: anywhere; }
    @media (prefers-reduced-motion: no-preference) { .card-stamp { transition: opacity .25s ease-out; } }
    .share { align-items: stretch; }
    .share .door, .actions .door { height: auto; }
    button.door { flex: 1 1 9rem; align-items: flex-start; margin-top: .6rem; font: inherit; text-align: left; cursor: pointer; }
    footer { margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid var(--line); }
    @media (max-width: 40rem) {
      h1 { font-size: 1.55rem; }
      .weather { font-size: 2.2rem; }
      .codeblock pre { font-size: .78rem; }
      fieldset { padding: .6rem .7rem .7rem; }
    }
    @media (min-width: 60rem) {
      main { padding-top: 2.4rem; }
    }
`;

export function layout({ title, description, canonical, climate, body, quiet = false, embed = false, script = "", themeCss = "" }) {
  const weather = climate?.weather || "clear";
  const spwClimate = climate?.atmosphere?.climate || "garden";
  return `<!DOCTYPE html>
<html lang="en" data-spw-climate="${escapeHtml(spwClimate)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="noindex, nofollow">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <style>${SHELL}</style>${themeCss ? `\n  <style>${themeCss}</style>` : ""}
</head>
<body class="${embed ? "embed" : ""}" data-spw-climate="${escapeHtml(spwClimate)}" data-weather="${escapeHtml(weather)}">
  ${embed ? "" : `<a class="skip" href="#main">Skip to content</a>`}
  <main id="main" tabindex="-1">${body}
    <footer>
      <p>${quiet ? "autonomous.feedback" : `Made by Spwashi. <a href="https://spwashi.com/">spwashi.com</a>`}</p>
    </footer>
  </main>
  <p id="status" class="sr-only" role="status" aria-live="polite"></p>
  <script>
    document.documentElement.classList.add("js");
    const announce = (message) => {
      const status = document.getElementById("status");
      if (!status) return;
      status.textContent = "";
      setTimeout(() => { status.textContent = message; }, 50);
    };
    document.querySelectorAll("[data-copy]").forEach((button) => {
      button.addEventListener("click", async () => {
        const node = document.getElementById(button.getAttribute("data-copy"));
        const text = node ? node.innerText : "";
        const idle = button.innerHTML;
        try {
          await navigator.clipboard.writeText(text.trim());
          button.textContent = "Copied";
          announce("Copied to the clipboard.");
        } catch {
          button.textContent = "Copy failed";
          announce("Could not copy. Select the text and copy it yourself.");
        }
        setTimeout(() => { button.innerHTML = idle; }, 1600);
      });
    });
  </script>${script ? `\n  <script>${script}</script>` : ""}
</body>
</html>`;
}
