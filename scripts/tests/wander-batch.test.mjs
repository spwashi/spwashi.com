import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { SETTINGS_TO_QUERY } from '../../public/js/kernel/settings-query-parity.js';
import { SETTING_OPTIONS, THEME_PACK_OPTIONS } from '../../public/js/kernel/site-settings-profiles.js';
import { CAPTURE_PROFILES, applyCaptureProfile } from '../lib/capture-profiles.mjs';
import { VIEWPORT_STILL_WANDERS, getViewportStillRecipe } from '../lib/viewport-still-recipes.mjs';
import {
  CAPTURE_SETTING_QUERY,
  WANDER_AXES,
  WANDER_MAX_AXES,
  WANDER_RECEIPT_SCHEMA,
  WANDER_SCRIPT_FREE_AXES,
  WANDER_THEME_PACKS,
  buildCapturePlan,
  buildWanderJobs,
  captureSearchParams,
  conditionClusterKey,
  formatWanderReceipt,
  loadWanderSpell,
  readWanderSpell,
  isImageRecipe,
  nightlyStillState,
  parseSpwCaptureTokens,
  wanderBatch,
  wanderCaptureCommand,
  wanderRecipePool,
  wanderScriptEligible,
  wanderSeedFor,
} from '../lib/visual-capture-plan.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SEEDS = ['2026-09-29', '2026-09-30', 'moss', 'sunday moss', 'π', '0', 'wap', 'banked'];

test('same seed, same batch; a different seed wanders elsewhere', () => {
  const a = wanderBatch({ seed: '2026-09-29' });
  const b = wanderBatch({ seed: '2026-09-29' });
  assert.deepEqual(a, b);
  assert.equal(a.schema, WANDER_RECEIPT_SCHEMA);
  assert.equal(a.seed, '2026-09-29');
  const c = wanderBatch({ seed: '2026-09-30' });
  assert.notDeepEqual(a.jobs, c.jobs);
  assert.equal(wanderSeedFor(new Date('2026-09-29T23:30:00Z')), '2026-09-29');
  assert.match(wanderBatch().seed, /^\d{4}-\d{2}-\d{2}$/);
});

test('n is respected and ids stay distinct', () => {
  for (const n of [1, 3, 6, 9]) {
    const receipt = wanderBatch({ seed: 'moss', n });
    assert.equal(receipt.jobs.length, n);
    assert.equal(new Set(receipt.ids).size, n);
  }
  assert.equal(wanderBatch({ seed: 'moss', n: 9999 }).jobs.length, wanderRecipePool().length);
});

test('each job draws one or two odd axes, with real values, and reads as one sentence', () => {
  for (const seed of SEEDS) {
    const receipt = wanderBatch({ seed });
    for (const job of receipt.jobs) {
      assert.ok(job.axes.length >= 1 && job.axes.length <= WANDER_MAX_AXES, `${seed} ${job.id}`);
      for (const axis of job.axes) {
        assert.ok(WANDER_AXES[axis].values.includes(job.conditions[axis]));
        assert.equal(getViewportStillRecipe(job.id)?.conditions?.[axis], undefined, 'drawn axes never overwrite the recipe');
      }
      assert.ok(['pocket', 'phablet', 'fold', 'broadsheet'].includes(job.viewport));
      assert.match(job.reading, /^[^\n]+\.$/);
      assert.equal(job.reading.includes(getViewportStillRecipe(job.id).label), true);
    }
    assert.match(formatWanderReceipt(receipt), new RegExp(`seed=${seed}`));
  }
});

test('every batch holds at least one picture', () => {
  const images = wanderRecipePool().filter(isImageRecipe).map((recipe) => recipe.id);
  assert.ok(images.includes('home-folio-hero'));
  assert.ok(images.includes('folio-shelf-first'));
  assert.ok(images.includes('folio-view-open'));
  assert.ok(images.includes('home-art-standalone'));
  for (let day = 1; day <= 31; day += 1) {
    const receipt = wanderBatch({ seed: `2026-10-${day}` });
    assert.ok(receipt.jobs.some((job) => job.image), receipt.seed);
  }
});

