const INDEX_SELECTOR = '[data-home-section-index]';
const FILTER_SELECTOR = '[data-home-section-filter]';
const CLEAR_SELECTOR = '[data-home-section-filter-clear]';
const STATUS_SELECTOR = '[data-home-section-filter-status]';

function normalizeText(value = '') {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

function resolveLabel(link) {
  return normalizeText(
    link?.dataset?.spwNavLabel
    || link?.getAttribute?.('aria-label')
    || link?.textContent
    || ''
  );
}

function resolveHashId(link) {
  const href = link?.getAttribute?.('href') || '';
  return href.startsWith('#') ? href.slice(1) : '';
}

function initHomeSectionIndex(ctx = {}) {
  const root = document.querySelector(INDEX_SELECTOR);
  if (!(root instanceof HTMLElement)) return;

  const filterInput = root.querySelector(FILTER_SELECTOR);
  const clearButton = root.querySelector(CLEAR_SELECTOR);
  const statusNode = root.querySelector(STATUS_SELECTOR);
  const listItems = Array.from(root.querySelectorAll('li'));
  const entries = listItems
    .map((item) => {
      const link = item.querySelector('a[href^="#"]');
      if (!(link instanceof HTMLAnchorElement)) return null;
      const id = resolveHashId(link);
      const section = id ? document.getElementById(id) : null;
      return {
        item,
        link,
        id,
        section: section instanceof HTMLElement ? section : null,
        label: resolveLabel(link),
      };
    })
    .filter(Boolean);

  if (!filterInput || !entries.length) return;

  let currentId = '';

  function updateStatus(query = '') {
    if (!(statusNode instanceof HTMLElement)) return;
    const visibleCount = entries.filter((entry) => !entry.item.hidden).length;
    const currentEntry = entries.find((entry) => entry.id === currentId && !entry.item.hidden);

    if (!query) {
      statusNode.textContent = currentEntry
        ? `Showing all sections. Current section: ${currentEntry.link.textContent.trim()}.`
        : 'Showing all sections.';
      return;
    }

    if (!visibleCount) {
      statusNode.textContent = `No sections match “${query}”.`;
      return;
    }

    statusNode.textContent = currentEntry
      ? `${visibleCount} section${visibleCount === 1 ? '' : 's'} match “${query}”. Current match: ${currentEntry.link.textContent.trim()}.`
      : `${visibleCount} section${visibleCount === 1 ? '' : 's'} match “${query}”.`;
  }

  function applyFilter(rawValue = '') {
    const query = normalizeText(rawValue);
    root.dataset.homeSectionFiltered = query ? 'true' : 'false';

    let firstVisibleLink = null;

    for (const entry of entries) {
      const matches = !query || entry.label.includes(query) || entry.id.includes(query.replace(/\s+/g, '-'));
      entry.item.hidden = !matches;
      entry.link.dataset.homeSectionMatch = matches ? 'true' : 'false';
      if (matches && !firstVisibleLink) firstVisibleLink = entry.link;
    }

    if (clearButton instanceof HTMLButtonElement) {
      clearButton.hidden = !query;
    }

    updateStatus(query);
    return firstVisibleLink;
  }

  function setCurrent(nextId = '') {
    if (!nextId || nextId === currentId) return;
    currentId = nextId;

    for (const entry of entries) {
      const isCurrent = entry.id === nextId;
      entry.link.dataset.homeSectionCurrent = isCurrent ? 'true' : 'false';
      if (isCurrent) {
        entry.link.setAttribute('aria-current', 'true');
      } else {
        entry.link.removeAttribute('aria-current');
      }
    }

    updateStatus(normalizeText(filterInput.value));
    ctx?.bus?.emit?.('spw:home-section-current', { id: nextId, route: ctx.route || 'home' });
  }

  function resolveCurrentFromScroll() {
    const visibleEntries = entries.filter((entry) => !entry.item.hidden && entry.section);
    if (!visibleEntries.length) return;

    const anchorY = window.scrollY + Math.min(Math.max(window.innerHeight * 0.24, 120), 260);
    let nextEntry = visibleEntries[visibleEntries.length - 1];

    for (const entry of visibleEntries) {
      const top = entry.section.getBoundingClientRect().top + window.scrollY;
      if (anchorY < top - 16) break;
      nextEntry = entry;
    }

    setCurrent(nextEntry.id);
  }

  const handleInput = () => {
    applyFilter(filterInput.value);
    resolveCurrentFromScroll();
  };

  const handleClear = () => {
    filterInput.value = '';
    applyFilter('');
    filterInput.focus();
    resolveCurrentFromScroll();
  };

  const observer = new IntersectionObserver(
    (records) => {
      for (const record of records) {
        if (!record.isIntersecting) continue;
        const entry = entries.find((candidate) => candidate.section === record.target);
        if (entry && !entry.item.hidden) {
          setCurrent(entry.id);
        }
      }
    },
    {
      rootMargin: '-18% 0px -58% 0px',
      threshold: [0, 0.2, 0.5, 1],
    }
  );

  for (const entry of entries) {
    if (entry.section) observer.observe(entry.section);
  }

  filterInput.addEventListener('input', handleInput);
  clearButton?.addEventListener('click', handleClear);
  window.addEventListener('scroll', resolveCurrentFromScroll, { passive: true });
  window.addEventListener('hashchange', resolveCurrentFromScroll);

  applyFilter(filterInput.value);
  resolveCurrentFromScroll();

  return () => {
    observer.disconnect();
    filterInput.removeEventListener('input', handleInput);
    clearButton?.removeEventListener('click', handleClear);
    window.removeEventListener('scroll', resolveCurrentFromScroll);
    window.removeEventListener('hashchange', resolveCurrentFromScroll);
  };
}

export { initHomeSectionIndex };
