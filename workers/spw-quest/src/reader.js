// The reader: what Spw reads in one line, for one panel. The same kit runs in the
// worker (scripts off, /read) and in the page (scripts on, as the reader types);
// both pass it the parse function from the site's reader bundle.
import { parse } from "../../../public/js/semantic/spw-workbench-reader.js";
import { CONTAINERS, OPERATORS, PARTICLE_AIMS } from "./guide.js";
import { STEPS } from "./steps.js";

/** Longest line the reader takes; the field and /read both stop here. */
export const LINE_LIMIT = 400;

/** STORYBOARD.bubble: the operator in front of the word picks the balloon. */
export const BALLOON_BY_OPERATOR = Object.freeze({ "~": "thought", "?": "question", "!": "burst", ".": "statement", "#>": "nameplate" });
/** Each balloon kind as the page says it in words; the shape is only decoration. */
export const BALLOON_WORDS = Object.freeze({ caption: "caption", thought: "thought", question: "question", burst: "burst", statement: "statement", nameplate: "name plate" });
/** STORYBOARD.layer: the reading ladder, level by level. */
export const LAYERS = Object.freeze({ level_1: "words", level_2: "a named datum", level_3: "a reading pinned beside something", level_4: "structure" });

/** A panel's own balloon: the first kind its bubble field names ("thought, then question" is a thought). */
export const panelBalloon = (step) => step.bubble.split(",")[0].trim().replace(/\s+/g, "");

export const READER_DATA = Object.freeze({
  steps: STEPS.map((step) => ({ id: step.id, check: step.check, balloon: panelBalloon(step) })),
  operators: OPERATORS.map(({ sigil, name, reads }) => ({ sigil, name, reads })),
  containers: CONTAINERS.map(({ open, close, name, reads }) => ({ open, close, name, reads })),
  particles: PARTICLE_AIMS,
  balloons: BALLOON_BY_OPERATOR,
  balloonWords: BALLOON_WORDS,
});

/**
 * The named checks of quest.spw ^["checks"], over the parse result's AST, and
 * the reading's HTML. Self-contained so it can travel to the page by
 * toString(): nothing inside may reach outside it. Operators, braces and the
 * balloon come from the parser's own tokens, in the order it read them.
 */
