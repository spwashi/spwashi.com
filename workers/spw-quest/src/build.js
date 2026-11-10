// The script tool: one expression you can mutate, and the .spw you copy, format,
// or download. Slot links keep every other slot. The script field can hold any
// text; format only tightens spacing when the parser accepts the whole script.
import { parse } from "../../../public/js/semantic/spw-workbench-reader.js";
import { readContainers } from "../../../public/js/semantic/expression-query.js";
import { escapeHtml } from "../../lib/shell.js";
import { CONTAINERS, OPERATORS, PARTICLE_AIMS } from "./guide.js";
import { EXAMPLES } from "./examples.js";
import { editorField, handBar, outlineFile, readFile } from "./file-reader.js";
import { displayMenu } from "./display.js";

const MAX = 60;
export const MAX_SCRIPT = 65536;
const MARKS = new Set(OPERATORS.map((op) => op.sigil));
const BRACES = Object.fromEntries(CONTAINERS.map((c) => [c.name, c]));
const ROLE = {
  mark: "what the word is doing",
  word: "the thing named",
  concept: "what this is about",
  scene: "where it happens",
  mode: "which lens",
  definition: "what belongs inside",
};

/** The slots in the order the line is written, each with the alternatives a reader can swap in. */
export const SLOTS = Object.freeze([
  { name: "mark", alts: ["", "~", "?", "!", "@", "*"] },
  { name: "word", alts: ["draft", "read", "revise"] },
  { name: "concept", alts: ["", "chapter", "essay"] },
  { name: "scene", alts: ["", "study", "seminar"] },
  { name: "mode", alts: ["", "second_pass", "aloud"] },
  { name: "definition", alts: ["", "voice, scene, turn", "voice.scene.turn", "turn"] },
]);

/**
 * Three files to start from, each a piece someone makes, so the line taken
 * apart has a world around it (the creator, 2026-11-08: a more realistic and
 * dimensional song, image or scene script). Every line is one expression the
 * page can take apart, and the lines lend each other their words: a slot's
 * choices are the ones the rest of the file already uses.
 */
export const BUILD_KINDS = Object.freeze([
  { kind: "song", label: "Song", file: "porch_light.spw", say: "a song being arranged: its sections, tempo, and who hears it", script: `~porch_light<song>(november)[draft]{verse; chorus; verse; bridge; chorus}
.verse<memory>(kitchen)[low]{her coat on the chair, the kettle, two in the morning}
^chorus<hook>(car)[lift]{say it plain, say it twice}
?bridge<turn>(highway)[minor]{the long drive ~> the porch light}
%tempo<pulse>(room)[steady]{84 bpm, D minor, brushes on the snare}
@listener<home>(headphones)[close]{one voice, one guitar, the room left in}
!ending<release>(porch)[open]{stop on the one}` },
  { kind: "image", label: "Image", file: "gardener.spw", say: "a picture brief: figure, ground, light and frame", script: `*gardener<cover>(dawn)[papergami]{figure; ground; light; frame}
.ground<landscape>(field)[folded]{kraft hills, a tea stain, a seam of rust}
figure<care>(rows)[quiet]{sleeves rolled, a trowel, back to the sun}
^light<warmth>(east)[low]{long shadows from the left}
%frame<print>(shelf)[portrait]{four by five, the figure off center, room for a title}
@viewer<invitation>(reach)[near]{eye level, the trowel within reach}
?title<cover>(top)[open]{a title, or none}` },
  { kind: "scene", label: "Scene", file: "morning_after.spw", say: "two people, one kitchen, the morning after", script: `!morning_after<repair>(kitchen)[scene]{arrive; argue; stay}
@sam<worry>(doorway)[guarded]{coffee, the unanswered text}
@rae<fatigue>(sink)[dry]{dishes, a joke that lands wrong}
.arrive<threshold>(hall)[quiet]{the door, keys, the kettle}
~argue<rupture>(table)[rising]{the text ~> the joke ~> silence}
?stay<repair>(window)[open]{one of them sits down}` },
]);

/** A writing line: act (!) on draft, about the chapter, in the study, on a second pass, with three things inside. Slot addresses without a script start here. */
export const BUILD_DEFAULTS = Object.freeze({ mark: "!", word: "draft", concept: "chapter", scene: "study", mode: "second_pass", definition: "voice, scene, turn" });

/** Slots from a query string; anything missing keeps its default, and no slot can break another's braces. */
export function slotsFrom(params, base = BUILD_DEFAULTS) {
  const slots = { ...base };
  for (const { name } of SLOTS) {
    if (!params.has(name)) continue;
    const raw = String(params.get(name) || "").slice(0, MAX);
    slots[name] = name === "mark"
      ? (MARKS.has(raw) ? raw : "")
      : raw.replace(/[<>()[\]{}]/g, "").replace(/\s+/g, " ").trim();
  }
  return slots;
}

