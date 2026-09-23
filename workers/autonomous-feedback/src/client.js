/**
 * Progressive enhancement for autonomous.feedback pages. Every page works
 * without it: forms post, the setup page rerenders on submit, cards can be
 * screenshotted. The script is ordinary code serialized into the page, so the
 * browser normalizes a pasted link with the same function the server uses.
 */
import { normalizeHost, validSubject } from "./model.js";

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

  // A pasted link becomes a domain as soon as the field is left.
  document.querySelectorAll('input[name="route"]').forEach((input) => {
    input.addEventListener("change", () => {
      const path = document.getElementById("path");
      if (path && input.value) path.value = input.value;
    });
  });

  document.querySelectorAll("[data-host-field]").forEach((field) => {
    const visit = field.parentElement?.querySelector("[data-visit]") || document.querySelector("[data-visit]");
    const paintVisit = () => {
      const clean = normalizeHost(field.value);
      if (!visit) return;
      if (validSubject(clean)) {
        visit.href = `https://${clean}/`;
        visit.hidden = false;
        visit.textContent = `Open ${clean}`;
      } else {
        visit.hidden = true;
        visit.removeAttribute("href");
      }
    };
    field.addEventListener("input", paintVisit);
    field.addEventListener("change", () => {
      const clean = normalizeHost(field.value);
      if (clean && clean !== field.value) field.value = clean;
      paintVisit();
      const form = field.closest("form");
      if (!form || form.querySelector('input[type="hidden"][name="host"]') || !validSubject(clean)) return;
      const kind = form.querySelector('input[name="kind"]:checked')?.value || "problem";
      const next = `/${clean}/${kind}${location.search}`;
      if (next !== location.pathname + location.search) history.pushState(null, "", next);
    });
    paintVisit();
  });

  // Setup: the code, preview, and test commands follow the form.
  const setup = document.getElementById("setup");
  const dataNode = document.getElementById("setup-data");
  if (setup && dataNode) {
    const data = JSON.parse(dataNode.textContent);
    const host = setup.querySelector("[data-host-field]");
    const snippet = document.getElementById("snippet");
    const testSnippet = document.getElementById("test-snippet");
    const configSnippet = document.getElementById("config-snippet");
    const preview = document.getElementById("preview");
    const fills = (name) => document.querySelectorAll(`[data-fill="${name}"]`);
    let frameTimer = 0;

    const fill = (template, domain, kind) => template
      .split("{{host}}").join(domain)
      .split("{{kind}}").join(kind.slug)
      .split("{{title}}").join(kind.title);

    const paint = () => {
      const typed = normalizeHost(host.value);
      const usable = typed && validSubject(typed);
      const domain = usable ? typed : data.example;
      const how = setup.querySelector('input[name="how"]:checked')?.value || "link";
      const slug = setup.querySelector('input[name="kind"]:checked')?.value || data.kinds[0].slug;
      const kind = data.kinds.find((k) => k.slug === slug) || data.kinds[0];
      const chosen = data.snippets[how];
      const code = fill(chosen.template, domain, kind);
      snippet.textContent = code;
      testSnippet.textContent = fill(data.test, domain, kind);
      if (configSnippet && data.config) configSnippet.textContent = fill(data.config, domain, kind);
      fills("host").forEach((node) => { node.textContent = domain; });
      fills("how-label").forEach((node) => { node.textContent = chosen.label; });
      fills("where").forEach((node) => { node.textContent = chosen.where; });
      fills("config-url").forEach((node) => { node.textContent = `https://${domain}/.well-known/autonomous-feedback.json`; });
      fills("test-link").forEach((node) => {
        node.href = `/${domain}/${kind.slug}`;
        node.textContent = `autonomous.feedback/${domain}/${kind.slug}`;
      });
      document.querySelectorAll("[data-when-empty]").forEach((node) => { node.hidden = usable; });

      // The preview renders the generated code, which only ever holds a validated domain.
      if (how === "frame") {
        const src = `/embed/${domain}/${kind.slug}`;
        let frame = preview.querySelector("iframe");
        if (!frame || preview.dataset.how !== "frame") {
          preview.innerHTML = "";
          frame = document.createElement("iframe");
          frame.width = "100%";
          frame.height = "560";
          frame.style.border = "0";
          preview.append(frame);
        }
        frame.title = `Preview: feedback frame for ${domain}`;
        clearTimeout(frameTimer);
        frameTimer = setTimeout(() => {
          if (frame.getAttribute("src") !== src) frame.src = src;
        }, 400);
      } else if (how === "fetch") {
        preview.innerHTML = '<p class="note">Your own code decides how this looks.</p>';
      } else {
        preview.innerHTML = code.split("https://autonomous.feedback").join("");
      }
      preview.dataset.how = how;

      const params = new URLSearchParams();
      if (usable) params.set("host", typed);
      if (how !== "link") params.set("how", how);
      if (slug !== data.kinds[0].slug) params.set("kind", slug);
      const next = `/start${params.toString() ? `?${params}` : ""}`;
      if (next !== location.pathname + location.search) history.replaceState(null, "", next);
    };

    setup.addEventListener("input", paint);
    setup.addEventListener("change", paint);
    setup.addEventListener("submit", (event) => {
      event.preventDefault();
      paint();
      say("The code is up to date.");
    });
  }

  // Write: the kind is a choice inside the form, so switching keeps the note.
  const write = document.getElementById("write");
  if (write) {
    const note = write.querySelector("#note");
    const count = write.querySelector("[data-count]");
    const countLine = write.querySelector("#note-count");
    const hint = write.querySelector('[data-fill="prompt"]');
    const submit = write.querySelector("button[type=submit]");
    const draftKey = `af:draft:${write.dataset.draftKey || "any"}`;
    const min = Number(note.getAttribute("minlength")) || 0;
    const max = Number(note.getAttribute("maxlength")) || Infinity;

    const paintCount = () => {
      const length = note.value.trim().length;
      count.textContent = String(note.value.length);
      countLine.dataset.state = length === 0 ? "" : length < min ? "short" : length > max ? "long" : "ok";
    };
    const paintKind = () => {
      const chosen = write.querySelector('input[name="kind"]:checked');
      if (!chosen) return;
      if (hint) hint.textContent = chosen.dataset.prompt;
      note.placeholder = `For example: ${chosen.dataset.example}`;
      const href = chosen.dataset.href;
      if (href && href !== location.pathname) history.replaceState(null, "", href);
    };

    if (storage && !note.value) {
      const saved = storage.getItem(draftKey);
      if (saved) {
        note.value = saved;
        say("Your unsent note was restored.");
      }
    }
    paintCount();
    note.addEventListener("input", () => {
      paintCount();
      if (storage) {
        if (note.value) storage.setItem(draftKey, note.value);
        else storage.removeItem(draftKey);
      }
    });
    write.querySelectorAll('input[name="kind"]').forEach((input) => input.addEventListener("change", paintKind));

    write.addEventListener("submit", (event) => {
      if (submit.getAttribute("aria-busy") === "true") {
        event.preventDefault();
        return;
      }
      submit.setAttribute("aria-busy", "true");
      submit.dataset.idle = submit.textContent;
      submit.textContent = submit.dataset.pending || "Sending…";
      if (storage) storage.removeItem(draftKey);
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

  // Setup: make an inbox key on this device. Only its hash goes in the public file.
  const keygen = document.querySelector("[data-keygen]");
  if (keygen && crypto?.subtle) {
    keygen.hidden = false;
    const keyOut = document.getElementById("inbox-key-value");
    const hashOut = document.getElementById("inbox-key-hash");
    keygen.querySelector("[data-make-key]")?.addEventListener("click", async () => {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const hex = (buffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
      const key = hex(bytes);
      const hash = hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key)));
      if (keyOut) keyOut.textContent = key;
      if (hashOut) hashOut.textContent = `"inbox": { "key": "sha256:${hash}" }`;
      keygen.querySelectorAll("[data-key-result]").forEach((node) => { node.hidden = false; });
      say("Made a key. Copy it somewhere safe before leaving this page.");
    });
  }

  // Card: save it as an image, share it, or post it; any of these stamps it.
  const share = document.querySelector(".share");
  const card = document.getElementById("card");
  if (share && card) {
    const stamp = card.querySelector("[data-stamp]");
    const markShared = (how) => {
      card.dataset.sent = "true";
      if (stamp) stamp.textContent = "Shared";
      say(how);
    };

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
      const width = 1080;
      const pad = 88;
      const inner = width - pad * 2;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const wrap = (text, font, limit) => {
        ctx.font = font;
        const lines = [];
        for (const paragraph of text.split(/\n/)) {
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
      const noteText = card.dataset.note;
      let size = 46;
      let lines = wrap(noteText, `${size}px ${family}`, inner - 32);
      while (lines.length * size * 1.45 > 1200 && size > 28) {
        size -= 2;
        lines = wrap(noteText, `${size}px ${family}`, inner - 32);
      }
      const maxLines = Math.floor(1300 / (size * 1.45));
      if (lines.length > maxLines) lines = [...lines.slice(0, maxLines - 1), `${lines[maxLines - 1]}…`];
      const siteLines = wrap(card.dataset.site, `650 64px ${family}`, inner);
      const height = Math.max(1080, pad + 40 + 30 + siteLines.length * 76 + 50 + lines.length * size * 1.45 + 60 + 50 + pad);
      canvas.width = width;
      canvas.height = Math.ceil(height);

      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, canvas.height);
      const radius = 40;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(36, 36, width - 72, canvas.height - 72, radius) : ctx.rect(36, 36, width - 72, canvas.height - 72);
      ctx.fillStyle = colors.surface;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = colors.accent;
      ctx.stroke();

      let y = pad + 40;
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = colors.accent;
      ctx.font = `600 28px ${family}`;
      ctx.fillText(card.dataset.kind.toUpperCase(), pad, y);
      y += 30;
      ctx.fillStyle = colors.fg;
      ctx.font = `650 64px ${family}`;
      for (const line of siteLines) {
        y += 76;
        ctx.fillText(line, pad, y);
      }
      y += 50;
      ctx.fillStyle = colors.accent;
      ctx.fillRect(pad, y, 5, lines.length * size * 1.45);
      ctx.fillStyle = colors.fg;
      ctx.font = `${size}px ${family}`;
      for (const line of lines) {
        y += size * 1.45;
        ctx.fillText(line, pad + 32, y - size * 0.35);
      }
      const footY = canvas.height - pad;
      ctx.fillStyle = colors.muted;
      ctx.fillRect(pad, footY - 62, inner, 2);
      ctx.font = `28px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.fillText(card.dataset.day, pad, footY);
      ctx.fillStyle = colors.fg;
      ctx.textAlign = "right";
      ctx.fillText(card.dataset.address, width - pad, footY);
      ctx.textAlign = "left";
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

export const CLIENT_SCRIPT = `${validSubject.toString()}
${normalizeHost.toString()}
(${clientMain.toString()})();`;
