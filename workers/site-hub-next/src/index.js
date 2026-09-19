/**
 * site-hub-next — constellation map, plus a texture lab on texture.website.
 *
 * Does not serve spwashi.com. Live origin stays GitHub Pages.
 * Do not attach this script to spwashi.com/*.
 */

const LIVE = [
  {
    domain: "spwashi.com",
    title: "Spwashi",
    role: "primary",
    origin: "github-pages",
    href: "https://spwashi.com/",
    description: "Creator site. Software and art.",
  },
  {
    domain: "resume.spwashi.com",
    title: "SVG resume",
    role: "resume",
    origin: "github-pages",
    href: "https://resume.spwashi.com/resume.svg",
    description: "Hand-authored SVG resume.",
  },
  {
    domain: "lore.land",
    title: "lore.land",
    role: "living-atlas",
    origin: "github-pages",
    href: "https://lore.land/",
    description: "Long-form storytelling and ebook surface.",
  },
];

const DOCUMENTED = [
  {
    domain: "rpgwednesday.shop",
    title: "RPG Wednesday",
    href: "https://spwashi.com/play/rpg-wednesday/",
    description: "Play table. Public route lives on spwashi.com.",
  },
  {
    domain: "texture.website",
    title: "Texture",
    href: "https://texture.website/",
    description: "Grain lab. Materials and patterns as page feeling.",
  },
  {
    domain: "tealstripesvibes.com",
    title: "Teal Stripes Vibes",
    href: "https://spwashi.com/about/domains/tealstripesvibes.com/",
    description: "Taste and visual identity. Specimen on the primary site.",
  },
  {
    domain: "boon.land",
    title: "boon.land",
    href: "https://spwashi.com/about/domains/boon.land/",
    description: "Positive field in the land cluster.",
  },
  {
    domain: "bane.land",
    title: "bane.land",
    href: "https://spwashi.com/about/domains/bane.land/",
    description: "Counter-field in the land cluster.",
  },
  {
    domain: "bone.land",
    title: "bone.land",
    href: "https://spwashi.com/about/domains/bone.land/",
    description: "Structure in the land cluster.",
  },
  {
    domain: "spw.quest",
    title: "spw.quest",
    href: "https://spwashi.com/about/domains/spw.quest/",
    description: "Quest / parser door.",
  },
  {
    domain: "factshift.center",
    title: "Factshift",
    href: "https://spwashi.com/about/domains/factshift.com/",
    description: "Observatory. Specimen is under factshift.com on the primary site.",
  },
];

/** Hosts still in this Cloudflare account, now routed to this Worker. */
const LEGACY_HUB_HOSTS = [
  "attention.productions",
  "autonomous.feedback",
  "bane.land",
  "bone.land",
  "boon.land",
  "brainstorm.monster",
  "factshift.center",
  "mutex.buzz",
  "newyear.life",
  "rpgwednesday.shop",
  "spw.quest",
  "spw.rest",
  "spwashi.biz",
  "spwashi.click",
  "spwashi.ink",
  "tealstripesvibes.com",
  "texture.website",
  "trope.wiki",
];

const SLICES = [
  {
    id: "paper",
    name: "Paper fiber",
    token: 'data-spw-texture-slice="paper"',
    meaning: "Warm cellulose grain. Reading surfaces that want to stay put.",
    image: "https://spwashi.com/public/images/assets/motifs/texture-paper-fiber-display.webp",
  },
  {
    id: "linen",
    name: "Linen weave",
    token: 'data-spw-texture-slice="linen"',
    meaning: "Crossed threads. Cloth memory under illustration.",
    image: "https://spwashi.com/public/images/assets/motifs/texture-linen-weave-display.webp",
  },
  {
    id: "harlequin",
    name: "Harlequin diamonds",
    token: 'data-spw-texture-slice="harlequin"',
    meaning: "Play lattice. Pattern that can carry a scene without becoming a costume.",
    image: "https://spwashi.com/public/images/assets/motifs/texture-harlequin-diamonds-display.webp",
  },
  {
    id: "wash",
    name: "Cream ochre wash",
    token: 'data-spw-texture-slice="wash"',
    meaning: "Thin pigment on paper. A field, not a fill.",
    image: "https://spwashi.com/public/images/assets/motifs/texture-cream-ochre-wash-display.webp",
  },
];

