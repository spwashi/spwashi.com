// The file reader: what a tool can take from a whole .spw file. The same kit
// runs in the worker, so the guide and /build read with scripts off, and in the
// page, where it reads again as the file changes. Both hand it the parse
// function from the site's parser bundle.
import { parse } from "../../../public/js/semantic/spw-workbench-reader.js";
import { PEER_BRACES, PEER_SIGILS } from "../../lib/peer-kit.js";
import { escapeHtml } from "../../lib/shell.js";
import { noteKit } from "./note.js";
import { CONTAINERS, OPERATORS } from "./guide.js";

export const FILE_LIMIT = 65536;

export const FILE_DATA = Object.freeze({
  operators: OPERATORS.map(({ sigil, name }) => ({ sigil, name })),
  // Sigil to operator type, for the paint; particles and braces by their aim.
  types: Object.fromEntries(PEER_SIGILS.map(({ sigil, type }) => [sigil, type])),
  braces: Object.fromEntries(PEER_BRACES.map(({ open, type }) => [open, type])),
  // Each pair by the slot it names, for the hand: [ ] is the mode wherever it sits.
  pairs: Object.fromEntries(CONTAINERS.map(({ open, close, name }) => [open, { close, name }])),
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
  // {a, b, c}@d is one field: the names in company, then the subject they regard.
  const companyAt = (words, start) => {
    const open = words[start];
    if (!open || open.value !== "{") return "";
    let depth = 0;
    const names = [];
    for (let j = start; j < words.length; j++) {
      const t = words[j];
      if (t.value === "{") {
        depth += 1;
        if (depth > 1) return "";
      } else if (t.value === "}") {
        depth -= 1;
        if (depth === 0) {
          const at = words[j + 1];
          const who = words[j + 2];
          if (at && at.value === "@" && who && who.type === "IDENTIFIER" && names.length) return `${names.join(", ")} @ ${who.value}`;
          return "";
        }
      } else if (depth === 1 && t.type === "IDENTIFIER") names.push(t.value);
    }
    return "";
  };

  function read(parseFile, source) {
    const text = String(source == null ? "" : source);
    const reading = { text, ok: false, prose: false, theme: "", tokens: [], names: [], tags: [], blocks: [], marked: [], links: [], entries: [], questions: [], frames: [], fields: [], notes: [], marks: [], checks: [] };
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

    // key = value, read from tokens: the AST keeps the three apart. [reg=facet] is a mode, not a field.
    // A field's shape is its value to the end of its statement, the first line break outside every
    // brace, with its spaces squashed and each body inside a body folded to {…}, as a line's summary
    // at depth 1 folds it. A single word, number or phrase is its own shape.
    const all = reading.tokens;
    const index = new Map(all.map((t, k) => [t, k]));
    const at = (t, side) => (t && t.span && t.span[side] ? t.span[side].offset : -1);
    const SHAPE = 96;
    const held = [];
    const words = all.filter((t) => t.type !== "WHITESPACE" && t.type !== "NEWLINE" && t.type !== "COMMENT");
    let square = 0;
    words.forEach((t, i) => {
      if (t.type === "CONTAINER_OPEN" && t.value === "[") square += 1;
      if (t.type === "CONTAINER_CLOSE" && t.value === "]") square = Math.max(0, square - 1);
      const eq = words[i + 1];
      const value = words[i + 2];
      if (!square && t.type === "IDENTIFIER" && eq && eq.type === "OPERATOR" && eq.value === "=" && value) {
        const literal = ["PHRASE", "STRING", "IDENTIFIER", "NUMBER"].includes(value.type);
        const company = literal ? "" : companyAt(words, i + 2);
        const first = index.get(value);
        let depth = 0;
        let end = first;
        for (; end < all.length; end += 1) {
          const u = all[end];
          if (u.type === "CONTAINER_OPEN" || u.type === "CAPSULE_OPEN") depth += 1;
          else if (u.type === "CONTAINER_CLOSE" || u.type === "CAPSULE_CLOSE") {
            if (!depth) break;
            depth -= 1;
          } else if (!depth && (u.type === "WHITESPACE" || u.type === "NEWLINE") && /[\r\n]/.test(text.slice(at(u, "start"), at(u, "end")))) break;
        }
        const from = at(value, "start");
        const to = end < all.length ? at(all[end], "start") : at(all[end - 1], "end");
        held.push([at(eq, "start"), to]);
        // Fold each body inside a body, and leave comments out; every other byte stays.
        const cuts = [];
        let curly = 0;
        let inner = 0;
        let said = 0;
        for (let j = first; j < end; j += 1) {
          const u = all[j];
          if (u.type === "CONTAINER_OPEN" && u.value === "{") {
            curly += 1;
            if (curly === 2) inner = at(u, "end");
          } else if (u.type === "CONTAINER_CLOSE" && u.value === "}") {
            if (curly === 2 && text.slice(inner, at(u, "start")).trim()) cuts.push([inner, at(u, "start"), "…"]);
            curly -= 1;
          } else if (u.type === "COMMENT" && curly < 2) cuts.push([at(u, "start"), at(u, "end"), ""]);
          if (u.type !== "WHITESPACE" && u.type !== "NEWLINE" && u.type !== "COMMENT") said += 1;
        }
        let shape = "";
        let kept = from;
        for (const [a, b, put] of cuts) {
          shape += text.slice(kept, a) + put;
          kept = b;
        }
        shape = squash(shape + text.slice(kept, to));
        if (shape.length > SHAPE) shape = `${shape.slice(0, SHAPE - 1).trimEnd()}…`;
        const shown = literal ? unquote(value.value) : (company || "…");
        reading.fields.push({ key: t.value, value: shown, shape: literal && said === 1 ? shown : shape });
      }
    });

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
          // x = word[mode]: the mode belongs to the field's value, not to a frame of its own.
          const start = at(n, "start");
          if (held.some(([from, to]) => start >= from && start < to)) continue;
          const id = nodesIn(param.value).find((m) => m.type === "Identifier");
          // A frame that holds frames (#[episode]) lists them; its own text would repeat theirs.
          const holds = n.body && nodesIn(n.body).some((m) => m.type === "Operation" && m.frame);
          if (id && id.token) reading.frames.push({ sigil, word: id.token.value, text: n.body && !holds ? inner(spanText(text, n.body)) : "" });
        }
      }
    }

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
    // Theme is the consequence of a pattern the constructs page already names.
    const themeNames = new Set(["paper", "glass", "matte", "vellum", "humus", "ink", "wort"]);
    const patternNames = new Set(["pivot", "residue", "template", "departs", "ground-edge", "strata", "ferment", "intaglio"]);
    const pattern = reading.fields.find((f) => f.key === "pattern");
    const theme = reading.fields.find((f) => f.key === "theme");
    if (pattern && patternNames.has(pattern.value) && theme && themeNames.has(theme.value)) {
      reading.theme = theme.value;
      const performed = reading.fields.find((f) => f.key === "performs");
      checks.push({ state: "pass", says: `The ${pattern.value} pattern performs${performed ? ` ${performed.value}` : ""}. The theme consequence is ${theme.value}.` });
    } else if (pattern || theme) {
      checks.push({ state: "info", says: "Name a pattern and a theme of paper, glass, or matte (or vellum, humus, ink, wort) to change this field." });
    }
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
  function outline(reading, shelf) {
    const docs = shelf && shelf.docs ? shelf.docs : [];
    const self = shelf && shelf.self ? shelf.self : "";
    // The data attributes lead, so a link in a reading is never mistaken for a file's tab.
    const docLink = (doc, at, inside) => `<a data-example="${esc(doc.id)}"${at ? ` data-at="${esc(at)}"` : ""} href="${esc(`/?example=${encodeURIComponent(doc.id)}${at ? `&at=${encodeURIComponent(at)}` : ""}#try`)}">${inside}</a>`;
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
      facts.push(row("Fields", `<ul class="pairs">${reading.fields.map((f) => `<li><span class="key">${esc(f.key)}</span><span>${esc(f.shape || f.value)}</span></li>`).join("")}</ul>`));
    }
    if (reading.links.length) {
      // A path to another file open here is a way to it, landing on the line its #name names.
      facts.push(row("Points to", `<ul class="links">${reading.links.map((l) => {
        const to = fileOf(l.path);
        const doc = docs.find((d) => d.file === to.file && d.file !== self);
        const code = `<code>${esc(l.path)}</code>`;
        return `<li><span class="key">@${esc(l.name)}</span>${doc ? docLink(doc, to.at, code) : code}</li>`;
      }).join("")}</ul>`));
    }
    // The edges back: the files here whose links name this one, each landing on the line that points.
    const into = self ? docs.filter((d) => d.file !== self && (d.links || []).some((l) => l.file === self)) : [];
    if (into.length) {
      facts.push(row("Pointed to by", `<ul class="links">${into.map((d) => {
        const l = d.links.find((link) => link.file === self);
        return `<li><span class="key">@${esc(l.name)}</span>${docLink(d, l.name, `<code>${esc(d.file)}</code>`)}</li>`;
      }).join("")}</ul>`));
    }
    const checks = `<ul class="checks" aria-label="Checks">${reading.checks.map((c) => `<li data-state="${esc(c.state)}">${esc(c.says)}</li>`).join("")}</ul>`;
    const marks = reading.marks.length
      ? `<p class="marks"><span class="label">Marks</span> ${reading.marks.map((m) => `<a href="/#op-${esc(m.name)}" title="${esc(m.name)}">${mark(m.sigil, m.type)}<span class="sr-only"> ${esc(m.name)},</span><span class="count">${m.count}</span></a>`).join(" ")}</p>`
      : "";
    return `${checks}${facts.length ? `<dl class="facts">${facts.join("")}</dl>` : ""}${marks}`;
  }

  /* ---------- The hand: one line, its parts, and what a turn would change ---------- */

  const PAIRS = data.pairs || {};
  const JOIN_SAYS = { ",": "company", ";": "order", "~>": "path" };
  const OPENS = new Set(["CONTAINER_OPEN", "CAPSULE_OPEN"]);
  const SHUTS = new Set(["CONTAINER_CLOSE", "CAPSULE_CLOSE"]);
  /** A path as the file it names and the line inside it: ./themes.spw#glass is themes.spw, at glass. */
  const fileOf = (path) => {
    const [file, at = ""] = String(path || "").split("#");
    return { file: file.split("/").pop(), at };
  };
  /** A value back inside the walls its slot wears. */
  const walled = (key, value) => {
    const open = String(key).startsWith("brace:") ? key.slice(6) : "";
    return open && PAIRS[open] ? `${open}${value}${PAIRS[open].close}` : value;
  };
  const spw64 = (value) => {
    let binary = "";
    for (const byte of new TextEncoder().encode(value)) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  /** The file's lines, each with the tokens that sit wholly on it; kept on the reading. */
  function rowsOf(reading) {
    if (reading.rows) return reading.rows;
    const text = reading.text;
    const rows = [];
    for (let from = 0; ;) {
      const nl = text.indexOf("\n", from);
      rows.push({ from, to: nl < 0 ? text.length : nl, tokens: [] });
      if (nl < 0) break;
      from = nl + 1;
    }
    const sorted = reading.tokens.filter((t) => t.span && t.span.start && t.span.end).sort((a, b) => a.span.start.offset - b.span.start.offset);
    let n = 0;
    for (const t of sorted) {
      while (n < rows.length - 1 && t.span.start.offset >= rows[n + 1].from) n += 1;
      if (t.span.end.offset <= rows[n].to) rows[n].tokens.push(t);
    }
    reading.rows = rows;
    return rows;
  }

  /**
   * The parts between two offsets of one line, in order: a mark, a name, a word,
   * a phrase, or a brace pair with what it holds. `a` and `b` bound what a turn
   * replaces (inside the walls, inside the quotes). Inside a brace whose parts
   * are joined (, ; ~>), each joined run is one part.
   */
  function partsIn(reading, n, from, to, inside) {
    const seq = [];
    let depth = 0;
    let open = null;
    for (const t of rowsOf(reading)[n].tokens) {
      const a = t.span.start.offset;
      const b = t.span.end.offset;
      if (a < from || b > to) continue;
      if (OPENS.has(t.type)) {
        if (!depth) open = { kind: "brace", says: PAIRS[t.value] ? PAIRS[t.value].name : "brace", t: `b-${data.braces[t.value] || "x"}`, from: a, a: b, key: `brace:${t.value}` };
        depth += 1;
      } else if (SHUTS.has(t.type)) {
        // A close with nothing open belongs to a brace an earlier line opened.
        if (!depth) continue;
        depth -= 1;
        if (!depth && open) { seq.push({ ...open, b: a, to: b }); open = null; }
      } else if (depth) continue;
      else if (t.type === "OPERATOR") seq.push({ kind: "mark", says: NAMES.get(t.value) || "mark", t: data.types[t.value] || "op", from: a, to: b, a, b, key: "mark" });
      else if (t.type === "PARTICLE") {
        const head = /^#[>:!]/.test(t.value) ? 2 : 1;
        const type = data.types[t.value.slice(0, head)] || data.types["#"] || "op";
        seq.push({ kind: "name", says: type, t: type, from: a, to: b, a: a + head, b, key: `name:${t.value.slice(0, head)}` });
      } else if (t.type === "CONNECTOR" || t.type === "COMMA") seq.push({ kind: "join", value: t.value, says: JOIN_SAYS[t.value] || "join", from: a, to: b });
      else if (t.type === "IDENTIFIER" || t.type === "NUMBER") seq.push({ kind: "word", says: "word", t: "", from: a, to: b, a, b, key: "word" });
      else if (t.type === "STRING" || t.type === "PHRASE") {
        const quote = /^["'`]/.test(t.value) && t.value.length > 1 ? 1 : 0;
        seq.push({ kind: "phrase", says: "phrase", t: "s", from: a, to: b, a: a + quote, b: b - quote, key: "phrase" });
      } else if (t.type === "TEXT") seq.push({ kind: "phrase", says: "entry", t: "", from: a, to: b, a, b, key: "entry" });
      else if (t.type === "STREAM_CLOSE" || t.type === "STREAM_OPEN") seq.push({ kind: "mark", says: "stream", t: "stream", from: a, to: b, a, b, key: "stream" });
    }
    if (!inside) {
      if (seq[0] && seq[0].kind === "mark" && seq[0].key === "mark") seq[0].key = "mark:front";
      return seq;
    }
    if (!seq.some((p) => p.kind === "join")) return seq;
    const out = [];
    let run = [];
    const flush = () => {
      if (run.length === 1) out.push(run[0]);
      else if (run.length) out.push({ kind: "item", says: "part", t: "", from: run[0].from, to: run[run.length - 1].to, a: run[0].from, b: run[run.length - 1].to, key: "item" });
      run = [];
    };
    for (const p of seq) {
      if (p.kind === "join") { flush(); out.push(p); } else run.push(p);
    }
    flush();
    return out;
  }

  /** Whether a part holds parts of its own: joined ones, or a mark or a brace. Plain words inside a brace are typed over, not opened. */
  function opens(reading, n, part) {
    if (part.kind !== "brace" && part.kind !== "item") return false;
    return partsIn(reading, n, part.a, part.b, true).some((p) => p.kind !== "word" && p.kind !== "phrase");
  }

  /** The line a name lands on: its #>frame, its ^"block", its @link, its field, or the first line that says it. -1 when none does. */
  function lineOf(text, name) {
    const want = String(name || "").trim();
    if (!want) return -1;
    const lines = String(text || "").split("\n");
    const tests = [
      (line) => line.trim().split(/\s/)[0] === `#>${want}`,
      (line) => line.includes(`^"${want}"`),
      (line) => line.trim().startsWith(`@${want}:`),
      (line) => line.trim().split(/\s*=/)[0] === want,
      (line) => line.includes(want),
    ];
    for (const test of tests) {
      const n = lines.findIndex(test);
      if (n >= 0) return n;
    }
    return -1;
  }

  /** Every value the file's lines hold in one kind of slot, in the order they come, with the lines that hold each. */
  function lent(reading, key) {
    const seen = [];
    rowsOf(reading).forEach((row, n) => {
      for (const p of partsIn(reading, n, row.from, row.to, false)) {
        if (p.key !== key) continue;
        const value = squash(reading.text.slice(p.a, p.b));
        if (!value) continue;
        const had = seen.find((item) => item.value === value);
        if (had) had.lines.push(n);
        else seen.push({ value, lines: [n] });
      }
    });
    return seen;
  }

  /** A line said briefly: its mark and first word, or its number. */
  function lineName(reading, n) {
    const row = rowsOf(reading)[n];
    const parts = partsIn(reading, n, row.from, row.to, false);
    const word = parts.find((p) => p.kind === "word" || p.kind === "name");
    if (!word) return `line ${n + 1}`;
    const lead = parts[0].kind === "mark" && parts[0].to === word.from ? parts[0].from : word.from;
    return reading.text.slice(lead, word.to);
  }

  /**
   * What a turn would change, as sentences: what a tool reads differently
   * (a check, a field, the theme, a marked word), then which lines the turned
   * slot now shares its value with and which it leaves.
   */
  function means(before, after, turn) {
    const out = [];
    if (before.ok && !before.prose && (!after.ok || after.prose)) out.push("Part of the file would no longer close.");
    if (before.theme !== after.theme) out.push(`The field's theme: ${before.theme || "none"} → ${after.theme || "none"}.`);
    const said = new Set(before.checks.map((check) => check.says));
    for (const check of after.checks) if (!said.has(check.says) && check.state !== "fail") out.push(check.says);
    for (const check of after.checks) if (!said.has(check.says) && check.state === "fail" && (after.ok && !after.prose)) out.push(check.says);
    if (before.fields.length === after.fields.length) {
      before.fields.forEach((field, i) => {
        const next = after.fields[i];
        const was = field.shape || field.value;
        const now = next.shape || next.value;
        if (next.key === field.key && was !== now) out.push(`${field.key}: ${was} → ${now}`);
      });
    }
    const marks = (reading) => new Set(reading.marked.map((m) => `${m.sigil}${m.word}`));
    const marked = marks(before);
    for (const m of after.marked) if (!marked.has(`${m.sigil}${m.word}`)) out.push(`${m.word} reads as ${NAMES.get(m.sigil) || m.sigil} now.`);
    const others = (reading, value) => ((lent(reading, turn.key).find((item) => item.value === value) || { lines: [] }).lines.filter((n) => n !== turn.n));
    const names = (reading, lines) => {
      const shown = lines.slice(0, 3).map((n) => lineName(reading, n));
      return `${shown.join(", ")}${lines.length > 3 ? ` and ${lines.length - 3} more` : ""}`;
    };
    const joins = others(after, turn.now);
    const leaves = others(before, turn.was);
    out.push(joins.length ? `Joins ${names(after, joins)} at ${walled(turn.key, turn.now)}.` : `No other line holds ${walled(turn.key, turn.now)}.`);
    if (leaves.length) out.push(`Leaves ${names(before, leaves)} at ${walled(turn.key, turn.was)}.`);
    return out.slice(0, 6);
  }

  /**
   * The hand as the page draws it. `state` is { line, path, held, primed,
   * receipt }: the line in hand (-1 for the first with anything on it), the
   * parts opened on the way in, the part held, the value primed for it, and the
   * last turn written. Nothing here changes the file: a primed value is read
   * from a copy, shown as the line it would make and what that would change.
   * `opts.anchors` draws the parts as links to the rows under the editor (the
   * scripts-off form on /build); `opts.ways` names the rooms a line can go to.
   */
  function hand(parseFile, reading, state, opts) {
    const o = opts || {};
    const text = reading.text;
    const rows = rowsOf(reading);
    const blank = (i) => !text.slice(rows[i].from, rows[i].to).trim();
    let n = Math.min(Math.max(state.line, 0), rows.length - 1);
    if (state.line < 0) n = Math.max(0, rows.findIndex((_, i) => !blank(i)));
    let up = -1;
    for (let i = n - 1; i >= 0 && up < 0; i -= 1) if (!blank(i)) up = i;
    let down = -1;
    for (let i = n + 1; i < rows.length && down < 0; i += 1) if (!blank(i)) down = i;
    let parts = partsIn(reading, n, rows[n].from, rows[n].to, false);
    const trail = [];
    for (const index of state.path || []) {
      const part = parts[index];
      if (!part || !opens(reading, n, part)) break;
      trail.push(part);
      parts = partsIn(reading, n, part.a, part.b, true);
    }
    const held = state.held >= 0 && parts[state.held] && parts[state.held].kind !== "join" ? state.held : -1;
    const heldPart = held >= 0 ? parts[held] : null;
    const current = heldPart ? squash(text.slice(heldPart.a, heldPart.b)) : "";
    // A slot at the line's own level borrows from the same slot on the file's other lines.
    const lends = heldPart && !trail.length && (heldPart.kind === "brace" || heldPart.key === "mark:front");
    // Only values short enough to read on a handle: a whole body from another line is typed, not borrowed.
    const choices = lends ? lent(reading, heldPart.key).filter((item) => item.value !== current && item.value.length <= 32).slice(0, 6) : [];
    let primed = null;
    if (heldPart && state.primed != null && choices.some((item) => item.value === state.primed)) {
      const nextText = text.slice(0, heldPart.a) + state.primed + text.slice(heldPart.b);
      const after = read(parseFile, nextText);
      const row = rowsOf(after)[n];
      const line = nextText.slice(row.from, row.to);
      primed = { paint: paint(line, read(parseFile, line).tokens), means: means(reading, after, { key: heldPart.key, was: current, now: state.primed, n }) };
    }
    const short = (value) => { const flat = squash(value); return flat.length > 28 ? `${flat.slice(0, 27)}…` : flat; };
    const face = (p) => `<code${p.t ? ` data-t="${esc(p.t)}"` : ""}>${esc(short(text.slice(p.from, p.to)))}</code><span class="says">${esc(p.says)}</span>`;
    const anchor = (p, i) => (p.kind === "brace" && PAIRS[p.key.slice(6)] ? `#pivot-${p.says}` : p.key === "mark:front" ? "#pivot-mark" : p.kind === "word" && parts.findIndex((q) => q.kind === "word") === i ? "#pivot-word" : "");
    const chips = parts.map((p, i) => {
      if (p.kind === "join") return `<li class="sep" aria-hidden="true"><code>${esc(p.value)}</code></li>`;
      if (o.anchors) return anchor(p, i) ? `<li><a href="${anchor(p, i)}">${face(p)}</a></li>` : `<li><span class="chip">${face(p)}</span></li>`;
      return `<li><button type="button" data-k="part:${i}" data-hand-part="${i}" aria-pressed="${i === held}">${face(p)}</button></li>`;
    });
    const out = trail.length && !o.anchors ? `<li><button type="button" data-k="out" data-hand-out><code aria-hidden="true">←</code><span class="says">out</span><span class="sr-only"> of ${esc(trail[trail.length - 1].says)}</span></button></li>` : "";
    const step = (by, at, label) => `<button type="button" data-k="go:${by}" data-hand-go="${by}" aria-label="${label}"${at < 0 ? " disabled" : ""}>${by < 0 ? "↑" : "↓"}</button>`;
    const html = [`<p class="hand-where"><span class="label">In hand</span> <span class="n">line ${n + 1} of ${rows.length}</span>${trail.map((p) => `<span class="n"> › ${esc(p.says)}</span>`).join("")}${o.anchors ? "" : `<span class="hand-step">${step(-1, up, "The line above")}${step(1, down, "The line below")}</span>`}</p>`];
    html.push(parts.length ? `<ul class="hand-parts" aria-label="Its parts">${out}${chips.join("")}</ul>` : `<p class="hand-parts says">${out ? `<button type="button" data-k="out" data-hand-out>← out</button> ` : ""}Nothing on this line yet.</p>`);
    if (heldPart) {
      const receipt = state.receipt ? `<span class="hand-receipt">${esc(walled(heldPart.key, state.receipt.was))} → ${esc(walled(heldPart.key, state.receipt.now))}. <button type="button" class="quiet-button" data-k="undo" data-hand-undo>Put it back</button></span>` : "";
      html.push(`<p class="hand-held"><span class="says">${esc(heldPart.says)} in hand. Tap it again to type over it.</span>${opens(reading, n, heldPart) ? ` <button type="button" class="quiet-button" data-k="open" data-hand-open>Open it</button>` : ""}${receipt}</p>`);
      if (choices.length) {
        html.push(`<p class="hand-turns"><span class="says">${heldPart.kind === "brace" ? "Other lines hold" : "Other lines lead with"}</span> ${choices.map((item, i) => `<button type="button" data-k="turn:${i}" data-hand-turn="${i}" aria-pressed="${item.value === state.primed}"><code${heldPart.t ? ` data-t="${esc(heldPart.t)}"` : ""}>${esc(short(walled(heldPart.key, item.value)))}</code></button>`).join(" ")}</p>`);
      }
      if (primed) {
        html.push(`<div class="hand-primed"><p class="says">It would read</p><p class="primed-line"><code>${primed.paint}</code></p><ul class="hand-means">${primed.means.map((says) => `<li>${esc(says)}</li>`).join("")}</ul><p class="hand-acts"><button type="button" data-k="write" data-hand-write>Write it</button> <button type="button" class="quiet-button" data-k="drop" data-hand-drop>Let it go</button></p></div>`);
      }
    } else {
      const line = text.slice(rows[n].from, rows[n].to).trim();
      const ways = [];
      // The rooms a line can go to are the host page's to name ([address, label] pairs): the guide names none.
      if (line && line.length <= 200) for (const [base, label] of o.ways || []) ways.push(`<a href="${esc(`${base}${encodeURIComponent(line)}`)}">${esc(label)}</a>`);
      if (line && line.length <= 400) ways.push(`<a href="https://factshift.center/#spw64=${spw64(line)}" target="_blank" rel="noopener">Open it on the canvas ↗</a>`);
      if (ways.length) html.push(`<p class="hand-ways">${ways.join('<span aria-hidden="true"> · </span>')}</p>`);
    }
    return { html: html.join("\n          "), n, from: rows[n].from, to: rows[n].to, up, down, parts, held, heldPart, choices, depth: trail.length, primed: Boolean(primed) };
  }

  return { read, paint, outline, hand, lineOf, fileOf };
}

const kit = fileKit(FILE_DATA);

/** A file's reading, by the worker. */
export const readFile = (source) => kit.read(parse, String(source ?? "").slice(0, FILE_LIMIT));
export const paintFile = (reading) => kit.paint(reading.text, reading.tokens);
export const outlineFile = (reading, shelf) => kit.outline(reading, shelf);

const SHELVES = new WeakMap();
/** The files open together, each with the files its links name: what lets a reading's paths be ways between them. */
export function docShelf(examples) {
  if (!SHELVES.has(examples)) {
    SHELVES.set(examples, examples.map(({ id, file, script }) => ({ id, file, links: readFile(script).links.map((link) => ({ name: link.name, ...kit.fileOf(link.path) })) })));
  }
  return SHELVES.get(examples);
}

/** The line a ?at= name lands on in a file, or -1. */
export const landingLine = (source, name) => kit.lineOf(String(source ?? ""), name);

/**
 * The hand under the editor: the line in hand, its parts as handles, and the
 * field that tells Read which line that is. On /build the worker draws the
 * parts as links to the rows below, so the bar works with scripts off; on the
 * guide it is the script's alone and stays hidden without one.
 */
export function handBar(source, { line = -1, anchors = false, ways = [] } = {}) {
  const view = kit.hand(parse, readFile(source), { line, path: [], held: -1, primed: null, receipt: null }, { anchors, ways });
  return `<div class="hand" data-hand role="group" aria-label="The line in hand"${anchors ? " data-anchors" : ""}${ways.length ? ` data-ways="${escapeHtml(JSON.stringify(ways))}"` : ""}>
        <input type="hidden" name="at" value="${view.n + 1}">
        <div data-hand-body>
          ${view.html}
        </div>
        <p class="sr-only" role="status" data-hand-said></p>
      </div>`;
}

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
  // The files open together (the guide's shelf): a reading's paths to them become ways between them.
  const shelfNow = () => (examples.length ? { self: nameInput ? nameInput.value : "", docs: examples } : null);

  // The hand: the line in hand, its parts as handles, one part held at a time.
  // Stepping and holding never focus the field, so a phone's keyboard stays down
  // until a held part is tapped again to type over it.
  const bar = form.querySelector("[data-hand]");
  const handBody = bar ? bar.querySelector("[data-hand-body]") : null;
  const atField = bar ? bar.querySelector('input[name="at"]') : null;
  const handOpts = { ways: JSON.parse((bar && bar.dataset.ways) || "[]") };
  const hand = { line: atField ? Number(atField.value) - 1 : -1, path: [], held: -1, primed: null, receipt: null };
  let reading = null;
  let view = null;
  let touched = false;
  const rangeIn = (a, b) => {
    const range = document.createRange();
    const walker = document.createTreeWalker(paintCode, NodeFilter.SHOW_TEXT);
    let seen = 0;
    let started = false;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const length = node.data.length;
      if (!started && a <= seen + length) { range.setStart(node, a - seen); started = true; }
      if (started && b <= seen + length) { range.setEnd(node, b - seen); break; }
      seen += length;
    }
    return range;
  };
  const light = () => {
    if (!view || !window.CSS || !CSS.highlights || typeof Highlight !== "function") return;
    if (touched && view.to > view.from) CSS.highlights.set("spw-hand-line", new Highlight(rangeIn(view.from, view.to)));
    else CSS.highlights.delete("spw-hand-line");
    if (view.heldPart) CSS.highlights.set("spw-hand", new Highlight(rangeIn(view.heldPart.from, view.heldPart.to)));
    else CSS.highlights.delete("spw-hand");
  };
  const drawHand = () => {
    if (!bar || !reading) return;
    const key = handBody.contains(document.activeElement) ? document.activeElement.dataset.k : "";
    view = kit.hand(parseFile, reading, hand, handOpts);
    hand.line = view.n;
    hand.held = view.held;
    hand.path.length = view.depth;
    if (!view.primed) hand.primed = null;
    handBody.innerHTML = view.html;
    if (key) (handBody.querySelector(`[data-k="${key}"]`) || handBody.querySelector('[aria-pressed="true"]') || handBody.querySelector("button"))?.focus();
    atField.value = String(view.n + 1);
    light();
  };
  /** The line in hand, kept in this browser so /learn can thread its word through the panels. Never sent. */
  const remember = () => {
    if (!view) return;
    const line = field.value.slice(view.from, view.to).trim();
    const word = (line.match(/[A-Za-z][A-Za-z0-9_]*/) || [""])[0].toLowerCase();
    if (!word || line.length > 200) return;
    try {
      localStorage.setItem("spw.quest.hand/1", JSON.stringify({ word: word.slice(0, 24), line, file: nameInput ? nameInput.value : "", day: new Date().toISOString().slice(0, 10) }));
    } catch {
      // Storage refused: the hand is simply not remembered.
    }
  };
  const reveal = () => {
    if (!view) return;
    const box = rangeIn(view.from, Math.max(view.to, view.from)).getBoundingClientRect();
    if (!box.height || (box.top >= 8 && box.bottom <= innerHeight - 8)) return;
    scrollBy({ top: box.top - innerHeight / 3, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  /** Take a line in hand; with `key`, keep hold of the same kind of part on it (down a column of modes). */
  const take = (line, key = "") => {
    Object.assign(hand, { line, path: [], held: -1, primed: null, receipt: null });
    touched = true;
    drawHand();
    if (key) {
      hand.held = view.parts.findIndex((part) => part.key === key);
      drawHand();
    }
    if (document.activeElement !== field) field.setSelectionRange(view.from, view.from);
    remember();
    reveal();
  };
  const land = (name) => {
    const line = kit.lineOf(field.value, name);
    if (bar && line >= 0) take(line);
  };
  /** Write a value over the held part. The file changes here and nowhere else in the hand. */
  const write = (value, receipt) => {
    const part = view && view.heldPart;
    if (!part || value == null) return;
    const was = field.value.slice(part.a, part.b);
    if (field.value.length - was.length + value.length > limit) return;
    field.setRangeText(value, part.a, part.b, "preserve");
    hand.primed = null;
    hand.receipt = receipt ? { was, now: value } : null;
    bar.querySelector("[data-hand-said]").textContent = `${part.says}: ${was} → ${value}.`;
    field.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const run = () => {
    queued = false;
    reading = kit.read(parseFile, field.value);
    paintCode.innerHTML = `${kit.paint(field.value, reading.tokens)}\n`;
    if (out) out.innerHTML = kit.outline(reading, shelfNow());
    if (reading.theme) form.dataset.theme = reading.theme;
    else delete form.dataset.theme;
    // The guide's cards for the marks say which of them the open file uses.
    for (const node of document.querySelectorAll("[data-in-file]")) {
      const mark = reading.marks.find((item) => item.name === node.dataset.inFile);
      node.hidden = !mark;
      if (!mark) continue;
      node.querySelector("[data-in-file-count]").textContent = String(mark.count);
      node.querySelector("[data-in-file-name]").textContent = nameInput ? nameInput.value : "";
    }
    drawHand();
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
  // Typing an opening brace over a selection wraps it in the pair, and keeps it selected.
  field.addEventListener("beforeinput", (event) => {
    const close = { "[": "]", "{": "}", "(": ")", "<": ">" }[event.data];
    const a = field.selectionStart;
    const b = field.selectionEnd;
    if (event.inputType !== "insertText" || !close || a === b || field.value.length + 2 > limit) return;
    event.preventDefault();
    field.setRangeText(`${event.data}${field.value.slice(a, b)}${close}`, a, b, "preserve");
    field.setSelectionRange(a + 1, b + 1);
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });
  if (bar) {
    // The caret's line is the line in hand; a caret inside the held part leaves it held.
    document.addEventListener("selectionchange", () => {
      if (document.activeElement !== field || !view) return;
      const line = field.value.slice(0, field.selectionStart).split("\n").length - 1;
      const part = view.heldPart;
      if (part && field.selectionStart >= part.a && field.selectionEnd <= part.b) return;
      if (line === hand.line && hand.held < 0 && !hand.path.length) return;
      Object.assign(hand, { line, path: [], held: -1, primed: null, receipt: null });
      touched = true;
      drawHand();
      remember();
    });
    bar.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button || !view) return;
      const data = button.dataset;
      touched = true;
      if (data.handGo) {
        const next = Number(data.handGo) < 0 ? view.up : view.down;
        if (next >= 0) take(next, view.heldPart && !view.depth ? view.heldPart.key : "");
      } else if (data.handPart) {
        const index = Number(data.handPart);
        if (hand.held === index) {
          // The second tap: the field takes the part as its selection, so typing replaces it.
          field.focus({ preventScroll: true });
          field.setSelectionRange(view.heldPart.a, view.heldPart.b);
        } else {
          Object.assign(hand, { held: index, primed: null, receipt: null });
          drawHand();
          remember();
        }
      } else if (data.handTurn) {
        // A tap primes a value: the line it would make and what that changes. A second tap writes it.
        const choice = view.choices[Number(data.handTurn)];
        if (!choice) return;
        if (hand.primed === choice.value) write(choice.value, true);
        else { hand.primed = choice.value; hand.receipt = null; drawHand(); }
      } else if ("handWrite" in data) write(hand.primed, true);
      else if ("handDrop" in data) { hand.primed = null; drawHand(); }
      else if ("handUndo" in data) { if (hand.receipt) write(hand.receipt.was, false); }
      else if ("handOpen" in data) { hand.path.push(hand.held); Object.assign(hand, { held: -1, primed: null, receipt: null }); drawHand(); }
      else if ("handOut" in data) { Object.assign(hand, { held: hand.path.pop(), primed: null, receipt: null }); drawHand(); }
    });
    // Arrow keys on the parts: sideways to a sibling, up and down a line.
    bar.addEventListener("keydown", (event) => {
      const chip = event.target.closest("[data-hand-part]");
      if (!chip || !view) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        const chips = [...handBody.querySelectorAll("[data-hand-part]")];
        const next = chips[chips.indexOf(chip) + (event.key === "ArrowRight" ? 1 : -1)];
        if (!next) return;
        event.preventDefault();
        next.focus();
        next.click();
      } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        const next = event.key === "ArrowUp" ? view.up : view.down;
        if (next < 0) return;
        event.preventDefault();
        take(next, view.heldPart && !view.depth ? view.heldPart.key : "");
      }
    });
  }
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
    Object.assign(hand, { line: -1, path: [], held: -1, primed: null, receipt: null });
    touched = false;
    run();
  };
  /** Open a file in place, from its tab or from a reading's link to it; `at` names the line to land on. */
  const openExample = (id, event, at = "") => {
    const example = byId.get(id);
    if (!example || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    if (!note) {
      apply(example);
      history.replaceState(null, "", `?example=${example.id}#try`);
      land(at);
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
    land(at);
    remember();
  };
  for (const tab of tabs) tab.addEventListener("click", (event) => openExample(tab.dataset.example, event));
  // A reading is redrawn on every edit, so its links to other files are heard from the card that holds them.
  out?.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-example]");
    if (link) openExample(link.dataset.example, event, link.dataset.at || "");
  });
  // An address that names a line (?at=) lands on it.
  land(new URLSearchParams(location.search).get("at") || "");

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
export function liveFileScript(examples = [], loader, { note = false, modulePath = "/parser.js" } = {}) {
  const data = JSON.stringify(FILE_DATA).replace(/</g, "\\u003c");
  const docs = docShelf(examples);
  const shelf = JSON.stringify(examples.map(({ id, file, says, try: attempt, script }, index) => ({ id, file, says, try: attempt, script, links: docs[index].links }))).replace(/</g, "\\u003c");
  const noteApi = note ? `(${noteKit.toString()})()` : "null";
  const start = `(${liveFile.toString()})((${fileKit.toString()})(${data}), parse, ${shelf}, ${noteApi});`;
  if (!loader) return `<script type="module">
import { parse } from ${JSON.stringify(modulePath)};
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
    .examples { display: grid; gap: .5rem; margin: 0 0 .8rem; }
    .examples-lede { margin: 0 0 .6rem; color: var(--muted); }
    .examples-row { display: grid; grid-template-columns: 4.5rem minmax(0, 1fr); align-items: start; gap: .35rem; }
    .examples-group { padding-top: .75rem; color: var(--muted); font: .74rem/1.2 var(--mono); text-transform: lowercase; }
    .examples-files { display: flex; flex-wrap: wrap; gap: .35rem; }
    @media (max-width: 22rem) { .examples-row { grid-template-columns: minmax(0, 1fr); } .examples-group { padding-top: 0; } }
    .examples a { display: grid; gap: .05rem; min-height: 44px; padding: .4rem .8rem .45rem; border: 1px solid var(--line); border-radius: var(--radius); background: color-mix(in srgb, var(--surface) 55%, transparent); color: var(--fg); text-decoration: none; transition: transform .16s ease, border-color .16s ease, background-color .16s ease, box-shadow .16s ease; }
    .examples .tab { font-weight: 600; font-size: .95rem; line-height: 1.2; }
    .examples .file { color: var(--muted); font: .74rem/1.2 var(--mono); }
    .examples a:hover, .examples a:focus-visible { border-color: var(--accent); background: color-mix(in srgb, var(--surface) 90%, transparent); transform: translateY(-1px); box-shadow: 0 4px 12px -2px rgba(0, 0, 0, .05); }
    .examples a:active { transform: translateY(1px) scale(.995); box-shadow: none; }
    .examples a[aria-current] { border-color: var(--accent); background: var(--field); box-shadow: inset 0 -2px 0 var(--accent); }
    .examples a[aria-current] .file { color: var(--accent); }
    .workspace { display: grid; gap: 1rem; align-items: start; }
    @media (min-width: 60rem) { .workspace { grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 1.25rem; } .reading-card { position: sticky; top: 1rem; } }
    form.file, .build form.script { margin: 0; border: 1px solid var(--edge); border-radius: var(--radius); background: var(--field); box-shadow: var(--shadow); overflow: hidden; }
    form.file[data-theme="glass"], .build form.script[data-theme="glass"] { background: color-mix(in srgb, var(--field) 78%, transparent); border-color: color-mix(in srgb, var(--accent) 50%, var(--edge)); box-shadow: var(--shadow), inset 0 0 0 1px color-mix(in srgb, var(--accent) 18%, transparent); }
    form.file[data-theme="matte"], .build form.script[data-theme="matte"] { background: var(--bg); box-shadow: none; }
    form.file[data-theme="paper"], .build form.script[data-theme="paper"] { background: var(--surface); }
    form.file[data-theme="vellum"], .build form.script[data-theme="vellum"] { background: color-mix(in srgb, #fdfbf7 94%, var(--surface)); border-color: color-mix(in srgb, #c4a468 45%, var(--line)); box-shadow: 0 1px 4px rgba(45, 30, 10, .08), inset 0 0 0 1px rgba(196, 164, 104, .18); }
    form.file[data-theme="humus"], .build form.script[data-theme="humus"] { background: color-mix(in srgb, #1a1714 94%, var(--field)); border-color: color-mix(in srgb, #5c4733 65%, var(--edge)); box-shadow: 0 4px 16px rgba(18, 14, 10, .35); color: #ede4d8; }
    form.file[data-theme="ink"], .build form.script[data-theme="ink"] { background: color-mix(in srgb, #0a111c 95%, var(--field)); border-color: color-mix(in srgb, #2d4566 70%, var(--edge)); box-shadow: 0 6px 20px rgba(5, 10, 20, .45); color: #e2ecf8; }
    form.file[data-theme="wort"], .build form.script[data-theme="wort"] { background: color-mix(in srgb, #241407 92%, var(--field)); border-color: color-mix(in srgb, #b86e28 60%, var(--edge)); box-shadow: 0 4px 16px rgba(36, 20, 7, .35); color: #faebd7; }
    .file-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .3rem .8rem; padding: .35rem .5rem .35rem .95rem; border-bottom: 1px solid var(--line); background: var(--surface); }
    .file-name { margin: 0; }
    .file-name code { font-size: .86rem; font-weight: 600; padding: .15rem .45rem; border-radius: 4px; background: color-mix(in srgb, var(--line) 35%, transparent); border: 1px solid color-mix(in srgb, var(--line) 70%, transparent); font-variant-ligatures: none; }
    .file-actions { display: flex; flex-wrap: wrap; gap: .15rem; }
    .file-actions a.file-canvas { border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--line)); background: color-mix(in srgb, var(--accent) 10%, var(--surface)); color: var(--accent); font-weight: 600; box-shadow: 0 1px 2px rgba(0, 0, 0, .04); transition: transform .14s ease, background-color .14s ease, border-color .14s ease, box-shadow .14s ease; }
    .file-actions a.file-canvas:hover, .file-actions a.file-canvas:focus-visible { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 18%, var(--surface)); box-shadow: 0 2px 8px -2px color-mix(in srgb, var(--accent) 25%, transparent); transform: translateY(-1px); }
    .file-actions a.file-canvas:active { transform: translateY(1px); box-shadow: none; }
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
    .hand { display: grid; gap: .35rem; padding: .45rem .5rem .55rem 1rem; border-top: 1px dashed var(--line); background: var(--surface); color: var(--fg); }
    html:not(.js) .hand:not([data-anchors]) { display: none; }
    .hand p { margin: 0; }
    .hand .says, .hand .n { color: var(--muted); font: .74rem/1.3 var(--mono); }
    .hand .label { color: var(--accent); font: 650 .88rem/1.3 var(--font); }
    .hand-where { display: flex; flex-wrap: wrap; align-items: center; gap: .1rem .5rem; min-height: 36px; }
    .hand-step { display: inline-flex; gap: .2rem; margin-left: auto; }
    .hand button { margin: 0; font: inherit; cursor: pointer; }
    .hand-step button { min-width: 36px; min-height: 36px; padding: 0; border: 1px solid var(--line); border-radius: var(--pill); background: transparent; color: var(--accent); font: 600 1rem/1 var(--mono); }
    .hand-step button:disabled { opacity: .35; cursor: default; }
    /* One row, scrolled sideways: a longer line never changes the bar's height. */
    .hand-parts { display: flex; align-items: stretch; gap: .3rem; min-height: 46px; margin: 0; padding: 0 0 .15rem; list-style: none; overflow-x: auto; scrollbar-width: thin; }
    p.hand-parts { align-items: center; }
    .hand-parts li { flex: none; margin: 0; }
    .hand-parts .sep { align-self: center; color: var(--muted); }
    .hand-parts :is(button, a, .chip), .hand-turns button { display: inline-grid; gap: .1rem; justify-items: start; min-height: 44px; box-sizing: border-box; padding: .3rem .6rem; border: 1px solid var(--line); border-radius: var(--radius); background: transparent; color: inherit; text-align: left; text-decoration: none; white-space: nowrap; }
    .hand-parts code, .hand-turns code, .hand .primed-line code { font: 600 .9rem/1.3 var(--mono); font-variant-ligatures: none; }
    .hand-parts :is(button, a):is(:hover, :focus-visible), .hand-turns button:is(:hover, :focus-visible), .hand-step button:not(:disabled):is(:hover, :focus-visible) { border-color: var(--accent); }
    .hand [aria-pressed="true"] { border-color: var(--accent); background: var(--accent-soft); box-shadow: inset 0 -2px 0 var(--accent); }
    .hand-held { display: flex; flex-wrap: wrap; align-items: center; gap: .1rem .6rem; }
    .hand-receipt { font: .82rem/1.3 var(--mono); font-variant-ligatures: none; }
    .hand-turns { display: flex; flex-wrap: wrap; align-items: center; gap: .3rem; }
    .hand-primed { display: grid; gap: .3rem; padding: .55rem .75rem; border: 1px dashed var(--accent); border-radius: var(--radius); }
    .hand .primed-line code { font-size: 1rem; overflow-wrap: anywhere; }
    .hand-means { margin: 0; padding-left: 1.1rem; font-size: .9rem; line-height: 1.45; }
    .hand-means li { margin: 0; }
    .hand-acts { display: flex; flex-wrap: wrap; align-items: center; gap: .3rem; }
    .hand-acts button { min-height: 44px; }
    .hand-ways { color: var(--muted); font-size: .88rem; }
    .hand-ways a { display: inline-flex; align-items: center; min-height: 36px; }
    @media (pointer: coarse) { .hand-where { min-height: 44px; } .hand-ways a { min-height: 44px; } .hand-step button { min-width: 44px; min-height: 44px; } }
    ::highlight(spw-hand-line) { background-color: color-mix(in srgb, var(--accent) 9%, transparent); }
    ::highlight(spw-hand) { background-color: color-mix(in srgb, var(--accent) 26%, transparent); }
    .links a { display: inline-flex; align-items: center; min-height: 32px; }
    @media (pointer: coarse) { .links a { min-height: 44px; } }
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
