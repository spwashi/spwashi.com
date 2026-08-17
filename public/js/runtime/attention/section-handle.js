import {
  annotateFloatingChromeElement,
  syncFloatingChromeState,
} from '/public/js/kernel/dom-contracts.js';
import { appendToDocument } from '/public/js/kernel/dom-render.js';
import { computeLocomotionFieldBalance } from '/public/js/interface/wonder-memory.js';
import { describeSpwExpression } from '/public/js/semantic/spw-expression-geometry.js';
import { kinIds, nextKinRelation, pickRegionKin } from '/public/js/runtime/region-kin.js';
import {
  AUTO_HANDLE_MIN_SECTIONS,
  APPROACH_ATTR,
  CAULDRON_RESONANCE_ATTR,
  HANDLE_AVAILABILITY_ATTR,
  HANDLE_COMPACT_QUERY,
  HANDLE_ENHANCED_ATTR,
  HANDLE_LABEL_ATTR,
  HANDLE_OP_ATTR,
  HANDLE_PHASE_ATTR,
  HANDLE_SELECTOR,
  HANDLE_SHELL_CLASS,
  HANDLE_SHELL_STATE_ATTR,
  HANDLE_STATE_ATTR,
  HANDLE_TRAVEL_SETTLE_MS,
  HANDLE_VISIBILITY_SCROLL,
  OPERATOR_SECTION_SELECTOR,
  PAGE_SECTION_COUNT_ATTR,
  PAGE_SECTION_CURRENT_ATTR,
  PAGE_SECTION_DIRECTION_ATTR,
  PAGE_SECTION_EDGE_ATTR,
  PAGE_SECTION_EVENT,
  PAGE_SECTION_INDEX_ATTR,
  PAGE_SECTION_PHASE_ATTR,
  SECTION_INDEX_ATTR,
  SECTION_STATE_ATTR,
  SECTION_TIER_ATTR,
  SPW_LOG_RELATIONSHIPS,
  SUBVOCAL_REHEARSAL_ATTR,
  WONDER_ENTRY_ATTR,
  clearAttributes,
  getScrollBehavior,
  logger,
  writeAttributes,
  writeSectionProgressStyle,
} from './shared.js';

let lastSectionLogKey = '';
let lastSectionIndex = 0;
const EXPLICIT_SECTION_TRAVEL_SOURCES = new Set([
  'prev',
  'next',
  'top',
  'bottom',
  'arrow-prev',
  'arrow-next',
  'home',
  'end',
  'similar',
  'contrast',
  'resonate',
]);

function setHandleState(handle, state) {
  if (!handle) return;
  if (handle.getAttribute(HANDLE_STATE_ATTR) === state) return;
  handle.setAttribute(HANDLE_STATE_ATTR, state);
}

function setHandlePhase(handle, phase) {
  if (!handle) return;
  if (handle.getAttribute(HANDLE_PHASE_ATTR) === phase) return;
  handle.setAttribute(HANDLE_PHASE_ATTR, phase);
}

function getSectionLifecycleState(index, activeIndex) {
  if (index === activeIndex) return 'active';
  if (index === activeIndex - 1) return 'previous';
  if (index === activeIndex + 1) return 'next';
  return 'rest';
}

function getPageSectionEdge(currentIndex, sectionCount) {
  if (currentIndex <= 0) return 'top';
  if (currentIndex >= sectionCount - 1) return 'bottom';
  return 'middle';
}

function buildSectionSnapshot(section, index, activeIndex, phase, source, origin, sectionCount) {
  const info = describeSection(section, index);
  if (!info) return null;

  return {
    currentId: info.id,
    currentIndex: activeIndex,
    currentLabel: info.label,
    currentToken: info.token,
    sectionCount,
    availability: describeAvailability(activeIndex, sectionCount),
    phase,
    source,
    origin,
  };
}

function getSectionProgress(currentIndex, sectionCount) {
  if (sectionCount <= 1) return 1;
  return currentIndex / (sectionCount - 1);
}

function getSectionDirection(currentIndex) {
  if (currentIndex > lastSectionIndex) return 'forward';
  if (currentIndex < lastSectionIndex) return 'back';
  return 'steady';
}

function syncHandleContent(parts, info, activeIndex, sectionCount) {
  const {
    opNode,
    labelNode,
    currentToken,
    currentLabel,
    currentForm,
    progressNode,
    currentLink,
    prevButton,
    nextButton,
    cauldronNode,
    cauldronCount,
  } = parts;

  if (opNode) opNode.textContent = info.token || '#>';
  if (labelNode) labelNode.textContent = info.label || 'section';
  if (currentToken) currentToken.textContent = info.token || '#>';
  if (currentLabel) currentLabel.textContent = info.label || 'section';
  if (currentForm instanceof HTMLElement) {
    currentForm.textContent = info.syntaxWake || '';
    currentForm.title = info.syntaxDescription
      ? `Spw geometry: ${info.syntaxDescription}`
      : '';
    currentForm.hidden = !info.syntaxWake;
  }
  if (cauldronNode instanceof HTMLElement) {
    if (info.ingredientsCount > 0) {
      cauldronNode.hidden = false;
      if (cauldronCount) cauldronCount.textContent = String(info.ingredientsCount);
      cauldronNode.title = `${info.ingredientsCount} gatherable concept(s): ${info.ingredientNames}`;
    } else {
      cauldronNode.hidden = true;
    }
  }
  if (progressNode) {
    progressNode.textContent = `${activeIndex + 1} / ${sectionCount}`;
    progressNode.setAttribute('aria-label', `Section ${activeIndex + 1} of ${sectionCount}`);
  }
  if (currentLink instanceof HTMLAnchorElement) {
    currentLink.href = `#${info.id}`;
    currentLink.setAttribute('aria-label', `Jump to ${info.label}`);
  }

  // ARIA hygiene: dynamic prev/next labels using the section that will be targeted
  if (prevButton instanceof HTMLButtonElement) {
    const prevLabel = info.prevLabel || 'previous section';
    prevButton.setAttribute('aria-label', `Jump to previous: ${prevLabel}`);
  }
  if (nextButton instanceof HTMLButtonElement) {
    const nextLabel = info.nextLabel || 'next section';
    nextButton.setAttribute('aria-label', `Jump to next: ${nextLabel}`);
  }
}