test('scripts off only lands on HTML-readable recipes and carries no prepare', () => {
  assert.equal(wanderScriptEligible(getViewportStillRecipe('home-cauldron-open')), false);
  assert.equal(wanderScriptEligible(getViewportStillRecipe('curriculum-memory-pin')), false);
  assert.equal(wanderScriptEligible(getViewportStillRecipe('home-opening')), true);
  let seen = 0;
  for (let day = 1; day <= 48; day += 1) {
    const receipt = wanderBatch({ seed: `js-${day}` });
    const { jobs } = buildCapturePlan({ wander: receipt, includeComponents: false });
    for (const job of jobs.filter((entry) => entry.conditions?.script === 'off')) {
      seen += 1;
      assert.equal(wanderScriptEligible(getViewportStillRecipe(job.id)), true);
      assert.equal(job.prepare, null);
      assert.equal(job.attention, null);
      assert.equal(job.assertAttention, null);
      assert.match(job.file, /js-off/);
    }
  }
  assert.ok(seen > 0, 'a few hundred draws should include scripts off');
});

test('scripts off never claims a climate only the runtime paints', () => {
  assert.equal(wanderScriptEligible(getViewportStillRecipe('rpg-boonhonk-vellum')), false);
  assert.equal(wanderScriptEligible(getViewportStillRecipe('home-hook-high-contrast')), false);
  let seen = 0;
  for (let day = 1; day <= 120; day += 1) {
    for (const job of wanderBatch({ seed: `quiet-${day}`, n: 8 }).jobs) {
      if (job.conditions.script !== 'off') continue;
      seen += 1;
      const queried = Object.keys(job.conditions).filter((key) => !WANDER_SCRIPT_FREE_AXES.includes(key));
      assert.deepEqual(queried, [], `${job.id} js-off with ${queried.join(',')}`);
      assert.equal(captureSearchParams(job.conditions).toString(), job.conditions.colorMode ? `color-mode=${job.conditions.colorMode}` : '');
    }
  }
  assert.ok(seen > 0);
});

test('wander plan is the receipt, one nav each, folders name the axes', () => {
  const receipt = wanderBatch({ seed: '2026-09-29' });
  const plan = buildCapturePlan({ wander: receipt, includeComponents: false, includeStills: true, maxNavs: 8 });
  assert.equal(plan.jobs.length, receipt.jobs.length);
  assert.deepEqual(plan.jobs.map((job) => job.id).sort(), [...receipt.ids].sort());
  for (const job of plan.jobs) {
    assert.equal(job.wander.seed, '2026-09-29');
    const entry = receipt.jobs.find((row) => row.id === job.id);
    assert.equal(job.viewportId, entry.viewport);
    assert.ok(job.file.startsWith(`captures/${entry.viewport}--`), job.file);
  }
  assert.equal(buildWanderJobs({ seed: 'x', jobs: [{ id: 'nope', viewport: 'pocket', axes: [], conditions: {} }] }).length, 0);
});

test('new axes reach the folder name, the query, and the still state', () => {
  assert.equal(conditionClusterKey({ script: 'off' }), 'js-off');
  assert.equal(conditionClusterKey({ colorMode: 'dark', forcedColors: 'active' }), 'dark-mode-forced-colors');
  assert.equal(conditionClusterKey({ displayMode: 'standalone', paletteResonance: 'studio' }), 'palette-studio-standalone');
  assert.equal(conditionClusterKey({ themePack: 'banked-ember' }), 'banked-ember');
  assert.equal(conditionClusterKey({}), '');
  const params = captureSearchParams({ paletteResonance: 'hand', componentDensity: 'dense', semanticDensity: 'rich', script: 'off' });
  assert.equal(params.get('palette'), 'hand');
  assert.equal(params.get('component-density'), 'dense');
  assert.equal(params.get('semantic-density'), 'rich');
  assert.equal(params.has('script'), false);
  assert.equal(nightlyStillState({ conditions: { displayMode: 'standalone' } }), 'standalone');
  assert.equal(nightlyStillState({ conditions: { script: 'off' } }), 'js-off');
});

