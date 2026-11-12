// texture.website: a slide whose address is the recipe. Each word in the path is
// a layer, bottom first; a mark before a word is that layer's law (factshift.center's
// marks, drawn as blends); a word that names no material is spoken in a bubble.
// Every other setting is a dimension in the query, tuned in the panel, and the
// address always says the current state, so any slide can be shared or guessed.
// With no words, the day composes from whichever materials exist; d moves the day.
// Every page is one file; nothing here runs on a server.

const MARKS = ".^*~=@?!%";
const ROTATION = ["~", "*", "^", "?", "@", "!", "%", ".", "="];
const ORIGIN = "https://texture.website";
const INK = "rgba(29, 29, 27, 0.85)";
const $ = (selector) => document.querySelector(selector);

function node(tag, props = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) if (k === "class") n.className = v; else if (k in n) n[k] = v; else n.setAttribute(k, v);
  for (const c of children.flat()) if (c !== "" && c != null) n.append(c);
  return n;
}

const dayNumber = (iso) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86400000);
const isoOf = (n) => new Date(n * 86400000).toISOString().slice(0, 10);
const mix = (n) => { let x = Math.imul((n ^ (n >>> 16)) >>> 0, 0x45d9f3b); x = Math.imul((x ^ (x >>> 16)) >>> 0, 0x45d9f3b); return (x ^ (x >>> 16)) >>> 0; };
const clamp = (v, lo, hi, fallback) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback);

/** The dimensions: query key, label, range, step, default. */
const DIMENSIONS = [
  { key: "d", label: "days", min: -60, max: 60, step: 1, value: 0, show: (v) => (v > 0 ? `+${v}` : String(v)) },
  { key: "s", label: "scale", min: 0.25, max: 4, step: 0.05, value: 1, show: (v) => v.toFixed(2) },
  { key: "a", label: "angle", min: -180, max: 180, step: 1, value: 0, show: (v) => `${v}°` },
  { key: "g", label: "grain", min: 0, max: 1, step: 0.05, value: 0, show: (v) => v.toFixed(2) },
  { key: "w", label: "warp", min: 0, max: 1, step: 0.05, value: 0, show: (v) => v.toFixed(2) },
];

/** Drawn patterns, at a period of p pixels. */
const DRAWN = {
  grid: (p) => [`linear-gradient(${INK} 1px, transparent 1px), linear-gradient(90deg, ${INK} 1px, transparent 1px)`, `${p}px ${p}px`],
  dots: (p) => [`radial-gradient(circle, ${INK} 0 ${(p * 0.16).toFixed(1)}px, transparent ${(p * 0.16 + 0.6).toFixed(1)}px)`, `${p}px ${p}px`],
  hatch: (p) => [`repeating-linear-gradient(45deg, ${INK} 0 1.2px, transparent 1.2px ${(p / 3).toFixed(1)}px)`, "auto"],
  stripes: (p) => [`repeating-linear-gradient(90deg, ${INK} 0 ${p / 2}px, transparent ${p / 2}px ${p}px)`, "auto"],
  checker: (p) => [`conic-gradient(${INK} 25%, transparent 0 50%, ${INK} 0 75%, transparent 0)`, `${p}px ${p}px`],
  ramp: () => [`linear-gradient(90deg, transparent, ${INK})`, "100% 100%"],
};

function daily(catalog, day) {
  const of = (role) => catalog.materials.filter((m) => catalog.categories[m.category]?.role === role);
  const grounds = of("ground"), figures = of("figure");
  const layers = [];
  if (grounds.length) layers.push({ material: grounds[day % grounds.length], mark: "" });
  if (figures.length) layers.push({ material: figures[mix(day) % figures.length], mark: ROTATION[mix(day + 7) % ROTATION.length] });
  return layers;
}

