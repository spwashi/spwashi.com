/** Run against npm run dev: node scripts/check-interaction-cache.mjs [base]. */
import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import {
  CdpSession, resolveChrome, createChromeProfileDir, pickFreePort, openChrome,
  newPageTarget, applyViewport, VIEWPORTS, evaluateProbe, killProcessTree, waitForHttp,
} from './lib/chrome-headless-harness.mjs';

const base = process.argv[2] || 'http://127.0.0.1:4173';
await waitForHttp(base);
const port = await pickFreePort();
const profile = await createChromeProfileDir('spw-interaction-cache-');
const chrome = await openChrome(await resolveChrome(), profile, port);
let session;
try {
  session = new CdpSession((await newPageTarget(port)).webSocketDebuggerUrl);
  await session.open();
  await session.send('Page.enable');
  await session.send('Page.bringToFront');
  await session.send('Emulation.setFocusEmulationEnabled', { enabled: true });
  const evaluate = async expression => (await evaluateProbe(session,
    `(async () => ({ value: await (${expression}) }))()`, 20000)).value;
  for (const viewport of [VIEWPORTS.pocket, VIEWPORTS.desktop]) {
    await applyViewport(session, viewport);
    // Disable without maxTouchPoints=0, which Chrome rejects on some versions.
    if (!viewport.hasTouch) await session.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    await session.send('Page.navigate', { url: `${base}/scripts/tests/fixtures/hypermedia.html` });
    let ready = false;
    for (let i = 0; i < 100; i++) {
      ready = await evaluate(`document.readyState === 'complete' && !!document.getElementById('probe')`);
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready, 'fixture loaded');
    const result = await evaluate(`(async () => {
      const { initInteractionProgression } = await import('/public/js/runtime/interaction/progression.js');
      const html = document.documentElement;
      const probe = document.getElementById('probe');
      probe.dataset.spwVocabularyTerm = 'frame';
      const handle = document.createElement('aside');
      handle.className = 'spw-section-handle-shell';
      handle.dataset.spwHandleOp = 'frame';
      handle.textContent = 'Section handle';
      document.body.append(handle);
      const events = [];
      document.addEventListener('spw:interaction-phase', event => events.push(event.detail));
      const NativeObserver = window.MutationObserver;
      let observers = 0;
      window.MutationObserver = class extends NativeObserver {
        constructor(callback) { super(callback); observers++; }
      };
      let cleanup = initInteractionProgression();
      window.MutationObserver = NativeObserver;
      const tick = () => new Promise(resolve => setTimeout(resolve, 0));
      await tick();
      events.length = 0;
      const image = document.createElement('figure');
      document.body.append(image);
      probe.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      probe.dataset.spwGesture = 'armed';
      probe.dataset.spwLoopState = 'preview';
      image.dataset.spwImageInteractionState = 'primed';
      image.dataset.spwImageInteractionState = 'inspecting';
      await tick();
      const batch = { count: events.length, phase: html.dataset.spwInteractionPhase };
      image.dataset.spwImageInteractionState = 'idle';
      await tick();
      const imageReset = html.dataset.spwInteractionPhase;
      document.dispatchEvent(new CustomEvent('spw:loading-ecology', { detail: { phase: 'settled' } }));
      await tick();
      probe.dataset.spwLoopState = 'preview';
      await tick();
      const restarted = html.dataset.spwInteractionPhase;
      image.dataset.spwImageInteractionState = 'discovered';
      document.dispatchEvent(new CustomEvent('spw:discovery-reward'));
      cleanup();
      events.length = 0;
      await tick();
      const cleaned = events.length === 0 && !html.hasAttribute('data-spw-interaction-phase');
      cleanup = initInteractionProgression();
      await tick();
      events.length = 0;
      document.dispatchEvent(new CustomEvent('spw:section-locomotion-state', {
        detail: { source: 'next', currentId: 'last' },
      }));
      await tick();
      const remounted = events.some(event => event.source === 'section-travel');
      const nav = document.createElement('nav');
      nav.className = 'spw-page-landmarks';
      nav.innerHTML = '<a href="#first" aria-current="location">First</a><a href="#last">Last</a>';
      document.body.append(nav);
      const pointer = (type, x) => nav.dispatchEvent(new PointerEvent(type, {
        bubbles: true, cancelable: true, clientX: x, clientY: 20,
      }));
      pointer('pointerdown', 100);
      pointer('pointercancel', 20);
      await tick();
      const cancelled = !location.hash;
      pointer('pointerdown', 100);
      pointer('pointerup', 53);
      await tick();
      const shortSwipe = !location.hash;
      pointer('pointerdown', 100);
      pointer('pointerup', 52);
      await tick();
      const landmarkSwipe = location.hash === '#last';
      window.interactionCleanup = cleanup;
      window.interactionTick = tick;
      return { observers, batch, imageReset, restarted, cleaned, remounted, cancelled, shortSwipe, landmarkSwipe };
    })()`);
    assert.equal(result.observers, 1, 'one progression observer');
    assert.deepEqual(result.batch, { count: 1, phase: 'inspect' }, 'event and dynamic image mutations commit once');
    assert.equal(result.imageReset, 'idle', 'image reset remains direct');
    assert.equal(result.restarted, 'prime', 'fresh interaction restarts after settle');
    for (const key of ['cleaned', 'remounted', 'cancelled', 'shortSwipe', 'landmarkSwipe']) {
      assert.equal(result[key], true, key);
    }

    // Real mouse hover on fine pointers; touch-pointer entry must stay inert.
    await evaluate(`document.getElementById('probe').scrollIntoView({block:'center', behavior:'instant'})`);
    const rect = await evaluate(`(() => { const r = document.getElementById('probe').getBoundingClientRect();
      return {x:r.x+r.width/2, y:r.y+r.height/2}; })()`);
    await session.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...rect });
    await evaluate('window.interactionTick()');
    assert.equal(await evaluate(`document.documentElement.dataset.spwVocabularyHover === 'true'`), viewport.id === 'desktop');
    await session.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 });
    await session.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await session.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await evaluate(`(document.getElementById('probe').focus(), window.interactionTick())`);
    assert.equal(await evaluate(`document.documentElement.dataset.spwVocabularyHover`), 'true', 'keyboard focus engages tint');
    await session.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...rect });
    await session.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1, y: 1 });
    await evaluate('window.interactionTick()');
    assert.equal(await evaluate(`document.documentElement.dataset.spwVocabularyHover`), 'true', 'pointer exit preserves keyboard focus');
    for (const mode of ['light', 'dark']) {
      await evaluate(`document.documentElement.dataset.spwColorMode = '${mode}'`);
      const palette = await evaluate(`(() => {
        const style = getComputedStyle(document.querySelector('.spw-section-handle-shell'));
        const base = style.getPropertyValue('--spw-handle-base-op-color').trim();
        const active = style.getPropertyValue('--active-op-color').trim();
        const probe = style.getPropertyValue('--op-probe-color').trim();
        const sample = document.createElement('span');
        document.body.append(sample);
        sample.style.color = 'color-mix(in srgb, ' + base + ' 15%, ' + probe + ')';
        const expected = getComputedStyle(sample).color;
        sample.style.color = active;
        const resolved = getComputedStyle(sample).color;
        sample.remove();
        return { base, active, expected, resolved };
      })()`);
      assert.ok(palette.base && palette.active, 'palette tokens are present');
      assert.equal(palette.resolved, palette.expected, 'tint resolves to the intended color mix');
    }
    await evaluate(`(document.getElementById('outside').focus(), window.interactionTick())`);
    assert.equal(await evaluate(`document.documentElement.hasAttribute('data-spw-vocabulary-hover')`), false, 'leaving vocabulary clears tint');
    await evaluate(`(document.getElementById('probe').focus(), window.interactionTick())`);
    await evaluate(`(document.getElementById('probe').remove(), window.interactionTick())`);
    assert.equal(await evaluate(`document.documentElement.hasAttribute('data-spw-vocabulary-hover')`), false, 'removing focused vocabulary clears tint');
    await evaluate(`(window.interactionCleanup(), window.interactionTick())`);
    assert.equal(await evaluate(`document.documentElement.hasAttribute('data-spw-vocabulary-hover')`), false);
    console.log(`${viewport.id}: observer batching, dynamic images, restart, cancellation, remount, hover/focus, light/dark palette passed`);
  }
} finally {
  session?.close();
  killProcessTree(chrome);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
