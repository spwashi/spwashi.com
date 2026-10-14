/**
 * Spw code blocks on any page: `<pre><code class="language-spw">`.
 *
 * With scripts off a block is plain text. With this module it reads the way
 * the editor reads it (semantic/spw-highlight.js over the reader's roles,
 * every mark in its operator color), and two actions sit over its corner:
 * Edit, a link into the literal parser carrying this source, and Copy.
 * Highlighting changes color only, and the actions are positioned over the
 * block, so nothing on the page moves when a block wakes.
 */
import { ensureSpwSourceStyles } from '../../kernel/deferred-styles.js';
import { parserHref } from '../../kernel/parser-link.js';
import { highlightSpw } from '../../semantic/spw-highlight.js';

let readerLoad = null;
const loadReader = () => (readerLoad ||= import('../../semantic/spw-workbench-reader.js'));
const painted = new WeakSet();

/** The block's own name for the parser: the first #> anchor, or nothing. */
function nameOf(source) {
  const anchor = source.match(/#>([A-Za-z_][\w.-]*)/);
  return anchor ? `${anchor[1]}.spw` : '';
}

function actionsFor(code, source) {
  const bar = document.createElement('div');
  bar.className = 'spw-code-actions';
  const href = parserHref(source, nameOf(source));
  if (href) {
    const edit = document.createElement('a');
    edit.href = href;
    edit.textContent = 'Edit';
    edit.title = 'Open this Spw in the parser, highlighted as you edit it';
    bar.append(edit);
  }
  const copy = document.createElement('button');
  copy.type = 'button';
  copy.textContent = 'Copy';
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code.textContent);
      copy.textContent = 'Copied';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      copy.textContent = 'Selected';
    }
    window.setTimeout(() => { copy.textContent = 'Copy'; }, 1600);
  });
  bar.append(copy);
  return bar;
}

/** Paint one block. Idempotent: a block already painted is left alone. */
export async function mountSpwCode(code) {
  if (!(code instanceof HTMLElement) || painted.has(code)) return;
  const pre = code.parentElement;
  if (!(pre instanceof HTMLPreElement)) return;
  painted.add(code);
  const source = code.textContent;
  ensureSpwSourceStyles();
  try {
    const reader = await loadReader();
    code.innerHTML = highlightSpw(source, reader.roles(source));
  } catch {
    // The text stays as it was; the actions still help.
  }
  pre.append(actionsFor(code, source));
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'spw-code',
  mount: (_ctx, root) => mountSpwCode(root),
  describes: 'code[spw]{read.highlight.edit}<parser> paints each Spw code block as the editor reads it, every mark in its operator color, with Edit and Copy over its corner',
  timingArc: 'visible-feature',
  effectScope: ['local-dom', 'listeners', 'network', 'window'],
});
