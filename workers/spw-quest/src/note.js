// One note on this device. The guide's textarea is the source of truth; this
// kit decides, at boot, on a tab click and on each edit, whether the field
// shows the stored note or a template, and what (if anything) to write. It is
// pure and self-contained so it can travel to the page by toString(), the way
// fileKit does: nothing inside may reach outside it. Storage is one
// localStorage key in the page; the service worker never sees it.
//
// Design: .agents/plans/spw-quest/note-shell-design.md (PR 1).

export const NOTE_KEY = "spw.quest.note/1";

export function noteKit() {
  const SCHEMA = "spw.quest.note/1";

  /** One segment ending in .spw, as build.js safeName cleans a download name. */
  const cleanName = (raw) => {
    const base = String(raw || "").split(/[/\\]/).pop().replace(/[^A-Za-z0-9._-]/g, "").replace(/^\.+/, "").slice(0, 80);
    if (!base) return "line.spw";
    return base.endsWith(".spw") ? base : `${base}.spw`;
  };

  /** The stored value as a record, or null. A value that fails the schema is ignored, never deleted. */
  function fromJson(raw, limit) {
    if (typeof raw !== "string") return null;
    let value;
    try {
      value = JSON.parse(raw);
    } catch {
      return null;
    }
    if (!value || typeof value !== "object" || value.schema !== SCHEMA || value.id !== "local" || typeof value.script !== "string") return null;
    return {
      schema: SCHEMA,
      id: "local",
      filename: cleanName(value.filename),
      script: value.script.slice(0, limit),
      from: typeof value.from === "string" ? value.from : null,
      savedAt: Number(value.savedAt) || 0,
    };
  }

  /** A record to write. */
  function record({ script, filename, from = null }, limit, now = Date.now()) {
    return { schema: SCHEMA, id: "local", filename: cleanName(filename), script: String(script ?? "").slice(0, limit), from, savedAt: now };
  }

  /**
   * The next address: drop example and note, set the one asked for, keep every
   * other key (parser included), and land on #try. The note address carries no body.
   */
  function questAddress(search, { example = null, note = false } = {}) {
    const params = new URLSearchParams(search);
    params.delete("example");
    params.delete("note");
    if (example) params.set("example", example);
    let query = params.toString();
    if (note) query = query ? `${query}&note` : "note";
    return `/${query ? `?${query}` : ""}#try`;
  }

  const onShelf = (shelf, id) => (id == null ? null : shelf.find((item) => item.id === id) || null);

  /**
   * What the field shows when the page opens. The server always paints a
   * template; boot may put the stored note in its place, ask, or leave it.
   * Boot never writes.
   */
  function decideBoot({ search, field, filename, stored, shelf, limit }) {
    const params = new URLSearchParams(search);
    const asked = onShelf(shelf, params.get("example"));
    const keep = (notice = "none") => ({ action: "keep-field", field, filename, from: null, url: null, write: null, notice });
    const paint = (url) => ({
      action: "paint-record",
      field: stored.script.slice(0, limit),
      filename: stored.filename,
      // A record keeps from only while its text is that template's (decideInput clears it), so the shelf check is enough.
      from: onShelf(shelf, stored.from) ? stored.from : null,
      url,
      write: null,
      notice: "none",
    });
    if (params.has("note")) return stored ? paint(null) : keep("unstored");
    if (asked) {
      if (!stored || stored.script === asked.script) return keep();
      return { action: "ask", field, filename, from: null, url: null, write: null, notice: "differs" };
    }
    // No example on the shelf: the bare guide, or an id the server painted as the notebook.
    if (!stored || stored.script === field) return keep();
    return paint(questAddress(search, { note: true }));
  }

  /** A tab click. While a choice is open, nothing writes and nothing moves. */
  function decideTemplate({ choiceOpen, field, currentScript, stored, target, search, limit }) {
    if (choiceOpen) return { write: null, ask: false, assign: false, url: null };
    const clean = record({ script: target.script, filename: target.file, from: target.id }, limit);
    const url = questAddress(search, { example: target.id });
    if (field === target.script) {
      const same = stored && stored.script === target.script && stored.from === target.id;
      return { write: same ? null : clean, ask: false, assign: true, url };
    }
    const unchanged = typeof currentScript === "string" && field === currentScript && (!stored || stored.script === field);
    if (unchanged) return { write: clean, ask: false, assign: true, url };
    return { write: null, ask: true, assign: false, url: null };
  }

  /** An edit. A field that lands on a template's bytes is that template; anything else is the note. */
  function decideInput({ choiceOpen, field, shelf, filename, limit, search }) {
    if (choiceOpen) return { write: null, url: null, from: null };
    const text = String(field ?? "").slice(0, limit);
    const template = shelf.find((item) => item.script === text);
    if (template) {
      return { write: record({ script: text, filename: template.file, from: template.id }, limit), url: questAddress(search, { example: template.id }), from: template.id };
    }
    return { write: record({ script: text, filename, from: null }, limit), url: questAddress(search, { note: true }), from: null };
  }

  return { key: SCHEMA, fromJson, record, questAddress, decideBoot, decideTemplate, decideInput };
}

