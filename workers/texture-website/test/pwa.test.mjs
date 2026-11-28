// texture.website as an installed app: the manifest's shortcuts and share
// target, a maskable mark whose band survives any launcher's mask, and a
// service worker that keeps pictures apart from the shell and never keeps a
// picture opened in a tab as the page.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";
import { iconPng } from "../carry.mjs";
import { VIEWS } from "../src/vocabulary.js";

const assets = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "assets");
const read = (name) => readFileSync(path.join(assets, name), "utf8");

/** RGBA rows of an 8-bit RGBA PNG with filter 0 on every row, as iconPng writes it. */
function pixels(png) {
  const size = png.readUInt32BE(16);
  const chunks = [];
  for (let at = 8; at < png.length;) {
    const length = png.readUInt32BE(at);
    if (png.toString("ascii", at + 4, at + 8) === "IDAT") chunks.push(png.subarray(at + 8, at + 8 + length));
    at += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(chunks));
  return { size, at: (x, y) => [...raw.subarray(y * (size * 4 + 1) + 1 + x * 4, y * (size * 4 + 1) + 1 + x * 4 + 3)] };
}

test("the manifest installs with a maskable mark, shortcuts to the day, the catalog and each view, and a share target", () => {
  const manifest = JSON.parse(read("manifest.webmanifest"));
  assert.ok(manifest.icons.some((icon) => icon.src === "/icon-maskable-512.png" && icon.purpose === "maskable" && icon.sizes === "512x512"));
  assert.deepEqual(manifest.shortcuts.map((s) => s.url), ["/", "/catalog", ...Object.keys(VIEWS).map((key) => `/${key}@/`)]);
  for (const shortcut of manifest.shortcuts) assert.ok(shortcut.name && shortcut.short_name.length <= 16 && shortcut.icons?.length, shortcut.url);
  assert.deepEqual(manifest.share_target, { action: "/share", method: "GET", enctype: "application/x-www-form-urlencoded", params: { title: "title", text: "text", url: "url" } });
  assert.ok(read("texture.js").includes('url.pathname === "/share"'), "the page reads what was shared");
  // With default-src 'none', a policy that does not name the manifest blocks it, and the page never installs.
  const policy = read("_headers").match(/Content-Security-Policy: (.+)/)[1];
  assert.match(policy, /manifest-src 'self'/);
  assert.match(policy, /worker-src 'self'/);
});

test("the maskable mark keeps its band inside the middle circle and its weave to every edge", () => {
  const icon = iconPng(512, { maskable: true });
  assert.ok(icon.equals(readFileSync(path.join(assets, "icon-maskable-512.png"))));
  const { size, at } = pixels(icon);
  const red = [0xc8, 0x40, 0x2a];
  let painted = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const [r, g, b] = at(x, y);
      if (r !== red[0] || g !== red[1] || b !== red[2]) continue;
      painted += 1;
      assert.ok(Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) < size * 0.4, `band pixel ${x},${y} is inside the safe zone`);
    }
  }
  assert.ok(painted > 0, "the band is drawn");
  // No dark frame: a mask never cuts a border into arcs.
  for (const [x, y] of [[0, 0], [size - 1, 0], [0, size - 1], [5, size / 3]]) assert.notDeepEqual(at(x, y), [0x1d, 0x1d, 0x1b], `${x},${y}`);
  // Both plain sizes carry the same proportional weave and band.
  assert.ok(iconPng(192).equals(readFileSync(path.join(assets, "icon-192.png"))));
  assert.ok(iconPng(512).equals(readFileSync(path.join(assets, "icon-512.png"))));
  for (const dimension of [192, 512]) {
    const mark = pixels(iconPng(dimension));
    assert.notDeepEqual(mark.at(dimension / 8, dimension / 8), mark.at(dimension / 8, dimension * 3 / 8));
    assert.deepEqual(mark.at(dimension / 8, dimension * 7 / 8), red);
  }
});

test("the service worker keeps pictures by their hashes, keeps only a page as the shell, and fills the catalog on request", () => {
  const sw = read("sw.js");
  const pictures = createHash("sha256").update(readFileSync(path.join(assets, "images.json"))).digest("hex").slice(0, 12);
  assert.ok(sw.includes(`const PICTURES = "texture-pictures-${pictures}";`), "the picture cache is named for images.json");
  assert.match(sw, /key !== CACHE && key !== PICTURES/, "a new shell does not drop the kept pictures");
  assert.match(sw, /content-type"\) \?\? ""\)\.includes\("text\/html"\)/, "a picture or reading opened in a tab is not kept as /");
  assert.match(sw, /navigationPreload\?\.enable\(\)/);
  assert.match(sw, /event\.preloadResponse/);
  assert.match(sw, /type === "keep-pictures"/);
  assert.ok(sw.includes('"/icon-maskable-512.png"'));
  assert.ok(read("index.html").includes('class="catalog-kept"'), "the catalog has a place to say what is kept");
});
