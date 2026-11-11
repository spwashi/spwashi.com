// The doors a route offers into spw.quest and factshift.center, read the way a
// link-follower meets them: as plain hrefs in the page's HTML, with no script,
// no fragment and no headers. Each door is a hand-encoded copy of a line, so
// this holds the copy to the page, and walks it through the quest worker to
// see what the reader lands on. A door that names a slot (#turn-mode) promises
// a turn that reaches another page; that promise is held here too.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { questPivotHref } from '../../public/js/kernel/ecosystem-links.js';
import worker from '../../workers/spw-quest/src/index.js';
import { SPECIMENS } from '../../workers/spw-quest/src/specimens.js';

const ROOT = new URL('../../', import.meta.url);
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" };
const decode = (value) => value.replace(/&(amp|lt|gt|quot|apos|#39);/g, (_, name) => ENTITIES[name]);
const flat = (value) => String(value ?? '').replace(/\s+/g, '');
const unscripted = (html) => html.replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/g, '');
const textOf = (html) => decode(unscripted(html).replace(/<[^>]+>/g, ''));

const routes = execFileSync('git', ['ls-files', '*index.html'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter((file) => file && !file.startsWith('workers/') && !file.startsWith('dist') && !file.startsWith('design/catalog'))
  .map((file) => ({ file, route: `/${file.replace(/index\.html$/, '')}`, html: readFileSync(new URL(file, ROOT), 'utf8') }));

/** Every authored door on every route: where it stands, where it goes, the line it carries. */
const doors = routes.flatMap(({ file, route, html }) => [...html.matchAll(/href="(https:\/\/(?:spw\.quest\/pivot\?line=|factshift\.center\/\?spw=)[^"]+)"/g)].map(([, raw]) => {
  const url = new URL(decode(raw));
  return { file, route, html, url, line: url.searchParams.get('line') ?? url.searchParams.get('spw') ?? '', tool: url.hostname === 'spw.quest' ? 'pivot' : 'canvas' };
}));

const land = async (url) => worker.fetch(new Request(`https://spw.quest${url.pathname}${url.search}`), {});

test('there are doors to read, in the forms a link-follower can take', () => {
  assert.ok(doors.length >= 30, `found ${doors.length}`);
  // A fragment never reaches a fetch, so an authored door to one line goes by its query form.
  for (const { file, html } of routes) assert.doesNotMatch(html, /href="https:\/\/(?:factshift\.center|spw\.quest)[^"]*#spw64=/, file);
});

test('each door carries a line its own page holds', () => {
  for (const { file, line, html } of doors) {
    const expressions = [...html.matchAll(/data-spw-semantic-expression="([^"]*)"/g)].map(([, value]) => flat(decode(value)));
    assert.ok(expressions.includes(flat(line)) || flat(textOf(html)).includes(flat(line)), `${file} offers ${line}, which the page does not hold`);
  }
});

test('a pivot door lands on the line, readable with no script, with the way back to where the line stands', async () => {
  for (const { file, route, url, line, html, tool } of doors) {
    if (tool !== 'pivot') continue;
    const response = await land(url);
    assert.equal(response.status, 200, `${file}: ${line}`);
    const page = await response.text();
    assert.ok(flat(textOf(page)).includes(flat(line)), `${file}: the landing paints ${line}`);
    const held = [...html.matchAll(/data-spw-semantic-expression="([^"]*)"/g)].some(([, value]) => flat(decode(value)) === flat(line));
    if (!held) continue;
    const backs = [...unscripted(page).matchAll(/<a href="https:\/\/spwashi\.com(\/[^"#]*)[^"]*">Read it where it stands<\/a>/g)].map(([, there]) => there);
    assert.ok(backs.length, `${file}: the landing of ${line} has no way back`);
    // A line standing on one page has one way back, and it is this page.
    const stands = SPECIMENS.find((specimen) => specimen.source === 'routes' && flat(specimen.line) === flat(line));
    if (stands && !stands.also) assert.equal(backs[0], route, `${file}: the landing of ${line} leads back here`);
  }
});

test('a door that names a slot opens on turns of that slot that reach another page', async () => {
  const named = doors.filter(({ url }) => url.hash.startsWith('#turn-'));
  assert.ok(named.length >= 8, `found ${named.length}`);
  for (const { file, route, url, line } of named) {
    assert.equal(url.href, questPivotHref(line, { slot: url.hash.replace('#turn-', '') }), `${file}: ${line}`);
    const page = unscripted(await (await land(url)).text());
    const start = page.indexOf(`id="${url.hash.slice(1)}"`);
    assert.ok(start > 0, `${file}: ${line} has no ${url.hash}`);
    const end = page.indexOf('<section class="slot-group"', start + 1);
    const group = page.slice(start, end < 0 ? undefined : end);
    const reached = [...group.matchAll(/On the shelf: <code>spwashi\.com(\/[^#<]*)/g)].map(([, there]) => there).filter((there) => there !== route);
    assert.ok(reached.length > 0, `${file}: no ${url.hash} turn of ${line} reaches another page`);
  }
});
