/**
 * Lightweight, real Spw parser, AST evaluator, and syntax highlighter for smut.today.
 * Runs identically in the Worker (SSR/tests) and inside /app.js in the browser.
 */

export const DEFAULT_SPW_PRESETS = Object.freeze({
  couple: `@mood{ warm }
~pause{ 2200ms }
!words{
  honorific: "sweetheart",
  touch: "mouth",
  temperature: "fever-warm",
  sound: "laugh"
}
>focus{ "full" }`,
  circle: `@mood{ slow }
~pause{ 2800ms }
!words{
  honorific: "please",
  touch: "knuckles",
  gesture: "pin",
  aftertaste: "chamomile"
}
>focus{ "voices" }`,
  urgent: `@mood{ dirty }
~pause{ 950ms }
!words{
  honorific: "baby",
  touch: "teeth",
  paceWord: "hard",
  sound: "curse"
}
>focus{ "breath" }`,
  protocol: `@mood{ sharp }
~pause{ 3400ms }
!words{
  honorific: "ma'am",
  touch: "thumb",
  stance: "still",
  checkWord: "green"
}
>focus{ "breath" }`,
});

export function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const OPS = new Set(["#", "?", "^", "~", "@", "!", ">", "<", "=", ":"]);
const OPEN_TO_CLOSE = Object.freeze({ "{": "}", "[": "]", "(": ")" });
const CLOSE_SET = new Set(["}", "]", ")"]);

export function tokenizeSpw(source = "") {
  const src = String(source);
  const tokens = [];
  let i = 0;

  while (i < src.length) {
    const ch = src[i];

    if (/\s/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /\s/.test(src[j])) j++;
      tokens.push({ type: "ws", value: src.slice(i, j), start: i, end: j });
      i = j;
      continue;
    }

    if (ch === ";" || (ch === "/" && src[i + 1] === "/")) {
      let j = i;
      while (j < src.length && src[j] !== "\n") j++;
      tokens.push({ type: "comment", value: src.slice(i, j), start: i, end: j });
      i = j;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const q = ch;
      let j = i + 1;
      let closed = false;
      while (j < src.length) {
        if (src[j] === "\\" && j + 1 < src.length) {
          j += 2;
          continue;
        }
        if (src[j] === q) {
          j++;
          closed = true;
          break;
        }
        j++;
      }
      tokens.push({ type: closed ? "string" : "error", value: src.slice(i, j), start: i, end: j, unclosed: !closed });
      i = j;
      continue;
    }

    if (OPS.has(ch)) {
      if (ch === "#" && src[i + 1] === ">") {
        tokens.push({ type: "op", value: "#>", start: i, end: i + 2 });
        i += 2;
        continue;
      }
      tokens.push({ type: "op", value: ch, start: i, end: i + 1 });
      i += 1;
      continue;
    }

    if (OPEN_TO_CLOSE[ch] || CLOSE_SET.has(ch)) {
      tokens.push({ type: "brace", value: ch, start: i, end: i + 1 });
      i += 1;
      continue;
    }

    if (ch === "," || ch === ".") {
      tokens.push({ type: "punct", value: ch, start: i, end: i + 1 });
      i += 1;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      while (j < src.length && /[a-zA-Z%]/.test(src[j])) j++;
      tokens.push({ type: "number", value: src.slice(i, j), start: i, end: j });
      i = j;
      continue;
    }

    if (/[a-zA-Z_$-]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[a-zA-Z0-9_.-]/.test(src[j])) j++;
      tokens.push({ type: "ident", value: src.slice(i, j), start: i, end: j });
      i = j;
      continue;
    }

    tokens.push({ type: "error", value: ch, start: i, end: i + 1 });
    i += 1;
  }

  return tokens;
}

function unquote(val) {
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1).replace(/\\(.)/g, "$1");
  }
  return val;
}

