// Domain-biased onboarding lenses for spw.quest:
// When someone lands from a cluster peer (spwashi.com, attention.productions,
// texture.website, tealstripesvibes.com, mutex.buzz, wap.mom, smut.today,
// factshift.center, autonomous.feedback, lore.land) or selects a practice lens
// (?lens=career|study|rhetoric|prompting or ?from=<host>), the guide reduces
// surface noise and accents the matching starter cards, sample files, operators,
// and expression maneuverability handles (.hand-parts, /build .pivot, /pivot).
import { PEER_BRACES, PEER_SIGILS } from "../../lib/peer-kit.js";
import { escapeHtml } from "../../lib/shell.js";
import { EXAMPLES } from "./examples.js";

const SIGIL_TO_TYPE = Object.freeze(Object.fromEntries(PEER_SIGILS.map(({ sigil, type }) => [sigil, type])));
const BRACE_TO_TYPE = Object.freeze(Object.fromEntries(PEER_BRACES.map(({ open, type }) => [open, `b-${type}`])));
const HANDLE_TO_SLOTS = Object.freeze({
  "b-concept": ["concept", "projection"],
  "b-scene": ["scene", "scope"],
  "b-mode": ["mode"],
  "b-direction": ["definition", "body"],
});

export const DOMAIN_LENSES = Object.freeze([
  Object.freeze({
    id: "creator",
    label: "Creator & craft",
    short: "Craft",
    domains: ["spwashi.com"],
    says: "Accentuates components, themes, frame anchors (#>), and perspective (@) handles.",
    examples: ["perform", "vocabulary", "record", "question", "notebook", "syntax", "perspectives", "surfaces"],
    starters: ["frontend", "marketing"],
    ops: ["#", "^", "@", ".", "!"],
    braces: ["[", "{", "<"],
  }),
  Object.freeze({
    id: "scene",
    label: "Cinema & scene",
    short: "Scene",
    domains: ["attention.productions"],
    says: "Accentuates staging ( ), observer vantage (@), and modal framing [ ] over generic reference.",
    examples: ["cinema", "perspectives", "persona", "perform", "debate", "critique"],
    starters: ["marketing", "community"],
    ops: ["!", "@", "^", "~", "%"],
    braces: ["(", "[", "<"],
  }),
  Object.freeze({
    id: "material",
    label: "Materials & texture",
    short: "Material",
    domains: ["texture.website"],
    says: "Accentuates material defaults (.), potential (~), quality (*), and mode/body slots.",
    examples: ["vocabulary", "record", "surfaces", "pantry", "perform", "question"],
    starters: ["frontend", "marketing"],
    ops: ["~", "*", ".", "@", "?"],
    braces: ["[", "{"],
  }),
  Object.freeze({
    id: "rhythm",
    label: "Rhythm & intervals",
    short: "Rhythm",
    domains: ["tealstripesvibes.com"],
    says: "Accentuates composition (^), parameter bindings (=), measures (%), and ordered ranges.",
    examples: ["calibration", "gradient", "numbers", "laws", "perform", "cinema"],
    starters: ["growth", "frontend"],
    ops: ["^", "=", "%", "~", "*"],
    braces: ["[", "<", "{"],
  }),
  Object.freeze({
    id: "concurrency",
    label: "Concurrency & pipeline",
    short: "Pipeline",
    domains: ["mutex.buzz"],
    says: "Accentuates addressable locks (#), substrate costs ($), state turns (!), and ordered pipelines.",
    examples: ["pipeline", "loops", "incident", "records", "algorithms", "numbers"],
    starters: ["incident", "growth"],
    ops: ["#", "$", "!", "%", "&"],
    braces: ["[", "(", "{"],
  }),
  Object.freeze({
    id: "editorial",
    label: "Editorial & voice",
    short: "Editorial",
    domains: ["wap.mom", "smut.today"],
    says: "Accentuates tone shift [ ], scene setting ( ), wonder (?), and persona (@) voice handles.",
    examples: ["critique", "debate", "revision", "persona", "headings", "negotiation"],
    starters: ["community", "hiring"],
    ops: ["?", "@", "~", "!", "*"],
    braces: ["(", "[", "{"],
  }),
  Object.freeze({
    id: "spatial",
    label: "Spatial manifold",
    short: "Spatial",
    domains: ["factshift.center"],
    says: "Accentuates topological boundaries < >, structural joins (&), and compound integration (^).",
    examples: ["laws", "outline", "recurrence", "pantry", "perspectives", "cinema"],
    starters: ["frontend", "incident"],
    ops: ["~", "^", "&", "="],
    braces: ["<", "(", "{"],
  }),
  Object.freeze({
    id: "field",
    label: "Field & feedback",
    short: "Field",
    domains: ["autonomous.feedback", "lore.land"],
    says: "Accentuates open inquiries (?), verifiable probes (!), and named destinations (#).",
    examples: ["question", "checkin", "decision", "gathering", "charter", "synthesis"],
    starters: ["community", "search"],
    ops: ["?", "!", "@", "~", "#"],
    braces: ["(", "<", "["],
  }),
  Object.freeze({
    id: "career",
    label: "Career utilities",
    short: "Career",
    domains: [],
    says: "Highlights workflows, role cards, triage pipelines, and crisp handoff contracts.",
    examples: ["role", "levels", "onboarding", "incident", "records", "pipeline"],
    starters: ["frontend", "hiring", "search", "incident"],
    ops: ["#", "@", "!", "%", "$"],
    braces: ["[", "{"],
  }),
  Object.freeze({
    id: "study",
    label: "Academic study",
    short: "Academic",
    domains: [],
    says: "Highlights hypothesis testing (?), citation trails (~), multiple perspectives (@), and definitions.",
    examples: ["calibration", "perspectives", "question", "headings", "syntax", "synthesis"],
    starters: ["growth"],
    ops: ["?", "@", ".", "^"],
    braces: ["<", "("],
  }),
  Object.freeze({
    id: "rhetoric",
    label: "Rhetoric & critique",
    short: "Rhetoric",
    domains: [],
    says: "Highlights hedging (~), commitment (!), stance gradients (@), and scene context ( ).",
    examples: ["debate", "critique", "negotiation", "revision", "persona", "gradient"],
    starters: ["marketing", "community"],
    ops: ["~", "?", "!", "@", "*"],
    braces: ["(", "[", "{"],
  }),
  Object.freeze({
    id: "prompting",
    label: "Prompting scenes",
    short: "Prompting",
    domains: [],
    says: "Highlights modal constraints [ ], scene grounding ( ), persona framing (@), and reusable packs.",
    examples: ["perform", "cinema", "loops", "charter", "vocabulary", "pantry"],
    starters: ["marketing", "frontend", "community"],
    ops: ["^", "@", "~", "=", "!"],
    braces: ["[", "{", "("],
  }),
]);