test('wander tables stay in step with the runtime settings', () => {
  assert.deepEqual([...WANDER_THEME_PACKS], [...THEME_PACK_OPTIONS]);
  for (const [setting, key] of Object.entries(CAPTURE_SETTING_QUERY)) {
    assert.equal(SETTINGS_TO_QUERY[setting]?.[0], key, setting);
  }
  const settingFor = { enhancement: 'enhancementLevel', reducedMotion: null, highContrast: 'highContrast' };
  for (const [axis, spec] of Object.entries(WANDER_AXES)) {
    if (spec.env || axis === 'reducedMotion') continue;
    const setting = settingFor[axis] || axis;
    const options = SETTING_OPTIONS[setting];
    assert.ok(options, `${axis} maps to a setting`);
    for (const value of spec.values) assert.ok(options.has(value), `${axis}=${value}`);
  }
});

test('art recipes point at real markup', () => {
  const home = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const folios = readFileSync(path.join(ROOT, 'design/folios/index.html'), 'utf8');
  const spellcraft = readFileSync(path.join(ROOT, 'design/experiments/spellcraft/index.html'), 'utf8');
  assert.match(home, /class="home-folio-preview"/);
  assert.match(folios, /id="release-set"/);
  assert.match(folios, /class="folio-shelf"/);
  assert.match(folios, /id="folio-00-view" popover/);
  assert.match(folios, /id="folio-00"[^>]*>\s*<button type="button" class="folio-tile__open"/);
  // #wander-spells lands with the spellcraft patch; hold the recipe to it once it exists.
  if (spellcraft.includes('wander-spells')) assert.match(spellcraft, /id="wander-spells"/);
  assert.equal(getViewportStillRecipe('home-art-standalone').conditions.displayMode, 'standalone');
  assert.equal(getViewportStillRecipe('spellcraft-wander').selector, '#wander-spells');
});

test('wander stills answer to a named id but stay out of the default packs', () => {
  const wanderIds = VIEWPORT_STILL_WANDERS.map((recipe) => recipe.id);
  const pack = buildCapturePlan({ includeComponents: false, includeStills: true, includeChecks: true, viewports: [{ id: 'pocket' }] });
  assert.equal(pack.jobs.some((job) => wanderIds.includes(job.id)), false);
  const named = buildCapturePlan({
    includeComponents: false,
    includeStills: true,
    includeChecks: true,
    viewports: [{ id: 'pocket' }],
    ids: ['folio-shelf-first', 'home-art-standalone'],
  });
  assert.deepEqual(named.jobs.map((job) => job.id).sort(), ['folio-shelf-first', 'home-art-standalone']);
  assert.equal(named.jobs.find((job) => job.id === 'home-art-standalone').file, 'captures/pocket--standalone/01-home-art-standalone.jpg');
});

test('wander profile, token, and command replay the seed', () => {
  assert.equal(CAPTURE_PROFILES.wander.viewports[0], 'pocket');
  assert.ok(CAPTURE_PROFILES.wander.maxNavs <= 8);
  const applied = applyCaptureProfile({ viewports: null, maxNavs: null }, CAPTURE_PROFILES.wander);
  assert.equal(applied.stills, true);
  assert.equal(parseSpwCaptureTokens(['wander']).wander, true);
  assert.equal(parseSpwCaptureTokens(['wander']).stills, true);
  assert.equal(wanderCaptureCommand(wanderBatch({ seed: 'moss' })), 'npm run visual:capture -- --profile wander --seed moss');
  assert.match(wanderCaptureCommand(wanderBatch({ seed: 'sunday moss', n: 3 })), /--seed 'sunday moss' --count 3$/);
});

