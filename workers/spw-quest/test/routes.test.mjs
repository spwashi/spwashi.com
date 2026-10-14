import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import worker from '../src/index.js';
import { EXPECTED_FILES, GROW_CHECKS, INIT_PROMPT, QUEST_PROMPTS, QUEST_TEXT, WORKBENCH } from '../src/quest.js';
import { OPERATORS, CONTAINERS } from '../src/guide.js';
import { CHECKS, STEPS, STORYBOARD } from '../src/steps.js';
import { BALLOON_BY_OPERATOR, BALLOON_WORDS, LAYERS, LINE_LIMIT, panelBalloon } from '../src/reader.js';
import { PARSER_JS } from '../src/parser-text.js';
import { BASE_SECURITY, escapeHtml } from '../../lib/shell.js';
import { readConfig } from '../../autonomous-feedback/src/config.js';

const get = (host, path, options) => worker.fetch(new Request(`https://${host}${path}`, options));

test('quest discovery is independent of cache and network APIs', async () => {
  for (const path of ['/install', '/init', '/init.md', '/llms.txt', '/git.txt', '/git.md', '/quest.json', '/prompts.json', '/ready']) {
    const response = await get('spw.quest', path);
    assert.equal(response.status, 200, path);
    if (!['/ready'].includes(path)) assert.match(await response.text(), /\.spw\/_workbench/);
  }
  const data = await (await get('spw.quest', '/quest.json')).json();
  assert.equal(data.revision, WORKBENCH.revision);
  assert.equal(data.prompts[0].body, INIT_PROMPT);
  assert.equal(data.worker, undefined);
  assert.equal((await get('spw.quest', '/for/example.org')).status, 404);
});

