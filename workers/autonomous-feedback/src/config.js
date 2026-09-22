/**
 * Client configuration: a site publishes
 *   https://{host}/.well-known/autonomous-feedback.json
 * to shape its own form and cards. The file only ever configures the host it
 * was fetched from. Anything missing, malformed, or unsafe falls back to the
 * defaults, and every fallback is reported so the owner can fix it.
 *
 * Within reason: labels, order, and bounds for the form; colour tokens, mode,
 * corners, and font for the theme. No stylesheet URLs, no HTML, no scripts —
 * the page's CSP would block them, and tokens cannot inject anything.
 */
import { CONTEXTS, NOTE_MAX, NOTE_MIN, isPublicSite } from "./model.js";

export const CONFIG_PATH = "/.well-known/autonomous-feedback.json";
export const CONFIG_SCHEMA = "autonomous-feedback.client.v0";
const FETCH_TIMEOUT_MS = 2500;
const MAX_BYTES = 16_384;
const CACHE_SECONDS = 300;

export const DEFAULT_THEME = Object.freeze({
  dark: { background: "#0a1012", text: "#e8eef1", accent: "#5eead4" },
  light: { background: "#f7f5f0", text: "#1b2326", accent: "#0f766e" },
});

const RADII = Object.freeze({ sharp: ".2rem", round: "1rem", soft: "1.6rem" });
const FONTS = Object.freeze({
  system: "ui-sans-serif, system-ui, sans-serif",
  serif: "ui-serif, Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
  rounded: "ui-rounded, 'SF Pro Rounded', system-ui, sans-serif",
});

/** The configuration every site gets without a file. */
export function defaultConfig(host) {
  return {
    host,
    found: false,
    name: "",
    intro: "",
    button: "Make the card",
    kinds: CONTEXTS.map((c) => c.slug),
    labels: {},
    from: "off",
    note: { min: NOTE_MIN, max: NOTE_MAX },
    frame: { ancestors: [] },
    theme: null,
    problems: [],
  };
}

