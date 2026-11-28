// texture.website: a studio for building material prompts. The address is the
import { mountCleanStill } from "/clean-still.js";
import { bindSlotScrub } from "/slot-scrub.js";
import { DAY_KEYS, MODE_KEYS, daily, dayNumber, isoOf, laddersFor, lineOf, mix, slug } from "/daily.js";
import { nearWord, readNote } from "/lib/near-word.js";
import { mountSetRing, spw64 } from "/set-ring.js";
import { mountTextScale } from "/text-scale.js";
// prompt. Each word in the path is a material, bottom first; a mark before a word
// is how it meets the one before (~ drifting through, * heavy with). Each ladder
// (scale, light, wear, process, scene, format) is a row of words written into the
// sentence as they stand. An empty path is the day's picture (daily.js): the pair
// and the look both come from the date. The stage sketches the words: each
// material's class gives a drawn base and its word gives the hue, and an SVG
// filter built from the ladders lights it, wears it and prints it. On a phone the
// picture, the sentence, the line and six steppers are the whole panel. The line
// is the same one factshift.center and spw.quest open. Nothing here runs
// on a server.

const MARKS = ".^*~=@?!%";
const NO = "--no text, letters, logo, watermark";
const LEARNED = "texture.learned";
const $ = (selector) => document.querySelector(selector);

/** True when the property has a setter. `list` on an input is a getter only; assigning it throws and used to drop the whole studio. */
function writable(obj, key) {
  for (let at = obj; at; at = Object.getPrototypeOf(at)) {
    const desc = Object.getOwnPropertyDescriptor(at, key);
    if (desc) return Boolean(desc.set || desc.writable);
  }
  return false;
}

function node(tag, props = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") n.className = v;
    else if (writable(n, k)) n[k] = v;
    else n.setAttribute(k, v);
  }
  for (const c of children.flat()) if (c !== "" && c != null) n.append(c);
  return n;
}

const hash = (text) => [...text].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

/* ── reading the address ─────────────────────────────────────── */

/** The view a first path word names (minimalist@), or none. */
function viewOf(vocab, pathname, q) {
  const first = decodeURIComponent(pathname.split("/").filter(Boolean)[0] ?? "");
  const named = first.endsWith("@") ? slug(first.slice(0, -1)) : slug(q.get("view") ?? "");
  return named in vocab.views ? named : "";
}

/**
 * Each path word as a material. Any word is one: a word the list does not hold
 * stays the reader's own, drawn without a class. When it is a slip or the start
 * of a listed word (moqette, terraz), `near` names that word, so the page can
 * offer it without taking the reader's word away.
 */
function readPath(vocab, pathname) {
  const bySlug = new Map(vocab.materials.map((m) => [m.slug, m]));
  const listed = vocab.materials.map((m) => m.slug);
  return pathname.split("/").filter(Boolean).filter((raw) => !decodeURIComponent(raw).endsWith("@")).map((raw) => {
    const part = decodeURIComponent(raw);
    const mark = MARKS.includes(part[0]) ? part[0] : "";
    const key = slug(mark ? part.slice(1) : part);
    const known = bySlug.get(key);
    if (known || !key) return { mark, material: known ?? { slug: "" } };
    const near = nearWord(key, listed);
    const offer = near && (near.how === "slip" || near.how === "prefix") ? bySlug.get(near.word) : null;
    return { mark, material: { word: key.replace(/-/g, " "), slug: key, cls: null }, near: offer ?? null };
  }).filter(({ material }) => material.slug);
}

function stateOf(url, vocab) {
  const q = url.searchParams;
  const now = new Date();
  const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(q.get("day") ?? "") ? q.get("day") : isoOf(dayNumber(today) + (Number.parseInt(q.get("d") ?? "0", 10) || 0));
  const roll = Number.parseInt(q.get("r") ?? "", 10);
  const view = viewOf(vocab, url.pathname, q);
  const read = readPath(vocab, url.pathname);
  const byDay = read.length === 0;
  const reads = [];
  const ladders = laddersFor(vocab, { day, roll, query: q, byDay, reads });
  if (view === "story-designer" && !q.get("format")) ladders.format = "plate";
  const num = (key, lo, hi) => { const n = Number.parseInt(q.get(key) ?? "", 10); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : null; };
  return {
    day, ladders, view,
    params: { chaos: num("chaos", 0, 100), weird: num("weird", 0, 3000), stylize: num("stylize", 0, 1000), seed: num("seed", 0, 4294967295), raw: q.has("raw"), sref: q.get("sref") === "random" },
    perm: q.get("perm") in vocab.ladders ? q.get("perm") : null,
    weigh: q.has("weigh"),
    exclude: (q.get("exclude") ?? "").replace(/[^a-z0-9 -]+/gi, "").trim().slice(0, 40),
    layers: read.length ? read : daily(vocab, dayNumber(day)),
    byDay, reads,
    say: (q.get("say") ?? "").slice(0, 140), as: q.get("as") ?? ".",
    // Where the light falls from, set with attention.productions' lamp; none keeps the light word's own direction.
    from: nearWord(q.get("from"), Object.keys(vocab.lightFrom ?? {}), { aliases: { top: "above", back: "behind", bottom: "below" } })?.word ?? null,
    gatheredFor: (q.get("for") ?? "").slice(0, 80),
  };
}

/* ── the prompt ──────────────────────────────────────────────── */

/** Two qualities, one from each class in play, chosen by the words so they hold still. */
function qualities(vocab, layers) {
  const picked = [];
  for (const { material } of layers) {
    const pool = material.cls ? vocab.classes[material.cls].qualities : [];
    if (pool.length && picked.length < 2) picked.push(pool[hash(material.slug) % pool.length]);
  }
  return picked;
}

function sentence(vocab, layers) {
  return layers.map(({ material, mark }, i) => (i ? `${vocab.relations[mark]?.says ?? "with"} ${material.word}` : material.word)).join(" ");
}

/** The prompt's parts in order, each named, so PromptEngineer@ can show its anatomy. */
function anatomy(vocab, state) {
  const { scale, light, wear, process, palette, scene, format, lens, beat, trace } = state.ladders;
  const p = vocab.phrases;
  const phrase = (key, word) => {
    if (state.perm !== key) return p[key][word];
    const words = vocab.ladders[key].filter((w) => p[key][w]);
    const start = Math.max(0, words.indexOf(word));
    return `{${[0, 1, 2, 3].map((i) => p[key][words[(start + i) % words.length]]).join(", ")}}`;
  };
  const lit = (word) => [phrase("light", word), vocab.lightFrom?.[state.from]?.says].filter(Boolean).join(" ");
  const subject = state.weigh && state.layers.length > 1
    ? state.layers.map(({ material }, i) => `${material.word}::${i ? 1 : 2}`).join(" ")
    : sentence(vocab, state.layers);
  // The palette is a look, so every view names it when it is set.
  if (state.view === "minimalist") return [["subject", `${vocab.formats[format].lead} ${subject}`], ["light", lit(light)], ["palette", p.palette?.[palette] ?? ""]];
  if (state.view === "story-designer") {
    // A story opens on its setting, then what it is made of: "a floor of rain on glass heavy with moquette".
    const SETTING = { wall: "a wall", floor: "a floor", table: "a tabletop", costume: "a costume", sky: "a sky", page: "a page" };
    return [["setting", `${SETTING[scene]} of ${subject}`], ["light", lit(light)],
      ["wear", p.wear[wear]], ["palette", p.palette?.[palette] ?? ""], ["trace", p.trace[trace]], ["moment", p.beat[beat]], ["lens", p.lens[lens]]];
  }
  return [["subject", `${vocab.formats[format].lead} ${subject}`], ["scale", phrase("scale", scale)], ["light", lit(light)],
    ["wear", [p.wear[wear], ...qualities(vocab, state.layers)].join(", ")], ["process", phrase("process", process)], ["palette", phrase("palette", palette)],
    ["scene", phrase("scene", scene)], ["lens", phrase("lens", lens)]];
}