/**
 * Runs in the page as a classic script right after the file form, before the
 * browser paints the template and before Copy and Download are bound (they
 * bind at the end of <body>). It reads the stored note, applies decideBoot,
 * and owns the choice line's two buttons, so they work before any module
 * loads. The module (liveFile) opens the same line on a dirty tab click.
 */
export function noteBoot(kit, shelf, limit) {
  const form = document.querySelector("form[data-file]");
  if (!form) return;
  const field = form.querySelector("textarea");
  const paintCode = form.querySelector(".paint code");
  const nameNode = form.querySelector("[data-file-name]");
  const nameInput = form.querySelector('input[name="filename"]');
  const says = document.querySelector("[data-file-says]");
  const tryLine = document.querySelector("[data-file-try]");
  const line = form.querySelector("[data-note-choice-line]");
  const useButton = form.querySelector("[data-note-use]");
  const state = form.querySelector("[data-note-state]");
  const tabs = [...document.querySelectorAll("[data-example]")];
  const byId = new Map(shelf.map((item) => [item.id, item]));
  const announce = (message) => {
    const status = document.getElementById("status");
    if (status) { status.textContent = ""; setTimeout(() => { status.textContent = message; }, 50); }
  };
  const show = (message) => {
    if (!state) return;
    state.textContent = message;
    state.hidden = !message;
  };
  const read = () => {
    try {
      return kit.fromJson(localStorage.getItem(kit.key), limit);
    } catch {
      return null;
    }
  };
  const chrome = (from) => {
    const item = from ? byId.get(from) : null;
    for (const tab of tabs) {
      if (item && tab.dataset.example === item.id) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    }
    if (says) says.textContent = item ? item.says : "";
    if (tryLine) tryLine.textContent = item ? item.try : "";
  };
  const setField = (script, filename, from) => {
    field.value = script;
    // The paint is laid out from first paint; keep its height with the field so nothing jumps when color arrives.
    if (paintCode) paintCode.textContent = `${script}\n`;
    if (nameNode) nameNode.textContent = filename;
    if (nameInput) nameInput.value = filename;
    chrome(from);
    form.dispatchEvent(new CustomEvent("spw:note-painted"));
  };
  const write = (next) => {
    try {
      localStorage.setItem(kit.key, JSON.stringify(next));
      delete form.dataset.note;
      return true;
    } catch {
      form.dataset.note = "unkept";
      let raw = null;
      try { raw = localStorage.getItem(kit.key); } catch { /* storage itself refused */ }
      announce(raw !== null && !kit.fromJson(raw, limit)
        ? "This browser is not keeping the note on this device. The value already stored under this key was left in place."
        : "This browser is not keeping the note on this device.");
      return false;
    }
  };
  const closeChoice = () => {
    delete form.dataset.noteChoice;
    delete form.dataset.noteTarget;
    if (line) line.hidden = true;
  };
  const openChoice = (targetId = "") => {
    form.dataset.noteChoice = "open";
    if (targetId) form.dataset.noteTarget = targetId;
    else delete form.dataset.noteTarget;
    if (useButton) useButton.textContent = targetId ? "Open the template" : "Use this template";
    if (line) line.hidden = false;
  };

  // Keep this note: paint the stored script; keystrokes typed while the line was open are dropped; nothing is written.
  form.querySelector("[data-note-keep]")?.addEventListener("click", () => {
    const stored = read();
    closeChoice();
    if (stored) setField(stored.script, stored.filename, stored.from);
    history.replaceState(null, "", kit.questAddress(location.search, { note: true }));
    field.focus();
  });
  // Use (or open) the template: the one explicit write of a template over the note.
  useButton?.addEventListener("click", () => {
    const target = byId.get(form.dataset.noteTarget || "") || byId.get(form.dataset.noteServed || "");
    closeChoice();
    if (!target) return;
    write(kit.record({ script: target.script, filename: target.file, from: target.id }, limit));
    setField(target.script, target.file, target.id);
    history.replaceState(null, "", kit.questAddress(location.search, { example: target.id }));
    field.focus();
  });

  const served = tabs.find((tab) => tab.getAttribute("aria-current"))?.dataset.example || "";
  form.dataset.noteServed = served;
  form.spwNote = { openChoice, closeChoice, read, write, chrome, show };

  const decision = kit.decideBoot({ search: location.search, field: field.value, filename: nameInput ? nameInput.value : "", stored: read(), shelf, limit });
  if (decision.action === "paint-record") {
    setField(decision.field, decision.filename, decision.from);
    if (decision.url) history.replaceState(null, "", decision.url);
  } else if (decision.action === "ask") {
    openChoice();
  }
  if (decision.notice === "unstored") show("No note is kept in this browser yet. This is a template; your first edit keeps it here.");
}

/** The classic script the guide places right after its file form. */
export function noteBootScript(shelf, limit) {
  const data = JSON.stringify(shelf.map(({ id, file, says, try: attempt, script }) => ({ id, file, says, try: attempt, script }))).replace(/</g, "\\u003c");
  return `<script>(${noteBoot.toString()})((${noteKit.toString()})(), ${data}, ${Number(limit)});</script>`;
}