const SIGNALS = [
  {
    id: "stripes",
    name: "Stripes",
    meaning: "Repetition with personality",
    detail: "Parallel bands keep rhythm without collapsing into sameness.",
  },
  {
    id: "grain",
    name: "Grain",
    meaning: "Surface memory",
    detail: "Texture should feel carried by the surface, not placed on top of it.",
  },
  {
    id: "glow",
    name: "Glow",
    meaning: "Attention under pressure",
    detail: "Accents should feel like energy coming through a material.",
  },
  {
    id: "response",
    name: "Response",
    meaning: "State through contact",
    detail: "Hover, focus, and hold should change the reading, not only the decoration.",
  },
];

const MATERIALS = [
  {
    id: "paper",
    name: "Paper",
    detail: "Opaque and warm. Stable documents that want full reading focus.",
  },
  {
    id: "glass",
    name: "Glass",
    detail: "Translucent. Floating panels that stay aware of what sits underneath.",
  },
  {
    id: "matte",
    name: "Matte",
    detail: "Flat and receding. Background structure that does not steal attention.",
  },
  {
    id: "field",
    name: "Field",
    detail: "High-contrast staging. Interactive tests and alert states.",
  },
];

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const constellationJson = {
  worker: "site-hub-next",
  primary: "https://spwashi.com/",
  serves_spwashi_com: false,
  live: LIVE,
  documented: DOCUMENTED,
  legacy_hub_hosts: LEGACY_HUB_HOSTS,
};

const textureJson = {
  site: "texture.website",
  concept: "grain",
  worker: "site-hub-next",
  attribute: "data-spw-texture-slice",
  slices: SLICES.map(({ id, name, token, meaning }) => ({ id, name, token, meaning })),
  signals: SIGNALS,
  metamaterials: MATERIALS,
  proving_ground: "https://spwashi.com/design/materials/",
};

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0d1117"/>
  <path d="M7 11h18M7 16h18M7 21h18" stroke="#5eead4" stroke-width="2" stroke-linecap="round"/>
  <circle cx="23" cy="11" r="2" fill="#c8ff00"/>
</svg>`;

const TEXTURE_FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <pattern id="g" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="4" fill="#1a1510"/>
      <circle cx="1" cy="1" r="0.7" fill="#c4a574" opacity=".55"/>
      <circle cx="3" cy="2.5" r="0.5" fill="#7dd3fc" opacity=".35"/>
    </pattern>
  </defs>
  <rect width="32" height="32" rx="6" fill="url(#g)"/>
  <path d="M6 22h20" stroke="#c8ff00" stroke-width="2" stroke-linecap="round"/>
</svg>`;

