import {
  emptyProfile,
  parseBadgeLine,
  profileToJSON,
  profileToSpw,
  renderProfileCard,
} from './spw-profile-builder.js';

const DEFAULT_STORAGE_PREFIX = 'spw-profile-tool';

export function initSpwProfileTool(options = {}) {
  const root = options.root || document;
  const storageKey = options.storageKey || `${DEFAULT_STORAGE_PREFIX}:${window.location.pathname}`;
  const defaultProfile = resolveDefaultProfile(root, options);
  let currentPresetScriptId = options.defaultProfileScriptId || '';
  let profile = hydrateProfile(defaultProfile, null);
  let saveTimer = null;

  const elements = {
    preview: root.querySelector('#profile-preview'),
    name: root.querySelector('#f-name'),
    role: root.querySelector('#f-role'),
    tagline: root.querySelector('#f-tagline'),
    status: root.querySelector('#f-status'),
    sigil: root.querySelector('#f-sigil'),
    contact: root.querySelector('#f-contact'),
    badgeInput: root.querySelector('#badge-input'),
    badgeCluster: root.querySelector('#badge-cluster'),
    badgeAdd: root.querySelector('#badge-add'),
    badgeStrip: root.querySelector('#badge-strip'),
    linkInput: root.querySelector('#link-input'),
    linkHref: root.querySelector('#link-href'),
    linkAdd: root.querySelector('#link-add'),
    linkStrip: root.querySelector('#link-strip'),
    jsonImportArea: root.querySelector('#json-import-area'),
    jsonImportBtn: root.querySelector('#json-import-btn'),
  };

  const sectionHeadings = [...root.querySelectorAll('.section-heading')];
  const sectionBodies = [...root.querySelectorAll('.section-body')];
  const sectionOperators = [...root.querySelectorAll('.section-operator')];
  const exportButtons = [...root.querySelectorAll('[data-export]')];
  const presetButtons = [...root.querySelectorAll('[data-profile-preset-script]')];
  const builderPanels = [...root.querySelectorAll('.profile-builder-panel')];
  const builderNavLinks = [...root.querySelectorAll('.profile-builder-nav a[href^="#"]')];
  const compactPanelQuery = window.matchMedia('(max-width: 820px)');

  function scheduleSave() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(profile));
      } catch {}
    }, 420);
  }

  function syncFieldStates() {
    root.querySelectorAll('.profile-field').forEach((field) => {
      const controls = [...field.querySelectorAll('input, textarea, select')];
      const hasValue = controls.some((control) => String(control.value || '').trim());
      const isActive = field.contains(document.activeElement);
      field.dataset.fieldState = hasValue ? 'complete' : isActive ? 'active' : 'draft';
    });
  }

  function renderBadgeStrip() {
    if (!elements.badgeStrip) return;
    elements.badgeStrip.innerHTML = profile.badges.map((badge, index) => `
      <span class="profile-tag" data-cluster="${escapeHtml(badge.cluster)}">
        <span>${escapeHtml(badge.value)}</span>
        <button class="profile-tag-remove" data-remove-badge="${index}" aria-label="remove ${escapeHtml(badge.value)}">×</button>
      </span>
    `).join('');

    elements.badgeStrip.querySelectorAll('[data-remove-badge]').forEach((button) => {
      button.addEventListener('click', () => {
        profile.badges.splice(Number(button.dataset.removeBadge), 1);
        renderBadgeStrip();
        update();
      });
    });
  }

  function renderLinkStrip() {
    if (!elements.linkStrip) return;
    elements.linkStrip.innerHTML = profile.footer.links.map((link, index) => `
      <span class="profile-tag">
        <span>${escapeHtml(link.label)}</span>
        <button class="profile-tag-remove" data-remove-link="${index}" aria-label="remove ${escapeHtml(link.label)}">×</button>
      </span>
    `).join('');

    elements.linkStrip.querySelectorAll('[data-remove-link]').forEach((button) => {
      button.addEventListener('click', () => {
        profile.footer.links.splice(Number(button.dataset.removeLink), 1);
        renderLinkStrip();
        update();
      });
    });
  }

  function populateForm() {
    if (elements.name) elements.name.value = profile.header.name || '';
    if (elements.role) elements.role.value = profile.header.role || '';
    if (elements.tagline) elements.tagline.value = profile.header.tagline || '';
    if (elements.status) elements.status.value = profile.header.status || 'available';
    if (elements.sigil) elements.sigil.value = profile.header.sigil || '^';
    if (elements.contact) elements.contact.value = profile.footer.contact || '';

    sectionHeadings.forEach((input, index) => {
      input.value = profile.sections[index]?.heading || '';
    });
    sectionBodies.forEach((input, index) => {
      input.value = profile.sections[index]?.body || '';
    });
    sectionOperators.forEach((input, index) => {
      input.value = profile.sections[index]?.operator || '^';
    });

    syncPresetButtons(currentPresetScriptId);
    syncFieldStates();
  }

  function update() {
    if (elements.preview) renderProfileCard(profile, elements.preview);
    scheduleSave();
    syncFieldStates();
  }

  function replaceProfile(nextProfile, activePresetScriptId = '') {
    currentPresetScriptId = activePresetScriptId;
    profile = hydrateProfile(defaultProfile, nextProfile);
    populateForm();
    renderBadgeStrip();
    renderLinkStrip();
    update();
  }

  function syncPresetButtons(activePresetScriptId = '') {
    presetButtons.forEach((button) => {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.profilePresetScript === activePresetScriptId)
      );
    });
  }

  function addBadge() {
    const raw = elements.badgeInput?.value.trim();
    if (!raw) return;
    const cluster = elements.badgeCluster?.value || 'stack';
    parseBadgeLine(raw, cluster).forEach((badge) => profile.badges.push(badge));
    if (elements.badgeInput) elements.badgeInput.value = '';
    renderBadgeStrip();
    update();
  }

  function addLink() {
    const label = elements.linkInput?.value.trim();
    const href = elements.linkHref?.value.trim();
    if (!label || !href) return;
    profile.footer.links.push({ label, href });
    if (elements.linkInput) elements.linkInput.value = '';
    if (elements.linkHref) elements.linkHref.value = '';
    renderLinkStrip();
    update();
  }

  function load() {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      currentPresetScriptId = '';
      profile = hydrateProfile(defaultProfile, JSON.parse(raw));
    } catch {}
  }

  function bindFields() {
    const headerFields = new Map([
      [elements.name, ['header', 'name']],
      [elements.role, ['header', 'role']],
      [elements.tagline, ['header', 'tagline']],
      [elements.status, ['header', 'status']],
      [elements.sigil, ['header', 'sigil']],
      [elements.contact, ['footer', 'contact']],
    ]);

    headerFields.forEach((path, input) => {
      if (!input) return;
      input.addEventListener('input', () => {
        const [group, key] = path;
        profile[group][key] = input.value;
        update();
      });
    });

    sectionHeadings.forEach((input, index) => {
      input.addEventListener('input', () => {
        ensureSection(index);
        profile.sections[index].heading = input.value;
        update();
      });
    });

    sectionBodies.forEach((input, index) => {
      input.addEventListener('input', () => {
        ensureSection(index);
        profile.sections[index].body = input.value;
        update();
      });
    });

    sectionOperators.forEach((input, index) => {
      input.addEventListener('change', () => {
        ensureSection(index);
        profile.sections[index].operator = input.value;
        update();
      });
    });

    root.addEventListener('focusin', syncFieldStates);
    root.addEventListener('focusout', () => {
      window.setTimeout(syncFieldStates, 0);
    });
  }

  function bindBadges() {
    elements.badgeAdd?.addEventListener('click', addBadge);
    elements.badgeInput?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      addBadge();
    });
  }

  function bindLinks() {
    elements.linkAdd?.addEventListener('click', addLink);
    elements.linkHref?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      addLink();
    });
  }

  function bindExportButtons() {
    exportButtons.forEach((button) => {
      button.addEventListener('click', async () => {
        const type = button.dataset.export;
        if (!type) return;

        if (type === 'clear') {
          replaceProfile(defaultProfile, options.defaultProfileScriptId || '');
          return;
        }

        if (type === 'screenshot') {
          elements.preview?.querySelector('.profile-card')?.classList.toggle('profile-card--screenshot');
          return;
        }

        let text = '';
        if (type === 'json') text = profileToJSON(profile);
        if (type === 'spw') text = profileToSpw(profile);
        if (!text) return;

        const originalText = button.textContent;
        try {
          await navigator.clipboard.writeText(text);
          button.textContent = '✓ copied';
          button.dataset.state = 'success';
        } catch {
          button.textContent = '! failed';
        }

        window.setTimeout(() => {
          button.textContent = originalText;
          delete button.dataset.state;
        }, 1800);
      });
    });
  }

  function bindImport() {
    elements.jsonImportBtn?.addEventListener('click', () => {
      const raw = elements.jsonImportArea?.value.trim();
      if (!raw) return;

      try {
        replaceProfile(JSON.parse(raw));
        if (elements.jsonImportArea) elements.jsonImportArea.value = '';
      } catch {
        window.alert('Invalid JSON — check format and try again.');
      }
    });
  }

  function bindPresets() {
    presetButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const scriptId = button.dataset.profilePresetScript;
        if (!scriptId) return;
        const preset = readJSONScript(scriptId);
        if (!preset) return;
        replaceProfile(preset, scriptId);
      });
    });
  }

  function bindBuilderPanels() {
    if (!builderPanels.length) return;

    const previewPanel = builderPanels.find((panel) =>
      panel.classList.contains('profile-builder-panel--preview')
    );

    const syncCompactPanels = () => {
      if (!compactPanelQuery.matches) {
        builderPanels.forEach((panel) => {
          panel.open = true;
        });
        return;
      }

      const firstContentPanel = builderPanels.find((panel) => panel !== previewPanel);
      const activeContentPanel = builderPanels.find((panel) => panel !== previewPanel && panel.open);

      builderPanels.forEach((panel) => {
        if (panel === previewPanel) return;
        panel.open = activeContentPanel ? panel === activeContentPanel : panel === firstContentPanel;
      });
    };

    builderPanels.forEach((panel) => {
      panel.addEventListener('toggle', () => {
        if (!compactPanelQuery.matches || !panel.open || panel === previewPanel) return;
        builderPanels.forEach((candidate) => {
          if (candidate === panel || candidate === previewPanel) return;
          candidate.open = false;
        });
      });
    });

    builderNavLinks.forEach((link) => {
      link.addEventListener('click', () => {
        const targetSelector = link.getAttribute('href');
        if (!targetSelector) return;
        const target = root.querySelector(targetSelector);
        const panel = target?.matches?.('.profile-builder-panel')
          ? target
          : target?.querySelector?.('.profile-builder-panel');
        if (!panel) return;
        panel.open = true;
      });
    });

    syncCompactPanels();
    compactPanelQuery.addEventListener('change', syncCompactPanels);
  }

  function ensureSection(index) {
    if (profile.sections[index]) return;
    profile.sections[index] = { heading: '', body: '', operator: '^' };
  }

  load();
  bindFields();
  bindBadges();
  bindLinks();
  bindExportButtons();
  bindImport();
  bindPresets();
  bindBuilderPanels();
  populateForm();
  renderBadgeStrip();
  renderLinkStrip();
  update();

  const api = {
    getProfile() {
      return cloneProfile(profile);
    },
    replaceProfile,
    refresh() {
      populateForm();
      renderBadgeStrip();
      renderLinkStrip();
      update();
    },
    destroy() {
      window.clearTimeout(saveTimer);
    },
  };

  window.spwProfileTool = api;
  return api;
}

