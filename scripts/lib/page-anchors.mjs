/**
 * The ids a route page answers to.
 *
 * A page's anchors are its own markup plus partials pulled in with
 * <spw-include src="…">, without commented-out examples. Anchors a runtime
 * module creates on mount cannot be seen in markup; name them in
 * RUNTIME_ANCHORS with the module that makes them.
 *
 * Shared by audit:route-links (hrefs between pages) and spw:integrity
 * (~"/route/#id" citations from .spw into pages, the way a copy unit is cited
 * by its place), so both read one answer to "does this anchor exist".
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

export const RUNTIME_ANCHORS = Object.freeze({
  '/play/rpg-wednesday/': ['rpgw-state-curator'], // public/js/modules/rpg-wednesday/curate.js
});

export const stripComments = (html) => html.replace(/<!--[\s\S]*?-->/g, '');

export function withPartials(html, root) {
  return html.replace(/<spw-include\s+src="([^"]+)"\s*>\s*<\/spw-include>/g, (whole, src) => {
    const partial = path.join(root, '_partials', `${src}.html`);
    return existsSync(partial) ? readFileSync(partial, 'utf8') : whole;
  });
}

// The attribute must be `id` itself; `\bid=` also matched data-id="…".
const ID_ATTR_RE = /\sid=(["'])([^"']+)\1/g;

export function anchorsOfPage(html, route, root) {
  const ids = new Set([...stripComments(withPartials(html, root)).matchAll(ID_ATTR_RE)].map((m) => m[2]));
  for (const id of RUNTIME_ANCHORS[route] || []) ids.add(id);
  return ids;
}

/** The route a page file serves: about/index.html → /about/. */
export function routeOfPage(file, root) {
  const rel = path.relative(root, path.dirname(file)).split(path.sep).join('/');
  return rel ? `/${rel}/` : '/';
}