/** Announce only for explicit button-driven travel (not passive scroll). */
function announceSectionTravel(liveRegion, label) {
  if (!liveRegion || !label) return;
  liveRegion.textContent = `Now at ${label}`;
  // Clear after a short window so future announcements can fire
  window.setTimeout(() => {
    if (liveRegion.textContent.includes(label)) liveRegion.textContent = '';
  }, 1200);
}

function getSectionHeading(section) {
  if (!(section instanceof HTMLElement)) return null;
  return (
    section.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4')
    || section.querySelector(':scope > header :is(h1, h2, h3, h4)')
    || section.querySelector(':scope > .frame-heading :is(h1, h2, h3)')
    || section.querySelector(':scope > .section-title')
    || section.querySelector(':scope > .frame-topline .frame-sigil')
    || section.querySelector(':scope > .page-kicker')
    || section.querySelector(':scope > [data-spw-label]')
  );
}

function getSectionToken(section) {
  if (!(section instanceof HTMLElement)) return '#>';
  const sigil =
    section.querySelector(':scope > .frame-topline .frame-sigil')
    || section.querySelector(':scope > .frame-heading .frame-sigil')
    || section.querySelector(':scope > .section-label')
    || null;
  const sigilText = sigil?.textContent?.trim().replace(/\s+/g, ' ') || '';
  if (sigilText) {
    return sigilText.slice(0, 18);
  }

  const hookKind = section.dataset.spwKind === 'hook' || section.dataset.spwComponentKind === 'hook';
  const operatorName = section.getAttribute('data-spw-operator') || '';
  if (hookKind && operatorName) {
    const prefix = operatorName === 'probe' ? '?'
      : operatorName === 'frame' ? '#>'
      : operatorName === 'action' ? '@'
      : operatorName === 'ref' ? '~'
      : operatorName === 'object' ? '^'
      : '';
    return `${prefix}${operatorName}`.slice(0, 18);
  }

  const operator =
    operatorName
    || section.getAttribute('data-spw-role')
    || section.getAttribute('data-spw-kind')
    || '';
  return operator ? operator.slice(0, 14) : '#>';
}

function getSectionTier(section) {
  if (!(section instanceof HTMLElement)) return 'nested';
  if (section.matches('main > section, main > article, main > aside, main > [data-spw-svg-host]')) {
    return 'primary';
  }
  if (section.matches('main > article > section, main > article > aside, main > article > [data-spw-svg-host]')) {
    return 'article';
  }
  if (section.matches('[data-spw-kind="hook"], [data-spw-component-kind="hook"]')) {
    return 'hook';
  }
  return 'nested';
}

function ensureSectionId(section, index) {
  if (!(section instanceof HTMLElement)) return '';
  if (section.id) return section.id;

  const svgHostId = section.getAttribute('data-spw-svg-host');
  const headingText = getSectionHeading(section)?.textContent || '';
  const base =
    svgHostId
    || headingText
    || section.getAttribute('aria-label')
    || section.getAttribute('data-spw-label')
    || `section-${index + 1}`;
  const normalized = base
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || `section-${index + 1}`;

  let id = normalized;
  let suffix = 2;
  while (document.getElementById(id)) {
    id = `${normalized}-${suffix}`;
    suffix += 1;
  }
  section.id = id;
  return id;
}

function getSectionLabel(section, index = 0) {
  if (!section) return '';
  const svgHostId = section.getAttribute('data-spw-svg-host');
  const heading = getSectionHeading(section);
  const svgLabel = svgHostId
    ? section.querySelector(':scope > svg > title')?.textContent
      || svgHostId.replace(/[-_]+/g, ' ')
    : '';
  const labelSource =
    svgLabel ||
    (heading && heading.textContent) ||
    section.getAttribute('aria-label') ||
    section.getAttribute('data-spw-label') ||
    ensureSectionId(section, index) ||
    '';
  return labelSource.trim().replace(/\s+/g, ' ').slice(0, 80);
}

function getSectionExpression(section) {
  if (!(section instanceof HTMLElement)) return '';
  if (section.dataset.spwSemanticExpression) return section.dataset.spwSemanticExpression;
  const expressionHost = (
    section.querySelector(':scope > [data-spw-semantic-expression]')
    || section.querySelector(':scope > header [data-spw-semantic-expression]')
    || section.querySelector(':scope > .frame-heading [data-spw-semantic-expression]')
    || section.querySelector(':scope > .frame-topline [data-spw-semantic-expression]')
    || section.querySelector('[data-spw-semantic-expression]')
  );
  return expressionHost?.getAttribute('data-spw-semantic-expression') || '';
}

function describeSection(section, index = 0, sections = []) {
  if (!section) return null;
  const id = ensureSectionId(section, index);
  const token = getSectionToken(section);
  const label = getSectionLabel(section, index);
  const expression = getSectionExpression(section);
  const syntax = expression ? describeSpwExpression(expression, { maxRootLength: 16 }) : null;
  const prevLabel = index > 0 ? getSectionLabel(sections[index - 1], index - 1) : '';
  const nextLabel = index < sections.length - 1 ? getSectionLabel(sections[index + 1], index + 1) : '';
  const consequence = section.getAttribute('data-spw-consequence') || section.getAttribute('data-spw-role') || '';
  const operator = section.getAttribute('data-spw-operator')
    || section.querySelector('.frame-sigil, [data-spw-operator]')?.getAttribute('data-spw-operator')
    || '';
  const wonder = section.getAttribute('data-spw-wonder') || '';
  const ingredients = section.querySelectorAll('[data-spw-ingredient], [data-spw-concept], [data-spw-living-term]');
  const ingredientsCount = ingredients.length;
  const ingredientNames = [...new Set(Array.from(ingredients).map((el) => el.getAttribute('data-spw-concept') || el.getAttribute('data-spw-ingredient') || el.textContent.trim()))].filter(Boolean).slice(0, 3).join(', ');

  return {
    id,
    token,
    label,
    prevLabel,
    nextLabel,
    consequence,
    operator,
    wonder,
    seat: section.getAttribute('data-spw-region') || '',
    expression: expression || '',
    ingredientsCount,
    ingredientNames,
    syntaxWake: syntax?.wake || '',
    syntaxDescription: syntax?.description || '',
  };
}

