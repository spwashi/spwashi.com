// /physics: a line at rest (src/physics.js). The floor's rules, held as numbers:
// a touch comes home, a visitor leaves no trace and never writes, a joint keeps
// its rest length, a sight line moves nothing, closed braces are neutral from
// outside, and a keep writes only its own bytes and undoes to the same line.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import worker from '../src/index.js';
import { parse } from '../../../public/js/semantic/spw-workbench-reader.js';
import { PHYSICS_DATA, PHYSICS_DEFAULT, PHYSICS_LINES, SHARES, fieldKit, physicsHref } from '../src/physics.js';

const kit = fieldKit(PHYSICS_DATA);
const get = (p) => worker.fetch(new Request(`https://spw.quest${p}`), {});
const floor = (line = PHYSICS_DEFAULT, share = 'softer') => {
  const reading = kit.read(parse, line);
  const lay = kit.arrange(reading.tree, { share });
  return { reading, lay, sim: kit.world(lay) };
};
const HOME = 0.1; // a tenth of a pixel, the page's own unit of "home"
const label = (sim) => [...sim.frames.values()].filter((frame) => frame.warm).map((frame) => frame.label);

test('the opening line reads as three bodies, a joint, and a sight line across two of them', () => {
  const { reading, lay } = floor();
  assert.equal(reading.ok, true);
  assert.deepEqual(lay.frames.map((frame) => [frame.label, frame.parent, frame.does]), [['garden[care]', '', ''], ['^sky', '0', 'lifts'], ['.bed', '0', 'settles']]);
  assert.deepEqual(lay.bodies.map((body) => [body.text, body.kind]), [['seed:', 'key'], ['water', 'value'], ['sun', 'leaf'], ['rain', 'leaf'], ['soil', 'leaf'], ['@rain', 'ref']]);
  const [sight] = lay.sights;
  assert.equal(lay.bodies.find((body) => body.id === sight.from).frame, '0.2', '@rain stands in bed');
  assert.equal(lay.bodies.find((body) => body.id === sight.to).frame, '0.1', 'rain stands in sky');
  // The law is in the seats: sky's parts rest above the middle of their row's slack, bed's below.
  const row = (frame) => frame.y + kit.TAB + 12 + 13;
  assert.ok(lay.bodies.find((body) => body.text === 'sun').sy < row(lay.frames[1]), '^ lifts');
  assert.ok(lay.bodies.find((body) => body.text === 'soil').sy > row(lay.frames[2]), '. settles');
});

test('every line the page offers lays out inside the floor, with no word on another and a place for a visitor', () => {
  for (const { line } of PHYSICS_LINES) {
    assert.equal(physicsHref(line), `/physics?line=${encodeURIComponent(line)}`, line);
    for (const [share] of SHARES) {
      const { lay } = floor(line, share);
      for (const frame of lay.frames) {
        assert.ok(frame.x >= 0 && frame.x + frame.w <= lay.width && frame.y + frame.h <= lay.height, `${line}: ${frame.label} is on the floor`);
        assert.ok(frame.landing.x >= frame.x && frame.landing.x <= frame.x + frame.w, `${line}: a visitor lands inside ${frame.label}`);
      }
      for (const a of lay.bodies) {
        const home = lay.frames.find((frame) => frame.id === a.frame);
        assert.ok(a.sx - a.w / 2 >= home.x && a.sx + a.w / 2 <= home.x + home.w && a.sy - a.h / 2 >= home.y + kit.TAB - 1 && a.sy + a.h / 2 <= home.y + home.h, `${line} (${share}): ${a.text} rests inside ${home.label}`);
        for (const b of lay.bodies) {
          if (a === b) continue;
          assert.ok(Math.abs(a.sx - b.sx) >= (a.w + b.w) / 2 || Math.abs(a.sy - b.sy) >= (a.h + b.h) / 2, `${line}: ${a.text} and ${b.text} do not overlap at rest`);
        }
      }
    }
  }
});

