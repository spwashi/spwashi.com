// /physics: a line at rest. One line of Spw drawn as bodies inside bodies, with
// three things a hand can do to it, each saying what it does to the line:
//   touch    push a part and let go; it comes home; the line is as written
//   visitor  let a word in that the line does not write; the line is as written
//   keep     write the visitor into the line; the bytes change; undo puts them back
//
// The rules are the proposals in the workbench's notebook on depiction
// (docs/theory/spw/depiction-frames.spw, frame_rules and random_nodes), tried
// small enough to check by hand:
//   - a body's leading mark is its law, felt by its own parts; a body inside
//     it feels a share of that law (alike, softer or faint)
//   - each body has its own clock: a touch warms the body it lands in and, by
//     the share, the bodies inside it; never the one beside it or around it
//   - key: value is a joint with a rest length: the value moves with its key
//   - @name is a sight line: it is drawn, and it moves nothing
//   - a closed pair of braces is neutral from outside: nothing beyond the
//     brace moves, and the page measures that
//   - a visitor joins the line only by an edit that writes it
// It is a design concept (.agents/plans/spw-quest/physics-floor.md): the
// numbers below are a first feel, and the feel is the creator's to set.
//
// The line is read by the site's reader (the same parse the guide uses), in
// the worker for the page at rest and in the page as the hand works. fieldKit
// travels to the page by toString(), so nothing inside it may reach outside it.
import { escapeHtml, layout } from "../../lib/shell.js";
import { parse } from "../../../public/js/semantic/spw-workbench-reader.js";
import { PEER_BRACES, PEER_SIGILS } from "../../lib/peer-kit.js";
import { scriptAddress } from "./build.js";
import { OPERATORS } from "./guide.js";
import { PAGE_CSS, QUEST_HEAD, masthead } from "./page.js";
import { PAPER_CSS } from "./paper.js";

/** The line the page opens with: a joint, a lifted body, a settled body, and a sight line across the two. */
export const PHYSICS_DEFAULT = "garden[care]{seed: water, ^sky{sun, rain}, .bed{soil, @rain}}";
/** The longest line the floor takes. */
export const PHYSICS_LIMIT = 200;
/** Other lines to stand on, each one edit or one idea away from the first. */
export const PHYSICS_LINES = Object.freeze([
  { line: PHYSICS_DEFAULT, says: "a joint, a lifted body, a settled body, a sight line" },
  { line: "^garden{seed: water, sky{sun, rain}, bed{soil}}", says: "a marked body around two plain ones: the share shows" },
  { line: "pantry{rice, oats, ~jar{salt, honey}, *tin{tea}}", says: "a body that drifts beside a body that holds" },
  { line: "trip{home; road; ?fork{left, right}}", says: "an order, with a question that opens" },
]);

/** What a body inside a marked body feels of that mark's law. The words are the canvas's (alike, softer, faint). */
export const SHARES = Object.freeze([["alike", 1], ["softer", 0.6], ["faint", 0.3]]);
const SHARE_DEFAULT = "softer";

export const PHYSICS_DATA = Object.freeze({
  // The numbers a first feel is made of. One place, so the page's table of laws is the simulation's own.
  stage: { width: 340, depth: 3, maxChars: 16, visitorChars: 8 },
  feel: { spring: 90, passes: 4, damping: 0.7, lean: 1.5, room: 10, reach: 70, shiver: 70, push: 24 },
  laws: [
    { sigil: ".", does: "settles", says: "its parts rest low", dy: 6, near: "rest lower" },
    { sigil: "^", does: "lifts", says: "its parts rest high", dy: -6, near: "rest higher" },
    { sigil: "*", does: "holds", says: "its parts give less to a push and come home fast", stiff: 2.6 },
    { sigil: "~", does: "drifts", says: "its parts give more to a push and come home slowly", stiff: 0.3 },
    { sigil: "@", does: "gathers", says: "its parts rest nearer the middle", gather: 0.25, near: "lean toward it" },
    { sigil: "?", does: "opens", says: "its parts rest further apart", gather: -0.25, near: "lean away from it" },
    { sigil: "!", does: "makes room", says: "its parts keep more room around them", room: 5 },
  ],
  operators: OPERATORS.map(({ sigil, name }) => ({ sigil, name })),
  types: Object.fromEntries(PEER_SIGILS.map(({ sigil, type }) => [sigil, type])),
  braces: Object.fromEntries(PEER_BRACES.map(({ open, type }) => [open, type])),
  shares: Object.fromEntries(SHARES),
});

/**
 * The floor's kit: read a line into bodies, lay them out at rest, run the small
 * physics, measure it, write a visitor into the line, and draw. Self-contained.
 */