function collectSections() {
  const sections = Array.from(document.querySelectorAll(OPERATOR_SECTION_SELECTOR));
  return sections.filter((section) => {
    if (!(section instanceof HTMLElement)) return false;
    if (!section.closest('main')) return false;
    if (section.hidden || section.getAttribute('aria-hidden') === 'true') return false;
    const info = describeSection(section);
    return !!info?.label;
  });
}

function ensureHandle(root, sections) {
  const existing = root.querySelector(HANDLE_SELECTOR);
  if (existing instanceof HTMLElement) {
    annotateFloatingChromeElement(existing, {
      role: 'section-handle',
      tier: 'floating',
      mutator: 'attention-architecture',
      reason: 'existing-section-handle',
      stylingAxis: 'page-locomotion',
    });
    return { handle: existing, generated: false };
  }

  if (sections.length < AUTO_HANDLE_MIN_SECTIONS) {
    return { handle: null, generated: false };
  }

  const handle = document.createElement('a');
  handle.className = 'spw-section-handle spw-section-handle--generated';
  handle.href = '#main-content';
  handle.setAttribute('aria-label', 'Jump to current section');
  annotateFloatingChromeElement(handle, {
    role: 'section-handle',
    tier: 'floating',
    mutator: 'attention-architecture',
    reason: 'generated-section-handle',
    stylingAxis: 'page-locomotion',
  });
  handle.innerHTML = `
    <span class="spw-section-handle__op" aria-hidden="true">#&gt;</span>
    <span class="spw-section-handle__label">section</span>
  `;

  const header = document.querySelector('body > header, .site-header');
  if (header?.after) {
    header.after(handle);
  } else {
    appendToDocument(handle);
  }

  return { handle, generated: true };
}

function createHandleShell(origin) {
  const shell = document.createElement('nav');
  shell.className = HANDLE_SHELL_CLASS;
  shell.setAttribute('aria-label', 'Page locomotion');
  shell.setAttribute(HANDLE_ENHANCED_ATTR, 'true');
  shell.setAttribute('data-spw-gesture-contract', 'tap:travel hold:preview swipe:cycle');
  annotateFloatingChromeElement(shell, {
    role: 'section-handle-shell',
    tier: 'floating',
    mutator: 'attention-architecture',
    reason: 'section-handle-shell',
    stylingAxis: 'page-locomotion',
  });
  // These carry structural handle identity (which section, from where, how
  // many) rather than visual state, so no CSS selector targets them — per
  // attention-field.spw#operational_semantics ("observable... without
  // reverse-engineering CSS"), that identity belongs in the state inspector
  // instead. Opts into runtime/state-inspector.js's generic dataset reader.
  shell.dataset.spwInspectDatasets = [
    'handleAvailability',
    'handleOrigin',
    'handleCurrent',
    'handleIndex',
    'handleCount',
    'handleSource',
    'sectionHandleLabel',
    'sectionHandleOp',
  ].join(',');
  shell.dataset.spwHandleOrigin = origin;
  shell.innerHTML = `
    <button type="button" class="spw-section-handle-toggle" data-spw-handle-target="toggle" aria-expanded="false" aria-label="Expand page travel rail">
      <span aria-hidden="true">rail</span>
    </button>
    <button type="button" class="spw-section-handle-step" data-spw-handle-target="top" data-spw-handle-advanced="true" aria-label="Jump to top of page">
      <span aria-hidden="true">↑</span>
    </button>
    <button type="button" class="spw-section-handle-step" data-spw-handle-target="prev" aria-label="Jump to previous section">
      <span aria-hidden="true">‹</span>
    </button>
    <a class="spw-section-handle-current" href="#main-content">
      <span class="spw-section-handle-current-token" aria-hidden="true">#&gt;</span>
      <span class="spw-section-handle-current-copy">
        <span class="spw-section-handle-current-label">section</span>
        <span class="spw-section-handle-current-form" aria-hidden="true" hidden></span>
        <span class="spw-section-handle-cauldron" aria-label="Section ingredients" hidden>
          <span class="spw-section-handle-cauldron-sigil" aria-hidden="true">⌁</span>
          <span class="spw-section-handle-cauldron-count">0</span>
        </span>
        <span class="spw-section-handle-progress">1 / 1</span>
      </span>
    </a>
    <button type="button" class="spw-section-handle-step" data-spw-handle-target="next" aria-label="Jump to next section">
      <span aria-hidden="true">›</span>
    </button>
    <button type="button" class="spw-section-handle-step" data-spw-handle-target="bottom" data-spw-handle-advanced="true" aria-label="Jump to bottom of page">
      <span aria-hidden="true">↓</span>
    </button>
    <button type="button" class="spw-section-handle-step spw-region-kin-particle" data-spw-handle-target="similar" data-spw-handle-advanced="true" data-spw-region-relation="similar" data-spw-operator="potential" data-spw-gesture-contract="tap:travel hold:preview swipe:cycle" aria-label="Explore a similar region">
      <span class="spw-region-kin-label" data-spw-kin-rung="compact" aria-hidden="true">~</span>
      <span class="spw-region-kin-label" data-spw-kin-rung="balanced" aria-hidden="true">~similar</span>
    </button>
    <button type="button" class="spw-section-handle-step spw-region-kin-particle" data-spw-handle-target="contrast" data-spw-handle-advanced="true" data-spw-region-relation="contrast" data-spw-operator="subject" data-spw-gesture-contract="tap:travel hold:preview swipe:cycle" aria-label="Compare a contrasting region">
      <span class="spw-region-kin-label" data-spw-kin-rung="compact" aria-hidden="true">&amp;</span>
      <span class="spw-region-kin-label" data-spw-kin-rung="balanced" aria-hidden="true">&amp;contrast</span>
    </button>
    <button type="button" class="spw-section-handle-step spw-region-kin-particle" data-spw-handle-target="resonate" data-spw-handle-advanced="true" data-spw-region-relation="resonate" data-spw-operator="vibration" data-spw-gesture-contract="tap:travel hold:preview swipe:cycle" aria-label="Anchor a resonant region">
      <span class="spw-region-kin-label" data-spw-kin-rung="compact" aria-hidden="true">#</span>
      <span class="spw-region-kin-label" data-spw-kin-rung="balanced" aria-hidden="true">#resonate</span>
    </button>
    <!-- Polite live region for button-driven section travel only (gesture-aria-hygiene/FIX.md) -->
    <span class="spw-section-handle-live" aria-live="polite" aria-atomic="true" hidden></span>
  `;
  return shell;
}

