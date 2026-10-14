// spwashi.com's paper material on spw.quest. The tokens, the faces and the
// sigil colors come from workers/lib/peer-kit.js, which scripts/build-peer-kit.mjs
// generates from the site's own CSS, so this file holds only how spw.quest
// sets its elements. The faces are served from spw.quest's own origin
// (/fonts/, workers/lib/peer-assets.js); nothing loads from spwashi.com.
import { PEER_BRACES, PEER_SIGILS, peerFontFaces, peerFontPreloads, peerTokens } from "../../lib/peer-kit.js";
import { PEER_FONT_BASE } from "../../lib/peer-assets.js";

/** The light material as hex, for /.well-known/autonomous-feedback.json (its validator takes hex). */
export const PAPER_THEME = Object.freeze({ background: "#eee9dd", text: "#202324", accent: "#1b5c5d" });

/** Preload the two faces every page sets above the fold. */
export const PAPER_HEAD = peerFontPreloads(PEER_FONT_BASE);

/** Every token type the paint uses, each in the site's color for it. */
const TYPE_COLORS = [...new Map([...PEER_SIGILS, ...PEER_BRACES.map(({ type, color }) => ({ type: `b-${type}`, color }))]
  .map(({ type, color }) => [type, color])).entries()]
  .map(([type, color]) => `[data-t="${type}"] { color: var(${color}); }`).join("\n    ");

export const PAPER_CSS = `${peerFontFaces(PEER_FONT_BASE)}
    ${peerTokens()}
    :root { --shadow: 0 1px 2px rgba(0, 0, 0, .04), 0 8px 24px -12px rgba(0, 0, 0, .12); --radius: .5rem; --pill: 999px; --storm: hsl(342 48% 46%); }
    @media (prefers-color-scheme: dark) { :root { --shadow: 0 1px 2px rgba(0, 0, 0, .3), 0 10px 28px -12px rgba(0, 0, 0, .5); --storm: hsl(342 48% 68%); } }
    body { background: var(--bg) linear-gradient(180deg, var(--bg-field), var(--bg) 46rem) no-repeat; color: var(--fg); font-family: var(--font); line-height: 1.6; }
    h1, h2, h3 { font-family: var(--manuscript); font-weight: 600; letter-spacing: -.012em; text-wrap: balance; }
    h1 { font-size: clamp(2rem, 6.4vw, 3rem); line-height: 1.06; }
    h2 { font-size: clamp(1.35rem, 3.4vw, 1.7rem); line-height: 1.15; margin: 0 0 .5rem; }
    h3 { font-size: 1.12rem; line-height: 1.25; margin: 0 0 .3rem; }
    p, li, dd { text-wrap: pretty; }
    a { color: var(--accent); text-decoration-thickness: 1px; text-underline-offset: .18em; }
    a:hover { text-decoration-thickness: 2px; }
    code, kbd, pre, .codeblock pre, .codeblock figcaption { font-family: var(--mono); }
    .chip { color: var(--accent); background: var(--field); border-color: var(--edge); }
    .codeblock, article, .panel { background: var(--field); box-shadow: var(--shadow); }
    textarea.prompt, textarea.note, select, input:not(.hp):not([type="radio"]):not([type="checkbox"]) { border-color: var(--edge); background: var(--field); }
    .tablist [role="tab"][aria-selected="true"] { background: var(--surface); }
    .skip { background: var(--surface); }
    ${TYPE_COLORS}
    [data-t="s"] { color: var(--ink-mid); }
    [data-t="a"], [data-t="stream"] { color: var(--op-stream-color); }
    [data-t="c"] { color: var(--ink-faint); font-style: italic; }`;
