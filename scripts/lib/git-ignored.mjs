/**
 * Is a repo-relative path ignored by git?
 *
 * A citation to dist/, design/catalog/ or another ignored path is true on a
 * machine that has built and broken in a fresh checkout, where the path
 * cannot exist. Checkers that ask "does the target exist" use this to tell
 * a built or local-only target from a rename nobody followed.
 *
 * A directory-only pattern such as `dist/` does not match the bare name of a
 * directory that is absent, so the path is tried both ways.
 */
import { execFileSync } from 'node:child_process';

const memo = new Map();

export function isGitIgnored(relPath, { cwd = process.cwd() } = {}) {
  const rel = String(relPath || '').replace(/^\.\//, '');
  if (!rel || rel.startsWith('..')) return false;
  const key = `${cwd}\0${rel}`;
  if (memo.has(key)) return memo.get(key);
  let ignored = false;
  for (const candidate of rel.endsWith('/') ? [rel] : [rel, `${rel}/`]) {
    try {
      execFileSync('git', ['check-ignore', '-q', '--', candidate], { cwd, stdio: 'ignore' });
      ignored = true;
      break;
    } catch {
      /* exit 1: not ignored; any other failure also reads as not ignored */
    }
  }
  memo.set(key, ignored);
  return ignored;
}
