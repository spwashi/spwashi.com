(() => {
  if ("serviceWorker" in navigator && window.top === window) navigator.serviceWorker.register("/sw.js").catch(() => {});
  const ISSUES = [{"slug":"pi","series":"pi","title":"π","no":"3.1","status":"draft","question":""},{"slug":"22-7","series":"pi","title":"22/7","no":"3.14","status":"draft","question":""},{"slug":"pie","series":"pi","title":"Pie","no":"3.141","status":"draft","question":""},{"slug":"355-113","series":"pi","title":"355/113","no":"3.1415","status":"draft","question":""},{"slug":"crust","series":"pi","title":"Crust","no":"3.14159","status":"draft","question":""},{"slug":"needles","series":"pi","title":"Needles","no":"3.141592","status":"draft","question":""},{"slug":"slice","series":"pi","title":"Slice","no":"3.1415926","status":"draft","question":""},{"slug":"square","series":"pi","title":"The Square","no":"3.14159265","status":"draft","question":""},{"slug":"patience","series":"pi","title":"Patience","no":"3.141592653","status":"draft","question":""},{"slug":"steam","series":"pi","title":"Steam","no":"3.1415926535","status":"open","question":"How long should a pie rest, and can the resting be written down?"},{"slug":"lattice","series":"pi","title":"Lattice","no":"3.14159265358","status":"open","question":"What does a lattice top count?"},{"slug":"interest","series":"e","title":"Interest","no":"2.7","status":"draft","question":""},{"slug":"rise","series":"e","title":"Rise","no":"2.71","status":"draft","question":""},{"slug":"starter","series":"e","title":"Starter","no":"2.718","status":"open","question":"What does a sourdough starter know about e?"}];
  const CURIOSITIES = {"pi":["355/113 matches π to 6 places; write 113355 and fold it in half.","e^π − π ≈ 19.999099979 — nearly 20 by an accidental coincidence.","One in every ten digits of π settles nowhere: [3; 7, 15, 1, 292, …] leaps suddenly at 292.","Multiply a pie tin's diameter by 22 and divide by 7 to land within a hair of its rim."],"e":["e^π ≈ 23.14069 beats π^e ≈ 22.45916 — e wins any exponent duel against other numbers.","1/0! + 1/1! + 1/2! + 1/3! + … arrives at e fast enough to reach 9 places by step 12.","Split e to climb a hill: e^(1/e) ≈ 1.44467 is the steepest real fixed-point base.","Continuous 100% growth turns 1 into e in a single unit of time."]};

  /* 1. Pinch-to-scale text on main prose surfaces (respecting figure canvas gestures). */
  import("/text-scale.js").then(({ mountTextScale }) => {
    const main = document.querySelector("main");
    if (main) mountTextScale(main, { ignore: ".fig-stage, .fig-controls, .pocket-pi" });
  }).catch(() => {});

  /* 2. PWA lifecycle & discreet iOS/offline status cues. */
  const keep = document.getElementById("keep-app");
  const statusEl = document.getElementById("pwa-status");
  const isStandalone = window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  const syncStatus = () => {
    if (!statusEl) return;
    if (!navigator.onLine) {
      statusEl.textContent = "Offline — reading the kept printing.";
      statusEl.hidden = false;
    } else if (isStandalone) {
      statusEl.textContent = "Kept on this device · every printed issue available offline.";
      statusEl.hidden = false;
    } else if (isIos && keep?.hidden) {
      statusEl.textContent = "To read offline on iOS: tap Share, then Add to Home Screen.";
      statusEl.hidden = false;
    } else {
      statusEl.hidden = true;
    }
  };
  let offer = null;
  if (keep) {
    addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      offer = event;
      keep.hidden = false;
      syncStatus();
    });
    keep.addEventListener("click", async () => {
      if (!offer) return;
      offer.prompt();
      await offer.userChoice.catch(() => null);
      offer = null;
      keep.hidden = true;
      syncStatus();
    });
    addEventListener("appinstalled", () => {
      keep.hidden = true;
      if (statusEl) { statusEl.textContent = "Kept on this device · offline ready."; statusEl.hidden = false; }
    });
  }
  addEventListener("online", syncStatus);
  addEventListener("offline", syncStatus);
  syncStatus();

  /* 3. Interactive masthead decimal expansion: tap a digit to inspect its issue owner. */
  document.querySelectorAll(".expansion").forEach((exp) => {
    const lead = exp.closest(".supplement") ? "e" : "pi";
    const series = ISSUES.filter((i) => i.series === lead);
    const visual = exp.querySelector("span[aria-hidden='true']");
    if (!visual || !series.length) return;
    const raw = visual.textContent.replace("…", "");
    const prefix = raw.slice(0, 2);
    const digits = raw.slice(2);
    const row = document.createElement("span");
    row.className = "expansion-digits";
    row.append(document.createTextNode(prefix));
    const note = document.createElement("p");
    note.className = "expansion-note";
    note.setAttribute("aria-live", "polite");
    note.hidden = true;
    const buttons = [];
    for (let i = 0; i < digits.length; i += 1) {
      const owner = series[i];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "expansion-digit";
      if (visual.children[i]?.classList.contains("here")) btn.classList.add("here");
      else if (owner?.status === "open") btn.classList.add("ahead");
      btn.textContent = digits[i];
      btn.title = owner ? `${owner.no} — ${owner.title}` : `Decimal place ${i + 1}`;
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", () => {
        const was = btn.getAttribute("aria-pressed") === "true";
        buttons.forEach((b) => b.setAttribute("aria-pressed", "false"));
        if (was) {
          if (owner && owner.status !== "open" && location.pathname !== `/${owner.slug}/`) {
            location.href = `/${owner.slug}/`;
            return;
          }
          note.hidden = true;
          return;
        }
        btn.setAttribute("aria-pressed", "true");
        if (!owner) return;
        note.hidden = false;
        note.replaceChildren();
        if (owner.status === "open") {
          note.textContent = `No. ${owner.no} (${owner.title}) — open slot in the room: ${owner.question}`;
        } else {
          note.append(document.createTextNode(`${owner.no} — `), Object.assign(document.createElement("a"), { href: `/${owner.slug}/`, textContent: owner.title }), document.createTextNode(location.pathname === `/${owner.slug}/` ? " (this issue)" : " · tap again to read"));
        }
      });
      buttons.push(btn);
      row.append(btn);
    }
    row.append(document.createTextNode("…"));
    visual.replaceWith(row);
    exp.after(note);
  });

  /* 4. Interactive Euler's identity walk (e^(iπ) + 1 = 0) in colophon. */
  const eulerBtn = document.querySelector(".colophon .printers-mark");
  const eulerCard = document.getElementById("euler-card");
  if (eulerBtn && eulerCard) {
    eulerBtn.setAttribute("role", "button");
    eulerBtn.tabIndex = 0;
    eulerBtn.setAttribute("aria-expanded", "false");
    const EULER_STEPS = [
      { x: 42, y: 26, text: "Step 1 · start at e^(i·0) = +1 (east on the unit circle)." },
      { x: 26, y: 10, text: "Step 2 · quarter turn π/2: e^(i·π/2) = i (due north)." },
      { x: 10, y: 26, text: "Step 3 · half turn π: e^(i·π) = −1 (due west, π radians round)." },
      { x: 26, y: 26, text: "Step 4 · add +1: −1 + 1 = 0 (back at the origin)." },
    ];
    let step = -1;
    const renderEuler = () => {
      if (step < 0) {
        eulerCard.hidden = true;
        eulerBtn.setAttribute("aria-expanded", "false");
        return;
      }
      const s = EULER_STEPS[step];
      eulerCard.hidden = false;
      eulerBtn.setAttribute("aria-expanded", "true");
      eulerCard.innerHTML = `<svg class="euler-svg" viewBox="0 0 52 52" aria-hidden="true"><line x1="6" y1="26" x2="46" y2="26"/><line x1="26" y1="6" x2="26" y2="46"/><circle cx="26" cy="26" r="16"/><circle class="dot" cx="${s.x}" cy="${s.y}" r="3.5"/></svg><span>${s.text}</span>`;
    };
    const advance = () => {
      step = step + 1 >= EULER_STEPS.length ? -1 : step + 1;
      renderEuler();
    };
    eulerBtn.addEventListener("click", advance);
    eulerBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); advance(); }
    });
  }

  /* 5. Fleuron curiosities & tactile Uses / Pullquote regions. */
  document.querySelectorAll(".fleuron").forEach((fl) => {
    const series = document.body.classList.contains("series-e") ? "e" : "pi";
    const list = CURIOSITIES[series];
    let idx = -1;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "fleuron-btn";
    btn.textContent = fl.textContent;
    btn.title = "Tap for a marginalia note";
    fl.removeAttribute("aria-hidden");
    fl.replaceChildren(btn);
    const cue = document.createElement("p");
    cue.className = "fleuron-note";
    cue.setAttribute("aria-live", "polite");
    cue.hidden = true;
    fl.after(cue);
    btn.addEventListener("click", () => {
      idx = (idx + 1) % list.length;
      cue.hidden = false;
      cue.textContent = list[idx];
    });
  });

  document.querySelectorAll(".uses dl").forEach((dl) => {
    const children = [...dl.children];
    for (let i = 0; i < children.length; i += 2) {
      const dt = children[i];
      const dd = children[i + 1];
      if (!dt || !dd) continue;
      const wrap = document.createElement("div");
      wrap.tabIndex = 0;
      wrap.setAttribute("role", "button");
      wrap.setAttribute("aria-pressed", "false");
      dt.before(wrap);
      wrap.append(dt, dd);
      const toggle = () => {
        const next = wrap.dataset.picked !== "true";
        wrap.dataset.picked = next ? "true" : "false";
        wrap.setAttribute("aria-pressed", String(next));
      };
      wrap.addEventListener("click", toggle);
      wrap.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      });
    }
  });

  document.querySelectorAll(".pull").forEach((pull) => {
    const q = pull.querySelector("blockquote")?.textContent?.trim();
    if (!q) return;
    pull.style.cursor = "pointer";
    pull.title = "Tap to copy quotation";
    pull.addEventListener("click", async () => {
      try { await navigator.clipboard?.writeText(q); } catch {}
      pull.dataset.copied = "true";
      setTimeout(() => { delete pull.dataset.copied; }, 700);
    });
  });

  /* 6. Discreet footer door whisper before stepping through the wall. */
  const door = document.querySelector(".colophon .door");
  if (door) {
    const whisper = document.createElement("span");
    whisper.className = "door-whisper";
    whisper.textContent = "through the wall · smut.today";
    whisper.hidden = true;
    door.before(whisper);
    const show = () => { whisper.hidden = false; };
    const hide = () => { whisper.hidden = true; };
    door.addEventListener("pointerenter", show);
    door.addEventListener("pointerleave", hide);
    door.addEventListener("focus", show);
    door.addEventListener("blur", hide);
  }

  /* 7. Calendar whimsy (π Day 03-14, 22/7 Day 07-22, e Day 02-07) & Pocket π/e Digit Finder (type "314"/"271" or triple-tap volume ear). */
  const today = new Date();
  const md = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const holiday = md === "03-14" ? "π Day · 3.14" : md === "07-22" ? "22/7 Day" : md === "02-07" ? "e Day · 2.7" : "";
  const volEar = document.querySelector(".masthead .ears span:first-child");
  if (volEar && holiday) volEar.textContent = `${volEar.textContent} · ${holiday}`;

  function computeDigits() {
    // 250 digits of pi via Machin's formula and e via factorial series (BigInt exact fixed-point).
    const scale = 10n ** 260n;
    const arccot = (x) => {
      let sum = scale / BigInt(x);
      let term = sum;
      const x2 = BigInt(x) * BigInt(x);
      for (let k = 3n, sign = -1n; term !== 0n; k += 2n, sign = -sign) {
        term /= x2;
        if (term === 0n) break;
        sum += sign * (term / k);
      }
      return sum;
    };
    const piBig = 4n * (4n * arccot(5) - arccot(239));
    let eBig = scale;
    let fact = scale;
    for (let k = 1n; fact !== 0n; k += 1n) {
      fact /= k;
      eBig += fact;
    }
    return {
      pi: `3.${piBig.toString().slice(1, 241)}`,
      e: `2.${eBig.toString().slice(1, 241)}`,
    };
  }

  let pocketEl = null;
  function togglePocket() {
    if (pocketEl) {
      pocketEl.hidden = !pocketEl.hidden;
      if (!pocketEl.hidden) pocketEl.querySelector("input")?.focus();
      return;
    }
    const { pi, e } = computeDigits();
    const box = document.createElement("aside");
    box.className = "pocket-pi";
    box.setAttribute("aria-label", "Pocket pi and e finder");
    box.innerHTML = `<p class="caps head">Pocket π &amp; e · first 240 decimals</p>
      <div class="pocket-pi-row">
        <input type="text" inputmode="numeric" maxlength="12" placeholder="Search digits (e.g. 42, 314, 0722)…" aria-label="Search digits in pi and e">
        <button type="button" data-close>Close</button>
      </div>
      <p class="pocket-pi-digits" data-out>π^e ≈ ${(Math.PI ** Math.E).toFixed(5)} · e^π ≈ ${(Math.E ** Math.PI).toFixed(5)} (e wins by ${(Math.E ** Math.PI - Math.PI ** Math.E).toFixed(5)}).</p>`;
    const input = box.querySelector("input");
    const out = box.querySelector("[data-out]");
    box.querySelector("[data-close]").addEventListener("click", () => { box.hidden = true; });
    const piRaw = pi.slice(2);
    const eRaw = e.slice(2);
    const lookup = () => {
      const q = input.value.replace(/\D+/g, "");
      if (!q) {
        out.textContent = `π^e ≈ ${(Math.PI ** Math.E).toFixed(5)} · e^π ≈ ${(Math.E ** Math.PI).toFixed(5)} (e^π − π ≈ ${(Math.E ** Math.PI - Math.PI).toFixed(5)}).`;
        return;
      }
      const atPi = piRaw.indexOf(q);
      const atE = eRaw.indexOf(q);
      const msg = [
        atPi >= 0 ? `in π at decimal ${atPi + 1}` : "not in first 240 digits of π",
        atE >= 0 ? `in e at decimal ${atE + 1}` : "not in first 240 digits of e",
      ].join(" · ");
      out.textContent = `"${q}": ${msg}.`;
    };
    input.addEventListener("input", lookup);
    document.querySelector(".masthead")?.after(box);
    pocketEl = box;
    input.focus();
  }

  if (volEar) {
    volEar.dataset.secret = "true";
    volEar.title = "Triple-tap for the Pocket π & e Explorer";
    let taps = 0;
    let lastTap = 0;
    volEar.addEventListener("click", () => {
      const now = Date.now();
      taps = now - lastTap < 650 ? taps + 1 : 1;
      lastTap = now;
      if (taps >= 3) { taps = 0; togglePocket(); }
    });
  }

  let keys = "";
  addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName)) return;
    if (/^\d$/.test(event.key)) {
      keys = (keys + event.key).slice(-3);
      if (keys === "314" || keys === "271") togglePocket();
    } else if (event.key === "Escape" && pocketEl && !pocketEl.hidden) {
      pocketEl.hidden = true;
    }
  });
})();
