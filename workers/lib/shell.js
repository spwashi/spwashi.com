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
    :root { color-scheme: dark; --bg:#0a1012; --fg:#e8eef1; --muted:#8aa0a8; --line:rgba(94,234,212,.2); --accent:#5eead4; --warn:#e7c27a; --storm:#ff8a7a; }
    * { box-sizing: border-box; }
    html { -webkit-text-size-adjust: 100%; }
    body {
      margin: 0; background: var(--bg); color: var(--fg);
      font: 1rem/1.5 ui-sans-serif, system-ui, sans-serif;
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
    article { border: 1px solid var(--line); border-radius: 1.1rem; padding: 1.1rem 1.15rem; background: #10181b; margin: 1.2rem 0; }
    code { font-family: ui-monospace, SFMono-Regular, monospace; font-size: .86em; overflow-wrap: anywhere; }
    label { display: block; color: var(--muted); font-size: .88rem; margin: 0 0 .35rem; }
    textarea.prompt, textarea.note, select, input:not(.hp):not([type="radio"]):not([type="checkbox"]) {
      width: 100%;
      max-width: 100%;
      min-height: 44px;
      padding: .75rem .8rem;
      border: 1px solid var(--line);
      border-radius: .8rem;
      background: #0d1416;
      color: var(--fg);
      font: 1rem/1.45 ui-sans-serif, system-ui, sans-serif;
    }
    fieldset { border: 1px solid var(--line); border-radius: 1rem; margin: 0 0 1rem; padding: .8rem 1rem 1rem; }
    fieldset legend { color: var(--muted); padding: 0 .3rem; }
    fieldset label { display: flex; align-items: center; gap: .6rem; min-height: 44px; margin: 0; color: var(--fg); }
    .codeblock { margin: 1rem 0 1.2rem; border: 1px solid var(--line); border-radius: .9rem; background: #0d1416; overflow: hidden; }
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
      border-radius: 999px; border: 1px solid var(--accent); background: transparent; color: var(--accent);
      font: inherit; cursor: pointer;
    }
    .command { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem; margin: 0; }
    .command code { font-size: 1rem; padding: .65rem .8rem; border: 1px solid var(--line); border-radius: .8rem; background: #0d1416; }
    button.quiet { margin-top: 0; }
    ol { padding-left: 1.2rem; }
    ol li { margin: .35rem 0; }
    button:focus-visible, a:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
    .lede { font-size: 1.12rem; line-height: 1.45; margin: 0 0 1rem; }
    .steps { list-style: none; counter-reset: step; padding: 0; margin: 1.4rem 0 .8rem; display: grid; gap: .7rem; }
    .steps li { counter-increment: step; display: grid; grid-template-columns: 2rem 1fr; gap: .2rem .6rem; margin: 0; }
    .steps li::before { content: counter(step); grid-row: span 2; display: grid; place-items: center; width: 2rem; height: 2rem; border: 1px solid var(--line); border-radius: 50%; color: var(--accent); font-variant-numeric: tabular-nums; }
    .steps strong { display: block; }
    .doors { list-style: none; padding: 0; margin: .8rem 0 0; display: grid; gap: .5rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr)); }
    .doors li { margin: 0; }
    .door { display: flex; flex-direction: column; justify-content: center; gap: .1rem; min-height: 44px; height: 100%; padding: .6rem .9rem; border: 1px solid var(--line); border-radius: .9rem; text-decoration: none; color: var(--fg); background: #0d1416; }
    .door strong { color: var(--accent); font-weight: 600; }
    .door span { color: var(--muted); font-size: .9rem; }
    .door:hover { border-color: var(--accent); }
    .door[aria-current="page"] { border-color: var(--accent); background: rgba(94,234,212,.08); }
    .actions .door { flex: 1 1 9rem; margin-top: .6rem; }
    .card { position: relative; margin: 1.2rem 0; padding: 1.4rem 1.4rem 1.1rem; border: 1px solid var(--accent); border-radius: 1.2rem; background: linear-gradient(160deg, #12201f, #0d1416 60%); box-shadow: 0 0 0 6px rgba(94,234,212,.05); overflow: hidden; }
    .card header { display: grid; gap: .45rem; padding-right: 7rem; }
    .card footer { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: .4rem 1rem; }
    .card-kind { color: var(--accent); text-transform: uppercase; letter-spacing: .12em; font-size: .78rem; }
    .card-site { font-size: clamp(1.3rem, 4.5vw, 1.8rem); font-weight: 650; letter-spacing: -.03em; overflow-wrap: anywhere; }
    .card-prompt { color: var(--muted); font-style: italic; margin: .5rem 0 0; }
    .card-note { margin: 1rem 0 1.1rem; padding: 0 0 0 1rem; border-left: 2px solid var(--accent); font-size: 1.12rem; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; }
    .card footer { padding-top: .8rem; border-top: 1px solid var(--line); color: var(--muted); font: .82rem/1.3 ui-monospace, SFMono-Regular, monospace; }
    .card-address { color: var(--fg); }
    .card-stamp { position: absolute; top: 1rem; right: 1rem; margin: 0; padding: .2rem .6rem; border: 2px solid var(--warn); border-radius: .4rem; color: var(--warn); font: 700 .78rem/1.3 ui-monospace, SFMono-Regular, monospace; letter-spacing: .08em; text-transform: uppercase; transform: rotate(-7deg); opacity: 0; }
    .card[data-sent="true"] .card-stamp { opacity: 1; }
    @media (prefers-reduced-motion: no-preference) { .card-stamp { transition: opacity .25s ease-out; } }
    .share { align-items: stretch; }
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

export function layout({ title, description, canonical, climate, body, quiet = false, embed = false }) {
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
  <style>${SHELL}</style>
</head>
<body class="${embed ? "embed" : ""}" data-spw-climate="${escapeHtml(spwClimate)}" data-weather="${escapeHtml(weather)}">
  <main>${body}
    <footer>
      <p>${quiet ? "autonomous.feedback" : `Made by Spwashi. <a href="https://spwashi.com/">spwashi.com</a>`}</p>
    </footer>
  </main>
  <script>
    const setsNode = document.getElementById("quest-sets");
    const instruction = document.getElementById("instruction");
    const includeGit = document.getElementById("include-git");
    const gitCopy = document.getElementById("git-copy");
    if (setsNode && instruction) {
      const sets = JSON.parse(setsNode.textContent);
      const paint = () => {
        const chosen = document.querySelector('input[name="runner"]:checked');
        const set = sets.find((item) => item.id === chosen?.value) || sets[0];
        const label = document.getElementById("instruction-label");
        if (label) label.textContent = set.label;
        let text = set.text;
        if (includeGit?.checked && gitCopy) text += "\\n\\n" + gitCopy.innerText.trim();
        instruction.textContent = text;
      };
      document.querySelectorAll('input[name="runner"]').forEach((input) => input.addEventListener("change", paint));
      includeGit?.addEventListener("change", paint);
      paint();
    }
    const siteField = document.getElementById("host");
    if (siteField && (document.getElementById("form-snippet") || document.getElementById("frame-snippet"))) {
      siteField.addEventListener("input", () => {
        const name = siteField.value.trim().toLowerCase() || "example.com";
        const form = document.getElementById("form-snippet");
        const frame = document.getElementById("frame-snippet");
        if (form) form.textContent = '<form method="post" action="https://autonomous.feedback/' + name + '/review">\\n  <textarea name="note" minlength="8" maxlength="2000" required></textarea>\\n  <button>Send</button>\\n</form>';
        if (frame) frame.textContent = '<iframe title="Feedback" src="https://autonomous.feedback/embed/' + name + '" width="100%" height="520" style="border:0"></iframe>';
      });
    }
    const share = document.querySelector(".share");
    const card = document.getElementById("card");
    if (share && card) {
      const markSent = () => { card.dataset.sent = "true"; };
      const native = share.querySelector('[data-share="native"]');
      if (native && !navigator.share) native.hidden = true;
      native?.addEventListener("click", async () => {
        try {
          await navigator.share({ text: share.dataset.shareText, url: share.dataset.shareUrl });
          markSent();
        } catch {}
      });
      share.querySelectorAll('[data-share="post"], [data-copy]').forEach((node) => node.addEventListener("click", markSent));
    }
    document.querySelectorAll("[data-copy]").forEach((button) => {
      button.addEventListener("click", async () => {
        const node = document.getElementById(button.getAttribute("data-copy"));
        const text = node ? node.innerText : "";
        const idle = button.innerHTML;
        try {
          await navigator.clipboard.writeText(text.trim());
          button.textContent = "Copied";
        } catch {
          button.textContent = "Select the line";
        }
        setTimeout(() => { button.innerHTML = idle; }, 1600);
      });
    });
  </script>
</body>
</html>`;
}
