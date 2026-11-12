// texture.website: a studio for building material prompts. The address is the
// prompt. Each word in the path is a material, bottom first; a mark before a word
// is how it meets the one before (~ drifting through, * heavy with). Each ladder
// (scale, light, wear, process, scene, format) is a row of words written into the
// sentence as they stand. The stage sketches the words: each material's class
// gives a drawn base and its word gives the hue, and an SVG filter built from the
// ladders lights it, wears it and prints it. Nothing here runs on a server.

const MARKS = ".^*~=@?!%";
const NO = "--no text, letters, logo, watermark";
const DEFAULTS = { scale: "close", light: "overcast", wear: "handled", process: "as found", scene: "wall", format: "tile", lens: "none", beat: "none", trace: "none", face: "title", tone: "paper" };
const LEARNED = "texture.learned";
const $ = (selector) => document.querySelector(selector);
const slug = (word) => word.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function node(tag, props = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) if (k === "class") n.className = v; else if (k in n) n[k] = v; else n.setAttribute(k, v);
  for (const c of children.flat()) if (c !== "" && c != null) n.append(c);
  return n;
}

const dayNumber = (iso) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86400000);
const isoOf = (n) => new Date(n * 86400000).toISOString().slice(0, 10);
const mix = (n) => { let x = Math.imul((n ^ (n >>> 16)) >>> 0, 0x45d9f3b); x = Math.imul((x ^ (x >>> 16)) >>> 0, 0x45d9f3b); return (x ^ (x >>> 16)) >>> 0; };
const hash = (text) => [...text].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);

/* ── reading the address ─────────────────────────────────────── */

/** The view a first path word names (minimalist@), or none. */
function viewOf(vocab, pathname, q) {
  const first = decodeURIComponent(pathname.split("/").filter(Boolean)[0] ?? "");
  const named = first.endsWith("@") ? slug(first.slice(0, -1)) : slug(q.get("view") ?? "");
  return named in vocab.views ? named : "";
}

function readPath(vocab, pathname) {
  const bySlug = new Map(vocab.materials.map((m) => [m.slug, m]));
  return pathname.split("/").filter(Boolean).filter((raw) => !decodeURIComponent(raw).endsWith("@")).map((raw) => {
    const part = decodeURIComponent(raw);
    const mark = MARKS.includes(part[0]) ? part[0] : "";
    const key = slug(mark ? part.slice(1) : part);
    return { mark, material: bySlug.get(key) ?? { word: key.replace(/-/g, " "), slug: key, cls: null } };
  }).filter(({ material }) => material.slug);
}

/** A day's pair: two materials from different classes, met by a mark, all from the date. */
function daily(vocab, day) {
  const all = vocab.materials;
  const first = all[day % all.length];
  const others = all.filter((m) => m.cls !== first.cls);
  return [{ mark: "", material: first }, { mark: MARKS[mix(day + 3) % MARKS.length], material: others[mix(day) % others.length] }];
}