/** The parameters a prompt ends with: the format's, then each pivot that is set. */
function parameters(vocab, state) {
  const { chaos, weird, stylize, seed, raw, sref } = state.params;
  const no = state.exclude ? `${NO}, ${state.exclude}` : NO;
  return [vocab.formats[state.ladders.format].params, no,
    chaos ? `--chaos ${chaos}` : "", weird ? `--weird ${weird}` : "", stylize !== null && stylize !== 100 ? `--stylize ${stylize}` : "",
    raw ? "--raw" : "", sref ? "--sref random" : "", seed !== null ? `--seed ${seed}` : ""].filter(Boolean).join(" ");
}

function prompts(vocab, state) {
  const parts = anatomy(vocab, state).map(([, text]) => text).filter(Boolean);
  return { midjourney: `${parts.join(", ")} ${parameters(vocab, state)}`, plain: `${parts.join(", ").replace(/::\d/g, "").replace(/[{}]/g, "")}.` };
}

/** The line daily.js builds. Scale is in the mode, so the look survives the trip. */
const spwLine = lineOf;
const OP_KIND = { "~": "potential", "?": "wonder", "*": "value", ".": "ground", "^": "integration", "@": "perspective", "!": "action", "&": "measure", "%": "measure", "=": "configuration", "#": "frame" };

function spwLayersNode(layers) {
  if (!layers.length) return [];
  const [{ material, mark }, ...rest] = layers;
  const children = [
    node("span", { class: "spw-op", "data-op": OP_KIND[mark] || "potential" }, [mark]),
    node("span", { class: "spw-word" }, [material.slug]),
  ];
  if (rest.length) {
    children.push(
      node("span", { class: "spw-br", "data-op": "direction" }, ["{"]),
      ...spwLayersNode(rest),
      node("span", { class: "spw-br", "data-op": "direction" }, ["}"]),
    );
  }
  return children;
}

function spwSlotButton(vocab, state, key, onStep) {
  const words = vocab.ladders[key];
  const current = state.ladders[key];
  const idx = Math.max(0, words.indexOf(current));
  const btn = node("button", {
    type: "button",
    class: "spw-slot",
    role: "slider",
    "data-key": key,
    "aria-label": key,
    "aria-valuemin": "0",
    "aria-valuemax": String(Math.max(0, words.length - 1)),
    "aria-valuenow": String(idx),
    "aria-valuetext": current,
    title: `${key}: drag sideways, or click to step`,
  }, [slug(current)]);
  // Hold the width of the ladder's longest word, so scrubbing through words of different lengths never shifts the line.
  btn.style.minInlineSize = `${Math.max(...words.map((w) => slug(w).length))}ch`;
  bindSlotScrub(btn, {
    selector: ".spw-slot",
    commit: "live",
    onStep: (k, dir) => onStep(k, dir, true),
    onRelease: (k) => onStep(k, 0, false),
    onTap: (k, e) => onStep(k, e.shiftKey ? -1 : 1, false),
    onKey: (k, dir) => onStep(k, dir, false),
  });
  return btn;
}

function spwLineNode(vocab, state, onStep, onCycleView) {
  const [first, ...rest] = state.layers;
  const parts = [];
  const viewLabel = state.view && vocab.views[state.view] ? vocab.views[state.view].name.slice(0, -1) : "studio";
  const personaBtn = node("button", {
    type: "button",
    class: "spw-persona-btn",
    title: "Switch perspective view",
    "aria-label": `Perspective view: ${viewLabel}. Click to cycle.`,
  }, [
    node("span", { class: "spw-persona", "data-op": "perspective" }, [viewLabel]),
    node("span", { class: "spw-op", "data-op": "perspective" }, ["@"]),
  ]);
  personaBtn.addEventListener("click", () => onCycleView?.());
  parts.push(personaBtn, " ");
  parts.push(
    node("span", { class: "spw-op", "data-op": OP_KIND[first.mark] || "potential" }, [first.mark]),
    node("span", { class: "spw-word" }, [first.material.slug]),
    node("span", { class: "spw-br", "data-op": "mode" }, ["["]),
    ...MODE_KEYS.flatMap((key, i) => [i ? node("span", { class: "spw-sep" }, [", "]) : "", spwSlotButton(vocab, state, key, onStep)]),
    node("span", { class: "spw-br", "data-op": "mode" }, ["]"]),
  );
  if (rest.length) {
    parts.push(
      node("span", { class: "spw-br", "data-op": "direction" }, ["{"]),
      ...spwLayersNode(rest),
      node("span", { class: "spw-br", "data-op": "direction" }, ["}"]),
    );
  }
  parts.push(
    node("span", { class: "spw-br", "data-op": "scene" }, ["("]),
    spwSlotButton(vocab, state, "scene", onStep),
    node("span", { class: "spw-br", "data-op": "scene" }, [")"]),
    node("span", { class: "spw-br", "data-op": "concept" }, ["<"]),
    spwSlotButton(vocab, state, "format", onStep),
    node("span", { class: "spw-br", "data-op": "concept" }, [">"]),
  );
  return node("code", { class: "spw-expr" }, parts);
}

/* ── the sketch ──────────────────────────────────────────────── */

const PERIOD = { macro: 96, close: 48, "arm's length": 28, room: 16, far: 9 };
/**
 * The focal radius, drawn. The ground (the first word) is the subject and holds
 * focus; each material layered over it sits a step nearer the lens and softens
 * by this many px a step, the closer the camera stands. At far everything is
 * in focus. attention.productions' lens law: the subject sheet sharp, the
 * sheets around it falling away. The tiled view stays sharp to show its seams.
 */
const DEPTH_BLUR = { macro: 2.4, close: 1.2, "arm's length": 0.5, room: 0.2, far: 0 };
const ASPECT = { tile: "1 / 1", plate: "16 / 9", sheet: "4 / 5" };

const ORIGIN = "https://texture.website";

/** A material's image: the file texture.website draws for it (src/raster.js), the one a reader copies for Midjourney. */
const imageOf = (material) => `${ORIGIN}/${material.slug}.png`;

/**
 * A layer's base at period p: a listed material draws from its image, tiled at
 * the scale's size; a word of no listed class is a quiet check in its own hue,
 * so the prompt leads and the sketch only hints.
 */
function base(material, p) {
  if (material.cls) return [[`url("/${material.slug}.png")`, `${p * 8}px ${p * 8}px`]];
  const h = hash(material.slug) % 360;
  const c = (l) => `hsl(${h} 30% ${l}%)`;
  return [[`conic-gradient(${c(86)} 25%, ${c(78)} 0 50%, ${c(86)} 0 75%, ${c(78)} 0)`, `${p}px ${p}px`]];
}

