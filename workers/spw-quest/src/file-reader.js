// The file reader: what a tool can take from a whole .spw file. The same kit
// runs in the worker, so the guide and /build read with scripts off, and in the
// page, where it reads again as the file changes. Both hand it the parse
// function from the site's parser bundle.
import { parse } from "../../../public/js/semantic/spw-workbench-reader.js";
import { PEER_BRACES, PEER_SIGILS } from "../../lib/peer-kit.js";
import { escapeHtml } from "../../lib/shell.js";
import { noteKit } from "./note.js";
import { OPERATORS } from "./guide.js";

export const FILE_LIMIT = 65536;

export const FILE_DATA = Object.freeze({
  operators: OPERATORS.map(({ sigil, name }) => ({ sigil, name })),
  // Sigil to operator type, for the paint; particles and braces by their aim.
  types: Object.fromEntries(PEER_SIGILS.map(({ sigil, type }) => [sigil, type])),
  braces: Object.fromEntries(PEER_BRACES.map(({ open, type }) => [open, type])),
});

/**
 * Self-contained so it can travel to the page by toString(): nothing inside
 * may reach outside it. Facts come from the parser's AST and tokens; checks are
 * the questions a tool would ask of the file.
 */
export function fileKit(data) {
  const NAMES = new Map(data.operators.map((op) => [op.sigil, op.name]));
  const CLOSES = { ">": "<", ")": "(", "]": "[", "}": "{" };
  const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const unquote = (v) => String(v || "").replace(/^["'`]|["'`]$/g, "");
  const squash = (v) => String(v || "").replace(/\s+/g, " ").trim();
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
  const spanText = (source, node) => (node && node.span && node.span.start && node.span.end
    ? source.slice(node.span.start.offset, node.span.end.offset) : "");
  const inner = (text) => squash(String(text).replace(/^\s*\{|\}\s*$/g, ""));
  const ENTRY = /^\[(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}))?\]\s*(?:([A-Za-z][\w-]*)\s*(?:—|–|--|-)\s*)?(.*)$/;

  function read(parseFile, source) {
    const text = String(source == null ? "" : source);
    const reading = { text, ok: false, prose: false, tokens: [], names: [], tags: [], blocks: [], marked: [], links: [], entries: [], questions: [], frames: [], fields: [], notes: [], marks: [], checks: [] };
    if (!text.trim()) {
      reading.checks.push({ state: "empty", says: "Write something, and Spw reads it here." });
      return reading;
    }
    let result;
    try {
      result = parseFile(text);
    } catch {
      reading.checks.push({ state: "fail", says: "The parser stopped on this file." });
      return reading;
    }
    reading.tokens = (result.tokens || []).filter((t) => t.type !== "EOF");
    reading.ok = result.success === true;
    reading.prose = Boolean(result.completeness && result.completeness.proseFallback);
    const nodes = nodesIn(result.ast);

    for (const n of nodes) {
      if (n.type === "Particle" && n.name) {
        if (n.aim === ">") reading.names.push(n.name.value);
        else reading.tags.push(n.token ? n.token.value : `#${n.aim}${n.name.value}`);
      } else if (n.type === "Binding" && n.key && n.key.type === "Reference") {
        const ref = nodesIn(n.value).find((m) => m.type === "PathRef");
        if (ref && ref.path && ref.path.token) reading.links.push({ name: n.key.raw || "", path: unquote(ref.path.token.value) });
      } else if (n.type === "Bullet" && n.marker && n.marker.kind === ">>" && n.item) {
        const line = squash(n.item.text || spanText(text, n.item));
        const m = line.match(ENTRY);
        reading.entries.push(m ? { date: m[1], time: m[2] || "", kind: (m[3] || "").toLowerCase(), text: m[4] } : { date: "", time: "", kind: "", text: line });
      } else if (n.type === "Annotation" && n.name) {
        reading.notes.push({ name: n.name.value, value: unquote(n.value && n.value.token ? n.value.token.value : spanText(text, n.value)) });
      }
      // A word after = is a field's value or a mode (reg=facet), not a marked word.
      if (n.type === "Operation" && n.operator && n.operator.value !== "=" && n.operatorLabel && n.operatorLabel.type === "IDENTIFIER") {
        reading.marked.push({ sigil: n.operator.value, word: n.operatorLabel.value });
      }
      if (n.type === "Operation" && n.operator && n.operator.value === "^" && n.subject && n.subject.token && n.body) {
        reading.blocks.push(unquote(n.subject.token.value));
      } else if (n.type === "Operation" && n.operator && n.frame && n.frame.type === "Frame") {
        const param = (n.frame.content || []).find((p) => p && p.type === "Parameter");
        if (!param || !param.value) continue;
        const sigil = n.operator.value;
        if (sigil === "?" && param.value.type === "Literal") {
          const probe = n.body ? nodesIn(n.body).find((m) => m.type === "Operation" && m.operator && m.operator.value === "!" && m.operatorLabel && m.operatorLabel.value === "probe") : null;
          reading.questions.push({ text: unquote(param.value.token.value), probe: probe ? unquote(inner(spanText(text, probe.body))) : "" });
        } else {
          const id = nodesIn(param.value).find((m) => m.type === "Identifier");
          // A frame that holds frames (#[episode]) lists them; its own text would repeat theirs.
          const holds = n.body && nodesIn(n.body).some((m) => m.type === "Operation" && m.frame);
          if (id && id.token) reading.frames.push({ sigil, word: id.token.value, text: n.body && !holds ? inner(spanText(text, n.body)) : "" });
        }
      }
    }

    // key = value, read from tokens: the AST keeps the three apart. [reg=facet] is a mode, not a field.
    const words = reading.tokens.filter((t) => t.type !== "WHITESPACE" && t.type !== "NEWLINE" && t.type !== "COMMENT");
    let square = 0;
    words.forEach((t, i) => {
      if (t.type === "CONTAINER_OPEN" && t.value === "[") square += 1;
      if (t.type === "CONTAINER_CLOSE" && t.value === "]") square = Math.max(0, square - 1);
      const eq = words[i + 1];
      const value = words[i + 2];
      if (!square && t.type === "IDENTIFIER" && eq && eq.type === "OPERATOR" && eq.value === "=" && value) {
        const literal = ["PHRASE", "STRING", "IDENTIFIER", "NUMBER"].includes(value.type);
        reading.fields.push({ key: t.value, value: literal ? unquote(value.value) : "…" });
      }
    });

    const counts = new Map();
    for (const t of reading.tokens) {
      const sigil = t.type === "OPERATOR" ? t.value : t.type === "PARTICLE" ? t.value.slice(0, 1) : "";
      if (sigil && NAMES.has(sigil)) counts.set(sigil, (counts.get(sigil) || 0) + 1);
    }
    reading.marks = [...counts].map(([sigil, count]) => ({ sigil, name: NAMES.get(sigil), type: data.types[sigil] || "", count }));

    // The questions a tool would ask of this file.
    const checks = reading.checks;
    checks.push(reading.ok && !reading.prose
      ? { state: "pass", says: "Spw read the whole file." }
      : { state: "fail", says: "Part of this file did not close, so Spw kept it as plain words." });
    if (reading.entries.length) {
      const loose = reading.entries.filter((e) => !e.date || !e.kind).length;
      checks.push(loose
        ? { state: "fail", says: `${loose} of ${reading.entries.length} entries ${loose === 1 ? "has" : "have"} no [date] and kind yet.` }
        : { state: "pass", says: `Every entry has a date and a kind.` });
    }
    if (reading.questions.length) {
      const open = reading.questions.filter((q) => !q.probe).length;
      checks.push(open
        ? { state: "fail", says: `${open === 1 ? "A question has" : `${open} questions have`} no !probe yet: nothing says what would answer it.` }
        : { state: "pass", says: "Every question carries a probe that would answer it." });
    }
    if (reading.frames.some((f) => f.word === "episode")) {
      const said = new Set(reading.frames.map((f) => f.word));
      const missing = ["scene", "change", "verify"].filter((w) => !said.has(w));
      checks.push(missing.length
        ? { state: "fail", says: `No ${missing.map((w) => `[${w}]`).join(" or ")} yet${missing.includes("verify") ? ": it does not say how the change was checked" : ""}.` }
        : { state: "pass", says: "Says what happened, what changed, and how it was checked." });
    }
    if (reading.links.length) {
      checks.push({ state: "info", says: `${reading.links.length} ${reading.links.length === 1 ? "path" : "paths"} to follow. In a repository, spw resolve checks that each one exists.` });
    }
    const status = reading.fields.find((f) => f.key === "status");
    if (status) checks.push({ state: "info", says: `Status: ${status.value}.` });
    return reading;
  }

  /** The source with each token wrapped by kind; every character comes back once, in order. */
  function paint(source, tokens) {
    const text = String(source == null ? "" : source);
    let at = 0;
    let out = "";
    const sorted = (tokens || []).filter((t) => t.span && t.span.start && t.span.end).sort((a, b) => a.span.start.offset - b.span.start.offset);
    for (const t of sorted) {
      const start = t.span.start.offset;
      const end = t.span.end.offset;
      if (start < at || end <= start) continue;
      out += esc(text.slice(at, start));
      const raw = esc(text.slice(start, end));
      let kind = "";
      if (t.type === "OPERATOR") kind = data.types[t.value] || "op";
      else if (t.type === "PARTICLE") kind = data.types[t.value.slice(0, 2)] || data.types["#"] || "op";
      else if (t.type === "CONTAINER_OPEN" || t.type === "CAPSULE_OPEN") kind = `b-${data.braces[t.value] || "x"}`;
      else if (t.type === "CONTAINER_CLOSE" || t.type === "CAPSULE_CLOSE") kind = `b-${data.braces[CLOSES[t.value]] || "x"}`;
      else if (t.type === "STRING" || t.type === "PHRASE") kind = "s";
      else if (t.type === "ANNOTATION") kind = "a";
      else if (t.type === "STREAM_CLOSE" || t.type === "STREAM_OPEN") kind = "stream";
      else if (t.type === "COMMENT") kind = "c";
      out += kind ? `<span data-t="${kind}">${raw}</span>` : raw;
      at = end;
    }
    return out + esc(text.slice(at));
  }

  const mark = (sigil, type) => `<code class="sig" data-t="${esc(type)}">${esc(sigil)}</code>`;
  const row = (term, body) => `<div><dt>${term}</dt><dd>${body}</dd></div>`;

  /** The reading as the page shows it: the facts, then the checks, then the marks used. */
  function outline(reading) {
    const facts = [];
    if (reading.names.length || reading.tags.length) {
      facts.push(row("Answers to", [
        ...reading.names.map((n) => `<code>#&gt;${esc(n)}</code>`),
        ...reading.tags.map((t) => `<code class="tag">${esc(t)}</code>`),
      ].join(" ")));
    }
    // A probe already shows under the question it answers.
    const marked = reading.marked.filter((m) => !(m.sigil === "!" && m.word === "probe" && reading.questions.length));
    if (marked.length) {
      facts.push(row("Marked words", `<ul class="pairs">${marked.map((m) => `<li>${mark(m.sigil, data.types[m.sigil] || "")}<span><span class="key">${esc(m.word)}</span> ${esc(NAMES.get(m.sigil) || "")}</span></li>`).join("")}</ul>`));
    }
    if (reading.blocks.length) {
      facts.push(row("Holds", reading.blocks.map((b) => `<code>^"${esc(b)}"</code>`).join(" ")));
    }
    if (reading.entries.length) {
      const kinds = new Map();
      for (const e of reading.entries) if (e.kind) kinds.set(e.kind, (kinds.get(e.kind) || 0) + 1);
      const dates = reading.entries.map((e) => e.date).filter(Boolean).sort();
      const span = dates.length ? (dates[0] === dates.at(-1) ? dates[0] : `${dates[0]} to ${dates.at(-1)}`) : "";
      facts.push(row(`Entries <span class="count">${reading.entries.length}</span>`, `${span ? `<p class="span">${esc(span)}</p>` : ""}${kinds.size ? `<p class="kinds">${[...kinds].map(([k, n]) => `<span class="kind">${esc(k)} <span class="count">${n}</span></span>`).join("")}</p>` : ""}<ol class="entries">${reading.entries.map((e) => `<li><span class="when">${esc(e.date || "no date")}</span><span class="kind">${esc(e.kind || "—")}</span><span class="what">${esc(e.text)}</span></li>`).join("")}</ol>`));
    }
    if (reading.questions.length) {
      facts.push(row("Asks", reading.questions.map((q) => `<p class="q">${esc(q.text)}</p>${q.probe ? `<p class="probe">${mark("!", data.types["!"] || "action")} probe: ${esc(q.probe)}</p>` : ""}`).join("")));
    }
    if (reading.notes.length) {
      facts.push(row("Notes", reading.notes.map((n) => `<p><span class="key">${esc(n.name)}</span> ${esc(n.value)}</p>`).join("")));
    }
    if (reading.frames.length) {
      facts.push(row("Frames", `<ul class="frames">${reading.frames.map((f) => `<li>${mark(f.sigil, data.types[f.sigil] || "")}<span class="key">[${esc(f.word)}]</span><span>${esc(f.text)}</span></li>`).join("")}</ul>`));
    }
    if (reading.fields.length) {
      facts.push(row("Fields", `<ul class="pairs">${reading.fields.map((f) => `<li><span class="key">${esc(f.key)}</span><span>${esc(f.value)}</span></li>`).join("")}</ul>`));
    }
    if (reading.links.length) {
      facts.push(row("Points to", `<ul class="links">${reading.links.map((l) => `<li><span class="key">@${esc(l.name)}</span><code>${esc(l.path)}</code></li>`).join("")}</ul>`));
    }
    const checks = `<ul class="checks" aria-label="Checks">${reading.checks.map((c) => `<li data-state="${esc(c.state)}">${esc(c.says)}</li>`).join("")}</ul>`;
    const marks = reading.marks.length
      ? `<p class="marks"><span class="label">Marks</span> ${reading.marks.map((m) => `<a href="/#op-${esc(m.name)}" title="${esc(m.name)}">${mark(m.sigil, m.type)}<span class="sr-only"> ${esc(m.name)},</span><span class="count">${m.count}</span></a>`).join(" ")}</p>`
      : "";
    return `${checks}${facts.length ? `<dl class="facts">${facts.join("")}</dl>` : ""}${marks}`;
  }

  return { read, paint, outline };
}