export const LENS_BY_ID = new Map(DOMAIN_LENSES.map((lens) => [lens.id, lens]));
export const HOST_TO_LENS = new Map(
  DOMAIN_LENSES.flatMap((lens) => lens.domains.map((host) => [host, lens])),
);

export function normalizeHost(raw) {
  const value = String(raw || "").trim().toLowerCase();
  if (!value) return "";
  try {
    const host = value.includes("://") ? new URL(value).hostname : value.split("/")[0];
    return host.replace(/^www\./, "").replace(/[^a-z0-9.-]/g, "");
  } catch {
    return value.replace(/^www\./, "").replace(/[^a-z0-9.-]/g, "");
  }
}

export function resolveLens({ params, referer = "" } = {}) {
  const byId = LENS_BY_ID.get(String(params?.get("lens") || "").trim().toLowerCase());
  if (byId) {
    const fromHost = normalizeHost(params?.get("from") || referer);
    return { lens: byId, fromHost };
  }
  const explicitHost = normalizeHost(params?.get("from"));
  if (explicitHost && HOST_TO_LENS.has(explicitHost)) {
    return { lens: HOST_TO_LENS.get(explicitHost), fromHost: explicitHost };
  }
  const refHost = normalizeHost(referer);
  if (refHost && refHost !== "spw.quest" && HOST_TO_LENS.has(refHost)) {
    return { lens: HOST_TO_LENS.get(refHost), fromHost: refHost };
  }
  return null;
}