function renderConstellation(requestUrl) {
  const liveCards = LIVE.map(
    (entry) => `<article>
  <p><span>${escapeHtml(entry.role)}</span> · ${escapeHtml(entry.origin)}</p>
  <h3>${escapeHtml(entry.title)}</h3>
  <p><a href="${escapeHtml(entry.href)}">${escapeHtml(entry.domain)}</a></p>
  <p>${escapeHtml(entry.description)}</p>
</article>`
  ).join("");

  const documentedCards = DOCUMENTED.map(
    (entry) => `<article>
  <h3>${escapeHtml(entry.title)}</h3>
  <p><a href="${escapeHtml(entry.href)}">${escapeHtml(entry.domain)}</a></p>
  <p>${escapeHtml(entry.description)}</p>
</article>`
  ).join("");

  const legacyList = LEGACY_HUB_HOSTS.map(
    (host) => `<li><a href="https://${escapeHtml(host)}/">${escapeHtml(host)}</a></li>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Spwashi constellation hub</title>
  <meta name="description" content="Map of live Spwashi origins and reserved domains. spwashi.com is not served from this Worker.">
  <meta name="robots" content="noindex">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="canonical" href="${escapeHtml(requestUrl.origin + "/")}">
  <style>
    :root { color-scheme: dark; --bg:#0d1117; --fg:#ebf2f7; --muted:#98a7b5; --line:rgba(148,163,184,.2); --accent:#c8ff00; --aqua:#5eead4; }
    * { box-sizing: border-box; }
    body { margin: 0; font: 1rem/1.55 ui-sans-serif, system-ui, sans-serif; background: var(--bg); color: var(--fg); }
    main { width: min(44rem, calc(100% - 2rem)); margin: 0 auto; padding: 2rem 0 4rem; }
    h1, h2, h3 { line-height: 1.2; }
    h1 { font-size: 1.6rem; letter-spacing: -.02em; }
    p, li { color: #d5dee6; }
    a { color: var(--aqua); }
    .lede { max-width: 42ch; }
    .grid { display: grid; gap: 1rem; }
    article, .panel { border: 1px solid var(--line); border-radius: 1rem; padding: 1rem 1.1rem; background: #131a22; }
    article p:first-child { margin-top: 0; color: var(--muted); font-size: .85rem; }
    ul { columns: 2; gap: 1.5rem; padding-left: 1.1rem; }
    @media (max-width: 36rem) { ul { columns: 1; } }
    footer { margin-top: 2rem; color: var(--muted); font-size: .9rem; }
  </style>
</head>
<body>
  <main>
    <header>
      <p>site-hub-next</p>
      <h1>Spwashi constellation</h1>
      <p class="lede">Live origins first. This Worker is a map. It does not serve <a href="https://spwashi.com/">spwashi.com</a>.</p>
    </header>
    <section aria-labelledby="live-title">
      <h2 id="live-title">Live</h2>
      <div class="grid">${liveCards}</div>
    </section>
    <section aria-labelledby="documented-title">
      <h2 id="documented-title">Documented on the primary site</h2>
      <div class="grid">${documentedCards}</div>
    </section>
    <section class="panel" aria-labelledby="legacy-title">
      <h2 id="legacy-title">Also on this map</h2>
      <p>These zones are in this Cloudflare account and now resolve here.</p>
      <ul>${legacyList}</ul>
    </section>
    <footer>
      <p><a href="/registry.json">registry.json</a> · <a href="https://texture.website/">texture.website</a> · <a href="https://spwashi.com/about/">About</a></p>
    </footer>
  </main>
</body>
</html>`;
}

function renderTexture(requestUrl, nonce) {
  const sliceCards = SLICES.map(
    (slice) => `<article class="specimen">
  <div class="swatch" data-spw-texture-slice="${escapeHtml(slice.id)}" data-spw-seed="texture-${escapeHtml(slice.id)}" role="img" aria-label="${escapeHtml(slice.name)} swatch"></div>
  <h3>${escapeHtml(slice.name)}</h3>
  <p>${escapeHtml(slice.meaning)}</p>
  <p><code>${escapeHtml(slice.token)}</code></p>
</article>`
  ).join("");

  const signalCards = SIGNALS.map(
    (signal) => `<article class="specimen">
  <div class="swatch swatch-${escapeHtml(signal.id)}" role="img" aria-label="${escapeHtml(signal.name)} swatch"></div>
  <h3>${escapeHtml(signal.name)}</h3>
  <p class="kicker">${escapeHtml(signal.meaning)}</p>
  <p>${escapeHtml(signal.detail)}</p>
</article>`
  ).join("");

  const materialCards = MATERIALS.map(
    (material) => `<article class="material material-${escapeHtml(material.id)}">
  <h3>${escapeHtml(material.name)}</h3>
  <p>${escapeHtml(material.detail)}</p>
</article>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="en" data-spw-color-mode="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Texture — grain as a public surface</title>
  <meta name="description" content="Named textures you can reuse as page feeling: paper, linen, harlequin, wash, plus stripes, grain, glow, and response.">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="canonical" href="https://texture.website/">
  <meta property="og:title" content="Texture">
  <meta property="og:description" content="Materials and patterns you can reuse as page feeling.">
  <meta property="og:url" content="https://texture.website/">
  <link rel="stylesheet" href="https://spwashi.com/public/css/compose.css">
  <link rel="stylesheet" href="https://spwashi.com/public/css/effects/texture-slice.css">
  <script type="module" nonce="${escapeHtml(nonce)}">
    import { initTextureSlice } from 'https://spwashi.com/public/js/media/texture-slice.js';
    initTextureSlice();
  </script>
  <style>
    :root {
      color-scheme: dark;
      --bg:#120e0b;
      --fg:#f3ece3;
      --muted:#b7a894;
      --line:rgba(196,165,116,.28);
      --accent:#c8ff00;
      --aqua:#5eead4;
      --paper:#c4a574;
      --spw-texture-paper: image-set(
        url('https://spwashi.com/public/images/assets/motifs/texture-paper-fiber-display.avif') type('image/avif'),
        url('https://spwashi.com/public/images/assets/motifs/texture-paper-fiber-display.webp') type('image/webp')
      );
      --spw-texture-linen: image-set(
        url('https://spwashi.com/public/images/assets/motifs/texture-linen-weave-display.avif') type('image/avif'),
        url('https://spwashi.com/public/images/assets/motifs/texture-linen-weave-display.webp') type('image/webp')
      );
      --spw-texture-harlequin: image-set(
        url('https://spwashi.com/public/images/assets/motifs/texture-harlequin-diamonds-display.avif') type('image/avif'),
        url('https://spwashi.com/public/images/assets/motifs/texture-harlequin-diamonds-display.webp') type('image/webp')
      );
      --spw-texture-wash: image-set(
        url('https://spwashi.com/public/images/assets/motifs/texture-cream-ochre-wash-display.avif') type('image/avif'),
        url('https://spwashi.com/public/images/assets/motifs/texture-cream-ochre-wash-display.webp') type('image/webp')
      );
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font: 1rem/1.55 ui-sans-serif, system-ui, sans-serif;
      color: var(--fg);
      background:
        radial-gradient(circle at 12% 0%, rgba(196,165,116,.16), transparent 32%),
        var(--bg);
    }
    main { width: min(58rem, calc(100% - 2rem)); margin: 0 auto; padding: 2rem 0 4.5rem; }
    h1 { font-size: clamp(1.8rem, 4vw, 2.6rem); letter-spacing: -.03em; line-height: 1.05; margin: .2rem 0 .6rem; }
    h2 { font-size: 1.15rem; margin: 2.2rem 0 .8rem; }
    h3 { margin: .7rem 0 .35rem; font-size: 1rem; }
    p { color: #e4d9cc; }
    a { color: var(--aqua); }
    .lede { max-width: 44ch; font-size: 1.05rem; }
    .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); }
    .specimen, .material {
      border: 1px solid var(--line);
      border-radius: 1.1rem;
      padding: .85rem;
      background: rgba(26,21,16,.72);
    }
    .swatch {
      height: 9rem;
      border-radius: .8rem;
      border: 1px solid rgba(255,255,255,.08);
      background: #2a2218;
      overflow: clip;
    }
    .swatch-stripes {
      background: repeating-linear-gradient(135deg, #154a52 0 10px, #1e6a74 10px 20px);
    }
    .swatch-grain {
      background-color: #2a2218;
      background-image:
        radial-gradient(circle at 1px 1px, rgba(196,165,116,.45) 0.6px, transparent 1px),
        radial-gradient(circle at 2px 3px, rgba(0,0,0,.35) 0.5px, transparent 1px);
      background-size: 5px 5px, 7px 4px;
    }
    .swatch-glow {
      background:
        radial-gradient(circle at 70% 30%, rgba(200,255,0,.35), transparent 42%),
        radial-gradient(circle at 20% 80%, rgba(94,234,212,.22), transparent 36%),
        #161410;
    }
    .swatch-response {
      background: linear-gradient(180deg, #2c241b, #16120e);
      box-shadow: inset 0 0 0 1px rgba(200,255,0,.12);
      transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
    }
    .specimen:hover .swatch-response,
    .specimen:focus-within .swatch-response {
      transform: translateY(-3px);
      filter: saturate(1.15) brightness(1.08);
      box-shadow: 0 10px 24px rgba(0,0,0,.28), inset 0 0 0 1px rgba(200,255,0,.4);
    }
    @media (prefers-reduced-motion: reduce) {
      .swatch-response { transition: none; }
      .specimen:hover .swatch-response, .specimen:focus-within .swatch-response { transform: none; }
    }
    .kicker { color: var(--muted); font-size: .88rem; margin: 0; }
    code {
      display: block;
      font: .78rem/1.4 ui-monospace, SFMono-Regular, monospace;
      color: #d7eccf;
      overflow-wrap: anywhere;
    }
    .material-paper { background: #3a2f24; }
    .material-glass { background: rgba(90, 140, 160, .18); backdrop-filter: blur(8px); }
    .material-matte { background: #2a2a2a; }
    .material-field { background: #10261f; box-shadow: inset 0 0 0 2px #c8ff00; }
    footer { margin-top: 2.4rem; color: var(--muted); font-size: .92rem; }
  </style>
</head>
<body>
  <main>
    <header>
      <p class="kicker">texture.website</p>
      <h1>Texture is grain you can reuse.</h1>
      <p class="lede">Materials and patterns as page feeling. The proving ground is <a href="https://spwashi.com/">spwashi.com</a>; this host is the grain lab.</p>
    </header>
    <section aria-labelledby="slices-title">
      <h2 id="slices-title">Slices already on the site</h2>
      <p>These four tiles are the live <code>data-spw-texture-slice</code> families. The token is on each card.</p>
      <div class="grid">${sliceCards}</div>
    </section>
    <section aria-labelledby="signals-title">
      <h2 id="signals-title">How a texture behaves</h2>
      <div class="grid">${signalCards}</div>
    </section>
    <section aria-labelledby="materials-title">
      <h2 id="materials-title">Metamaterials</h2>
      <p>How a surface treats the canvas underneath it. Spec on <a href="https://spwashi.com/design/materials/">design/materials</a>.</p>
      <div class="grid">${materialCards}</div>
    </section>
    <footer>
      <p><a href="/textures.json">textures.json</a> · <a href="https://spwashi.com/design/folios/">folios</a> · <a href="https://spwashi.com/topics/craft/">craft</a></p>
    </footer>
  </main>
</body>
</html>`;
}

const BASE_SECURITY = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Resource-Policy": "same-origin",
};

const HTML_CSP =
  "default-src 'none'; img-src https://spwashi.com; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests";

const TEXTURE_CSP =
  "default-src 'none'; script-src https://spwashi.com; style-src https://spwashi.com 'unsafe-inline'; img-src https://spwashi.com; font-src https://spwashi.com; connect-src https://spwashi.com; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests";

function jsonResponse(body, cache) {
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      ...BASE_SECURITY,
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": cache,
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    },
  });
}

