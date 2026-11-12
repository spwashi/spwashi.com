// texture.website: a studio for building material prompts. The address is the
// prompt. Each word in the path is a material, bottom first; a mark before a word
// is how it meets the one before (~ drifting through, * heavy with). Each ladder
// (scale, light, wear, process, scene, format) is a row of words written into the
// sentence as they stand. The stage sketches the words: each material's class
// gives a drawn base and its word gives the hue, and an SVG filter built from the
// ladders lights it, wears it and prints it. Nothing here runs on a server.

const MARKS = ".^*~=@?!%";
const NO = "--no text, letters, logo, watermark";
const DEFAULTS = { scale: "close", light: "overcast", wear: "handled", process: "as found", scene: "wall", format: "tile" };
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

function readPath(vocab, pathname) {
  const bySlug = new Map(vocab.materials.map((m) => [m.slug, m]));
  return pathname.split("/").filter(Boolean).map((raw) => {
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
  const read = readPath(vocab, url.pathname);
  return {
    day, ladders,
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

function prompts(vocab, state) {
  const { scale, light, wear, process, scene, format } = state.ladders;
  const p = vocab.phrases;
  const parts = [
    `${vocab.formats[format].lead} ${sentence(vocab, state.layers)}`,
    p.scale[scale], p.light[light],
    [p.wear[wear], ...qualities(vocab, state.layers)].join(", "),
    p.process[process], p.scene[scene],
  ].filter(Boolean);
  return { midjourney: `${parts.join(", ")} ${vocab.formats[format].params} ${NO} --v 7`, plain: `${parts.join(", ")}.` };
}

const spwLine = (state) => `${state.layers.reduceRight((inner, { material, mark }) => `${mark}${material.slug}${inner ? `{${inner}}` : ""}`, "")}[${[state.ladders.light, state.ladders.wear, state.ladders.process].map(slug).join(", ")}]`;

/* ── the sketch ──────────────────────────────────────────────── */

const PERIOD = { macro: 96, close: 48, "arm's length": 28, room: 16, far: 9 };
const ASPECT = { tile: "1 / 1", plate: "16 / 9", sheet: "4 / 5" };
const SAT = { paper: 22, textile: 48, stone: 10, wood: 42, metal: 6, glass: 30, ceramic: 52, pigment: 72, polymer: 18, organic: 46 };

/** A class's drawn base at period p, in the word's own hue. */
function base(material, p) {
  const h = hash(material.slug) % 360, s = SAT[material.cls] ?? 30;
  const c = (l, a = 1) => `hsl(${h} ${s}% ${l}% / ${a})`;
  const pairs = {
    paper: [[`repeating-linear-gradient(0deg, ${c(30, 0.12)} 0 1px, transparent 1px ${p}px)`, "auto"], [`linear-gradient(170deg, ${c(92)}, ${c(80)})`, "auto"]],
    textile: [[`repeating-linear-gradient(0deg, ${c(40, 0.55)} 0 ${p / 6}px, transparent ${p / 6}px ${p / 3}px)`, "auto"], [`repeating-linear-gradient(90deg, ${c(65, 0.7)} 0 ${p / 6}px, ${c(50)} ${p / 6}px ${p / 3}px)`, "auto"]],
    stone: [[`radial-gradient(circle, ${c(25, 0.5)} 0 1.5px, transparent 2px)`, `${p / 3}px ${p / 3}px`], [`radial-gradient(circle, ${c(90, 0.6)} 0 3px, transparent 4px)`, `${p * 0.9}px ${p * 0.7}px`], [`linear-gradient(${c(70)}, ${c(62)})`, "auto"]],
    wood: [[`repeating-linear-gradient(90deg, ${c(55)} 0 ${p * 0.3}px, ${c(35)} ${p * 0.34}px, ${c(62)} ${p * 0.8}px, ${c(50)} ${p}px)`, "auto"]],
    metal: [[`repeating-linear-gradient(0deg, ${c(82)} 0 1px, ${c(66)} 1px 2px, ${c(76)} 2px 3px)`, "auto"], [`linear-gradient(100deg, ${c(60)}, ${c(88)} 45%, ${c(58)})`, "auto"]],
    glass: [[`radial-gradient(circle, ${c(96, 0.8)} 0 2px, transparent 3px)`, `${p * 0.7}px ${p * 1.1}px`], [`linear-gradient(135deg, ${c(75)}, ${c(45)})`, "auto"]],
    ceramic: [[`linear-gradient(${c(30)} 2px, transparent 2px), linear-gradient(90deg, ${c(30)} 2px, transparent 2px)`, `${p * 2}px ${p * 2}px`], [`linear-gradient(${c(72)}, ${c(64)})`, "auto"]],
    pigment: [[`radial-gradient(circle at 30% 40%, ${c(45, 0.7)}, transparent 55%)`, `${p * 4}px ${p * 3}px`], [`radial-gradient(circle at 70% 60%, ${c(60, 0.6)}, transparent 50%)`, `${p * 5}px ${p * 4}px`], [`linear-gradient(${c(90)}, ${c(84)})`, "auto"]],
    polymer: [[`radial-gradient(circle, ${c(55)} 0 24%, ${c(30)} 27% 31%, transparent 34%)`, `${p}px ${p}px`], [`linear-gradient(${c(28)}, ${c(22)})`, "auto"]],
    organic: [[`radial-gradient(circle, transparent 0 38%, ${c(30, 0.7)} 41% 45%, transparent 48%)`, `${p}px ${p * 0.86}px`], [`linear-gradient(${c(62)}, ${c(52)})`, "auto"]],
  };
  // A word of no listed class: a quiet check in its own hue, so the prompt leads and the sketch only hints.
  return pairs[material.cls] ?? [[`conic-gradient(${c(86)} 25%, ${c(78)} 0 50%, ${c(86)} 0 75%, ${c(78)} 0)`, `${p}px ${p}px`]];
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
  return `/${path}${location.search}`;
}

/** Each ladder is a row of words; a word chosen is written into the address and the sentence. */
function drawLadders(vocab, state, set) {
  const section = $(".ladders");
  section.hidden = false;
  section.replaceChildren(
    ...Object.entries(vocab.ladders).map(([key, words]) => node("div", { class: "ladder", role: "radiogroup", "aria-label": key }, [
      node("span", { class: "key" }, [key]),
      node("div", { class: "rungs" }, words.map((word) => node("button", { type: "button", role: "radio", "aria-checked": String(word === state.ladders[key]), onclick: () => set({ [key]: slug(word) }) }, [word]))),
      node("button", { type: "button", class: "roll", "aria-label": `roll ${key}`, onclick: () => { const others = words.filter((w) => w !== state.ladders[key]); set({ [key]: slug(others[Math.floor(Math.random() * others.length)]) }); } }, ["↻"]),
    ])),
    node("div", { class: "ladder neighbours" }, [
      node("span", { class: "key" }, ["swap"]),
      node("div", { class: "rungs" }, state.layers.flatMap(({ material }, i) => neighbours(vocab, material).map((other) => node("a", { href: swapHref(state, i, other) }, [`${material.word} → ${other.word}`])))),
      node("button", { type: "button", class: "roll", "aria-label": "roll every ladder", onclick: () => set(null) }, ["↻ all"]),
    ]),
  );
}

function drawPrompts(vocab, state, address) {
  const { midjourney, plain } = prompts(vocab, state);
  const copy = (text) => node("button", { type: "button", onclick: () => navigator.clipboard?.writeText(text) }, ["copy"]);
  const row = (key, text) => node("p", {}, [node("span", { class: "key" }, [key]), " ", node("code", {}, [text]), " ", copy(text)]);
  $(".prompts").replaceChildren(row("midjourney", midjourney), row("any model", plain), row("spw", spwLine(state)), row("url", address));
}

async function main() {
  const vocab = await (await fetch("/vocabulary.json")).json();
  document.body.classList.add("composed");
  const url = new URL(location.href);
  if (url.pathname === "/catalog" || url.pathname === "/catalog/") { $(".slide").hidden = true; return; }
  const render = () => {
    const state = stateOf(url, vocab);
    drawStage(vocab, state);
    drawSlide(vocab, state);
    drawPrompts(vocab, state, url.href);
    drawLadders(vocab, state, (change) => {
      if (change === null) {
        for (const key of Object.keys(vocab.ladders)) url.searchParams.delete(key);
        url.searchParams.set("r", String(Math.floor(Math.random() * 1e6)));
      } else {
        for (const [key, value] of Object.entries(change)) url.searchParams.set(key, value);
      }
      history.replaceState(null, "", url);
      render();
    });
  };
  render();
}

main().catch(() => document.body.classList.remove("composed"));