export function fieldKit(data) {
  const W = data.stage.width;
  const CH = 7.25, PILL_H = 26, PILL_PAD = 9, GAP = 8, PAD = 10, TAB = 20, SLACK = 12, JOINT = 14, EDGE = 4, MARGIN = 2;
  const RESERVE = Math.round(data.stage.visitorChars * CH + PILL_PAD * 2) + GAP;
  const DT = 1 / 60;
  const LAWS = new Map(data.laws.map((law) => [law.sigil, law]));
  const NAMES = new Map(data.operators.map((op) => [op.sigil, op.name]));
  const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const bytes = (text) => new TextEncoder().encode(text).length;
  const shown = (text) => (text.length > data.stage.maxChars ? `${text.slice(0, data.stage.maxChars - 1)}…` : text);
  const textW = (text) => Math.round(Math.min(text.length, data.stage.maxChars) * CH + PILL_PAD * 2);
  const round = (n) => (Math.round(n * 10) / 10).toFixed(1);
  const bodyName = (frame) => `${frame.word}'s body`;

  /** The line as bodies: a frame is a word with a { } body; its parts are words, joints, sight lines, and frames. */
  function read(parseLine, line) {
    const text = String(line || "").trim();
    if (!text) return { ok: false, line: text, tokens: [], says: "No line yet." };
    let result;
    try { result = parseLine(text); } catch { return { ok: false, line: text, tokens: [], says: "The reader stopped on this line." }; }
    const tokens = result.tokens || [];
    const done = result.completeness || {};
    if (!result.success || !done.complete || done.proseFallback) {
      return { ok: false, line: text, tokens, says: "The reader did not read this line whole, so there is nothing to lay out. A brace may still be open." };
    }
    const top = (result.ast && result.ast.expression && result.ast.expression.expressions) || [];
    if (top.length !== 1) return { ok: false, line: text, tokens, says: `The reader found ${top.length} expressions here. This floor holds one.` };
    const cut = (span) => text.slice(span.start.offset, span.end.offset);
    const node = (expr, id, depth) => {
      const term = expr.terms && expr.terms.length === 1 && !(expr.connectors || []).length ? expr.terms[0] : null;
      if (!term) return { kind: "leaf", id, text: cut(expr.span), mark: "", word: "" };
      if (term.type === "Binding") return { kind: "joint", id, key: cut(term.key.span), value: cut(term.value.span), text: cut(expr.span) };
      if (term.type === "Reference") return { kind: "ref", id, name: term.raw, text: cut(expr.span) };
      const isOp = term.type === "Operation";
      const mark = isOp && term.operator ? term.operator.value : "";
      const word = isOp ? (term.operatorLabel ? term.operatorLabel.value : "") : term.type === "Identifier" ? term.token.value : "";
      const body = (isOp && term.body) || expr.body;
      if (word && body && body.type === "Body" && text[body.span.start.offset] === "{" && depth < data.stage.depth) {
        const seq = body.sequence && body.sequence.type === "Sequence" ? body.sequence : null;
        const exprs = seq ? seq.expressions : body.sequence ? [body.sequence] : [];
        const seps = seq ? (seq.separators || []).map((s) => (s ? s.value : " ")) : [];
        return {
          kind: "frame", id, mark, word,
          label: text.slice(expr.span.start.offset, body.span.start.offset),
          close: body.span.end.offset - 1,
          sep: seps.find((s) => s !== " ") || (seps.length ? " " : ","),
          parts: exprs.map((part, index) => node(part, `${id}.${index}`, depth + 1)),
        };
      }
      return { kind: "leaf", id, text: cut(expr.span), mark, word };
    };
    const tree = node(top[0], "0", 0);
    if (tree.kind !== "frame") return { ok: false, line: text, tokens, says: "This line has no { } body, so nothing is inside it to move. Try one with a body." };
    return { ok: true, line: text, tokens, tree };
  }

  const framesOf = (tree) => {
    const out = [];
    const walk = (node) => { if (node.kind !== "frame") return; out.push(node); node.parts.forEach(walk); };
    walk(tree);
    return out;
  };
  const frameAt = (tree, id) => framesOf(tree).find((frame) => frame.id === id) || null;

  /** Every body's seat at rest. Rows are centered in their body; each body keeps room for one visitor. */
  function arrange(tree, options) {
    const share = data.shares[options && options.share] ?? 0.6;
    const frames = [], bodies = [], sights = [];
    const NEUTRAL = { dy: 0, stiff: 1, gather: 0, room: 0 };
    const lawOf = (mark, around) => {
      const own = LAWS.get(mark) || {};
      return {
        dy: (own.dy || 0) + share * around.dy,
        gather: (own.gather || 0) + share * around.gather,
        room: (own.room || 0) + share * around.room,
        stiff: (own.stiff || 1) * (1 + share * (around.stiff - 1)),
      };
    };
    const measure = (node, maxW) => {
      if (node.kind === "joint") {
        const kw = textW(`${node.key}:`), vw = textW(node.value);
        return { node, w: kw + JOINT + vw, h: PILL_H, kw, vw };
      }
      if (node.kind !== "frame") return { node, w: textW(node.text), h: PILL_H };
      const inner = maxW - PAD * 2;
      const items = node.parts.map((part) => measure(part, inner));
      const rows = [];
      let row = { items: [], w: 0, h: PILL_H };
      for (const item of items) {
        if (row.items.length && row.w + GAP + item.w > inner) { rows.push(row); row = { items: [], w: 0, h: PILL_H }; }
        row.w = row.items.length ? row.w + GAP + item.w : item.w;
        row.h = Math.max(row.h, item.h);
        row.items.push(item);
      }
      if (row.items.length) rows.push(row);
      const widest = Math.max(0, ...rows.map((r) => r.w));
      const w = node.id === "0" ? maxW : Math.min(maxW, Math.max(textW(node.label) + 12, widest + RESERVE) + PAD * 2);
      // The visitor's row: the one with the most room; if none has room for a word, an empty row below.
      let landing = rows.reduce((best, r, index) => (best < 0 || r.w < rows[best].w ? index : best), -1);
      if (landing < 0 || w - PAD * 2 - rows[landing].w < RESERVE) { rows.push({ items: [], w: 0, h: PILL_H }); landing = rows.length - 1; }
      const h = TAB + SLACK + rows.reduce((sum, r) => sum + r.h, 0) + GAP * (rows.length - 1) + SLACK + EDGE;
      return { node, w, h, rows, landing };
    };
    const seat = (frame, law, x, y) => {
      const mx = frame.x + frame.w / 2, my = frame.y + TAB + (frame.h - TAB - EDGE) / 2;
      return { sx: mx + (x - mx) * (1 - law.gather), sy: my + (y - my) * (1 - law.gather) + Math.max(-SLACK, Math.min(SLACK, law.dy)) };
    };
    const place = (m, x, y, parent, around, depth) => {
      const node = m.node;
      if (node.kind === "frame") {
        const law = lawOf(node.mark, around);
        const own = LAWS.get(node.mark);
        const frame = { id: node.id, parent: parent ? parent.id : "", depth, x, y, w: m.w, h: m.h, label: node.label, mark: node.mark, word: node.word, law, does: own ? own.does : "", parts: node.parts.length };
        frames.push(frame);
        let cy = y + TAB + SLACK;
        m.rows.forEach((row, index) => {
          let cx = x + (m.w - row.w) / 2;
          for (const item of row.items) { place(item, cx, cy + (row.h - item.h) / 2, frame, law, depth + 1); cx += item.w + GAP; }
          if (index === m.landing) {
            const last = row.items[row.items.length - 1];
            // Half over the last word, so a visitor is met; clear of a body, which is closed.
            frame.landing = { x: !last ? x + m.w / 2 : last.node.kind === "frame" ? cx : cx - GAP - 12, y: cy + row.h / 2, empty: !last, beside: last ? (last.node.kind === "frame" ? last.node.label : last.node.kind === "joint" ? last.node.value : last.node.text) : "" };
          }
          cy += row.h + GAP;
        });
        return;
      }
      const cy = y + m.h / 2;
      const base = { frame: parent.id, w: m.w, h: m.h, mark: node.mark || "", word: node.word || "" };
      if (node.kind === "joint") {
        const k = seat(parent, around, x + m.kw / 2, cy);
        const rest = m.kw / 2 + JOINT + m.vw / 2;
        bodies.push({ ...base, id: `${node.id}k`, kind: "key", text: `${node.key}:`, word: node.key, w: m.kw, ...k, joint: node.text });
        bodies.push({ ...base, id: `${node.id}v`, kind: "value", text: node.value, word: node.value, w: m.vw, sx: k.sx + rest, sy: k.sy, key: `${node.id}k`, rest, joint: node.text });
        return;
      }
      bodies.push({ ...base, id: node.id, kind: node.kind, text: node.text, name: node.name || "", ...seat(parent, around, x + m.w / 2, cy) });
    };
    const root = measure(tree, W - EDGE * 2);
    place(root, EDGE, EDGE, null, NEUTRAL, 0);
    for (const body of bodies) {
      if (body.kind !== "ref") continue;
      const leafName = body.name.split(".").pop();
      const to = bodies.find((other) => other.kind !== "ref" && other.id !== body.id && (other.word === body.name || other.word === leafName));
      sights.push({ from: body.id, to: to ? to.id : "", name: body.name });
    }
    return { width: W, height: root.h + EDGE * 2, frames, bodies, sights, share };
  }

  /** The floor in motion: bodies on springs to their seats, contact inside one body, and a clock per body. */
  function world(lay, carried) {
    const feel = data.feel;
    const frames = new Map(lay.frames.map((frame) => [frame.id, { ...frame, warm: false, calm: 0 }]));
    const bodies = lay.bodies.map((body) => {
      const from = carried && carried.get(body.id);
      return { ...body, x: from ? from.x : body.sx, y: from ? from.y : body.sy, vx: 0, vy: 0, held: false };
    });
    const byId = new Map(bodies.map((body) => [body.id, body]));
    const inside = (id) => lay.frames.filter((frame) => frame.parent === id);
    const state = { steps: 0, visitor: null };
    const target = (body) => {
      const key = body.key && byId.get(body.key);
      return key ? { x: key.x + body.rest, y: key.y } : { x: body.sx, y: body.sy };
    };
    const off = (body) => { const t = target(body); return Math.hypot(body.x - t.x, body.y - t.y); };
    const clamp = (body) => {
      const frame = frames.get(body.frame);
      const minX = frame.x + EDGE + body.w / 2, maxX = frame.x + frame.w - EDGE - body.w / 2;
      const minY = frame.y + TAB + body.h / 2, maxY = frame.y + frame.h - EDGE - body.h / 2;
      if (body.x < minX) { body.x = minX; body.vx = 0; } else if (body.x > maxX) { body.x = maxX; body.vx = 0; }
      if (body.y < minY) { body.y = minY; body.vy = 0; } else if (body.y > maxY) { body.y = maxY; body.vy = 0; }
    };
    /** The push that parts two overlapping boxes, along the axis where they overlap least. */
    const part = (a, bx, by, bw, bh, margin) => {
      const dx = a.x - bx, dy = a.y - by;
      const ox = (a.w + bw) / 2 + margin - Math.abs(dx), oy = (a.h + bh) / 2 + margin - Math.abs(dy);
      if (ox <= 0 || oy <= 0) return null;
      return ox < oy ? { x: (dx < 0 ? -1 : 1) * ox, y: 0 } : { x: 0, y: (dy < 0 ? -1 : 1) * oy };
    };
    function step() {
      state.steps += 1;
      const warm = [...frames.values()].filter((frame) => frame.warm);
      for (const frame of warm) {
        const own = bodies.filter((body) => body.frame === frame.id);
        const boxes = inside(frame.id);
        const margin = MARGIN + frame.law.room;
        const visitor = state.visitor && state.visitor.frame === frame.id ? state.visitor : null;
        let still = true;
        const was = own.map((body) => ({ x: body.x, y: body.y }));
        for (const body of own) {
          if (body.held) { still = false; continue; }
          const k = feel.spring * frame.law.stiff * (body.key ? 3 : 1);
          const t = target(body);
          if (visitor && visitor.mark && body !== visitor && !body.key) {
            // A marked visitor carries its mark's law: the parts near it feel it, less with distance. A part wearing the same mark gives it room.
            const law = LAWS.get(visitor.mark) || {};
            const dx = body.sx - visitor.x, dy = body.sy - visitor.y;
            const d = Math.hypot(dx, dy) || 1;
            const fall = 1 / (1 + (d / feel.reach) ** 2);
            if (body.mark === visitor.mark) { t.x += feel.room * fall * (dx / d); t.y += feel.room * fall * (dy / d); }
            else {
              t.y += (law.dy || 0) * feel.lean * fall;
              t.x -= (law.gather || 0) * 40 * fall * (dx / d); t.y -= (law.gather || 0) * 40 * fall * (dy / d);
            }
          }
          const ax = k * (t.x - body.x), ay = k * (t.y - body.y);
          const damp = Math.exp(-2 * feel.damping * Math.sqrt(k) * DT);
          body.vx = (body.vx + ax * DT) * damp; body.vy = (body.vy + ay * DT) * damp;
          body.x += body.vx * DT; body.y += body.vy * DT;
          clamp(body);
        }
        // Contact: two words never share ground. Each gives half the way; a held word and a closed body give none.
        const give = (body, push, share) => {
          body.x += push.x * share; body.y += push.y * share;
          if (push.x && Math.sign(body.vx) === -Math.sign(push.x)) body.vx = 0;
          if (push.y && Math.sign(body.vy) === -Math.sign(push.y)) body.vy = 0;
          clamp(body);
        };
        for (let pass = 0; pass < feel.passes; pass += 1) {
          for (let i = 0; i < own.length; i += 1) {
            for (let j = i + 1; j < own.length; j += 1) {
              const a = own[i], b = own[j];
              const push = part(a, b.x, b.y, b.w, b.h, margin);
              if (!push || (a.held && b.held)) continue;
              if (!a.held) give(a, push, b.held ? 1 : 0.5);
              if (!b.held) give(b, { x: -push.x, y: -push.y }, a.held ? 1 : 0.5);
            }
            for (const box of boxes) {
              const push = own[i].held ? null : part(own[i], box.x + box.w / 2, box.y + box.h / 2, box.w, box.h, margin);
              if (push) give(own[i], push, 1);
            }
          }
        }
        own.forEach((body, index) => { if (Math.hypot(body.x - was[index].x, body.y - was[index].y) > 0.002) still = false; });
        // A body cools once nothing in it has moved for a fifth of a second: a turning point is not rest.
        frame.calm = still ? frame.calm + 1 : 0;
        if (frame.calm >= 12) frame.warm = false;
      }
      return [...frames.values()].some((frame) => frame.warm);
    }
    /** Run to rest. The same steps the page animates, so an answer is the same with motion or without. */
    function settle(limit) {
      let n = 0;
      while (n < (limit || 3000) && step()) n += 1;
      for (const frame of frames.values()) frame.warm = false;
      return n;
    }
    /** A touch warms the body it lands in and, by the share, the bodies inside it. Never the one beside it or around it. */
    function touch(frameId) {
      state.steps = 0;
      const warmDown = (id, amount) => {
        const frame = frames.get(id);
        if (!frame) return;
        frame.warm = true; frame.calm = 0;
        if (amount < 1) bodies.filter((body) => body.frame === id).forEach((body, index) => { body.vx += (index % 2 ? 1 : -1) * feel.shiver * amount; });
        for (const child of inside(id)) warmDown(child.id, amount * lay.share);
      };
      warmDown(frameId, 1);
    }
    function push(id, dx, dy) {
      const body = byId.get(id);
      if (!body) return null;
      body.x += dx; body.y += dy;
      clamp(body);
      touch(body.frame);
      return body;
    }
    function hold(id, x, y) {
      const body = byId.get(id);
      if (!body) return;
      if (!body.held) { body.held = true; body.vx = 0; body.vy = 0; }
      body.x = x; body.y = y;
      clamp(body);
      // A visitor stays where it is put; a part of the line comes home.
      if (body.kind === "visitor") { body.sx = body.x; body.sy = body.y; }
      const frame = frames.get(body.frame);
      if (!frame.warm) touch(body.frame);
    }
    function release(id) {
      const body = byId.get(id);
      if (body) { body.held = false; touch(body.frame); }
    }
    function enter(frameId, token, mark) {
      const frame = frames.get(frameId);
      if (!frame || state.visitor) return null;
      const w = Math.round(Math.min(token.length, data.stage.visitorChars + 1) * CH + PILL_PAD * 2);
      const spot = frame.landing;
      const sx = Math.min(frame.x + frame.w - EDGE - w / 2, spot.empty ? spot.x : spot.x + w / 2);
      const visitor = { id: "visitor", frame: frameId, kind: "visitor", text: token, mark, word: token.slice(mark.length), w, h: PILL_H, sx, sy: spot.y + Math.max(-SLACK, Math.min(SLACK, frame.law.dy)), x: sx, y: 0, vx: 0, vy: 0, held: false };
      visitor.y = visitor.sy;
      bodies.push(visitor); byId.set("visitor", visitor);
      state.visitor = visitor;
      touch(frameId);
      return visitor;
    }
    function leave() {
      if (!state.visitor) return;
      const frameId = state.visitor.frame;
      bodies.splice(bodies.indexOf(state.visitor), 1); byId.delete("visitor");
      state.visitor = null;
      touch(frameId);
    }
    /** What a person can check: how far from rest, each joint against its rest length, each sight line's far end, and what is felt outside the visitor's braces. */
    function measures() {
      const parts = bodies.filter((body) => body.kind !== "visitor");
      const far = parts.reduce((best, body) => (off(body) > off(best) ? body : best), parts[0]);
      const visitor = state.visitor;
      const within = new Set();
      const walk = (id) => { within.add(id); inside(id).forEach((child) => walk(child.id)); };
      if (visitor) walk(visitor.frame);
      return {
        off: far ? off(far) : 0,
        farthest: far ? far.text : "",
        moved: visitor ? parts.filter((body) => body.frame === visitor.frame && off(body) >= 0.05).map((body) => ({ text: body.text, by: off(body) })) : [],
        joints: parts.filter((body) => body.key).map((body) => {
          const key = byId.get(body.key);
          return { text: body.joint, now: Math.hypot(body.x - key.x, body.y - key.y), rest: body.rest };
        }),
        sights: lay.sights.map((sight) => {
          const from = byId.get(sight.from), to = sight.to && byId.get(sight.to);
          return { name: sight.name, to: to ? to.text : "", length: to ? Math.hypot(to.x - from.x, to.y - from.y) : 0, moved: to ? Math.hypot(to.x - to.sx, to.y - to.sy) : 0 };
        }),
        outside: visitor ? { of: bodyName(frames.get(visitor.frame)), moved: parts.filter((body) => !within.has(body.frame)).reduce((most, body) => Math.max(most, off(body)), 0) } : null,
        warm: [...frames.values()].filter((frame) => frame.warm).map(bodyName),
        seconds: Math.max(0, state.steps - 12) * DT,
      };
    }
    return { bodies, byId, frames, state, step, settle, touch, push, hold, release, enter, leave, measures, off };
  }

  /** The visitor as it would be written: a word, with or without a mark in front. */
  function visitorToken(word, mark) {
    const clean = (String(word || "").match(/[A-Za-z][A-Za-z0-9_]*/) || ["pebble"])[0].slice(0, data.stage.visitorChars);
    return `${LAWS.has(mark) && LAWS.get(mark).near ? mark : ""}${clean}`;
  }

  /** Write a visitor into a body, before its closing brace. Every other byte stays; where the reader would not read it the same, nothing is written. */
  function keep(parseLine, reading, frameId, token) {
    const frame = frameAt(reading.tree, frameId);
    if (!frame) return { ok: false, says: "That body is not in the line." };
    const joiner = !frame.parts.length ? "" : frame.sep === "," ? ", " : frame.sep === ";" ? "; " : null;
    if (joiner === null) return { ok: false, says: `This body joins its parts another way (${frame.sep.trim() || "a gap"}). The floor writes only into a list ( , ) or an order ( ; ), so nothing was written.` };
    let at = frame.close;
    while (at > 0 && reading.line[at - 1] === " ") at -= 1;
    const insert = `${joiner}${token}`;
    const line = `${reading.line.slice(0, at)}${insert}${reading.line.slice(at)}`;
    const next = read(parseLine, line);
    const after = next.ok ? frameAt(next.tree, frameId) : null;
    if (!after || after.parts.length !== frame.parts.length + 1) return { ok: false, says: "The reader did not read the new line the same way, so nothing was written." };
    return { ok: true, line, at, length: insert.length, insert, bytes: bytes(insert), reading: next, partId: `${frameId}.${frame.parts.length}` };
  }

  /** The line in its colors, from the reader's own tokens; `ins` marks what a keep wrote or would write. */
  function paint(text, tokens, ins) {
    const CLOSE = { "]": "[", "}": "{", ")": "(", ">": "<" };
    let out = "", at = 0, open = false;
    const put = (from, to, type) => {
      if (to <= from) return;
      const inIns = Boolean(ins) && from >= ins.at && to <= ins.at + ins.length;
      if (inIns !== open) { out += inIns ? "<ins>" : "</ins>"; open = inIns; }
      const inner = esc(text.slice(from, to));
      out += type ? `<span data-t="${type}">${inner}</span>` : inner;
    };
    for (const token of tokens || []) {
      const from = token.span.start.offset, to = token.span.end.offset;
      if (from < at || to <= from || to > text.length) continue;
      put(at, from, "");
      let type = "";
      if (token.type === "OPERATOR") type = data.types[token.value] || "";
      else if (token.type === "CONTAINER_OPEN" || token.type === "CONTAINER_CLOSE") {
        const brace = data.braces[CLOSE[token.value] || token.value];
        type = brace ? `b-${brace}` : "";
      }
      put(from, to, type);
      at = to;
    }
    put(at, text.length, "");
    if (open) out += "</ins>";
    return out;
  }

  /** The floor as SVG. Order is the rule that no line strikes a word: wells, then lines, then tabs and words on opaque ground. */
  function draw(lay, bodies, options) {
    const live = Boolean(options && options.live);
    const at = new Map((bodies || lay.bodies.map((body) => ({ ...body, x: body.sx, y: body.sy }))).map((body) => [body.id, body]));
    const typeOf = (mark) => data.types[mark] || "";
    const marked = (text, mark) => (mark && text.startsWith(mark) ? `<tspan data-t="${typeOf(mark)}">${esc(mark)}</tspan>${esc(shown(text).slice(mark.length))}` : esc(shown(text)));
    const wells = lay.frames.map((frame) => `<rect class="well" data-frame="${frame.id}"${frame.mark && typeOf(frame.mark) ? ` data-t="${typeOf(frame.mark)}"` : ""} x="${frame.x}" y="${frame.y + TAB / 2}" width="${frame.w}" height="${frame.h - TAB / 2}" rx="9"/>`).join("");
    const sights = lay.sights.filter((sight) => sight.to).map((sight) => {
      const a = at.get(sight.from), b = at.get(sight.to);
      return `<line class="sight" data-sight="${sight.from}" x1="${round(a.x)}" y1="${round(a.y)}" x2="${round(b.x)}" y2="${round(b.y)}"/>`;
    }).join("");
    const joints = [...at.values()].filter((body) => body.key).map((body) => {
      const key = at.get(body.key);
      return `<line class="joint" data-joint="${body.id}" x1="${round(key.x)}" y1="${round(key.y)}" x2="${round(body.x)}" y2="${round(body.y)}"/>`;
    }).join("");
    const tabs = lay.frames.map((frame) => {
      const w = textW(frame.label) - 4;
      const x = frame.x + (frame.w - w) / 2;
      return `<g class="tab" data-tab="${frame.id}"${live ? ` tabindex="0" role="button" aria-label="Stand in ${esc(bodyName(frame))}"` : ""}><rect x="${round(x)}" y="${frame.y}" width="${w}" height="${TAB}" rx="6"/><text x="${round(frame.x + frame.w / 2)}" y="${frame.y + TAB / 2}">${marked(frame.label, frame.mark)}</text></g>`;
    }).join("");
    const says = (body) => {
      const home = lay.frames.find((frame) => frame.id === body.frame);
      const where = home ? `in ${bodyName(home)}` : "";
      if (body.kind === "visitor") return `${body.text}, a visitor ${where}. The line does not write it.`;
      if (body.kind === "ref") return `${body.text}, a sight line ${where}. Enter follows it. Arrow keys push it; it comes home.`;
      if (body.kind === "key") return `${body.text} the key of ${body.joint}, ${where}. Its value moves with it. Arrow keys push it.`;
      if (body.kind === "value") return `${body.text}, the value of ${body.joint}, ${where}. Arrow keys push it; it comes back to its key.`;
      return `${body.text}, a part ${where}. Arrow keys push it; it comes home.`;
    };
    const parts = [...at.values()].map((body) => `<g class="part" data-id="${body.id}" data-kind="${body.kind}"${live ? ` tabindex="0" role="button" aria-label="${esc(says(body))}"` : ""} transform="translate(${round(body.x)} ${round(body.y)})"><rect x="${-body.w / 2}" y="${-body.h / 2}" width="${body.w}" height="${body.h}" rx="${body.h / 2}"/><text>${marked(body.text, body.mark)}</text></g>`).join("");
    return `<g class="wells">${wells}</g><g class="lines">${sights}${joints}</g><g class="tabs">${tabs}</g><g class="ghosts"></g><g class="parts">${parts}</g>`;
  }

  /** The measures as table rows, in words and numbers a person can check. */
  function measureRows(m) {
    const rows = [];
    const row = (key, name, value) => rows.push(`<tr data-m="${key}"><th scope="row">${name}</th><td>${value}</td></tr>`);
    row("off", "Farthest from rest", m.off < 0.05 ? "0.0 px: every part is home" : `${round(m.off)} px (${esc(m.farthest)})`);
    for (const joint of m.joints) row("joint", `<code>${esc(joint.text)}</code>`, `${round(joint.now)} px apart, at rest ${round(joint.rest)} px`);
    for (const sight of m.sights) row("sight", `<code>@${esc(sight.name)}</code>`, sight.to ? `a sight line ${round(sight.length)} px long; <code>${esc(sight.to)}</code> has moved ${round(sight.moved)} px` : "points outside this line; nothing is drawn");
    if (m.outside) {
      row("moved", "Moved by the visitor", m.moved.length ? m.moved.map((part) => `<code>${esc(part.text)}</code> ${round(part.by)} px`).join(", ") : "nothing: there was room");
      row("outside", `Outside ${esc(m.outside.of)}`, `${round(m.outside.moved)} px moved; the braces are closed, so nothing is felt out here`);
    }
    row("warm", "Warm now", m.warm.length ? esc(m.warm.join(", ")) : "nothing: the floor is at rest");
    return rows.join("");
  }

  /** The floor's own state as a line the reader reads: where you stand, who is visiting, what was kept, and the share. */
  function floorLine(state) {
    const fields = [];
    if (state.visitor) fields.push(`visitor: ${state.visitor}`);
    if (state.kept) fields.push(`kept: ${state.kept}`);
    fields.push(`share: ${state.share}`);
    return `floor[${state.standing}]{${fields.join(", ")}}`;
  }

  const nearOf = (mark) => (LAWS.get(mark) || {}).near || "";

  return { read, arrange, world, keep, nearOf, paint, draw, measureRows, floorLine, visitorToken, framesOf, frameAt, bodyName, bytes, round, TAB, DT };
}

