import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { CLIENT_SCRIPT } from '../src/client.js';
import { contrast, readConfig, subjectFor } from '../src/config.js';
import { LISTED, isOwnSite, normalizeHost } from '../src/model.js';

const get = (host, path, options) => worker.fetch(new Request(`https://${host}${path}`, options));
const page = async (path, options) => (await get('autonomous.feedback', path, options)).text();
const form = (fields, headers = {}) => ({
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
  body: new URLSearchParams(fields),
});
const NOTE = 'The folio page loads slowly on my phone.';

const decode = (text) => text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
/** What a card page made: the card's data, its text, and whether it carries words. */
function cardOf(html) {
  const tag = html.match(/<article class="card" id="card"[^>]*>/)?.[0] || '';
  const attr = (name) => {
    const value = tag.match(new RegExp(` data-${name}="([^"]*)"`))?.[1];
    return value === undefined ? null : decode(value);
  };
  return {
    kind: attr('kind'),
    site: attr('site'),
    host: attr('host'),
    address: attr('address'),
    note: attr('note'),
    subject: decode(html.match(/<span class="card-subject">([^<]*)<\/span>/)?.[1] || ''),
    slip: decode(html.match(/<pre id="slip">([\s\S]*?)<\/pre>/)?.[1] || ''),
    worded: !/No written detail/.test(html),
  };
}

/** Serve client files for named hosts and record every host asked; everything else is a 404 or a fast 200 homepage. */
function stubFetch(files = {}) {
  const real = globalThis.fetch;
  const asked = [];
  globalThis.fetch = async (input) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    asked.push(url.hostname);
    if (url.pathname === '/.well-known/autonomous-feedback.json') {
      const file = files[url.hostname];
      if (!file) return new Response('missing', { status: 404 });
      const response = new Response(JSON.stringify(file), { status: 200, headers: { 'content-type': 'application/json' } });
      Object.defineProperty(response, 'url', { value: url.href });
      return response;
    }
    return new Response(null, { status: 200 });
  };
  const restore = () => { globalThis.fetch = real; };
  restore.asked = asked;
  return restore;
}

test('a pasted link becomes a domain, and only the listed sites take notes', () => {
  assert.equal(normalizeHost('https://www.Spwashi.com/about?x=1#top'), 'spwashi.com');
  assert.equal(normalizeHost('  lore.land:8080/ '), 'lore.land');
  assert.equal(normalizeHost(''), '');
  assert.ok(isOwnSite('spw.quest'));
  assert.ok(!isOwnSite('example.org'));
  assert.ok(LISTED.every(isOwnSite));
});

test('the home page names the sites and says nothing is stored', async () => {
  const restore = stubFetch();
  try {
    const home = await page('/');
    assert.match(home, /<h1>A note about a page<\/h1>/);
    assert.match(home, /Nothing is stored\. A reply is not promised\./);
    for (const host of LISTED) assert.match(home, new RegExp(`href="/${host.replace('.', '\\.')}"`));
    const main = home.slice(home.indexOf('<main'));
    assert.doesNotMatch(main, /<form|Run a site|\/start|\/meter|inbox|desk/i);
    const privacy = await page('/privacy');
    assert.match(privacy, /<h1>What happens to a note<\/h1>/);
    assert.match(privacy, /Nothing you write is stored\./);
    assert.match(privacy, /no accounts, no cookies, and no counts/);
    assert.doesNotMatch(privacy.slice(privacy.indexOf('<main')), /inbox|three days|owner/i);
    assert.equal(restore.asked.length, 0);
  } finally {
    restore();
  }
});

test('a site that is not one of these gets no form and is never fetched', async () => {
  const restore = stubFetch();
  try {
    const other = await get('autonomous.feedback', '/example.org/broken');
    assert.equal(other.status, 404);
    const html = await other.text();
    assert.match(html, /<h1>No form for example\.org<\/h1>/);
    assert.match(html, /href="\/spwashi\.com"/);
    const posted = await get('autonomous.feedback', '/example.org', form({ kind: 'broken', note: NOTE }));
    assert.equal(posted.status, 404);
    assert.doesNotMatch(await posted.text(), /class="card"/);
    assert.ok(!restore.asked.includes('example.org'));
  } finally {
    restore();
  }
});