export function lensHtmlAttrs(resolved, quiet = true) {
  if (!resolved?.lens) return "";
  const { lens, fromHost } = resolved;
  const ops = lens.ops.map((s) => SIGIL_TO_TYPE[s]).filter(Boolean).join(" ");
  const handles = lens.braces.map((b) => BRACE_TO_TYPE[b]).filter(Boolean).join(" ");
  const slots = [...new Set(handles.split(" ").flatMap((h) => HANDLE_TO_SLOTS[h] || []))].join(" ");
  return [
    `data-domain-lens="${escapeHtml(lens.id)}"`,
    quiet ? `data-lens-quiet="true"` : "",
    fromHost ? `data-lens-from="${escapeHtml(fromHost)}"` : "",
    ops ? `data-lens-ops="${escapeHtml(ops)}"` : "",
    handles ? `data-lens-handles="${escapeHtml(handles)}"` : "",
    slots ? `data-lens-slots="${escapeHtml(slots)}"` : "",
  ].filter(Boolean).join(" ");
}

const CHOICE_LENS_IDS = ["career", "study", "rhetoric", "prompting", "scene", "material", "concurrency", "editorial"];

export function lensBarHtml(resolved) {
  const active = resolved?.lens || null;
  const fromHost = resolved?.fromHost || "";
  const chips = CHOICE_LENS_IDS.map((id) => {
    const item = LENS_BY_ID.get(id);
    if (!item) return "";
    const isCurrent = active?.id === id;
    return `<a href="/?lens=${escapeHtml(id)}#try" data-lens-pick="${escapeHtml(id)}"${isCurrent ? ' aria-current="true"' : ""}>${escapeHtml(item.short)}</a>`;
  }).join("");
  const status = active
    ? `<strong>${escapeHtml(active.label)}</strong>${fromHost ? ` <span class="lens-from">from ${escapeHtml(fromHost)}</span>` : ""} <span class="lens-says">${escapeHtml(active.says)}</span>`
    : `<span class="lens-says">Pick a domain lens to filter examples and spotlight matching Spw handles across the page.</span>`;
  return `<aside id="domain-lenses" class="lens-bar" aria-label="Domain lenses">
  <div class="lens-head">
    <p class="lens-status" data-lens-status>${status}</p>
    <div class="lens-controls" data-lens-controls${active ? "" : " hidden"}>
      <button type="button" class="quiet-button" data-lens-toggle-quiet aria-pressed="${active ? "true" : "false"}">${active ? "Show all " + EXAMPLES.length + " files" : "Focus lens"}</button>
      <a class="lens-clear" href="/" data-lens-clear>Clear</a>
    </div>
  </div>
  <nav class="lens-chips" aria-label="Choose a lens">${chips}</nav>
</aside>`;
}