const nameOf = (word) => word.replace(/\s+/g, "_");

/* Each brace pair names its slot wherever it sits (the creator, 2026-11-05).
   A line this tool makes from nothing takes the guide's order; a line it was
   given keeps the order its author wrote, and a new slot joins that order. */
const GUIDE_ORDER = Object.freeze(["concept", "scene", "mode", "definition"]);
const ATLAS_ORDER = Object.freeze(["mode", "definition", "scene", "concept"]);
const WRAP = Object.freeze({ concept: ["<", ">"], scene: ["(", ")"], mode: ["[", "]"], definition: ["{", "}"] });
const SLOT_NAME = Object.freeze({ projection: "concept", scope: "scene", mode: "mode", body: "definition" });
const isSubsequence = (part, whole) => { let at = 0; for (const item of whole) if (item === part[at]) at += 1; return at === part.length; };

/** The order to write slots in: the guide's or the atlas's when the line already follows one, else the line's own, then the rest. */
function orderFor(written = []) {
  if (isSubsequence(written, GUIDE_ORDER)) return GUIDE_ORDER;
  if (isSubsequence(written, ATLAS_ORDER)) return ATLAS_ORDER;
  return [...written, ...GUIDE_ORDER.filter((slot) => !written.includes(slot))];
}

/** The line the slots make: mark, word, then <concept>(scene)[mode]{definition}, or the order the line was written in. */
export function assemble(slots, written = []) {
  const containers = orderFor(written).map((slot) => (slots[slot] ? `${WRAP[slot][0]}${slots[slot]}${WRAP[slot][1]}` : "")).join("");
  return `${slots.mark}${nameOf(slots.word)}${containers}`;
}