export function readingKit(data) {
  const OPS = new Map(data.operators.map((op) => [op.sigil, op]));
  const BRACES = new Map(data.containers.map((c) => [c.open, c]));
  const PANELS = new Map(data.steps.map((s) => [s.id, s]));
  const WORD_OPS = new Set(["~", "?", "!", "*", ".", "^", "#", "&", "=", "%", "$"]);
  const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // AST nodes are PascalCase (Expression); tokens are upper case (IDENTIFIER).
  const isNode = (v) => typeof v.type === "string" && v.type[0] === v.type[0].toUpperCase() && v.type !== v.type.toUpperCase();
  const nodesIn = (root) => {
    const out = [];
    const visit = (value) => {
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) { value.forEach(visit); return; }
      if (isNode(value)) out.push(value);
      for (const key of Object.keys(value)) if (key !== "span") visit(value[key]);
    };
    visit(root);
    return out;
  };
  const isOp = (node, sigil) => node.type === "Operation" && Boolean(node.operator) && node.operator.value === sigil;
  const word = (node) => (node.operatorLabel && node.operatorLabel.type === "IDENTIFIER" ? node.operatorLabel.value : "");
  const parts = (node) => (node.body.sequence && node.body.sequence.type === "Sequence" ? node.body.sequence.expressions.length : 0);

  const CHECKS = {
    parses: (result) => (result.success === true
      ? { pass: true, says: "Spw read the line." }
      : { pass: false, says: "Spw could not read this line." }),
    operation_before_word: (result, nodes) => {
      const hit = nodes.find((n) => n.type === "Operation" && n.operator && WORD_OPS.has(n.operator.value) && word(n));
      if (hit) return { pass: true, says: `${hit.operator.value} is in front of ${word(hit)}, and says what ${word(hit)} is doing.` };
      const seen = nodes.find((n) => n.type === "Reference");
      if (seen) return { pass: true, says: `@ is in front of ${seen.raw || "the word"}, and says from where you are looking.` };
      return { pass: false, says: "No mark in front of a word yet. Put ~, ? or ! right before a word, with no space." };
    },
    frame_and_body: (result, nodes) => {
      const held = nodes.filter((n) => n.type === "Expression" && n.frame && n.frame.type === "Frame"
        && (n.frame.content || []).some((p) => p && p.type === "Parameter") && n.body && n.body.type === "Body");
      const hit = held.find((n) => parts(n) >= 2);
      if (hit) return { pass: true, says: `A way of seeing in [ ], and ${parts(hit)} parts held in { }.` };
      if (held.length) return { pass: false, says: "The braces hold one part. Words joined by dots read as one name; a comma keeps the parts apart." };
      return { pass: false, says: "No [ ] and { } after a word yet. Put [ ] and then { } right after it." };
    },
    frame_address_and_binding: (result, nodes) => {
      const name = nodes.find((n) => n.type === "Particle" && n.aim === ">" && n.token && n.token.value.slice(0, 2) === "#>");
      if (name) return { pass: true, says: `#> names this page${name.name ? ` ${name.name.value}` : ""}, so other pages can call it.` };
      if (nodes.some((n) => isOp(n, "="))) return { pass: true, says: "= keeps a value under a word of its own." };
      return { pass: false, says: "No #> name and no = yet. Try #>a_name, or a_name = `a value`." };
    },
    path_ref: (result, nodes) => {
      const hit = nodes.find((n) => n.type === "Binding" && n.key && n.key.type === "Reference" && nodesIn(n.value).some((m) => m.type === "PathRef"));
      if (!hit) return { pass: false, says: "No citation yet. Try @a_name: ~\"./a-page.spw\"." };
      const ref = nodesIn(hit.value).find((m) => m.type === "PathRef");
      const target = ref.path && ref.path.token ? ref.path.token.value : "a path";
      return { pass: true, says: `@${hit.key.raw || ""} keeps ${target} within reach, as a path the tools can follow.` };
    },
    wonder_with_probe: (result, nodes) => {
      const asks = nodes.filter((n) => isOp(n, "?") && n.frame && n.frame.type === "Frame" && n.body && n.body.type === "Body");
      if (asks.some((n) => nodesIn(n.body).some((m) => isOp(m, "!") && word(m) === "probe"))) {
        return { pass: true, says: "A question, and inside it a probe that would answer it." };
      }
      if (asks.length) return { pass: false, says: "A question with braces, but no !probe inside them yet." };
      return { pass: false, says: "No question with a probe yet. Try ?[\"a question\"]{ !probe{ \"what to try\" } }." };
    },
  };

  function read(parseLine, stepId, line) {
    const panel = PANELS.get(stepId);
    const text = String(line == null ? "" : line);
    const reading = { step: stepId, line: text, state: "empty", says: "", balloon: panel ? panel.balloon : "caption", operators: [], containers: [], prose: false };
    if (!panel || !(panel.check in CHECKS || panel.check === "commands_pass")) return { ...reading, state: "fail", says: "There is no panel by that name." };
    if (panel.check === "commands_pass") {
      return { ...reading, state: "terminal", says: "In a repository with the workbench mounted, both commands should exit 0. They run in a terminal; this page does not run them." };
    }
    if (!text.trim()) return { ...reading, says: "Write a line, and Spw reads it here." };
    let result;
    try {
      result = parseLine(text);
    } catch {
      return { ...reading, state: "fail", says: "The parser stopped on this line." };
    }
    const verdict = CHECKS[panel.check](result, nodesIn(result.ast));
    reading.state = verdict.pass ? "pass" : "fail";
    reading.says = verdict.says;
    reading.prose = Boolean(result.completeness && result.completeness.proseFallback);
    const tokens = (result.tokens || []).filter((t) => t.type !== "WHITESPACE" && t.type !== "COMMENT" && t.type !== "EOF");
    // The operator in front of the line's first word picks the balloon; without one the panel keeps its own.
    const lead = tokens[0] ? (tokens[0].type === "PARTICLE" ? tokens[0].value.slice(0, 2) : tokens[0].type === "OPERATOR" ? tokens[0].value : "") : "";
    if (data.balloons[lead]) reading.balloon = data.balloons[lead];
    const seen = new Set();
    for (const token of tokens) {
      if (token.type === "OPERATOR" && !seen.has(token.value)) {
        seen.add(token.value);
        const op = OPS.get(token.value);
        reading.operators.push(op ? { sigil: op.sigil, name: op.name, reads: op.reads } : { sigil: token.value, name: "", reads: "An operator this guide does not name yet." });
      } else if (token.type === "PARTICLE" && !seen.has(token.value.slice(0, 2))) {
        const sigil = token.value.slice(0, 2);
        const op = OPS.get(sigil[0]);
        seen.add(sigil);
        reading.operators.push({ sigil, name: op ? op.name : "", reads: data.particles[token.kind] || (op ? op.reads : "") });
      } else if ((token.type === "CONTAINER_OPEN" || token.type === "CAPSULE_OPEN") && BRACES.has(token.value) && !seen.has(token.value)) {
        seen.add(token.value);
        const c = BRACES.get(token.value);
        reading.containers.push({ pair: `${c.open} ${c.close}`, name: c.name, reads: c.reads });
      }
    }
    const held = text.match(/\{([^{}]*)\}/);
    const entry = held && reading.containers.find((c) => c.name === "definition");
    if (entry) {
      const body = held[1];
      if (body.includes(",")) {
        const count = body.split(",").map((part) => part.trim()).filter(Boolean).length;
        entry.count = `${count} part${count === 1 ? "" : "s"}`;
      } else if (body.includes(".")) entry.count = "1 name";
      else if (body.trim()) entry.count = "1 part";
    }
    return reading;
  }

  const LABELS = { pass: "Passes.", fail: "Not yet.", empty: "Empty.", terminal: "Runs in a terminal." };
  function render(reading) {
    const id = esc(reading.step);
    const says = reading.state === "pass" ? "" : ` ${esc(reading.says)}`;
    const html = `<p class="check" id="check-${id}" data-state="${reading.state}"><strong>${LABELS[reading.state]}</strong>${says}</p>`;
    if (reading.state === "terminal") {
      return `${html}<p class="note"><a href="/install">Install the workbench</a>, or give an agent <a href="/init">the recipe</a>; it ends with this panel.</p>`;
    }
    if (reading.state === "empty") return html;
    const items = [
      ...reading.operators.map((op) => `<li><code class="mark">${esc(op.sigil)}</code><span>${op.name ? `<a href="/#op-${esc(op.name)}">${esc(op.name)}</a> ` : ""}${esc(op.reads)}</span></li>`),
      ...reading.containers.map((c) => `<li><code class="mark">${esc(c.pair)}</code><span><a href="/#brace-${esc(c.name)}">${esc(c.name)}</a> ${esc(c.reads)}${c.count ? ` <span class="held">${esc(c.count)}</span>` : ""}</span></li>`),
    ];
    return html
      + (items.length ? `<ul class="parts" aria-label="What Spw reads in the line">${items.join("")}</ul>` : `<p class="note">No marks and no braces: Spw keeps these as words.</p>`)
      + (reading.prose ? `<p class="note">Something in this line did not close, so Spw kept the line as plain words.</p>` : "");
  }

  const balloonWord = (kind) => data.balloonWords[kind] || kind;
  return { read, render, balloonWord };
}

