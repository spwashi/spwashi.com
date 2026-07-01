// bare-spw-markup.js
//
// Progressive enhancement for bare Spw grammar in HTML prose.
// Wraps delimiter tokens and inline operator sigils so runtime modules,
// gesture physics, and geometry projection can address them consistently.

import { BARE_SPW_CONTAINER_SELECTOR } from '/public/js/kernel/dom-contracts.js';
import { detectOperator } from '/public/js/kernel/shared.js';

let initialized = false;

const SKIP_ANCESTOR_SELECTOR = [
  'script',
  'style',
  'code',
  'pre',
  'textarea',
  'svg',
  'math',
  '.syntax-token',
  '.operator-chip',
  '.frame-sigil',
  '.frame-card-sigil',
  '.frame-panel-sigil',
  '.spw-delimiter',
  '.spw-living-term',
  '[data-spw-operator]',
  '[data-spw-semantic-expression]',
  '[data-spw-bare-spw-enhanced="true"]',
].join(', ');

const DELIMITER_FORMS = Object.freeze({
  '{': Object.freeze({ form: 'brace', className: 'spw-delimiter--brace', perspective: 'objective' }),
  '}': Object.freeze({ form: 'brace', className: 'spw-delimiter--brace', perspective: 'subjective' }),
  '[': Object.freeze({ form: 'block', className: 'spw-delimiter--square', perspective: 'objective' }),
  ']': Object.freeze({ form: 'block', className: 'spw-delimiter--square', perspective: 'subjective' }),
  '<': Object.freeze({ form: 'angle', className: 'spw-delimiter--angle', perspective: 'objective' }),
  '>': Object.freeze({ form: 'angle', className: 'spw-delimiter--angle', perspective: 'subjective' }),
  '(': Object.freeze({ form: 'circle', className: 'spw-delimiter--paren', perspective: 'objective' }),
  ')': Object.freeze({ form: 'circle', className: 'spw-delimiter--paren', perspective: 'subjective' }),
});

const BARE_TOKEN_RE = /(#>|#:|#|\.|\^|~|\?|@|\*|&|=|\$|%|!)(?:"[^"]+"|'[^']+'|[^\s,.;:!?[\]{}()<>"']+)|[{}[\]<>()]/g;

const shouldSkipTextNode = (node) => {
  if (!(node instanceof Text)) return true;
  const parent = node.parentElement;
  if (!parent) return true;
  if (parent.closest(SKIP_ANCESTOR_SELECTOR)) return true;
  return !node.textContent?.trim();
};

const createDelimiterSpan = (char) => {
  const meta = DELIMITER_FORMS[char];
  if (!meta) return document.createTextNode(char);

  const span = document.createElement('span');
  span.className = `spw-delimiter ${meta.className}`;
  span.dataset.spwForm = meta.form;
  span.dataset.spwDelimiter = char;
  span.dataset.spwPerspective = meta.perspective;
  span.dataset.spwBareSpw = 'enhanced';
  span.setAttribute('aria-hidden', 'true');
  span.textContent = char;
  return span;
};

const createSyntaxToken = (text) => {
  const span = document.createElement('span');
  span.className = 'syntax-token';
  span.textContent = text;
  span.dataset.spwBareSpw = 'enhanced';

  const op = detectOperator(text);
  if (op) span.dataset.spwOperator = op.type;

  return span;
};

const enhanceTextNode = (textNode) => {
  const text = textNode.textContent;
  if (!text || !BARE_TOKEN_RE.test(text)) return false;

  BARE_TOKEN_RE.lastIndex = 0;
  const fragment = document.createDocumentFragment();
  let lastIndex = 0;
  let match;

  while ((match = BARE_TOKEN_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
    }

    const token = match[0];
    fragment.appendChild(
      DELIMITER_FORMS[token]
        ? createDelimiterSpan(token)
        : createSyntaxToken(token),
    );
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  textNode.parentNode?.replaceChild(fragment, textNode);
  return true;
};

const enhanceContainer = (container) => {
  if (!(container instanceof HTMLElement)) return;
  if (container.dataset.spwBareSpwEnhanced === 'true') return;

  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        return shouldSkipTextNode(node)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      },
    },
  );

  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  let changed = false;
  for (const node of textNodes) {
    if (enhanceTextNode(node)) changed = true;
  }

  if (changed || container.matches(BARE_SPW_CONTAINER_SELECTOR)) {
    container.dataset.spwBareSpwEnhanced = 'true';
  }
};

const enhanceBareSpwMarkup = (root = document) => {
  const scope = root instanceof Element ? root : document;
  scope.querySelectorAll(BARE_SPW_CONTAINER_SELECTOR).forEach(enhanceContainer);
};

export function initBareSpwMarkup() {
  if (initialized) return () => {};
  initialized = true;

  enhanceBareSpwMarkup();

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches?.(BARE_SPW_CONTAINER_SELECTOR)) {
          enhanceContainer(node);
          continue;
        }
        enhanceBareSpwMarkup(node);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    initialized = false;
  };
}