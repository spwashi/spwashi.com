/**
 * Progressive enhancement for autonomous.feedback pages. Every page works
 * without it: forms post and cards can be screenshotted. The script is
 * ordinary code serialized into the page.
 */

function clientMain() {
  const storage = (() => {
    try {
      const probe = "af:probe";
      sessionStorage.setItem(probe, "1");
      sessionStorage.removeItem(probe);
      return sessionStorage;
    } catch {
      return null;
    }
  })();
  const say = (message) => (typeof announce === "function" ? announce(message) : undefined);

  // A named page fills the path field.
  document.querySelectorAll('input[name="route"]').forEach((input) => {
    input.addEventListener("change", () => {
      const path = document.getElementById("path");
      if (path && input.value) path.value = input.value;
    });
  });

  // A live card leans toward the pointer and catches a little light. Never while typing, never for coarse pointers or reduced motion.
  if (window.matchMedia?.("(pointer: fine) and (prefers-reduced-motion: no-preference)")?.matches) {
    document.querySelectorAll(".quiet .card.live").forEach((live) => {
      let frame = 0;
      live.addEventListener("pointermove", (event) => {
        if (live.matches(":focus-within")) return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const box = live.getBoundingClientRect();
          const x = (event.clientX - box.left) / box.width;
          const y = (event.clientY - box.top) / box.height;
          live.dataset.tilt = "";
          live.style.setProperty("--ry", `${((x - 0.5) * 5).toFixed(2)}deg`);
          live.style.setProperty("--rx", `${((0.5 - y) * 4).toFixed(2)}deg`);
          live.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
          live.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
        });
      });
      const rest = () => {
        delete live.dataset.tilt;
        ["--rx", "--ry", "--mx", "--my"].forEach((name) => live.style.removeProperty(name));
      };
      live.addEventListener("pointerleave", rest);
      live.addEventListener("focusin", rest);
    });
  }

  // Write: the form is the card. One choice fills its header; the note is written on the card itself.
  const write = document.getElementById("write");
  if (write) {
    // On a phone the choices scroll sideways, a row each; a row opens on its chosen chip, not past it.
    write.querySelectorAll("fieldset.chips .row").forEach((row) => {
      const chosen = row.querySelector("label.chip:has(input:checked)");
      if (chosen && row.scrollWidth > row.clientWidth) row.scrollLeft = Math.max(0, chosen.offsetLeft - row.offsetLeft - 16);
    });
    const note = write.querySelector("#note");
    const card = write.querySelector("[data-live-card]");
    const kindLabel = write.querySelector('[data-live="kind"]');
    const expressionLine = write.querySelector('[data-live="expression"]');
    const aboutLine = write.querySelector('[data-live="about"]');
    const question = write.querySelector('[data-fill="prompt"]');
    const subjectName = write.querySelector('[data-fill="subject-name"]');
    const count = write.querySelector("[data-count]");
    const countLine = write.querySelector("[data-count-line]");
    const clear = write.querySelector("[data-clear-what]");
    const submit = write.querySelector("button[type=submit]");
    const draftKey = `af:draft:${write.dataset.draftKey || "any"}`;
    const max = Number(note.getAttribute("maxlength")) || Infinity;
    const chosen = () => write.querySelector('input[name="what"]:checked');
    const subject = () => write.querySelector('input[name="subject"]:checked');

    // Change a line on the card, and let it settle so the change is felt.
    const setLine = (node, text) => {
      if (!node || node.textContent === text) return;
      node.textContent = text;
      node.hidden = !text;
      node.removeAttribute("data-settle");
      void node.offsetWidth;
      node.setAttribute("data-settle", "");
    };
    const paintCard = () => {
      const what = chosen();
      const about = subject();
      const words = note.value.trim();
      setLine(kindLabel, what?.dataset.kindTitle || "Note");
      setLine(expressionLine, what?.dataset.expression || "");
      setLine(aboutLine, what?.dataset.about || about?.dataset.name || "");
      if (question) {
        const threadOrThanks = what && (what.value.startsWith("thread:") || what.value === "thanks");
        question.textContent = threadOrThanks
          ? "Add a detail if you want. The choice is enough."
          : what?.dataset.prompt || about?.dataset.prompt || question.dataset.idle || question.textContent;
      }
      // What the card shows when nothing is written is exactly what a tap sends.
      note.placeholder = what?.dataset.body || about?.dataset.example || note.dataset.placeholder || "";
      if (card) card.dataset.filled = String(Boolean(words || what));
      if (clear) clear.hidden = !what;
      if (submit) {
        const bare = what && !words;
        submit.textContent = !bare ? write.dataset.button || submit.textContent
          : what.value === "thanks" ? "Send thanks" : what.value.startsWith("thread:") ? "Count me in" : write.dataset.button || submit.textContent;
      }
      // The count only speaks near the limit.
      if (count) count.textContent = String(note.value.length);
      if (countLine) countLine.hidden = note.value.length < max * 0.8;
    };

    // A draft is the whole card: where it is about, what it is, the words, the name, and any answers.
    const saveDraft = () => {
      if (!storage) return;
      const draft = {
        subject: subject()?.value || "",
        what: chosen()?.value || "",
        note: note.value,
        from: write.querySelector("#from")?.value || "",
        asks: [...write.querySelectorAll('textarea[name^="ask-"]')].map((ask) => [ask.id, ask.value]).filter(([, value]) => value),
      };
      if (draft.what || draft.note || draft.from || draft.asks.length) storage.setItem(draftKey, JSON.stringify(draft));
      else storage.removeItem(draftKey);
    };
    const restoreDraft = () => {
      // A page the server filled (an error, a link that named something) is already the truth.
      if (!storage || note.value || chosen() || write.querySelector("#from")?.value) return;
      let draft;
      try {
        draft = JSON.parse(storage.getItem(draftKey) || "null");
      } catch {
        draft = null;
      }
      if (!draft) return;
      const pick = (name, value) => {
        const input = value && [...write.querySelectorAll(`input[name="${name}"]`)].find((i) => i.value === value);
        if (input) input.checked = true;
      };
      pick("subject", draft.subject);
      pick("what", draft.what);
      note.value = draft.note || "";
      const from = write.querySelector("#from");
      if (from) from.value = draft.from || "";
      (draft.asks || []).forEach(([id, value]) => {
        const ask = document.getElementById(id);
        if (ask) {
          ask.value = value;
          ask.closest("details")?.setAttribute("open", "");
        }
      });
      if (subjectName && subject()?.dataset.name) subjectName.textContent = subject().dataset.name;
      if (question && subject()?.dataset.prompt) question.textContent = subject().dataset.prompt;
      say("Your unsent card was restored.");
    };

    restoreDraft();
    paintCard();
    write.addEventListener("input", () => { paintCard(); saveDraft(); });

    write.querySelectorAll('input[name="subject"]').forEach((input) => input.addEventListener("change", () => {
      if (subjectName && input.dataset.name) subjectName.textContent = input.dataset.name;
      // A common note from another part of the site is hidden now, so it stops being the choice.
      const what = chosen();
      if (what?.value.startsWith("thread:") && !what.value.startsWith(`thread:${input.value}:`)) what.checked = false;
      paintCard();
      saveDraft();
    }));
    write.querySelectorAll('input[name="what"]').forEach((input) => input.addEventListener("change", () => {
      paintCard();
      saveDraft();
      // Speak the owner's reply when a common note has one; it is the reward for the tap.
      const stance = write.querySelector(`.stance[data-for="${CSS.escape(input.value)}"]`);
      say(stance ? stance.textContent.trim() : `${input.closest("label")?.textContent.trim() || "That"} is on the card. Add words if you like.`);
    }));

    const clearChoice = () => {
      const what = chosen();
      if (!what) return;
      what.checked = false;
      paintCard();
      saveDraft();
      say("Choice cleared. The card is a plain note.");
      write.querySelector('#what input[name="what"]')?.focus();
    };
    clear?.addEventListener("click", clearChoice);
    write.querySelector("#what")?.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && chosen()) {
        event.preventDefault();
        clearChoice();
      }
    });
    // Control or Command and Enter sends from anywhere in the form.
    write.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        write.requestSubmit();
      }
    });

    write.addEventListener("submit", (event) => {
      if (submit.getAttribute("aria-busy") === "true") {
        event.preventDefault();
        return;
      }
      submit.setAttribute("aria-busy", "true");
      submit.dataset.idle = submit.textContent;
      submit.textContent = submit.dataset.pending || "Sending…";
      // The draft stays until a card arrives (below): a send that fails, or is asked to wait, loses nothing.
      saveDraft();
    });
    // Coming back with the back button restores the page from cache; make the button usable again.
    window.addEventListener("pageshow", () => {
      if (submit.getAttribute("aria-busy") !== "true") return;
      submit.removeAttribute("aria-busy");
      submit.textContent = submit.dataset.idle || submit.textContent;
    });

    const summary = document.querySelector("[data-error-summary]");
    if (summary) summary.focus();
  }

  // Card: save it as an image, share it, or post it; any of these stamps it.
  const share = document.querySelector(".share");
  const card = document.getElementById("card");
  if (share && card) {
    // The card arrived, so the unsent draft for this site is done.
    if (storage) {
      storage.removeItem(`af:draft:${card.dataset.host || ""}`);
      storage.removeItem("af:draft:any");
    }
    // Copy needs script; without it the text sits under "The card as text".
    if (navigator.clipboard) share.querySelectorAll("[data-copy]").forEach((node) => { node.hidden = false; });
    const stamp = card.querySelector("[data-stamp]");
    const markShared = (how) => {
      card.dataset.sent = "true";
      if (stamp) stamp.textContent = "Shared";
      say(how);
    };

    /**
     * The card as a picture, 1080 by 1350 (4:5, a post's own shape), laid out
     * as the page lays it out: the kind and what it is about at the top, the
     * words large in the middle (their size fitted to the space), the writer
     * under them, and the postmark at the foot: site, page, day, expression.
     */
    const drawCard = async () => {
      const root = getComputedStyle(document.documentElement);
      const token = (name, fallback) => root.getPropertyValue(name).trim() || fallback;
      const colors = {
        bg: token("--bg", "#0a1012"),
        surface: token("--surface", "#10181b"),
        fg: token("--fg", "#e8eef1"),
        muted: token("--muted", "#8aa0a8"),
        accent: token("--accent", "#5eead4"),
      };
      const family = token("--font", "system-ui, sans-serif");
      const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";
      const width = 1080;
      const height = 1350;
      const edge = 40;
      const pad = 104;
      const inner = width - pad * 2;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      const wrap = (text, font, limit) => {
        ctx.font = font;
        const lines = [];
        for (const paragraph of String(text).split(/\n/)) {
          let line = "";
          for (const word of paragraph.split(/\s+/).filter(Boolean)) {
            const trial = line ? `${line} ${word}` : word;
            if (ctx.measureText(trial).width <= limit || !line) line = trial;
            else {
              lines.push(line);
              line = word;
            }
          }
          lines.push(line);
        }
        return lines;
      };
      const data = card.dataset;

      // The ground and the card.
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(edge, edge, width - edge * 2, height - edge * 2, 44);
      else ctx.rect(edge, edge, width - edge * 2, height - edge * 2);
      ctx.fillStyle = colors.surface;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = colors.accent;
      ctx.stroke();
      ctx.textBaseline = "alphabetic";

      // Top: the kind, and what it is about.
      let y = pad + 34;
      ctx.fillStyle = colors.accent;
      ctx.font = `600 30px ${family}`;
      ctx.fillText(String(data.kind || "").toUpperCase(), pad, y);
      const aboutLines = data.about ? wrap(data.about, `32px ${family}`, inner).slice(0, 2) : [];
      ctx.fillStyle = colors.muted;
      ctx.font = `32px ${family}`;
      for (const line of aboutLines) {
        y += 46;
        ctx.fillText(line, pad, y);
      }
      const top = y + 40;

      // Foot: the postmark, from the bottom up.
      const footBase = height - pad;
      const postmark = [];
      if (data.expression) postmark.push({ text: data.expression, font: `24px ${mono}`, color: colors.muted, gap: 40 });
      postmark.push({ text: data.address || "", font: `30px ${mono}`, color: colors.fg, gap: 48, day: data.day || "" });
      postmark.push({ text: data.site || "", font: `650 36px ${family}`, color: colors.fg, gap: 52 });
      let footY = footBase;
      for (const row of postmark) {
        ctx.font = row.font;
        ctx.fillStyle = row.color;
        ctx.fillText(row.text, pad, footY);
        if (row.day) {
          ctx.textAlign = "right";
          ctx.fillStyle = colors.muted;
          ctx.fillText(row.day, width - pad, footY);
          ctx.textAlign = "left";
        }
        footY -= row.gap;
      }
      const rule = footY - 8;
      ctx.strokeStyle = colors.muted;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(pad, rule);
      ctx.lineTo(width - pad, rule);
      ctx.stroke();
      ctx.setLineDash([]);

      // Middle: the words, as large as the space between holds, then the writer,
      // the whole block centered between the top line and the postmark.
      const fromLine = data.from ? `— ${data.from}` : "";
      const areaTop = top;
      const areaBottom = rule - 56;
      const blockOf = (count, px) => px * 0.8 + count * px * 1.28 + (fromLine ? 86 : 0);
      let size = 92;
      let lines = wrap(data.note || "", `${size}px ${family}`, inner);
      while (blockOf(lines.length, size) > areaBottom - areaTop && size > 30) {
        size -= 2;
        lines = wrap(data.note || "", `${size}px ${family}`, inner);
      }
      const fits = Math.max(1, Math.floor((areaBottom - areaTop - size * 0.8 - (fromLine ? 86 : 0)) / (size * 1.28)));
      if (lines.length > fits) lines = [...lines.slice(0, fits - 1), `${lines[fits - 1]}…`];
      let cursor = areaTop + Math.max(0, (areaBottom - areaTop - blockOf(lines.length, size)) / 2);
      ctx.fillStyle = colors.accent;
      ctx.font = `${Math.round(size * 1.9)}px ${family}`;
      ctx.fillText("\u201C", pad - 4, cursor + size * 1.35);
      cursor += size * 0.8;
      ctx.fillStyle = colors.fg;
      ctx.font = `${size}px ${family}`;
      for (const line of lines) {
        cursor += size * 1.28;
        ctx.fillText(line, pad, cursor);
      }
      if (fromLine) {
        ctx.fillStyle = colors.muted;
        ctx.font = `38px ${family}`;
        ctx.fillText(fromLine, pad, cursor + 76);
      }
      return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    };

    const save = share.querySelector("[data-save-image]");
    if (save && document.createElement("canvas").getContext) {
      save.hidden = false;
      save.addEventListener("click", async () => {
        save.setAttribute("aria-busy", "true");
        try {
          const blob = await drawCard();
          const file = new File([blob], share.dataset.fileName, { type: "image/png" });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({ files: [file], text: share.dataset.shareText });
              markShared("Shared the card image.");
              return;
            } catch (error) {
              if (error && error.name === "AbortError") return;
            }
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = file.name;
          document.body.append(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          markShared(`Saved ${file.name}.`);
        } catch {
          say("Could not make the image. A screenshot works too.");
        } finally {
          save.removeAttribute("aria-busy");
        }
      });
    }

    const native = share.querySelector('[data-share="native"]');
    if (native && navigator.share) {
      native.hidden = false;
      native.addEventListener("click", async () => {
        try {
          await navigator.share({ text: share.dataset.shareText, url: share.dataset.shareUrl });
          markShared("Shared the card.");
        } catch {}
      });
    }
    share.querySelectorAll('[data-share="post"]').forEach((node) => node.addEventListener("click", () => markShared("Opened a post in a new tab.")));
    document.querySelectorAll('[data-share="dm"]').forEach((node) => node.addEventListener("click", () => markShared("Opened the profile in a new tab. Use Message there.")));
    share.querySelectorAll("[data-copy]").forEach((node) => node.addEventListener("click", () => markShared("Copied the card text.")));
  }
}

export const CLIENT_SCRIPT = `(${clientMain.toString()})();`;