/** Scripts on: the hand. Drag, arrow keys or the buttons; each act ends in a receipt that says what the line did. */
function liveField(kit, parseLine, boot) {
  const $ = (id) => document.getElementById(id);
  const stage = $("stage");
  if (!stage) return;
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const NS = "http://www.w3.org/2000/svg";
  const brought = boot.line;
  let reading = kit.read(parseLine, brought);
  if (!reading.ok) return;
  let share = boot.share;
  let lay = kit.arrange(reading.tree, { share });
  let sim = kit.world(lay);
  let standing = "0";
  let undo = [];
  let kept = "";
  let pending = null;
  let running = false;
  let view = { x: 0, y: 0, w: lay.width, h: lay.height };
  let viewTo = null;
  let ins = null;
  let ghost = null;

  const frameOf = (id) => lay.frames.find((frame) => frame.id === id);
  const token = () => kit.visitorToken($("visitor-word").value, document.querySelector('input[name="who"]:checked').value === "marked" ? $("visitor-mark").value : "");
  const say = (text, wrote) => {
    const item = document.createElement("li");
    const what = document.createElement("span");
    what.textContent = text;
    const tag = document.createElement("span");
    tag.className = wrote ? "wrote" : "held";
    tag.textContent = wrote || "the line is as written";
    item.append(what, " ", tag);
    $("receipts").prepend(item);
    while ($("receipts").children.length > 6) $("receipts").lastChild.remove();
  };

  function render() {
    for (const body of sim.bodies) {
      const node = stage.querySelector(`.part[data-id="${body.id}"]`);
      if (node) node.setAttribute("transform", `translate(${kit.round(body.x)} ${kit.round(body.y)})`);
    }
    for (const line of stage.querySelectorAll(".joint")) {
      const value = sim.byId.get(line.dataset.joint), key = value && sim.byId.get(value.key);
      if (!key) continue;
      line.setAttribute("x1", kit.round(key.x)); line.setAttribute("y1", kit.round(key.y));
      line.setAttribute("x2", kit.round(value.x)); line.setAttribute("y2", kit.round(value.y));
    }
    for (const line of stage.querySelectorAll(".sight")) {
      const sight = lay.sights.find((s) => s.from === line.dataset.sight);
      const a = sight && sim.byId.get(sight.from), b = sight && sim.byId.get(sight.to);
      if (!a || !b) continue;
      line.setAttribute("x1", kit.round(a.x)); line.setAttribute("y1", kit.round(a.y));
      line.setAttribute("x2", kit.round(b.x)); line.setAttribute("y2", kit.round(b.y));
    }
    for (const well of stage.querySelectorAll(".well")) well.toggleAttribute("data-warm", sim.frames.get(well.dataset.frame).warm);
    stage.setAttribute("viewBox", `${kit.round(view.x)} ${kit.round(view.y)} ${kit.round(view.w)} ${kit.round(view.h)}`);
  }
  function report() {
    $("measures").tBodies[0].innerHTML = kit.measureRows(sim.measures());
    const box = stage.getBoundingClientRect();
    const scale = Math.min(box.width / view.w, box.height / view.h);
    const times = scale / (box.width / lay.width);
    $("rule").style.width = `${Math.round(20 * scale)}px`;
    $("rule-says").textContent = `20 px of the floor${times > 1.05 ? ` · ${kit.round(times)} times nearer` : ""}`;
  }
  function redraw() {
    stage.innerHTML = kit.draw(lay, sim.bodies, { live: true });
    drawGhost();
    render();
    report();
  }
  /** One clock for everything that moves. With reduced motion the same steps run at once and the answer is shown. */
  function run() {
    if (still.matches) {
      sim.settle();
      if (viewTo) { view = viewTo; viewTo = null; }
      finish();
      return;
    }
    if (running) return;
    running = true;
    const tick = () => {
      const warm = sim.step();
      if (viewTo) {
        for (const key of ["x", "y", "w", "h"]) view[key] += (viewTo[key] - view[key]) * 0.2;
        if (Math.abs(viewTo.w - view.w) < 0.3 && Math.abs(viewTo.x - view.x) < 0.3 && Math.abs(viewTo.y - view.y) < 0.3) { view = viewTo; viewTo = null; }
      }
      render();
      if (warm || viewTo || sim.bodies.some((body) => body.held)) { requestAnimationFrame(tick); return; }
      running = false;
      finish();
    };
    requestAnimationFrame(tick);
  }
  function finish() {
    render();
    report();
    if (!pending) return;
    const act = pending;
    pending = null;
    say(act(sim.measures()));
  }

  function lineState() {
    $("line").innerHTML = kit.paint(reading.line, reading.tokens, ins);
    const same = reading.line === brought;
    $("line-state").textContent = same ? `as written · ${kit.bytes(reading.line)} bytes` : `written here · ${kit.bytes(reading.line)} bytes, ${kit.bytes(reading.line) - kit.bytes(brought)} more than you brought`;
    $("line-state").dataset.state = same ? "held" : "wrote";
    const query = `?line=${encodeURIComponent(reading.line)}${share === boot.defaultShare ? "" : `&share=${share}`}`;
    history.replaceState(null, "", same && share === boot.defaultShare && brought === boot.opening ? location.pathname : query);
    for (const link of document.querySelectorAll("a[data-carry]")) {
      const to = link.dataset.carry;
      link.href = to === "pivot" ? `/pivot?line=${encodeURIComponent(reading.line)}` : to === "build" ? `/build?script=${encodeURIComponent(reading.line)}#build` : `/canvas?line=${encodeURIComponent(reading.line)}`;
    }
  }
  function controls() {
    const visitor = sim.state.visitor;
    const here = frameOf(standing);
    const tok = visitor ? visitor.text : token();
    const marked = tok !== tok.replace(/^[^A-Za-z]+/, "");
    $("visitor-in").disabled = Boolean(visitor);
    $("visitor-out").disabled = !visitor;
    $("keep-write").disabled = !visitor;
    $("keep-undo").disabled = !undo.length;
    for (const field of document.querySelectorAll("#visitor input, #visitor select")) field.disabled = Boolean(visitor);
    $("visitor-mark").disabled = Boolean(visitor) || document.querySelector('input[name="who"]:checked').value !== "marked";
    const spot = here.landing;
    $("visitor-says").textContent = visitor
      ? `${visitor.text} is in ${kit.bodyName(frameOf(visitor.frame))}. The line does not write it.`
      : `${tok} would land in ${kit.bodyName(here)}${spot.empty ? ", on open ground" : `, beside ${spot.beside}`}. ${marked ? `It wears ${tok.replace(/[A-Za-z].*$/, "")}: the parts near it ${kit.nearOf(tok.replace(/[A-Za-z].*$/, ""))}, less with distance, and a part wearing the same mark gives it room.` : "A bare word has no sign: it moves a neighbour only by touching it."} The line stays as written.`;
    const would = kit.keep(parseLine, reading, visitor ? visitor.frame : standing, tok);
    $("keep-says").innerHTML = would.ok
      ? `Kept, the line would read <code>${kit.paint(would.line, would.reading.tokens, { at: would.at, length: would.length })}</code>`
      : would.says;
    $("floor-line").innerHTML = (() => {
      const line = kit.floorLine({ standing: here.word, visitor: visitor ? visitor.text : "", kept, share });
      return kit.paint(line, kit.read(parseLine, line).tokens);
    })();
    const chosen = $("touch-part").value;
    $("touch-part").innerHTML = sim.bodies.filter((body) => body.kind !== "visitor").map((body) => `<option value="${body.id}">${body.text.replace(/&/g, "&amp;").replace(/</g, "&lt;")} · ${kit.bodyName(frameOf(body.frame))}</option>`).join("");
    if (sim.byId.has(chosen)) $("touch-part").value = chosen;
    for (const button of document.querySelectorAll("#scale button")) button.setAttribute("aria-pressed", String(button.dataset.stand === standing));
    const lawful = (law) => law.dy !== 0 || law.gather !== 0 || law.room !== 0 || law.stiff !== 1;
    $("share-says").textContent = lay.frames.some((f) => f.parent && lawful(frameOf(f.parent).law))
      ? "A marked body holds another here, so the inner one changes with this choice."
      : "In this line no marked body holds another, so only the warmth passed inward changes.";
  }
  function drawGhost() {
    const layer = stage.querySelector(".ghosts");
    if (!layer) return;
    layer.innerHTML = "";
    const mk = (x, y, text, kind) => {
      const w = Math.round(text.length * 7.25 + 18);
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "part ghost"); g.dataset.kind = kind; g.setAttribute("aria-hidden", "true");
      g.setAttribute("transform", `translate(${kit.round(x)} ${kit.round(y)})`);
      const rect = document.createElementNS(NS, "rect");
      rect.setAttribute("x", -w / 2); rect.setAttribute("y", -13); rect.setAttribute("width", w); rect.setAttribute("height", 26); rect.setAttribute("rx", 13);
      const label = document.createElementNS(NS, "text");
      label.textContent = text;
      g.append(rect, label);
      layer.append(g);
    };
    if (!sim.state.visitor) {
      const here = frameOf(standing), tok = token();
      const w = Math.round(tok.length * 7.25 + 18);
      mk(Math.min(here.x + here.w - 4 - w / 2, here.landing.empty ? here.landing.x : here.landing.x + 14 + w / 2), here.landing.y, tok, "landing");
    }
    if (ghost) {
      const from = sim.byId.get(ghost.from), to = sim.byId.get(ghost.to);
      if (from && to) mk(from.x, from.y - 30 < frameOf(from.frame).y + kit.TAB ? from.y + 30 : from.y - 30, to.text, "followed");
    }
  }

  /** Stand in a body: the view steps to it, and a visitor lands there. The stage keeps its box, so the page does not move. */
  function viewOf(id) {
    const frame = frameOf(id);
    if (!frame || id === "0") return { x: 0, y: 0, w: lay.width, h: lay.height };
    const box = stage.getBoundingClientRect();
    const aspect = box.height ? box.width / box.height : lay.width / lay.height, pad = 14;
    let w = frame.w + pad * 2, h = frame.h + pad * 2;
    if (w / h > aspect) h = w / aspect; else w = h * aspect;
    return { x: frame.x + frame.w / 2 - w / 2, y: frame.y + frame.h / 2 - h / 2, w, h };
  }
  function stand(id) {
    standing = id;
    viewTo = viewOf(id);
    controls();
    drawGhost();
    run();
    if (still.matches) report();
  }
  function relayout(carry) {
    const carried = carry ? new Map(sim.bodies.map((body) => [body.id, body])) : null;
    const visitor = sim.state.visitor;
    lay = kit.arrange(reading.tree, { share });
    sim = kit.world(lay, carried);
    if (!frameOf(standing)) standing = "0";
    if (visitor && frameOf(visitor.frame)) {
      const again = sim.enter(visitor.frame, visitor.text, visitor.mark);
      if (again && carried) { again.x = visitor.x; again.y = visitor.y; again.sx = visitor.sx; again.sy = visitor.sy; }
    }
    if (carry) for (const frame of lay.frames) sim.frames.get(frame.id).warm = true;
    viewTo = viewOf(standing);
    scaleNav();
    redraw();
  }
  function scaleNav() {
    $("scale").innerHTML = `<span class="label" id="scale-label">Stand in</span>${lay.frames.map((frame) => `<button type="button" class="secondary" data-stand="${frame.id}" aria-pressed="${frame.id === standing}">${frame.id === "0" ? "the whole line" : kit.bodyName(frame).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</button>`).join("")}`;
  }

  // The hand on the floor: a drag is a touch, and so are the arrow keys.
  const point = (event) => {
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(stage.getScreenCTM().inverse());
    return { x: p.x, y: p.y };
  };
  let drag = null;
  stage.addEventListener("pointerdown", (event) => {
    const node = event.target.closest(".part[data-id]");
    if (!node || node.classList.contains("ghost")) return;
    const body = sim.byId.get(node.dataset.id);
    const p = point(event);
    drag = { id: body.id, dx: body.x - p.x, dy: body.y - p.y, from: { x: body.x, y: body.y }, far: 0, pointer: event.pointerId };
    node.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  stage.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const p = point(event);
    const body = sim.byId.get(drag.id);
    const far = Math.hypot(p.x + drag.dx - drag.from.x, p.y + drag.dy - drag.from.y);
    if (far < 3 && !body.held) return;
    drag.far = Math.max(drag.far, far);
    sim.hold(drag.id, p.x + drag.dx, p.y + drag.dy);
    run();
  });
  const drop = (event) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const body = sim.byId.get(drag.id);
    const moved = drag.far;
    drag = null;
    if (!body) return;
    if (!body.held) { activate(body); return; }
    sim.release(body.id);
    pending = body.kind === "visitor"
      ? () => `Moved the visitor ${body.text} ${kit.round(moved)} px. It stays where it was put.`
      : (m) => `Touch: ${body.text} carried ${kit.round(moved)} px and let go. Home in ${kit.round(m.seconds)} s, ${kit.round(m.off)} px from rest.`;
    run();
  };
  stage.addEventListener("pointerup", drop);
  stage.addEventListener("pointercancel", drop);
  function activate(body) {
    if (body.kind !== "ref") return;
    const sight = lay.sights.find((s) => s.from === body.id);
    if (!sight || !sight.to) { say(`${body.text} points outside this line. There is nothing to follow.`); return; }
    ghost = ghost && ghost.from === body.id ? null : { from: body.id, to: sight.to };
    drawGhost();
    const to = sim.byId.get(sight.to);
    say(ghost ? `Followed ${body.text}: a ghost of ${to.text} is in view. ${to.text} moved ${kit.round(sim.off(to))} px.` : `Let ${body.text} go. The ghost is gone.`);
  }
  function pushPart(id, dx, dy) {
    const body = sim.push(id, dx, dy);
    if (!body) return;
    const frame = frameOf(body.frame);
    const warmed = lay.frames.filter((f) => f.parent === frame.id).map(kit.bodyName);
    pending = (m) => `Touch: ${body.text} pushed ${Math.round(Math.hypot(dx, dy))} px. Home in ${kit.round(m.seconds)} s, ${kit.round(m.off)} px from rest. Warmed ${kit.bodyName(frame)}${warmed.length ? ` and, by the share, ${warmed.join(" and ")}` : ""}; nothing beside it.`;
    run();
  }
  stage.addEventListener("keydown", (event) => {
    const tab = event.target.closest(".tab[data-tab]");
    if (tab && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); stand(tab.dataset.tab); return; }
    const node = event.target.closest(".part[data-id]");
    if (!node) return;
    const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
    if (step) { event.preventDefault(); pushPart(node.dataset.id, step[0] * boot.push, step[1] * boot.push); return; }
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(sim.byId.get(node.dataset.id)); }
  });
  stage.addEventListener("click", (event) => {
    const tab = event.target.closest(".tab[data-tab]");
    if (tab) stand(tab.dataset.tab);
  });

  $("scale").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-stand]");
    if (button) stand(button.dataset.stand);
  });
  $("touch-push").addEventListener("click", () => pushPart($("touch-part").value, boot.push, 0));
  for (const field of document.querySelectorAll("#visitor input, #visitor select")) {
    field.addEventListener("input", () => { controls(); drawGhost(); });
  }
  $("visitor-in").addEventListener("click", () => {
    const tok = token();
    const mark = tok.replace(/[A-Za-z].*$/, "");
    const visitor = sim.enter(standing, tok, mark);
    if (!visitor) return;
    const frame = frameOf(standing);
    redraw();
    controls();
    pending = (m) => `Let ${tok} into ${kit.bodyName(frame)}. ${m.moved.length ? `It moved ${m.moved.map((p) => `${p.text} ${kit.round(p.by)} px`).join(", ")}` : "There was room, and nothing moved"}. Outside the braces, ${kit.round(m.outside.moved)} px. At rest in ${kit.round(m.seconds)} s.`;
    run();
  });
  $("visitor-out").addEventListener("click", () => {
    const visitor = sim.state.visitor;
    if (!visitor) return;
    sim.leave();
    redraw();
    controls();
    pending = (m) => `Took ${visitor.text} out. ${m.off < 0.05 ? "Every part is home" : `${m.farthest} is ${kit.round(m.off)} px from rest`}: ${kit.round(m.off)} px from rest, in ${kit.round(m.seconds)} s.`;
    run();
  });
  $("keep-write").addEventListener("click", () => {
    const visitor = sim.state.visitor;
    if (!visitor) return;
    const wrote = kit.keep(parseLine, reading, visitor.frame, visitor.text);
    if (!wrote.ok) { say(wrote.says); return; }
    undo.push({ line: reading.line, visitor: { frame: visitor.frame, text: visitor.text, mark: visitor.mark, x: visitor.x, y: visitor.y, sx: visitor.sx, sy: visitor.sy }, kept });
    const carried = new Map(sim.bodies.map((body) => [body.id === "visitor" ? wrote.partId : body.id, body]));
    reading = wrote.reading;
    ins = { at: wrote.at, length: wrote.length };
    kept = visitor.text;
    lay = kit.arrange(reading.tree, { share });
    sim = kit.world(lay, carried);
    for (const frame of lay.frames) sim.frames.get(frame.id).warm = true;
    viewTo = viewOf(standing);
    scaleNav();
    redraw();
    lineState();
    controls();
    $("stage").setAttribute("aria-label", `The line ${reading.line}, drawn as bodies inside bodies`);
    pending = null;
    say(`Kept ${visitor.text}: wrote “${wrote.insert}” at ${wrote.at}. It is a part of the line now.`, `the line changed · +${wrote.bytes} bytes`);
    run();
  });
  $("keep-undo").addEventListener("click", () => {
    const back = undo.pop();
    if (!back) return;
    const carried = new Map(sim.bodies.filter((body) => body.kind !== "visitor").map((body) => [body.id, body]));
    reading = kit.read(parseLine, back.line);
    ins = null;
    kept = back.kept;
    lay = kit.arrange(reading.tree, { share });
    sim = kit.world(lay, carried);
    const again = sim.enter(back.visitor.frame, back.visitor.text, back.visitor.mark);
    if (again) Object.assign(again, { x: back.visitor.x, y: back.visitor.y, sx: back.visitor.sx, sy: back.visitor.sy });
    for (const frame of lay.frames) sim.frames.get(frame.id).warm = true;
    viewTo = viewOf(standing);
    scaleNav();
    redraw();
    lineState();
    controls();
    const same = reading.line === brought;
    say(`Undone. ${back.visitor.text} is a visitor again.`, same ? `the line is byte for byte as you brought it · ${kit.bytes(reading.line)} of ${kit.bytes(brought)} bytes` : `the line is as it was before that keep · ${kit.bytes(reading.line)} bytes`);
    run();
  });
  for (const radio of document.querySelectorAll('input[name="share"]')) {
    radio.addEventListener("change", () => {
      share = radio.value;
      relayout(true);
      lineState();
      controls();
      pending = () => `A body inside a marked body now feels its law ${share}.`;
      run();
    });
  }
  addEventListener("resize", report);

  scaleNav();
  redraw();
  lineState();
  controls();
}

