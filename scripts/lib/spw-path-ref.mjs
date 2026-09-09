/**
 * Workbench pathRefs are opaque strings. A labeled brace (~"open") is not a
 * file. Integrity that treats every pathRef as a filesystem target cries wolf
 * (timing-bands-handoff ~"open" → missing-file). Follow only strings that look
 * like paths.
 */

export function isFollowablePathRef(target) {
  const value = String(target || '').trim();
  if (!value) return false;
  if (/\s\(|\s::\s|\s{2,}/.test(value)) return false;
  const pathPart = value.split('#')[0];
  if (!pathPart) return false;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return true;
  if (pathPart.startsWith('.') || pathPart.startsWith('/')) return true;
  if (pathPart.includes('/')) return true;
  if (/\.[A-Za-z][A-Za-z0-9]{0,7}$/.test(pathPart)) return true;
  return false;
}