function createSectionHandleState() {
  return {
    activeIndex: 0,
    phase: 'settled',
    raf: 0,
    travelTimer: 0,
    travelTargetId: '',
    compact: window.matchMedia(HANDLE_COMPACT_QUERY).matches,
    manualCompact: false,
  };
}

function getSectionHandleRefs(handle, shell) {
  return {
    handle,
    shell,
    opNode: handle.querySelector('.spw-section-handle__op'),
    labelNode: handle.querySelector('.spw-section-handle__label'),
    currentLink: shell.querySelector('.spw-section-handle-current'),
    currentToken: shell.querySelector('.spw-section-handle-current-token'),
    currentLabel: shell.querySelector('.spw-section-handle-current-label'),
    currentForm: shell.querySelector('.spw-section-handle-current-form'),
    cauldronNode: shell.querySelector('.spw-section-handle-cauldron'),
    cauldronCount: shell.querySelector('.spw-section-handle-cauldron-count'),
    progressNode: shell.querySelector('.spw-section-handle-progress'),
    toggleButton: shell.querySelector('[data-spw-handle-target="toggle"]'),
    topButton: shell.querySelector('[data-spw-handle-target="top"]'),
    prevButton: shell.querySelector('[data-spw-handle-target="prev"]'),
    nextButton: shell.querySelector('[data-spw-handle-target="next"]'),
    bottomButton: shell.querySelector('[data-spw-handle-target="bottom"]'),
    similarButton: shell.querySelector('[data-spw-handle-target="similar"]'),
    contrastButton: shell.querySelector('[data-spw-handle-target="contrast"]'),
    resonateButton: shell.querySelector('[data-spw-handle-target="resonate"]'),
    liveRegion: shell.querySelector('.spw-section-handle-live'),
  };
}

function syncSectionHandleShellState(shell, toggleButton, compact) {
  shell.setAttribute(HANDLE_SHELL_STATE_ATTR, compact ? 'collapsed' : 'expanded');
  if (!(toggleButton instanceof HTMLButtonElement)) return;
  toggleButton.setAttribute('aria-expanded', compact ? 'false' : 'true');
  toggleButton.setAttribute(
    'aria-label',
    compact ? 'Expand page travel rail' : 'Collapse page travel rail'
  );
  toggleButton.title = compact ? 'Open page travel rail' : 'Compact page travel rail';
  toggleButton.textContent = compact ? 'rail' : 'trim';
}

function syncSectionHandlePhase(shell, handle, phase) {
  setHandlePhase(shell, phase);
  setHandlePhase(handle, phase);
}

function syncSectionHandleVisibility(handle, shell, visible) {
  setHandleState(handle, visible ? 'visible' : 'hidden');
  setHandleState(shell, visible ? 'visible' : 'hidden');
  syncFloatingChromeState(document, {
    source: 'attention-architecture',
    reason: visible ? 'section-handle-visible' : 'section-handle-hidden',
  });
}

function syncSectionHandleAvailability(refs, activeIndex, sectionCount) {
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < sectionCount - 1;
  [
    [refs.topButton, hasPrev],
    [refs.prevButton, hasPrev],
    [refs.nextButton, hasNext],
    [refs.bottomButton, hasNext],
  ].forEach(([button, enabled]) => {
    if (!(button instanceof HTMLButtonElement)) return;
    button.disabled = !enabled;
    button.setAttribute('aria-disabled', enabled ? 'false' : 'true');
  });
}

function regionKinRecords(sections) {
  return sections.map((section, index) => {
    const info = describeSection(section, index, sections);
    return {
      id: info?.id || section.id,
      seat: info?.seat || section.getAttribute('data-spw-region') || '',
      operator: info?.operator || '',
      wonder: info?.wonder || '',
      expression: info?.expression || getSectionExpression(section) || '',
    };
  });
}

function syncRegionKinTravel(refs, sections, activeIndex) {
  const records = regionKinRecords(sections);
  const active = records[activeIndex];
  const ids = kinIds(pickRegionKin(active, records));
  const buttons = [
    [refs.similarButton, ids.similar, 'similar'],
    [refs.contrastButton, ids.contrast, 'contrast'],
    [refs.resonateButton, ids.resonate, 'resonate'],
  ];
  buttons.forEach(([button, id, relation]) => {
    if (!(button instanceof HTMLButtonElement)) return;
    const enabled = Boolean(id);
    button.disabled = !enabled;
    button.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    button.dataset.spwRegionTarget = id || '';
    button.dataset.spwRegionRelation = relation;
    if (enabled) {
      const target = sections.find((section, index) => (
        (section.id || ensureSectionId(section, index)) === id
      ));
      const label = target ? getSectionLabel(target) : relation;
      button.setAttribute('aria-label', `Jump to ${relation} region: ${label}`);
    }
  });
  if (refs.shell instanceof HTMLElement) {
    refs.shell.dataset.spwRegionSimilar = ids.similar || '';
    refs.shell.dataset.spwRegionContrast = ids.contrast || '';
    refs.shell.dataset.spwRegionResonate = ids.resonate || '';
  }
}