export function parseSpw(source = "") {
  const tokens = tokenizeSpw(source);
  const sig = tokens.filter((t) => t.type !== "ws" && t.type !== "comment");
  const frames = [];
  const errors = [];

  for (const t of tokens) {
    if (t.type === "error") {
      errors.push({ pos: t.start, message: t.unclosed ? "Unclosed string literal" : `Unexpected character "${t.value}"` });
    }
  }

  let idx = 0;

  function readBraceBlock() {
    const open = sig[idx];
    const expect = OPEN_TO_CLOSE[open.value];
    idx++;
    const inner = [];
    while (idx < sig.length) {
      const cur = sig[idx];
      if (cur.type === "brace" && cur.value === expect) {
        idx++;
        return { open: open.value, tokens: inner, closed: true };
      }
      if (cur.type === "brace" && CLOSE_SET.has(cur.value) && cur.value !== expect) {
        errors.push({ pos: cur.start, message: `Expected "${expect}" before "${cur.value}"` });
        idx++;
        return { open: open.value, tokens: inner, closed: false };
      }
      if (cur.type === "brace" && OPEN_TO_CLOSE[cur.value]) {
        inner.push({ nested: readBraceBlock() });
        continue;
      }
      inner.push(cur);
      idx++;
    }
    errors.push({ pos: open.start, message: `Unclosed "${open.value}"` });
    return { open: open.value, tokens: inner, closed: false };
  }

  function extractPropsAndItems(flatTokens) {
    const props = {};
    const items = [];
    for (let k = 0; k < flatTokens.length; k++) {
      const cur = flatTokens[k];
      if (cur.nested) continue;
      if (cur.type === "punct") continue;
      const next = flatTokens[k + 1];
      const val = flatTokens[k + 2];
      if (
        (cur.type === "ident" || cur.type === "string") &&
        next &&
        next.type === "op" &&
        (next.value === ":" || next.value === "=") &&
        val &&
        !val.nested
      ) {
        props[unquote(cur.value)] = val.type === "string" ? unquote(val.value) : val.value;
        k += 2;
        continue;
      }
      items.push(cur.type === "string" ? unquote(cur.value) : cur.value);
    }
    return { props, items };
  }

  while (idx < sig.length) {
    const cur = sig[idx];
    let op = "";
    let head = "";
    let qualifier = null;

    if (cur.type === "op") {
      op = cur.value;
      idx++;
    }

    if (idx < sig.length && (sig[idx].type === "ident" || sig[idx].type === "string")) {
      head = unquote(sig[idx].value);
      idx++;
    }

    if (idx < sig.length && sig[idx].type === "brace" && sig[idx].value === "[") {
      const q = readBraceBlock();
      qualifier = q.tokens.filter((t) => !t.nested && t.type !== "punct").map((t) => unquote(t.value)).join(" ");
    }

    if (idx < sig.length && sig[idx].type === "op" && (sig[idx].value === ":" || sig[idx].value === "=")) {
      idx++;
      const rhs = sig[idx];
      if (rhs && (rhs.type === "ident" || rhs.type === "string" || rhs.type === "number")) {
        idx++;
        const value = rhs.type === "string" ? unquote(rhs.value) : rhs.value;
        frames.push({ kind: "assign", op: op || "=", head, qualifier, props: {}, items: [value] });
        continue;
      }
    }

    if (idx < sig.length && sig[idx].type === "brace" && OPEN_TO_CLOSE[sig[idx].value]) {
      const block = readBraceBlock();
      const { props, items } = extractPropsAndItems(block.tokens);
      frames.push({ kind: "frame", op, head, qualifier, props, items });
      continue;
    }

    if (op || head) {
      frames.push({ kind: "atom", op, head, qualifier, props: {}, items: [] });
    } else {
      idx++;
    }
  }

  return { tokens, frames, errors };
}

