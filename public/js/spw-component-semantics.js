import { bus } from './spw-bus.js';

const DEFAULT_SELECTOR = [
  '.site-frame',
  '.frame-panel',
  '.frame-card',
  '.mode-panel',
  '[data-spw-kind]',
  '[data-spw-role]',
  '[data-spw-slot]'
].join(', ');

const ROLE_DEFAULTS = Object.freeze({
  orientation: { substrate: 'frame', phrase: 'premise', context: 'reading' },
  routing: { substrate: 'ref', phrase: 'guide', context: 'routing' },
  reference: { substrate: 'ref', phrase: 'guide', context: 'analysis' },
  schema: { substrate: 'object', phrase: 'structure', context: 'analysis' },
  control: { substrate: 'action', phrase: 'instruction', context: 'settings' },
  surface: { substrate: 'surface', phrase: 'artifact', context: 'publishing' },
  artifact: { substrate: 'surface', phrase: 'artifact', context: 'publishing' },
  probe: { substrate: 'probe', phrase: 'inquiry', context: 'analysis' },
  telemetry: { substrate: 'probe', phrase: 'inquiry', context: 'analysis' },
  status: { substrate: 'baseline', phrase: 'premise', context: 'analysis' }
});

function normalizeText(value = '') {
  return value.replace(/\s+/g, ' ').trim();
}

function humanize(value = '') {
  return normalizeText(value).replace(/[_-]+/g, ' ').toLowerCase();
}

function normalizeToken(value = '') {
  return humanize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getKind(el) {
  if (el.dataset.spwKind) return normalizeToken(el.dataset.spwKind);
  if (el.matches('main')) return 'main';
  if (el.matches('nav')) return 'nav';
  if (el.matches('aside')) return 'aside';
  if (el.matches('article')) return 'article';
  if (el.matches('figure')) return 'figure';
  if (el.classList.contains('site-frame')) return 'frame';
  if (el.classList.contains('frame-panel')) return 'panel';
  if (el.classList.contains('frame-card')) return 'card';
  if (el.classList.contains('mode-panel')) return 'lens';
  return 'component';
}

function getHeading(el) {
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const target = document.getElementById(labelledBy.split(/\s+/)[0]);
    if (target) return normalizeText(target.textContent || '');
  }
  return normalizeText(
    el.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > .frame-heading h1, :scope > .frame-heading h2, :scope > .frame-topline h1, :scope > .frame-topline h2, :scope > strong, :scope > figcaption')?.textContent || ''
  );
}

function inferRole(el, kind) {
  if (el.dataset.spwRole) return normalizeToken(el.dataset.spwRole);

  const haystack = humanize([
    el.id,
    el.getAttribute('role'),
    el.dataset.spwMeaning,
    getHeading(el),
    el.textContent?.slice(0, 180) || ''
  ].filter(Boolean).join(' '));

  if (kind === 'main') return 'orientation';
  if (kind === 'nav') return 'routing';
  if (kind === 'aside') return 'reference';
  if (kind === 'figure') return 'artifact';
  if (el.classList.contains('site-hero')) return 'orientation';
  if (/register/.test(haystack)) return 'reference';
  if (/index|routes|surfaces|navigation/.test(haystack)) return 'routing';
  if (/settings|controls|preferences/.test(haystack)) return 'control';
  if (/syntax|grammar|structure|schema/.test(haystack)) return 'schema';
  if (/status|current/.test(haystack)) return 'status';
  if (/probe|lab|observatory/.test(haystack)) return 'probe';

  if (kind === 'frame') return 'orientation';
  if (kind === 'panel') return 'reference';
  if (kind === 'card') return 'artifact';
  if (kind === 'lens') return 'control';

  return 'reference';
}

function inferMeaning(el, kind) {
  if (el.dataset.spwMeaning) return humanize(el.dataset.spwMeaning);
  const heading = humanize(getHeading(el));
  if (heading) return heading;
  return kind;
}

function setIfMissing(el, key, value) {
  if (!value) return;
  if (!el.dataset[key]) el.dataset[key] = value;
}

function snapshotFor(el) {
  const kind = getKind(el);
  const role = inferRole(el, kind);
  const meaning = inferMeaning(el, kind);
  const defaults = ROLE_DEFAULTS[role] || ROLE_DEFAULTS.reference;

  return {
    kind,
    role,
    meaning,
    form: el.dataset.spwForm || (kind === 'nav' ? 'route-list' : kind === 'frame' ? 'brace' : 'block'),
    substrate: el.dataset.spwSubstrate || defaults.substrate,
    phrase: el.dataset.spwPhrase || defaults.phrase,
    context: el.dataset.spwContext || defaults.context,
    semanticTagged: 'true'
  };
}

function applySnapshot(el, snapshot) {
  setIfMissing(el, 'spwKind', snapshot.kind);
  setIfMissing(el, 'spwRole', snapshot.role);
  setIfMissing(el, 'spwMeaning', snapshot.meaning);
  setIfMissing(el, 'spwForm', snapshot.form);
  setIfMissing(el, 'spwSubstrate', snapshot.substrate);
  setIfMissing(el, 'spwPhrase', snapshot.phrase);
  setIfMissing(el, 'spwContext', snapshot.context);
  setIfMissing(el, 'spwSemanticTagged', snapshot.semanticTagged);
}

function collectTargets(root) {
  const targets = new Set();
  if (root instanceof Element && root.matches(DEFAULT_SELECTOR)) targets.add(root);
  root.querySelectorAll?.(DEFAULT_SELECTOR).forEach((el) => targets.add(el));
  return [...targets];
}

export function initSpwComponentSemantics(options = {}) {
  const {
    root = document,
    mode = 'normalize',
    emit = true
  } = options;

  if (mode !== 'normalize') {
    console.warn('[spw-component-semantics] Only normalize mode is supported in production right now.');
  }

  const targets = collectTargets(root);
  const snapshots = [];

  for (const el of targets) {
    const snapshot = snapshotFor(el);
    applySnapshot(el, snapshot);
    snapshots.push({ element: el, snapshot });
  }

  if (emit) {
    bus.emit?.('spw:semantic-snapshot', {
      root,
      count: snapshots.length,
      snapshots: snapshots.map(({ element, snapshot }) => ({
        id: element.id || null,
        kind: snapshot.kind,
        role: snapshot.role,
        meaning: snapshot.meaning,
        form: snapshot.form,
        substrate: snapshot.substrate,
        phrase: snapshot.phrase,
        context: snapshot.context
      }))
    });
  }

  return {
    cleanup() {},
    refresh(nextOptions = {}) {
      return initSpwComponentSemantics({
        root: nextOptions.root || root,
        mode,
        emit
      });
    }
  };
}