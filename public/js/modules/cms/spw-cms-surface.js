/**
 * spw-cms-surface.js
 *
 * Progressive enhancement for build-time Spw CMS bands (_partials/cms/*.html):
 * 1. Deterministic daily/close dispatch spotlight + manual ~next[dispatch] step
 * 2. Material Triptych switching (.prose · *scan · #>spw) over native <details>
 * 3. Pre-reveal curiosity gaps (~#expect guess -> *precipitate reveal)
 * 4. Privacy-safe attention.productions theater preset switching + click-to-mount iframe
 */

export function computeUtcDayIndex(date = new Date()) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

export function describeCloseCadence(date = new Date()) {
  const day = date.getDate();
  const nextClose = day <= 13 ? 13 : day <= 26 ? 26 : 13;
  const daysUntil = day <= 13 ? 13 - day : day <= 26 ? 26 - day : (31 - day) + 13;
  return daysUntil === 0
    ? `Close day (${nextClose}th) · lead dispatch`
    : `${daysUntil}d to ${nextClose}th close · daily lead`;
}

function initRotator(root, signal) {
  const rotator = root.querySelector('[data-cms-rotator]');
  if (!rotator) return;
  const items = [...rotator.querySelectorAll('[data-cms-rotator-item]')];
  if (items.length < 2) return;

  let activeIndex = computeUtcDayIndex() % items.length;
  const stampEl = root.querySelector('[data-cms-close-readout]');
  const nextBtn = root.querySelector('[data-cms-rotate-next]');

  const sync = () => {
    items.forEach((card, index) => {
      if (index === activeIndex) {
        card.setAttribute('data-cms-lead', 'true');
      } else {
        card.removeAttribute('data-cms-lead');
      }
    });
    if (stampEl) {
      stampEl.textContent = `${describeCloseCadence()} (${activeIndex + 1}/${items.length})`;
    }
  };

  sync();
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      activeIndex = (activeIndex + 1) % items.length;
      sync();
    }, { signal });
  }
}

function initTriptychs(root, signal) {
  const cards = [...root.querySelectorAll('[data-cms-triptych]')];
  for (const card of cards) {
    const tabGroup = card.querySelector('.spw-triptych__tabs');
    const proseFace = card.querySelector('[data-cms-face="prose"]');
    const folds = [...card.querySelectorAll('details.spw-triptych__fold')];
    if (!tabGroup || !proseFace || !folds.length) continue;

    tabGroup.hidden = false;
    card.setAttribute('data-cms-hydrated', 'true');

    const setFace = (faceName) => {
      card.setAttribute('data-cms-active-face', faceName);
      proseFace.hidden = faceName !== 'prose';
      for (const fold of folds) {
        const match = fold.getAttribute('data-cms-face') === faceName;
        fold.open = match;
        fold.hidden = !match;
      }
      for (const btn of tabGroup.querySelectorAll('[data-cms-face-btn]')) {
        const pressed = btn.getAttribute('data-cms-face-btn') === faceName;
        btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
      }
    };

    setFace('prose');
    tabGroup.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-cms-face-btn]');
      if (!btn || !tabGroup.contains(btn)) return;
      setFace(btn.getAttribute('data-cms-face-btn') || 'prose');
    }, { signal });
  }
}

function initCuriosityGaps(root, signal) {
  const probes = [...root.querySelectorAll('[data-cms-expect]')];
  for (const probe of probes) {
    const correct = probe.getAttribute('data-cms-correct') || 'b';
    const status = probe.querySelector('[data-cms-expect-status]');
    const details = probe.querySelector('[data-cms-expect-details]');
    const buttons = [...probe.querySelectorAll('[data-cms-guess]')];
    if (!buttons.length || !details) continue;

    probe.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-cms-guess]');
      if (!btn || !probe.contains(btn)) return;
      const guess = btn.getAttribute('data-cms-guess') || '';
      const hit = guess === correct;

      buttons.forEach((choice) => {
        const isPicked = choice === btn;
        choice.setAttribute('aria-pressed', isPicked ? 'true' : 'false');
        choice.setAttribute('data-cms-choice-state', choice.getAttribute('data-cms-guess') === correct ? 'correct' : (isPicked ? 'picked' : 'idle'));
      });

      probe.setAttribute('data-cms-verdict', hit ? 'hit' : 'surprise');
      details.open = true;
      if (status) {
        status.textContent = hit
          ? '*match — Your prediction held; read why and follow the open wonder below.'
          : '*surprise — Counterintuitive gap! See why the invariant bends the other way.';
      }
    }, { signal });
  }
}