function syncSectionHandleAttributes(handle, shell, info, activeIndex, sectionCount, snapshot, source) {
  const progress = getSectionProgress(activeIndex, sectionCount);
  const step = sectionCount > 0 ? (activeIndex + 1) / sectionCount : 1;

  writeAttributes(handle, {
    href: `#${info.id}`,
    'aria-label': `Jump to ${info.label}`,
    [HANDLE_OP_ATTR]: info.token || '',
    [HANDLE_LABEL_ATTR]: info.label || '',
  });

  writeAttributes(shell, {
    [HANDLE_LABEL_ATTR]: info.label || '',
    [HANDLE_OP_ATTR]: info.token || '',
    [HANDLE_AVAILABILITY_ATTR]: snapshot.availability.join(' '),
  });

  if (info.consequence) {
    handle.setAttribute('data-spw-consequence', info.consequence);
    shell.setAttribute('data-spw-consequence', info.consequence);
  } else {
    handle.removeAttribute('data-spw-consequence');
    shell.removeAttribute('data-spw-consequence');
  }

  if (info.operator) {
    handle.setAttribute('data-spw-operator', info.operator);
    shell.setAttribute('data-spw-operator', info.operator);
  }

  shell.dataset.spwHandleCurrent = info.id;
  shell.dataset.spwHandleIndex = String(activeIndex + 1);
  shell.dataset.spwHandleCount = String(sectionCount);
  shell.dataset.spwHandleSource = source;
  writeSectionProgressStyle(shell, progress, step);
}

function syncSectionHandleSections(sections, activeIndex) {
  sections.forEach((section, index) => {
    writeAttributes(section, {
      [SECTION_STATE_ATTR]: getSectionLifecycleState(index, activeIndex),
      [SECTION_TIER_ATTR]: getSectionTier(section),
    });
  });
}

/* UX enhancement for floating chrome (section handle): context-sensitive vocabulary resonance.
   When the active section contains primable vocabulary terms, the handle gets a hint
   so it can visually "invite" wonder priming and feel more alive with the page content.
   This ties the floating chrome directly to interactive vocabulary development and
   page-specific attentional rhythm without new heavy logic. */
function resolveHandleApproach(visible, phase, sectionCount) {
  if (!visible || sectionCount <= 1) return 'distant';
  if (phase === 'traveling') return 'approaching';
  return 'arrival';
}

/** Wonder invitation + expressive approach on the handle shell only.
    Reach, return, and invitation copy use existing page_locomotion_handle datasets
    (availability, page-section-*, section-handle-label) — no parallel root attrs. */
function syncRootFieldBalance(visible, activeIndex, sectionCount) {
  const root = document.documentElement;
  if (root.dataset.spwWonderMemoryState === 'active') return;

  if (visible && sectionCount > 1) {
    const progress = getSectionProgress(activeIndex, sectionCount);
    root.style.setProperty('--field-balance', computeLocomotionFieldBalance(progress));
    return;
  }

  root.style.removeProperty('--field-balance');
}

function syncChromeLocomotionExpression(snapshot, visible, phase, handle, shell) {
  const activeTrail = visible && snapshot.sectionCount > 1;
  const approach = resolveHandleApproach(visible, phase, snapshot.sectionCount);

  [handle, shell].forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (activeTrail) {
      node.setAttribute(WONDER_ENTRY_ATTR, 'section-locomotion');
      node.setAttribute(APPROACH_ATTR, approach);
    } else {
      node.removeAttribute(WONDER_ENTRY_ATTR);
      node.removeAttribute(APPROACH_ATTR);
    }
  });
}

function syncSectionVocabularyHint(sections, activeIndex, handle, shell) {
  if (!handle || !shell) return;
  const active = sections[activeIndex];
  if (!active) {
    handle.removeAttribute('data-spw-section-has-vocabulary');
    shell.removeAttribute('data-spw-section-has-vocabulary');
    return;
  }
  const hasVocab = !!active.querySelector('[data-spw-vocabulary-term]');
  const attr = 'data-spw-section-has-vocabulary';
  if (hasVocab) {
    handle.setAttribute(attr, 'true');
    shell.setAttribute(attr, 'true');
  } else {
    handle.removeAttribute(attr);
    shell.removeAttribute(attr);
  }
}

