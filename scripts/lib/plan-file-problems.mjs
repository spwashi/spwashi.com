/**
 * Plan-file structure a diff can judge: the review line, and index.spw
 * targets that start with ./ or ../. The nightly corpus walk is the check
 * for a file this diff did not touch.
 */

import path from 'node:path';

export const PLAN_REVIEW_MARKER = /^# Review \d{4}-\d{2}-\d{2} — /;

export function problemsInPlanFiles(entries, { treeReviewed = true, exists = () => true } = {}) {
  const problems = [];
  for (const entry of entries) {
    const file = String(entry.path || '').split(path.sep).join('/');
    if (!file.endsWith('.spw')) continue;
    const text = entry.text || '';
    if (treeReviewed && !PLAN_REVIEW_MARKER.test(text)) {
      problems.push({
        where: file,
        reason: 'unreviewed',
        detail: 'missing # Review YYYY-MM-DD —',
      });
    }
    if (path.posix.basename(file) !== 'index.spw') continue;
    for (const match of text.matchAll(/~"((?:\.\/|\.\.\/)[^"]+)"/g)) {
      const ref = match[1];
      const targetRef = ref.split(/[?#]/, 1)[0];
      if (!targetRef) continue;
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), targetRef));
      if (exists(target)) continue;
      const line = text.slice(0, match.index).split('\n').length;
      problems.push({
        where: `${file}:${line}`,
        reason: 'missing-target',
        detail: ref,
      });
    }
  }
  return problems;
}