const LIGHT = {
  "raking dawn": { az: 15, el: 9, color: "#ffd2a6" }, overcast: { az: 90, el: 70, color: "#eef1f3" },
  noon: { az: 180, el: 88, color: "#ffffff" }, lamplight: { az: 230, el: 28, color: "#ffcb83" }, "sodium night": { az: 300, el: 16, color: "#ff9437" },
};
const WEAR = {
  pristine: { freq: 0.9, warp: 0, relief: 0.6 }, handled: { freq: 0.55, warp: 3, relief: 1 }, worn: { freq: 0.3, warp: 9, relief: 1.6 },
  weathered: { freq: 0.16, warp: 20, relief: 2.4 }, ruined: { freq: 0.07, warp: 42, relief: 3.4 },
};
/** Grey mapped from one ink (shadows) to paper (highlights). */
const duotone = (dark, light, attrs = "") => {
  const ch = (hex, i) => (parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255).toFixed(3);
  return `<feComponentTransfer ${attrs}>${["R", "G", "B"].map((c, i) => `<feFunc${c} type="table" tableValues="${ch(dark, i)} ${ch(light, i)}"/>`).join("")}</feComponentTransfer>`;
};
const GREY = `<feColorMatrix type="saturate" values="0"/>`;
/** Grey stretched so shadows and highlights both reach the inks. */
const STRETCH = `<feComponentTransfer>${["R", "G", "B"].map((c) => `<feFunc${c} type="linear" slope="2.2" intercept="-0.6"/>`).join("")}</feComponentTransfer>`;
const STEPS = (values) => ["R", "G", "B"].map((c) => `<feFunc${c} type="discrete" tableValues="${values}"/>`).join("");
const PROCESS = {
  "as found": "",
  // Two inks printed one after the other, the second a little out of register.
  riso: `<feColorMatrix in="lit" type="saturate" values="0"/>${STRETCH.replace("<feComponentTransfer>", '<feComponentTransfer result="grey">')}${duotone("#ff48b0", "#f6f1e7", 'in="grey" result="pink"')}${duotone("#0078bf", "#f6f1e7", 'in="grey" result="blue"')}<feOffset in="blue" dx="3" dy="2" result="shifted"/><feBlend in="pink" in2="shifted" mode="multiply"/>`,
  engraving: `${GREY}<feComponentTransfer>${STEPS("0.1 0.1 0.95 0.95")}</feComponentTransfer>`,
  relief: `<feColorMatrix in="lit" type="luminanceToAlpha" result="height"/><feDiffuseLighting in="height" surfaceScale="5" lighting-color="#f4f1ea"><feDistantLight azimuth="135" elevation="35"/></feDiffuseLighting>`,
  posterized: `<feComponentTransfer>${STEPS("0 0.33 0.66 1")}</feComponentTransfer>`,
  cyanotype: `${GREY}${STRETCH}${duotone("#163a6b", "#eef3f7")}`,
};

/**
 * A palette as a gradient map: the picture to luminance, stretched so its
 * shadows and highlights reach the ends, then each channel read off the
 * palette's stops from dark to light. Applied last, the palette is the inks.
 */
function paletteMarkup(stops) {
  if (!stops?.length) return "";
  const luma = "0.2126 0.7152 0.0722 0 0";
  const channel = (i) => stops.map((hex) => (parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255).toFixed(3)).join(" ");
  return `<feColorMatrix type="matrix" values="${luma} ${luma} ${luma} 0 0 0 1 0"/>`
    + `<feComponentTransfer>${["R", "G", "B"].map((c) => `<feFunc${c} type="linear" slope="1.45" intercept="-0.2"/>`).join("")}</feComponentTransfer>`
    + `<feComponentTransfer>${["R", "G", "B"].map((c, i) => `<feFunc${c} type="table" tableValues="${channel(i)}"/>`).join("")}</feComponentTransfer>`;
}

/** The SVG filter for these ladders: wear warps and roughens, light rakes across, process prints, palette inks. */
function filterMarkup(state, palettes = {}, lightFrom = {}) {
  const lamp = lightFrom[state.from];
  const L = { ...LIGHT[state.ladders.light], ...(lamp ? { az: lamp.az, ...(lamp.el ? { el: lamp.el } : {}) } : {}) }, W = WEAR[state.ladders.wear];
  return `<feTurbulence type="fractalNoise" baseFrequency="${W.freq}" numOctaves="3" seed="${hash(state.layers.map((l) => l.material.slug).join()) % 97}" result="noise"/>
<feDisplacementMap in="SourceGraphic" in2="noise" scale="${W.warp}" xChannelSelector="R" yChannelSelector="G" result="worn"/>
<feDiffuseLighting in="noise" surfaceScale="${W.relief}" lighting-color="${L.color}" result="light"><feDistantLight azimuth="${L.az}" elevation="${L.el}"/></feDiffuseLighting>
<feComposite in="worn" in2="light" operator="arithmetic" k1="0.6" k2="0.62" k3="0" k4="0" result="lit"/>
${PROCESS[state.ladders.process]}${paletteMarkup(palettes[state.ladders.palette])}`;
}

function drawStage(vocab, state) {
  const stage = $(".stage");
  const tiled = stage.classList.contains("tiled");
  const p = tiled ? Math.max(6, Math.round(PERIOD[state.ladders.scale] / 2)) : PERIOD[state.ladders.scale];
  const phone = window.matchMedia("(max-width: 40rem)").matches && !document.body.classList.contains("studio-open");
  stage.style.aspectRatio = phone ? "auto" : (tiled ? "1 / 1" : ASPECT[state.ladders.format]);
  $(".layers").replaceChildren(...state.layers.map(({ material, mark }, i) => {
    const pairs = base(material, p);
    const layer = node("div", { class: `layer${vocab.relations[mark]?.drift ? " drift" : ""}` });
    layer.style.backgroundImage = pairs.map(([image]) => image).join(", ");
    layer.style.backgroundSize = pairs.map(([, size]) => size).join(", ");
    if (i > 0) { layer.style.mixBlendMode = vocab.relations[mark]?.blend ?? "normal"; layer.style.opacity = String(vocab.relations[mark]?.opacity ?? 0.6); }
    const soft = tiled ? 0 : (DEPTH_BLUR[state.ladders.scale] ?? 0) * i;
    if (soft) {
      layer.style.filter = `blur(${soft.toFixed(1)}px)`;
      // Past the stage's clip, so the softened edge does not show as a halo.
      layer.style.inset = `-${Math.ceil(soft * 3)}px`;
    }
    return layer;
  }));
  $("#material").innerHTML = filterMarkup(state, vocab.palettes, vocab.lightFrom);
  $(".layers").style.filter = "url(#material)";
  // Split: the same layers with no filter, clipped to the left of the line, so the tuning reads as a before and after.
  const drawn = $(".layers-drawn");
  if (drawn) drawn.replaceChildren(...(stage.classList.contains("split") ? [...$(".layers").children].map((layer) => layer.cloneNode(true)) : []));
  const bubble = $(".bubble");
  bubble.hidden = !state.say;
  bubble.textContent = state.say;
  bubble.dataset.shape = { "~": "thought", "?": "question", "!": "burst" }[state.as] ?? "statement";
}

/* ── the slide, the ladders, the prompts ─────────────────────── */

const figureOf = (iso) => dayNumber(iso) - dayNumber(`${iso.slice(0, 4)}-01-01`) + 1;

function drawSlide(vocab, state, onDay) {
  $(".slide .fig").textContent = `Fig. ${figureOf(state.day)}`;
  $(".slide .title").textContent = state.layers.map(({ material }) => material.word).join(" · ");
  const when = $(".slide .when");
  if (state.byDay && onDay) {
    const step = (delta, label) => node("button", { type: "button", class: "day-step", "aria-label": label, onclick: () => onDay(delta) }, [delta < 0 ? "‹" : "›"]);
    when.replaceChildren(step(-1, "Previous day"), document.createTextNode(` ${state.day} `), step(1, "Next day"));
  } else {
    when.textContent = state.byDay ? state.day : "";
  }
  const first = state.layers[0].material;
  $(".caption").textContent = [first.cls ? vocab.classes[first.cls].science : `${first.word}: a material of no listed class; the prompt takes the word as it is.`, state.gatheredFor ? `Gathered for ${state.gatheredFor}.` : ""].filter(Boolean).join(" ");
  const stillCtx = $(".still-context");
  if (stillCtx) {
    const { plain } = prompts(vocab, state);
    stillCtx.replaceChildren(
      node("p", { class: "still-prompt" }, [plain]),
      node("code", { class: "still-spw" }, [spwLine(state)]),
    );
  }
}

/** Two neighbours in a material's class: the words beside it. */
function neighbours(vocab, material) {
  if (!material.cls) return [];
  const kin = vocab.materials.filter((m) => m.cls === material.cls);
  const i = kin.findIndex((m) => m.slug === material.slug);
  return [kin[(i + 1) % kin.length], kin[(i + kin.length - 1) % kin.length]].filter((m, j, all) => m.slug !== material.slug && all.indexOf(m) === j);
}

