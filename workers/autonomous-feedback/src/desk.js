/**
 * The desk: stored notes for a site with an open desk.
 *
 * A client file's queue.want is the owner asking for a desk; it does not open
 * one. A desk opens when the operator also lists the host in DESK_HOSTS. Until
 * then nothing is kept, because no owner could read what was.
 *
 * A new card is unsaved. The owner can save up to SAVE_LIMIT cards, which keep
 * their words until released. Unsaved cards older than three days are
 * compacted: each becomes one count in a tally by week, subject (or page),
 * common note, and kind, noting whether it came in the writer's own words,
 * and its words are deleted. The tally is all that survives.
 */

export const COMPACT_AFTER_DAYS = 3;
export const DEFAULT_SAVE_LIMIT = 10;
export const UNSAVED_CAP = 200;

/** Hosts with an open desk: the DESK_HOSTS var, separated by spaces or commas. */
export function deskHosts(env) {
  return new Set(String(env?.DESK_HOSTS || "").toLowerCase().split(/[\s,]+/).filter(Boolean));
}

/**
 * "open" needs all three: the file asks (queue.want), the operator lists the
 * host (DESK_HOSTS, with D1 bound), and someone can read what is kept (the
 * operator token or the site's inbox.key). Short of that, nothing is kept.
 * @returns {"open"|"requested"|"none"}
 */
export function deskState(env, host, config) {
  if (!config?.found || !config.queue?.want) return "none";
  const listed = Boolean(env?.DB) && deskHosts(env).has(String(host).toLowerCase());
  const readable = Boolean(env?.INBOX_READ_TOKEN || config.inbox?.key);
  return listed && readable ? "open" : "requested";
}