test('--dry-plan prints the seeded plan without Chrome', () => {
  const result = spawnSync(process.execPath, [
    path.join(ROOT, 'scripts/component-snapshots.mjs'),
    '--seed', 'moss', '--dry-plan', '--json',
  ], { cwd: ROOT, encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 0, result.stderr);
  const out = JSON.parse(result.stdout);
  assert.equal(out.wander.seed, 'moss');
  assert.deepEqual(out.jobs.map((job) => job.id).sort(), [...wanderBatch({ seed: 'moss' }).ids].sort());
  assert.match(out.run.rel, /wander/);
  assert.match(result.stderr, /#>wander seed=moss/);
});

test('--count past the profile budget stretches it; a hand-set --budget trims the receipt', () => {
  const run = (...args) => {
    const result = spawnSync(process.execPath, [
      path.join(ROOT, 'scripts/component-snapshots.mjs'),
      '--seed', 'x', '--dry-plan', '--json', ...args,
    ], { cwd: ROOT, encoding: 'utf8', timeout: 30000 });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  };
  const wide = run('--count', '10');
  assert.equal(wide.wander.n, 10);
  assert.deepEqual(wide.jobs.map((job) => job.id).sort(), [...wide.wander.ids].sort());
  const trimmed = run('--count', '10', '--budget', '5');
  assert.equal(trimmed.wander.n, 5);
  assert.deepEqual(trimmed.jobs.map((job) => job.id).sort(), [...trimmed.wander.ids].sort());
  assert.equal(trimmed.wander.jobs[0].image, true);
});

const SPELL_FIXTURE = `<ol>
  <li id="wander-wash" data-spw-spell="wash" data-spw-semantic-expression="spell[wander]{route.image.ink}(wash)<still>">
    <strong>wash</strong>
    <dl>
      <dt>walk</dt><dd><a href="/recipes/#recipe-field">/recipes/#recipe-field</a> with the dark palette on</dd>
      <dt>hold</dt><dd>an image: the wash</dd>
      <dt>cast</dt><dd><em>Nourish</em></dd>
      <dt>notice</dt><dd>ink that collapses</dd>
      <dt>sense</dt><dd><code>npm run sense -- wander wash</code> · still <code>recipes-hero-dark</code></dd>
    </dl>
  </li>
  <li data-spw-spell="seats"><dl><dt>walk</dt><dd><a href="/design/components/#lens-seats">seats</a></dd><dt>sense</dt><dd>no still yet</dd></dl></li>
</ol>`;

test('a spell reads its walk, hold, cast, notice and still from the bench', () => {
  const spell = readWanderSpell(SPELL_FIXTURE, 'wash');
  assert.equal(spell.route, '/recipes/#recipe-field');
  assert.equal(spell.walk, '/recipes/#recipe-field with the dark palette on');
  assert.equal(spell.cast, 'Nourish');
  assert.equal(spell.still, 'recipes-hero-dark');
  assert.equal(readWanderSpell(SPELL_FIXTURE, 'seats').still, null);
  assert.equal(readWanderSpell(SPELL_FIXTURE, 'missing'), null);
  assert.equal(readWanderSpell(SPELL_FIXTURE, 'wash"><x'), null);
});

test('a named spell leads with its own still, as written, and the receipt prints its lines', () => {
  const spell = readWanderSpell(SPELL_FIXTURE, 'wash');
  const receipt = wanderBatch({ seed: 'wash', n: 5, spell });
  assert.equal(receipt.ids[0], 'recipes-hero-dark');
  assert.deepEqual(receipt.jobs[0].axes, []);
  assert.equal(receipt.n, 5);
  assert.equal(new Set(receipt.ids).size, 5);
  assert.ok(receipt.jobs.some((job) => job.image));
  assert.equal(receipt.spell.pictured, true);
  const text = formatWanderReceipt(receipt);
  assert.match(text, /walk\s+\/recipes\/#recipe-field/);
  assert.match(text, /cast\s+Nourish/);
  assert.match(text, /as written/);
  const unpictured = wanderBatch({ seed: 'seats', n: 4, spell: readWanderSpell(SPELL_FIXTURE, 'seats') });
  assert.equal(unpictured.spell.pictured, false);
  assert.match(unpictured.reading, /walk it by hand/);
});

test('every spell on the bench loads, and every still it names exists', () => {
  const html = readFileSync(new URL('../../design/experiments/spellcraft/index.html', import.meta.url), 'utf8');
  const slugs = [...html.matchAll(/data-spw-spell="([a-z0-9-]+)"/g)].map((match) => match[1]);
  assert.ok(slugs.length >= 5);
  for (const slug of slugs) {
    const spell = loadWanderSpell(slug);
    assert.ok(spell, slug);
    assert.ok(spell.route?.startsWith('/'), `${slug} walks somewhere`);
    assert.ok(spell.hold && spell.cast && spell.notice, `${slug} names hold, cast, notice`);
    const named = html.slice(html.indexOf(`data-spw-spell="${slug}"`)).split('</li>')[0].match(/still <code>([a-z0-9-]+)<\/code>/);
    if (named) assert.equal(spell.still, named[1], `${slug}'s named still is a recipe`);
  }
  assert.equal(loadWanderSpell('2026-09-29'), null);
});