export function lensCss() {
  const scope = (attr) => `:is(html${attr}, .lens-scope${attr})`;
  const opTypes = [...new Set(Object.values(SIGIL_TO_TYPE))];
  const braceTypes = [...new Set(Object.values(BRACE_TO_TYPE))];
  const opSelectors = opTypes.map((type) =>
    `${scope(`[data-lens-ops~="${type}"]`)} .hand-parts li:has([data-t="${type}"]) :is(button, a, .chip),\n    ${scope(`[data-lens-ops~="${type}"]`)} #operators .sigils li:has([data-t="${type}"])`
  ).join(",\n    ");
  const braceSelectors = braceTypes.map((b) =>
    `${scope(`[data-lens-handles~="${b}"]`)} .hand-parts li:has([data-t="${b}"]) :is(button, a, .chip),\n    ${scope(`[data-lens-handles~="${b}"]`)} #operators .braces li:has([data-t="${b}"])`
  ).join(",\n    ");
  const slotSelectors = ["concept", "scene", "mode", "definition", "projection", "scope", "body"].map((slot) =>
    `${scope(`[data-lens-slots~="${slot}"]`)} .pivot[data-slot="${slot}"],\n    ${scope(`[data-lens-slots~="${slot}"]`)} .slot-handles [data-slot="${slot}"]`
  ).join(",\n    ");

  const perLensMatch = DOMAIN_LENSES.map((lens) => {
    const starterSel = lens.starters.map((s) => `${scope(`[data-domain-lens="${lens.id}"]`)} #start-${s}`).join(", ");
    const tabSel = lens.examples.map((id) => `${scope(`[data-domain-lens="${lens.id}"]`)} .examples a[data-example="${id}"]`).join(", ");
    const rowHasSel = lens.examples.map((id) => `[data-example="${id}"]`).join(", ");
    return `${starterSel} { border-color: color-mix(in oklab, var(--accent) 55%, var(--line)); box-shadow: 0 2px 10px -2px color-mix(in oklab, var(--accent) 16%, transparent); }
    ${tabSel} { border-color: color-mix(in oklab, var(--accent) 48%, var(--line)); background: color-mix(in oklab, var(--accent) 9%, var(--surface)); }
    ${scope(`[data-domain-lens="${lens.id}"][data-lens-quiet="true"]`)} .examples-row:not(:has(${rowHasSel})) { display: none; }`;
  }).join("\n    ");

  return `.lens-bar { display: grid; gap: .45rem; margin: 1.15rem 0 .35rem; padding: .65rem .85rem; border: 1px solid color-mix(in oklab, var(--accent) 24%, var(--line)); border-radius: var(--radius); background: color-mix(in oklab, var(--accent) 5%, var(--surface)); }
    ${scope(`[data-domain-lens]`)} .lens-bar { border-color: color-mix(in oklab, var(--accent) 48%, var(--line)); background: color-mix(in oklab, var(--accent) 9%, var(--surface)); }
    .lens-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .35rem .75rem; }
    .lens-status { margin: 0; font-size: .88rem; color: var(--fg); line-height: 1.4; }
    .lens-from { font: 600 .8rem/1 var(--mono); color: var(--accent); padding: .1rem .35rem; border-radius: 4px; background: color-mix(in oklab, var(--accent) 12%, transparent); }
    .lens-says { color: var(--muted); }
    .lens-controls { display: inline-flex; flex-wrap: wrap; align-items: center; gap: .35rem; }
    .lens-clear { display: inline-flex; align-items: center; min-height: 36px; padding: 0 .45rem; font-size: .85rem; }
    .lens-chips { display: flex; flex-wrap: wrap; gap: .3rem; }
    .lens-chips a { display: inline-flex; align-items: center; min-height: 32px; padding: .15rem .65rem; border: 1px solid var(--line); border-radius: var(--pill); background: var(--surface); color: var(--muted); font: 500 .8rem/1 var(--mono); text-decoration: none; transition: border-color 140ms ease, color 140ms ease, background-color 140ms ease; }
    .lens-chips a:hover, .lens-chips a:focus-visible { color: var(--fg); border-color: var(--accent); }
    .lens-chips a[aria-current="true"] { background: var(--accent); color: var(--field); border-color: var(--accent); }
    @media (pointer: coarse) { .lens-chips a, .lens-clear { min-height: 44px; } }
    /* Noise reduction when a domain lens focuses the field */
    ${scope(`[data-domain-lens][data-lens-quiet="true"]`)} .door.starter { opacity: .48; transition: opacity 160ms ease, border-color 160ms ease; }
    ${scope(`[data-domain-lens][data-lens-quiet="true"]`)} .door.starter:hover,
    ${scope(`[data-domain-lens][data-lens-quiet="true"]`)} .door.starter:focus-within { opacity: 1; }
    ${scope(`[data-domain-lens][data-lens-quiet="true"]`)} .examples a { opacity: .52; }
    ${scope(`[data-domain-lens][data-lens-quiet="true"]`)} .examples a[aria-current],
    ${scope(`[data-domain-lens][data-lens-quiet="true"]`)} .examples a:hover { opacity: 1; }
    ${perLensMatch}
    /* Accentuated expression maneuverability handles */
    ${scope(`[data-domain-lens]`)} .hand-parts li :is(button, a, .chip) { opacity: .68; transition: opacity 140ms ease, border-color 140ms ease, background-color 140ms ease, box-shadow 140ms ease; }
    ${scope(`[data-domain-lens]`)} .hand-parts li :is(button, a, .chip):hover,
    ${scope(`[data-domain-lens]`)} .hand-parts li :is(button, a, .chip)[aria-pressed="true"] { opacity: 1; }
    ${opSelectors} {
      opacity: 1;
      border-color: color-mix(in oklab, var(--accent) 52%, var(--line));
      background: color-mix(in oklab, var(--accent) 10%, var(--surface));
      box-shadow: 0 0 0 1px color-mix(in oklab, var(--accent) 22%, transparent);
    }
    ${braceSelectors} {
      opacity: 1;
      border-color: color-mix(in oklab, var(--accent) 48%, var(--line));
      background: color-mix(in oklab, var(--accent) 8%, var(--surface));
      box-shadow: 0 0 0 1px color-mix(in oklab, var(--accent) 18%, transparent);
    }
    ${slotSelectors} {
      border-color: color-mix(in oklab, var(--accent) 52%, var(--line));
      background: color-mix(in oklab, var(--accent) 8%, var(--surface));
      box-shadow: inset 3px 0 0 var(--accent);
    }
    .op-ticks a[data-lens-accent="true"] {
      color: var(--fg);
      background: color-mix(in oklab, var(--accent) 14%, transparent);
      box-shadow: inset 0 -2px 0 var(--accent);
    }`;
}