function swapHref(state, index, other) {
  const path = state.layers.map(({ material, mark }, i) => `${mark === "?" ? "%3F" : mark}${i === index ? other.slug : material.slug}`).join("/");
  const view = decodeURIComponent(location.pathname.split("/").filter(Boolean)[0] ?? "").endsWith("@") ? `/${location.pathname.split("/").filter(Boolean)[0]}` : "";
  return `${view}/${path}${location.search}`;
}

/** Write an updated layers array back into url.pathname while preserving any view prefix. */
function writeLayersPath(url, state, nextLayers) {
  // Leaving the day writes its look into the query, so the picture the reader
  // had stays when the path starts naming materials.
  if (state.byDay) for (const key of DAY_KEYS) if (!url.searchParams.has(key)) url.searchParams.set(key, slug(state.ladders[key]));
  const view = state.view ? `/${state.view}@` : "";
  if (!nextLayers.length) { url.pathname = view ? `${view}/` : "/"; return; }
  const segments = nextLayers.map(({ material, mark }, i) => {
    const m = i === 0 ? "" : (mark === "?" ? "%3F" : mark);
    return `${m}${material.slug}`;
  });
  url.pathname = `${view}/${segments.join("/")}`;
}

/** Inline Material Layer Composer: inspect, reorder relations, remove, or stack new materials without editing the URL bar. */
function drawLayerBar(vocab, state, url, onUpdate) {
  const bar = $(".layer-bar");
  if (!bar) return;
  bar.hidden = false;
  const chips = state.layers.map(({ material, mark }, i) => {
    const items = [];
    if (i > 0) {
      const sel = node("select", { class: "rel-select", "aria-label": `Relation before ${material.word}` },
        Object.entries(vocab.relations).map(([sym, info]) => {
          const opt = node("option", { value: sym }, [`${sym || "·"} ${info.says}`]);
          if (sym === mark) opt.selected = true;
          return opt;
        }));
      sel.addEventListener("change", () => {
        const next = state.layers.map((l, idx) => (idx === i ? { ...l, mark: sel.value } : l));
        writeLayersPath(url, state, next);
        onUpdate();
      });
      items.push(sel);
    }
    items.push(node("span", { class: "layer-word" }, [material.word]));
    if (state.layers.length > 1) {
      const rm = node("button", { type: "button", class: "layer-remove", "aria-label": `Remove ${material.word}` }, ["×"]);
      rm.addEventListener("click", () => {
        const next = state.layers.filter((_, idx) => idx !== i);
        writeLayersPath(url, state, next);
        onUpdate();
      });
      items.push(rm);
    }
    return node("span", { class: "layer-chip" }, items);
  });
  const input = node("input", { type: "text", class: "layer-input", list: "material-list", placeholder: "Add material…", "aria-label": "Add material layer" });
  const addBtn = node("button", { type: "submit", class: "layer-add" }, ["+ add"]);
  const form = node("form", { class: "layer-form" }, [input, addBtn]);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const key = slug(input.value);
    if (!key) return;
    const found = vocab.materials.find((m) => m.slug === key) ?? { word: input.value.trim(), slug: key, cls: null };
    const next = [...state.layers, { mark: state.layers.length ? "~" : "", material: found }];
    writeLayersPath(url, state, next);
    input.value = "";
    onUpdate();
  });
  const extras = [form];
  if (!state.byDay) {
    const reset = node("button", { type: "button", class: "layer-reset" }, ["today"]);
    reset.addEventListener("click", () => {
      writeLayersPath(url, state, []);
      onUpdate();
    });
    extras.push(reset);
  }
  bar.replaceChildren(node("span", { class: "key" }, ["layers"]), ...chips, ...extras);
}

/* ── configuration: ladders in three bands ────────────────────── */

const BANDS = [["look", ["scale", "light", "wear"]], ["make", ["process", "palette", "format", "lens"]], ["use", ["scene"]], ["story", ["beat", "trace"]], ["card", ["face", "tone"]]];

/** The phone's steppers: the day's six looks and the palette. */
const TUNE_KEYS = [...DAY_KEYS, "palette"];

/** One stepper per look. Tap the word to step forward, the mark beside it to step back. */
function drawTune(vocab, state, set) {
  const tune = $(".tune");
  if (!tune) return;
  tune.hidden = false;
  const stepper = (key) => {
    const words = vocab.ladders[key];
    const at = Math.max(0, words.indexOf(state.ladders[key]));
    const go = (dir) => set({ [key]: slug(words[(at + dir + words.length) % words.length]) }, key);
    return node("div", { class: "stepper" }, [
      node("span", { class: "key" }, [key]),
      node("button", { type: "button", "aria-label": `previous ${key}`, onclick: () => go(-1) }, ["‹"]),
      node("button", { type: "button", class: "step-word", "data-step-word": key, "aria-label": `${key}, ${state.ladders[key]}`, onclick: () => go(1) }, [state.ladders[key]]),
    ]);
  };
  tune.replaceChildren(...TUNE_KEYS.filter((key) => vocab.ladders[key]).map(stepper));
}

/**
 * While a finger is still on a slot, move the word, the sentence and the picture
 * without building the page again. Building it again would replace the slot the
 * finger is holding.
 */
function paintLive(vocab, state, slotKey) {
  const words = vocab.ladders[slotKey] || [];
  const current = state.ladders[slotKey];
  const idx = Math.max(0, words.indexOf(current));
  for (const btn of document.querySelectorAll(`.spw-slot[data-key="${slotKey}"]`)) {
    btn.textContent = slug(current);
    btn.setAttribute("aria-valuenow", String(idx));
    btn.setAttribute("aria-valuetext", current);
    btn.classList.add("scrubbing");
  }
  for (const word of document.querySelectorAll(`[data-step-word="${slotKey}"]`)) {
    word.textContent = current;
    word.setAttribute("aria-label", `${slotKey}, ${current}`);
  }
  const prompt = $(".day-prompt");
  if (prompt) prompt.textContent = prompts(vocab, state).plain;
  const still = $(".still-spw");
  if (still) still.textContent = spwLine(state);
  drawStage(vocab, state);
}

/** The phone panel's sentence, its line, and its two actions. The studio holds the rest. */
function drawPanel(vocab, state, onStep, onCycleView) {
  const prompt = $(".day-prompt");
  const actions = $(".panel-actions");
  const lineHost = $(".panel-line");
  if (!prompt || !actions) return;
  const { midjourney, plain } = prompts(vocab, state);
  prompt.hidden = false;
  prompt.textContent = plain;
  if (lineHost && onStep) {
    lineHost.hidden = false;
    lineHost.replaceChildren(spwLineNode(vocab, state, onStep, onCycleView));
  }
  const studio = node("button", {
    type: "button",
    class: "studio-toggle",
    "aria-pressed": String(document.body.classList.contains("studio-open")),
    onclick: () => {
      const open = document.body.classList.toggle("studio-open");
      if (!open) window.scrollTo(0, 0);
      drawStage(vocab, state);
      // The ladders were drawn while hidden, with no width to centre in; now they have one.
      if (open) centreRungs($(".ladders"));
      studio.setAttribute("aria-pressed", String(open));
      studio.textContent = open ? "picture" : "studio";
    },
  }, [document.body.classList.contains("studio-open") ? "picture" : "studio"]);
  actions.hidden = false;
  actions.replaceChildren(copyButton("copy prompt", midjourney), studio);
}

/** What a ladder's current word adds to the sentence, said beside it. */
function phraseOf(vocab, key, word) {
  if (key === "format") return `${vocab.formats[word].lead} … ${vocab.formats[word].params}`;
  if (key === "face") return `the square card's band says the ${word}`;
  if (key === "tone") return `the band is ${word}`;
  return vocab.phrases[key]?.[word] || "adds nothing";
}

/**
 * Each ladder is a row of words, a radio group the arrow keys walk. The phrase it
 * adds stands beside it; a lock keeps it through "roll all". Every choice is
 * written into the address, so a configuration is a link.
 */