const KIT = fieldKit(PHYSICS_DATA);

/** Where a line stands on the floor, when the floor can read it: one expression with a { } body. Other rooms carry a line here only then. */
export function physicsHref(line) {
  const text = String(line || "").trim();
  return text && text.length <= PHYSICS_LIMIT && KIT.read(parse, text).ok ? `/physics?line=${encodeURIComponent(text)}` : null;
}

/** What the address asks for: a line (or the opening one) and a share. */
export function physicsState(params) {
  const asked = String(params.get("line") || "").trim().slice(0, PHYSICS_LIMIT);
  const share = SHARES.some(([name]) => name === params.get("share")) ? params.get("share") : SHARE_DEFAULT;
  const line = asked || PHYSICS_DEFAULT;
  return { line, asked: Boolean(asked), share, reading: KIT.read(parse, line) };
}

export const PHYSICS_CSS = `.physics-page > header, .physics-page > section > h2, .physics-page .axis { max-width: 40rem; margin-inline: auto; text-align: center; }
    .physics-page > header { margin-bottom: 1.2rem; }
    .physics-page > header p { margin: .5rem 0 0; color: var(--muted); }
    .physics-page > section { margin: 0 auto 2rem; max-width: 46rem; }
    .floor .line { margin: 0; text-align: center; font: 1rem/1.5 var(--mono); overflow-wrap: anywhere; }
    .floor .line ins, .hand-cards ins { text-decoration: none; background: var(--accent-soft); box-shadow: inset 0 -2px 0 var(--accent); }
    .floor .line-state { margin: .1rem 0 .6rem; text-align: center; color: var(--muted); font: .82rem/1.4 var(--mono); }
    .floor .line-state[data-state="wrote"] { color: var(--fg); font-weight: 600; }
    .scale { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: .35rem; margin: 0 0 .6rem; }
    .scale .label { flex-basis: 100%; text-align: center; color: var(--muted); font-size: .85rem; }
    .scale button { margin: 0; min-height: 44px; padding: .3rem .85rem; font: .85rem/1.2 var(--mono); }
    .scale button[aria-pressed="true"] { border-color: var(--accent); background: var(--accent-soft); color: var(--fg); font-weight: 600; }
    .stage { display: block; width: 100%; height: auto; border: 1px solid var(--line); border-radius: var(--radius); background: var(--field); touch-action: pan-y; user-select: none; -webkit-user-select: none; }
    .stage .well { fill: color-mix(in srgb, currentColor 6%, transparent); stroke: currentColor; stroke-width: 1.2; }
    .stage .well:not([data-t]) { color: var(--edge); }
    .stage .well[data-warm] { stroke-width: 2.4; stroke-dasharray: 7 3; }
    .stage .tab rect { fill: var(--field); stroke: var(--line); }
    .stage .tab text, .stage .part text { font: 12px/1 var(--mono); fill: var(--fg); text-anchor: middle; dominant-baseline: central; pointer-events: none; }
    .stage .tab text { font-weight: 600; }
    .stage .tab { cursor: pointer; }
    .stage tspan[data-t] { fill: currentColor; }
    .stage .sight { stroke: var(--op-ref-color); stroke-width: 1.3; stroke-dasharray: 4 4; }
    .stage .joint { stroke: var(--fg); stroke-width: 3; stroke-linecap: round; }
    .stage .part rect { fill: var(--field); stroke: var(--edge); stroke-width: 1; }
    .stage .part[data-id] { cursor: grab; touch-action: none; }
    .stage .part[data-kind="ref"] rect { stroke: var(--op-ref-color); stroke-dasharray: 4 3; }
    .stage .part[data-kind="key"] rect, .stage .part[data-kind="value"] rect { stroke: var(--fg); }
    .stage .part[data-kind="visitor"] rect { stroke: var(--fg); stroke-width: 1.6; stroke-dasharray: 2 3; }
    .stage .part.ghost { pointer-events: none; }
    .stage .part.ghost rect { fill: none; stroke: var(--muted); stroke-dasharray: 2 4; }
    .stage .part.ghost text { fill: var(--muted); }
    .stage .part:focus, .stage .tab:focus { outline: none; }
    .stage .part:focus-visible rect, .stage .tab:focus-visible rect { stroke: var(--accent); stroke-width: 2.6; stroke-dasharray: none; }
    .rule-line { display: flex; justify-content: center; align-items: center; gap: .5rem; margin: .4rem 0 .8rem; color: var(--muted); font: .78rem/1.2 var(--mono); }
    .rule-line .rule { display: inline-block; width: 20px; height: 7px; border: 1px solid var(--muted); border-top: 0; }
    .measures { width: 100%; border-collapse: collapse; font-size: .9rem; }
    .measures caption { caption-side: top; padding: 0 0 .3rem; color: var(--muted); font-size: .85rem; text-align: center; }
    .measures th, .measures td { padding: .4rem .5rem; border-top: 1px solid var(--line); text-align: left; vertical-align: top; }
    .measures th { width: 38%; font-weight: 600; }
    .measures td { font-variant-numeric: tabular-nums; }
    .hand-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 14.5rem), 1fr)); gap: .8rem; }
    .hand-cards fieldset { margin: 0; background: var(--field); }
    .hand-cards legend { color: var(--fg); font: 600 1rem/1.2 var(--manuscript); }
    .hand-cards p { margin: 0 0 .5rem; font-size: .9rem; }
    .hand-cards .says { color: var(--muted); overflow-wrap: anywhere; }
    .hand-cards button { margin: .4rem .4rem 0 0; }
    .hand-cards button:disabled { opacity: .45; cursor: not-allowed; }
    .hand-cards .inline { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem .6rem; }
    .hand-cards .inline input[type="text"], .hand-cards select { width: auto; min-width: 6.5rem; max-width: 100%; min-height: 44px; margin: 0; }
    .hand-cards code { font-size: .86rem; overflow-wrap: anywhere; }
    .share { margin: .8rem 0 0; }
    .share .choices { display: flex; flex-wrap: wrap; gap: .2rem 1rem; }
    .own-line { margin: .9rem 0 0; text-align: center; color: var(--muted); font-size: .88rem; }
    .own-line code { display: block; margin-top: .2rem; color: var(--fg); font-size: .9rem; overflow-wrap: anywhere; }
    .receipts { margin: .6rem 0 0; padding: 0; list-style: none; font-size: .88rem; }
    .receipts li { margin: 0; padding: .45rem 0; border-top: 1px solid var(--line); }
    .receipts .held, .receipts .wrote { display: inline-block; padding: 0 .45rem; border: 1px solid var(--line); border-radius: var(--pill); color: var(--muted); font: .76rem/1.6 var(--mono); }
    .receipts .wrote { border-color: var(--accent); color: var(--fg); font-weight: 600; }
    .receipts:empty::after { content: "Nothing yet. The floor is at rest."; color: var(--muted); }
    .carry .ways { display: flex; flex-wrap: wrap; justify-content: center; gap: .2rem; margin: 0; padding: 0; list-style: none; }
    .rules ol { max-width: 40rem; margin-inline: auto; }
    .rules li { margin: .5rem 0; }
    .laws { width: 100%; max-width: 40rem; margin: 1rem auto 0; border-collapse: collapse; font-size: .9rem; }
    .laws th, .laws td { padding: .35rem .5rem; border-top: 1px solid var(--line); text-align: left; }
    .laws code { font-size: 1rem; }
    .bring form { display: grid; gap: .5rem; max-width: 40rem; margin-inline: auto; }
    .bring input[type="text"] { width: 100%; min-height: 44px; font-family: var(--mono); }
    .bring ul { max-width: 40rem; margin: .8rem auto 0; padding: 0; list-style: none; font-size: .9rem; }
    .bring li { margin: .3rem 0; }
    .bring li a { display: inline-block; padding: .35rem 0; font-family: var(--mono); overflow-wrap: anywhere; }
    .bring li span { color: var(--muted); }
    .unread { max-width: 40rem; margin: 0 auto 1.4rem; padding: .7rem .9rem; border: 1px solid var(--warn); border-radius: var(--radius); }
    html:not(.js) .needs-js { display: none; }
    html.js .without-js { display: none; }`;

