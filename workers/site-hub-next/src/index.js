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
    href: "https://spw.quest/",
    description: "Paced guide into Spw. Parser door; live specimens stay on spwashi.com.",
  },
  {
    domain: "autonomous.feedback",
    title: "autonomous.feedback",
    href: "https://autonomous.feedback/",
    description: "HTTP climate of public origins. Weather for lore and the Wednesday table.",
  },
  {
    domain: "factshift.center",
    title: "Factshift",
    href: "https://spwashi.com/about/domains/factshift.com/",
    description: "Observatory. Specimen is under factshift.com on the primary site.",
  },
];

/** Hosts this Worker currently serves. */
const LEGACY_HUB_HOSTS = [
  "attention.productions",
  "bane.land",
  "bone.land",
  "boon.land",
  "brainstorm.monster",
  "factshift.center",
  "mutex.buzz",
  "newyear.life",
  "rpgwednesday.shop",
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

/* Reuse. Each slice is a picture of a material; these give it words and
   files to leave this page with. REUSE_TERMS is a first draft for the creator
   to confirm before deploy. SLICE_GROUND is the color a page shows while the
   tile loads, or where it does not load. */
const REUSE_TERMS = "Free for personal and study use with credit to texture.website. Commercial use by commission.";
const SLICE_GROUND = { paper: "#c4a574", linen: "#b8ad98", harlequin: "#5b4a6b", wash: "#d8b886" };

const sliceFiles = (slice) => {
  const base = slice.image.replace(/\.webp$/, "");
  return { webp: `${base}.webp`, avif: `${base}.avif` };
};

const sliceCss = (slice) => {
  const file = sliceFiles(slice).webp.split("/").pop();
  return [
    `.texture-${slice.id} {`,
    `  background-color: ${SLICE_GROUND[slice.id]};`,
    `  background-image: url("${file}");`,
    `  background-size: cover;`,
    `  background-position: center;`,
    `}`,
  ].join("\n");
};

const sliceHtml = (slice) => `<div class="texture-${slice.id}">…</div>`;

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
  terms: REUSE_TERMS,
  slices: SLICES.map((slice) => ({
    id: slice.id,
    name: slice.name,
    token: slice.token,
    meaning: slice.meaning,
    use: { css: sliceCss(slice), html: sliceHtml(slice), files: sliceFiles(slice) },
  })),
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
      <p>These hosts resolve here.</p>
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
  <div class="swatch" data-spw-texture-slice="${escapeHtml(slice.id)}" data-spw-seed="texture-${escapeHtml(slice.id)}">
    <img src="${escapeHtml(slice.image)}" alt="${escapeHtml(slice.name)}" width="640" height="360">
  </div>
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

  const useCards = SLICES.map((slice) => {
    const files = sliceFiles(slice);
    return `<article class="specimen use">
  <h3>${escapeHtml(slice.name)}</h3>
  <pre><code id="css-${escapeHtml(slice.id)}">${escapeHtml(sliceCss(slice))}</code></pre>
  <p class="use-actions"><button type="button" class="copy" data-copy="css-${escapeHtml(slice.id)}" hidden>Copy CSS</button> <a href="${escapeHtml(files.webp)}">WebP tile</a> · <a href="${escapeHtml(files.avif)}">AVIF tile</a></p>
  <p class="kicker">Then <code class="inline">${escapeHtml(sliceHtml(slice))}</code></p>
</article>`;
  }).join("");

  const labOptions = (name, options) => options.map(([value, label], index) =>
    `<label><input type="radio" name="${name}" value="${value}"${index === 0 ? " checked" : ""}> ${escapeHtml(label)}</label>`
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
    // Copy buttons appear only where they work; the rule stays selectable text.
    for (const button of document.querySelectorAll('button.copy[data-copy]')) {
      button.hidden = false;
      button.addEventListener('click', async () => {
        const code = document.getElementById(button.dataset.copy);
        try {
          await navigator.clipboard.writeText(code.textContent);
          button.textContent = 'Copied';
        } catch {
          const range = document.createRange();
          range.selectNodeContents(code);
          getSelection().removeAllRanges();
          getSelection().addRange(range);
          button.textContent = 'Selected';
        }
        setTimeout(() => { button.textContent = 'Copy CSS'; }, 1600);
      });
    }
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
    .swatch img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    /* The slice stylesheet paints a faint striped grain for reading pages.
       These tiles are the pictures themselves. */
    .swatch[data-spw-texture-slice] > .spw-texture-slice,
    .swatch[data-spw-texture-slice]::after {
      display: none;
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
    pre { margin: .6rem 0; padding: .7rem .8rem; border-radius: .7rem; background: rgba(0,0,0,.28); overflow-x: auto; }
    pre code { display: block; white-space: pre; }
    code.inline { display: inline; }
    .use-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; margin: .4rem 0; }
    button.copy { min-height: 2.5rem; padding: 0 .9rem; border: 1px solid var(--line); border-radius: 999px; background: rgba(200,255,0,.08); color: var(--fg); font: inherit; cursor: pointer; }
    button.copy:hover, button.copy:focus-visible { border-color: var(--accent); }
    .lab-controls { display: flex; flex-wrap: wrap; gap: .7rem 1rem; }
    .lab fieldset { margin: 0; padding: .45rem .75rem .55rem; border: 1px solid var(--line); border-radius: .8rem; }
    .lab legend { padding: 0 .3rem; color: var(--muted); font-size: .85rem; }
    .lab label { display: inline-flex; align-items: center; gap: .35rem; min-height: 2.5rem; margin-inline-end: .75rem; cursor: pointer; }
    .lab input { accent-color: var(--accent); }
    .lab-surface { position: relative; isolation: isolate; min-height: 12rem; margin-top: 1rem; padding: 1.4rem 1.6rem; border: 1px solid var(--line); border-radius: 1rem; background: #1d1812; color: var(--fg); font: 1.35rem/1.45 Georgia, "Iowan Old Style", serif; outline: none; }
    .lab-surface:focus-visible { box-shadow: 0 0 0 2px var(--aqua); }
    .lab-surface p { margin: 0; color: inherit; }
    .lab-surface::before { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; background-image: var(--lab-texture); background-position: center; background-repeat: no-repeat; background-size: var(--lab-scale); opacity: var(--lab-strength); }
    /* The tiles are photographs of materials, not seamless repeats: scale zooms the one picture instead of tiling it. */
    .lab { --lab-texture: var(--spw-texture-paper); --lab-strength: .5; --lab-scale: cover; }
    .lab:has([value="linen"]:checked) { --lab-texture: var(--spw-texture-linen); }
    .lab:has([value="harlequin"]:checked) { --lab-texture: var(--spw-texture-harlequin); }
    .lab:has([value="wash"]:checked) { --lab-texture: var(--spw-texture-wash); }
    .lab:has([value="whisper"]:checked) { --lab-strength: .22; }
    .lab:has([value="bold"]:checked) { --lab-strength: .85; }
    .lab:has([value="close"]:checked) { --lab-scale: 180%; }
    .lab:has([value="closer"]:checked) { --lab-scale: 320%; }
    .lab:has([value="light"]:checked) .lab-surface { background: #efe6d8; color: #1b1510; }
  </style>
</head>
<body>
  <main>
    <header>
      <p class="kicker">texture.website</p>
      <h1>Texture is grain you can reuse.</h1>
      <p class="lede">Materials and patterns as page feeling. The proving ground is <a href="https://spwashi.com/">spwashi.com</a>; this host is the grain lab.</p>
      <p class="kicker"><a href="#try-title">Try one</a> · <a href="#use-title">take one with you</a> · <a href="#commission-title">commission your own</a></p>
    </header>
    <section aria-labelledby="slices-title">
      <h2 id="slices-title">Slices already on the site</h2>
      <p>These four tiles are the live <code>data-spw-texture-slice</code> families. The token is on each card.</p>
      <div class="grid">${sliceCards}</div>
    </section>
    <section class="lab" aria-labelledby="try-title">
      <h2 id="try-title">Try one under your words</h2>
      <div class="lab-controls">
        <fieldset><legend>Texture</legend>${labOptions("lab-texture", SLICES.map((slice) => [slice.id, slice.name]))}</fieldset>
        <fieldset><legend>Strength</legend>${labOptions("lab-strength", [["present", "Present"], ["whisper", "Whisper"], ["bold", "Bold"]])}</fieldset>
        <fieldset><legend>Scale</legend>${labOptions("lab-scale", [["whole", "Whole"], ["close", "Close"], ["closer", "Closer"]])}</fieldset>
        <fieldset><legend>Ink</legend>${labOptions("lab-ink", [["dark", "Dark"], ["light", "Light"]])}</fieldset>
      </div>
      <div class="lab-surface" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Your words over the texture" spellcheck="false"><p>Write a sentence here. The grain should carry it, not sit on top of it.</p></div>
    </section>
    <section aria-labelledby="use-title">
      <h2 id="use-title">Take one with you</h2>
      <p>Save the tile beside your stylesheet and paste the rule. ${escapeHtml(REUSE_TERMS)}</p>
      <div class="grid">${useCards}</div>
    </section>
    <section aria-labelledby="commission-title">
      <h2 id="commission-title">Commission a grain</h2>
      <p>Bring a material you want a page to feel like: a notebook page, a cloth, a wall, a tabletop. It comes back as a texture family you can reuse: the tile, the rule, and a named entry in <a href="/textures.json">textures.json</a>.</p>
      <p><a href="https://spwashi.com/services/">Rates on the services ladder</a> · <a href="https://spwashi.com/contact/">Start with a note</a></p>
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