/** How many cards a site may save. SAVE_LIMIT on the worker overrides the default. */
export function saveLimit(env) {
  const n = Number.parseInt(env?.SAVE_LIMIT ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_SAVE_LIMIT;
}

function compactBefore(now) {
  return new Date(now - COMPACT_AFTER_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/** Monday of the week a timestamp falls in, as YYYY-MM-DD (UTC). */
export function weekOf(issued) {
  const day = new Date(`${String(issued).slice(0, 10)}T00:00:00Z`);
  const back = (day.getUTCDay() + 6) % 7;
  return new Date(day.getTime() - back * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// SQL for the same Monday, so compaction and the digest agree.
const WEEK_SQL = "date(substr(issued, 1, 10), '-6 days', 'weekday 1')";
const ABOUT_SQL = "COALESCE(NULLIF(subject, ''), route_name, route_path, '')";

function toFiling(row) {
  return {
    id: row.id,
    host: row.host,
    context: row.kind,
    title: row.title,
    note: row.note,
    from: row.writer || null,
    route: row.route_name || null,
    path: row.route_path || null,
    issued: row.issued,
    saved: Boolean(row.saved),
    subject: row.subject || null,
    thread: row.thread || null,
    worded: row.worded == null ? true : Boolean(row.worded),
  };
}

export async function keepNote(db, filing) {
  if (!db) return { stored: false, queue: "unattached" };
  const count = await db.prepare("SELECT COUNT(*) AS n FROM notes WHERE host = ? AND saved = 0").bind(filing.host).first();
  if (Number(count?.n || 0) >= UNSAVED_CAP) return { stored: false, queue: "full" };
  const id = crypto.randomUUID();
  await db.prepare(
    "INSERT INTO notes (id, host, kind, title, note, writer, issued, route_name, route_path, subject, thread, worded) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(
    id, filing.host, filing.context.slug, filing.context.title, filing.record || filing.note, filing.from || null, filing.issued,
    filing.route || null, filing.path || null, filing.subject?.id || null, filing.thread?.id || (filing.thanked ? "thanks" : null), filing.worded === false ? 0 : 1,
  ).run();
  return { stored: true, queue: "desk", id };
}

/** Saved cards first, then unsaved, newest first. */
export async function listNotes(db, host) {
  const { results } = await db.prepare(
    "SELECT id, host, kind, title, note, writer, issued, route_name, route_path, saved, subject, thread, worded FROM notes WHERE host = ? ORDER BY saved DESC, issued DESC LIMIT ?",
  ).bind(host, UNSAVED_CAP + 1000).all();
  return (results || []).map(toFiling);
}

const toTally = ({ week, about, thread, kind, cards, worded }) => ({ week, about, thread, kind, cards: Number(cards), worded: Number(worded) });

export async function listTallies(db, host) {
  const { results } = await db.prepare(
    "SELECT week, about, thread, kind, cards, worded FROM tallies WHERE host = ? ORDER BY week DESC, about, thread, kind",
  ).bind(host).all();
  return (results || []).map(toTally);
}

/** @returns {Promise<{ ok: boolean, error: null|"limit"|"missing" }>} */
export async function setSaved(db, host, id, saved, limit) {
  if (saved) {
    const count = await db.prepare("SELECT COUNT(*) AS n FROM notes WHERE host = ? AND saved = 1").bind(host).first();
    if (Number(count?.n || 0) >= limit) return { ok: false, error: "limit" };
  }
  const result = await db.prepare("UPDATE notes SET saved = ? WHERE host = ? AND id = ?").bind(saved ? 1 : 0, host, id).run();
  return (result.meta?.changes ?? 0) > 0 ? { ok: true, error: null } : { ok: false, error: "missing" };
}

export async function deleteNotes(db, host, id = "") {
  const result = id
    ? await db.prepare("DELETE FROM notes WHERE host = ? AND id = ?").bind(host, id).run()
    : await db.prepare("DELETE FROM notes WHERE host = ?").bind(host).run();
  return result.meta?.changes ?? 0;
}

/** Counts for one site: saved, unsaved, and the oldest unsaved card. */
export async function deskSummary(db, host) {
  const row = await db.prepare(
    "SELECT SUM(CASE WHEN saved = 1 THEN 1 ELSE 0 END) AS saved, SUM(CASE WHEN saved = 0 THEN 1 ELSE 0 END) AS unsaved, MIN(CASE WHEN saved = 0 THEN issued END) AS oldest FROM notes WHERE host = ?",
  ).bind(host).first();
  return { host, saved: Number(row?.saved || 0), unsaved: Number(row?.unsaved || 0), oldest: row?.oldest || null };
}

const DUE = "saved = 0 AND issued < ?";

/** The tallies the next compaction would add, without changing anything. */
export async function previewCompaction(db, host, now = Date.now()) {
  const { results } = await db.prepare(
    `SELECT ${WEEK_SQL} AS week, ${ABOUT_SQL} AS about, COALESCE(thread, '') AS thread, kind, COUNT(*) AS cards, SUM(worded) AS worded FROM notes WHERE ${DUE} AND host = ? GROUP BY week, about, thread, kind ORDER BY week DESC, about, thread, kind`,
  ).bind(compactBefore(now), host).all();
  return (results || []).map(toTally);
}

/**
 * Turn unsaved cards older than three days into tallies and delete their words.
 * One batch, so a count and its deleted card land together. Without a host,
 * every site is compacted (the cron).
 */
export async function compact(db, host = "", now = Date.now()) {
  if (!db) return { compacted: 0 };
  const before = compactBefore(now);
  const scope = host ? " AND host = ?" : "";
  const args = host ? [before, host] : [before];
  const [, deleted] = await db.batch([
    db.prepare(
      `INSERT INTO tallies (host, week, about, thread, kind, cards, worded) SELECT host, ${WEEK_SQL}, ${ABOUT_SQL}, COALESCE(thread, ''), kind, COUNT(*), SUM(worded) FROM notes WHERE ${DUE}${scope} GROUP BY 1, 2, 3, 4, 5 ON CONFLICT (host, week, about, thread, kind) DO UPDATE SET cards = tallies.cards + excluded.cards, worded = tallies.worded + excluded.worded`,
    ).bind(...args),
    db.prepare(`DELETE FROM notes WHERE ${DUE}${scope}`).bind(...args),
  ]);
  return { compacted: deleted?.meta?.changes ?? 0 };
}

/**
 * What the owner reads first: each week's notes, stored counts and live cards
 * together, grouped by what they were about and which common note they joined.
 * Pure, so the inbox, the desk, and the JSON API say the same thing.
 */
export function digest(tallies = [], notes = [], now = Date.now()) {
  const rows = [...tallies];
  for (const n of notes) {
    rows.push({ week: weekOf(n.issued), about: n.subject || n.route || n.path || "", thread: n.thread || "", kind: n.context, cards: 1, worded: n.worded ? 1 : 0 });
  }
  const weeks = new Map();
  for (const r of rows) {
    const week = weeks.get(r.week) || { week: r.week, cards: 0, thanks: 0, groups: new Map(), loose: new Map() };
    week.cards += r.cards;
    if (r.thread === "thanks") week.thanks += r.cards;
    else {
      const key = `${r.about}\u0000${r.thread}`;
      const group = week.groups.get(key) || { about: r.about, thread: r.thread, cards: 0, worded: 0, kinds: {} };
      group.cards += r.cards;
      group.worded += r.worded;
      group.kinds[r.kind] = (group.kinds[r.kind] || 0) + r.cards;
      week.groups.set(key, group);
      if (!r.thread) week.loose.set(r.about, (week.loose.get(r.about) || 0) + r.cards);
    }
    weeks.set(r.week, week);
  }
  const due = notes.filter((n) => !n.saved && Date.parse(n.issued) < now - (COMPACT_AFTER_DAYS - 1) * 24 * 60 * 60 * 1000).length;
  return {
    due,
    weeks: [...weeks.values()].sort((a, b) => b.week.localeCompare(a.week)).map((w) => ({
      week: w.week,
      cards: w.cards,
      thanks: w.thanks,
      groups: [...w.groups.values()].sort((a, b) => b.cards - a.cards || String(a.about).localeCompare(String(b.about))),
      // A subject whose notes keep arriving without a common note may need one: the owner's map can grow.
      hints: [...w.loose].filter(([about, n]) => about && n >= 3).map(([about, cards]) => ({ about, cards })),
    })),
  };
}
