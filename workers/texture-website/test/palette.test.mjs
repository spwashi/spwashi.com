// texture.website's palettes: the inks a picture is printed in. The stage maps
// luminance across each palette's stops (a gradient map), so the stops run
// from shadow to highlight; the borrowed ones stay their sources' colours.
import test from "node:test";
import assert from "node:assert/strict";
import { LADDERS, PALETTES, PHRASES } from "../src/vocabulary.js";
import { DEFAULTS } from "../assets/daily.js";
import { GROUND, SEEDS } from "../../tealstripesvibes/src/vibe.js";
import { SHAPES } from "../../attention-productions/src/vocabulary.js";

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

test("each palette is a ladder word with stops from shadow to highlight and a phrase for the prompt", () => {
  assert.equal(LADDERS.palette[0], "as drawn");
  assert.equal(DEFAULTS.palette, "as drawn", "unnamed, the picture keeps each material's own colour");
  assert.equal(PHRASES.palette["as drawn"], "", "as drawn adds nothing to the prompt");
  for (const word of LADDERS.palette.slice(1)) {
    const stops = PALETTES[word];
    assert.ok(stops?.length >= 2, `${word} has stops`);
    for (const hex of stops) assert.match(hex, /^#[0-9a-f]{6}$/, `${word}: ${hex}`);
    for (let i = 1; i < stops.length; i += 1) assert.ok(luminance(stops[i]) > luminance(stops[i - 1]), `${word}: stop ${i} is lighter than the one before`);
    assert.ok(PHRASES.palette[word], `${word} is named in the prompt`);
  }
  assert.deepEqual(Object.keys(PALETTES).sort(), LADDERS.palette.slice(1).sort(), "no palette outside the ladder");
});

test("the borrowed palettes are their sources' colours", () => {
  assert.deepEqual(PALETTES["teal stripes"], GROUND.palette, "Teal Stripes Vibes' ground");
  assert.deepEqual(PALETTES.lantern, SEEDS.lantern.palette, "Teal Stripes Vibes' lantern seed");
  for (const light of ["lamplight", "sodium night"]) {
    assert.deepEqual(PALETTES[light].slice(0, 2), [SHAPES.light[light].fill, SHAPES.light[light].key], `attention.productions' ${light}, fill to key`);
  }
});