const DEPICTION = "https://github.com/spwashi/spw-workbench/blob/be2df2ffa273b1b46445dfe812308c4dcd6f9352/docs/theory/spw/depiction-frames.spw";

function restingFloor(state) {
  const { reading } = state;
  const lay = KIT.arrange(reading.tree, { share: state.share });
  const rest = KIT.world(lay).measures();
  const names = KIT.framesOf(reading.tree).map((frame) => `${frame.id === "0" ? "" : "inside it, "}${KIT.bodyName(frame)}${frame.mark ? `, led by ${frame.mark}` : ""}`).join("; ");
  return `<svg id="stage" class="stage" viewBox="0 0 ${lay.width} ${lay.height}" style="aspect-ratio: ${lay.width} / ${lay.height}" role="group" aria-label="${escapeHtml(`The line ${reading.line}, drawn as bodies inside bodies`)}">
    <desc>${escapeHtml(names)}.</desc>
    ${KIT.draw(lay)}
  </svg>
  <p class="rule-line" aria-hidden="true"><span class="rule" id="rule"></span><span id="rule-says">20 px of the floor</span></p>
  <table class="measures" id="measures">
    <caption>What can be checked, measured to a tenth of a pixel</caption>
    <tbody>${KIT.measureRows(rest)}</tbody>
  </table>`;
}

