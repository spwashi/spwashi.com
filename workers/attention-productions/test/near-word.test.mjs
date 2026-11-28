// A neighbour's word, read as the nearest rung: the shared reader
// (workers/lib/near-word.js) and the two hosts that hold each other's words.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { editDistance, measureOf, nearWord, readNote } from "../../lib/near-word.js";
import { LADDERS, NEAR } from "../src/vocabulary.js";
import { SURFACE, promptOf, readShot, spwOf, textureHrefOf, textureReturnOf } from "../src/compose.js";
import { LADDERS as TEXTURE_LADDERS, NEAR as TEXTURE_NEAR } from "../../texture-website/src/vocabulary.js";
import { laddersFor } from "../../texture-website/assets/daily.js";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));

test("the reader goes exact, alias, measure, shared, prefix, slip, and leaves the rest unread", () => {
  const lens = ["24mm", "35mm", "50mm", "85mm", "macro"];
  const measures = { "24mm": 24, "35mm": 35, "50mm": 50, "85mm": 85 };
  assert.equal(nearWord("85mm", lens).how, "exact");
  assert.deepEqual(nearWord("100mm", lens, { aliases: { "100mm": "macro" }, measures }), { word: "macro", how: "alias", asked: "100mm" });
  assert.equal(nearWord("28mm", lens, { measures }).word, "24mm");
  assert.equal(nearWord("70mm", lens, { measures }).word, "85mm");
  assert.equal(nearWord("north_window", ["golden hour", "window light"]).word, "window light");
  assert.equal(nearWord("key-light", ["golden hour", "window light"]).how, "unread", "a ladder's kind word is not a rung");
  assert.equal(nearWord("candle", ["lamplight", "candlelight"]).how, "prefix");
  assert.equal(nearWord("moqette", ["moquette", "mosaic"]).word, "moquette");
  assert.equal(nearWord("moss", ["moquette"]).how, "unread", "four letters carry no slip");
  assert.equal(nearWord("", lens), null);
  assert.equal(measureOf("2.39:1"), 2.39);
  assert.equal(measureOf("16:9").toFixed(3), "1.778");
  assert.equal(editDistance("teh", "the"), 1);
  assert.equal(editDistance("abcdef", "uvwxyz", 2), 3);
  assert.equal(readNote([{ how: "exact" }]), "");
  assert.equal(readNote([{ how: "alias", asked: "raking_sun", word: "golden hour" }, { how: "unread", asked: "orbit", word: null }]), "read raking sun as golden hour · orbit: no rung");
});

test("every alias names a rung of its own ladder, on both hosts", () => {
  for (const [hostLadders, near] of [[{ ...LADDERS, ...SURFACE }, NEAR], [TEXTURE_LADDERS, TEXTURE_NEAR]]) {
    for (const [key, { aliases = {}, measures = {} }] of Object.entries(near)) {
      for (const [alias, word] of Object.entries(aliases)) assert.ok(hostLadders[key].includes(word), `${key}: ${alias} -> ${word}`);
      for (const word of Object.keys(measures)) assert.ok(hostLadders[key].includes(word), `${key}: measure ${word}`);
    }
  }
});

test("foreground reads low in the frame and background high: focus is depth", () => {
  const shot = readShot("/a-map", "?focus=near", "2026-11-27");
  assert.equal(shot.focus, "lower third");
  assert.equal(readShot("/a-map", "?focus=deep", "2026-11-27").focus, "upper third");
  assert.equal(readShot("/a-map", "?focus=background", "2026-11-27").focus, "upper third");
});