function resolveDefaultProfile(root, options) {
  if (options.defaultProfile) return hydrateProfile(emptyProfile(), options.defaultProfile);
  if (options.defaultProfileScriptId) {
    const scriptProfile = readJSONScript(options.defaultProfileScriptId, root);
    if (scriptProfile) return hydrateProfile(emptyProfile(), scriptProfile);
  }
  return hydrateProfile(emptyProfile(), null);
}

function hydrateProfile(baseProfile, rawProfile) {
  const empty = emptyProfile();
  const base = normalizeProfile(baseProfile || empty);
  const raw = rawProfile && typeof rawProfile === 'object' ? rawProfile : {};

  return {
    header: {
      ...empty.header,
      ...base.header,
      ...(raw.header || {}),
    },
    badges: Array.isArray(raw.badges)
      ? raw.badges.map(normalizeBadge)
      : base.badges.map(normalizeBadge),
    sections: mergeSections(base.sections, raw.sections),
    footer: {
      ...empty.footer,
      ...base.footer,
      ...(raw.footer || {}),
      links: Array.isArray(raw.footer?.links)
        ? raw.footer.links.map(normalizeLink)
        : base.footer.links.map(normalizeLink),
    },
  };
}

function mergeSections(baseSections, rawSections) {
  const defaults = normalizeProfile(emptyProfile()).sections;
  const base = Array.isArray(baseSections) && baseSections.length
    ? baseSections.map(normalizeSection)
    : defaults.map(normalizeSection);

  if (!Array.isArray(rawSections) || !rawSections.length) return base;

  const count = Math.max(base.length, rawSections.length);
  return Array.from({ length: count }, (_, index) => ({
    ...(base[index] || { heading: '', body: '', operator: '^' }),
    ...(rawSections[index] || {}),
  })).map(normalizeSection);
}

