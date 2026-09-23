/**
 * An in-memory stand-in for the D1 statements desk.js issues. Each statement is
 * matched by shape, so a new query fails loudly here instead of passing by accident.
 */
export function memoryDb() {
  const notes = [];
  const tallies = new Map();
  const page = (row) => row.route_name || row.route_path || '';
  const due = (args, sql) => {
    const [before, host] = args;
    return notes.filter((row) => !row.saved && row.issued < before && (!sql.includes('AND host = ?') || row.host === host));
  };
  const group = (rows) => {
    const counts = new Map();
    for (const row of rows) {
      const key = [row.host, row.issued.slice(0, 10), page(row), row.kind].join('\u0000');
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [...counts].map(([key, count]) => {
      const [host, day, pg, kind] = key.split('\u0000');
      return { host, day, page: pg, kind, count };
    });
  };
  const drop = (pred) => {
    const before = notes.length;
    for (let i = notes.length - 1; i >= 0; i -= 1) if (pred(notes[i])) notes.splice(i, 1);
    return { meta: { changes: before - notes.length } };
  };

  const run = (sql, args) => {
    if (sql.startsWith('INSERT INTO notes')) {
      const [id, host, kind, title, note, writer, issued, route_name, route_path] = args;
      notes.push({ id, host, kind, title, note, writer, issued, route_name, route_path, saved: 0 });
      return { meta: { changes: 1 } };
    }
    if (sql.startsWith('UPDATE notes SET saved')) {
      const [saved, host, id] = args;
      const row = notes.find((r) => r.host === host && r.id === id);
      if (row) row.saved = saved;
      return { meta: { changes: row ? 1 : 0 } };
    }
    if (sql.startsWith('INSERT INTO tallies')) {
      for (const t of group(due(args, sql))) {
        const key = [t.host, t.day, t.page, t.kind].join('\u0000');
        tallies.set(key, { ...t, count: (tallies.get(key)?.count || 0) + t.count });
      }
      return { meta: { changes: 1 } };
    }
    if (sql.startsWith('DELETE FROM notes WHERE saved = 0 AND issued < ?')) {
      const doomed = new Set(due(args, sql));
      return drop((row) => doomed.has(row));
    }
    if (sql === 'DELETE FROM notes WHERE host = ? AND id = ?') return drop((row) => row.host === args[0] && row.id === args[1]);
    if (sql === 'DELETE FROM notes WHERE host = ?') return drop((row) => row.host === args[0]);
    throw new Error(`memoryDb run: ${sql}`);
  };

  const first = (sql, args) => {
    if (sql.includes('COUNT(*) AS n FROM notes WHERE host = ? AND saved = 0')) return { n: notes.filter((r) => r.host === args[0] && !r.saved).length };
    if (sql.includes('COUNT(*) AS n FROM notes WHERE host = ? AND saved = 1')) return { n: notes.filter((r) => r.host === args[0] && r.saved).length };
    if (sql.startsWith('SELECT SUM(')) {
      const rows = notes.filter((r) => r.host === args[0]);
      const unsaved = rows.filter((r) => !r.saved);
      return { saved: rows.length - unsaved.length, unsaved: unsaved.length, oldest: unsaved.map((r) => r.issued).sort()[0] || null };
    }
    throw new Error(`memoryDb first: ${sql}`);
  };

  const all = (sql, args) => {
    if (sql.startsWith('SELECT id, host, kind')) {
      return notes.filter((r) => r.host === args[0])
        .sort((a, b) => (b.saved - a.saved) || b.issued.localeCompare(a.issued));
    }
    if (sql.startsWith('SELECT day, page, kind, count FROM tallies')) {
      return [...tallies.values()].filter((t) => t.host === args[0])
        .sort((a, b) => b.day.localeCompare(a.day) || a.page.localeCompare(b.page) || a.kind.localeCompare(b.kind));
    }
    if (sql.startsWith('SELECT substr(issued, 1, 10) AS day')) {
      return group(due(args, sql)).sort((a, b) => b.day.localeCompare(a.day) || a.page.localeCompare(b.page));
    }
    throw new Error(`memoryDb all: ${sql}`);
  };

  const statement = (sql, args = []) => ({
    bind: (...bound) => statement(sql, bound),
    run: async () => run(sql, args),
    first: async () => first(sql, args),
    all: async () => ({ results: all(sql, args) }),
  });

  return {
    prepare: (sql) => statement(sql),
    batch: async (statements) => {
      const results = [];
      for (const s of statements) results.push(await s.run());
      return results;
    },
    // For tests: age a card, or look at what is stored.
    _notes: notes,
    _tallies: tallies,
  };
}