test('quest negotiation, HEAD, methods, and redirects', async () => {
  const plain = await get('spw.quest', '/', { headers: { accept: 'text/plain' } });
  assert.match(plain.headers.get('content-type'), /text\/plain/);
  assert.equal(plain.headers.get('vary'), 'Accept');
  const json = await get('spw.quest', '/', { headers: { accept: 'application/json' } });
  assert.equal((await json.json()).schema, 'quest.v2');
  for (const path of ['/', '/install', '/init', '/quest.json', '/missing']) {
    assert.equal(await (await get('spw.quest', path, { method: 'HEAD' })).text(), '');
  }
  assert.equal((await get('spw.quest', '/init', { method: 'POST' })).status, 405);
  assert.equal((await get('www.spw.quest', '/init')).headers.get('location'), 'https://spw.quest/init');
  const health = await (await get('spw.quest', '/health')).json();
  assert.equal(health.worker, 'spw-quest');
  const page = await (await get('spw.quest', '/install')).text();
  // Instruction sets are tabs, Shell first and selected.
  assert.match(page, /role="tablist" aria-label="Who runs the setup"/);
  assert.match(page, /var __name = /);
  const tabs = [...page.matchAll(/role="tab" id="tab-([a-z]+)"[^>]*aria-selected="(true|false)"/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(tabs[0], ['shell', 'true']);
  assert.equal(tabs.filter(([, selected]) => selected === 'true').length, 1);
  assert.deepEqual(tabs.map(([id]) => id), ['shell', 'claude', 'codex', 'grok', 'paste']);
  // Shell already runs the git guide, so only agent panels offer to add it.
  const shellPanel = page.match(/<section class="tabpanel"[^>]*id="panel-shell"[\s\S]*?<\/section>/)[0];
  assert.doesNotMatch(shellPanel, /data-include-git/);
  assert.match(shellPanel, /git submodule add/);
  assert.match(page, /data-include-git="set-claude"/);
  assert.match(page, /id="git-covered" hidden/);
  assert.doesNotMatch(page, /name="runner"|quest-sets/);
  assert.match(page, /Codex/);
  assert.match(page, /Grok/);
  assert.match(page, /Git, in this order/);
  assert.match(page, /https:\/\/autonomous\.feedback\/spw\.quest\?at=\/install"/);
  // The page says what the choice does, where to run it, and what success looks like.
  assert.match(page, /Choose who runs the setup\. Copy one block\. Run it from the repository root\. It stops before any commit\./);
  assert.match(page, /It needs Git and Node 20\.19\+ or 22\.12\+\./);
  assert.match(page, /What this does/);
  assert.match(page, /You run every step yourself\./);
  assert.match(page, /Nothing is committed\./);
  assert.match(page, /Include the git commands in this copy/);
  assert.match(page, /This copy now ends with the five git commands/);
  assert.match(page, /<h2 id="after-title">When it worked<\/h2>/);
  assert.match(page, /id="first-patch"/);
  const config = await (await get('spw.quest', '/.well-known/autonomous-feedback.json')).json();
  assert.equal(config.host, 'spw.quest');
  assert.equal(config.schema, 'autonomous-feedback.client.v0');
  assert.ok(config.frame.ancestors.includes('https://spwashi.com'));
  const recipe = await (await get('spw.quest', '/init')).text();
  assert.match(recipe, /codex exec/);
  assert.match(recipe, /grok '/);
  assert.match(recipe, /Git, in this order/);
  const git = await get('spw.quest', '/git.txt');
  assert.match(git.headers.get('content-type'), /text\/plain/);
  const gitText = await git.text();
  assert.match(gitText, /^test -d \.git \|\| git init/);
  assert.doesNotMatch(gitText, /^#/m);
  const gitMd = await get('spw.quest', '/git.md');
  assert.match(gitMd.headers.get('content-type'), /text\/markdown/);
});

test('the page and the recipe name the same expected files', () => {
  for (const file of EXPECTED_FILES) assert.ok(INIT_PROMPT.includes(file), `${file} is missing from the recipe`);
});

// The creator's words on the guide; they stay verbatim.
const ORIGIN = [
  'The difficulty was not having language for what I was thinking about, so I could not tell when a thought was ready to set down. Spw gives a thought somewhere to land: one character says what a word is doing, braces say what belongs together, and a thought can be set down whole instead of chased.',
  'It started in 2017, alongside reading about how people learn from text and helping with research in an adult learning lab. Part of it was wanting language to share what I was learning, in a place where I could keep learning what I wanted to. The question it keeps asking is about cognition: where do two understandings stop sharing ground, and what would help them share more?',
  'And it wonders about geometry: how a mind represents the thoughts it holds, what shape a circuit of thought might take on a page, and how findings from different fields could sit side by side in one form you can read.',
  'It is not built for anyone in particular. It has been designed with care, and it has turned out to be useful, most of all toward a culture where media literacy can grow across generations.',
];
const SITE_BUNDLE = new URL('../../../public/js/semantic/spw-workbench-parser.js', import.meta.url);
const SHELL_CSP = BASE_SECURITY['Content-Security-Policy'];

test('the guide leads with seven panels, each a line in a balloon and a GET form', async () => {
  const response = await get('spw.quest', '/');
  assert.equal(response.status, 200);
  const page = await response.text();
  assert.match(page, /A small language for the shape of a thought\./);
  assert.ok(page.indexOf('id="build"') < page.indexOf('<section class="step" id="write"'), 'the script tool comes before the panels');
  assert.match(page, /data-tool="copy"/);
  assert.match(page, /name="tool" value="format"/);
  assert.match(page, /formaction="\/script\.spw"/);
  assert.doesNotMatch(page, /<dt>Notice<\/dt>/);
  assert.match(page, /href="\/install">install<\/a>/);
  assert.match(page, /href="\/install">Install the workbench/);
  // The spiral is retired as the organizing shape.
  assert.doesNotMatch(page, /<svg|class="spiral"/);
  const panels = [...page.matchAll(/<section class="step" id="([a-z]+)"/g)].map((m) => m[1]);
  assert.deepEqual(panels, STEPS.map((step) => step.id));
  assert.equal(panels.length, 7);
  for (const [index, step] of STEPS.entries()) {
    const panel = page.match(new RegExp(`<section class="step" id="${step.id}"[\\s\\S]*?</section>`))[0];
    assert.match(panel, new RegExp(`<form class="line" id="form-${step.id}" method="get" action="/read">`), step.id);
    assert.ok(panel.includes(`<input type="hidden" name="step" value="${step.id}">`), step.id);
    assert.ok(panel.includes(`name="line"`) && panel.includes(`>${escapeHtml(step.try)}</textarea>`), `${step.id} carries its try line in an editable field`);
    assert.ok(panel.includes(`<a class="n" href="#${step.id}">${index + 1}</a> ${step.id}`), `${step.id} numbers itself as a link to its own address`);
    // Each panel links to its neighbors, and the path names every panel in order.
    if (index > 0) assert.ok(panel.includes(`<a href="#${STEPS[index - 1].id}" rel="prev">`), `${step.id} links back`);
    if (index < STEPS.length - 1) assert.ok(panel.includes(`<a href="#${STEPS[index + 1].id}" rel="next">`), `${step.id} links on`);
    assert.ok(page.includes(`<a href="#${step.id}"><span class="n">${index + 1}</span><span class="id">${step.id}</span></a>`), `${step.id} on the path`);
    // Scene and speaker are named; the balloon kind is written, not only drawn.
    assert.ok(panel.includes(`</span>${escapeHtml(step.scene)}</p>`), `${step.id} scene`);
    assert.ok(panel.includes(`<span class="who">${escapeHtml(step.speaker)}</span>`), `${step.id} speaker`);
    const kind = panel.match(/<div class="balloon" data-bubble="([a-z]+)">/)[1];
    assert.equal(kind, panelBalloon(step), `${step.id} balloon`);
    assert.ok(panel.includes(`<span class="kind">${BALLOON_WORDS[kind]}</span>`), `${step.id} says its balloon`);
    // The worker already read the try line, so the panel reads with scripts off.
    assert.match(panel, step.check === 'commands_pass' ? /data-state="terminal"/ : /data-state="pass"/, step.id);
    for (const line of step.then || []) assert.ok(panel.includes(`href="/read?step=${step.id}&amp;line=${encodeURIComponent(line)}"`), `${step.id} then ${line}`);
  }
  // Below the panels: one page, the sigils, the braces, the readers, the origin, install.
  const at = (marker) => page.indexOf(marker);
  const order = ['id="grow"', '<aside class="install"', 'id="read"', 'id="operators"', 'id="braces"', 'id="readers"', 'id="origin"', 'id="next"'].map(at);
  assert.ok(order.every((n) => n > 0), 'every section is present');
  assert.deepEqual(order, [...order].sort((a, b) => a - b), 'sections keep their order');
  assert.equal([...page.matchAll(/<span class="sigil"/g)].length, OPERATORS.length);
  for (const op of OPERATORS) assert.match(page, new RegExp(`<li id="op-${op.name}">[\\s\\S]*?Runtime: `));
  for (const c of CONTAINERS) assert.ok(page.includes(`<strong>${c.name}</strong>`), c.name);
  for (const paragraph of ORIGIN) assert.ok(page.includes(`<p>${paragraph}</p>`), 'origin paragraph verbatim');
  // The shape, not labels: no God and no diagnosis on the guide.
  const text = page.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
  assert.doesNotMatch(text, /\bGod\b|\bOCD\b|\bADHD\b|\bautis(m|tic)\b|\bbipolar\b|\bdiagnos/i);
  // Scripts on, the page reads with the parser it serves itself.
  assert.match(page, /<script type="module">\nimport \{ parse \} from "\/parser\.js";/);
  assert.doesNotMatch(page, /src="https?:/);
  // Old #claude links forward to the install page.
  assert.match(page, /dataset\.setupSets = "shell claude codex grok paste"/);
  assert.doesNotMatch(page, /role="tablist"/);
});

test('/parser.js is the site bundle, as JavaScript', async () => {
  const response = await get('spw.quest', '/parser.js');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^text\/javascript/);
  const bundle = readFileSync(SITE_BUNDLE, 'utf8');
  assert.equal(await response.text(), bundle, 'run node workers/spw-quest/carry-parser.mjs');
  assert.equal(PARSER_JS, bundle);
  assert.equal(await (await get('spw.quest', '/parser.js', { method: 'HEAD' })).text(), '');
});

test('the guide alone allows a same-origin script; every other route keeps the shell policy', async () => {
  const guide = (await get('spw.quest', '/')).headers.get('content-security-policy');
  assert.equal(guide, SHELL_CSP.replace("script-src 'unsafe-inline'", "script-src 'self' 'unsafe-inline'"));
  assert.notEqual(guide, SHELL_CSP);
  for (const path of ['/install', '/read?step=act', '/read?step=nope', '/init', '/parser.js', '/quest.json', '/git.txt', '/missing']) {
    assert.equal((await get('spw.quest', path)).headers.get('content-security-policy'), SHELL_CSP, path);
  }
  // The shared shell, which autonomous.feedback also uses, still allows no script by URL.
  assert.match(SHELL_CSP, /script-src 'unsafe-inline';/);
});

test('/read reads each try line with the worker parser, and links back to its panel', async () => {
  const read = async (step, line) => {
    const query = line === undefined ? `step=${step}` : `step=${step}&line=${encodeURIComponent(line)}`;
    const response = await get('spw.quest', `/read?${query}`);
    return { status: response.status, page: await response.text() };
  };
  const state = (page) => page.match(/<p class="check" id="check-[a-z]+" data-state="([a-z]+)">/)[1];
  for (const step of STEPS) {
    const expected = step.check === 'commands_pass' ? 'terminal' : 'pass';
    for (const line of [step.try, ...(step.then || [])]) {
      const { status, page } = await read(step.id, line);
      assert.equal(status, 200, step.id);
      assert.equal(state(page), expected, `${step.id}: ${line}`);
      assert.ok(page.includes(`>${escapeHtml(line)}</textarea>`), `${step.id} keeps the line in the form`);
      assert.ok(page.includes(`href="/#${step.id}">Back to the panel</a>`), step.id);
      assert.doesNotMatch(page, /<script type="module">/);
    }
    // Without a line, /read reads the try line.
    assert.equal(state((await read(step.id)).page), expected, step.id);
  }
  const wrong = {
    write: ['', 'empty'],
    act: ['door', 'fail'],
    hold: ['door[closed]{hinge.frame.key}', 'fail'],
    name: ['my_notes', 'fail'],
    point: ['yesterday: ~"./yesterday.spw"', 'fail'],
    ask: ['?["why the same door"]{ count }', 'fail'],
    grow: ['anything at all', 'terminal'],
  };
  for (const [id, [line, expected]] of Object.entries(wrong)) {
    assert.equal(state((await read(id, line)).page), expected, `${id}: ${JSON.stringify(line)}`);
  }
  // Tight dots lex as one identifier, so the braces hold one part; commas make three.
  const dots = (await read('hold', 'door[closed]{hinge.frame.key}')).page;
  assert.match(dots, /The braces hold one part\./);
  assert.match((await read('hold', 'door[closed]{hinge, frame, key}')).page, /<span class="held">3 parts<\/span>/);
  // The operator in front of the word picks the balloon; @ before a word also counts as a mark.
  assert.match((await read('act', '!door')).page, /data-bubble="burst"/);
  assert.match((await read('act', '?door')).page, /data-bubble="question"/);
  assert.equal(state((await read('act', '@door')).page), 'pass');
  const { status, page } = await read('nope', 'x');
  assert.equal(status, 404);
  for (const step of STEPS) assert.ok(page.includes(`href="/read?step=${step.id}"`));
  assert.match((await read('act', 'x'.repeat(LINE_LIMIT + 5))).page, new RegExp(`Only the first ${LINE_LIMIT} characters were read\\.`));
  assert.equal(await (await get('spw.quest', '/read?step=act', { method: 'HEAD' })).text(), '');
});

test('the panels draw with the storyboard words quest.spw gives them', () => {
  for (const [sigil, kind] of Object.entries(BALLOON_BY_OPERATOR)) {
    assert.ok(STORYBOARD.bubble.includes(`${sigil} ${BALLOON_WORDS[kind]}`), `${sigil} ${kind}`);
  }
  assert.ok(STORYBOARD.bubble.includes('no operator a caption'));
  for (const [level, words] of Object.entries(LAYERS)) assert.ok(STORYBOARD.layer.includes(`${level} ${words}`), level);
  for (const step of STEPS) {
    assert.ok(BALLOON_WORDS[panelBalloon(step)], `${step.id} draws a known balloon`);
    assert.ok(LAYERS[step.layer], `${step.id} sits on the ladder`);
    assert.ok(CHECKS[step.check], `${step.id} names a known check`);
  }
});

test('the agent recipe and the prompts end with the grow panel, before any commit', () => {
  const numbered = INIT_PROMPT.trimEnd().split('\n');
  const last = numbered.findLast((line) => /^\d+\. /.test(line));
  assert.match(last, /^7\. Play once\. Read \.spw\/quest\/index\.spw/);
  assert.match(INIT_PROMPT, /Grow section of \.spw\/README\.md instead/);
  assert.ok(INIT_PROMPT.endsWith('   Stop before any commit, push, or deploy.\n'));
  assert.ok(INIT_PROMPT.includes(GROW_CHECKS));
  assert.match(GROW_CHECKS, /spw -- lint \.spw\n.*spw -- resolve --from \.spw/);
  const grow = QUEST_PROMPTS.at(-1);
  assert.equal(grow.id, 'grow');
  assert.match(grow.body, /Grow section/);
  assert.match(grow.body, /Stop before any commit, push, or deploy\.$/);
  assert.ok(QUEST_TEXT.includes(INIT_PROMPT));
});

test('the feedback form takes the paper material without a correction', async () => {
  const raw = await (await get('spw.quest', '/.well-known/autonomous-feedback.json')).json();
  assert.equal(raw.theme.mode, 'light');
  const config = readConfig(raw, 'spw.quest');
  assert.deepEqual(config.problems.filter((problem) => /theme/.test(problem)), []);
  assert.equal(config.theme.background, raw.theme.background);
});

// The workbench's single source for the steps. The mounted pin may not carry it yet;
// SPW_QUEST_SPW points this test at another copy.
const QUEST_SPW = process.env.SPW_QUEST_SPW ? pathToFileURL(process.env.SPW_QUEST_SPW) : new URL('../../../.spw/_workbench/docs/learn/quest.spw', import.meta.url);
test('steps.js is a verbatim copy of the workbench quest', { skip: !existsSync(QUEST_SPW) }, () => {
  const source = readFileSync(QUEST_SPW, 'utf8');
  const block = (name) => {
    const start = source.indexOf(`^["${name}"]{`);
    assert.ok(start >= 0, `quest.spw has ^["${name}"]`);
    return source.slice(start, source.indexOf('\n}\n', start));
  };
  const fields = (text) => Object.fromEntries(text.split('\n').slice(1).map((line) => line.trim())
    .filter((line) => line && !line.startsWith('//')).map((line) => [line.slice(0, line.indexOf(' = ')), line.slice(line.indexOf(' = ') + 3)]));
  const phrase = (value) => `\`${value.replaceAll('`', '\\`')}\``;
  const quoted = (value) => `"${value}"`;
  const steps = block('steps');
  assert.deepEqual([...steps.matchAll(/^ ([a-z_]+): \.\{$/gm)].map((m) => m[1]), STEPS.map((step) => step.id), 'same panels, same order');
  for (const step of STEPS) {
    const start = steps.indexOf(` ${step.id}: .{`);
    assert.deepEqual(fields(steps.slice(start, steps.indexOf('}[reg=facet]', start))), {
      scene: phrase(step.scene),
      speaker: phrase(step.speaker),
      bubble: quoted(step.bubble),
      layer: quoted(step.layer),
      try: phrase(step.try),
      ...(step.then ? { then: `#[ ${step.then.map(phrase).join(', ')} ]` } : {}),
      reads: quoted(step.reads),
      notice: quoted(step.notice),
      check: quoted(step.check),
      grow: quoted(step.grow),
    }, step.id);
  }
  assert.deepEqual(fields(block('checks')), Object.fromEntries(Object.entries(CHECKS).map(([name, shape]) => [name, quoted(shape)])));
  assert.deepEqual(fields(block('storyboard')), Object.fromEntries(Object.entries(STORYBOARD).map(([name, words]) => [name, quoted(words)])));
});

const THEORY = new URL('../../../.spw/_workbench/docs/theory/spw/operators.spw', import.meta.url);
test('guide operator names follow the workbench reader vocabulary', { skip: !existsSync(THEORY) }, () => {
  const theory = readFileSync(THEORY, 'utf8');
  for (const op of OPERATORS) {
    assert.ok(theory.includes(`\`${op.sigil}\` = ${op.name}`), `${op.sigil} should read as ${op.name}`);
  }
  for (const c of CONTAINERS) {
    assert.ok(theory.includes(`\`${c.open}${c.open === '<' ? ' ' : ''}${c.close}\` = ${c.name}`), `${c.open}${c.close} should read as ${c.name}`);
  }
});

test('put one together: slots make a line, each pivot holds the rest, and nothing breaks its braces', async () => {
  const page = await (await get('spw.quest', '/build?mark=%3F&word=door&concept=&scene=threshold&mode=ajar&definition=hinge.frame.key')).text();
  assert.match(page, /aria-label="\?door\(threshold\)\[ajar\]\{hinge\.frame\.key\}"/);
  assert.match(page, /1 name\. Dots join the words\./);
  // Changing the mark keeps every other slot.
  assert.ok(page.includes('href="/build?script=!door(threshold)%5Bajar%5D%7Bhinge.frame.key%7D#pivot-mark"'), 'mark pivot holds the rest, and lands on its own row');
  assert.match(page, /<form class="slots" method="get" action="\/build#build">/);
  assert.match(page, /data-tool="copy"/);
  const three = await (await get('spw.quest', '/build?definition=hinge%2C%20frame%2C%20key')).text();
  assert.match(three, /3 parts/);
  const hostile = await (await get('spw.quest', '/build?mark=%3Cscript%3E&word=a%7Bb%7D&mode=x%5Dy')).text();
  assert.match(hostile, /aria-label="ab\(morning\)\[xy\]\{hinge, frame, key\}"/);
  assert.ok(!hostile.includes('&lt;script'), 'a mark outside the twelve is dropped, not echoed');
  const guide = await (await get('spw.quest', '/')).text();
  assert.match(guide, /<section id="build" aria-labelledby="build-title">/);
});

test('a script can be formatted and downloaded', async () => {
  const spaced = "~ door ( morning ) [ closed ] { hinge , frame , key }";
  const form = new URLSearchParams({ script: spaced, filename: "door.spw", tool: "format" });
  const formatted = await get('spw.quest', '/build', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  assert.equal(formatted.status, 200);
  const page = await formatted.text();
  assert.match(page, />~door\(morning\)\[closed\]\{hinge, frame, key\}\n?<\/textarea>/);
  const download = await get('spw.quest', '/script.spw?word=door&scene=morning&mode=closed&definition=hinge%2C%20frame%2C%20key');
  assert.equal(download.status, 200);
  assert.equal(download.headers.get('content-type'), 'text/plain; charset=UTF-8');
  assert.equal(download.headers.get('content-disposition'), 'attachment; filename="door.spw"');
  assert.equal(await download.text(), '~door(morning)[closed]{hinge, frame, key}\n');
  const posted = await get('spw.quest', '/script.spw', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ script: '#>notes\n', filename: '../notes.spw', tool: 'download' }),
  });
  assert.equal(posted.headers.get('content-disposition'), 'attachment; filename="notes.spw"');
  assert.equal(await posted.text(), '#>notes\n');
  const rejected = await get('spw.quest', '/build', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ script: 'door[ {', tool: 'format' }),
  });
  assert.match(await rejected.text(), />door\[ \{\n?<\/textarea>/);
});

test('the script leads: a swap rewrites only its focus line, and any script has an address', async () => {
  const script = '#>notes\n\n  ~door(morning)[closed]{hinge, frame, key}\n@yesterday: ~"./y.spw"';
  const page = await (await get('spw.quest', `/build?script=${encodeURIComponent(script)}`)).text();
  assert.ok(page.includes(`>${escapeHtml(script)}</textarea>`), 'the script opens whole');
  const ajar = decodeURIComponent(page.match(/href="\/build\?script=([^"#]*)#pivot-mode">\[ajar\]/)[1]);
  assert.equal(ajar, '#>notes\n\n  ~door(morning)[ajar]{hinge, frame, key}\n@yesterday: ~"./y.spw"', 'only the focus line changed, indentation kept');
  const slotted = await (await get('spw.quest', `/build?script=${encodeURIComponent(script)}&mark=%3F`)).text();
  assert.ok(slotted.includes(`>${escapeHtml(script.replace('~door', '?door'))}</textarea>`), 'a slot parameter rewrites the focus line of the given script');
  assert.match(page, /<a class="share" href="\/build\?script=/);
  assert.match(page, /<button type="submit" name="tool" value="read" data-tool="read">Read<\/button>/);
  assert.match(page, /<ul class="snippets"/);
  assert.match(page, /href="\/parser\/"/);
  const download = await get('spw.quest', `/script.spw?script=${encodeURIComponent(script)}&filename=notes`);
  assert.equal(await download.text(), `${script}\n`);
  assert.equal(download.headers.get('content-disposition'), 'attachment; filename="notes.spw"');
});