function updateSectionHandleState({
  sections,
  state,
  handle,
  shell,
  refs,
  generated,
  source = 'sync',
  updateActiveState,
}) {
  state.activeIndex = resolveActiveIndex(sections);
  const activeSection = sections[state.activeIndex];
  const info = describeSection(activeSection, state.activeIndex, sections);
  if (!info) return;

  const snapshot = buildSectionSnapshot(
    activeSection,
    state.activeIndex,
    state.activeIndex,
    state.phase,
    source,
    generated ? 'generated' : 'markup',
    sections.length
  );
  if (!snapshot) return;

  syncHandleContent(
    {
      opNode: refs.opNode,
      labelNode: refs.labelNode,
      currentToken: refs.currentToken,
      currentLabel: refs.currentLabel,
      currentForm: refs.currentForm,
      progressNode: refs.progressNode,
      currentLink: refs.currentLink,
      prevButton: refs.prevButton,
      nextButton: refs.nextButton,
    },
    info,
    state.activeIndex,
    sections.length
  );

  syncSectionHandleAttributes(handle, shell, info, state.activeIndex, sections.length, snapshot, source);
  syncSectionHandleSections(sections, state.activeIndex);
  syncSectionHandleAvailability(refs, state.activeIndex, sections.length);
  syncRegionKinTravel(refs, sections, state.activeIndex);

  const compactViewport = window.matchMedia?.(HANDLE_COMPACT_QUERY).matches;
  const scrollThreshold = compactViewport
    ? Math.min(HANDLE_VISIBILITY_SCROLL, Math.max(160, (window.innerHeight || 800) * 0.18))
    : Math.max(HANDLE_VISIBILITY_SCROLL, (window.innerHeight || 800) * 0.34);
  const scrolledPast = window.scrollY > scrollThreshold;
  const visible = sections.length > 1 && (scrolledPast || state.activeIndex > 0);
  syncSectionHandleVisibility(handle, shell, visible);
  syncBottomLaneHandlePressure(state, shell, refs.toggleButton);

  writePageSectionDatasets(snapshot);
  syncChromeLocomotionExpression(snapshot, visible, state.phase, handle, shell);
  syncRootFieldBalance(visible, state.activeIndex, sections.length);

  // Enhance floating chrome UX with vocabulary context (for resonance + priming)
  syncSectionVocabularyHint(sections, state.activeIndex, handle, shell);

  // Subvocalization + attentional architecture refinements, resonance with spells and cauldron:
  // Mark handle (and shell) when active section is jump target / has cauldron category / contains primed candidates
  // (wired from composition.js hook on ingredient inspect + visibility modes + card discharge).
  // Gives the section handle a "rehearsal" cue so locomotion feels like subvocal inner-speech (speech bubble metaphysics).
  // Resonance probe already echoes operators; this extends the field to cauldron/spell bidirectional gestures.
  // Enhancement-level (from settings) modulates how rich the transient cues feel (see floating-chrome + notices).
  const hasCauldronResonance = !!(activeSection && (
    activeSection.classList.contains('is-cauldron-jump-target') ||
    activeSection.hasAttribute('data-spw-cauldron-category') ||
    activeSection.querySelector('[data-spw-ingredient-primed], [data-spw-spell-candidate], [data-spw-component-variant="cauldron-candidate"]')
  ));
  if (hasCauldronResonance) {
    handle.setAttribute(SUBVOCAL_REHEARSAL_ATTR, 'cauldron');
    handle.setAttribute(CAULDRON_RESONANCE_ATTR, 'active');
    if (shell) shell.setAttribute(CAULDRON_RESONANCE_ATTR, 'active');
  } else {
    if (handle.hasAttribute(SUBVOCAL_REHEARSAL_ATTR)) handle.removeAttribute(SUBVOCAL_REHEARSAL_ATTR);
    if (handle.hasAttribute(CAULDRON_RESONANCE_ATTR)) handle.removeAttribute(CAULDRON_RESONANCE_ATTR);
    if (shell && shell.hasAttribute(CAULDRON_RESONANCE_ATTR)) shell.removeAttribute(CAULDRON_RESONANCE_ATTR);
  }

  if (state.phase === 'traveling' && state.travelTargetId && info.id === state.travelTargetId) {
    window.clearTimeout(state.travelTimer);
    state.travelTimer = window.setTimeout(() => {
      state.phase = 'settled';
      syncSectionHandlePhase(shell, handle, 'settled');
      updateActiveState('settled');
    }, 120);
  }
}

function resolvePageBottomScrollTarget(sections) {
  const footer = document.querySelector('.site-footer, body > footer');
  if (footer instanceof HTMLElement) return footer;
  return sections[sections.length - 1] || null;
}

function travelSectionHandleToIndex({
  sections,
  state,
  shell,
  handle,
  updateActiveState,
  nextIndex,
  source,
  scrollBlock = 'start',
  targetOverride = null,
}) {
  const targetIndex = Math.max(0, Math.min(nextIndex, sections.length - 1));
  const target = targetOverride || sections[targetIndex];
  if (!target) return;

  state.phase = 'traveling';
  state.travelTargetId = ensureSectionId(target, targetIndex);
  syncSectionHandlePhase(shell, handle, 'traveling');
  window.clearTimeout(state.travelTimer);
  state.travelTimer = window.setTimeout(() => {
    state.phase = 'settled';
    syncSectionHandlePhase(shell, handle, 'settled');
    updateActiveState(`${source}-settled`);
  }, HANDLE_TRAVEL_SETTLE_MS);
  target.scrollIntoView({
    behavior: getScrollBehavior(),
    block: scrollBlock,
    inline: 'nearest',
  });

  // Announce explicit control travel only; passive scroll stays quiet.
  if (EXPLICIT_SECTION_TRAVEL_SOURCES.has(source)) {
    const live = shell.querySelector('.spw-section-handle-live');
    const heading = target.querySelector('h1, h2, h3, .frame-sigil')?.textContent?.trim() || 'section';
    announceSectionTravel(live, heading);
  }

  updateActiveState(source);
}

function setSectionHandleCompactMode(state, shell, toggleButton) {
  syncSectionHandleShellState(shell, toggleButton, state.compact);
}

function syncBottomLaneHandlePressure(state, shell, toggleButton) {
  const pressure = document.documentElement.dataset.spwBottomLaneHandle;
  if (pressure !== 'compact' || state.manualCompact) return;
  if (state.compact) return;
  state.compact = true;
  setSectionHandleCompactMode(state, shell, toggleButton);
}