function cleanText(value, max) {
  if (typeof value !== "string") return "";
  // Printable text only; the page escapes it again on render.
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function hexToRgb(hex) {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex || "");
  if (!match) return null;
  const full = match[1].length === 3 ? match[1].split("").map((c) => c + c).join("") : match[1];
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

function luminance([r, g, b]) {
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a, b) {
  const la = luminance(hexToRgb(a));
  const lb = luminance(hexToRgb(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function readTheme(raw, problems) {
  if (raw == null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) {
    problems.push("theme must be an object; using the default theme.");
    return null;
  }
  const mode = ["dark", "light"].includes(raw.mode) ? raw.mode : "dark";
  if (raw.mode != null && !["dark", "light"].includes(raw.mode)) problems.push(`theme.mode must be "dark" or "light"; using "dark".`);
  const base = DEFAULT_THEME[mode];
  const colors = { ...base };
  for (const key of ["background", "text", "accent"]) {
    if (raw[key] == null) continue;
    if (hexToRgb(raw[key])) colors[key] = raw[key].toLowerCase();
    else problems.push(`theme.${key} must be a hex colour like #0f766e; using ${base[key]}.`);
  }
  // Readability beats brand: fall back rather than ship an unreadable form.
  if (contrast(colors.text, colors.background) < 4.5) {
    problems.push(`theme.text on theme.background has contrast ${contrast(colors.text, colors.background).toFixed(2)}:1, below 4.5:1; using the ${mode} defaults for both.`);
    colors.text = base.text;
    colors.background = base.background;
  }
  if (contrast(colors.accent, colors.background) < 3) {
    problems.push(`theme.accent on theme.background has contrast ${contrast(colors.accent, colors.background).toFixed(2)}:1, below 3:1; using ${base.accent}.`);
    colors.accent = contrast(base.accent, colors.background) >= 3 ? base.accent : DEFAULT_THEME[luminance(hexToRgb(colors.background)) > 0.4 ? "light" : "dark"].accent;
  }
  const corners = raw.corners == null ? "round" : raw.corners;
  if (!RADII[corners]) problems.push(`theme.corners must be one of ${Object.keys(RADII).join(", ")}; using "round".`);
  const font = raw.font == null ? "system" : raw.font;
  if (!FONTS[font]) problems.push(`theme.font must be one of ${Object.keys(FONTS).join(", ")}; using "system".`);
  return {
    mode,
    ...colors,
    corners: RADII[corners] ? corners : "round",
    font: FONTS[font] ? font : "system",
  };
}

/** Validate a parsed file for `host`. Pure, so tests and the setup page can call it directly. */
export function readConfig(raw, host) {
  const config = defaultConfig(host);
  const problems = config.problems;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    problems.push("The file must be a JSON object.");
    return config;
  }
  config.found = true;
  if (raw.schema !== CONFIG_SCHEMA) problems.push(`schema should be "${CONFIG_SCHEMA}".`);
  if (raw.host !== host) {
    problems.push(`host is "${cleanText(String(raw.host ?? ""), 80)}" but the file was served by ${host}; nothing in it was applied.`);
    config.found = false;
    return config;
  }

  config.name = cleanText(raw.name, 60);
  config.intro = cleanText(raw.intro, 300);
  if (raw.button != null) config.button = cleanText(raw.button, 40) || config.button;

  if (raw.kinds != null) {
    const wanted = Array.isArray(raw.kinds) ? raw.kinds : [];
    const known = [...new Set(wanted.filter((slug) => CONTEXTS.some((c) => c.slug === slug)))];
    const unknown = wanted.filter((slug) => !CONTEXTS.some((c) => c.slug === slug));
    if (unknown.length) problems.push(`kinds has unknown entries (${unknown.map((k) => cleanText(String(k), 20)).join(", ")}); known kinds are ${CONTEXTS.map((c) => c.slug).join(", ")}.`);
    if (known.length) config.kinds = known;
    else problems.push("kinds names no known kind; showing all four.");
  }

  if (raw.labels != null && typeof raw.labels === "object" && !Array.isArray(raw.labels)) {
    for (const [slug, label] of Object.entries(raw.labels)) {
      if (!CONTEXTS.some((c) => c.slug === slug)) {
        problems.push(`labels.${cleanText(slug, 20)} is not a known kind.`);
        continue;
      }
      if (!label || typeof label !== "object") continue;
      const entry = {
        title: cleanText(label.title, 40),
        prompt: cleanText(label.prompt, 160),
        example: cleanText(label.example, 200),
      };
      config.labels[slug] = Object.fromEntries(Object.entries(entry).filter(([, v]) => v));
    }
  }

  if (raw.from != null) {
    if (["off", "optional", "required"].includes(raw.from)) config.from = raw.from;
    else problems.push(`from must be "off", "optional", or "required"; using "off".`);
  }

  if (raw.note != null && typeof raw.note === "object") {
    const min = Number.isInteger(raw.note.min) ? raw.note.min : NOTE_MIN;
    const max = Number.isInteger(raw.note.max) ? raw.note.max : NOTE_MAX;
    if (min < 1 || min > 200) problems.push("note.min must be between 1 and 200.");
    if (max > NOTE_MAX || max < 20) problems.push(`note.max must be between 20 and ${NOTE_MAX}.`);
    config.note.min = Math.min(Math.max(min, 1), 200);
    config.note.max = Math.min(Math.max(max, 20), NOTE_MAX);
    if (config.note.min >= config.note.max) {
      problems.push("note.min must be below note.max; using the defaults.");
      config.note = { min: NOTE_MIN, max: NOTE_MAX };
    }
  }

  if (raw.frame?.ancestors != null) {
    const list = Array.isArray(raw.frame.ancestors) ? raw.frame.ancestors.slice(0, 10) : [];
    for (const entry of list) {
      let url;
      try {
        url = new URL(String(entry));
      } catch {
        problems.push(`frame.ancestors entry "${cleanText(String(entry), 80)}" is not a URL.`);
        continue;
      }
      if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash || !isPublicSite(url.hostname)) {
        problems.push(`frame.ancestors entry "${cleanText(String(entry), 80)}" must be an https origin with no path, like https://blog.example.com.`);
        continue;
      }
      config.frame.ancestors.push(url.origin);
    }
  }

  config.theme = readTheme(raw.theme, problems);
  return config;
}

/** A starter file for `host`, shown on the setup page with the domain filled in. */
export function starterConfig(host) {
  return {
    schema: CONFIG_SCHEMA,
    host,
    name: "",
    intro: "Tell us what worked and what did not. We read every card we are sent.",
    kinds: ["review", "practice", "brief", "wonder"],
    labels: { review: { title: "Bug report", prompt: "What broke, and on which page?" } },
    from: "optional",
    button: "Make the card",
    note: { min: NOTE_MIN, max: NOTE_MAX },
    frame: { ancestors: [] },
    theme: { mode: "light", accent: "#0f766e", corners: "round", font: "system" },
  };
}

/** A validated configuration written back out as a clean client file. */
export function configToFile(config) {
  const file = { schema: CONFIG_SCHEMA, host: config.host };
  if (config.name) file.name = config.name;
  if (config.intro) file.intro = config.intro;
  file.kinds = [...config.kinds];
  if (Object.keys(config.labels).length) file.labels = config.labels;
  file.from = config.from;
  file.button = config.button;
  file.note = { ...config.note };
  if (config.frame.ancestors.length) file.frame = { ancestors: [...config.frame.ancestors] };
  if (config.theme) {
    const { mode, background, text, accent, corners, font } = config.theme;
    file.theme = { mode, background, text, accent, corners, font };
  }
  return file;
}

async function fetchRaw(host) {
  if (!isPublicSite(host)) return { error: "not_public" };
  const url = `https://${host}${CONFIG_PATH}`;
  let response;
  try {
    response = await fetch(url, {
      headers: { accept: "application/json" },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    return { error: "unreachable" };
  }
  const finalHost = new URL(response.url || url).hostname.replace(/^www\./, "");
  if (finalHost !== host) return { error: "redirected_elsewhere" };
  if (response.status === 404) return { error: "missing" };
  if (!response.ok) return { error: `http_${response.status}` };
  const declared = Number(response.headers.get("content-length") || 0);
  if (declared > MAX_BYTES) return { error: "too_large" };
  const text = await response.text();
  if (text.length > MAX_BYTES) return { error: "too_large" };
  try {
    return { raw: JSON.parse(text) };
  } catch {
    return { error: "not_json" };
  }
}

const FETCH_PROBLEMS = Object.freeze({
  not_public: "The site is not a public domain, so no file was fetched.",
  unreachable: `The file could not be fetched within ${FETCH_TIMEOUT_MS / 1000} seconds.`,
  redirected_elsewhere: "The file redirected to a different site, so it was ignored.",
  missing: "No configuration file was found. The defaults apply.",
  too_large: `The file is larger than ${MAX_BYTES / 1024} KB, so it was ignored.`,
  not_json: "The file is not valid JSON, so it was ignored.",
});

/**
 * Configuration for `host`, cached for a few minutes so a card page never
 * waits on a slow client site. Never throws; failures become defaults plus a
 * problem line.
 */
export async function loadConfig(host) {
  const cache = typeof caches !== "undefined" ? caches.default : null;
  const key = cache ? new Request(`https://autonomous.feedback/_config/${host}`) : null;
  if (cache) {
    const hit = await cache.match(key);
    if (hit) return hit.json();
  }
  const fetched = await fetchRaw(host);
  let config;
  if (fetched.raw !== undefined) {
    config = readConfig(fetched.raw, host);
  } else {
    config = defaultConfig(host);
    if (fetched.error !== "missing") config.problems.push(FETCH_PROBLEMS[fetched.error] || `The file returned ${fetched.error.replace("http_", "HTTP ")}.`);
    config.status = fetched.error;
  }
  if (cache) {
    await cache.put(key, new Response(JSON.stringify(config), {
      headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${CACHE_SECONDS}` },
    }));
  }
  return config;
}

/** The kinds a site shows, in its order, with its labels applied. */
export function siteKinds(config) {
  return config.kinds
    .map((slug) => CONTEXTS.find((c) => c.slug === slug))
    .filter(Boolean)
    .map((c) => ({ ...c, ...(config.labels[c.slug] || {}) }));
}

/** CSS custom properties for a validated theme. Values are validated hex, keyword, or table lookups only. */
export function themeCss(theme) {
  if (!theme) return "";
  const rgb = hexToRgb(theme.accent);
  const text = hexToRgb(theme.text);
  const bg = hexToRgb(theme.background);
  const mix = (a, b, t) => a.map((v, i) => Math.round(v * t + b[i] * (1 - t)));
  const toHex = (c) => `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  const surface = toHex(mix(text, bg, theme.mode === "light" ? 0.035 : 0.05));
  const field = toHex(mix(text, bg, theme.mode === "light" ? 0.015 : 0.02));
  const muted = toHex(mix(text, bg, 0.68));
  return `:root { color-scheme: ${theme.mode}; --bg:${theme.background}; --fg:${theme.text}; --muted:${muted}; --accent:${theme.accent}; --line:rgba(${rgb.join(",")},.28); --surface:${surface}; --field:${field}; --radius:${RADII[theme.corners]}; --pill:${theme.corners === "sharp" ? RADII.sharp : "999px"}; --font:${FONTS[theme.font]};${theme.mode === "light" ? " --storm:#b42318; --warn:#8a4b0f;" : ""} } body.embed { background: var(--bg); }`;
}
