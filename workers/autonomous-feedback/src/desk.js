/**
 * Stored notes for a site with an open desk. Retention is 90 days, 200 unread per site.
 *
 * A client file's queue.want is the owner asking for a desk; it does not open
 * one. A desk opens when the operator also lists the host in DESK_HOSTS. Until
 * then nothing is kept, because no owner could read what was.
 */

export const RETENTION_DAYS = 90;
export const UNREAD_CAP = 200;

/** Hosts with an open desk: the DESK_HOSTS var, separated by spaces or commas. */
export function deskHosts(env) {
  return new Set(String(env?.DESK_HOSTS || "").toLowerCase().split(/[\s,]+/).filter(Boolean));
}

/** @returns {"open"|"requested"|"none"} */
export function deskState(env, host, config) {
  if (!config?.found || !config.queue?.want) return "none";
  return env?.DB && deskHosts(env).has(String(host).toLowerCase()) ? "open" : "requested";
}

function cutoff(now = Date.now()) {
  return new Date(now - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export async function keepNote(db, filing, now = Date.now()) {
  if (!db) return { stored: false, queue: "unattached" };
  await db.prepare("DELETE FROM notes WHERE issued < ?").bind(cutoff(now)).run();
  const count = await db.prepare("SELECT COUNT(*) AS n FROM notes WHERE host = ?").bind(filing.host).first();
  if (Number(count?.n || 0) >= UNREAD_CAP) return { stored: false, queue: "full" };
  const id = crypto.randomUUID();
  await db.prepare(
    "INSERT INTO notes (id, host, kind, title, note, writer, issued, route_name, route_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(id, filing.host, filing.context.slug, filing.context.title, filing.note, filing.from || null, filing.issued, filing.route || null, filing.path || null).run();
  return { stored: true, queue: "desk", id };
}

export async function listNotes(db, host, now = Date.now()) {
  await db.prepare("DELETE FROM notes WHERE host = ? AND issued < ?").bind(host, cutoff(now)).run();
  const { results } = await db.prepare(
    "SELECT id, host, kind, title, note, writer, issued, route_name, route_path FROM notes WHERE host = ? ORDER BY issued DESC LIMIT ?",
  ).bind(host, UNREAD_CAP).all();
  return (results || []).map((row) => ({
    id: row.id,
    host: row.host,
    context: row.kind,
    title: row.title,
    note: row.note,
    from: row.writer || null,
    route: row.route_name || null,
    path: row.route_path || null,
    issued: row.issued,
  }));
}

export async function clearNotes(db, host, id) {
  const result = id
    ? await db.prepare("DELETE FROM notes WHERE host = ? AND id = ?").bind(host, id).run()
    : await db.prepare("DELETE FROM notes WHERE host = ?").bind(host).run();
  return result.meta?.changes ?? 0;
}