/** On a phone each ladder is one row that scrolls sideways; bring its word to the middle without moving the page. */
function centreRungs(section) {
  for (const rungs of section.querySelectorAll(".rungs[role=radiogroup]")) {
    if (rungs.scrollWidth <= rungs.clientWidth) continue;
    const on = rungs.querySelector('[aria-checked="true"]');
    if (on) rungs.scrollLeft = on.offsetLeft - (rungs.clientWidth - on.offsetWidth) / 2;
  }
}

function drawLadders(vocab, state, locks, set) {
  const section = $(".ladders");
  section.hidden = false;
  const ladder = (key) => {
    const words = vocab.ladders[key];
    const rungs = words.map((word) => node("button", {
      type: "button", role: "radio", tabIndex: word === state.ladders[key] ? 0 : -1,
      "aria-checked": String(word === state.ladders[key]), onclick: () => set({ [key]: slug(word) }),
    }, [word]));
    const group = node("div", { class: "rungs", role: "radiogroup", "aria-label": key }, rungs);
    group.addEventListener("keydown", (event) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      const next = words[(words.indexOf(state.ladders[key]) + step + words.length) % words.length];
      set({ [key]: slug(next) }, key);
    });
    const locked = locks.has(key);
    // The name and its two tools sit together, so "keep" and "roll" are read with the ladder they act on.
    return node("div", { class: `ladder${locked ? " locked" : ""}`, "data-key": key }, [
      node("div", { class: "ladder-head" }, [
        node("span", { class: "key" }, [key]),
        node("span", { class: "tools" }, [
          node("button", { type: "button", class: "lock", "aria-pressed": String(locked), title: locked ? `${key} is kept through roll all` : `keep ${key} through roll all`, onclick: () => set({ lock: key }) }, [locked ? "kept" : "keep"]),
          node("button", { type: "button", class: "roll", title: `a different ${key}`, disabled: locked, onclick: () => { const others = words.filter((w) => w !== state.ladders[key]); set({ [key]: slug(others[Math.floor(Math.random() * others.length)]) }); } }, ["roll"]),
          // The light's direction is turned on attention.productions with its lamp; its link back carries from=.
          ...(key === "light" ? [
            node("a", { class: "lamp", href: shotHrefOf(state), title: "Turn this light with attention.productions' lamp; its link back brings the direction here" }, ["lamp ↗"]),
            ...(state.from ? [node("button", { type: "button", class: "lamp-clear", title: `clear the lamp: the light falls ${vocab.lightFrom[state.from].says}`, onclick: () => set({ from: null }) }, [`${state.from} ✕`])] : []),
          ] : []),
        ]),
      ]),
      node("div", { class: "rung-column" }, [group, node("span", { class: "phrase" }, [`→ ${phraseOf(vocab, key, state.ladders[key])}${key === "light" && state.from ? ` ${vocab.lightFrom[state.from].says}` : ""}`])]),
    ]);
  };
  section.replaceChildren(
    ...BANDS.map(([band, keys]) => node("div", { class: `band band-${band}` }, [node("h2", { class: "band-name" }, [band]), ...keys.map(ladder)])),
    node("div", { class: "band" }, [
      node("h2", { class: "band-name" }, ["swap"]),
      node("div", { class: "ladder neighbours" }, [
        node("div", { class: "ladder-head" }, [
          node("span", { class: "key" }, ["kin"]),
          node("span", { class: "tools" }, [node("button", { type: "button", class: "roll all", title: "roll every ladder not kept", onclick: () => set(null) }, ["roll all"])]),
        ]),
        node("div", { class: "rungs" }, state.layers.flatMap(({ material }, i) => neighbours(vocab, material).map((other) => node("a", { href: swapHref(state, i, other) }, [`${material.word} → ${other.word}`])))),
      ]),
    ]),
  );
  centreRungs(section);
}

/* ── pivots: moves that teach a technique ────────────────────── */

/** Techniques tried, kept in this browser only, shown and forgettable. */
function learned() { try { return new Set(JSON.parse(localStorage.getItem(LEARNED) ?? "[]")); } catch { return new Set(); } }
function learn(id) { try { const tried = learned(); tried.add(id); localStorage.setItem(LEARNED, JSON.stringify([...tried])); } catch { /* a private window keeps nothing */ } }
function forget() { try { localStorage.removeItem(LEARNED); } catch { /* nothing kept */ } }

function pivotValue(state, id) {
  return { chaos: state.params.chaos, weird: state.params.weird, stylize: state.params.stylize, seed: state.params.seed,
    raw: state.params.raw ? "on" : null, sref: state.params.sref ? "on" : null, permute: state.perm, weigh: state.weigh ? "on" : null,
    tile: state.ladders.format === "tile" ? "on" : null, exclude: state.exclude || null,
    lens: state.ladders.lens !== "none" ? state.ladders.lens : null }[id] ?? null;
}

function drawPivots(vocab, state, pivot) {
  const section = $(".pivots");
  section.hidden = false;
  const tried = learned();
  section.replaceChildren(
    node("h2", { class: "band-name" }, ["pivot"]),
    node("div", { class: "pivot-row" }, vocab.pivots.map((p) => {
      const t = vocab.techniques[p.technique];
      const value = pivotValue(state, p.id);
      return node("div", { class: `pivot${value !== null ? " set" : ""}` }, [
        node("button", { type: "button", onclick: () => { learn(p.technique); pivot(p); } }, [p.label, value !== null ? node("span", { class: "value" }, [` ${value}`]) : ""]),
        node("span", { class: "says" }, [p.says]),
        node("span", { class: "technique" }, [node("code", {}, [t.syntax]), ` ${t.note} `, node("a", { href: t.source, rel: "noopener", target: "_blank" }, ["source"])]),
      ]);
    })),
    node("div", { class: "learned" }, [
      node("span", { class: "key" }, ["learned here"]),
      ...Object.entries(vocab.techniques).map(([id, t]) => node("span", { class: `chip${tried.has(id) ? " tried" : ""}`, title: `${t.syntax}: ${t.note}` }, [t.name])),
      node("span", { class: "count" }, [`${[...tried].filter((id) => id in vocab.techniques).length} of ${Object.keys(vocab.techniques).length} tried, kept in this browser`]),
      node("button", { type: "button", onclick: () => { forget(); pivot(null); } }, ["forget"]),
    ]),
  );
}

/** Apply one pivot to the address. */
function applyPivot(vocab, state, url, p) {
  const q = url.searchParams;
  const cycle = (key, steps, fallback) => {
    const current = state.params[key] ?? fallback;
    const next = steps[(steps.indexOf(current) + 1) % steps.length] ?? steps[0];
    if (next === fallback) q.delete(key); else q.set(key, String(next));
  };
  if (p.id === "invert") {
    const marks = state.layers.map(({ mark }) => (mark === "?" ? "%3F" : mark));
    const view = state.view ? `/${state.view}@` : "";
    url.pathname = `${view}/${state.layers.map(({ material }) => material.slug).reverse().map((word, i) => `${marks[i]}${word}`).join("/")}`;
  } else if (p.id === "tile") {
    q.set("format", state.ladders.format === "tile" ? "plate" : "tile");
  } else if (p.id === "exclude") {
    const first = state.layers[0]?.material;
    const pool = first?.cls ? vocab.classes[first.cls].qualities : ["glare", "grain", "blur"];
    const next = pool[pool.indexOf(state.exclude) + 1];
    if (next) q.set("exclude", next); else q.delete("exclude");
  } else if (p.id === "permute") {
    const keys = ["light", "scale", "process", "scene", "lens"];
    const next = keys[(keys.indexOf(state.perm) + 1)];
    if (next) q.set("perm", next); else q.delete("perm");
  } else if (p.id === "weigh" || p.id === "raw") {
    if (q.has(p.id)) q.delete(p.id); else q.set(p.id, "1");
  } else if (p.id === "sref") {
    if (q.has("sref")) q.delete("sref"); else q.set("sref", "random");
  } else if (p.id === "seed") {
    q.set("seed", String(Math.floor(Math.random() * 4294967295)));
  } else if (p.id === "lens") {
    const others = vocab.ladders.lens.filter((w) => w !== state.ladders.lens && w !== "none");
    q.set("lens", slug(others[Math.floor(Math.random() * others.length)]));
  } else if (p.steps) {
    cycle(p.id, p.steps, p.id === "stylize" ? 100 : 0);
  }
}

