#!/usr/bin/env node
/**
 * The walking half of sleep: reads the tree, runs the read-only probes through
 * wonder.mjs, and writes under .spw/gen/ only, which git ignores. It edits no
 * source and takes no stills. What it compares is scripts/lib/sleep-cycle.mjs.
 *
 *   npm run sense -- sleep          compare with last night, write the note
 *   npm run sense -- sleep --dry    print the note, keep nothing
 *   npm run sense -- wake           print the last note; nothing runs
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, appendFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { diffProbes, isOpen, measure, paid, renderWake, replay, retireCandidates, runKeys, seeded, staleStills } from './lib/sleep-cycle.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '.spw/gen/sleep');
const WAKE = path.join(OUT, 'wake.spw');
const STATE = path.join(OUT, 'state.json');
const CAPTURES = path.join(ROOT, 'design/components/captures/runs');
const DAY = 86_400_000;

const git = (...args) => {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
};

function wonderJson(args) {
  const result = spawnSync(process.execPath, ['scripts/wonder.mjs', ...args, '--json'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 });
  if (result.status !== 0) throw new Error(`wonder ${args.join(' ')} exited ${result.status}: ${result.stderr.slice(-400)}`);
  return JSON.parse(result.stdout);
}

/** The newest still of each recipe id, at any viewport, read from the capture tree's names (NN-<id>.jpg). */
function indexCaptures() {
  const newest = new Map();
  if (!existsSync(CAPTURES)) return newest;
  const visit = (dir, at) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const time = entry.name.match(/^(\d{2})-(\d{2})-(\d{2})--/);
        const date = entry.name.match(/^\d{4}-\d{2}-\d{2}$/);
        visit(full, date ? Date.parse(`${entry.name}T00:00:00`) : time && at != null ? at + ((+time[1] * 60 + +time[2]) * 60 + +time[3]) * 1000 : at);
      } else if (at != null && /\.(?:jpe?g|png)$/.test(entry.name) && path.basename(path.dirname(dir)) === 'captures') {
        const id = entry.name.replace(/^\d+-/, '').replace(/\.\w+$/, '');
        if (!newest.has(id) || newest.get(id).at < at) newest.set(id, { at, file: path.relative(ROOT, full) });
      }
    }
  };
  visit(CAPTURES, null);
  return newest;
}

const routeFile = (route) => `${String(route).split(/[?#]/)[0].replace(/^\//, '')}index.html`;

/** Every one-slot turn of a route line that lands on a line another route holds, each pair once. */
async function babbleEdges() {
  const { SPECIMENS } = await import('../workers/spw-quest/src/specimens.js');
  const { pivotsOf } = await import('../workers/spw-quest/src/pivot.js');
  const flat = (value) => String(value || '').replace(/\s+/g, '');
  const lines = SPECIMENS.filter((specimen) => !specimen.reading.file);
  const byLine = new Map(lines.map((specimen) => [flat(specimen.line), specimen]));
  const edges = new Map();
  for (const specimen of lines.filter((item) => item.source === 'routes')) {
    for (const pivot of pivotsOf(specimen.line)) {
      // Splitting a compound keeps half a line; it is not a turn of one slot.
      if (pivot.kind === 'split') continue;
      const there = byLine.get(flat(pivot.line));
      if (!there || there.source !== 'routes' || there.route === specimen.route) continue;
      const key = [flat(specimen.line), flat(there.line)].sort().join(' ~ ');
      if (!edges.has(key)) edges.set(key, { key, from: specimen.line, fromRoute: specimen.route, to: there.line, toRoute: there.route });
    }
  }
  return [...edges.values()];
}

