// texture.website: the address is the recipe. Each word in the path is a layer,
// bottom first; a mark before a word is that layer's law (factshift.center's
// marks, drawn as blends); a word that names no material is spoken in a bubble.
// With no words, the day composes from whichever materials exist (catalog.json),
// so the same date always gives the same picture and tomorrow can be predicted.
// Every page is one file; nothing here runs on a server.

const MARKS = ".^*~=@?!%";
const ROTATION = ["~", "*", "^", "?", "@", "!", "%", ".", "="];
const ORIGIN = "https://texture.website";
const $ = (selector) => document.querySelector(selector);

function node(tag, props = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) if (k === "class") n.className = v; else if (k in n) n[k] = v; else n.setAttribute(k, v);
  for (const c of children) n.append(c);
  return n;
}

/** Days since 1970-01-01, UTC, for a YYYY-MM-DD date. */
const dayNumber = (iso) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86400000);
const isoOf = (n) => new Date(n * 86400000).toISOString().slice(0, 10);
const mix = (n) => { let x = Math.imul((n ^ (n >>> 16)) >>> 0, 0x45d9f3b); x = Math.imul((x ^ (x >>> 16)) >>> 0, 0x45d9f3b); return (x ^ (x >>> 16)) >>> 0; };

/** The day's composition: a ground and a figure, each from whichever materials exist in its role. */
function daily(catalog, day) {
  const of = (role) => catalog.materials.filter((m) => catalog.categories[m.category]?.role === role);
  const grounds = of("ground"), figures = of("figure");
  const layers = [];
  if (grounds.length) layers.push({ material: grounds[day % grounds.length], mark: "" });
  if (figures.length) layers.push({ material: figures[mix(day) % figures.length], mark: ROTATION[mix(day + 7) % ROTATION.length] });
  return layers;
}

/** The path read as layers and spoken words. */
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

function drawLayers(catalog, layers, { scale, angle }) {
  const host = $(".layers");
  host.replaceChildren();
  layers.forEach(({ material, mark }, i) => {
    const law = catalog.laws[mark] ?? catalog.laws[""];
    const size = Math.round(384 * (law.scale ?? 1) * scale);
    const layer = node("div", { class: `layer${law.drift ? " drift" : ""}` });
    layer.style.backgroundImage = `url("/${material.id}.webp")`;
    layer.style.backgroundSize = `${size}px auto`;
    if (i > 0) { layer.style.mixBlendMode = law.blend; layer.style.opacity = String(law.opacity); }
    if (angle) layer.style.transform = `rotate(${angle}deg) scale(1.5)`;
    host.append(layer);
  });
}

function drawBubble(text, mark, catalog) {
  const bubble = $(".bubble");
  bubble.hidden = !text;
  bubble.textContent = text;
  bubble.dataset.shape = catalog.bubbles[mark] ?? "statement";
}

/** The composition as a line of Spw: the ground, holding what lies over it, each with its mark. */
const spwLine = (layers) => layers.reduceRight((inner, { material, mark }) => `${mark}${material.id}${inner ? `{${inner}}` : ""}`, "");