const kit = readingKit(READER_DATA);

/** The reading of one line for one panel, by the worker. */
export function readLine(stepId, line) {
  return kit.read(parse, stepId, String(line ?? "").slice(0, LINE_LIMIT));
}

export const renderReading = (reading) => kit.render(reading);

/** Scripts on: the page imports /parser.js and reads each line as it changes. Scripts off, the forms go to /read. */
function liveReader(kit, parseLine) {
  const say = (message) => {
    const status = document.getElementById("status");
    if (!status) return;
    status.textContent = "";
    setTimeout(() => { status.textContent = message; }, 50);
  };
  for (const form of document.querySelectorAll("form.line")) {
    const id = form.elements.step.value;
    const input = form.elements.line;
    const out = document.getElementById(`reading-${id}`);
    const balloon = form.querySelector(".balloon");
    const kind = form.querySelector(".kind");
    let last = out.querySelector(".check")?.dataset.state;
    let queued = false;
    const update = (speak) => {
      queued = false;
      const reading = kit.read(parseLine, id, input.value);
      out.innerHTML = kit.render(reading);
      if (balloon) balloon.dataset.bubble = reading.balloon;
      if (kind) kind.textContent = kit.balloonWord(reading.balloon);
      if (speak || reading.state !== last) say(`${id}: ${out.querySelector(".check").textContent}`);
      last = reading.state;
    };
    // Browsers without field-sizing grow the balloon to its line here; Enter reads instead of breaking the line.
    const fit = () => {
      if (CSS.supports("field-sizing", "content")) return;
      input.style.height = "auto";
      input.style.height = `${input.scrollHeight}px`;
    };
    fit();
    input.addEventListener("input", () => {
      fit();
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => update(false));
    });
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
      event.preventDefault();
      form.requestSubmit();
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      update(true);
    });
  }
  for (const link of document.querySelectorAll("a[data-then]")) {
    link.addEventListener("click", (event) => {
      const input = document.getElementById(`line-${link.dataset.then}`);
      if (!input) return;
      event.preventDefault();
      input.value = link.textContent;
      input.dispatchEvent(new Event("input"));
      input.focus();
    });
  }
}

/**
 * The module script the guide carries. The guide's CSP allows it: script-src 'self' (for /parser.js) and 'unsafe-inline'.
 * A loader (the guide's ?parser= switch) replaces the static import: `before` binds parse, `after` runs once the reader is live.
 */
export function liveScript(loader) {
  const data = JSON.stringify(READER_DATA).replace(/</g, "\\u003c");
  const start = `(${liveReader.toString()})((${readingKit.toString()})(${data}), parse);`;
  if (!loader) return `<script type="module">
import { parse } from "/parser.js";
${start}
</script>`;
  return `<script type="module">
${loader.before}
${start}
${loader.after}
</script>`;
}