test('what the desk, setup, meter, frame, and climate answered is gone', async () => {
  const restore = stubFetch();
  try {
    for (const path of ['/desk', '/start', '/start/spwashi.com', '/meter', '/now', '/climate.json', '/ready', '/alerts.json', '/spwashi.com/inbox', '/spwashi.com/config.json', '/spwashi.com/broken.json', '/embed/spwashi.com', '/https://spwashi.com/broken']) {
      const response = await get('autonomous.feedback', path);
      assert.equal(response.status, 404, path);
    }
    const tenant = await get('acme.autonomous.feedback', '/spwashi.com', form({ kind: 'broken', note: NOTE }));
    assert.equal(tenant.status, 200);
    assert.doesNotMatch(await tenant.text(), /account:|acme/);
    const health = await (await get('autonomous.feedback', '/health')).json();
    assert.equal(health.ok, true);
  } finally {
    restore();
  }
});

test('the write page is a labelled form with the kind as a choice', async () => {
  const restore = stubFetch();
  try {
    const write = await page('/spw.quest/question');
    assert.match(write, /<h1 class="write-title">A note for spw\.quest<\/h1>/);
    assert.match(write, /href="https:\/\/spw\.quest\/">Open spw\.quest</);
    // One choice, one group: the link's kind is checked in it, and choosing never rewrites the address.
    assert.match(write, /name="what" value="kind:question" checked/);
    assert.match(write, /<fieldset id="what" class="chips what">/);
    assert.match(write, /data-clear-what hidden>Clear the choice</);
    assert.match(write, /<p class="sr-only" id="note-hint">[^<]*Optional once you pick something above\./);
    assert.match(write, /<label for="note" class="question" data-fill="prompt"[^>]*>What you need the person who runs the site to answer\.<\/label>/);
    assert.match(write, /<article class="card live" data-live-card[\s\S]*<span class="card-kind" data-live="kind">Question<\/span>[\s\S]*<textarea class="card-write" id="note" name="note"/);
    assert.match(write, /You keep the card for spw\.quest\. Nothing is stored, and a reply is not promised\. <a href="\/privacy">What happens to a note<\/a>/);
    assert.match(write, />Make my card</);
    // The address names the site; the form does not send it again.
    assert.doesNotMatch(write, /name="host"/);
    assert.match(write, /placeholder="I have a question about this\."/);
    assert.doesNotMatch(write, /class="hp"|Run a site|\/start|checkout|Pay|cart/);
    const bare = await page('/spw.quest');
    assert.doesNotMatch(bare, /name="what" value="[a-z:]+" checked/);
    assert.match(bare, /What happened, and where were you\?/);
    assert.equal((await get('autonomous.feedback', '/broken')).status, 302);
    assert.equal((await get('autonomous.feedback', '/broken?host=spw.quest')).headers.get('location'), 'https://autonomous.feedback/spw.quest/broken');
    assert.equal((await get('autonomous.feedback', '/broken?host=example.org')).headers.get('location'), 'https://autonomous.feedback/');
    const moved = await get('autonomous.feedback', '/WWW.Spw.Quest/broken');
    assert.equal(moved.status, 301);
    assert.equal(moved.headers.get('location'), 'https://autonomous.feedback/spw.quest/broken');
    // The URL names the kind by its label; old slugs move to the matching address.
    assert.equal((await get('autonomous.feedback', '/spw.quest/brief')).headers.get('location'), 'https://autonomous.feedback/spw.quest/question');
    assert.equal((await get('autonomous.feedback', '/spw.quest/problem')).headers.get('location'), 'https://autonomous.feedback/spw.quest/broken');
    assert.equal((await get('autonomous.feedback', '/spw.quest/broken')).headers.get('x-frame-options'), 'DENY');
  } finally {
    restore();
  }
});

test('words never ride in an address', async () => {
  const restore = stubFetch();
  try {
    const carried = await page('/spw.quest?note=The%20guide%20lost%20me%20here.');
    assert.doesNotMatch(carried, /The guide lost me here\./);
    assert.match(carried, /<form method="post" action="\/spw\.quest"/);
  } finally {
    restore();
  }
});