function readPath(catalog, pathname) {
  const byId = new Map(catalog.materials.map((m) => [m.id, m]));
  const layers = [], words = [];
  for (const raw of pathname.split("/").filter(Boolean)) {
    const part = decodeURIComponent(raw);
    const mark = MARKS.includes(part[0]) ? part[0] : "";
    const word = (mark ? part.slice(1) : part).toLowerCase();
    if (byId.has(word)) layers.push({ material: byId.get(word), mark });
    else words.push(part.replace(/[-_+]/g, " "));
  }
  return { layers, words: words.join(" ").trim() };
}

/** The current state, read from the address. */
function stateOf(url, catalog) {
  // A dimension the address does not name keeps its default; a named one is held to its range.
  const dims = Object.fromEntries(DIMENSIONS.map((dim) => { const raw = url.searchParams.get(dim.key); return [dim.key, raw === null || raw === "" ? dim.value : clamp(Number(raw), dim.min, dim.max, dim.value)]; }));
  const today = new Date().toISOString().slice(0, 10);
  const asked = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get("day") ?? "") ? url.searchParams.get("day") : null;
  const day = asked ?? isoOf(dayNumber(today) + dims.d);
  const read = readPath(catalog, url.pathname);
  return {
    dims, day, today,
    layers: read.layers.length ? read.layers : daily(catalog, dayNumber(day)),
    composedByDay: read.layers.length === 0,
    words: (url.searchParams.get("say") ?? read.words).slice(0, 140),
    as: url.searchParams.get("as") ?? ".",
    gatheredFor: (url.searchParams.get("for") ?? "").slice(0, 80),
  };
}

function drawLayers(catalog, state) {
  const host = $(".layers");
  host.replaceChildren();
  const { s, a, w, g } = state.dims;
  state.layers.forEach(({ material, mark }, i) => {
    const law = catalog.laws[mark] ?? catalog.laws[""];
    const period = Math.round(32 * (law.scale ?? 1) * s);
    const layer = node("div", { class: `layer${law.drift ? " drift" : ""}` });
    if (material.procedural) {
      const [image, size] = DRAWN[material.procedural](period);
      layer.style.backgroundImage = image;
      layer.style.backgroundSize = size;
    } else {
      layer.style.backgroundImage = `url("/${material.id}.webp")`;
      layer.style.backgroundSize = `${Math.round(384 * (law.scale ?? 1) * s)}px auto`;
    }
    if (i > 0) { layer.style.mixBlendMode = law.blend; layer.style.opacity = String(law.opacity); }
    if (a) layer.style.transform = `rotate(${a}deg) scale(1.6)`;
    host.append(layer);
  });
  host.style.filter = w > 0 ? "url(#warp)" : "";
  document.querySelector("#warp feDisplacementMap")?.setAttribute("scale", String(Math.round(w * 80)));
  const grain = $(".grain");
  grain.hidden = g === 0;
  grain.style.opacity = String(g);
}

function drawBubble(catalog, { words, as }) {
  const bubble = $(".bubble");
  bubble.hidden = !words;
  bubble.textContent = words;
  bubble.dataset.shape = catalog.bubbles[as] ?? "statement";
}

const spwLine = (layers) => layers.reduceRight((inner, { material, mark }) => `${mark}${material.id}${inner ? `{${inner}}` : ""}`, "");

/** Day of the year, as a figure number: the slide is the year's nth. */
const figureOf = (iso) => dayNumber(iso) - dayNumber(`${iso.slice(0, 4)}-01-01`) + 1;

function drawSlide(catalog, state) {
  const say = (mark) => (catalog.laws[mark] ?? catalog.laws[""]).says;
  $(".slide .fig").textContent = `Fig. ${figureOf(state.day)}`;
  $(".slide .title").textContent = state.layers.map(({ material }) => material.name).join(" / ");
  $(".slide .when").textContent = state.composedByDay ? state.day : "";
  $(".caption").textContent = [
    state.layers.map(({ material, mark }, i) => `${i ? `${material.name} ${say(mark)}` : material.name}: ${material.meaning}`).join(" "),
    state.gatheredFor ? `Gathered for ${state.gatheredFor}.` : "",
  ].filter(Boolean).join(" ");
  $(".rulers").replaceChildren(...DIMENSIONS.map((dim) => node("li", {}, [node("span", { class: "key" }, [dim.key]), node("span", { class: "value" }, [dim.show(state.dims[dim.key])]), node("span", { class: "label" }, [dim.label])])));
}