test('a touch comes home, warms the body it lands in and the bodies inside it, and never the one beside it', () => {
  const { reading, sim } = floor();
  sim.push('0.1.0', 24, 0); // sun, in sky
  assert.deepEqual(label(sim), ['^sky'], 'sky alone: not bed beside it, not garden around it');
  const steps = sim.settle();
  assert.ok(steps > 0 && steps < 600, `home in ${steps} steps`);
  assert.ok(sim.measures().off < HOME, `every part home: ${sim.measures().off}`);
  sim.push('0.0k', 0, 12); // seed, in garden
  assert.deepEqual(label(sim), ['garden[care]', '^sky', '.bed'], 'garden, and by the share the bodies inside it');
  sim.settle();
  assert.ok(sim.measures().off < HOME);
  assert.equal(reading.line, PHYSICS_DEFAULT, 'a touch writes nothing');
});

test('the same act answers the same way the next time', () => {
  const run = () => {
    const { sim } = floor();
    sim.push('0.1.1', 24, 0);
    const steps = sim.settle();
    sim.enter('0.1', 'pebble', '');
    return [steps, sim.settle(), JSON.stringify(sim.measures())];
  };
  assert.deepEqual(run(), run());
});

test('a joint keeps its rest length: the value moves with its key, and comes back to it', () => {
  const { sim } = floor();
  const rest = sim.measures().joints[0].rest;
  sim.hold('0.0k', sim.byId.get('0.0k').x - 30, sim.byId.get('0.0k').y + 6);
  sim.settle(600);
  const carried = sim.measures().joints[0];
  assert.ok(Math.abs(carried.now - rest) < 0.5, `held away, the value followed: ${carried.now} against ${rest}`);
  assert.ok(sim.off(sim.byId.get('0.0k')) > 20, 'the key is where the hand holds it');
  sim.release('0.0k');
  sim.settle();
  assert.ok(Math.abs(sim.measures().joints[0].now - rest) < HOME);
  sim.push('0.0v', 24, 0);
  sim.settle();
  assert.ok(Math.abs(sim.measures().joints[0].now - rest) < HOME, 'a pushed value comes back to its key');
  assert.ok(sim.measures().off < HOME);
});

test('a sight line moves nothing: either end can be carried and the other stays', () => {
  const { sim } = floor();
  const from = sim.byId.get('0.2.1'), to = sim.byId.get('0.1.1');
  sim.hold(from.id, from.x - 40, from.y);
  sim.settle(600);
  assert.equal(sim.off(to), 0, 'rain did not move when @rain was carried');
  assert.ok(!sim.frames.get('0.1').warm && sim.frames.get('0.1').calm === 0, 'sky was never warmed');
  sim.release(from.id);
  sim.settle();
  const before = { x: from.x, y: from.y };
  sim.hold(to.id, to.x - 20, to.y);
  sim.settle(600);
  assert.deepEqual({ x: from.x, y: from.y }, before, '@rain did not move when rain was carried');
  assert.ok(sim.measures().sights[0].moved > 10, 'the measure says how far the far end is from rest');
  sim.release(to.id);
  sim.settle();
  assert.ok(sim.measures().off < HOME);
});

test('a bare visitor moves a neighbour only by touching it, is not felt outside the braces, and leaves no trace', () => {
  const { reading, sim } = floor();
  const visitor = sim.enter('0.1', 'pebble', '');
  assert.equal(visitor.frame, '0.1');
  sim.settle();
  const inside = sim.measures();
  assert.ok(inside.moved.some((part) => part.text === 'rain' && part.by > 1), 'rain made room');
  assert.equal(inside.outside.moved, 0, 'nothing beyond sky moved');
  assert.ok(Math.abs(inside.joints[0].now - inside.joints[0].rest) < HOME, 'the joint in garden is at rest');
  const rain = sim.byId.get('0.1.1');
  assert.ok(visitor.x - visitor.w / 2 >= rain.x + rain.w / 2, 'the two words do not overlap');
  sim.leave();
  sim.settle();
  assert.ok(sim.measures().off < HOME, `every part home after it left: ${sim.measures().off}`);
  assert.equal(sim.measures().outside, null);
  assert.equal(reading.line, PHYSICS_DEFAULT, 'a visitor writes nothing');
});

