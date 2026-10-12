/**
 * plan-wip — what a plan's wip.spw says about itself: when it was last
 * tended, its cached status and gate, and which required header marks it
 * lacks (.spw/conventions/wip-notebook.spw ^"required_shape").
 *
 * Stamps are >>[YYYY-MM-DD HH:MM] on the site clock (wip-notebook.spw ^"stamps").
 *
 * Shared by audit-plans.mjs (is the notebook behind its plan?) and
 * tending-queue.mjs (which plan is next to tend?).
 */

import fs from 'node:fs';
import path from 'node:path';

const STATUS = /^\*\*Status (\d{4}-\d{2}-\d{2})\.\*\*/m;

/** The plan's dated Status line in PLAN.md or FIX.md, or null. */
export function planStatus(dir) {
  for (const name of ['PLAN.md', 'FIX.md']) {
    const file = path.join(dir, name);
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    const hit = STATUS.exec(text);
    return { file, date: hit ? hit[1] : null, line: hit ? text.slice(0, hit.index).split('\n').length : 1 };
  }
  return null;
}

const cacheField = (text, name) => new RegExp(`~#${name}:\\s*"([^"]*)"`).exec(text)?.[1] ?? null;

/** The wip notebook beside a plan, read; null when there is none. */
export function readWip(dir, slug = path.basename(dir)) {
  const file = path.join(dir, 'wip.spw');
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, 'utf8');
  const entries = [...text.matchAll(/>>\[(\d{4}-\d{2}-\d{2})( \d{2}:\d{2})?\]/g)];
  const streamed = entries.map((m) => m[1]);
  /* The last entry in the file is the newest; it should carry a time (site-clock.mjs). */
  const lastStamped = entries.length ? Boolean(entries.at(-1)[2]) : null;
  const cached = cacheField(text, 'last_stream');
  const last = [...streamed, ...(cached ? [cached] : [])].sort().at(-1) ?? null;
  const anchor = `plan_${slug.replace(/-/g, '_')}_wip`;
  const gaps = [];
  if (!new RegExp(`^#>${anchor}\\b`, 'm').test(text)) gaps.push(`#>${anchor}`);
  if (!/^#:operation #!/m.test(text)) gaps.push('#:operation');
  if (!/^#:fixity #!/m.test(text)) gaps.push('#:fixity');
  if (!/^@plan:/m.test(text)) gaps.push('@plan');
  return {
    file,
    last,
    status: cacheField(text, 'status'),
    gate: cacheField(text, 'gate'),
    next: cacheField(text, 'next_commit'),
    gaps,
    lastStamped,
  };
}
