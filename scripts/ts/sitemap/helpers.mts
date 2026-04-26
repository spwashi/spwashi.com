export function escapeXml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function decodeHtmlAttribute(value: string): string {
  const named: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
  };

  return String(value).replace(/&(#x[\da-f]+|#\d+|[a-z][a-z0-9]+);/gi, (match, entity) => {
    const normalized = entity.toLowerCase();

    if (normalized.startsWith('#x')) {
      const codepoint = Number.parseInt(normalized.slice(2), 16);
      return Number.isFinite(codepoint) ? String.fromCodePoint(codepoint) : match;
    }

    if (normalized.startsWith('#')) {
      const codepoint = Number.parseInt(normalized.slice(1), 10);
      return Number.isFinite(codepoint) ? String.fromCodePoint(codepoint) : match;
    }

    return Object.prototype.hasOwnProperty.call(named, normalized)
      ? named[normalized]
      : match;
  });
}

export function findStartTags(html: string, tagName: string): string[] {
  const tags: string[] = [];
  const openTagRe = new RegExp(`<\\s*${tagName}\\b`, 'gi');

  let match: RegExpExecArray | null;
  while ((match = openTagRe.exec(html))) {
    const start = match.index;
    let index = openTagRe.lastIndex;
    let quote: '"' | "'" | null = null;

    for (; index < html.length; index += 1) {
      const char = html[index];

      if (quote) {
        if (char === quote) quote = null;
        continue;
      }

      if (char === '"' || char === "'") {
        quote = char;
        continue;
      }

      if (char === '>') break;
    }

    if (index >= html.length) break;

    tags.push(html.slice(start, index + 1));
    openTagRe.lastIndex = index + 1;
  }

  return tags;
}

export function parseTagAttributes(tag: string): Map<string, string> {
  const attrs = new Map<string, string>();
  let index = 0;

  if (tag[index] === '<') index += 1;
  while (index < tag.length && /\s/.test(tag[index])) index += 1;
  while (index < tag.length && !/[\s/>]/.test(tag[index])) index += 1;

  while (index < tag.length) {
    while (index < tag.length && /\s/.test(tag[index])) index += 1;
    if (tag[index] === '>' || (tag[index] === '/' && tag[index + 1] === '>')) break;

    const nameStart = index;
    while (index < tag.length && !/[\s=/>]/.test(tag[index])) index += 1;

    const name = tag.slice(nameStart, index).trim().toLowerCase();
    if (!name) break;

    while (index < tag.length && /\s/.test(tag[index])) index += 1;

    let value = '';
    if (tag[index] === '=') {
      index += 1;
      while (index < tag.length && /\s/.test(tag[index])) index += 1;

      const quote = tag[index];
      if (quote === '"' || quote === "'") {
        index += 1;
        const valueStart = index;
        while (index < tag.length && tag[index] !== quote) index += 1;
        value = tag.slice(valueStart, index);
        if (tag[index] === quote) index += 1;
      } else {
        const valueStart = index;
        while (index < tag.length && !/[\s>]/.test(tag[index])) index += 1;
        value = tag.slice(valueStart, index);
      }
    }

    attrs.set(name, decodeHtmlAttribute(value));
  }

  return attrs;
}

export function tokenList(value: unknown): string[] {
  return String(value || '')
    .split(/\s+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}

export function robotsTokenList(value: unknown): string[] {
  return String(value || '')
    .split(/[,\s]+/)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}

export function extractCanonical(html: string, repoPath: string): string {
  const canonicals = findStartTags(html, 'link')
    .map(parseTagAttributes)
    .filter((attrs) => tokenList(attrs.get('rel')).includes('canonical'))
    .map((attrs) => attrs.get('href')?.trim())
    .filter(Boolean) as string[];

  const uniqueCanonicals = [...new Set(canonicals)];

  if (uniqueCanonicals.length === 0) {
    throw new Error(`[sitemap] missing canonical link in ${repoPath}`);
  }

  if (uniqueCanonicals.length > 1) {
    throw new Error(`[sitemap] multiple canonical links in ${repoPath}: ${uniqueCanonicals.join(', ')}`);
  }

  return uniqueCanonicals[0]!;
}

export function isNoIndex(html: string): boolean {
  return findStartTags(html, 'meta')
    .map(parseTagAttributes)
    .some((attrs) => {
      const name = attrs.get('name')?.trim().toLowerCase();
      if (name !== 'robots') return false;
      return robotsTokenList(attrs.get('content')).includes('noindex');
    });
}

export function buildSitemapXml(urls: string[]): string {
  const rows = urls.map((url) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n  </url>`);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...rows,
    '</urlset>',
    '',
  ].join('\n');
}