test("spwashi.com's theater links land on rungs, and say what had none", () => {
  const html = ["_partials/cms/home-issue.html", "_partials/cms/spw-experiments.html"].map((f) => readFileSync(`${ROOT}${f}`, "utf8")).join("\n");
  const links = [...html.matchAll(/https:\/\/attention\.productions(\/[^"?]*)\?([^"]+)"/g)].map(([, p, q]) => [p, q.replaceAll("&amp;", "&")]);
  assert.ok(links.length >= 5, "the theaters still link to attention.productions");
  for (const [p, q] of links) {
    const shot = readShot(p, `?${q}`, "2026-11-27");
    const params = new URLSearchParams(q);
    for (const key of Object.keys(LADDERS)) if (params.has(key)) assert.ok(LADDERS[key].includes(shot[key]), `${p} ${key}`);
    const unread = shot.read.filter((r) => r.how === "unread").map((r) => `${r.key}=${r.asked}`);
    // Words with no rung here: a camera move and a light source attention.productions does not draw.
    // Camera moves attention.productions does not draw, and a practical as a direction (a lamp inside the frame).
    // A light named by its direction (backlight) is read as from= unless the link says from itself.
    for (const word of unread) assert.ok(/^(move=(orbit|drift)|from=practical)$/.test(word), `${p}: ${word} should have a rung`);
  }
  const nib = readShot("/brass-nib-over-brace-lattice", "?shot=macro&lens=100mm&light=raking_sun&from=left&move=still&ratio=square&focus=near", "2026-11-27");
  assert.deepEqual([nib.shot, nib.lens, nib.light, nib.focus], ["extreme close-up", "macro", "raking dawn", "lower third"]);
});

test("texture.website and attention.productions read each other's words: scale is the shot's distance", () => {
  // texture.website -> attention.productions, in texture's words.
  const pairs = { macro: "extreme close-up", close: "close-up", "arm-s-length": "medium", room: "wide", far: "establishing" };
  for (const [scale, shot] of Object.entries(pairs)) assert.equal(readShot("/vellum", `?shot=${scale}`, "2026-11-27").shot, shot);
  assert.equal(readShot("/vellum", "?ratio=plate", "2026-11-27").ratio, "widescreen");
  // texture.website's five lights are attention's own words now.
  for (const light of TEXTURE_LADDERS.light) assert.equal(readShot("/vellum", `?light=${encodeURIComponent(light)}`, "2026-11-27").light, light);
  // attention.productions -> texture.website, in attention's words, and back to the same distance.
  const shot = { ...readShot("/vellum", "?shot=wide&light=golden-hour&ratio=scope", "2026-11-27"), material: { slug: "vellum" } };
  const href = new URL(textureHrefOf(shot));
  assert.equal(href.pathname, "/vellum");
  const reads = [];
  const ladders = laddersFor({ ladders: TEXTURE_LADDERS, near: TEXTURE_NEAR }, { day: "2026-11-27", roll: Number.NaN, query: href.searchParams, byDay: false, reads });
  assert.deepEqual([ladders.scale, ladders.light, ladders.format], ["room", "raking dawn", "plate"]);
  assert.deepEqual(reads.map((r) => r.how), ["alias", "alias", "alias"]);
  // Every rung of texture's scale goes there and comes back as itself.
  for (const scale of TEXTURE_LADDERS.scale) {
    const there = readShot("/vellum", `?shot=${encodeURIComponent(scale)}`, "2026-11-27").shot;
    const back = laddersFor({ ladders: TEXTURE_LADDERS, near: TEXTURE_NEAR }, { day: "2026-11-27", roll: Number.NaN, query: new URLSearchParams({ scale: there }), byDay: false });
    assert.equal(back.scale, scale, `${scale} -> ${there} -> ${back.scale}`);
  }
});

test("texture.website's surface (wear and process) arrives whole, writes the prompt and the Spw, and goes back", () => {
  const shot = readShot("/vellum", "?material=vellum&wear=weathered&process=riso&light=noon", "2026-11-27");
  assert.deepEqual([shot.material.slug, shot.wear, shot.process, shot.light], ["vellum", "weathered", "riso", "noon"]);
  const { plain } = promptOf(shot);
  assert.match(plain, /hard noon sun, short black shadows/);
  assert.match(plain, /weathered vellum surfaces, printed as a two-colour risograph/);
  assert.match(spwOf(shot), /\^surface\{ =wear\[weathered\] =process\[riso\] \}/);
  const back = new URL(textureHrefOf(shot));
  assert.equal(back.searchParams.get("wear"), "weathered");
  assert.equal(back.searchParams.get("process"), "riso");
  // Unnamed, the surface says nothing: no wear, no process, and the day never picks them.
  const plainShot = readShot("/vellum", "", "2026-11-27");
  assert.equal(plainShot.wear, null);
  assert.equal(plainShot.process, null);
  assert.doesNotMatch(spwOf(plainShot), /\^surface/);
  // A light named by its direction sets where it falls from, and yields to the address's own from=.
  const rim = readShot("/x", "?light=backlight", "2026-11-27");
  assert.equal(rim.from, "behind");
  assert.deepEqual(rim.read.map((r) => [r.key, r.word]), [["from", "behind"]]);
  assert.equal(readShot("/x", "?light=backlight&from=left", "2026-11-27").from, "left");
  assert.ok(readShot("/x", "?light=backlight&from=back", "2026-11-27").read.every((r) => r.how !== "unread"), "agreeing with the address's from is read, not left");
  // A neighbour's word for a surface reads as texture's own.
  assert.equal(readShot("/x", "?wear=distressed&process=risograph", "2026-11-27").wear, "weathered");
  assert.equal(readShot("/x", "?process=risograph", "2026-11-27").process, "riso");
});

test("the lamp crosses: attention.productions' from= words are texture.website's light directions, and the way back carries them", async () => {
  const { LIGHT_FROM } = await import("../../texture-website/src/vocabulary.js");
  assert.deepEqual(Object.keys(LIGHT_FROM).sort(), [...LADDERS.from].sort(), "the same five words on both sites");
  for (const [word, lamp] of Object.entries(LIGHT_FROM)) assert.ok(Number.isFinite(lamp.az) && lamp.says, word);
  const shot = { ...readShot("/vellum", "?material=vellum&light=raking-dawn&from=left&via=texture.website", "2026-11-27"), material: { slug: "vellum" } };
  assert.equal(shot.read.length, 0, "via= is not a word to read");
  const back = new URL(textureHrefOf(shot));
  assert.equal(back.searchParams.get("from"), "left");
  assert.equal(back.searchParams.get("light"), "raking-dawn");
});

test("the way back to texture.website keeps what attention.productions does not hold", () => {
  const shot = { ...readShot("/vellum", "?material=vellum&light=noon&from=left&shot=wide", "2026-11-27"), material: { slug: "vellum", word: "vellum" } };
  const back = new URL(textureReturnOf(shot, "/vellum/~moss?palette=lamplight&lens=lunar-laundromat&light=overcast"));
  assert.equal(back.pathname, "/vellum/~moss", "the reader's layers stand");
  assert.equal(back.searchParams.get("palette"), "lamplight");
  assert.equal(back.searchParams.get("lens"), "lunar-laundromat");
  assert.equal(back.searchParams.get("light"), "noon", "what was tuned here is written over");
  assert.equal(back.searchParams.get("from"), "left");
  // A surface chosen here leads; a back= that is not a path is ignored.
  assert.equal(new URL(textureReturnOf({ ...shot, material: { slug: "moss" } }, "/vellum/~moss")).pathname, "/moss");
  assert.equal(textureReturnOf(shot, "https://elsewhere.example/x"), textureHrefOf(shot));
  assert.equal(textureReturnOf(shot, "//elsewhere.example/x"), textureHrefOf(shot));
});
