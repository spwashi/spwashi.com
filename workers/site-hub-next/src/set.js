// The names in the set, and the plain page every host here but texture.website is
// drawn on. A door, attention.productions and the set page all name their
// neighbors from PRODUCTS, so this module imports none of theirs.
import { escapeHtml } from "../../lib/http.js";

export const PRODUCTS = [
  {
    id: "work",
    host: "spwashi.com",
    title: "Spwashi",
    job: "Software and art. The place the other names prove themselves.",
    href: "https://spwashi.com/",
  },
  {
    id: "pictures",
    host: "attention.productions",
    title: "Attention Productions",
    job: "The pictures. A feature in 2027, and a season of daily promo from October 1 through New Year.",
    href: "https://attention.productions/",
  },
  {
    id: "grain",
    host: "texture.website",
    title: "Texture",
    job: "Grain you can try under your own words, take as one rule and one tile, or commission.",
    href: "https://texture.website/",
  },
  {
    id: "path",
    host: "spw.quest",
    title: "spw.quest",
    job: "A path into Spw. Copy one setup, for yourself or for an agent, and stop before any commit.",
    href: "https://spw.quest/",
  },
  {
    id: "note",
    host: "autonomous.feedback",
    title: "autonomous.feedback",
    job: "A note any website can take. A desk is kept only when the site asks for one.",
    href: "https://autonomous.feedback/",
  },
  {
    id: "story",
    host: "lore.land",
    title: "lore.land",
    job: "A show that is also a book.",
    href: "https://lore.land/",
  },
  {
    id: "frame",
    host: "factshift.center",
    title: "Factshift",
    job: "One concept on a neutral frame. A query on the URL is the physics.",
    href: "https://factshift.center/",
  },
  {
    id: "record",
    host: "wap.mom",
    title: "wap.mom",
    job: "A periodical of record about π and pie.",
    href: "https://wap.mom/",
  },
  {
    id: "resume",
    host: "resume.spwashi.com",
    title: "Resume",
    job: "A hand-authored SVG resume.",
    href: "https://resume.spwashi.com/resume.svg",
  },
];

const productById = (id) => PRODUCTS.find((item) => item.id === id);

const PAGE_STYLE = `
  :root { color-scheme: dark; --bg:#140e18; --fg:#f6f0ea; --muted:#c3b4c8; --line:rgba(231,215,242,.28); --accent:#c8ff00; --aqua:#9ad7ff; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 1rem/1.55 ui-sans-serif, system-ui, sans-serif; background: var(--bg); color: var(--fg); }
  main { width: min(40rem, calc(100% - 2rem)); margin: 0 auto; padding: 2.4rem 0 4rem; }
  h1 { font-size: clamp(1.8rem, 4vw, 2.5rem); letter-spacing: -.03em; line-height: 1.05; margin: .2rem 0 .7rem; }
  h2 { font-size: 1.05rem; margin: 1.8rem 0 .4rem; }
  p { color: #f3e9df; }
  a { color: var(--aqua); }
  .kicker { color: var(--muted); font-size: .88rem; margin: 0; }
  .lede { max-width: 38ch; font-size: 1.08rem; }
  .actions { display: flex; flex-wrap: wrap; gap: .6rem; margin: 1.2rem 0; }
  .actions a { display: inline-flex; align-items: center; min-height: 2.75rem; padding: 0 1rem; border: 1px solid var(--line); border-radius: 999px; text-decoration: none; }
  .actions a.primary { background: rgba(200,255,0,.12); border-color: var(--accent); color: var(--fg); }
  figure { margin: 1.4rem 0 0; }
  img { display: block; width: 100%; height: auto; border-radius: 1rem; border: 1px solid var(--line); }
  figcaption { color: var(--muted); font-size: .88rem; margin-top: .45rem; }
  .held iframe { display: block; width: 100%; aspect-ratio: 4 / 3; border: 1px solid var(--line); border-radius: 1rem; background: #0d0a10; }
  .grid { display: grid; gap: .8rem; }
  article { border: 1px solid var(--line); border-radius: 1rem; padding: .9rem 1rem; background: rgba(255,255,255,.03); }
  article h2 { margin: 0 0 .3rem; font-size: 1rem; }
  footer { margin-top: 2rem; color: var(--muted); font-size: .92rem; }
`;

export function neighborLine(ids) {
  return ids
    .map((id) => {
      const product = productById(id);
      return `<a href="${escapeHtml(product.href)}">${escapeHtml(product.title)}</a>`;
    })
    .join(" · ");
}

export function renderPage({ title, description, canonical, robots, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="${escapeHtml(robots)}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <style>${PAGE_STYLE}</style>
</head>
<body>
  <main>
    ${body}
  </main>
</body>
</html>`;
}
