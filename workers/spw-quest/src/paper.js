// spwashi.com's paper material, inlined so the worker stays self-contained.
// Values come from public/css/tokens/core.css: linen --bg and --bg-field, --surface-matte,
// --ink and --ink-mid, --line, the shell chrome accent (teal 68% with ink 32%, in oklab),
// --op-binding-color for "not yet", and the dark substrate the site's adaptive mode uses
// when the reader's system asks for dark. Each spw.quest page passes PAPER_CSS through
// layout({ themeCss }); workers/lib/shell.js keeps its own defaults for the other workers.

/** The light material as hex, for /.well-known/autonomous-feedback.json (its validator takes hex). */
export const PAPER_THEME = Object.freeze({ background: "#eee9dd", text: "#202324", accent: "#1b5c5d" });

export const PAPER_CSS = `:root { color-scheme: light;
      --bg: hsl(42 32% 90%); --bg-field: hsl(44 34% 95%);
      --surface: rgb(250 248 243); --field: rgb(255 253 248);
      --fg: rgba(14, 18, 20, .92); --muted: rgba(14, 18, 20, .68);
      --line: rgba(14, 18, 20, .14); --edge: rgba(14, 18, 20, .5);
      --accent: ${PAPER_THEME.accent}; --accent-soft: rgba(27, 92, 93, .09);
      --warn: hsl(24 48% 34%); --storm: hsl(342 48% 46%);
      --shadow: 0 1px 3px rgba(0, 0, 0, .04), 0 6px 18px -3px rgba(0, 0, 0, .07);
      --radius: .6rem; --pill: 999px;
      --font: Inter, "Segoe UI", system-ui, sans-serif;
      --manuscript: Charter, "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
      --mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    @media (prefers-color-scheme: dark) {
      :root { color-scheme: dark;
        --bg: hsl(218 20% 8.5%); --bg-field: hsl(216 16% 12%);
        --surface: rgb(26 33 39); --field: hsl(220 24% 6%);
        --fg: rgba(228, 235, 232, .92); --muted: rgba(202, 214, 210, .72);
        --line: rgba(228, 235, 232, .14); --edge: rgba(228, 235, 232, .42);
        --accent: hsl(180 58% 58%); --accent-soft: rgba(86, 210, 210, .1);
        --warn: hsl(24 48% 66%); --storm: hsl(342 48% 68%);
        --shadow: 0 1px 3px rgba(0, 0, 0, .3), 0 6px 18px -3px rgba(0, 0, 0, .4); }
    }
    body { background: var(--bg) linear-gradient(180deg, var(--bg-field), var(--bg) 42rem) no-repeat; line-height: 1.6; }
    h1, h2 { font-family: var(--manuscript); font-weight: 600; letter-spacing: -.01em; text-wrap: balance; }
    h1 { font-size: clamp(1.9rem, 6.4vw, 2.7rem); line-height: 1.1; }
    h2 { font-size: 1.35rem; line-height: 1.2; margin: 0 0 .5rem; }
    a { color: var(--accent); text-decoration-thickness: 1px; text-underline-offset: .18em; }
    a:hover { text-decoration-thickness: 2px; }
    code, .codeblock pre, .codeblock figcaption { font-family: var(--mono); }
    .chip { color: var(--accent); background: var(--field); border-color: var(--edge); }
    .codeblock, article, .panel { background: var(--field); box-shadow: var(--shadow); }
    textarea.prompt, textarea.note, select, input:not(.hp):not([type="radio"]):not([type="checkbox"]) { border-color: var(--edge); background: var(--field); }
    .tablist [role="tab"][aria-selected="true"] { background: var(--surface); }
    .skip { background: var(--surface); }`;
