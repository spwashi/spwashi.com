#!/usr/bin/env node
// Bitmap exports are source assets. Keep the familiar npm commands as an
// offline check so an old rasterizer cannot overwrite the installed mark.
import { readFile } from 'node:fs/promises';
import { assertIconPng } from '../workers/lib/png.js';

for (const [name, size] of [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-maskable-512.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  const file = new URL(`../public/images/${name}`, import.meta.url);
  assertIconPng(await readFile(file), size, name);
}
console.log('[icons] four bitmap app icon exports verified');
