/**
 * Page template personality + normalization contracts.
 * Covers PAGE_FAMILY_PERSONALITY fill, authored-wins, token normalize.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  PAGE_FAMILY_PERSONALITY,
  renderTemplate,
  resolvePageFamilyPersonality,
  TEMPLATE_INTERNALS,
} from '../template.mjs';

const { normalizeTokenList, normalizePageFamily, normalizeRelatedRoutes } = TEMPLATE_INTERNALS;

describe('page family personality map', () => {
  it('exports stable family keys with layout/wonder/modes', () => {
    assert.ok(Object.keys(PAGE_FAMILY_PERSONALITY).length >= 20);
    for (const [family, personality] of Object.entries(PAGE_FAMILY_PERSONALITY)) {
      assert.equal(typeof personality.layout, 'string', `${family}.layout`);
      assert.equal(typeof personality.wonder, 'string', `${family}.wonder`);
      assert.equal(typeof personality.modes, 'string', `${family}.modes`);
      assert.ok(personality.layout.length > 0);
      assert.ok(personality.wonder.includes(' ') || personality.wonder.length > 3);
    }
  });

  it('resolves known families and rejects unknown', () => {
    assert.equal(resolvePageFamilyPersonality('playfield').layout, 'wide');
    assert.equal(resolvePageFamilyPersonality('Play Field')?.layout, undefined); // normalize collapses
    assert.equal(resolvePageFamilyPersonality('PLAYFIELD').layout, 'wide');
    assert.equal(resolvePageFamilyPersonality('not-a-family'), null);
  });
});

describe('token normalization', () => {
  it('dedupes and lowercases token lists', () => {
    assert.equal(
      normalizeTokenList('  Read  Inspect read COMPARE  inspect '),
      'read inspect compare',
    );
  });

  it('normalizes page-family kebab', () => {
    assert.equal(normalizePageFamily('Kernel Portrait'), 'kernel-portrait');
    assert.equal(normalizePageFamily('runtime_observatory'), 'runtime-observatory');
  });

  it('normalizes related routes with trailing slash', () => {
    const out = normalizeRelatedRoutes('/about|/tools|https://spwashi.com/play|https://texture.website');
    assert.equal(out, '/about/|/tools/|/play/|https://texture.website/');
  });
});

describe('renderTemplate body personality', () => {
  it('fills missing layout/wonder/modes from page-family', async () => {
    const source = `<spw-page title="T" description="D" canonical="https://spwashi.com/t/" page_family="playfield"></spw-page>
<!DOCTYPE html>
<html lang="en">
<head><spw-site-head></spw-site-head></head>
<body data-spw-page-family="playfield" data-spw-page-role="game-hub">
<main id="main-content"></main>
</body>
</html>`;
    const { output, warnings } = await renderTemplate(source, { sourceLabel: 'test-fill' });
    assert.equal(warnings.length, 0);
    assert.match(output, /data-spw-layout="wide"/);
    assert.match(output, /data-spw-wonder="projection resonance consequence"/);
    assert.match(output, /data-spw-page-modes="read play explore"/);
    assert.match(output, /property="og:title"/);
    assert.doesNotMatch(output, /<spw-site-head/);
    assert.doesNotMatch(output, /<spw-page/);
  });

  it('never overwrites authored layout/wonder/modes', async () => {
    const source = `<spw-page
  title="About"
  description="About the practice"
  canonical="https://spwashi.com/about/"
  page_family="kernel-portrait"
  layout="newspaper"
  wonder="orientation consequence resonance"
  page_modes="reading compare navigate"
></spw-page>
<!DOCTYPE html>
<html lang="en">
<head><spw-site-head></spw-site-head></head>
<body
  data-spw-page-family="kernel-portrait"
  data-spw-layout="newspaper"
  data-spw-wonder="orientation consequence resonance"
  data-spw-page-modes="reading compare navigate"
  data-spw-page-role="kernel-identity-register">
<main></main>
</body>
</html>`;
    const { output } = await renderTemplate(source, { sourceLabel: 'test-authored' });
    assert.match(output, /data-spw-layout="newspaper"/);
    assert.doesNotMatch(output, /data-spw-layout="reading"/);
    assert.match(output, /data-spw-wonder="orientation consequence resonance"/);
  });

  it('normalizes duplicate tokens on body during render', async () => {
    const source = `<spw-page title="T" description="D" canonical="https://spwashi.com/x/"></spw-page>
<!DOCTYPE html>
<html lang="en">
<head><spw-site-head></spw-site-head></head>
<body data-spw-page-family="toolbench" data-spw-features="operators operators navigator" data-spw-wonder="Locality locality Consequence">
<main></main>
</body>
</html>`;
    const { output } = await renderTemplate(source, { sourceLabel: 'test-normalize' });
    assert.match(output, /data-spw-features="operators navigator"/);
    assert.match(output, /data-spw-wonder="locality consequence"/);
  });

  it('decodes directive attribute entities before escaping generated metadata', async () => {
    const source = `<spw-page
  title="Spwashi • #&gt; Frame &amp; &lt;Concept&gt;"
  description="Compare frame &amp; concept."
  canonical="https://spwashi.com/operators/frame/"
  surface="software"
  stylesheet_mode="scoped"
  extra_styles="/public/css/effects/cinematic.css"
></spw-page>
<!doctype html>
<html lang="en">
<head><spw-site-head></spw-site-head></head>
<body data-spw-surface="software"><main><h1>Frame</h1></main></body>
</html>`;
    const { output, warnings } = await renderTemplate(source, { sourceLabel: 'test-entities' });
    assert.deepEqual(warnings, []);
    assert.match(output, /<title>Spwashi • #&gt; Frame &amp; &lt;Concept&gt;<\/title>/);
    assert.doesNotMatch(output, /&amp;(?:gt|lt|amp);/);
    assert.equal(
      output.match(/href="\/public\/css\/effects\/cinematic\.css"/g)?.length,
      1,
    );
  });

  it('preserves an explicit robots directive in the shared head', async () => {
    const source = `<spw-page title="QA bench" robots="noindex"></spw-page>
<!doctype html>
<html lang="en">
<head><spw-site-head></spw-site-head></head>
<body><main></main></body>
</html>`;
    const { output, warnings } = await renderTemplate(source, { sourceLabel: 'test-robots' });
    assert.deepEqual(warnings, []);
    assert.match(output, /<meta name="robots" content="noindex" \/>/);
  });
});