function stateOf(url, vocab) {
  const q = url.searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(q.get("day") ?? "") ? q.get("day") : isoOf(dayNumber(today) + (Number.parseInt(q.get("d") ?? "0", 10) || 0));
  const roll = Number.parseInt(q.get("r") ?? "", 10);
  const ladders = {};
  Object.entries(vocab.ladders).forEach(([key, words], i) => {
    const asked = words.find((word) => slug(word) === slug(q.get(key) ?? ""));
    ladders[key] = asked ?? (Number.isFinite(roll) ? words[mix(roll + i * 97) % words.length] : DEFAULTS[key]);
  });
  const view = viewOf(vocab, url.pathname, q);
  if (view === "story-designer" && !q.get("format")) ladders.format = "plate";
  const num = (key, lo, hi) => { const n = Number.parseInt(q.get(key) ?? "", 10); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : null; };
  const read = readPath(vocab, url.pathname);
  return {
    day, ladders, view,
    params: { chaos: num("chaos", 0, 100), weird: num("weird", 0, 3000), stylize: num("stylize", 0, 1000), seed: num("seed", 0, 4294967295), raw: q.has("raw"), sref: q.get("sref") === "random" },
    perm: q.get("perm") in vocab.ladders ? q.get("perm") : null,
    weigh: q.has("weigh"),
    layers: read.length ? read : daily(vocab, dayNumber(day)),
    byDay: read.length === 0,
    say: (q.get("say") ?? "").slice(0, 140), as: q.get("as") ?? ".",
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
  const { scale, light, wear, process, scene, format, lens, beat, trace } = state.ladders;
  const p = vocab.phrases;
  const phrase = (key, word) => {
    if (state.perm !== key) return p[key][word];
    const words = vocab.ladders[key].filter((w) => p[key][w]);
    const start = Math.max(0, words.indexOf(word));
    return `{${[0, 1, 2, 3].map((i) => p[key][words[(start + i) % words.length]]).join(", ")}}`;
  };
  const subject = state.weigh && state.layers.length > 1
    ? state.layers.map(({ material }, i) => `${material.word}::${i ? 1 : 2}`).join(" ")
    : sentence(vocab, state.layers);
  if (state.view === "minimalist") return [["subject", `${vocab.formats[format].lead} ${subject}`], ["light", phrase("light", light)]];
  if (state.view === "story-designer") {
    // A story opens on its setting, then what it is made of: "a floor of rain on glass heavy with moquette".
    const SETTING = { wall: "a wall", floor: "a floor", table: "a tabletop", costume: "a costume", sky: "a sky", page: "a page" };
    return [["setting", `${SETTING[scene]} of ${subject}`], ["light", phrase("light", light)],
      ["wear", p.wear[wear]], ["trace", p.trace[trace]], ["moment", p.beat[beat]], ["lens", p.lens[lens]]];
  }
  return [["subject", `${vocab.formats[format].lead} ${subject}`], ["scale", phrase("scale", scale)], ["light", phrase("light", light)],
    ["wear", [p.wear[wear], ...qualities(vocab, state.layers)].join(", ")], ["process", phrase("process", process)],
    ["scene", phrase("scene", scene)], ["lens", phrase("lens", lens)]];
}

/** The parameters a prompt ends with: the format's, then each pivot that is set. */
function parameters(vocab, state) {
  const { chaos, weird, stylize, seed, raw, sref } = state.params;
  return [vocab.formats[state.ladders.format].params, NO,
    chaos ? `--chaos ${chaos}` : "", weird ? `--weird ${weird}` : "", stylize !== null && stylize !== 100 ? `--stylize ${stylize}` : "",
    raw ? "--raw" : "", sref ? "--sref random" : "", seed !== null ? `--seed ${seed}` : ""].filter(Boolean).join(" ");
}

function prompts(vocab, state) {
  const parts = anatomy(vocab, state).map(([, text]) => text).filter(Boolean);
  return { midjourney: `${parts.join(", ")} ${parameters(vocab, state)}`, plain: `${parts.join(", ").replace(/::\d/g, "").replace(/[{}]/g, "")}.` };
}

/**
 * The composition as one line in Spw's slot order, word[mode]{body}: the ladders
 * sit in the first material's mode and the rest nest in its body, so the line
 * pastes onto factshift.center (2026-11-12: written mode-after-body, it held nothing).
 */
const spwLine = (state) => {
  const [first, ...rest] = state.layers;
  const inner = rest.reduceRight((acc, { material, mark }) => `${mark}${material.slug}${acc ? `{${acc}}` : ""}`, "");
  const mode = [state.ladders.light, state.ladders.wear, state.ladders.process].map(slug).join(", ");
  return `${first.mark}${first.material.slug}[${mode}]${inner ? `{${inner}}` : ""}`;
};

/* ── the sketch ──────────────────────────────────────────────── */

const PERIOD = { macro: 96, close: 48, "arm's length": 28, room: 16, far: 9 };
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

/** The SVG filter for these ladders: wear warps and roughens, light rakes across, process prints. */
function filterMarkup(state) {
  const L = LIGHT[state.ladders.light], W = WEAR[state.ladders.wear];
  return `<feTurbulence type="fractalNoise" baseFrequency="${W.freq}" numOctaves="3" seed="${hash(state.layers.map((l) => l.material.slug).join()) % 97}" result="noise"/>
<feDisplacementMap in="SourceGraphic" in2="noise" scale="${W.warp}" xChannelSelector="R" yChannelSelector="G" result="worn"/>
<feDiffuseLighting in="noise" surfaceScale="${W.relief}" lighting-color="${L.color}" result="light"><feDistantLight azimuth="${L.az}" elevation="${L.el}"/></feDiffuseLighting>
<feComposite in="worn" in2="light" operator="arithmetic" k1="0.6" k2="0.62" k3="0" k4="0" result="lit"/>
${PROCESS[state.ladders.process]}`;
}

function drawStage(vocab, state) {
  const p = PERIOD[state.ladders.scale];
  $(".stage").style.aspectRatio = ASPECT[state.ladders.format];
  $(".layers").replaceChildren(...state.layers.map(({ material, mark }, i) => {
    const pairs = base(material, p);
    const layer = node("div", { class: `layer${vocab.relations[mark]?.drift ? " drift" : ""}` });
    layer.style.backgroundImage = pairs.map(([image]) => image).join(", ");
    layer.style.backgroundSize = pairs.map(([, size]) => size).join(", ");
    if (i > 0) { layer.style.mixBlendMode = vocab.relations[mark]?.blend ?? "normal"; layer.style.opacity = String(vocab.relations[mark]?.opacity ?? 0.6); }
    return layer;
  }));
  $("#material").innerHTML = filterMarkup(state);
  $(".layers").style.filter = "url(#material)";
  const bubble = $(".bubble");
  bubble.hidden = !state.say;
  bubble.textContent = state.say;
  bubble.dataset.shape = { "~": "thought", "?": "question", "!": "burst" }[state.as] ?? "statement";
}

/* ── the slide, the ladders, the prompts ─────────────────────── */

const figureOf = (iso) => dayNumber(iso) - dayNumber(`${iso.slice(0, 4)}-01-01`) + 1;

function drawSlide(vocab, state) {
  $(".slide .fig").textContent = `Fig. ${figureOf(state.day)}`;
  $(".slide .title").textContent = state.layers.map(({ material }) => material.word).join(" · ");
  $(".slide .when").textContent = state.byDay ? state.day : "";
  const first = state.layers[0].material;
  $(".caption").textContent = [first.cls ? vocab.classes[first.cls].science : `${first.word}: a material of no listed class; the prompt takes the word as it is.`, state.gatheredFor ? `Gathered for ${state.gatheredFor}.` : ""].filter(Boolean).join(" ");
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

/* ── configuration: ladders in three bands ────────────────────── */

const BANDS = [["look", ["scale", "light", "wear"]], ["make", ["process", "format", "lens"]], ["use", ["scene"]], ["story", ["beat", "trace"]], ["card", ["face", "tone"]]];

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
    return node("div", { class: `ladder${locked ? " locked" : ""}` }, [
      node("span", { class: "key" }, [key]),
      node("div", { class: "rung-column" }, [group, node("span", { class: "phrase" }, [`→ ${phraseOf(vocab, key, state.ladders[key])}`])]),
      node("span", { class: "tools" }, [
        node("button", { type: "button", class: "lock", "aria-pressed": String(locked), "aria-label": `${locked ? "unlock" : "lock"} ${key}`, onclick: () => set({ lock: key }) }, [locked ? "■" : "□"]),
        node("button", { type: "button", class: "roll", "aria-label": `roll ${key}`, disabled: locked, onclick: () => { const others = words.filter((w) => w !== state.ladders[key]); set({ [key]: slug(others[Math.floor(Math.random() * others.length)]) }); } }, ["↻"]),
      ]),
    ]);
  };
  section.replaceChildren(
    ...BANDS.map(([band, keys]) => node("div", { class: `band band-${band}` }, [node("h2", { class: "band-name" }, [band]), ...keys.map(ladder)])),
    node("div", { class: "band" }, [
      node("h2", { class: "band-name" }, ["swap"]),
      node("div", { class: "ladder neighbours" }, [
        node("span", { class: "key" }, ["kin"]),
        node("div", { class: "rungs" }, state.layers.flatMap(({ material }, i) => neighbours(vocab, material).map((other) => node("a", { href: swapHref(state, i, other) }, [`${material.word} → ${other.word}`])))),
        node("span", { class: "tools" }, [node("button", { type: "button", class: "roll all", "aria-label": "roll every unlocked ladder", onclick: () => set(null) }, ["↻ all"])]),
      ]),
    ]),
  );
}