// Every mark the guide teaches, . (ground) among them.
const LEAD = /^([~?!@*^#&=%$.]?)([A-Za-z_][\w.-]*)/;

/** One expression this tool can take apart: a mark, a word, then brace pairs in any order, each once, and nothing after. */
function readFocusLine(line) {
  const lead = String(line || "").match(LEAD);
  if (!lead) return null;
  const rest = line.slice(lead[0].length);
  const { found, order, end } = readContainers(rest);
  if (rest.slice(end).trim()) return null;
  const slots = { mark: MARKS.has(lead[1]) ? lead[1] : "", word: lead[2], concept: "", scene: "", mode: "", definition: "" };
  for (const [slot, value] of Object.entries(found)) {
    const name = SLOT_NAME[slot];
    if (value.includes(WRAP[name][0]) || value.includes(WRAP[name][1])) return null;
    slots[name] = value;
  }
  return { slots, written: order.map((slot) => SLOT_NAME[slot]) };
}

/** The lines a script holds that this page can take apart, as indexes into its lines. */
export function focusLines(script) {
  return String(script || "").split("\n").flatMap((line, index) => (readFocusLine(line.trim()) ? [index] : []));
}

/** The nth line this page can take apart (the first by default), as slots, if there is one. */
export function focusSlots(script, nth = 0) {
  const index = focusLines(script)[nth];
  return index === undefined ? null : readFocusLine(String(script).split("\n")[index].trim()).slots;
}

/** The script's focus: the nth line shaped like one expression (the first by default), or -1. */
export function focusIndex(script, nth = 0) {
  return focusLines(script)[nth] ?? -1;
}

/** The script with its focus line (the nth, the first by default) rewritten from slots; indentation and every other line stay. */
export function withSlots(script, slots, nth = 0) {
  const text = String(script ?? "");
  if (!text.trim()) return assemble(slots);
  const lines = text.split("\n");
  const at = focusIndex(text, nth);
  if (at < 0) return `${assemble(slots)}\n\n${text}`;
  const line = assemble(slots, readFocusLine(lines[at].trim()).written);
  lines[at] = `${(lines[at].match(/^[ \t]*/) || [""])[0]}${line}`;
  return lines.join("\n");
}

/** An address that carries the whole script holds this many characters at most; past it, links carry slots. */
export const SHARE_MAX = 1800;

/**
 * Text as base64url: the form a link's fragment carries a script in between
 * spw.quest and factshift.center (#spw64=…), so the script never reaches a
 * server. factshift.center loads it into its thread of lines; spw.quest's
 * /build reads it back into the editor (readSpw64).
 */
export function spw64(text) {
  const bytes = new TextEncoder().encode(String(text ?? ""));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export const factshiftScriptHref = (text) => `https://factshift.center/#spw64=${spw64(text)}`;

/**
 * On /build, a script carried in by #spw64= (from factshift.center) opens in
 * the editor in place, with no reload, so it stays in this browser; the
 * reading follows as for an edit, and Read takes its first line apart.
 */
export function readSpw64() {
  const match = /^#spw64=([A-Za-z0-9_-]+)$/.exec(location.hash);
  const field = document.querySelector("form[data-file] textarea");
  if (!match || !field) return;
  try {
    const base = match[1].replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base + "=".repeat((4 - (base.length % 4)) % 4));
    field.value = new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
    history.replaceState(history.state, "", location.pathname + location.search);
    field.dispatchEvent(new Event("input", { bubbles: true }));
  } catch {
    // An unreadable script leaves the page as it is.
  }
}

/**
 * What /build was asked for: ?script= is the source when present; slot
 * parameters then rewrite only its focus line. Without a script, the slots
 * make the line on their own.
 */
export function buildFrom(params) {
  const touched = SLOTS.some(({ name }) => params.has(name));
  const given = params.has("script") ? String(params.get("script") || "").slice(0, MAX_SCRIPT) : null;
  // ?kind= starts from that file; a bare /build starts from the first. Slot addresses without a script keep making one line.
  const kind = BUILD_KINDS.find((entry) => entry.kind === params.get("kind")) || (given == null && !touched ? BUILD_KINDS[0] : null);
  const source = given ?? kind?.script ?? null;
  const count = source == null ? 0 : focusLines(source).length;
  const asked = Number.parseInt(params.get("line") || "1", 10);
  const nth = count && asked >= 1 && asked <= count ? asked - 1 : 0;
  const base = (source != null && focusSlots(source, nth)) || { ...BUILD_DEFAULTS };
  const slots = touched ? slotsFrom(params, base) : base;
  const script = source == null ? assemble(slots) : touched ? withSlots(source, slots, nth) : source;
  const filename = safeName(params.get("filename") || (given == null && kind?.file) || `${nameOf(slots.word) || "line"}.spw`);
  return { slots, script, filename, base, kind: given == null ? kind?.kind ?? null : null, nth };
}

/** The address of a script, when it fits; otherwise null. `nth` names the line taken apart, when it is not the first. */
export const scriptAddress = (script, hash = "build", nth = 0) => {
  const text = String(script ?? "");
  return text.length <= SHARE_MAX ? `/build?script=${encodeURIComponent(text)}${nth ? `&line=${nth + 1}` : ""}#${hash}` : null;
};

/** Files to open, change and keep: each is whole, and each opens by its address. */
export const SNIPPETS = Object.freeze([
  ...EXAMPLES.map(({ tab, file, script }) => ({ label: tab, file, script })),
  { label: "One word, three marks", file: "draft.spw", script: "~draft\n?draft\n!draft" },
]);

/** A download name: one segment, ending in .spw. */
export function safeName(raw) {
  const base = String(raw || "").split(/[/\\]/).pop().replace(/[^A-Za-z0-9._-]/g, "").replace(/^\.+/, "").slice(0, 80);
  if (!base) return "line.spw";
  return base.endsWith(".spw") ? base : `${base}.spw`;
}

/** What { } holds: commas keep parts apart, dots make one name. */
export function definitionFact(value) {
  if (!value) return "";
  if (value.includes(",")) {
    const count = value.split(",").map((part) => part.trim()).filter(Boolean).length;
    return `${count} part${count === 1 ? "" : "s"}`;
  }
  if (value.includes(".")) return "1 name. Dots join the words.";
  return "1 part";
}

const glue = (prev, token) => {
  if (!prev) return "";
  if (token.type === "COMMENT" || prev.type === "COMMENT") return " ";
  if (token.type === "COMMA") return "";
  if (prev.type === "COMMA") return " ";
  if (token.type === "CONTAINER_CLOSE" || token.type === "CAPSULE_CLOSE") return "";
  if (prev.type === "CONTAINER_OPEN" || prev.type === "CAPSULE_OPEN") return "";
  if ((prev.type === "CONTAINER_CLOSE" || prev.type === "CAPSULE_CLOSE")
    && (token.type === "CONTAINER_OPEN" || token.type === "CAPSULE_OPEN")) return "";
  if ((prev.type === "IDENTIFIER" || prev.type === "STRING" || prev.type === "PHRASE")
    && (token.type === "CONTAINER_OPEN" || token.type === "CAPSULE_OPEN")) return "";
  if (prev.type === "PARTICLE") return " ";
  if (prev.type === "OPERATOR" && prev.value !== "=") return "";
  if (token.type === "COLON") return "";
  if (prev.type === "COLON" || token.value === "=" || prev.value === "=") return " ";
  return " ";
};

const joinTokens = (tokens) => tokens.map((token, index) => glue(tokens[index - 1], token) + token.value).join("");

const tidy = (source) => {
  const lines = String(source).replace(/\r\n/g, "\n").split("\n").map((line) => line.replace(/[ \t]+$/g, ""));
  const collapsed = [];
  for (const line of lines) {
    if (!line.trim() && !collapsed.at(-1)?.trim()) continue;
    collapsed.push(line);
  }
  while (collapsed[0] === "") collapsed.shift();
  while (collapsed.at(-1) === "") collapsed.pop();
  return collapsed.length ? `${collapsed.join("\n")}\n` : "";
};

/**
 * Tighten a script the parser accepts: the mark sits on the word, braces sit
 * on the word, a comma keeps one space, and indentation and blank lines stay.
 * A script the parser rejects is only tidied, never rewritten.
 */
export function formatScript(source) {
  const text = String(source ?? "").slice(0, MAX_SCRIPT);
  if (!text.trim()) return "";
  let result;
  try {
    result = parse(text);
  } catch {
    return tidy(text);
  }
  if (!result?.success || result.completeness?.proseFallback || !result.tokens?.length) return tidy(text);
  const tokens = result.tokens.filter((token) => token.type !== "WHITESPACE" && token.type !== "EOF");
  if (!tokens.length) return tidy(text);
  const groups = [];
  for (const token of tokens) {
    const line = token.span?.start?.line || 1;
    const current = groups.at(-1);
    if (!current || current.line !== line) groups.push({ line, tokens: [token] });
    else current.tokens.push(token);
  }
  let out = "";
  let lastLine = null;
  for (const group of groups) {
    if (lastLine != null) out += group.line - lastLine > 1 ? "\n\n" : "\n";
    lastLine = group.line;
    const offset = group.tokens[0].span?.start?.offset ?? 0;
    const lineStart = text.lastIndexOf("\n", offset - 1) + 1;
    const indent = (text.slice(lineStart, offset).match(/^[ \t]*/) || [""])[0];
    out += indent + joinTokens(group.tokens);
  }
  return out.endsWith("\n") ? out : `${out}\n`;
}

/** Distinct marks and braces in a script, in the order the parser met them. */
function semantics(source) {
  let result;
  try {
    result = parse(String(source).slice(0, MAX_SCRIPT));
  } catch {
    return [];
  }
  const tokens = (result?.tokens || []).filter((token) => token.type !== "WHITESPACE" && token.type !== "COMMENT" && token.type !== "EOF");
  const rows = [];
  const seen = new Set();
  for (const token of tokens) {
    if (token.type === "OPERATOR" && !seen.has(token.value)) {
      seen.add(token.value);
      const op = OPERATORS.find((item) => item.sigil === token.value);
      if (op) rows.push({ slot: "mark", mark: op.sigil, name: op.name, reads: op.reads });
    } else if (token.type === "PARTICLE") {
      const sigil = token.value.slice(0, 2);
      if (seen.has(sigil)) continue;
      seen.add(sigil);
      const op = OPERATORS.find((item) => item.sigil === sigil[0]);
      rows.push({ slot: "mark", mark: sigil, name: op?.name || "", reads: PARTICLE_AIMS[token.kind] || op?.reads || "" });
    } else if ((token.type === "CONTAINER_OPEN" || token.type === "CAPSULE_OPEN") && BRACES && !seen.has(`b:${token.value}`)) {
      const container = CONTAINERS.find((item) => item.open === token.value);
      if (!container) continue;
      seen.add(`b:${token.value}`);
      const fact = container.name === "definition" ? definitionFact(source.match(/\{([^{}]*)\}/)?.[1] || "") : "";
      rows.push({ slot: container.name, mark: `${container.open} ${container.close}`, name: container.name, reads: fact ? `${container.reads} ${fact}` : container.reads });
    }
  }
  return rows;
}

function segments(slots, base = BUILD_DEFAULTS) {
  const seg = (slot, text) => {
    if (!text) return "";
    const changed = slots[slot] !== base[slot] ? " data-changed" : "";
    return `<span data-slot="${slot}"${changed}>${text}</span>`;
  };
  const wrap = (slot, value) => (value ? `${BRACES[slot].open}${value}${BRACES[slot].close}` : "");
  const definition = (value) => {
    if (!value) return "";
    const inner = value.includes(",") && !value.includes(".")
      ? value.split(",").map((part) => `<span class="part">${escapeHtml(part.trim())}</span>`).join('<span class="sep">, </span>')
      : `<span class="part${value.includes(".") ? " name" : ""}">${escapeHtml(value)}</span>`;
    return `${BRACES.definition.open}${inner}${BRACES.definition.close}`;
  };
  return seg("mark", escapeHtml(slots.mark))
    + seg("word", escapeHtml(nameOf(slots.word)))
    + seg("concept", escapeHtml(wrap("concept", slots.concept)))
    + seg("scene", escapeHtml(wrap("scene", slots.scene)))
    + seg("mode", escapeHtml(wrap("mode", slots.mode)))
    + seg("definition", definition(slots.definition));
}

const query = (slots) => SLOTS.map(({ name: slot }) => `${slot}=${encodeURIComponent(slots[slot])}`).join("&amp;");

function altLabel(slot, value, slots) {
  if (slot === "mark") return `<mark>${escapeHtml(value)}</mark>${escapeHtml(nameOf(slots.word) || "word")}`;
  if (slot === "word") return escapeHtml(nameOf(value));
  if (!value) return `<span aria-hidden="true">—</span><span class="sr-only">without ${slot}</span>`;
  return escapeHtml(`${BRACES[slot].open}${value}${BRACES[slot].close}`);
}

/** The values the script's other lines hold in a slot, in the order they come. */
function lent(script, slot) {
  const values = [];
  for (const line of String(script || "").split("\n")) {
    const value = readFocusLine(line.trim())?.slots[slot];
    if (value && !values.includes(value)) values.push(value);
  }
  return values;
}

/**
 * Each slot's choices: the ones the rest of the file already uses (a lens the
 * verse is read through, a scene the chorus happens in), and none for a room;
 * a file with nothing to lend falls back to the page's own few.
 */
function choicesFor(slot, alts, slots, script) {
  const own = lent(script, slot).filter((value) => value !== slots[slot]);
  if (!own.length) return alts.includes(slots[slot]) ? alts : [slots[slot], ...alts];
  return [slots[slot], ...own.slice(0, 5), ...(slot === "word" ? [] : [""])];
}

function pivots(slots, script, nth = 0) {
  return SLOTS.map(({ name: slot, alts }) => {
    const options = choicesFor(slot, alts, slots, script);
    const links = options.map((value) => {
      const next = { ...slots, [slot]: value };
      const current = value === slots[slot] ? ' aria-current="true"' : "";
      const href = scriptAddress(withSlots(script, next, nth), `pivot-${slot}`, nth) || `/build?${query(next)}#pivot-${slot}`;
      return `<a href="${escapeHtml(href)}"${current}>${altLabel(slot, value, slots)}</a>`;
    }).join("");
    const own = slot === "mark"
      ? `<label class="own" data-slot="mark"><span class="sr-only">mark</span><select name="mark">${["", ...MARKS].map((mark) => `<option value="${escapeHtml(mark)}"${mark === slots.mark ? " selected" : ""}>${mark ? escapeHtml(mark) : "—"}</option>`).join("")}</select></label>`
      : `<label class="own" data-slot="${slot}"><span class="sr-only">${slot}</span><input name="${slot}" value="${escapeHtml(slots[slot])}" maxlength="${MAX}" spellcheck="false" autocomplete="off" autocapitalize="none"></label>`;
    return `<div class="pivot" id="pivot-${slot}" data-slot="${slot}"><div class="head"><span class="slot"><span class="role">${escapeHtml(slot === "mark" || slot === "word" ? slot : `${BRACES[slot].open} ${BRACES[slot].close} ${slot}`)}</span> ${escapeHtml(ROLE[slot])}</span>${own}</div><span class="alts">${links}</span></div>`;
  }).join("\n      ");
}

function ledger(source, slots, base = BUILD_DEFAULTS) {
  const rows = semantics(source).map((row) => {
    const changed = row.slot !== "mark"
      ? slots[row.slot] !== base[row.slot]
      : slots.mark !== base.mark && row.mark === slots.mark;
    return `<li data-slot="${escapeHtml(row.slot)}"${changed ? " data-changed" : ""}><code class="mark">${escapeHtml(row.mark)}</code><span class="name">${escapeHtml(row.name)}</span><span>${escapeHtml(row.reads)}</span></li>`;
  });
  if (!rows.length) return "";
  return `<ul class="semantics" aria-label="What this script means">
      ${rows.join("\n      ")}
    </ul>`;
}

/** Copy, format, and download read the script field. Slot changes are links, so they work with scripts off. */
export function toolActions() {
  const box = document.querySelector("form[data-file]");
  if (!box) return;
  const field = box.elements.script;
  const filename = box.elements.filename;
  const say = (message) => {
    const status = document.getElementById("status");
    if (!status) return;
    status.textContent = "";
    setTimeout(() => { status.textContent = message; }, 50);
  };
  field.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || !(event.metaKey || event.ctrlKey)) return;
    event.preventDefault();
    box.requestSubmit(box.querySelector("[data-tool='read']"));
  });
  // factshift.center opens what the editor holds now, carried in the fragment.
  const factshift = box.querySelector("[data-tool='factshift']");
  factshift?.addEventListener("click", () => {
    const field = box.querySelector("textarea[name='script']");
    if (!field) return;
    const bytes = new TextEncoder().encode(field.value);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    factshift.setAttribute("href", `https://factshift.center/#spw64=${btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`);
  });
  const share = box.querySelector("[data-tool='share']");
  share?.addEventListener("click", async (event) => {
    if (!navigator.clipboard) return;
    event.preventDefault();
    try {
      await navigator.clipboard.writeText(new URL(share.getAttribute("href"), location.href).href);
      say("Copied a link to this script.");
    } catch {
      location.href = share.href;
    }
  });
  const copy = box.querySelector("[data-tool='copy']");
  copy?.addEventListener("click", async () => {
    const idle = copy.textContent;
    try {
      await navigator.clipboard.writeText(field.value);
      copy.textContent = "Copied";
      say("Copied the script.");
    } catch {
      field.focus();
      field.select();
      copy.textContent = "Select and copy";
      say("Select the script and copy it.");
    }
    setTimeout(() => { copy.textContent = idle; }, 1600);
  });
  box.querySelector("[data-tool='download']")?.addEventListener("click", (event) => {
    event.preventDefault();
    const base = String(filename.value || "").split(/[/\\]/).pop().replace(/[^A-Za-z0-9._-]/g, "").replace(/^\.+/, "").slice(0, 80);
    const downloadName = !base ? "line.spw" : base.endsWith(".spw") ? base : `${base}.spw`;
    const text = !field.value || field.value.endsWith("\n") ? field.value : `${field.value}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    say(`Downloaded ${downloadName}.`);
  });
}

/** Snippets to open: each link opens the tool on that whole script. */
function shelf() {
  const items = SNIPPETS.map(({ label, file, script }) => {
    const first = script.split("\n")[0];
    const address = scriptAddress(script);
    const href = address ? address.replace("/build?", `/build?filename=${encodeURIComponent(file)}&`) : "/build#build";
    return `<li><a href="${escapeHtml(href)}"><span class="label">${escapeHtml(label)}</span><code>${escapeHtml(first)}${script.includes("\n") ? " …" : ""}</code></a></li>`;
  });
  return `<p class="shelf-title" id="snippets-title">Open another file</p>
    <ul class="snippets" aria-labelledby="snippets-title">
      ${items.join("\n      ")}
    </ul>`;
}

/** Where to start: a song, an image or a scene, each a whole file. */
function kinds(current) {
  const chosen = BUILD_KINDS.find((entry) => entry.kind === current);
  return `<nav class="kinds" aria-label="Start from">
      ${BUILD_KINDS.map((entry) => `<a href="/build?kind=${entry.kind}#build"${entry.kind === current ? ' aria-current="true"' : ""}><span class="label">${escapeHtml(entry.label)}</span><span class="say">${escapeHtml(entry.say)}</span></a>`).join("\n      ")}
    </nav>${chosen ? `
    <p class="kinds-say">${escapeHtml(chosen.say)}</p>` : ""}`;
}

/** The file's lines this page can take apart, each a link that takes it apart instead. */
function lineStrip(script, nth) {
  const indexes = focusLines(script);
  if (indexes.length < 2 || String(script).length > SHARE_MAX) return "";
  const lines = String(script).split("\n");
  const links = indexes.map((index, at) => {
    const read = readFocusLine(lines[index].trim());
    const label = `${read.slots.mark}${nameOf(read.slots.word)}`;
    return `<a href="${escapeHtml(scriptAddress(script, "apart", at))}"${at === nth ? ' aria-current="true"' : ""}><span class="n">${index + 1}</span>${escapeHtml(label)}</a>`;
  });
  return `<nav class="apart-lines" aria-label="Take another line apart">${links.join("")}</nav>`;
}

/** The surface: where to start, the file and its reading, one of its lines taken apart a slot per row, and files to open. */
export function buildSurface(slots, script = assemble(slots), filename = `${slots.word || "line"}.spw`, { base = BUILD_DEFAULTS, kind = null, nth = 0 } = {}) {
  const line = assemble(slots);
  const shown = String(script ?? "");
  const address = scriptAddress(shown);
  const held = shown.length <= SHARE_MAX ? shown : line;
  const at = held === shown ? nth : 0;
  const focusText = focusIndex(held, at) >= 0 ? held.split("\n")[focusIndex(held, at)].trim() : line;
  const word = nameOf(slots.word);
  const display = displayMenu();
  return `<div class="build">
    ${kinds(kind)}
    <div class="workspace">
      <form class="script" data-file method="post" action="/build#build">
        <div class="file-head">
          <label class="filename"><span class="sr-only">File name</span><input name="filename" value="${escapeHtml(safeName(filename))}" maxlength="80" spellcheck="false" autocomplete="off" autocapitalize="none"></label>
          <div class="file-actions">
            ${display.toggle}
            <button type="submit" name="tool" value="read" data-tool="read">Read</button>
            <button type="submit" name="tool" value="format">Format</button>
            <button type="button" data-tool="copy">Copy</button>
            <button type="submit" name="tool" value="download" formaction="/script.spw">Download</button>
          </div>
        </div>
        ${display.panel}
        ${editorField({ id: "script", value: shown, label: "Script", limit: MAX_SCRIPT, describedBy: "script-keys" })}
        ${handBar(shown, { line: focusIndex(shown, nth), anchors: true, ways: [["/pivot?line=", "Pivot this line"], ["/physics?line=", "Feel it at rest"]] })}
        <p class="keys file-foot" id="script-keys"><span class="hint">Read takes the line in hand apart; <kbd>⌘</kbd>/<kbd>Ctrl</kbd> + <kbd>Enter</kbd> does too. Select words and type a brace to wrap them.</span>${address ? ` <a class="share" href="${escapeHtml(address)}" data-tool="share">Link to this file</a>` : ""}${shown.trim() ? ` <a class="share" href="${escapeHtml(factshiftScriptHref(shown))}" data-tool="factshift">Open on factshift.center</a>` : ""}</p>
      </form>
      <aside class="reading-card" aria-labelledby="reading-title">
        <h2 id="reading-title">What a tool reads</h2>
        <div id="reading">${outlineFile(readFile(shown))}</div>
      </aside>
    </div>
    <section class="apart" id="apart" aria-labelledby="apart-title">
      <h2 id="apart-title">${at ? `The ${escapeHtml(word)} line, taken apart` : "The first line, taken apart"}</h2>
      ${lineStrip(held, at)}
      <p class="built-line"><code class="built" aria-label="${escapeHtml(line)}">${segments(slots, base) || "&nbsp;"}</code></p>
      ${slots.word ? `<p class="line-ways"><a href="/pivot?line=${encodeURIComponent(line)}">Pivot this line</a> · <a href="/physics?line=${encodeURIComponent(line)}">Feel it at rest</a> · <a href="/specimens?q=${encodeURIComponent(nameOf(slots.word))}#found">Find ${escapeHtml(nameOf(slots.word))} on the shelf</a>${line.length <= 400 ? ` · <a href="https://factshift.center/?spw=${encodeURIComponent(line)}">Open on factshift.center</a>` : ""}</p>` : ""}
      ${ledger(focusText, slots, base)}
      <form class="slots" method="get" action="/build#build">
        <input type="hidden" name="script" value="${escapeHtml(held)}">
        <input type="hidden" name="filename" value="${escapeHtml(safeName(filename))}">${at ? `
        <input type="hidden" name="line" value="${at + 1}">` : ""}
        <div class="pivots" aria-label="Change one slot, keep the rest">
          ${pivots(slots, held, at)}
        </div>
        <button type="submit">Put together</button>
      </form>
    </section>
    ${shelf()}
    <p class="note parser-note">Read with the site's parser: <a href="/parser/">take a dated build</a> for your page, or <a href="/install">install the workbench</a> for a repository.</p>
  </div>`;
}

const SLOT_NAMES = SLOTS.map((slot) => slot.name);
const SHELF_CSS = `.keys { margin: 0; color: var(--muted); font-size: .84rem; }
    .keys kbd { padding: 0 .3rem; border: 1px solid var(--line); border-radius: 3px; font: .78rem/1.4 var(--mono); }
    .keys .share { margin-left: .5rem; }
    @media (pointer: coarse) { .keys .hint { display: none; } .keys .share { margin-left: 0; } }
    .shelf-title { margin: 1.2rem 0 0; color: var(--muted); font: 600 .8rem/1.2 var(--font); letter-spacing: .06em; text-transform: uppercase; }
    .shelf-title + .snippets { margin-top: .5rem; }
    .pivot { scroll-margin-top: 5rem; }
    .snippets { display: grid; grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr)); gap: .5rem; margin: 1.1rem 0 0; padding: 0; list-style: none; }
    .snippets li { margin: 0; }
    .snippets a { display: grid; gap: .25rem; min-height: 44px; padding: .55rem .7rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--field); color: var(--fg); text-decoration: none; }
    .snippets a:hover, .snippets a:focus-visible { border-color: var(--accent); background: var(--accent-soft); }
    .snippets .label { font-size: .9rem; font-weight: 600; }
    .snippets code { overflow: hidden; color: var(--muted); font: .82rem/1.3 var(--mono); text-overflow: ellipsis; white-space: nowrap; }
    .parser-note { margin: 1rem 0 0; }
    .kinds { display: grid; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); gap: .5rem; }
    .kinds a { display: grid; gap: .2rem; min-height: 44px; padding: .65rem .8rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--field); color: var(--fg); text-decoration: none; }
    .kinds a:hover, .kinds a:focus-visible { border-color: var(--accent); }
    .kinds a[aria-current] { border-color: var(--accent); box-shadow: inset 0 -2px 0 var(--accent); }
    .kinds .label { font-weight: 600; }
    .kinds .say { color: var(--muted); font-size: .86rem; line-height: 1.35; }
    .kinds-say { display: none; margin: -.6rem 0 0; color: var(--muted); font-size: .9rem; }
    /* On a phone the three are one row of names, and the chosen one is said beneath. */
    @media (max-width: 40rem) {
      .kinds { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .35rem; }
      .kinds a { justify-items: center; padding: .55rem .4rem; }
      .kinds .say { display: none; }
      .kinds-say { display: block; }
    }
    .apart-lines { display: flex; flex-wrap: wrap; gap: .35rem; margin: 0 0 .8rem; }
    .apart-lines a { display: inline-flex; align-items: center; gap: .4rem; min-height: 44px; padding: 0 .7rem; border: 1px solid var(--line); border-radius: var(--pill, 999px); color: var(--fg); font: .86rem/1 var(--mono); text-decoration: none; }
    .apart-lines a[aria-current] { border-color: var(--accent); color: var(--accent); }
    .apart-lines .n { color: var(--muted); font-size: .76rem; }
    .line-ways { margin: .4rem 0 0; color: var(--muted); font-size: .9rem; }
    .line-ways a { display: inline-flex; align-items: center; min-height: 44px; }`;
export const BUILD_CSS = `.build { display: grid; gap: 1.2rem; }
    .build .filename { flex: 1 1 10rem; margin: 0; }
    .build .file-head .filename input[name="filename"] { width: 100%; min-height: 36px; margin: 0; padding: .2rem .4rem; border-color: transparent; border-radius: 4px; background: transparent; font: 600 .86rem/1.2 var(--mono); }
    .build .file-head .filename input[name="filename"]:is(:hover, :focus) { border-color: var(--edge); background: var(--field); }
    .apart { padding: .95rem 1.05rem 1.05rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
    .apart > h2 { margin: 0 0 .7rem; font-size: 1.12rem; }
    .built-line { margin: 0 0 .7rem; }
    .built { display: block; padding: .75rem .9rem; border-radius: var(--radius); background: var(--field); color: var(--fg); font: 600 1.2rem/1.5 var(--mono); overflow-wrap: anywhere; }
    .built [data-slot] { border-radius: 3px; box-shadow: inset 0 -2px 0 var(--line); }
    .built [data-slot="mark"] { color: var(--accent); }
    .built .part { padding: 0 .22rem; border-radius: 3px; background: var(--accent-soft); }
    .built .part.name { background: transparent; box-shadow: inset 0 -2px 0 var(--accent); }
    .built .sep { color: var(--muted); }
    .built [data-changed] { box-shadow: inset 0 -2px 0 var(--accent); }
    .semantics { list-style: none; margin: 0 0 .4rem; padding: 0; display: grid; }
    .semantics li { display: grid; grid-template-columns: 3.4rem 7.4rem minmax(0, 1fr); gap: .35rem .6rem; align-items: baseline; margin: 0; padding: .28rem .2rem; border-top: 1px solid var(--line); font-size: .92rem; }
    .semantics .mark, .semantics .name { font-family: var(--mono); }
    .semantics .mark { color: var(--accent); }
    .semantics [data-changed] .name { color: var(--accent); }
    .pivots { display: grid; margin: .4rem 0 0; border-top: 1px solid var(--line); }
    .pivot { display: grid; gap: .3rem; padding: .45rem 0; border-bottom: 1px solid var(--line); }
    .pivot .head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .35rem .8rem; }
    .pivot .slot { color: var(--muted); font: .82rem/1.3 var(--mono); }
    .pivot .role { color: var(--fg); font-weight: 600; }
    .pivot .pair { color: var(--accent); }
    .own { margin: 0; }
    .own :is(input, select) { width: min(16rem, 100%); min-height: 44px; margin: 0; font-family: var(--mono); }
    .alts { display: flex; flex-wrap: wrap; gap: .3rem .4rem; }
    .alts a { display: inline-flex; align-items: center; min-height: 40px; padding: 0 .6rem; border: 1px solid var(--line); border-radius: 999px; color: var(--fg); font: .92rem/1 var(--mono); text-decoration: none; }
    .alts a:hover, .alts a:focus-visible { border-color: var(--accent); background: var(--accent-soft); }
    .alts a[aria-current] { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
    .alts mark { background: none; color: var(--accent); font-weight: 700; }
    @media (pointer: coarse) { .alts a { min-height: 44px; } }
    form.slots { margin: .8rem 0 0; }
    form.slots button { margin-top: .8rem; }
    ${SLOT_NAMES.map((slot) => `.build:has(.pivot[data-slot="${slot}"]:is(:hover, :focus-within)) .built [data-slot="${slot}"], .build:has(label[data-slot="${slot}"]:focus-within) .built [data-slot="${slot}"]`).join(",\n    ")} { background: var(--accent-soft); box-shadow: inset 0 -2px 0 var(--accent); }
    ${SLOT_NAMES.map((slot) => `.build:has(.built [data-slot="${slot}"]:hover) .pivot[data-slot="${slot}"]`).join(",\n    ")} { background: var(--accent-soft); }
    @media (max-width: 36rem) { .semantics li { grid-template-columns: 3.2rem minmax(0, 1fr); } .semantics .name, .semantics li > span:last-child { grid-column: 2; } }
    ${SHELF_CSS}`;