function createSectionHandleController({
  sections,
  handle,
  shell,
  generated,
}) {
  const refs = getSectionHandleRefs(handle, shell);
  const state = createSectionHandleState();

  const updateActiveState = (source = 'sync') => {
    updateSectionHandleState({
      sections,
      state,
      handle,
      shell,
      refs,
      generated,
      source,
      updateActiveState,
    });
  };

  const runUpdate = (source = 'scroll') => {
    if (state.raf) return;
    state.raf = window.requestAnimationFrame(() => {
      state.raf = 0;
      updateActiveState(source);
    });
  };

  const syncCompactPreference = () => {
    if (!state.manualCompact) {
      state.compact = window.matchMedia(HANDLE_COMPACT_QUERY).matches;
    }
    if (!window.matchMedia(HANDLE_COMPACT_QUERY).matches) {
      state.compact = false;
      state.manualCompact = false;
    }
    setSectionHandleCompactMode(state, shell, refs.toggleButton);
  };

  const handleButtonClick = (event) => {
    const button = event.target.closest?.('[data-spw-handle-target]');
    if (!(button instanceof HTMLButtonElement)) return;
    const target = button.dataset.spwHandleTarget || '';
    switch (target) {
      case 'toggle':
        state.compact = !state.compact;
        state.manualCompact = true;
        setSectionHandleCompactMode(state, shell, refs.toggleButton);
        updateActiveState('toggle');
        syncFloatingChromeState(document, {
          source: 'attention-architecture',
          reason: 'section-handle-compact-toggle',
        });

        // Instrumentation for debuggability of floating chrome interactions
        try {
          const bus = window.__SPW_SITE__?.bus || window.bus;
          bus?.emit?.('spw:chrome-interaction', {
            type: 'section-handle-compact-toggle',
            compact: state.compact,
            source: 'user',
          });
        } catch (_) {}
        break;
      case 'top':
        travelSectionHandleToIndex({
          sections,
          state,
          shell,
          handle,
          updateActiveState,
          nextIndex: 0,
          source: 'top',
        });
        break;
      case 'prev':
        travelSectionHandleToIndex({
          sections,
          state,
          shell,
          handle,
          updateActiveState,
          nextIndex: state.activeIndex - 1,
          source: 'prev',
        });
        break;
      case 'next':
        travelSectionHandleToIndex({
          sections,
          state,
          shell,
          handle,
          updateActiveState,
          nextIndex: state.activeIndex + 1,
          source: 'next',
        });
        break;
      case 'bottom':
        travelSectionHandleToIndex({
          sections,
          state,
          shell,
          handle,
          updateActiveState,
          nextIndex: sections.length - 1,
          source: 'bottom',
          scrollBlock: 'end',
          targetOverride: resolvePageBottomScrollTarget(sections),
        });
        break;
      case 'similar':
      case 'contrast':
      case 'resonate': {
        if (skipKinClick) break;
        const kinId = button.dataset.spwRegionTarget || '';
        const nextIndex = sections.findIndex((section, index) => (
          (section.id || ensureSectionId(section, index)) === kinId
        ));
        if (nextIndex >= 0) {
          travelSectionHandleToIndex({
            sections,
            state,
            shell,
            handle,
            updateActiveState,
            nextIndex,
            source: target,
          });
        }
        break;
      }
      default:
        break;
    }
  };

  const clearRegionPreview = () => {
    document.documentElement.removeAttribute('data-spw-region-preview');
    document.querySelectorAll('[data-spw-region-preview="true"]').forEach((node) => {
      delete node.dataset.spwRegionPreview;
    });
  };

  const previewRegion = (id) => {
    clearRegionPreview();
    if (!id) return;
    document.documentElement.setAttribute('data-spw-region-preview', id);
    const target = document.getElementById(id);
    if (target) target.dataset.spwRegionPreview = 'true';
  };

  let skipKinClick = false;
  let holdTimer = 0;
  const HOLD_MS = 380;

  const handleKinPointerDown = (event) => {
    const button = event.target.closest?.('[data-spw-region-relation]');
    if (!(button instanceof HTMLButtonElement) || button.disabled) return;
    window.clearTimeout(holdTimer);
    holdTimer = window.setTimeout(() => {
      skipKinClick = true;
      previewRegion(button.dataset.spwRegionTarget || '');
    }, HOLD_MS);
  };

  const handleKinPointerUp = () => {
    window.clearTimeout(holdTimer);
    holdTimer = 0;
    window.setTimeout(() => {
      skipKinClick = false;
      clearRegionPreview();
    }, 40);
  };

  let swipeStartX = 0;
  let swipeArmed = false;
  const handleShellPointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    swipeStartX = event.clientX || 0;
    swipeArmed = true;
  };
  const handleShellPointerUp = (event) => {
    if (!swipeArmed) return;
    swipeArmed = false;
    const dx = (event.clientX || 0) - swipeStartX;
    if (Math.abs(dx) < 48) return;
    const current = shell.dataset.spwRegionKinFocus || 'similar';
    const next = dx < 0 ? nextKinRelation(current) : (
      current === 'similar' ? 'resonate' : current === 'resonate' ? 'contrast' : 'similar'
    );
    shell.dataset.spwRegionKinFocus = next;
    const button = refs[`${next}Button`];
    const kinId = button?.dataset.spwRegionTarget || '';
    const nextIndex = sections.findIndex((section, index) => (
      (section.id || ensureSectionId(section, index)) === kinId
    ));
    if (nextIndex >= 0) {
      event.preventDefault();
      travelSectionHandleToIndex({
        sections,
        state,
        shell,
        handle,
        updateActiveState,
        nextIndex,
        source: next,
      });
    }
  };

  const handleCurrentClick = () => {
    state.phase = 'traveling';
    syncSectionHandlePhase(shell, handle, 'traveling');
    window.clearTimeout(state.travelTimer);
    state.travelTimer = window.setTimeout(() => {
      state.phase = 'settled';
      syncSectionHandlePhase(shell, handle, 'settled');
      updateActiveState('current-settled');
    }, HANDLE_TRAVEL_SETTLE_MS);
  };

  const handleShellKeydown = (event) => {
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        travelSectionHandleToIndex({
          sections,
          state,
          shell,
          handle,
          updateActiveState,
          nextIndex: state.activeIndex - 1,
          source: 'arrow-prev',
        });
        break;
      case 'ArrowRight':
        event.preventDefault();
        travelSectionHandleToIndex({
          sections,
          state,
          shell,
          handle,
          updateActiveState,
          nextIndex: state.activeIndex + 1,
          source: 'arrow-next',
        });
        break;
      case 'Home':
        event.preventDefault();
        travelSectionHandleToIndex({
          sections,
          state,
          shell,
          handle,
          updateActiveState,
          nextIndex: 0,
          source: 'home',
        });
        break;
      case 'End':
        event.preventDefault();
        travelSectionHandleToIndex({
          sections,
          state,
          shell,
          handle,
          updateActiveState,
          nextIndex: sections.length - 1,
          source: 'end',
        });
        break;
      default:
        break;
    }
  };

  const onScroll = () => {
    runUpdate('scroll');
  };

  const onResize = () => {
    syncCompactPreference();
    runUpdate('resize');
  };

  shell.addEventListener('click', handleButtonClick);
  shell.addEventListener('keydown', handleShellKeydown);
  shell.addEventListener('pointerdown', handleKinPointerDown);
  shell.addEventListener('pointerup', handleKinPointerUp);
  shell.addEventListener('pointercancel', handleKinPointerUp);
  shell.addEventListener('pointerdown', handleShellPointerDown);
  shell.addEventListener('pointerup', handleShellPointerUp);
  refs.currentLink?.addEventListener('click', handleCurrentClick);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize);

  syncSectionHandlePhase(shell, handle, 'settled');
  syncCompactPreference();
  updateActiveState('init');

  return () => {
    shell.removeEventListener('click', handleButtonClick);
    shell.removeEventListener('keydown', handleShellKeydown);
    shell.removeEventListener('pointerdown', handleKinPointerDown);
    shell.removeEventListener('pointerup', handleKinPointerUp);
    shell.removeEventListener('pointercancel', handleKinPointerUp);
    shell.removeEventListener('pointerdown', handleShellPointerDown);
    shell.removeEventListener('pointerup', handleShellPointerUp);
    refs.currentLink?.removeEventListener('click', handleCurrentClick);
    window.clearTimeout(holdTimer);
    clearRegionPreview();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
    if (state.raf) {
      window.cancelAnimationFrame(state.raf);
      state.raf = 0;
    }
    window.clearTimeout(state.travelTimer);
    shell.remove();
    handle.hidden = false;
    clearAttributes(handle, [HANDLE_ENHANCED_ATTR, HANDLE_PHASE_ATTR, HANDLE_AVAILABILITY_ATTR, WONDER_ENTRY_ATTR, APPROACH_ATTR]);
    sections.forEach((section) => {
      clearAttributes(section, [SECTION_STATE_ATTR, SECTION_INDEX_ATTR, SECTION_TIER_ATTR]);
    });
    [document.documentElement, document.body].forEach((node) => {
      clearAttributes(node, [
        PAGE_SECTION_CURRENT_ATTR,
        PAGE_SECTION_INDEX_ATTR,
        PAGE_SECTION_COUNT_ATTR,
        PAGE_SECTION_PHASE_ATTR,
        PAGE_SECTION_EDGE_ATTR,
        PAGE_SECTION_DIRECTION_ATTR,
      ]);
      node.style.removeProperty('--spw-section-progress');
      node.style.removeProperty('--spw-section-step');
    });
    if (document.documentElement.dataset.spwWonderMemoryState !== 'active') {
      document.documentElement.style.removeProperty('--field-balance');
    }
    if (generated) {
      handle.remove();
    }
  };
}