function initTheaterEndpoints(root, signal) {
  const theaters = [...root.querySelectorAll('[data-cms-theater]')];
  for (const theater of theaters) {
    const codeEl = theater.querySelector('[data-cms-theater-code]');
    const captionEl = theater.querySelector('[data-cms-theater-caption]');
    const hostLink = theater.querySelector('[data-cms-theater-link]');
    const slotEl = theater.querySelector('[data-cms-theater-slot]');
    const mountBtn = theater.querySelector('[data-cms-theater-mount]');
    const presets = [...theater.querySelectorAll('[data-cms-shot-index]')];
    let mounted = false;

    const syncIframe = (url) => {
      if (!slotEl || !mounted) return;
      let iframe = slotEl.querySelector('iframe');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.className = 'spw-theater-endpoint__iframe';
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
        iframe.setAttribute('loading', 'lazy');
        iframe.setAttribute('referrerpolicy', 'no-referrer');
        iframe.setAttribute('title', 'attention.productions live stage viewfinder');
        slotEl.replaceChildren(iframe);
      }
      if (iframe.src !== url) iframe.src = url;
    };

    theater.addEventListener('click', (event) => {
      const preset = event.target.closest('[data-cms-shot-index]');
      if (preset && theater.contains(preset)) {
        const url = preset.getAttribute('data-cms-shot-url') || 'https://attention.productions/';
        const spw = preset.getAttribute('data-cms-shot-spw') || '';
        const caption = preset.getAttribute('data-cms-shot-caption') || '';
        theater.setAttribute('data-cms-active-url', url);
        presets.forEach((btn) => btn.setAttribute('aria-pressed', btn === preset ? 'true' : 'false'));
        if (codeEl) codeEl.textContent = spw;
        if (captionEl) captionEl.textContent = caption;
        if (hostLink) hostLink.setAttribute('href', url);
        syncIframe(url);
        return;
      }

      const trigger = event.target.closest('[data-cms-theater-mount]');
      if (trigger && trigger === mountBtn && slotEl) {
        mounted = !mounted;
        slotEl.hidden = !mounted;
        mountBtn.setAttribute('aria-expanded', mounted ? 'true' : 'false');
        mountBtn.textContent = mounted
          ? '.unmount[theater] · Return to quiet notation'
          : '!mount[theater] · Roll live attention.productions stage';
        if (mounted) {
          syncIframe(theater.getAttribute('data-cms-active-url') || 'https://attention.productions/');
        } else {
          slotEl.replaceChildren();
        }
      }
    }, { signal });
  }
}

export function mountSpwCmsSurface(root) {
  if (!root) return () => {};
  const abort = new AbortController();
  const { signal } = abort;

  initRotator(root, signal);
  initTriptychs(root, signal);
  initCuriosityGaps(root, signal);
  initTheaterEndpoints(root, signal);

  return () => {
    abort.abort();
  };
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'spw-cms-surface',
  mount: (_ctx, root) => mountSpwCmsSurface(root),
  describes: 'cms[seed]{rotate.triptych.expect.theater}<spw> enhances build-time .spw CMS bands with daily rotation, prose/scan/spw triptychs, curiosity-gap predictions, and consentful attention.productions viewfinder embeds',
  updates: [
    'structural:aria-pressed',
    'structural:aria-expanded',
    'structural:hidden',
    'structural:property:textContent',
    'structural:property:childList',
  ],
  evaluates: ['surface', 'semantics', 'interaction'],
  timingArc: 'visible-feature',
  effectScope: ['local-dom', 'element-state', 'listeners'],
  contract: Object.freeze({
    story: 'A single .spw CMS seed renders whole with scripts off and wakes into daily rotation, 3-face material triptychs, pre-reveal curiosity gaps, and a zero-unsolicited-network attention.productions stage.',
    wonder: ['comparison', 'inquiry', 'projection'],
    host: '[data-cms-surface]',
    css: ['/public/css/components/spw-cms.css'],
    value: 'Proves Spw doing real multi-projection CMS work across routes without adding a client framework.',
  }),
});

export const spwModule = SPW_MODULE_EXPORT;
