/**
 * QA / Beat / Cauldron gesture affordances for debug and QA testing modes.
 */

export function initQABeatGestures() {
  if (typeof window === 'undefined') return;

  const isQA = () => {
    const d = document.documentElement?.dataset || {};
    const search = location.search.toLowerCase();
    return d.spwDebugMode === 'on' ||
           search.includes('qa=') || search.includes('debug=qa') || search.includes('debug=agent') ||
           search.includes('mode=screenshot-qa') || search.includes('mode=qa');
  };

  // Keyboard affordances
  document.addEventListener('keydown', async (e) => {
    if (!isQA()) return;
    const key = e.key.toLowerCase();
    const target = e.target;
    const isTextInput = target instanceof Element && target.matches('input,textarea,[contenteditable]');

    if (key === 's' && !isTextInput) {
      e.preventDefault();
      try {
        const mod = await import('/public/js/runtime/observation-beats.js');
        const art = mod.captureCurrentBeatArtifact({ trigger: 'keyboard-s' });
        const cauldronMod = await import('/public/js/interface/composition.js');
        if (cauldronMod.captureBeatAsIngredient) {
          await cauldronMod.captureBeatAsIngredient();
        }
        console.info('[QA] Artifact captured + offered to cauldron', art);
      } catch (err) { console.warn('[QA] capture failed', err); }
    }

    if (key === '?') {
      e.preventDefault();
      import('/public/js/runtime/observation-beats.js').then(m => {
        console.info('[QA Beats status]', m.getActiveBeats ? m.getActiveBeats() : 'no beats module');
      });
    }

    if (key === 'b') {
      e.preventDefault();
      import('/public/js/runtime/observation-beats.js').then(m => {
        if (m.startQABeat) m.startQABeat({ reasonDetail: 'keyboard-b' });
      });
    }
  }, { passive: false });

  // Touch / long-press on frames in QA mode
  let lpTimer = null;
  document.addEventListener('pointerdown', (e) => {
    if (!isQA()) return;
    const frame = e.target.closest?.('.site-frame, [data-spw-kind="frame"]');
    if (!frame) return;

    clearTimeout(lpTimer);
    lpTimer = setTimeout(async () => {
      try {
        const mod = await import('/public/js/runtime/observation-beats.js');
        if (mod.startQABeat) {
          const beat = mod.startQABeat({ reasonDetail: 'touch-longpress-frame' });
          frame.dataset.spwActiveBeat = beat.id || 'active';
          console.info('[QA] Beat started via long-press on frame');
        }
      } catch {}
    }, 520);
  }, { passive: true });

  document.addEventListener('pointerup', () => clearTimeout(lpTimer), { passive: true });
  document.addEventListener('pointercancel', () => clearTimeout(lpTimer), { passive: true });
}