function reading(catalog, { layers, words, day, isToday, gatheredFor, address }) {
  const panel = $(".reading");
  const say = (mark) => (catalog.laws[mark] ?? catalog.laws[""]).says;
  const lines = layers.map(({ material, mark }) => node("li", {}, [node("a", { href: `/${material.id}` }, [material.name]), ` ${mark ? `${mark} ` : ""}${say(mark)}`]));
  const srefs = layers.map(({ material }) => `${ORIGIN}/${material.id}.webp`).join(" ");
  const copy = (text) => node("button", { type: "button", onclick: () => navigator.clipboard?.writeText(text) }, ["copy"]);
  const recipe = `${words || "your subject"} --sref ${srefs} --sw 250`;
  panel.replaceChildren(
    node("h1", {}, [layers.map(({ material }) => material.name).join(" under ") || "texture.website"]),
    gatheredFor ? node("p", { class: "for" }, [`Gathered for ${gatheredFor}.`]) : "",
    node("p", { class: "day" }, [
      isToday ? `Today, ${day}. ` : `The composition for ${day}. `,
      node("a", { href: `/?day=${isoOf(dayNumber(day) - 1)}` }, ["the day before"]), " · ",
      node("a", { href: `/?day=${isoOf(dayNumber(day) + 1)}` }, ["the day after"]),
    ]),
    node("ol", { class: "layers-list" }, lines),
    node("h2", {}, ["To make with"]),
    node("p", {}, [node("code", {}, [recipe]), " ", copy(recipe)]),
    node("p", {}, [node("code", {}, [spwLine(layers)]), " ", copy(spwLine(layers))]),
    node("h2", {}, ["To share"]),
    node("p", {}, [node("code", {}, [address]), " ", copy(address)]),
    node("p", { class: "hint" }, ["Put words in the address: each material is a layer, a mark before it is its law, and other words are said aloud. ", node("a", { href: "/catalog" }, ["Every material"]), "."]),
  );
}

function catalogView(catalog) {
  $(".stage").hidden = true;
  $(".reading").replaceChildren(node("h1", {}, ["Every material"]), node("p", {}, [`${catalog.materials.length} materials, how each was made, and where it came from. The science notes are drafts.`]));
  const list = $(".catalog ul");
  list.replaceChildren(...catalog.materials.map((m) => node("li", {}, [
    node("a", { href: `/${m.id}` }, [node("img", { src: `/${m.id}.webp`, alt: "", width: 192, height: 108, loading: "lazy" }), node("span", { class: "name" }, [m.name])]),
    node("span", { class: "category" }, [m.category]),
    node("p", {}, [m.science]),
    node("p", { class: "provenance" }, [
      `Made with ${m.provenance.generator}`,
      m.provenance.promptWords ? `, from "${m.provenance.promptWords}"` : "",
      m.provenance.job ? [" · ", node("a", { href: m.provenance.job, rel: "noopener" }, ["its job"])] : "",
      m.provenance.raw ? [" · ", node("a", { href: `/raw/${m.provenance.raw.name}` }, ["the raw render"])] : "",
    ].flat()),
    node("ol", { class: "history" }, m.history.map((h) => node("li", {}, [node("code", {}, [h.commit]), ` ${h.date} ${h.subject}`]))),
  ])));
}

async function main() {
  const catalog = await (await fetch("/catalog.json")).json();
  document.body.classList.add("composed");
  const url = new URL(location.href);
  if (url.pathname === "/catalog" || url.pathname === "/catalog/") return catalogView(catalog);
  const today = new Date().toISOString().slice(0, 10);
  const asked = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get("day") ?? "") ? url.searchParams.get("day") : null;
  const tomorrow = url.pathname.replace(/\/$/, "") === "/tomorrow";
  const day = tomorrow ? isoOf(dayNumber(today) + 1) : asked ?? today;
  const read = tomorrow ? { layers: [], words: "" } : readPath(catalog, url.pathname);
  const layers = read.layers.length ? read.layers : daily(catalog, dayNumber(day));
  const scale = Math.min(4, Math.max(0.25, Number(url.searchParams.get("scale")) || 1));
  const angle = Math.max(-180, Math.min(180, Number(url.searchParams.get("angle")) || 0));
  const words = (url.searchParams.get("say") ?? read.words).slice(0, 140);
  drawLayers(catalog, layers, { scale, angle });
  drawBubble(words, url.searchParams.get("as") ?? ".", catalog);
  reading(catalog, { layers, words, day, isToday: day === today, gatheredFor: (url.searchParams.get("for") ?? "").slice(0, 80), address: url.href });
}

main().catch(() => document.body.classList.remove("composed"));
