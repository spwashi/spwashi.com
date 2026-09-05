/** Real browser checks. Start npm run dev, then node scripts/check-hypermedia.mjs. */
import assert from 'node:assert/strict';
import { writeFile, rm } from 'node:fs/promises';
import {
  CdpSession, resolveChrome, createChromeProfileDir, pickFreePort, openChrome,
  newPageTarget, applyViewport, VIEWPORTS, evaluateProbe, screenshotBuffer,
  killProcessTree, waitForHttp,
} from './lib/chrome-headless-harness.mjs';

const base = process.argv[2] || 'http://127.0.0.1:5173';
await waitForHttp(base);
const port = await pickFreePort();
const profile = await createChromeProfileDir('spw-hypermedia-');
const chrome = await openChrome(await resolveChrome(), profile, port);
let session;
try {
  const target = await newPageTarget(port);
  session = new CdpSession(target.webSocketDebuggerUrl);
  await session.open();
  await session.send('Page.enable');
  await session.send('Page.bringToFront');
  await session.send('Emulation.setFocusEmulationEnabled', { enabled: true });
  // Preserve false/null: the shared capture helper otherwise substitutes {}.
  const evaluate = async expression => (await evaluateProbe(session,
    `(async () => ({ value: await (${expression}) }))()`, 20000)).value;
  for (const viewport of [VIEWPORTS.pocket, VIEWPORTS.desktop]) {
    await applyViewport(session, viewport);
    await session.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await session.send('Page.navigate', { url: `${base}/scripts/tests/fixtures/hypermedia.html` });
    // Poll an observable load condition; no runtime settling delay is assumed.
    for (let i = 0; i < 100; i++) {
      if (await evaluate(`document.readyState === 'complete' && !!document.getElementById('probe')`)) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const result = await evaluate(`(async () => {
      const nav = await import('/public/js/runtime/frame-navigator.js');
      const resonance = await import('/public/js/runtime/attention/resonance-probe.js');
      const tick = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      document.getElementById('probe').focus();
      const cleanupProbe = resonance.initResonanceProbe(document.querySelector('main'));
      await tick();
      const lateFocus = document.documentElement.dataset.spwResonanceProbe;
      document.getElementById('outside').focus();
      await tick();
      const outsideCleared = !document.documentElement.hasAttribute('data-spw-resonance-probe');
      cleanupProbe();
      const cleanup = nav.initFrameNavigator();
      window.spwNavigator.open();
      await tick();
      const frames = [...document.querySelectorAll('[data-nav-index]')].map(node => node.textContent);
      const routes = [...document.querySelectorAll('[data-nav-kind="route"]')].map(node => node.getAttribute('href'));
      const focusedFilter = document.activeElement?.tagName === 'INPUT';
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      const escaped = !window.spwNavigator.isOpen() && document.activeElement.classList.contains('spw-nav-trigger');
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '{', bubbles: true }));
      const backwardsEntry = document.activeElement.id;
      document.activeElement.blur();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '}', ctrlKey: true, bubbles: true }));
      const modifierIgnored = document.querySelector('.spw-frame[data-state="active"]')?.id === 'last';
      document.getElementById('nested-focus').focus();
      const nested = document.getElementById('nested');
      const opacity = [getComputedStyle(nested).opacity, getComputedStyle(nested.parentElement).opacity];
      cleanup();
      const clean = document.querySelectorAll('.spw-nav').length === 0 && !window.spwNavigator;
      nav.initFrameNavigator();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));
      const remount = document.querySelectorAll('.spw-nav').length === 1 && window.spwNavigator.isOpen();
      nav.unmount();
      return { lateFocus, outsideCleared, frames, routes, focusedFilter, escaped, backwardsEntry, modifierIgnored, opacity, clean, remount };
    })()`);
    assert.equal(result.lateFocus, 'frame');
    assert.equal(result.outsideCleared, true);
    assert.equal(result.frames.length, 2);
    assert.deepEqual(result.routes.sort(), ['/settings/?spw-physics=calm#settings', '/settings/?spw-physics=tactile#settings']);
    for (const key of ['focusedFilter', 'escaped', 'modifierIgnored', 'clean', 'remount']) assert.equal(result[key], true, key);
    assert.equal(result.backwardsEntry, 'last');
    assert.deepEqual(result.opacity, ['1', '1']);
    console.log(`${viewport.id}: navigation, URL state, focus, opacity and remount pass`);
  }
  await session.send('Page.navigate', { url: `${base}/topics/software/spw/?spw-runtime-timing=manual#operator-symmetry` });
  for (let i = 0; i < 100; i++) {
    if (await evaluate(`document.readyState === 'complete' && !!document.querySelector('.operator-symmetry__board')`)) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const lab = await evaluate(`(async () => {
    const { mountOperatorSymmetry } = await import('/public/js/modules/tools/operator-symmetry.js');
    const root = document.getElementById('operator-symmetry');
    const cleanup = mountOperatorSymmetry(root);
    const order = () => [...root.querySelectorAll('.operator-symmetry__board a')].map(a => a.href);
    const initial = order();
    const rotate = root.querySelector('button[value="rotate"]');
    rotate.focus();
    for (let i = 0; i < 4; i++) rotate.click();
    const identity = JSON.stringify(order()) === JSON.stringify(initial);
    root.querySelector('button[value="rotate-reflect"]').click();
    const rm = order();
    root.querySelector('button[value="reflect-rotate"]').click();
    const mr = order();
    const noncommuting = JSON.stringify(rm) !== JSON.stringify(mr);
    const sameLinks = JSON.stringify([...rm].sort()) === JSON.stringify([...initial].sort());
    cleanup();
    const restored = JSON.stringify(order()) === JSON.stringify(initial) && root.querySelector('.operator-symmetry__controls').hidden;
    mountOperatorSymmetry(root);
    root.scrollIntoView({ block: 'start' });
    return { identity, noncommuting, sameLinks, restored };
  })()`);
  Object.entries(lab).forEach(([key, value]) => assert.equal(value, true, key));
  await writeFile('/tmp/spw-hypermedia-desktop.png', await screenshotBuffer(session));
  await applyViewport(session, VIEWPORTS.pocket);
  await evaluate(`document.getElementById('operator-symmetry').scrollIntoView({ block: 'start' })`);
  const touch = await evaluate(`(() => {
    const button = document.querySelector('#operator-symmetry button[value="rotate"]');
    button.scrollIntoView({ block: 'center', behavior: 'instant' });
    const rect = button.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, height: rect.height };
  })()`);
  assert.ok(touch.height >= 44, 'touch target is at least 44 CSS pixels');
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: touch.x, y: touch.y }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.equal(await evaluate(`document.querySelector('#operator-symmetry output').textContent.startsWith('R.')`), true, 'real touch rotates once');
  await evaluate(`document.querySelector('#operator-symmetry button[value="reset"]').focus()`);
  await session.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', unmodifiedText: '\r', windowsVirtualKeyCode: 13 });
  await session.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  assert.equal(await evaluate(`document.querySelector('#operator-symmetry output').textContent.startsWith('Start.')`), true, 'native keyboard reset');
  const fit = await evaluate(`(() => {
    const root = document.getElementById('operator-symmetry');
    const board = root.querySelector('.operator-symmetry__board').getBoundingClientRect();
    return { width: board.width, height: board.height, fits: root.scrollWidth <= root.clientWidth };
  })()`);
  assert.ok(Math.abs(fit.width - fit.height) < 2, 'the permutation is presented on a square');
  assert.equal(fit.fits, true, 'experiment fits the pocket frame');
  await writeFile('/tmp/spw-hypermedia-pocket.png', await screenshotBuffer(session));
  console.log('atlas: symmetry identity, composition order, link preservation and cleanup pass');
} finally {
  session?.close();
  killProcessTree(chrome);
  await rm(profile, { recursive: true, force: true });
}
