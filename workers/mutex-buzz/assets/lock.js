// mutex.buzz: the lock. One concept holds the frame at a time. A hold is
// time-boxed to the season clock: cycles close on the 13th, the 26th, and the
// last day of the month (UTC). When nothing else holds the lock, a laminated
// folio does, so the resting state is the work itself. Waiting holders line
// up in public.
//
// Pure, with no DOM: the carry writes the schedule and the pages' first state
// with it, the pages' script (assets/mutex.js) works out "now" with it in the
// reader's browser, and the tests read it. Copied byte for byte into assets/
// by carry.mjs. The rule and the folios are the ones site-hub-next/src/mutex.js
// served; the folios' images are this host's own files now.

/** Resting holders: one laminated folio per cycle, from the September 26 release. */
export const FOLIOS = Object.freeze({
  A: { kind: "folio", title: "Lined stage facade", image: "/folios/lined-stage-facade.webp", width: 1024, height: 808, alt: "Pale yellow and violet wash over lined paper, a row of faint pencil cards above a wide stage-like facade" },
  B: { kind: "folio", title: "Teal Stripes Vibes wash", image: "/folios/teal-stripes-vibes-wash.webp", width: 803, height: 1024, alt: "Violet and teal wash over a small pink panel and a Teal Stripes Vibes label" },
  C: { kind: "folio", title: "factshift cabinet", image: "/folios/factshift-cabinet.webp", width: 795, height: 1024, alt: "A cabinet of ink drawers and slots washed in pink and sea green, with factshift.com lettered small" },
});

/**
 * Agreed holds, each for one cycle: { kind, title, image, width, height, alt,
 * cycleStart: "YYYY-MM-DD" }. A hold starts at a close and releases at the
 * next. Empty today: the folios rest in the frame.
 */
export const HOLDS = Object.freeze([]);

/** Holders waiting their turn, in order. Being next is visible; nobody pays to jump it mid-cycle. */
export const QUEUE = Object.freeze([]);

/** The three cycles of a month, by the day each starts, and its name. */
export const CYCLES = Object.freeze([{ cycle: "A", from: 1, through: "13th" }, { cycle: "B", from: 14, through: "26th" }, { cycle: "C", from: 27, through: "the last day" }]);

const pad = (n) => String(n).padStart(2, "0");
export const ymd = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

/** The cycle a date sits in: A to the 13th, B to the 26th, C to month's end. */
export function cycleFor(date) {
  const y = date.getUTCFullYear(), m = date.getUTCMonth(), d = date.getUTCDate();
  const index = d <= 13 ? 0 : d <= 26 ? 1 : 2;
  const since = new Date(Date.UTC(y, m, [1, 14, 27][index]));
  const releasesAt = index < 2 ? new Date(Date.UTC(y, m, [14, 27][index])) : new Date(Date.UTC(y, m + 1, 1));
  return { cycle: "ABC"[index], since, releasesAt };
}

/** What holds the lock at a moment: an agreed hold for that cycle, or the cycle's folio. */
export function holderFor(date) {
  const c = cycleFor(date);
  const holder = HOLDS.find((h) => h.cycleStart === ymd(c.since)) || FOLIOS[c.cycle];
  return { ...holder, cycle: c.cycle, since: c.since.toISOString(), releasesAt: c.releasesAt.toISOString(), queue: QUEUE.map(({ title, kind }) => ({ title, kind })) };
}

/** Every hold from one date up to another, in order, each with its holder. */
export function scheduleBetween(from, until) {
  const holds = [];
  for (let at = cycleFor(from).since; at < until; at = cycleFor(at).releasesAt) {
    const { queue, ...hold } = holderFor(at);
    holds.push(hold);
  }
  return holds;
}

/** A date as "November 14", in UTC, where the closes are kept. */
export const monthDay = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });

/** The last day a hold covers, as "November 26". */
export const lastDay = (holder) => monthDay(new Date(Date.parse(holder.releasesAt) - 1).toISOString());

/**
 * What holds now, as one line of Spw beneath lock.spw: the value mark on the
 * hold, its cycle as the mode, the holder as the body, and its days as the
 * scene, from its first day toward its last.
 */
export function nowLine(holder) {
  const words = (s) => String(s).toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  return `*holds[${holder.cycle}]{${words(holder.title)}}(${words(monthDay(holder.since))} ~> ${words(lastDay(holder))})`;
}