function physicsBody(state) {
  const { reading } = state;
  const painted = KIT.paint(reading.line, reading.tokens);
  const laws = PHYSICS_DATA.laws.map((law) => {
    const name = PHYSICS_DATA.operators.find((op) => op.sigil === law.sigil)?.name || "";
    return `<tr><td><code data-t="${escapeHtml(PHYSICS_DATA.types[law.sigil] || "")}">${escapeHtml(law.sigil)}</code></td><th scope="row">${escapeHtml(name)}</th><td>${escapeHtml(law.does)}: ${escapeHtml(law.says)}</td></tr>`;
  }).join("\n      ");
  const build = scriptAddress(reading.line);
  const floor = reading.ok ? `<section class="floor" aria-labelledby="floor-title">
  <h2 id="floor-title" class="sr-only">The floor</h2>
  <p class="line"><code id="line">${painted}</code></p>
  <p class="line-state" id="line-state" data-state="held">as written · ${KIT.bytes(reading.line)} bytes</p>
  <nav class="scale needs-js" id="scale" aria-labelledby="scale-label"></nav>
  ${restingFloor(state)}
  <p class="axis without-js">With scripts off, this is the line at rest. The hand needs scripts.</p>
</section>
<section class="hands needs-js" aria-labelledby="hands-title">
  <h2 id="hands-title">Three things a hand can do</h2>
  <div class="hand-cards">
    <fieldset id="touch">
      <legend>Touch</legend>
      <p>Push a part and let go. It comes home, and the line stays as written.</p>
      <p class="inline"><label class="sr-only" for="touch-part">Which part</label><select id="touch-part"></select><button type="button" id="touch-push">Push it</button></p>
      <p class="says">Or drag a word on the floor. With a word in focus, the arrow keys push it.</p>
    </fieldset>
    <fieldset id="visitor">
      <legend>A visitor</legend>
      <p>Let in a word the line does not write. It lands in the body you stand in.</p>
      <p class="inline"><label class="sr-only" for="visitor-word">The visitor's word</label><input type="text" id="visitor-word" value="pebble" maxlength="${PHYSICS_DATA.stage.visitorChars}" autocapitalize="off" autocomplete="off" spellcheck="false"></p>
      <p class="inline"><label class="check"><input type="radio" name="who" value="bare" checked> bare</label><label class="check"><input type="radio" name="who" value="marked"> marked</label><label class="sr-only" for="visitor-mark">The visitor's mark</label><select id="visitor-mark" disabled>${PHYSICS_DATA.laws.filter((law) => law.near).map((law) => `<option value="${escapeHtml(law.sigil)}">${escapeHtml(law.sigil)} ${escapeHtml(law.does)}</option>`).join("")}</select></p>
      <p class="says" id="visitor-says" role="status"></p>
      <button type="button" id="visitor-in">Let it in</button><button type="button" class="secondary" id="visitor-out" disabled>Take it out</button>
    </fieldset>
    <fieldset id="keep">
      <legend>Keep</legend>
      <p>Write the visitor into the line. This is the one act here that changes a byte, and Undo puts every byte back.</p>
      <p class="says" id="keep-says"></p>
      <button type="button" id="keep-write" disabled>Write it into the line</button><button type="button" class="secondary" id="keep-undo" disabled>Undo</button>
    </fieldset>
  </div>
  <fieldset class="share">
    <legend>What a body feels of the marked body around it</legend>
    <div class="choices">${SHARES.map(([name]) => `<label class="check"><input type="radio" name="share" value="${name}"${name === state.share ? " checked" : ""}> ${name}</label>`).join("")}</div>
    <p class="says" id="share-says"></p>
  </fieldset>
  <p class="own-line">The floor's own state, as a line <code id="floor-line"></code></p>
  <h3 class="axis">What happened</h3>
  <ol class="receipts" id="receipts" aria-live="polite" aria-label="What happened, newest first"></ol>
</section>
<section class="carry" aria-labelledby="carry-title">
  <h2 id="carry-title">Carry this line</h2>
  <p class="axis">The line goes with you as it reads now, kept words and all.</p>
  <ul class="ways">
    <li><a class="chip" data-carry="pivot" href="/pivot?line=${encodeURIComponent(reading.line)}">Turn one slot, in Pivot</a></li>
    ${build ? `<li><a class="chip" data-carry="build" href="${escapeHtml(build)}">Take it apart, in Build</a></li>` : ""}
    <li><a class="chip" data-carry="canvas" href="/canvas?line=${encodeURIComponent(reading.line)}">Open it on the canvas</a></li>
    <li><a class="chip" href="/constructs">Find its shape, in Constructs</a></li>
  </ul>
</section>` : `<section class="unread" role="status">
  <p class="line"><code>${escapeHtml(reading.line)}</code></p>
  <p>${escapeHtml(reading.says)}</p>
  <p><a href="/physics">Stand on the opening line instead</a></p>
</section>`;
  return `<div class="physics-page">
<header>
  <h1>A line at rest</h1>
  <p class="lede">One line of Spw, drawn as bodies inside bodies. Push a part and it comes home. Let a visitor in and the line stays as written. Keep the visitor, and the line says so.</p>
</header>
${floor}
<section class="rules" aria-labelledby="rules-title">
  <h2 id="rules-title">The rules tried here</h2>
  <ol>
    <li><strong>The line is kept. The picture is not.</strong> Every picture has a rest, and a push changes no reading.</li>
    <li><strong>A mark is its body's law.</strong> The mark in front of a word is felt by the parts inside that word's braces, and by no others. A body inside it feels a share.</li>
    <li><strong>Each body has its own clock.</strong> A touch warms the body it lands in and, by the share, the bodies inside it. Never the one beside it, and never the one around it.</li>
    <li><strong><code>key: value</code> is a joint.</strong> It has a rest length. The value moves with its key and comes back to that length.</li>
    <li><strong><code>@name</code> is a sight line.</strong> It shows how far away a thing is. It moves nothing.</li>
    <li><strong>Closed braces are neutral from outside.</strong> What happens inside a body is not felt beyond its brace.</li>
    <li><strong>A visitor joins the line only by an edit that writes it.</strong> A bare word moves a neighbour only by touching it. A marked word carries its mark: the parts near it feel that law, less with distance. Either way it is a visitor until it is kept.</li>
  </ol>
  <table class="laws">
    <caption class="sr-only">The marks that have a law on this floor</caption>
    <tbody>
      ${laws}
    </tbody>
  </table>
  <p class="axis">These are proposals from the workbench's <a href="${DEPICTION}">notebook on depiction</a>, made small enough to check by hand. The other marks have no law here yet. The canvas at factshift.center keeps physics of its own.</p>
</section>
<section class="bring" aria-labelledby="bring-title">
  <h2 id="bring-title">Bring a line</h2>
  <form method="get" action="/physics">
    <label for="bring-line">One line with a <code>{ }</code> body</label>
    <input type="text" id="bring-line" name="line" value="${escapeHtml(reading.line)}" maxlength="${PHYSICS_LIMIT}" autocapitalize="off" autocomplete="off" spellcheck="false">
    <input type="hidden" name="share" value="${escapeHtml(state.share)}">
    <button type="submit">Lay it out</button>
  </form>
  <ul>
    ${PHYSICS_LINES.map(({ line, says }) => `<li><a href="/physics?line=${encodeURIComponent(line)}">${KIT.paint(line, KIT.read(parse, line).tokens)}</a> <span>${escapeHtml(says)}</span></li>`).join("\n    ")}
  </ul>
</section>
</div>`;
}

