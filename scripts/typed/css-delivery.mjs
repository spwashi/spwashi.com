/**
 * Delivery form of a stylesheet: what the deploy artifact ships.
 *
 * Committed CSS — sources and bundles alike — keeps its prose, because a
 * reader who opens a file cold should meet the essay about its surface. The
 * visitor's browser does not read that essay; it only downloads and parses it.
 * On the core bundle the prose is a fifth of the bytes and two fifths of the
 * gzip transfer.
 *
 * This pass removes comments and indentation and nothing else. It does not
 * merge, reorder, or rewrite rules, so the cascade a reviewer approved in the
 * committed bundle is the cascade the visitor gets. It keeps:
 *   - strings and url() bodies verbatim (a `/*` inside them is not a comment)
 *   - `/*!` comments (licenses, deliberate notices)
 *   - `/*#` comments (source-map pragmas)
 *   - `/* public/css/<file>.css *\/` provenance lines, so DevTools on the
 *     live site still names the source file a rule came from
 */
const PROVENANCE_RE = /^\/\* \/?public\/css\/[\w./-]+\.css \*\/$/u;
function keepComment(comment) {
    return comment.startsWith('/*!') || comment.startsWith('/*#') || PROVENANCE_RE.test(comment);
}
/** Index just past a quoted string starting at `start` (unterminated strings run to the end). */
function skipString(source, start) {
    const quote = source[start];
    let index = start + 1;
    while (index < source.length) {
        const char = source[index];
        if (char === '\\') {
            index += 2;
            continue;
        }
        if (char === quote || char === '\n')
            return index + 1;
        index += 1;
    }
    return index;
}
/** Index just past an unquoted url( … ) body starting at the `(`. */
function skipUnquotedUrl(source, open) {
    let index = open + 1;
    while (index < source.length && /\s/u.test(source[index] ?? ''))
        index += 1;
    const first = source[index];
    if (first === '"' || first === "'")
        return open + 1;
    while (index < source.length) {
        const char = source[index];
        if (char === '\\') {
            index += 2;
            continue;
        }
        if (char === ')')
            return index + 1;
        index += 1;
    }
    return index;
}
/** Remove prose comments, keeping strings, url() bodies, and the comments named above. */
export function stripCssComments(source) {
    let output = '';
    let index = 0;
    let copyFrom = 0;
    while (index < source.length) {
        const char = source[index];
        if (char === '"' || char === "'") {
            index = skipString(source, index);
            continue;
        }
        if (char === '(' && /url$/iu.test(source.slice(Math.max(0, index - 3), index))) {
            index = skipUnquotedUrl(source, index);
            continue;
        }
        if (char === '/' && source[index + 1] === '*') {
            const close = source.indexOf('*/', index + 2);
            const end = close === -1 ? source.length : close + 2;
            const comment = source.slice(index, end);
            if (!keepComment(comment)) {
                output += source.slice(copyFrom, index);
                copyFrom = end;
            }
            index = end;
            continue;
        }
        index += 1;
    }
    return output + source.slice(copyFrom);
}
/**
 * Comments out, then indentation and blank lines. Whitespace inside a line is
 * left alone: a descendant combinator or `calc(a - b)` depends on it, and the
 * run between two lines only ever needs to be one newline.
 */
export function cssForDelivery(source) {
    const body = stripCssComments(source)
        .replace(/[ \t]*\r?\n\s*/gu, '\n')
        .trim();
    return body ? `${body}\n` : '';
}