/** How long until a hold lets go, said plainly. */
export function untilRelease(holder, now) {
  const ms = Date.parse(holder.releasesAt) - now.getTime();
  const hours = Math.max(0, Math.round(ms / 3_600_000));
  if (hours < 1) return "releases within the hour";
  if (hours < 36) return `releases in ${hours} ${hours === 1 ? "hour" : "hours"}`;
  return `releases in ${Math.round(hours / 24)} days`;
}

/** A hold's sub-quantum: an hour. */
export const TURN_MS = 3_600_000;
const GOLDEN = 2.399963229728653;

/**
 * Which turn of its hold a moment is in, and what the cell shows then: the
 * holder whole on its first and last turns, and between them a detail that
 * walks the work on a golden-angle spiral, one step an hour. (fx, fy) is the
 * detail's centre, as a share of the picture; zoom is how close it comes.
 */
export function turnOf(holder, now) {
  const since = Date.parse(holder.since);
  const of = Math.round((Date.parse(holder.releasesAt) - since) / TURN_MS);
  const index = Math.min(of - 1, Math.max(0, Math.floor((now.getTime() - since) / TURN_MS)));
  if (index === 0 || index === of - 1) return { index, of, zoom: 1, fx: 0.5, fy: 0.5 };
  const r = 0.2 * Math.sqrt((index % 97) / 97);
  const a = index * GOLDEN;
  return { index, of, zoom: 1.8, fx: Math.round((0.5 + r * Math.cos(a)) * 1000) / 1000, fy: Math.round((0.5 + r * Math.sin(a)) * 1000) / 1000 };
}

/** The turn as a line of Spw: a measure, its place in the hold as a ratio the number reader takes. */
export const turnLine = (turn) => `%turn[${turn.index + 1}/${turn.of}]{hour}`;

/** The time left in a hold, to the second: "9d 14h 22m 05s", or "0s" once it has let go. */
export function countdown(holder, now) {
  let s = Math.max(0, Math.floor((Date.parse(holder.releasesAt) - now.getTime()) / 1000));
  const d = Math.floor(s / 86_400); s -= d * 86_400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  const two = (n) => String(n).padStart(2, "0");
  if (d) return `${d}d ${h}h ${two(m)}m ${two(s)}s`;
  if (h) return `${h}h ${two(m)}m ${two(s)}s`;
  if (m) return `${m}m ${two(s)}s`;
  return `${s}s`;
}

/** The dial's canvas and ring, in its own units. */
export const DIAL = Object.freeze({ size: 600, r: 262 });

const point = (angle, r = DIAL.r) => {
  const a = ((angle - 90) * Math.PI) / 180;
  return [Math.round((DIAL.size / 2 + r * Math.cos(a)) * 10) / 10, Math.round((DIAL.size / 2 + r * Math.sin(a)) * 10) / 10];
};
const arc = (from, to, r = DIAL.r) => {
  const [x1, y1] = point(from, r);
  const [x2, y2] = point(to, r);
  return `M${x1} ${y1}A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
};

/**
 * The month as a dial: the three holds as arcs around a ring, sized by their
 * days, with a gap at each close; where a moment sits on it; and the part of
 * its hold still to run. Angles start at the top and run clockwise.
 */
export function dialOf(date) {
  const y = date.getUTCFullYear(), m = date.getUTCMonth();
  const start = Date.UTC(y, m, 1);
  const end = Date.UTC(y, m + 1, 1);
  const angleOf = (t) => ((t - start) / (end - start)) * 360;
  const gap = 1.6;
  const holds = CYCLES.map(({ cycle, from }, i) => {
    const a = angleOf(Date.UTC(y, m, from));
    const b = i < 2 ? angleOf(Date.UTC(y, m, CYCLES[i + 1].from)) : 360;
    const [lx, ly] = point((a + b) / 2, DIAL.r + 28);
    return { cycle, path: arc(a + gap, b - gap), label: { x: lx, y: ly }, from: a, to: b };
  });
  const now = angleOf(date.getTime());
  const current = holds.find((h) => now >= h.from && now < h.to) ?? holds[2];
  const [nx, ny] = point(now);
  return {
    holds,
    current: current.cycle,
    needle: { x: nx, y: ny, angle: Math.round(now * 10) / 10 },
    // The rest of the hold: from now to its close.
    rest: arc(Math.min(now, current.to - gap - 0.1), current.to - gap),
    elapsed: (now - current.from) / (current.to - current.from),
  };
}