function resolveActiveIndex(sections) {
  if (!sections.length) return -1;

  const anchorY = window.scrollY + Math.min(Math.max(window.innerHeight * 0.28, 120), 320);
  let activeIndex = sections.length - 1;

  for (let index = 0; index < sections.length; index += 1) {
    const nextTop = index + 1 < sections.length
      ? sections[index + 1].getBoundingClientRect().top + window.scrollY
      : Number.POSITIVE_INFINITY;

    if (anchorY < nextTop - 1) {
      activeIndex = index;
      break;
    }
  }

  return Math.max(0, activeIndex);
}

function describeAvailability(activeIndex, count) {
  const availability = ['current'];
  if (activeIndex > 0) availability.unshift('prev', 'top');
  if (activeIndex < count - 1) availability.push('next', 'bottom');
  const root = document.documentElement?.dataset || {};
  if (root.spwActiveRegionSimilar || root.spwRegionSimilar) availability.push('similar');
  if (root.spwActiveRegionContrast || root.spwRegionContrast) availability.push('contrast');
  if (root.spwActiveRegionResonate || root.spwRegionResonate) availability.push('resonate');
  return availability;
}

function writePageSectionDatasets(snapshot) {
  const edge = getPageSectionEdge(snapshot.currentIndex, snapshot.sectionCount);
  const direction = getSectionDirection(snapshot.currentIndex);
  const progress = getSectionProgress(snapshot.currentIndex, snapshot.sectionCount);
  const step = snapshot.sectionCount > 0
    ? (snapshot.currentIndex + 1) / snapshot.sectionCount
    : 1;

  [document.documentElement, document.body].forEach((node) => {
    writeAttributes(node, {
      [PAGE_SECTION_CURRENT_ATTR]: snapshot.currentId,
      [PAGE_SECTION_INDEX_ATTR]: snapshot.currentIndex + 1,
      [PAGE_SECTION_COUNT_ATTR]: snapshot.sectionCount,
      [PAGE_SECTION_PHASE_ATTR]: snapshot.phase,
      [PAGE_SECTION_EDGE_ATTR]: edge,
      [PAGE_SECTION_DIRECTION_ATTR]: direction,
    });
    writeSectionProgressStyle(node, progress, step);
  });
  lastSectionIndex = snapshot.currentIndex;

  document.dispatchEvent(new CustomEvent(PAGE_SECTION_EVENT, {
    detail: {
      ...snapshot,
      edge,
      direction,
      progress,
    },
  }));

  const logKey = `${snapshot.currentId}:${snapshot.phase}:${snapshot.source}`;
  if (logKey !== lastSectionLogKey) {
    lastSectionLogKey = logKey;
    logger.debug(
      `section ${snapshot.phase}: ${snapshot.currentLabel}`,
      { ...snapshot, edge },
      SPW_LOG_RELATIONSHIPS.LIFECYCLE
    );
  }
}

function initSectionHandle(root) {
  const sections = collectSections();
  const { handle, generated } = ensureHandle(root, sections);
  if (!handle) return () => {};

  if (!sections.length) {
    setHandleState(handle, 'hidden');
    return () => {};
  }

  const shell = createHandleShell(generated ? 'generated' : 'markup');

  handle.after(shell);
  handle.hidden = true;
  handle.setAttribute(HANDLE_ENHANCED_ATTR, 'true');

  sections.forEach((section, index) => {
    section.setAttribute(SECTION_INDEX_ATTR, String(index + 1));
    ensureSectionId(section, index);
  });

  return createSectionHandleController({
    sections,
    handle,
    shell,
    generated,
  });
}

export { initSectionHandle };