test('a rejected note comes back in the form', async () => {
  const restore = stubFetch();
  try {
    const short = await get('autonomous.feedback', '/spw.quest', form({ note: '<b>no' }));
    assert.equal(short.status, 400);
    const html = await short.text();
    assert.match(html, /class="error-summary" role="alert"/);
    assert.match(html, /Tap one of the choices above, or write a few more words \(at least 8 characters\)\./);
    assert.match(html, /aria-invalid="true"/);
    assert.match(html, />&lt;b&gt;no<\/textarea>/);
    const typed = await get('autonomous.feedback', '/spw.quest', form({ kind: 'broken', note: '<b>no' }));
    assert.equal(typed.status, 200);
    const onlyType = cardOf(await page('/spw.quest/broken', form({})));
    assert.equal(onlyType.kind, 'Broken');
    assert.equal(onlyType.worded, false);
    assert.match(onlyType.slip, /Something here is broken\./);
    const unread = await get('autonomous.feedback', '/spw.quest/broken', { method: 'POST', body: 'unparsed', headers: { 'content-type': 'application/json' } });
    assert.equal(unread.status, 400);
  } finally {
    restore();
  }
});

test('a note becomes a card that names the page it is about, and nothing is stored', async () => {
  const restore = stubFetch();
  try {
    const html = await page('/spw.quest', form({ kind: 'appreciation', path: '/learn', note: 'The walk on the learn page <b>kept</b> going.' }));
    assert.match(html, /<h1>Your card is ready<\/h1>/);
    assert.match(html, /class="card-kind">Appreciation</);
    assert.match(html, /class="card-site">spw\.quest</);
    assert.match(html, /&lt;b&gt;kept&lt;\/b&gt;/);
    assert.doesNotMatch(html, /<b>kept<\/b>/);
    assert.match(html, /data-save-image hidden/);
    assert.match(html, /data-stamp><\/p>/);
    assert.match(html, /Nothing was stored\. The card lives on this page and in whatever you save or send\./);
    // The card's address is the work, not this form.
    const card = cardOf(html);
    assert.equal(card.address, 'spw.quest/learn');
    assert.equal(card.host, 'spw.quest');
    assert.match(html, /<span class="card-address">spw\.quest\/learn<\/span>/);
    const body = html.slice(html.indexOf('<main'));
    assert.doesNotMatch(body, /autonomous\.feedback\/spw\.quest|via autonomous|Sent to|inbox/);
    assert.match(html, /href="https:\/\/bsky\.app\/intent\/compose\?text=Appreciation%20for%20spw\.quest%2Flearn%3A%20/);
    assert.match(card.slip, /^# Appreciation for spw\.quest/);
    assert.match(card.slip, /about: https:\/\/spw\.quest\/learn/);
    assert.doesNotMatch(card.slip, /via:|account:/);
    // A kind named in the body wins, and an old slug still works there.
    assert.equal(cardOf(await page('/spw.quest/broken', form({ kind: 'question', note: 'Can I read this without the sound on?' }))).kind, 'Question');
    assert.equal(cardOf(await page('/spw.quest', form({ kind: 'practice', note: 'A dark mode would help at night.' }))).kind, 'Confusing');
  } finally {
    restore();
  }
});

test('a client file shapes the form and the theme', async () => {
  const restore = stubFetch({
    'wap.mom': {
      schema: 'autonomous-feedback.client.v0',
      host: 'wap.mom',
      name: 'Wap',
      title: 'What was hard to read?',
      intro: 'Tell us what broke.',
      kinds: ['broken', 'question', 'nonsense', 'brief'],
      labels: { broken: { title: 'Misprint', prompt: 'What broke, and on which page?' } },
      routes: [{ name: 'Cabinet', path: '/cabinet' }],
      from: 'required',
      contact: { bluesky: '@Wap.Mom', x: 'wap_mom', mastodon: '@wap@example.social' },
      button: 'Make it',
      note: { min: 20, max: 500 },
      queue: { want: true },
      inbox: { key: `sha256:${'a'.repeat(64)}` },
      frame: { ancestors: ['https://blog.wap.mom'] },
      theme: { mode: 'light', background: '#ffffff', text: '#111111', accent: '#fafafa', corners: 'sharp', font: 'serif' },
    },
    'bone.land': { schema: 'autonomous-feedback.client.v0', host: 'wap.mom', name: 'Imposter' },
  });
  try {
    const write = await page('/wap.mom');
    assert.match(write, /<h1 class="write-title">What was hard to read\?<\/h1>/);
    assert.match(write, /Tell us what broke\./);
    assert.match(write, /<span>Misprint<\/span>/);
    assert.doesNotMatch(write, /Appreciation/);
    assert.match(write, /id="from"[^>]*required/);
    assert.doesNotMatch(write, /at least 20 characters/);
    const short = await page('/wap.mom', form({ note: 'Too short', from: 'A reader' }));
    assert.match(short, /at least 20 characters/);
    assert.match(write, /maxlength="500"/);
    assert.match(write, />Make it</);
    assert.match(write, /--bg:#ffffff/);
    assert.match(write, /--accent:#0f766e/);
    assert.match(write, /--radius:\.2rem/);
    const missingFrom = await get('autonomous.feedback', '/wap.mom', form({ kind: 'broken', note: 'The cabinet empties itself on refresh.' }));
    assert.equal(missingFrom.status, 400);
    assert.match(await missingFrom.text(), /Add your name or handle/);
    const wrongKind = await get('autonomous.feedback', '/wap.mom', form({ kind: 'appreciation', from: 'Ana', note: 'I love the new printed issue.' }));
    assert.equal(wrongKind.status, 400);
    assert.match(await wrongKind.text(), /Wap does not take appreciation notes/);
    const html = await page('/wap.mom', form({ kind: 'broken', from: 'Ana', path: '/cabinet', note: 'The cabinet empties itself on refresh.' }));
    const card = cardOf(html);
    assert.equal(card.site, 'Wap');
    assert.equal(card.kind, 'Misprint');
    assert.match(html, /— Ana/);
    assert.match(html, /Cabinet · \/cabinet/);
    // The site's own contacts: Message buttons, and Post links that mention them.
    assert.match(html, /<h2 id="send-title">Send it to Wap<\/h2>/);
    assert.match(html, /href="https:\/\/bsky\.app\/profile\/wap\.mom"><strong>Message on Bluesky<\/strong><span>@wap\.mom</);
    assert.match(html, /href="https:\/\/x\.com\/wap_mom"><strong>Message on X<\/strong>/);
    assert.match(html, /intent\/compose\?text=%40wap\.mom%20/);
    // A file for another host configures nothing.
    assert.match(await page('/bone.land'), /A note for bone\.land/);
  } finally {
    restore();
  }
});

test('a client file is read within reason, and fields this form no longer reads are ignored', () => {
  assert.ok(contrast('#000000', '#ffffff') > 20);
  const config = readConfig({ schema: 'autonomous-feedback.client.v0', host: 'spwashi.com', theme: { background: '#777777', text: '#888888' } }, 'spwashi.com');
  assert.equal(config.theme.background, '#0a1012');
  assert.ok(config.problems.some((p) => /below 4\.5:1/.test(p)));
  const legacy = readConfig({ schema: 'autonomous-feedback.client.v0', host: 'spwashi.com', queue: { want: true }, inbox: { key: 'a secret' }, frame: { ancestors: ['https://x.example'] } }, 'spwashi.com');
  assert.equal(legacy.queue, undefined);
  assert.equal(legacy.inbox, undefined);
  assert.equal(legacy.frame, undefined);
  assert.doesNotMatch(JSON.stringify(legacy), /a secret/);
  const imposter = readConfig({ schema: 'autonomous-feedback.client.v0', host: 'lore.land', name: 'Imposter' }, 'spwashi.com');
  assert.equal(imposter.found, false);
  assert.equal(imposter.name, '');
});

test('the page script compiles and holds no setup, key, or desk code', () => {
  assert.doesNotThrow(() => new Function(CLIENT_SCRIPT));
  assert.match(CLIENT_SCRIPT, /input\[name="what"\]:checked/);
  assert.match(CLIENT_SCRIPT, /\[data-copy\]/);
  assert.doesNotMatch(CLIENT_SCRIPT, /keygen|inbox|setup-data|owner-snippet|begin-site/);
});

test('the write page names the page the reader came from, when the Referer is the site', async () => {
  const restore = stubFetch({
    'wap.mom': { schema: 'autonomous-feedback.client.v0', host: 'wap.mom', routes: [{ name: 'Cabinet', path: '/cabinet' }] },
  });
  const call = (path, headers = {}) => worker.fetch(new Request(`https://autonomous.feedback${path}`, { headers }));
  try {
    const named = await (await call('/wap.mom/broken', { referer: 'https://www.wap.mom/cabinet?drawer=8812#top' })).text();
    assert.match(named, /On <strong>Cabinet · \/cabinet<\/strong>/);
    assert.match(named, /<summary>Change or clear the page<\/summary>/);
    assert.doesNotMatch(named, /8812/);
    assert.match(named, /<span class="card-address">wap\.mom\/cabinet<\/span>/);
    const unnamed = await (await call('/wap.mom/broken', { referer: 'https://wap.mom/issues/3' })).text();
    assert.match(unnamed, /On <strong>\/issues\/3<\/strong>/);
    assert.doesNotMatch(await (await call('/wap.mom/broken', { referer: 'https://elsewhere.example/cabinet' })).text(), /class="page-known"/);
    // An origin-only Referer cannot be told from "unknown".
    assert.doesNotMatch(await (await call('/wap.mom/broken', { referer: 'https://wap.mom/' })).text(), /class="page-known"/);
    assert.match(await (await call('/wap.mom/broken?at=/about', { referer: 'https://wap.mom/cabinet' })).text(), /On <strong>\/about<\/strong>/);
    const card = cardOf(await (await worker.fetch(new Request('https://autonomous.feedback/wap.mom/broken', form({ note: NOTE }, { referer: 'https://wap.mom/cabinet' })))).text());
    assert.equal(card.address, 'wap.mom/cabinet');
    assert.match(card.slip, /page: Cabinet \/cabinet/);
  } finally {
    restore();
  }
});

const MAPPED = {
  schema: 'autonomous-feedback.client.v0',
  host: 'spwashi.com',
  name: 'Maker',
  subjects: [
    {
      id: 'folios', name: 'Folios', paths: ['/design/folios'], prompt: 'Which folio, and what happened?',
      kinds: ['broken', 'appreciation'],
      asks: ['Which folio were you looking at?', 'What did you expect next?'],
      threads: [{ id: 'order-by-card', name: 'Ordering is by card', stance: 'On purpose for now.', link: '/design/folios/#request' }],
    },
    { id: 'recipes', name: 'Recipes', paths: ['/recipes'], prompt: 'Which recipe?' },
    { id: 'BAD ID', name: 'Nope' },
  ],
};

test('a client file maps the creator\'s subjects, threads, and asks, within limits', () => {
  const config = readConfig(MAPPED, 'spwashi.com');
  assert.deepEqual(config.subjects.map((s) => s.id), ['folios', 'recipes']);
  assert.ok(config.problems.some((p) => /Each subject needs an id/.test(p)));
  assert.equal(config.subjects[0].threads[0].stance, 'On purpose for now.');
  assert.equal(subjectFor(config, '/design/folios/wonder-about-pie')?.id, 'folios');
  assert.equal(subjectFor(config, '/design/foliosaurus'), null);
  assert.equal(subjectFor(config, '/recipes'), config.subjects[1]);
  assert.equal(subjectFor(config, '/'), null);
});

test('about decides whether the note is about the site or the subject', async () => {
  const siteFile = { ...MAPPED, about: 'site', title: 'What happened on the site?' };
  const workFile = { ...MAPPED, host: 'lore.land', about: 'subject', title: 'A note about the lore' };
  assert.equal(readConfig(siteFile, 'spwashi.com').about, 'site');
  assert.equal(readConfig(workFile, 'lore.land').about, 'subject');
  const rejected = readConfig({ schema: 'autonomous-feedback.client.v0', host: 'spwashi.com', about: 'lore' }, 'spwashi.com');
  assert.equal(rejected.about, '');
  assert.ok(rejected.problems.some((problem) => /about must be/.test(problem)));
  const restore = stubFetch({ 'spwashi.com': siteFile, 'lore.land': workFile });
  try {
    const sitePage = await (await worker.fetch(new Request('https://autonomous.feedback/spwashi.com/broken', { headers: { referer: 'https://spwashi.com/design/folios/' } }))).text();
    assert.match(sitePage, /<h1 class="write-title">What happened on the site\?<\/h1>/);
    assert.match(sitePage, /On <strong data-fill="subject-name">Folios<\/strong>/);
    assert.match(sitePage, /Where on the site\?/);
    assert.match(sitePage, /Often said about this part/);
    assert.ok(sitePage.indexOf('id="what-kinds"') < sitePage.indexOf('id="what-folios"'));
    const workPage = await (await worker.fetch(new Request('https://autonomous.feedback/lore.land', { headers: { referer: 'https://lore.land/design/folios/' } }))).text();
    assert.match(workPage, /<h1 class="write-title">A note about the lore<\/h1>/);
    assert.match(workPage, /About <strong data-fill="subject-name">Folios<\/strong>/);
    assert.match(workPage, /What is this about\?/);
    assert.match(workPage, /Often said about Folios/);
    assert.ok(workPage.indexOf('id="what-folios"') < workPage.indexOf('id="what-kinds"'));
  } finally {
    restore();
  }
});

test('the write page picks the subject from the page, and follows it with threads and asks', async () => {
  const restore = stubFetch({ 'spwashi.com': MAPPED });
  try {
    const html = await (await worker.fetch(new Request('https://autonomous.feedback/spwashi.com/broken', { headers: { referer: 'https://spwashi.com/design/folios/' } }))).text();
    assert.match(html, /name="subject" value="folios" checked/);
    assert.match(html, /Which folio, and what happened\?/);
    assert.match(html, /<p class="row-caption" id="what-folios">Often said about Folios<\/p>/);
    assert.match(html, /name="what" value="thread:folios:order-by-card" data-kind-title="Note" data-about="Folios · Ordering is by card" data-body="Count me too\."/);
    assert.match(html, /About <strong data-fill="subject-name">Folios<\/strong>/);
    assert.match(html, /<strong>Maker:<\/strong> On purpose for now\./);
    assert.match(html, /<summary>Say more<\/summary>/);
    assert.match(html, /name="ask-0"/);
    // The subject's kinds hide the rest, and the rules ride in the page's own style.
    assert.match(html, /label\.chip\[data-kind\]:not\(\[data-kind="broken"\], \[data-kind="appreciation"\]\):not\(:has\(input:checked\)\) \{ display: none; \}/);
    const bare = await (await worker.fetch(new Request('https://autonomous.feedback/spwashi.com/broken'))).text();
    assert.doesNotMatch(bare, /name="subject" value="[a-z]+" checked/);
  } finally {
    restore();
  }
});

test('a thread can be joined without words, and asks land on the card and in its text', async () => {
  const restore = stubFetch({ 'spwashi.com': MAPPED });
  const send = async (fields) => page('/spwashi.com/broken', form(fields));
  try {
    const counted = cardOf(await send({ subject: 'folios', thread: 'folios:order-by-card' }));
    assert.equal(counted.worded, false);
    assert.equal(counted.subject, 'Folios · Ordering is by card');
    assert.match(counted.slip, /Count me too\./);
    assert.match(counted.slip, /thread: Ordering is by card/);
    const asked = await send({ subject: 'folios', note: 'The order card did not tell me what happens next.', 'ask-0': 'The pie one.', 'ask-1': 'A reply within a week.', thread: 'folios:order-by-card' });
    assert.match(asked, /<span class="card-subject">Folios · Ordering is by card<\/span>/);
    assert.match(asked, /<dt>Which folio were you looking at\?<\/dt><dd>The pie one\.<\/dd>/);
    assert.match(asked, /Maker has said about this<\/h2>/);
    assert.match(cardOf(asked).slip, /## Which folio were you looking at\?\nThe pie one\./);
    const wrong = await get('autonomous.feedback', '/spwashi.com/broken', form({ subject: 'nope', note: 'Something long enough to send here.' }));
    assert.equal(wrong.status, 400);
    assert.match(await wrong.text(), /Choose one of the parts of the site listed, or leave it blank\./);
  } finally {
    restore();
  }
});

test('a kind comes from evidence: the writer, the common note, or a thanks; otherwise the note stays unsorted', async () => {
  const file = JSON.parse(JSON.stringify(MAPPED));
  file.subjects[0].threads[0].kind = 'question';
  const restore = stubFetch({ 'spwashi.com': file });
  const send = async (fields) => cardOf(await page('/spwashi.com', form(fields)));
  try {
    assert.equal((await send({ note: 'Nothing chosen, just a few words.' })).kind, 'Note');
    assert.equal((await send({ subject: 'folios', thread: 'folios:order-by-card' })).kind, 'Question');
    const thanked = await send({ thread: 'thanks' });
    assert.equal(thanked.kind, 'Appreciation');
    assert.equal(thanked.worded, false);
    assert.equal((await send({ kind: 'broken', subject: 'folios', thread: 'folios:order-by-card', note: 'Chosen by me, with words.' })).kind, 'Broken');
    assert.match(await page('/spwashi.com', form({})), /Tap one of the choices above, or write what happened\./);
  } finally {
    restore();
  }
});

test('the form sends one choice, and a common note left over from another subject is dropped, not an error', async () => {
  const restore = stubFetch({ 'spwashi.com': MAPPED });
  const send = (fields) => get('autonomous.feedback', '/spwashi.com', form(fields));
  try {
    const thread = cardOf(await (await send({ subject: 'folios', what: 'thread:folios:order-by-card' })).text());
    assert.equal(thread.subject, 'Folios · Ordering is by card');
    assert.equal(thread.worded, false);
    assert.equal(cardOf(await (await send({ what: 'kind:broken' })).text()).kind, 'Broken');
    assert.equal(cardOf(await (await send({ what: 'thanks' })).text()).kind, 'Appreciation');
    // Without script, switching the subject leaves the old common note checked but hidden; it is ignored.
    const stale = await send({ subject: 'recipes', what: 'thread:folios:order-by-card', note: 'Words about recipes instead.' });
    assert.equal(stale.status, 200);
    const staleCard = cardOf(await stale.text());
    assert.equal(staleCard.subject, 'Recipes');
    assert.doesNotMatch(staleCard.slip, /thread:/);
    const staleOnly = await send({ subject: 'recipes', what: 'thread:folios:order-by-card' });
    assert.equal(staleOnly.status, 400);
    assert.match(await staleOnly.text(), /Tap one of the choices above, or write what happened\./);
  } finally {
    restore();
  }
});

test('a rejected note still shows the page it will name', async () => {
  const restore = stubFetch({
    'wap.mom': { schema: 'autonomous-feedback.client.v0', host: 'wap.mom', routes: [{ name: 'Cabinet', path: '/cabinet' }] },
  });
  try {
    const rejected = await worker.fetch(new Request('https://autonomous.feedback/wap.mom', form({ note: 'short' }, { referer: 'https://wap.mom/cabinet?drawer=8812' })));
    assert.equal(rejected.status, 400);
    const html = await rejected.text();
    assert.match(html, /On <strong>Cabinet · \/cabinet<\/strong>/);
    assert.match(html, /<summary>Change or clear the page<\/summary>/);
    assert.match(html, /id="path" name="path" type="text" value="\/cabinet"/);
    assert.doesNotMatch(html, /8812/);
    // With no page, the question stays one optional line.
    assert.match(await page('/wap.mom', form({ note: 'short' })), /<summary>Which page\? Optional\.<\/summary>/);
  } finally {
    restore();
  }
});

test('the card can be read and copied as text with script off', async () => {
  const restore = stubFetch();
  try {
    const card = await page('/spw.quest', form({ kind: 'broken', note: 'The next button spun, then the page went blank.' }));
    assert.match(card, /<details class="slip">\s*<summary>The card as text<\/summary>/);
    assert.match(card, /<pre id="slip"># Broken for spw\.quest/);
    assert.doesNotMatch(card, /id="slip" hidden/);
    // A button that needs script waits for it, like Save image and Share.
    assert.match(card, /<button type="button" class="door" data-copy="slip" hidden>/);
  } finally {
    restore();
  }
});
