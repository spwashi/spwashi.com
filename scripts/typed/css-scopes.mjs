import { FULL_STYLESHEET_HREF, normalizeSpace, resolveScopedStylesheets, } from './css-manifest.mjs';
import { splitList } from './site-contracts/helpers.mjs';
export function parseStylesheetMode(value) {
    const normalized = normalizeSpace(value).toLowerCase();
    return normalized === 'scoped' ? 'scoped' : 'full';
}
export function resolveRouteStylesheets(options = {}) {
    const mode = options.mode || 'full';
    if (mode !== 'scoped') {
        return [{ href: FULL_STYLESHEET_HREF, kind: 'full' }];
    }
    return resolveScopedStylesheets({
        surface: options.surface,
        features: options.features,
        extraStyles: options.extraStyles,
    });
}
export function renderStylesheetLinks(sheets, indent = '    ') {
    return sheets
        .map((sheet) => `${indent}<link rel="stylesheet" href="${sheet.href}" data-spw-css-scope="${sheet.kind}${sheet.scope ? `:${sheet.scope}` : ''}" />`)
        .join('\n');
}
export function extractBodyScopeAttributes(source) {
    const bodyMatch = source.match(/<body\b([^>]*)>/i);
    const attrs = {};
    if (bodyMatch?.[1]) {
        const attrPattern = /([a-zA-Z][a-zA-Z0-9_:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s/>]+))/g;
        for (const match of bodyMatch[1].matchAll(attrPattern)) {
            attrs[match[1]] = match[2] ?? match[3] ?? match[4] ?? '';
        }
    }
    return {
        surface: normalizeSpace(attrs['data-spw-surface']),
        features: splitList(attrs['data-spw-features']),
        stylesheetMode: parseStylesheetMode(attrs['data-spw-stylesheet-mode']),
        extraStyles: splitList(attrs['data-spw-extra-styles']),
    };
}
export function applyScopedStylesheets(source) {
    const { surface, features, stylesheetMode, extraStyles } = extractBodyScopeAttributes(source);
    if (stylesheetMode !== 'scoped')
        return source;
    const sheets = resolveRouteStylesheets({
        surface,
        features,
        extraStyles,
        mode: 'scoped',
    });
    const links = renderStylesheetLinks(sheets);
    const styleLinkPattern = /\s*<link\b[^>]*href=["']\/public\/css\/style\.css["'][^>]*>\s*/i;
    if (!styleLinkPattern.test(source))
        return source;
    return source.replace(styleLinkPattern, `\n${links}\n`);
}