test('a marked visitor carries its law to the parts near it, less with distance, and still nothing is felt outside or kept after', () => {
  const rise = (token, mark) => {
    const { sim } = floor();
    sim.enter('0.2', token, mark); // bed, which settles
    sim.settle();
    const soil = sim.byId.get('0.2.0'), ref = sim.byId.get('0.2.1');
    return { soil: soil.sy - soil.y, ref: ref.sy - ref.y, outside: sim.measures().outside.moved, sim };
  };
  const bare = rise('pebble', ''), lifted = rise('^pebble', '^');
  assert.ok(Math.abs(bare.soil) < HOME && Math.abs(bare.ref) < HOME, 'a bare word lifts nothing');
  assert.ok(lifted.ref > 2, `^ lifts the part beside it: ${lifted.ref}`);
  assert.ok(lifted.soil > 0.5 && lifted.soil < lifted.ref, `and the part further off less: ${lifted.soil}`);
  assert.equal(lifted.outside, 0);
  lifted.sim.leave();
  lifted.sim.settle();
  assert.ok(lifted.sim.measures().off < HOME);
  // A part wearing the same mark gives it room.
  const same = floor('garden{^sun, rain}');
  const before = same.sim.byId.get('0.0').x;
  same.sim.enter('0', '^moon', '^'); same.sim.settle();
  const other = floor('garden{sun, rain}');
  other.sim.enter('0', '^moon', '^'); other.sim.settle();
  assert.ok(before - same.sim.byId.get('0.0').x > other.sim.byId.get('0.0').sx - other.sim.byId.get('0.0').x + 1, 'the same mark steps further away');
  // Where there is room, a bare visitor moves nothing at all.
  const roomy = floor('pantry{rice, *tin{tea}}');
  roomy.sim.enter('0', 'pebble', ''); roomy.sim.settle();
  assert.deepEqual(roomy.sim.measures().moved, []);
});

test('a keep writes only its own bytes before the closing brace, and an undo is the same line', () => {
  const { reading } = floor();
  const wrote = kit.keep(parse, reading, '0.1', 'pebble');
  assert.equal(wrote.ok, true);
  assert.equal(wrote.line, 'garden[care]{seed: water, ^sky{sun, rain, pebble}, .bed{soil, @rain}}');
  assert.equal(wrote.insert, ', pebble');
  assert.equal(wrote.bytes, 8);
  assert.equal(wrote.line.slice(0, wrote.at) + wrote.line.slice(wrote.at + wrote.length), PHYSICS_DEFAULT, 'take the written bytes out and the line is the one brought');
  assert.equal(wrote.partId, '0.1.2');
  assert.equal(kit.frameAt(wrote.reading.tree, '0.1').parts.length, 3);
  assert.match(kit.paint(wrote.line, wrote.reading.tokens, { at: wrote.at, length: wrote.length }), /rain<ins>, pebble<\/ins><span data-t="b-direction">\}<\/span>/);
  // A mark is written with its word; an order takes a semicolon; an empty body takes the word alone; spaces before the brace stay.
  assert.equal(kit.keep(parse, reading, '0.2', kit.visitorToken('stone', '.')).line, 'garden[care]{seed: water, ^sky{sun, rain}, .bed{soil, @rain, .stone}}');
  assert.equal(kit.keep(parse, kit.read(parse, 'trip{home; road}'), '0', 'sea').line, 'trip{home; road; sea}');
  assert.equal(kit.keep(parse, kit.read(parse, 'jar{}'), '0', 'salt').line, 'jar{salt}');
  assert.equal(kit.keep(parse, kit.read(parse, 'jar{ salt, honey }'), '0', 'tea').line, 'jar{ salt, honey, tea }');
  // A body joined another way is refused, and says so.
  const refused = kit.keep(parse, kit.read(parse, 'jar{salt honey}'), '0', 'tea');
  assert.equal(refused.ok, false);
  assert.match(refused.says, /nothing was written/);
  // The visitor's word is a plain word, whatever was typed.
  assert.equal(kit.visitorToken('  {x}; drop', '^'), '^x');
  assert.equal(kit.visitorToken('', ''), 'pebble');
  assert.equal(kit.visitorToken('averyveryverylongword', '$'), 'averyver', 'a mark with no law here is not worn');
  assert.equal(kit.visitorToken('stone', '*'), 'stone', 'nor a mark whose law a visitor cannot carry');
});