export function clientLensPayload() {
  return {
    lenses: Object.fromEntries(DOMAIN_LENSES.map((lens) => [
      lens.id,
      {
        id: lens.id,
        label: lens.label,
        says: lens.says,
        examples: lens.examples,
        starters: lens.starters,
        ops: lens.ops.map((s) => SIGIL_TO_TYPE[s]).filter(Boolean),
        handles: lens.braces.map((b) => BRACE_TO_TYPE[b]).filter(Boolean),
        slots: [...new Set(lens.braces.flatMap((b) => HANDLE_TO_SLOTS[BRACE_TO_TYPE[b]] || []))],
        sigils: lens.ops,
      },
    ])),
    hosts: Object.fromEntries(
      DOMAIN_LENSES.flatMap((lens) => lens.domains.map((host) => [host, lens.id])),
    ),
    totalExamples: EXAMPLES.length,
  };
}

/**
 * Self-contained browser enhancer: resolves ?lens=, ?from=, document.referrer, or
 * sessionStorage['spw.quest.lens/1'], biases matching examples/handles, and
 * supports 1-click quiet filtering and clearing without touching files.
 */
export function clientLensInit(payload) {
  const STORAGE_KEY = "spw.quest.lens/1";
  const QUIET_KEY = "spw.quest.lens-quiet/1";
  const root = document.documentElement;
  const hostOf = (raw) => {
    try { return raw ? new URL(raw).hostname.replace(/^www\./, "").toLowerCase() : ""; } catch { return ""; }
  };
  const params = new URLSearchParams(location.search);
  const pickFromParams = () => {
    const id = String(params.get("lens") || "").toLowerCase();
    const fromHost = String(params.get("from") || "").replace(/^www\./, "").toLowerCase();
    if (id && payload.lenses[id]) return { id, from: fromHost };
    if (fromHost && payload.hosts[fromHost]) return { id: payload.hosts[fromHost], from: fromHost };
    const refHost = hostOf(document.referrer);
    if (refHost && refHost !== "spw.quest" && payload.hosts[refHost]) return { id: payload.hosts[refHost], from: refHost };
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (saved && payload.lenses[saved.id]) return saved;
    } catch {}
    return null;
  };

  let quiet = true;
  try { quiet = sessionStorage.getItem(QUIET_KEY) !== "false"; } catch {}

  const apply = (chosen, openExampleTab = false) => {
    const scopeEl = document.querySelector(".lens-scope");
    const bar = document.getElementById("domain-lenses");
    const status = bar?.querySelector("[data-lens-status]");
    const controls = bar?.querySelector("[data-lens-controls]");
    const toggleBtn = bar?.querySelector("[data-lens-toggle-quiet]");
    const targets = [root, ...(scopeEl ? [scopeEl] : [])];
    if (!chosen || !payload.lenses[chosen.id]) {
      for (const el of targets) {
        delete el.dataset.domainLens;
        delete el.dataset.lensQuiet;
        delete el.dataset.lensFrom;
        delete el.dataset.lensOps;
        delete el.dataset.lensHandles;
        delete el.dataset.lensSlots;
      }
      try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
      document.querySelectorAll(".lens-chips a").forEach((a) => a.removeAttribute("aria-current"));
      document.querySelectorAll(".op-ticks a").forEach((a) => a.removeAttribute("data-lens-accent"));
      if (status) status.innerHTML = '<span class="lens-says">Pick a domain lens to filter examples and spotlight matching Spw handles across the page.</span>';
      if (controls) controls.hidden = true;
      return;
    }
    const lens = payload.lenses[chosen.id];
    for (const el of targets) {
      el.dataset.domainLens = lens.id;
      if (quiet) el.dataset.lensQuiet = "true";
      else delete el.dataset.lensQuiet;
      if (chosen.from) el.dataset.lensFrom = chosen.from;
      else delete el.dataset.lensFrom;
      el.dataset.lensOps = lens.ops.join(" ");
      el.dataset.lensHandles = lens.handles.join(" ");
      el.dataset.lensSlots = lens.slots.join(" ");
    }
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ id: lens.id, from: chosen.from || "" })); } catch {}

    document.querySelectorAll(".lens-chips a").forEach((a) => {
      if (a.dataset.lensPick === lens.id) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    document.querySelectorAll(".op-ticks a").forEach((a) => {
      const sig = a.textContent?.trim();
      if (lens.sigils.includes(sig)) a.setAttribute("data-lens-accent", "true");
      else a.removeAttribute("data-lens-accent");
    });
    if (status) {
      status.replaceChildren();
      const strong = document.createElement("strong");
      strong.textContent = lens.label;
      status.append(strong);
      if (chosen.from) {
        status.append(" ", Object.assign(document.createElement("span"), { className: "lens-from", textContent: `from ${chosen.from}` }));
      }
      status.append(" ", Object.assign(document.createElement("span"), { className: "lens-says", textContent: lens.says }));
    }
    if (controls) controls.hidden = false;
    if (toggleBtn) {
      toggleBtn.setAttribute("aria-pressed", String(quiet));
      toggleBtn.textContent = quiet ? `Show all ${payload.totalExamples} files` : "Focus lens";
    }
    if (openExampleTab && !params.has("example") && lens.examples[0]) {
      const targetTab = document.querySelector(`.examples a[data-example="${lens.examples[0]}"]`);
      targetTab?.click();
    }
  };

  const initial = pickFromParams();
  if (initial) {
    apply(initial, !params.has("example") && !document.querySelector(".lens-scope[data-server-lens]"));
  }

  document.getElementById("domain-lenses")?.addEventListener("click", (event) => {
    const pick = event.target.closest("a[data-lens-pick]");
    if (pick && !event.metaKey && !event.ctrlKey && !event.shiftKey && event.button === 0) {
      event.preventDefault();
      quiet = true;
      try { sessionStorage.setItem(QUIET_KEY, "true"); } catch {}
      apply({ id: pick.dataset.lensPick, from: "" }, true);
      const u = new URL(location.href);
      u.searchParams.set("lens", pick.dataset.lensPick);
      u.searchParams.delete("from");
      history.replaceState(history.state, "", u.pathname + u.search + u.hash);
      return;
    }
    const toggle = event.target.closest("[data-lens-toggle-quiet]");
    if (toggle) {
      quiet = !quiet;
      try { sessionStorage.setItem(QUIET_KEY, String(quiet)); } catch {}
      apply(pickFromParams() || (root.dataset.domainLens ? { id: root.dataset.domainLens, from: root.dataset.lensFrom || "" } : null), false);
      return;
    }
    const clear = event.target.closest("[data-lens-clear]");
    if (clear) {
      event.preventDefault();
      quiet = true;
      apply(null, false);
      const u = new URL(location.href);
      u.searchParams.delete("lens");
      u.searchParams.delete("from");
      history.replaceState(history.state, "", u.pathname + u.search + u.hash);
    }
  });
}
