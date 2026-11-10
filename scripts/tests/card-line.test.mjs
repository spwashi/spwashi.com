import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { ECOSYSTEM_JOBS, canvasHref, questPivotHref } from '../../public/js/kernel/ecosystem-links.js';

const html = readFileSync(new URL('../../cards/index.html', import.meta.url), 'utf8');
const decode = (value) => value
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&');

/** The painted line, in reading order, from the spans inside one code element. */
function lineFrom(inner) {
  const parts = [];
  for (const match of inner.matchAll(/<span class="(spw-line__[^"]+)"(?: data-half="[^"]+")?>([^<]*)<\/span>/g)) {
    parts.push(decode(match[2]));
  }
  return parts.join('');
}

test('each proof-card line matches its expression and the two doors', () => {
  const blocks = [...html.matchAll(/data-spw-semantic-expression="([^"]+)"[\s\S]*?<p class="spw-embedded-expression">([\s\S]*?)<\/p>\s*<nav class="spw-card-doors"[^>]*>([\s\S]*?)<\/nav>/g)];
  assert.equal(blocks.length, 7, 'the register line and the six card types');
  for (const [, rawExpression, inner, nav] of blocks) {
    const expression = decode(rawExpression);
    assert.equal(lineFrom(inner), expression);
    const canvas = nav.match(/class="spw-card-door-canvas" href="([^"]+)" title="([^"]+)">([^<]+)</);
    const pivot = nav.match(/class="spw-card-door-pivot" href="([^"]+)" title="([^"]+)">([^<]+)</);
    assert.ok(canvas && pivot, expression);
    assert.equal(decode(canvas[1]), canvasHref(expression));
    assert.equal(canvas[2], ECOSYSTEM_JOBS.canvas.title);
    assert.equal(canvas[3], ECOSYSTEM_JOBS.canvas.label);
    assert.equal(decode(pivot[1]), questPivotHref(expression));
    assert.equal(pivot[2], ECOSYSTEM_JOBS.pivot.title);
    assert.equal(pivot[3], ECOSYSTEM_JOBS.pivot.label);
  }
});