/* ── the card: one composition across its modes ──────────────── */

/** A button that copies, and says so for a moment. */
function copyButton(label, text) {
  const button = node("button", { type: "button", class: "action" }, [label]);
  button.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(text); button.textContent = "copied"; } catch { button.textContent = "select it"; }
    setTimeout(() => { button.textContent = label; }, 1400);
  });
  return button;
}

/** A reading made here, in the browser, and handed over as a file. */
function takeAs(ext, filename, text, type) {
  return node("button", { type: "button", class: "ext", onclick: () => {
    const link = node("a", { href: URL.createObjectURL(new Blob([text], { type })), download: `${filename}.${ext}` });
    document.body.append(link);
    link.click();
    link.remove();
  } }, [`.${ext}`]);
}

/* ── the square style card: one composition, marked with its day ── */

const TONES = { paper: { band: "#f2f0eb", ink: "#1d1d1b", mark: "#c8402a" }, ink: { band: "#1d1d1b", ink: "#f2f0eb", mark: "#ef6a52" }, signal: { band: "#c8402a", ink: "#fdfcf8", mark: "#1d1d1b" } };

/** What the band says, by the face ladder. */
function faceText(vocab, state) {
  const { plain } = prompts(vocab, state);
  return { title: state.layers.map(({ material }) => material.word).join(" · "), prompt: plain, spw: spwLine(state),
    facets: Object.keys(vocab.ladders).filter((k) => !["face", "tone"].includes(k)).map((k) => state.ladders[k]).filter((w) => w !== "none" && w !== "as drawn").join(" · ") }[state.ladders.face];
}

