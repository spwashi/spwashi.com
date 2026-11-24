// The empty path is a day's picture: two classes, and a look that moves.
import test from "node:test";
import assert from "node:assert/strict";
import { LADDERS, MATERIALS } from "../src/vocabulary.js";
import { DAY_KEYS, DAY_MARKS, DEFAULTS, daily, dayNumber, isoOf, laddersFor } from "../assets/daily.js";

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