/** The module script: the same kit, the page's parser, and the hand. */
function physicsScript(state) {
  const data = JSON.stringify(PHYSICS_DATA).replace(/</g, "\\u003c");
  const boot = JSON.stringify({ line: state.reading.line, share: state.share, defaultShare: SHARE_DEFAULT, opening: PHYSICS_DEFAULT, push: PHYSICS_DATA.feel.push }).replace(/</g, "\\u003c");
  return `<script type="module">
import { parse } from "/parser.js";
(${liveField.toString()})((${fieldKit.toString()})(${data}), parse, ${boot});
</script>`;
}

export function renderPhysics(state) {
  const page = layout({
    title: state.asked ? `spw.quest — at rest: ${state.reading.line.slice(0, 60)}` : "spw.quest — a line at rest",
    description: "One line of Spw drawn as bodies inside bodies. Push a part and it comes home; let a visitor in and the line stays as written; keep the visitor and the line says so.",
    canonical: "https://spw.quest/physics",
    head: QUEST_HEAD,
    themeCss: `${PAPER_CSS}
    ${PAGE_CSS}
    ${PHYSICS_CSS}`,
    body: `${masthead("/physics")}
${physicsBody(state)}
<p class="also"><a href="/pivot">Pivot a line</a> · <a href="/constructs">Constructs</a> · <a href="/bench/">The bench</a> · <a href="/build">Take one line apart</a> · <a href="/learn">Learn it a mark at a time</a></p>`,
  });
  return state.reading.ok ? page.replace(/<\/body>(?![\s\S]*<\/body>)/, `  ${physicsScript(state)}\n</body>`) : page;
}