test('the floor says its own state as a line the reader reads', () => {
  for (const state of [{ standing: 'garden', visitor: '', kept: '', share: 'softer' }, { standing: 'sky', visitor: '^pebble', kept: '', share: 'alike' }, { standing: 'sky', visitor: '', kept: 'pebble', share: 'faint' }]) {
    const line = kit.floorLine(state);
    const result = parse(line);
    assert.ok(result.success && result.completeness.complete && !result.completeness.proseFallback, line);
  }
  assert.equal(kit.floorLine({ standing: 'sky', visitor: '^pebble', kept: '', share: 'softer' }), 'floor[sky]{visitor: ^pebble, share: softer}');
});

test('a line the floor cannot hold says why and is carried nowhere', () => {
  for (const [line, says] of [['garden{seed, water', /did not read this line whole/], ['seed{water} ~ sprout{light}', /found 2 expressions/], ['garden', /no \{ \} body/]]) {
    const reading = kit.read(parse, line);
    assert.equal(reading.ok, false, line);
    assert.match(reading.says, says);
    assert.equal(physicsHref(line), null);
  }
});

test('/physics draws the line at rest with scripts off, and the hand is offered only with scripts', async () => {
  const response = await get('/physics');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Robots-Tag'), 'index, follow');
  assert.match(response.headers.get('Content-Security-Policy'), /script-src 'self' 'unsafe-inline'/);
  const html = await response.text();
  assert.match(html, /<h1>A line at rest<\/h1>/);
  assert.ok(html.includes('<a href="/specimens" aria-current="page">Shelf</a>'), 'the masthead marks the shelf');
  assert.ok(html.includes('<a href="/physics" aria-current="page">Physics</a>'), 'the shelf row marks the room');
  // At rest: the stage, every word, the measures, with no script needed.
  const stage = html.match(/<svg id="stage"[\s\S]*?<\/svg>/)[0];
  assert.equal((stage.match(/class="part"/g) || []).length, 6);
  assert.equal((stage.match(/class="well"/g) || []).length, 3);
  assert.ok(stage.indexOf('class="lines"') < stage.indexOf('class="tabs"') && stage.indexOf('class="tabs"') < stage.indexOf('class="parts"'), 'lines are drawn under tabs and words');
  assert.ok(!stage.includes('tabindex'), 'nothing on the still floor claims to be a button');
  assert.match(html, /<tr data-m="off"><th scope="row">Farthest from rest<\/th><td>0\.0 px: every part is home<\/td><\/tr>/);
  assert.match(html, /<tr data-m="joint"><th scope="row"><code>seed: water<\/code><\/th><td>68\.0 px apart, at rest 68\.0 px<\/td><\/tr>/);
  assert.match(html, /<tr data-m="sight"><th scope="row"><code>@rain<\/code><\/th><td>a sight line [\d.]+ px long; <code>rain<\/code> has moved 0\.0 px<\/td><\/tr>/);
  assert.match(html, /<section class="hands needs-js"/);
  assert.match(html, /class="axis without-js">With scripts off, this is the line at rest\./);
  assert.match(html, /import \{ parse \} from "\/parser\.js";/);
  // The line travels: out to Pivot, Build and the canvas, and in by the address.
  const line = encodeURIComponent(PHYSICS_DEFAULT);
  assert.ok(html.includes(`data-carry="pivot" href="/pivot?line=${line}"`));
  assert.ok(html.includes(`data-carry="build" href="/build?script=${line}#build"`));
  assert.ok(html.includes(`data-carry="canvas" href="/canvas?line=${line}"`));
  // The table of laws is the simulation's own data.
  for (const law of PHYSICS_DATA.laws) assert.ok(html.includes(`${law.does}: ${law.says}`), law.sigil);
  // The rules and the example lines read with scripts off.
  assert.equal((html.match(/<li><strong>/g) || []).length, 7);
  for (const { line: example } of PHYSICS_LINES) assert.ok(html.includes(`href="/physics?line=${encodeURIComponent(example)}"`), example);
});