function normalizeProfile(profile) {
  const empty = emptyProfile();
  const raw = profile && typeof profile === 'object' ? profile : {};
  return {
    header: {
      ...empty.header,
      ...(raw.header || {}),
    },
    badges: Array.isArray(raw.badges) ? raw.badges.map(normalizeBadge) : [],
    sections: Array.isArray(raw.sections) && raw.sections.length
      ? raw.sections.map(normalizeSection)
      : empty.sections.map(normalizeSection),
    footer: {
      ...empty.footer,
      ...(raw.footer || {}),
      links: Array.isArray(raw.footer?.links) ? raw.footer.links.map(normalizeLink) : [],
    },
  };
}

function normalizeBadge(badge) {
  return {
    cluster: String(badge?.cluster || 'stack'),
    value: String(badge?.value || ''),
  };
}

function normalizeSection(section) {
  return {
    heading: String(section?.heading || ''),
    body: String(section?.body || ''),
    operator: String(section?.operator || '^'),
  };
}

function normalizeLink(link) {
  return {
    label: String(link?.label || ''),
    href: String(link?.href || ''),
  };
}

function cloneProfile(profile) {
  return JSON.parse(JSON.stringify(profile));
}

function readJSONScript(scriptId, root = document) {
  const script = root.getElementById?.(scriptId) || document.getElementById(scriptId);
  if (!script) return null;

  try {
    return JSON.parse(script.textContent || '{}');
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