/* ── pivots: moves that teach a technique ────────────────────── */

/** Techniques tried, kept in this browser only, shown and forgettable. */
function learned() { try { return new Set(JSON.parse(localStorage.getItem(LEARNED) ?? "[]")); } catch { return new Set(); } }
function learn(id) { try { const tried = learned(); tried.add(id); localStorage.setItem(LEARNED, JSON.stringify([...tried])); } catch { /* a private window keeps nothing */ } }
function forget() { try { localStorage.removeItem(LEARNED); } catch { /* nothing kept */ } }

function pivotValue(state, id) {
  return { chaos: state.params.chaos, weird: state.params.weird, stylize: state.params.stylize, seed: state.params.seed,
    raw: state.params.raw ? "on" : null, sref: state.params.sref ? "on" : null, permute: state.perm, weigh: state.weigh ? "on" : null,
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
    facets: Object.keys(vocab.ladders).filter((k) => !["face", "tone"].includes(k)).map((k) => state.ladders[k]).filter((w) => w !== "none").join(" · ") }[state.ladders.face];
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
<defs><filter id="material" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">${filterMarkup(state)}</filter></defs>
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

function drawCard(vocab, state, address) {
  const { midjourney, plain } = prompts(vocab, state);
  const line = spwLine(state);
  const name = state.layers.map(({ material, mark }) => `${mark === "?" ? "q" : mark === "." ? "" : mark}${material.slug}`).join("").replace(/[^a-z0-9~*^=@!%-]/g, "") || "texture";
  // The facets that shape the prompt, leaving out the card's own and any left at none.
  const images = state.layers.filter(({ material }) => material.cls).map(({ material }) => imageOf(material));
  const facets = Object.keys(vocab.ladders).filter((key) => !["face", "tone"].includes(key)).map((key) => state.ladders[key]).filter((word) => word !== "none");
  const json = JSON.stringify({ address, layers: state.layers.map(({ material, mark }) => ({ word: material.word, class: material.cls, mark })), ladders: state.ladders, prompts: { midjourney, plain }, spw: line }, null, 2);
  const md = `## ${state.layers.map(({ material }) => material.word).join(" · ")}\n\n${plain}\n\n\`\`\`\n${midjourney}\n\`\`\`\n\n\`${line}\`\n\n${address}\n`;
  const spwFile = `#>texture_card\n#:texture #!${state.ladders.format}\n\n${line}\n\nprompt: "${plain.replaceAll('"', "'")}"\naddress: "${address}"\n`;
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
        node("p", { class: "card-line" }, [node("code", {}, [line])]),
      ]),
    ]),
    drawStyleCard(vocab, state),
    node("div", { class: "card-actions" }, [
      copyButton("midjourney", midjourney),
      ...(images.length ? [copyButton("midjourney + images", `${midjourney} --sref ${images.join(" ")} --sw 250`)] : []),
      copyButton("prompt", plain), copyButton("spw", line), copyButton("link", address),
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

async function main() {
  const vocab = await (await fetch("/vocabulary.json")).json();
  document.body.classList.add("composed");
  const url = new URL(location.href);
  if (url.pathname === "/catalog" || url.pathname === "/catalog/") { $(".slide").hidden = true; $(".card").hidden = true; return; }
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
    drawStage(vocab, state);
    drawSlide(vocab, state);
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
        for (const [k, value] of Object.entries(change)) url.searchParams.set(k, value);
      }
      history.replaceState(null, "", url);
      render(key);
    });
    drawCard(vocab, state, url.href);
    if (focusKey) document.querySelector(`.rungs[aria-label="${focusKey}"] [aria-checked="true"]`)?.focus();
  };
  render();
}

main().catch(() => document.body.classList.remove("composed"));