/** Words broken into lines of about n characters, for SVG text. */
const lines = (text, n) => text.split(" ").reduce((out, word) => { const last = out[out.length - 1]; if (last && (last + " " + word).length <= n) out[out.length - 1] = `${last} ${word}`; else out.push(word); return out; }, []);
const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** The card as one SVG file: the sketch in a foreignObject under its filter, the band and the day's mark as type. */
function styleCardSvg(vocab, state, address) {
  const tone = TONES[state.ladders.tone];
  // Images by their full address, so the card still draws once it is saved elsewhere.
  const layers = [...$(".layers").children].map((layer) => `<div xmlns="http://www.w3.org/1999/xhtml" style="${esc(`position:absolute;inset:0;background-repeat:repeat;${layer.style.cssText.replaceAll('url("/', `url("${ORIGIN}/`)}`)}"></div>`).join("");
  const text = faceText(vocab, state);
  const big = state.ladders.face === "title";
  const body = lines(text, big ? 26 : 46).slice(0, big ? 3 : 6);
  const size = big ? 64 : 34, lead = big ? 72 : 44;
  const bandTop = 1080 - 120 - body.length * lead;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
<defs><filter id="material" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">${filterMarkup(state, vocab.palettes, vocab.lightFrom)}</filter></defs>
<foreignObject x="0" y="0" width="1080" height="1080"><div xmlns="http://www.w3.org/1999/xhtml" style="position:relative;width:1080px;height:1080px;filter:url(#material)">${layers}</div></foreignObject>
<rect x="0" y="0" width="1080" height="96" fill="${tone.band}"/>
<text x="48" y="62" font-family="ui-monospace, Menlo, monospace" font-size="30" letter-spacing="3" fill="${tone.mark}">FIG. ${figureOf(state.day)}</text>
<text x="1032" y="62" text-anchor="end" font-family="ui-monospace, Menlo, monospace" font-size="30" letter-spacing="3" fill="${tone.ink}">${state.day}</text>
<rect x="0" y="${bandTop}" width="1080" height="${1080 - bandTop}" fill="${tone.band}"/>
${body.map((line, i) => `<text x="48" y="${bandTop + 64 + i * lead}" font-family="Georgia, serif" font-size="${size}" fill="${tone.ink}">${esc(line)}</text>`).join("\n")}
<text x="48" y="1048" font-family="ui-monospace, Menlo, monospace" font-size="22" fill="${tone.mark}">${esc(address.replace(/^https?:\/\//, "").slice(0, 84))}</text>
</svg>
`;
}

/** The card on the page, square, as it will be saved. */
function drawStyleCard(vocab, state) {
  const tone = TONES[state.ladders.tone];
  const sketch = $(".layers").cloneNode(true);
  const square = node("figure", { class: `style-card face-${state.ladders.face}`, "aria-label": "Square style card" }, [
    sketch,
    node("figcaption", { class: "style-mark" }, [node("span", {}, [`Fig. ${figureOf(state.day)}`]), node("span", {}, [state.day])]),
    node("p", { class: "style-band" }, [faceText(vocab, state)]),
  ]);
  square.style.setProperty("--band", tone.band);
  square.style.setProperty("--band-ink", tone.ink);
  square.style.setProperty("--band-mark", tone.mark);
  return square;
}

/**
 * The composition framed on attention.productions. It reads these in texture's
 * words (scale as its shot, format as its frame) as its nearest rungs; light,
 * wear and process are words it holds as they are, so the look arrives whole.
 */
function shotHrefOf(state) {
  const primary = state.layers.find(({ material }) => material.cls)?.material ?? null;
  // The layers as texture writes them (/vellum/~moss); attention.productions reads them as one composite subject.
  const layers = state.layers.map(({ material, mark }) => `${mark === "?" ? "%3F" : mark}${material.slug}`).join("/");
  const query = [...[["shot", "scale"], ["light", "light"], ["ratio", "format"], ["wear", "wear"], ["process", "process"], ["palette", "palette"]]
    .map(([theirs, ours]) => `${theirs}=${slug(state.ladders[ours])}`), ...(state.from ? [`from=${state.from}`] : []), "via=texture.website",
    // The address left behind, so attention.productions' way back changes only what was tuned there.
    `back=${encodeURIComponent(location.pathname + location.search)}`].join("&");
  return `https://attention.productions/${layers}?${primary ? `material=${primary.slug}&` : ""}${query}`;
}

/** Teal Stripes Vibes' seed for a light: a lamp through teal glass, a harbor at dusk, ink on a ledger line. */
const SEED_BY_LIGHT = { lamplight: "lantern", "raking dawn": "lantern", "sodium night": "harbor", overcast: "harbor", noon: "ledger" };

/**
 * The set's ring and the set's pinch on words. The ring asks what to carry when
 * it opens, so each site receives the composition as it stands: framed as a
 * shot, held on the canvas, taken apart on spw.quest, captioned on the stripes.
 */
function joinTheSet(vocab, url) {
  mountSetRing("texture.website", () => {
    if (!vocab) return {};
    const state = stateOf(url, vocab);
    const line = spwLine(state);
    const words = state.layers.map(({ material }) => material.word).join(" · ");
    const seed = SEED_BY_LIGHT[state.ladders.light] ?? "ledger";
    return {
      "attention.productions": { href: shotHrefOf(state), says: `${words}, framed as a shot at this distance and light` },
      "factshift.center": { href: `https://factshift.center/?spw=${encodeURIComponent(line)}`, says: "this composition's line, held on the canvas" },
      "spw.quest": { href: `https://spw.quest/build#spw64=${spw64(line)}`, says: "this line, taken apart a slot at a time" },
      "tealstripesvibes.com": { href: `https://tealstripesvibes.com/${seed}?say=${encodeURIComponent(words.slice(0, 60))}`, says: `${seed}'s stripes, captioned "${words}"` },
    };
  });
  // Two fingers on the words size them, as on every site in the set; the stage keeps the browser's own zoom.
  mountTextScale(document.querySelector("main"), { ignore: ".stage" });
}

function drawCard(vocab, state, address, onStep, onCycleView) {
  const { midjourney, plain } = prompts(vocab, state);
  const line = spwLine(state);
  const name = state.layers.map(({ material, mark }) => `${mark === "?" ? "q" : mark === "." ? "" : mark}${material.slug}`).join("").replace(/[^a-z0-9~*^=@!%-]/g, "") || "texture";
  // The facets that shape the prompt, leaving out the card's own and any left at none.
  const images = state.layers.filter(({ material }) => material.cls).map(({ material }) => imageOf(material));
  const facets = Object.keys(vocab.ladders).filter((key) => !["face", "tone"].includes(key)).map((key) => state.ladders[key]).filter((word) => word !== "none" && word !== "as drawn");
  const json = JSON.stringify({ address, layers: state.layers.map(({ material, mark }) => ({ word: material.word, class: material.cls, mark })), ladders: state.ladders, prompts: { midjourney, plain }, spw: line }, null, 2);
  const md = `## ${state.layers.map(({ material }) => material.word).join(" · ")}\n\n${plain}\n\n\`\`\`\n${midjourney}\n\`\`\`\n\n\`${line}\`\n\n${address}\n`;
  const spwFile = `#>texture_card\n#:texture #!${state.ladders.format}\n\n${line}\n\nprompt: "${plain.replaceAll('"', "'")}"\naddress: "${address}"\n`;
  const primaryListed = state.layers.find(({ material }) => material.cls)?.material ?? null;
  const cssSnippet = primaryListed
    ? `background-image: url("${imageOf(primaryListed)}");\nbackground-size: ${PERIOD[state.ladders.scale] * 8}px ${PERIOD[state.ladders.scale] * 8}px;\nbackground-repeat: repeat;`
    : "";
  const shotHref = shotHrefOf(state);
  const canvasHref = `https://factshift.center/?spw=${encodeURIComponent(line)}`;
  const questHref = `https://spw.quest/build?script=${encodeURIComponent(line)}`;
  const thumb = node("div", { class: "thumb", "aria-hidden": "true" }, [$(".layers").cloneNode(true)]);
  thumb.style.aspectRatio = $(".stage").style.aspectRatio;
  $(".card").replaceChildren(
    node("header", { class: "card-head" }, [node("span", { class: "key" }, [$(".slide .fig").textContent]), node("span", { class: "card-title" }, [state.layers.map(({ material }) => material.word).join(" · ")])]),
    node("div", { class: "card-body" }, [
      thumb,
      node("div", { class: "card-words" }, [
        node("p", { class: "card-prompt" }, [plain]),
        node("ol", { class: "anatomy" }, [...anatomy(vocab, state).filter(([, text]) => text).map(([part, text]) => node("li", {}, [node("span", { class: "key" }, [part]), " ", text])), node("li", {}, [node("span", { class: "key" }, ["parameters"]), " ", parameters(vocab, state)])]),
        node("p", { class: "card-facets" }, [facets.join(" · ")]),
        node("p", { class: "card-line" }, [onStep ? spwLineNode(vocab, state, onStep, onCycleView) : node("code", {}, [line])]),
      ]),
    ]),
    drawStyleCard(vocab, state),
    node("div", { class: "card-actions" }, [
      copyButton("midjourney", midjourney),
      ...(images.length ? [copyButton("midjourney + images", `${midjourney} --sref ${images.join(" ")} --sw 250`)] : []),
      copyButton("prompt", plain), copyButton("spw", line),
      ...(cssSnippet ? [copyButton("css", cssSnippet)] : []),
      copyButton("link", address),
    ]),
    node("div", { class: "card-doors" }, [
      node("span", { class: "key" }, ["open in"]),
      node("a", { href: shotHref }, ["attention.productions (frame shot) ↗"]),
      node("a", { href: canvasHref }, ["factshift.center (canvas) ↗"]),
      node("a", { href: questHref }, ["spw.quest (build) ↗"]),
    ]),
    images.length ? node("div", { class: "images" }, [node("span", { class: "key" }, ["images"]), ...state.layers.filter(({ material }) => material.cls).map(({ material }) =>
      node("span", { class: "image-link" }, [node("img", { src: `/${material.slug}.png`, alt: "", width: 40, height: 40 }), node("a", { href: `/${material.slug}.png` }, [material.word]), copyButton("copy image link", imageOf(material))]))]) : "",
    node("footer", { class: "card-foot" }, [
      node("div", { class: "take" }, [node("span", { class: "key" }, ["take it as"]), takeAs("txt", name, `${plain}\n\n${midjourney}\n`, "text/plain"), takeAs("spw", name, spwFile, "text/plain"), takeAs("json", name, json, "application/json"), takeAs("md", name, md, "text/markdown"), takeAs("svg", `${name}-${state.day}`, styleCardSvg(vocab, state, address), "image/svg+xml")]),
      node("div", { class: "readings" }, [node("span", { class: "key" }, ["each material"]), ...state.layers.filter(({ material }) => material.cls).map(({ material }) => node("span", { class: "reading" }, [material.word, " ", node("a", { href: `/${material.slug}.png` }, [".png"]), " ", node("a", { href: `/${material.slug}.txt` }, [".txt"]), " ", node("a", { href: `/${material.slug}.spw` }, [".spw"])]))]),
      node("p", { class: "card-address" }, [address.replace(/^https?:\/\//, "")]),
    ]),
  );
}

/**
 * Words shared from another app (the manifest's share_target sends /share). A
 * texture.website address opens as itself; otherwise each phrase, split at a
 * comma or a line, is a material, up to three, in the order they were shared.
 */
function readShare(url) {
  const said = ["url", "text", "title"].map((key) => url.searchParams.get(key) ?? "").join("\n");
  const own = said.match(/https:\/\/texture\.website(\/[^\s]*)?/);
  if (own) {
    const there = new URL(own[0]);
    url.pathname = there.pathname;
    url.search = there.search;
  } else {
    const phrases = said.replace(/https?:\/\/\S+/g, "").split(/[,;\n]+/).map((phrase) => slug(phrase).slice(0, 40).replace(/-$/, "")).filter(Boolean).slice(0, 3);
    url.pathname = `/${phrases.join("/")}`;
    url.search = "";
  }
  history.replaceState(null, "", url);
}

/**
 * Register the service worker, then, once the page is idle, ask it to keep
 * every material's picture (about a megabyte) so the catalog opens offline.
 * Not on a connection saving data, and not offline; the catalog says how many
 * are kept.
 */
function keepOffline() {
  if (!("serviceWorker" in navigator) || window.top !== window) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {});
  const connection = navigator.connection;
  if (!navigator.onLine || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? "")) return;
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type !== "pictures-kept") return;
    const note = $(".catalog-kept");
    if (!note) return;
    const { kept, of } = event.data;
    note.textContent = kept >= of ? `All ${of} materials are kept on this device; the catalog opens offline.` : `${kept} of ${of} materials kept on this device so far.`;
    note.hidden = false;
  });
  const ask = () => navigator.serviceWorker.ready.then((registration) => registration.active?.postMessage({ type: "keep-pictures" }));
  if ("requestIdleCallback" in window) requestIdleCallback(ask, { timeout: 8000 });
  else setTimeout(ask, 2500);
}

/**
 * How the address was read, said once on arrival. A neighbour's ladder word
 * (attention.productions' close-up) is taken as its nearest rung, and the
 * address is rewritten in this site's words, so what is shared from here reads
 * the same. A path word that is a slip from a listed material keeps the
 * reader's word and offers the listed one.
 */
function sayArrival(vocab, url) {
  const note = $(".read-note");
  if (!note) return;
  const state = stateOf(url, vocab);
  for (const r of state.reads) {
    if (r.word) url.searchParams.set(r.key, slug(r.word));
    else url.searchParams.delete(r.key);
  }
  if (state.reads.length) history.replaceState(null, "", url);
  const view = state.view ? `/${state.view}@` : "";
  const pathWith = (swap) => `${view}/${state.layers.map((l) => `${l.mark === "?" ? "%3F" : l.mark}${l === swap ? swap.near.slug : l.material.slug}`).join("/")}`;
  const offers = state.layers.filter((layer) => layer.near).map((layer) =>
    [`${layer.material.word}: near `, node("a", { href: `${pathWith(layer)}${url.search}` }, [layer.near.word]), " "]);
  const line = readNote(state.reads);
  if (!line && !offers.length) return;
  note.replaceChildren(...(line ? [line, offers.length ? " · " : ""] : []), ...offers.flat());
  note.hidden = false;
}

async function main() {
  const vocab = await (await fetch("/vocabulary.json")).json();
  document.body.classList.add("composed");
  const url = new URL(location.href);
  if (url.pathname === "/share") readShare(url);
  if (url.pathname === "/catalog" || url.pathname === "/catalog/") { $(".slide").hidden = true; $(".card").hidden = true; joinTheSet(null, url); keepOffline(); return; }
  sayArrival(vocab, url);
  const render = (focusKey) => {
    const state = stateOf(url, vocab);
    const locks = new Set((url.searchParams.get("lock") ?? "").split(",").filter((key) => key in vocab.ladders));
    document.body.dataset.view = state.view || "studio";
    const words = state.byDay ? "" : state.layers.map(({ material, mark }) => `${mark === "?" ? "%3F" : mark}${material.slug}`).join("/");
    for (const link of document.querySelectorAll(".views a")) {
      const key = (link.getAttribute("href").match(/^\/([a-z-]+)@/) ?? [])[1] ?? "";
      link.href = `${key ? `/${key}@` : ""}/${words}${url.search}`;
      if (key === state.view) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
    }
    const onDay = (delta) => {
      url.searchParams.set("day", isoOf(dayNumber(state.day) + delta));
      url.searchParams.delete("d");
      history.replaceState(null, "", url);
      render();
    };
    const onSlot = (slotKey, delta, scrubbing) => {
      if (delta) {
        const live = stateOf(url, vocab);
        const words = vocab.ladders[slotKey] || [];
        const idx = Math.max(0, words.indexOf(live.ladders[slotKey]));
        const next = words[(idx + delta + words.length) % words.length];
        if (next) url.searchParams.set(slotKey, slug(next));
        history.replaceState(null, "", url);
      }
      if (scrubbing && delta) {
        paintLive(vocab, stateOf(url, vocab), slotKey);
        return;
      }
      render(`slot:${slotKey}`);
    };
    const onCycleView = () => {
      const viewKeys = ["", ...Object.keys(vocab.views)];
      const nextKey = viewKeys[(viewKeys.indexOf(state.view) + 1) % viewKeys.length];
      url.pathname = `${nextKey ? `/${nextKey}@` : ""}${words ? `/${words}` : "/"}`;
      history.replaceState(null, "", url);
      render("persona");
    };
    drawStage(vocab, state);
    drawSlide(vocab, state, onDay);
    drawTune(vocab, state, (change, key) => {
      for (const [k, value] of Object.entries(change)) url.searchParams.set(k, value);
      history.replaceState(null, "", url);
      render(key);
    });
    drawPanel(vocab, state, onSlot, onCycleView);
    drawLayerBar(vocab, state, url, () => {
      history.replaceState(null, "", url);
      render();
    });
    drawPivots(vocab, state, (p) => {
      if (p) applyPivot(vocab, state, url, p);
      history.replaceState(null, "", url);
      render();
    });
    drawLadders(vocab, state, locks, (change, key) => {
      if (change === null) {
        // Roll every unlocked ladder; a locked one keeps its word in the address.
        const seed = Math.floor(Math.random() * 1e6);
        Object.entries(vocab.ladders).forEach(([k, words], i) => {
          if (locks.has(k)) url.searchParams.set(k, slug(state.ladders[k]));
          else url.searchParams.set(k, slug(words[mix(seed + i * 97) % words.length]));
        });
        url.searchParams.delete("r");
      } else if (change.lock) {
        if (locks.has(change.lock)) locks.delete(change.lock); else { locks.add(change.lock); url.searchParams.set(change.lock, slug(state.ladders[change.lock])); }
        if (locks.size) url.searchParams.set("lock", [...locks].join(",")); else url.searchParams.delete("lock");
      } else {
        for (const [k, value] of Object.entries(change)) { if (value == null) url.searchParams.delete(k); else url.searchParams.set(k, value); }
      }
      history.replaceState(null, "", url);
      render(key);
    });
    drawCard(vocab, state, url.href, onSlot, onCycleView);
    if (focusKey === "persona") {
      const personas = [...document.querySelectorAll(".spw-persona-btn")];
      (personas.find((el) => el.offsetParent) ?? personas[0])?.focus();
    } else if (focusKey && focusKey.startsWith("slot:")) {
      const key = focusKey.slice(5);
      const slots = [...document.querySelectorAll(`.spw-slot[data-key="${key}"]`)];
      (slots.find((el) => el.offsetParent) ?? slots[0])?.focus();
    } else if (focusKey) {
      document.querySelector(`.rungs[aria-label="${focusKey}"] [aria-checked="true"]`)?.focus();
    }
  };
  // Split view: the drawn materials left of a line, the tuned picture right of it. Drag across the picture, or use the arrows on the line.
  const stageEl = $(".stage");
  const splitToggle = $(".split-toggle");
  const splitHandle = $(".split-handle");
  const setSplit = (pct) => {
    const at = Math.max(4, Math.min(96, Math.round(pct)));
    stageEl.style.setProperty("--split", `${at}%`);
    splitHandle?.setAttribute("aria-valuenow", String(at));
  };
  splitToggle?.addEventListener("click", () => {
    const on = stageEl.classList.toggle("split");
    splitToggle.setAttribute("aria-pressed", String(on));
    if (splitHandle) splitHandle.hidden = !on;
    render();
  });
  let splitting = null;
  const splitTo = (event) => { const box = stageEl.getBoundingClientRect(); setSplit(((event.clientX - box.left) / box.width) * 100); };
  stageEl?.addEventListener("pointerdown", (event) => {
    if (!stageEl.classList.contains("split") || (event.button && event.button !== 0)) return;
    splitting = event.pointerId;
    try { stageEl.setPointerCapture(event.pointerId); } catch { /* a pointer the stage cannot hold still moves the line once */ }
    splitTo(event);
  });
  stageEl?.addEventListener("pointermove", (event) => { if (splitting === event.pointerId) splitTo(event); });
  for (const type of ["pointerup", "pointercancel"]) stageEl?.addEventListener(type, () => { splitting = null; });
  splitHandle?.addEventListener("keydown", (event) => {
    const by = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, Home: -100, End: 100 }[event.key];
    if (!by) return;
    event.preventDefault();
    setSplit(Number(splitHandle.getAttribute("aria-valuenow")) + by);
  });
  const tileToggle = $(".tile-toggle");
  tileToggle?.addEventListener("click", () => {
    const next = !$(".stage").classList.toggle("tiled");
    tileToggle.setAttribute("aria-pressed", String(!next));
    render();
  });
  document.querySelector(".catalog-filters")?.addEventListener("click", (e) => {
    const btn = e.target.closest?.("button[data-class]");
    if (!btn) return;
    const chosen = btn.dataset.class;
    for (const b of document.querySelectorAll(".catalog-filters button")) b.setAttribute("aria-pressed", String(b === btn));
    for (const article of document.querySelectorAll(".catalog .class[data-class]")) {
      article.hidden = chosen !== "all" && article.dataset.class !== chosen;
    }
  });
  render();
  mountCleanStill({ key: "p", idleMs: 4500 });
  joinTheSet(vocab, url);
  keepOffline();
}

main().catch(() => document.body.classList.remove("composed"));