const kit = fileKit(FILE_DATA);

/** A file's reading, by the worker. */
export const readFile = (source) => kit.read(parse, String(source ?? "").slice(0, FILE_LIMIT));
export const paintFile = (reading) => kit.paint(reading.text, reading.tokens);
export const outlineFile = (reading) => kit.outline(reading);

/**
 * The editor: the file as a field, and the same file painted behind it. With
 * scripts off the field is all there is; once the page's parser runs, the
 * field's text turns clear and the paint shows through, kept in step as it changes.
 */
export function editorField({ id, name = "script", value, label, limit = FILE_LIMIT, describedBy = "" }) {
  const reading = readFile(value);
  return `<div class="editor">
        <pre class="paint" aria-hidden="true"><code>${paintFile(reading)}\n</code></pre>
        <label class="sr-only" for="${id}">${label}</label>
        <textarea id="${id}" name="${name}" maxlength="${limit}" spellcheck="false" autocomplete="off" autocapitalize="none" wrap="soft"${describedBy ? ` aria-describedby="${describedBy}"` : ""}>${escapeHtml(value)}</textarea>
      </div>`;
}

/**
 * Scripts on: read the file again as it changes, repaint it, and redraw its
 * reading. Example tabs swap the file in place and keep the address.
 */
function liveFile(kit, parseFile, examples, noteApi) {
  const form = document.querySelector("form[data-file]");
  if (!form) return;
  const field = form.querySelector("textarea");
  const paintCode = form.querySelector(".paint code");
  const out = document.getElementById("reading");
  const editor = form.querySelector(".editor");
  // The guide's note (noteBoot set form.spwNote); /build has none, and its tabs and edits behave as before.
  const note = noteApi && form.spwNote ? form.spwNote : null;
  const limit = field.maxLength > 0 ? field.maxLength : 65536;
  const nameInput = form.querySelector('input[name="filename"]');
  let queued = false;
  const run = () => {
    queued = false;
    const reading = kit.read(parseFile, field.value);
    paintCode.innerHTML = `${kit.paint(field.value, reading.tokens)}\n`;
    if (out) out.innerHTML = kit.outline(reading);
  };
  const keep = () => {
    if (!note) return;
    const decision = noteApi.decideInput({ choiceOpen: form.dataset.noteChoice === "open", field: field.value, shelf: examples, filename: nameInput ? nameInput.value : "line.spw", limit, search: location.search });
    if (!decision.write) return;
    note.write(decision.write);
    note.show("");
    if (decision.from) note.chrome(decision.from);
    if (decision.url !== `${location.pathname}${location.search}${location.hash}`) history.replaceState(null, "", decision.url);
  };
  const soon = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      run();
      keep();
    });
  };
  run();
  editor.dataset.live = "";
  field.addEventListener("input", soon);
  // A choice resolved, or boot painted the note: repaint, never write.
  form.addEventListener("spw:note-painted", () => requestAnimationFrame(run));

  const tabs = [...document.querySelectorAll("[data-example]")];
  const byId = new Map(examples.map((example) => [example.id, example]));
  const apply = (example) => {
    field.value = example.script;
    for (const other of tabs) {
      if (other.dataset.example === example.id) other.setAttribute("aria-current", "page");
      else other.removeAttribute("aria-current");
    }
    const set = (selector, text) => { const node = document.querySelector(selector); if (node) node.textContent = text; };
    set("[data-file-name]", example.file);
    set("[data-file-says]", example.says);
    set("[data-file-try]", example.try);
    if (nameInput) nameInput.value = example.file;
    run();
  };
  for (const tab of tabs) {
    tab.addEventListener("click", (event) => {
      const example = byId.get(tab.dataset.example);
      if (!example || event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      if (!note) {
        apply(example);
        history.replaceState(null, "", `?example=${example.id}#try`);
        return;
      }
      const current = byId.get(tabs.find((other) => other.getAttribute("aria-current"))?.dataset.example || "");
      const decision = noteApi.decideTemplate({ choiceOpen: form.dataset.noteChoice === "open", field: field.value, currentScript: current ? current.script : null, stored: note.read(), target: example, search: location.search, limit });
      if (decision.ask) {
        note.openChoice(example.id);
        return;
      }
      if (!decision.assign) return;
      apply(example);
      if (decision.write) note.write(decision.write);
      note.show("");
      history.replaceState(null, "", decision.url);
    });
  }

  // Another tab wrote the note. An idle field follows it; a field being edited asks first. Nothing merges or writes.
  if (note) {
    window.addEventListener("storage", (event) => {
      if (event.key !== noteApi.key || form.dataset.noteChoice === "open") return;
      const stored = noteApi.fromJson(event.newValue, limit);
      if (!stored || stored.script === field.value) return;
      const load = () => {
        field.value = stored.script;
        if (nameInput) nameInput.value = stored.filename;
        const name = document.querySelector("[data-file-name]");
        if (name) name.textContent = stored.filename;
        note.chrome(stored.from);
        note.show("");
        run();
      };
      if (document.activeElement !== field) {
        load();
        return;
      }
      note.show("This note changed in another tab.");
      const state = form.querySelector("[data-note-state]");
      if (state && !state.querySelector("button")) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "quiet-button";
        button.textContent = "Load it";
        button.addEventListener("click", () => {
          const latest = noteApi.fromJson(localStorage.getItem(noteApi.key), limit);
          if (latest) {
            stored.script = latest.script;
            stored.filename = latest.filename;
            stored.from = latest.from;
          }
          load();
        }, { once: true });
        state.append(" ", button);
      }
    });
  }
}