function htmlResponse(body, { cache, robots, csp = HTML_CSP }) {
  return new Response(body, {
    headers: {
      ...BASE_SECURITY,
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": cache,
      "Content-Security-Policy": csp,
      "X-Robots-Tag": robots,
    },
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const cache = url.hostname.endsWith(".workers.dev")
      ? "no-store"
      : "public, max-age=300";
    const isTexture = url.hostname === "texture.website";

    if (url.hostname.startsWith("www.")) {
      return Response.redirect(
        `https://${url.hostname.slice(4)}${url.pathname}${url.search}`,
        302
      );
    }

    if (url.pathname === "/favicon.svg") {
      return new Response(isTexture ? TEXTURE_FAVICON : FAVICON, {
        headers: {
          ...BASE_SECURITY,
          "Content-Type": "image/svg+xml; charset=UTF-8",
          "Cache-Control": "public, max-age=86400",
          "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
        },
      });
    }

    if (url.pathname === "/robots.txt") {
      const robots = isTexture
        ? "User-agent: *\nAllow: /\nSitemap: https://texture.website/textures.json\n"
        : "User-agent: *\nDisallow: /\n";
      return new Response(robots, {
        headers: {
          ...BASE_SECURITY,
          "Content-Type": "text/plain; charset=UTF-8",
          "Cache-Control": cache,
        },
      });
    }

    if (url.pathname === "/textures.json") {
      return jsonResponse(textureJson, cache);
    }

    if (url.pathname === "/registry.json") {
      return jsonResponse(isTexture ? textureJson : constellationJson, cache);
    }

    if (url.pathname === "/" || url.pathname === "") {
      if (isTexture) {
        const nonce = crypto.randomUUID();
        return htmlResponse(renderTexture(url, nonce), {
          cache,
          robots: "index, follow",
          csp: TEXTURE_CSP.replace(
            "script-src https://spwashi.com",
            `script-src https://spwashi.com 'nonce-${nonce}'`
          ),
        });
      }
      return htmlResponse(renderConstellation(url), { cache, robots: "noindex" });
    }

    return new Response("Not found", {
      status: 404,
      headers: {
        ...BASE_SECURITY,
        "Content-Type": "text/plain; charset=UTF-8",
        "Cache-Control": "no-store",
      },
    });
  },
};