test('/physics takes a line and a share from the address, and says so when the reader cannot hold it', async () => {
  const brought = await get(`/physics?line=${encodeURIComponent('^garden{seed: water, sky{sun, rain}}')}&share=alike`);
  assert.equal(brought.headers.get('X-Robots-Tag'), 'noindex, follow');
  const html = await brought.text();
  assert.match(html, /name="share" value="alike" checked/);
  assert.match(html, /<title>spw\.quest — at rest: \^garden\{seed: water, sky\{sun, rain\}\}<\/title>/);
  // The share is in the seats: alike lifts the inner body's parts more than faint does.
  const y = (share) => floor('^garden{seed: water, sky{sun, rain}}', share).lay.bodies.find((body) => body.text === 'sun').sy;
  assert.ok(y('alike') < y('softer') && y('softer') < y('faint'));
  assert.match(await (await get('/physics?share=loud')).text(), /name="share" value="softer" checked/);
  const open = await (await get(`/physics?line=${encodeURIComponent('garden{seed, water')}`)).text();
  assert.match(open, /The reader did not read this line whole/);
  assert.ok(!open.includes('<svg id="stage"') && !open.includes('from "/parser.js"'), 'no floor and no hand for a line that was not read');
});

test('a line is carried to the floor from Build, Pivot, Constructs and Forms, only where the floor can read it', async () => {
  const line = 'garden[care]{seed, water}';
  const build = await (await get(`/build?script=${encodeURIComponent(line)}`)).text();
  assert.ok(build.includes(`<a href="/physics?line=${encodeURIComponent(line)}">Feel it at rest</a>`));
  const pivot = await (await get(`/pivot?line=${encodeURIComponent(line)}`)).text();
  assert.ok(pivot.includes(`href="/physics?line=${encodeURIComponent(line)}"`));
  const constructs = await (await get('/constructs')).text();
  const rests = [...constructs.matchAll(/href="\/physics\?line=([^"]+)"[^>]*>Feel it at rest/g)].map(([, value]) => decodeURIComponent(value));
  assert.ok(rests.length > 0);
  for (const carried of rests) assert.equal(kit.read(parse, carried).ok, true, carried);
  // Forms is a static page: a row with a body gains "rest"; a join between two lines does not.
  const forms = readFileSync(new URL('../assets/forms/index.html', import.meta.url), 'utf8');
  const rows = [...forms.matchAll(/<span class="form-go">(.*?)<\/span>/g)].map(([, links]) => links);
  assert.ok(rows.some((links) => links.includes('>rest</a>')) && rows.some((links) => !links.includes('>rest</a>')));
  for (const [, value] of forms.matchAll(/href="\/physics\?line=([^"]+)">rest/g)) assert.equal(kit.read(parse, decodeURIComponent(value)).ok, true, value);
});