function parseDurationMs(raw) {
  const m = String(raw || "").trim().match(/^(\d+(?:\.\d+)?)\s*(ms|s)?$/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  const ms = (m[2] || "").toLowerCase() === "s" ? n * 1000 : n;
  return Math.max(300, Math.min(12000, Math.round(ms)));
}

export function evalSpwDynamics(source = "") {
  const ast = parseSpw(source);
  const config = {
    mood: null,
    pauseMs: null,
    focus: null,
    scale: null,
    words: {},
    notes: [],
  };

  const VALID_MOODS = new Set(["slow", "dirty", "warm", "sharp", "all"]);
  const VALID_FOCUS = new Set(["breath", "voices", "full"]);

  for (const frame of ast.frames) {
    const key = String(frame.head || "").toLowerCase();
    const qual = String(frame.qualifier || "").toLowerCase();

    if (key === "mood" || key === "room" || frame.op === "@") {
      const candidate = String(frame.items[0] || frame.props.mood || qual || (key !== "mood" && key !== "room" ? key : "")).toLowerCase();
      if (VALID_MOODS.has(candidate)) config.mood = candidate;
      for (const [k, v] of Object.entries(frame.props)) {
        if (k === "pause" || k === "delay") {
          const ms = parseDurationMs(v);
          if (ms !== null) config.pauseMs = ms;
        }
      }
      continue;
    }

    if (key === "pause" || key === "delay" || key === "hold" || frame.op === "~") {
      const raw = frame.props.delay || frame.props.ms || frame.items[0] || frame.qualifier;
      const ms = parseDurationMs(raw);
      if (ms !== null) config.pauseMs = ms;
      continue;
    }

    if (key === "words" || key === "slots" || key === "slot" || frame.op === "!") {
      if (qual && frame.items.length) {
        config.words[qual] = frame.items[0];
      }
      for (const [k, v] of Object.entries(frame.props)) {
        config.words[k.toLowerCase()] = String(v);
      }
      continue;
    }

    if (key === "focus" || key === "mode" || frame.op === ">") {
      const candidate = String(frame.items[0] || qual || "").toLowerCase();
      if (VALID_FOCUS.has(candidate)) config.focus = candidate;
      continue;
    }

    if (key === "scale") {
      const num = String(frame.items[0] || "").replace(/%$/, "");
      if (["70", "80", "90", "100", "110", "120"].includes(num)) config.scale = num;
      continue;
    }

    if ((frame.op === "?" || frame.op === "^") && frame.items.length) {
      config.notes.push(frame.items.join(" "));
    }
  }

  return { config, ast };
}

export function highlightSpw(source = "") {
  const tokens = tokenizeSpw(source);
  return tokens
    .map((tok, i) => {
      const esc = escHtml(tok.value);
      if (tok.type === "ws") return esc;
      if (tok.type === "ident") {
        const nextSig = tokens.slice(i + 1).find((t) => t.type !== "ws");
        const isPropKey = nextSig && nextSig.type === "op" && (nextSig.value === ":" || nextSig.value === "=");
        return `<span class="spw-tok ${isPropKey ? "spw-key" : "spw-head"}">${esc}</span>`;
      }
      return `<span class="spw-tok spw-${tok.type}">${esc}</span>`;
    })
    .join("");
}

export function serializeSpwClient() {
  const fn = (f) => f.toString().replace(/^export\s+/, "");
  return [
    `const DEFAULT_SPW_PRESETS = ${JSON.stringify(DEFAULT_SPW_PRESETS)};`,
    fn(escHtml),
    `const OPS = new Set(["#", "?", "^", "~", "@", "!", ">", "<", "=", ":"]);`,
    `const OPEN_TO_CLOSE = Object.freeze({ "{": "}", "[": "]", "(": ")" });`,
    `const CLOSE_SET = new Set(["}", "]", ")"]);`,
    fn(tokenizeSpw),
    fn(unquote),
    fn(parseSpw),
    fn(parseDurationMs),
    fn(evalSpwDynamics),
    fn(highlightSpw),
  ].join("\n  ");
}
