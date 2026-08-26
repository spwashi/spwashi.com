/**
 * Capture run identity and profiles.
 *
 * Folder names put the readable parts first:
 *   runs/2026-08-25/survey/18-56-58--a1b2c3/pocket--dark-mode/
 * Day clusters parallel agents. Profile is a word. Clock + short hash
 * keeps two agents from clobbering the same folder. Viewport folders
 * stay image-only for arrow-key preview.
 */

import { createHash } from 'node:crypto';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const DEFAULT_WALK_ROUTES = Object.freeze([
  '/',
  '/about/',
  '/topics/',
  '/play/',
  '/settings/',
]);

export const CAPTURE_PROFILES = Object.freeze({
  ambient: Object.freeze({
    id: 'ambient',
    label: 'named stills',
    stills: true,
    checks: false,
    walk: false,
    viewports: Object.freeze(['pocket']),
    description: 'Named home stills. One subject per frame.',
  }),
  walk: Object.freeze({
    id: 'walk',
    label: 'page walk',
    stills: false,
    checks: false,
    walk: true,
    viewports: Object.freeze(['pocket']),
    routes: DEFAULT_WALK_ROUTES,
    maxSlices: 8,
    description: 'Viewport-tall slices to the bottom of core routes.',
  }),
  checks: Object.freeze({
    id: 'checks',
    label: 'env and theme checks',
    stills: true,
    checks: true,
    walk: false,
    viewports: Object.freeze(['pocket']),
    description: 'Deep-link pin, explicit dark, reduced motion.',
  }),
  survey: Object.freeze({
    id: 'survey',
    label: 'survey',
    stills: true,
    checks: true,
    walk: true,
    viewports: Object.freeze(['pocket']),
    routes: DEFAULT_WALK_ROUTES,
    maxSlices: 8,
    description: 'Named stills, checks, and page walks on core routes.',
  }),
});

export function readableSlug(value, fallback = 'ad-hoc') {
  return String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || fallback;
}

export function formatDay(when = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}`;
}

export function formatClock(when = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(when.getHours())}-${pad(when.getMinutes())}-${pad(when.getSeconds())}`;
}

export function shortRunHash(params, nonce) {
  return createHash('sha256')
    .update(JSON.stringify({ params, nonce }))
    .digest('hex')
    .slice(0, 6);
}

/**
 * Readable run folder: clock first inside the profile so a day's survey
 * folder lists in time order, with a short hash for parallel agents.
 */
export function formatCaptureRunId({ params = {}, when = new Date(), nonce = `${process.pid}` } = {}) {
  return `${formatClock(when)}--${shortRunHash(params, nonce)}`;
}

export function captureRunLayout(packRoot, {
  profile = 'ambient',
  params = {},
  when = new Date(),
  nonce = `${process.pid}-${Math.random().toString(36).slice(2, 6)}`,
} = {}) {
  const day = formatDay(when);
  const profileSlug = readableSlug(profile);
  const runId = formatCaptureRunId({ params, when, nonce });
  const rel = path.join('runs', day, profileSlug, runId);
  return {
    day,
    profile: profileSlug,
    runId,
    rel,
    dir: path.join(packRoot, rel),
  };
}

export function resolveCaptureProfile(name) {
  if (!name) return null;
  return CAPTURE_PROFILES[readableSlug(name)] || null;
}

export function applyCaptureProfile(options, profile) {
  if (!profile) return options;
  const next = { ...options, profile: profile.id };
  if (profile.stills) next.stills = true;
  if (profile.checks) next.checks = true;
  if (profile.walk) next.walk = true;
  if (profile.routes) next.walkRoutes = [...profile.routes];
  if (profile.maxSlices) next.maxSlices = profile.maxSlices;
  if (profile.viewports && !options.viewports) next.viewports = [...profile.viewports];
  return next;
}

export function walkFileName(route, scrollY, ext = 'jpg') {
  const slug = String(route || '/')
    .split('#')[0]
    .replace(/^\/|\/$/g, '')
    .replaceAll('/', '--') || 'home';
  const y = String(Math.max(0, Math.round(Number(scrollY) || 0))).padStart(5, '0');
  return `${slug}--${y}.${ext}`;
}

export async function writeRunPointer(packRoot, layout, extra = {}) {
  const pointer = {
    day: layout.day,
    profile: layout.profile,
    runId: layout.runId,
    path: layout.rel,
    ...extra,
  };
  await mkdir(path.join(packRoot, 'runs'), { recursive: true });
  await mkdir(path.join(packRoot, 'runs', layout.day), { recursive: true });
  await writeFile(
    path.join(packRoot, 'runs', 'latest.json'),
    `${JSON.stringify(pointer, null, 2)}\n`,
  );
  await writeFile(
    path.join(packRoot, 'runs', layout.day, 'latest.json'),
    `${JSON.stringify(pointer, null, 2)}\n`,
  );
  return pointer;
}

export async function writeRunsIndex(packRoot) {
  const root = path.join(packRoot, 'runs');
  let days = [];
  try {
    days = (await readdir(root, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(entry.name))
      .map((entry) => entry.name)
      .sort()
      .reverse();
  } catch {
    days = [];
  }

  const sections = [];
  for (const day of days) {
    let profiles = [];
    try {
      profiles = (await readdir(path.join(root, day), { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
    } catch {
      profiles = [];
    }
    const blocks = [];
    for (const profile of profiles) {
      let runs = [];
      try {
        runs = (await readdir(path.join(root, day, profile), { withFileTypes: true }))
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name)
          .sort()
          .reverse();
      } catch {
        runs = [];
      }
      const links = runs.map((runId) => (
        `<li><a href="./${day}/${profile}/${runId}/index.html"><code>${profile}</code> · ${runId}</a></li>`
      )).join('\n');
      blocks.push(`<h3>${profile}</h3><ul>${links || '<li>Empty.</li>'}</ul>`);
    }
    sections.push(`<section><h2>${day}</h2>${blocks.join('\n')}</section>`);
  }

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>Capture runs</title>
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 1.5rem; background: #f7f4ee; color: #1a1a1a; }
  h1 { font-size: 1.2rem; } h2 { font-size: 1rem; margin-top: 1.5rem; } h3 { font-size: 0.9rem; }
  ul { padding-left: 1.2rem; } a { color: #176; } code { font-size: 0.86em; }
</style></head>
<body>
  <h1>Capture runs</h1>
  <p>Day → profile → clock--hash. Viewport folders inside a run are image-only.</p>
  ${sections.join('\n') || '<p>No runs yet.</p>'}
</body></html>
`;
  await mkdir(root, { recursive: true });
  await writeFile(path.join(root, 'index.html'), html);
}