/** Lines an authored door already carries, so babble offers only what no door says. */
function dooredLines() {
  const doored = new Set();
  for (const file of git('ls-files', '*index.html').split('\n')) {
    if (!file || file.startsWith('workers/')) continue;
    for (const [, raw] of readFileSync(path.join(ROOT, file), 'utf8').matchAll(/href="https:\/\/(?:spw\.quest\/pivot\?line=|factshift\.center\/\?spw=)([^"&#]+)/g)) {
      doored.add(decodeURIComponent(raw).replace(/\s+/g, ''));
    }
  }
  return doored;
}

function wake() {
  if (!existsSync(WAKE)) {
    process.stdout.write('[wake] no note yet. npm run sense -- sleep writes one.\n');
    return;
  }
  process.stdout.write(readFileSync(WAKE, 'utf8'));
}

async function sleep({ dry }) {
  const { wonderKey } = await import('./wonder.mjs');
  const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : null;
  const wonders = wonderJson([]).wonders.map((wonder) => ({ ...wonder, key: wonderKey(wonder) }));
  const { stamp, revision, runs } = wonderJson(['--run', ...(dry ? [] : ['--write'])]);
  const byId = new Map(wonders.map((wonder) => [wonder.id, wonder]));

  // A first night has nothing to compare with: old receipts keep only a tail of each output, in thread order.
  const { moved, steady, fresh } = diffProbes(state?.probes ?? {}, runs);
  for (const item of moved) item.expect = byId.get(item.wonder)?.expect ?? '';

  const since = state?.revision ?? '';
  // The day since last night; a first night has none, so it replays one day.
  const range = since && git('rev-parse', '--verify', `${since}^{commit}`) ? [`${since}..HEAD`] : ['--since=1.day'];
  // A session can end uncommitted, so the working tree counts as part of the day.
  const added = git('diff', 'HEAD', '--unified=0').split('\n').filter((line) => line.startsWith('+') && !line.startsWith('+++')).join('\n').slice(0, 200_000);
  const touchedText = `${git('log', ...range, '--format=%s%n%b', '-n', '400')}\n${added}`;
  const touchedFiles = [...git('log', ...range, '--name-only', '--format=', '-n', '400').split('\n'), ...git('diff', 'HEAD', '--name-only').split('\n')].filter(Boolean);

  const now = Date.now();
  const ages = new Map();
  const ageOf = (file) => {
    if (!ages.has(file)) {
      const at = Number(git('log', '-1', '--format=%ct', '--', file));
      ages.set(file, at ? Math.floor((now - at * 1000) / DAY) : null);
    }
    return ages.get(file);
  };

  const seed = stamp.slice(0, 10);
  const { listSenseFixtures } = await import('./harness-sense.mjs');
  const recipes = listSenseFixtures();
  const captures = indexCaptures();
  const routeAt = new Map();
  const lastOffered = new Set(state?.offered ?? []);
  const lastStills = new Set(state?.stills ?? []);
  const stills = staleStills(recipes, (id) => captures.get(id), (route) => {
    const file = routeFile(route);
    if (!routeAt.has(file)) routeAt.set(file, (Number(git('log', '-1', '--format=%ct', '--', file)) * 1000) || null);
    return routeAt.get(file);
  });
  stills.look = seeded(stills.current, seed, 1, (still) => still.id)[0]?.file ?? '';
  // What the last note named waits a turn, so a night does not repeat itself until someone acts.
  const staleCount = stills.stale.length;
  const unseen = stills.stale.filter((still) => !lastStills.has(still.id));
  stills.stale = unseen.length ? unseen : stills.stale;
  stills.staleCount = staleCount;
  const needsStill = wonders.filter((wonder) => isOpen(wonder) && /\b(?:screenshot|stills?|capture|390\s?px|headless)\b/i.test(wonder.probes.join(' ')));
  const stillProbes = seeded(needsStill, seed, 1, (wonder) => wonder.key).map((wonder) => ({
    wonder,
    ink: recipes.find((recipe) => wonder.probes.join(' ').includes(recipe.id))?.id ?? '',
  }));

  const replayed = replay(wonders, touchedText, touchedFiles);
  const retire = retireCandidates(wonders.filter((wonder) => !lastOffered.has(wonder.key)), ageOf);

  const edges = await babbleEdges();
  const doored = dooredLines();
  const flat = (value) => String(value).replace(/\s+/g, '');
  const undoored = edges.filter((edge) => !doored.has(flat(edge.from)) && !doored.has(flat(edge.to)));
  const known = new Set(state?.edges ?? []);
  const freshEdges = state ? undoored.filter((edge) => !known.has(edge.key)) : [];
  const picks = [...seeded(freshEdges, seed, 2, (edge) => edge.key)];
  for (const edge of seeded(undoored, seed, 2, (item) => item.key)) if (picks.length < 2 && !picks.includes(edge)) picks.push(edge);

  const openNow = wonders.filter(isOpen);
  const counts = { open: openNow.length, answered: wonders.filter((w) => w.lifecycle === 'answered').length, retired: wonders.filter((w) => w.lifecycle === 'retired').length };
  const stages = `${wonders.filter((w) => w.lifecycle === 'open').length} open, ${wonders.filter((w) => w.lifecycle === 'probed').length} probed`;
  const tally = measure(state, counts);
  const previousKeys = new Set(state?.questions ?? []);
  const nowKeys = new Set(wonders.map((w) => w.key));
  const opened = state ? wonders.filter((w) => !previousKeys.has(w.key)) : [];
  const settled = state ? [...previousKeys].filter((key) => !nowKeys.has(key)) : [];
  const lastPaid = state ? paid(state.offered, wonders, state.probed) : null;

  const note = renderWake({
    stamp, revision, since, tally, stages, lastPaid, opened, settled, moved, steady, fresh, replayed, stills, stillProbes, retire, seed,
    babble: { total: edges.length, fresh: freshEdges.length, undoored: undoored.length, picks },
    capture: `npm run sense -- wander ${seed} --run`,
  });

  if (dry) {
    process.stdout.write(note);
    return;
  }
  const offered = [...new Set([...moved.map((item) => byId.get(item.wonder)?.key), ...replayed.map(({ wonder }) => wonder.key), ...retire.map(({ wonder }) => wonder.key), ...stillProbes.map(({ wonder }) => wonder.key)].filter(Boolean))];
  const keys = runKeys(runs);
  mkdirSync(OUT, { recursive: true });
  writeFileSync(WAKE, note);
  writeFileSync(path.join(OUT, `${seed}.spw`), note);
  writeFileSync(STATE, `${JSON.stringify({
    stamp, revision, ...counts,
    questions: wonders.map((w) => w.key),
    probes: Object.fromEntries(runs.map((run, index) => [keys[index], { digest: run.digest, observation: run.observation }])),
    probed: Object.fromEntries(wonders.filter((w) => w.probed).map((w) => [w.key, w.probed])),
    edges: undoored.map((edge) => edge.key),
    offered,
    stills: stills.stale.slice(0, 2).map((still) => still.id),
  }, null, 1)}\n`);
  appendFileSync(path.join(OUT, 'history.jsonl'), `${JSON.stringify({ stamp, revision, ...counts, verdict: tally.verdict, moved: moved.length, steady, offered: offered.length, paid: lastPaid })}\n`);
  process.stdout.write(`[sleep] ${tally.verdict}: ${counts.open} not closed (${stages}), ${counts.answered} answered, ${counts.retired} retired · ${moved.length} moved, ${steady} held · ${stills.staleCount} stale stills · ${undoored.length} edges with no door\n`);
  process.stdout.write(`[sleep] npm run sense -- wake   (${path.relative(ROOT, WAKE)})\n`);
}

const args = process.argv.slice(2);
if (args.includes('--wake')) wake();
else await sleep({ dry: args.includes('--dry') });
