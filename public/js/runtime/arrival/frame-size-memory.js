/**
 * frame-size-memory.js — a frame's real height, remembered.
 *
 * Frames below the entry spine are content-visibility: auto with a 12–16rem
 * placeholder (components/frames.css), so the browser skips their layout until
 * a reader nears them. Home's frames run 400–2,500 px: the page grew from
 * 15,600 to 27,800 px on the way down, the footer kept running ahead of the
 * reader, and the last frames rendered on arrival and threw the footer
 * 1,700 px off the screen (2026-09-26, 390 px). The auto keyword already
 * remembers a frame's height once it has rendered, but only for the life of
 * the page.
 *
 * This keeps that memory:
 * - on boot, each frame takes the height this route last measured at this
 *   width as its placeholder, before the reader can scroll;
 * - once the page has settled, frames that have never rendered are rendered
 *   once, one per idle slice and nearest first, so the browser learns their
 *   true size before the reader gets there;
 * - rendered heights are saved per route and width for the next visit.
 * Heights are placeholders only; the auto keyword still takes over as soon
 * as a frame renders. Contract: component-fit-lens-journey flj-010.
 */

import { FRAME_SELECTOR } from '/public/js/kernel/dom-contracts.js';

const STORAGE_PREFIX = 'spw:frame-sizes:v1';
const WIDTH_STEP = 40;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const SETTLE_FALLBACK_MS = 4000;
const PLACEHOLDER_FRAMES = `:is(${FRAME_SELECTOR}):not([data-spw-region-role="entry-spine"])`;

let mounted = null;

function storageKey() {
  const bucket = Math.round(window.innerWidth / WIDTH_STEP) * WIDTH_STEP;
  return `${STORAGE_PREFIX}:${location.pathname}:${bucket}`;
}

function frameKey(frame) {
  return frame.id || frame.dataset.spwSeed || '';
}

function readMemory(key) {
  try {
    const record = JSON.parse(localStorage.getItem(key) || 'null');
    if (!record || typeof record.heights !== 'object') return {};
    if (Date.now() - (record.savedAt || 0) > MAX_AGE_MS) return {};
    return record.heights;
  } catch {
    return {};
  }
}

function writeMemory(key, heights) {
  try {
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), heights }));
  } catch {
    /* storage full or blocked: the page still works with CSS placeholders */
  }
}

function placehold(frame, height) {
  if (height > 0) frame.style.containIntrinsicSize = `auto ${Math.round(height)}px`;
}

function whenSettled(callback) {
  const html = document.documentElement;
  const settled = () => html.dataset.spwPageSettleConfirmation
    && html.dataset.spwPageSettleConfirmation !== 'pending';
  if (settled()) return callback();
  let done = false;
  const go = () => { if (done) return; done = true; observer.disconnect(); clearTimeout(timer); callback(); };
  const observer = new MutationObserver(() => { if (settled()) go(); });
  observer.observe(html, { attributes: true, attributeFilter: ['data-spw-page-settle-confirmation'] });
  const timer = setTimeout(go, SETTLE_FALLBACK_MS);
  return () => { done = true; observer.disconnect(); clearTimeout(timer); };
}

const idle = (fn) => (window.requestIdleCallback
  ? window.requestIdleCallback(fn, { timeout: 2000 })
  : window.setTimeout(() => fn({ timeRemaining: () => 8, didTimeout: true }), 120));

export function initFrameSizeMemory() {
  if (mounted || !('contentVisibility' in document.documentElement.style)) return;
  const key = storageKey();
  const memory = readMemory(key);
  const frames = [...document.querySelectorAll(PLACEHOLDER_FRAMES)].filter(frameKey);
  const heights = { ...memory };
  const rendered = new Set();

  for (const frame of frames) placehold(frame, memory[frameKey(frame)]);

  // A frame that renders on its own tells us its size; remember it.
  const onState = (event) => {
    const frame = event.target;
    if (event.skipped || !frameKey(frame) || !frames.includes(frame)) return;
    rendered.add(frame);
    requestAnimationFrame(() => {
      const height = frame.getBoundingClientRect().height;
      if (height > 0) heights[frameKey(frame)] = Math.round(height);
    });
  };
  document.addEventListener('contentvisibilityautostatechange', onState, true);

  const save = () => writeMemory(key, heights);
  const onHide = () => { if (document.visibilityState === 'hidden') save(); };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', save);

  // Render never-seen frames once, nearest first, one per idle slice.
  const warm = () => {
    const queue = frames
      .filter((frame) => !rendered.has(frame) && !(frameKey(frame) in memory))
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    // Exactly one frame per slice, even on a timed-out deadline: a frame's
    // style and layout is the whole cost, and two in one task is a stall.
    const step = (deadline) => {
      if (deadline.timeRemaining() > 6 || deadline.didTimeout) {
        let frame = queue.shift();
        while (frame && (!frame.isConnected || rendered.has(frame))) frame = queue.shift();
        if (frame) {
          frame.style.contentVisibility = 'visible';
          const height = frame.getBoundingClientRect().height;
          frame.style.contentVisibility = '';
          if (height > 0) {
            heights[frameKey(frame)] = Math.round(height);
            placehold(frame, height);
          }
          rendered.add(frame);
        }
      }
      if (queue.length) idle(step);
      else save();
    };
    if (queue.length) idle(step);
  };

  const cancelSettle = whenSettled(warm);
  mounted = { onState, onHide, save, cancelSettle };
}

export function unmountFrameSizeMemory() {
  if (!mounted) return;
  document.removeEventListener('contentvisibilityautostatechange', mounted.onState, true);
  document.removeEventListener('visibilitychange', mounted.onHide);
  window.removeEventListener('pagehide', mounted.save);
  mounted.cancelSettle?.();
  mounted.save();
  mounted = null;
}

export { unmountFrameSizeMemory as unmount };