function drawPanel(state, onChange) {
  const panel = $(".panel");
  panel.hidden = false;
  panel.replaceChildren(...DIMENSIONS.map((dim) => {
    const input = node("input", { type: "range", min: dim.min, max: dim.max, step: dim.step, value: state.dims[dim.key], name: dim.key, "aria-label": dim.label });
    input.addEventListener("input", () => onChange(dim.key, Number(input.value)));
    return node("label", { class: "dim" }, [node("span", { class: "key" }, [dim.key]), input]);
  }));
}

function drawReading(state, address) {
  const srefs = state.layers.filter(({ material }) => !material.procedural).map(({ material }) => `${ORIGIN}/${material.id}.webp`).join(" ");
  const copy = (text) => node("button", { type: "button", onclick: () => navigator.clipboard?.writeText(text) }, ["copy"]);
  const recipe = srefs ? `${state.words || "your subject"} --sref ${srefs} --sw 250` : "";
  $(".reading").replaceChildren(
    recipe ? node("p", {}, [node("span", { class: "key" }, ["sref"]), " ", node("code", {}, [recipe]), " ", copy(recipe)]) : "",
    node("p", {}, [node("span", { class: "key" }, ["spw"]), " ", node("code", {}, [spwLine(state.layers)]), " ", copy(spwLine(state.layers))]),
    node("p", {}, [node("span", { class: "key" }, ["url"]), " ", node("code", {}, [address]), " ", copy(address)]),
    node("p", { class: "hint" }, ["Words in the path are layers; a mark before one is its law; other words are said aloud. ", node("a", { href: "/catalog" }, ["Every material"]), "."]),
  );
}

function catalogView(catalog) {
  $(".slide").hidden = true;
  $(".reading").replaceChildren(node("h1", {}, ["Every material"]), node("p", {}, [`${catalog.materials.length} materials, how each was made, and where it came from. The science notes are drafts.`]));
  $(".catalog ul").replaceChildren(...catalog.materials.map((m) => node("li", {}, [
    node("a", { href: `/${m.id}` }, [node("img", { src: m.readings.image, alt: "", width: 192, height: 108, loading: "lazy" }), node("span", { class: "name" }, [m.name])]),
    node("span", { class: "category" }, [m.category]),
    node("p", {}, [m.science]),
    node("p", { class: "provenance" }, [`Made with ${m.provenance.generator}`, m.provenance.promptWords ? `, from "${m.provenance.promptWords}"` : "",
      m.provenance.job ? [" · ", node("a", { href: m.provenance.job, rel: "noopener" }, ["its job"])] : "",
      m.provenance.raw ? [" · ", node("a", { href: `/raw/${m.provenance.raw.name}` }, ["the raw render"])] : ""]),
    node("ol", { class: "history" }, m.history.map((h) => node("li", {}, [node("code", {}, [h.commit]), ` ${h.date} ${h.subject}`]))),
  ])));
}

async function main() {
  const catalog = await (await fetch("/catalog.json")).json();
  document.body.classList.add("composed");
  const url = new URL(location.href);
  if (url.pathname === "/catalog" || url.pathname === "/catalog/") return catalogView(catalog);
  const render = () => {
    const state = stateOf(url, catalog);
    drawLayers(catalog, state);
    drawBubble(catalog, state);
    drawSlide(catalog, state);
    drawReading(state, url.href);
    return state;
  };
  const state = render();
  drawPanel(state, (key, value) => {
    const dim = DIMENSIONS.find((each) => each.key === key);
    if (value === dim.value) url.searchParams.delete(key); else url.searchParams.set(key, String(value));
    if (key === "d") url.searchParams.delete("day");
    history.replaceState(null, "", url);
    render();
  });
}

main().catch(() => document.body.classList.remove("composed"));
