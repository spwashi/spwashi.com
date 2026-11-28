// The empty path is a day's picture: two classes, and a look that moves.
import test from "node:test";
import assert from "node:assert/strict";
import { LADDERS, MATERIALS } from "../src/vocabulary.js";
import { DAY_KEYS, DAY_MARKS, DAY_RUNGS, DEFAULTS, daily, dayNumber, isoOf, laddersFor, lineOf } from "../assets/daily.js";

const vocab = { materials: MATERIALS, ladders: LADDERS };
const look = (iso, query = "", byDay = true) => laddersFor(vocab, {
  day: iso,
  roll: Number.NaN,
  query: new URLSearchParams(query),
  byDay,
});

test("a day is the same pair twice, from two classes, met by a mark that reads in a sentence", () => {
  const day = dayNumber("2026-11-23");
  const pair = daily(vocab, day);
  assert.deepEqual(daily(vocab, day), pair);
  assert.equal(pair.length, 2);
  assert.notEqual(pair[0].material.cls, pair[1].material.cls);
  assert.equal(pair[0].mark, "");
  assert.ok(DAY_MARKS.includes(pair[1].mark));
  let walked = 0;
  for (let n = dayNumber("2026-11-01"); n < dayNumber("2026-12-01"); n += 1) {
    if (daily(vocab, n)[0].material.slug === MATERIALS[n % MATERIALS.length].slug) walked += 1;
  }
  assert.ok(walked < 8, "a month of mornings is not the catalog in order");
});

test("a cycle of mornings visits every material once, and tomorrow is not today's look", () => {
  const start = dayNumber("2026-01-01");
  const firsts = new Set();
  const seen = Object.fromEntries(DAY_KEYS.map((key) => [key, new Set()]));
  for (let n = start; n < start + MATERIALS.length; n += 1) {
    const pair = daily(vocab, n);
    const next = daily(vocab, n + 1);
    firsts.add(pair[0].material.slug);
    assert.notEqual(pair[0].material.slug, pair[1].material.slug);
    assert.notEqual(pair[0].material.slug, next[0].material.slug);
    assert.notEqual(pair[1].material.slug, next[1].material.slug);
    const row = look(isoOf(n));
    const after = look(isoOf(n + 1));
    for (const key of DAY_KEYS) {
      seen[key].add(row[key]);
      assert.notEqual(row[key], after[key], `${key} repeats on ${isoOf(n)}`);
    }
  }
  assert.equal(firsts.size, MATERIALS.length);
  for (const key of DAY_KEYS) assert.equal(seen[key].size, (DAY_RUNGS[key] ?? LADDERS[key]).length, key);
  // A morning never opens on a room, a ruin, a night or a sky: those stay one tap away.
  for (const [key, word] of [["scale", "far"], ["wear", "ruined"], ["light", "sodium night"], ["scene", "sky"]]) assert.ok(!seen[key].has(word), `${key} opens on ${word}`);
});

test("an empty path takes its look from the date, and a query word wins", () => {
  const lights = new Set();
  let leftDefaults = 0;
  for (let n = dayNumber("2026-11-16"); n < dayNumber("2026-11-30"); n += 1) {
    const row = look(isoOf(n));
    lights.add(row.light);
    if (DAY_KEYS.some((key) => row[key] !== DEFAULTS[key])) leftDefaults += 1;
  }
  assert.ok(lights.size > 1, "two weeks of mornings are not the same light");
  assert.ok(leftDefaults > 10, "the day's look leaves the standing defaults");
  assert.equal(look("2026-11-23", "light=sodium-night").light, "sodium night");
  assert.equal(look("2026-11-23", "", false).light, DEFAULTS.light);
  assert.equal(look("2026-11-23", "", false).lens, "none");
});

test("the line keeps scale in the mode, then the other material, the scene and the format", () => {
  const pair = daily(vocab, dayNumber("2026-11-23"));
  const ladders = look("2026-11-23");
  const line = lineOf({ layers: pair, ladders, view: "" });
  assert.match(line, /^[a-z0-9-]+\[[a-z0-9-]+, [a-z0-9-]+, [a-z0-9-]+, [a-z0-9-]+\]\{[~*^@=][a-z0-9-]+}\([a-z0-9-]+\)<[a-z0-9-]+>$/);
  assert.ok(line.startsWith(`${pair[0].material.slug}[`));
  assert.ok(line.includes(pair[1].material.slug));
  const viewed = lineOf({ layers: pair, ladders, view: "minimalist" });
  assert.ok(viewed.startsWith("minimalist@ "));
});