/** The module script that starts liveFile with /parser.js (or a switched build). */
export function liveFileScript(examples = [], loader, { note = false } = {}) {
  const data = JSON.stringify(FILE_DATA).replace(/</g, "\\u003c");
  const shelf = JSON.stringify(examples.map(({ id, file, says, try: attempt, script }) => ({ id, file, says, try: attempt, script }))).replace(/</g, "\\u003c");
  const noteApi = note ? `(${noteKit.toString()})()` : "null";
  const start = `(${liveFile.toString()})((${fileKit.toString()})(${data}), parse, ${shelf}, ${noteApi});`;
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

/**
 * The file area. The paint and the field share one grid cell, one font, one
 * padding and one wrap, so each character of the paint sits under its own
 * character in the field. The paint is always laid out (hidden until the
 * parser runs), so the field never changes height when it turns live.
 */
export const FILE_CSS = `.try { margin: 0; }
    .examples { display: flex; flex-wrap: wrap; gap: .35rem; margin: 0 0 .8rem; }
    .examples a { display: grid; gap: .05rem; min-height: 44px; padding: .4rem .8rem .45rem; border: 1px solid var(--line); border-radius: var(--radius); background: color-mix(in srgb, var(--surface) 55%, transparent); color: var(--fg); text-decoration: none; }
    .examples .tab { font-weight: 600; font-size: .95rem; line-height: 1.2; }
    .examples .file { color: var(--muted); font: .74rem/1.2 var(--mono); }
    .examples a:hover, .examples a:focus-visible { border-color: var(--accent); }
    .examples a[aria-current] { border-color: var(--accent); background: var(--field); box-shadow: inset 0 -2px 0 var(--accent); }
    .examples a[aria-current] .file { color: var(--accent); }
    .workspace { display: grid; gap: 1rem; align-items: start; }
    @media (min-width: 60rem) { .workspace { grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 1.25rem; } .reading-card { position: sticky; top: 1rem; } }
    form.file, .build form.script { margin: 0; border: 1px solid var(--edge); border-radius: var(--radius); background: var(--field); box-shadow: var(--shadow); overflow: hidden; }
    .file-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .3rem .8rem; padding: .35rem .5rem .35rem .95rem; border-bottom: 1px solid var(--line); background: var(--surface); }
    .file-name { margin: 0; }
    .file-name code { font-size: .86rem; font-weight: 600; }
    .file-actions { display: flex; flex-wrap: wrap; gap: .15rem; }
    .says { margin: 0; padding: .7rem 1rem 0; color: var(--ink-soft); font-size: .92rem; line-height: 1.45; }
    .note-choice, .note-state { margin: 0; padding: .6rem 1rem 0; font-size: .9rem; line-height: 1.4; }
    .note-choice { display: grid; gap: .15rem; padding-bottom: .45rem; border-bottom: 1px solid var(--line); background: var(--accent-soft); color: var(--fg); }
    .note-choice > span:first-child { font-weight: 600; }
    .note-choice-actions { display: flex; flex-wrap: wrap; gap: .25rem; margin-inline-start: -.75rem; }
    .note-state { color: var(--muted); }
    .editor { position: relative; display: grid; margin: .2rem 0 0; }
    .editor > .paint, .editor > textarea { grid-area: 1 / 1; box-sizing: border-box; width: 100%; margin: 0; padding: .6rem 1rem .9rem; border: 0; border-radius: 0; font: .92rem/1.65 var(--mono); letter-spacing: 0; tab-size: 2; white-space: pre-wrap; overflow-wrap: anywhere; word-break: normal; }
    .editor > .paint { visibility: hidden; overflow: hidden; pointer-events: none; color: var(--fg); background: transparent; }
    .editor > .paint code { font: inherit; }
    .editor > textarea { min-height: 100%; resize: none; overflow: hidden; background: transparent; color: var(--fg); caret-color: var(--accent); box-shadow: none; outline: none; }
    html:not(.js) .editor > textarea, .editor:not([data-live]) > textarea { min-height: 10rem; overflow: auto; resize: vertical; }
    .editor[data-live] > .paint { visibility: visible; }
    .editor[data-live] > textarea { color: transparent; -webkit-text-fill-color: transparent; }
    .editor > textarea::selection { background: var(--accent-soft); -webkit-text-fill-color: transparent; }
    .editor:focus-within { box-shadow: inset 3px 0 0 var(--accent); }
    @media (pointer: coarse) { .editor > .paint, .editor > textarea { font-size: 1rem; } }
    .file-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .3rem 1rem; padding: .55rem .5rem .55rem 1rem; border-top: 1px dashed var(--line); }
    .try-this { flex: 1 1 18rem; margin: 0; color: var(--muted); font-size: .88rem; line-height: 1.4; }
    .try-this .label { margin-right: .3rem; color: var(--accent); font-weight: 650; }
    .reading-card { padding: .95rem 1.05rem 1.05rem; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
    .reading-card > h2 { margin: 0 0 .6rem; font-size: 1.12rem; }
    #reading { display: grid; gap: .8rem; }
    .checks { display: grid; gap: .3rem; margin: 0; padding: 0; list-style: none; }
    .checks li { display: grid; grid-template-columns: 1.2rem minmax(0, 1fr); gap: .45rem; margin: 0; font-size: .93rem; line-height: 1.4; }
    .checks li::before { content: "·"; color: var(--muted); font: 700 .95rem/1.4 var(--mono); text-align: center; }
    .checks li[data-state="pass"]::before { content: "✓"; color: var(--accent); }
    .checks li[data-state="fail"] { color: var(--warn); }
    .checks li[data-state="fail"]::before { content: "!"; color: var(--warn); }
    .checks li[data-state="info"]::before { content: "→"; color: var(--muted); }
    .facts { display: grid; margin: 0; border-top: 1px solid var(--line); }
    .facts > div { display: grid; grid-template-columns: 6.6rem minmax(0, 1fr); gap: .1rem .8rem; padding: .5rem 0; border-bottom: 1px solid var(--line); }
    .facts dt { color: var(--muted); font: 600 .74rem/1.6 var(--font); letter-spacing: .06em; text-transform: uppercase; }
    .facts dd { margin: 0; font-size: .92rem; line-height: 1.45; }
    .facts dd p { margin: 0 0 .2rem; }
    .facts code { font-size: .84rem; overflow-wrap: anywhere; }
    .facts .tag { color: var(--muted); }
    .facts .count { color: var(--muted); font: .8rem/1 var(--mono); font-variant-numeric: tabular-nums; }
    .facts .span { color: var(--muted); font: .8rem/1.4 var(--mono); }
    .facts .kinds { display: flex; flex-wrap: wrap; gap: .3rem; }
    .facts .kind { padding: 0 .4rem; border-radius: 3px; background: color-mix(in srgb, var(--op-stream-color) 12%, transparent); color: var(--op-stream-color); font: .78rem/1.5 var(--mono); }
    .entries, .frames, .pairs, .links { display: grid; gap: .3rem; margin: .3rem 0 0; padding: 0; list-style: none; }
    .entries li { display: grid; grid-template-columns: 5.6rem 4.4rem minmax(0, 1fr); gap: .5rem; align-items: baseline; margin: 0; }
    .entries .when { color: var(--muted); font: .78rem/1.4 var(--mono); font-variant-numeric: tabular-nums; }
    .entries .kind { justify-self: start; }
    .frames li, .pairs li, .links li { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: .45rem; align-items: baseline; margin: 0; }
    .frames li { grid-template-columns: 1rem auto minmax(0, 1fr); }
    .facts .key { color: var(--fg); font: 600 .82rem/1.4 var(--mono); }
    .facts .q { font-family: var(--manuscript); font-size: 1.05rem; line-height: 1.35; }
    .facts .probe { color: var(--ink-soft); }
    .sig { font-weight: 700; }
    .marks { display: flex; flex-wrap: wrap; align-items: center; gap: .25rem .5rem; margin: 0; }
    .marks .label { color: var(--muted); font: 600 .74rem/1.6 var(--font); letter-spacing: .06em; text-transform: uppercase; }
    .marks a { display: inline-flex; align-items: baseline; gap: .2rem; min-height: 32px; padding: 0 .35rem; border-radius: 3px; text-decoration: none; }
    .marks a:hover, .marks a:focus-visible { background: var(--accent-soft); }
    .marks .count { color: var(--muted); font: .74rem/1 var(--mono); }
    @media (max-width: 30rem) { .facts > div { grid-template-columns: minmax(0, 1fr); } .entries li { grid-template-columns: 5.4rem minmax(0, 1fr); } .entries .what { grid-column: 1 / -1; } }
    @media (prefers-reduced-motion: no-preference) { #reading > * { transition: opacity 160ms ease; } }`;
