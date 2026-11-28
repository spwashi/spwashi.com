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
import { assertIconPng } from "../../lib/png.js";
import { VIEWS } from "../src/vocabulary.js";

const assets = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "assets");
const read = (name) => readFileSync(path.join(assets, name), "utf8");

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

test("the maskable bitmap fills a 512px square without transparency", () => {
  assertIconPng(readFileSync(path.join(assets, "icon-maskable-512.png")), 512, "maskable mark");
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
