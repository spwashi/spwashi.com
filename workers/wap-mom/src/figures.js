/**
 * Figures: instruments a reader can move.
 *
 * One kit draws every figure. The server calls it to print each figure with
 * a plain GET form, so a figure redraws with no script at all. /figures.js
 * sends the same kit to the browser, where it redraws as the reader moves a
 * control. The kit is one self-contained function so it can travel by
 * toString(); nothing inside it may reach outside it.
 */

export function figureKit() {
  const PI = Math.PI;
  const esc = (v) =>
    String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const r1 = (x) => Math.round(x * 10) / 10;
  const svg = (w, h, label, body) =>
    `<svg class="fig-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;
  const line = (x1, y1, x2, y2, cls) =>
    `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" class="${cls}"/>`;
  const text = (x, y, s, anchor = "start") =>
    `<text x="${r1(x)}" y="${r1(y)}" text-anchor="${anchor}">${esc(s)}</text>`;
  const circle = (cx, cy, r, cls) => `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" class="${cls}"/>`;
  const points = (pts) => pts.map(([x, y]) => `${r1(x)},${r1(y)}`).join(" ");
  const polygon = (pts, cls) => `<polygon points="${points(pts)}" class="${cls}"/>`;
  const polyline = (pts, cls) => `<polyline points="${points(pts)}" class="${cls}"/>`;
  const small = (x) => {
    const places = Math.min(12, Math.max(2, -Math.floor(Math.log10(Math.abs(x))) + 1));
    return x.toFixed(places);
  };
  const grouped = (x) => Math.round(x).toLocaleString("en-US");

  const figures = {
    unroll: {
      params: [{ name: "d", label: "Width", min: 1, max: 10, step: 0.5, value: 4, unit: " in" }],
      render({ d }) {
        const s = 9;
        const r = (d * s) / 2;
        const cx = 61;
        const cy = 56;
        const x0 = 16;
        const y0 = 128;
        const around = PI * d * s;
        let body = circle(cx, cy, r, "soft accent");
        body += line(cx - r, cy, cx + r, cy, "ink");
        body += line(x0, y0, x0 + around, y0, "accent thick");
        for (let k = 0; k <= 3; k += 1) {
          const x = x0 + k * d * s;
          body += line(x, y0 - 6, x, y0 + 6, "ink");
          if (k > 0) body += text(x - (d * s) / 2, y0 + 18, String(k), "middle");
        }
        body += text(x0 + around, y0 - 10, "+0.14159…", "end");
        const readout = `Width ${d} in. Around ${(PI * d).toFixed(2)} in. Around ÷ width = 3.14159…, for this circle and every other.`;
        return { svg: svg(320, 150, readout, body), readout };
      },
    },

    polygons: {
      params: [
        {
          name: "k", label: "Sides", min: 0, max: 4, step: 1, value: 0,
          format: (k) => String([6, 12, 24, 48, 96][k]),
        },
      ],
      render({ k }) {
        const n = [6, 12, 24, 48, 96][k];
        const cx = 160;
        const cy = 98;
        const r = 78;
        const inside = [];
        const outside = [];
        const R = r / Math.cos(PI / n);
        for (let i = 0; i < n; i += 1) {
          const a = -PI / 2 + (i * 2 * PI) / n;
          inside.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
          outside.push([cx + R * Math.cos(a + PI / n), cy + R * Math.sin(a + PI / n)]);
        }
        const low = n * Math.sin(PI / n);
        const high = n * Math.tan(PI / n);
        const body = polygon(outside, "accent") + circle(cx, cy, r, "faint") + polygon(inside, "ink");
        const readout = `${n} sides. Inside: ${low.toFixed(5)}. Outside: ${high.toFixed(5)}. π is between them.${
          n === 96 ? " Archimedes rounded these outward, to 223/71 and 22/7." : ""
        }`;
        return { svg: svg(320, 196, readout, body), readout };
      },
    },

    tins: {
      params: [
        { name: "a", label: "Recipe's tin", min: 6, max: 14, step: 0.5, value: 9, unit: " in" },
        { name: "b", label: "Your tin", min: 6, max: 14, step: 0.5, value: 10, unit: " in" },
      ],
      render({ a, b }) {
        const s = 9;
        const factor = (b / a) ** 2;
        let body = circle(80, 72, (a * s) / 2, "soft ink");
        body += circle(240, 72, (b * s) / 2, "soft accent");
        body += text(80, 152, `${a}-inch`, "middle") + text(240, 152, `${b}-inch`, "middle");
        const readout = `A ${b}-inch tin holds ${factor.toFixed(2)} times what a ${a}-inch tin holds. Multiply the filling by ${factor.toFixed(2)}.`;
        return { svg: svg(320, 160, readout, body), readout };
      },
    },

    fractions: {
      params: [{ name: "n", label: "Largest denominator", min: 10, max: 400, step: 1, value: 120 }],
      render({ n }) {
        const x = (q) => 28 + ((q - 1) / Math.max(n - 1, 1)) * 280;
        const y = (err) => 172 - (Math.min(7.5, -Math.log10(err)) / 7.5) * 156;
        const named = { 1: "3/1", 7: "22/7", 106: "333/106", 113: "355/113" };
        let body = line(28, 172, 308, 172, "faint");
        body += text(24, 20, "closer", "end");
        let best = Infinity;
        let bestP = 3;
        let bestQ = 1;
        for (let q = 1; q <= n; q += 1) {
          const p = Math.round(PI * q);
          const err = Math.abs(p / q - PI);
          const record = err < best;
          if (record) {
            best = err;
            bestP = p;
            bestQ = q;
          }
          body += circle(x(q), y(err), record ? 2.4 : 1.2, record ? "dot-accent" : "dot");
          if (named[q]) body += text(x(q), y(err) - 7, named[q], q > n * 0.8 ? "end" : "middle");
        }
        const readout = `Best fraction with a denominator up to ${n}: ${bestP}/${bestQ}, off by ${small(best)}.${
          bestQ === 113 ? " It stays the best until 16,604." : ""
        }`;
        return { svg: svg(320, 186, readout, body), readout };
      },
    },

    edge: {
      params: [{ name: "d", label: "Pie", min: 4, max: 24, step: 1, value: 9, unit: " in" }],
      render({ d }) {
        const cx = 88;
        const cy = 84;
        const R = 72;
        const Ri = R * (1 - 1.5 / d);
        const share = 1 - (1 - 1.5 / d) ** 2;
        const ring = `<path d="M${cx - R},${cy} a${R},${R} 0 1,0 ${2 * R},0 a${R},${R} 0 1,0 ${-2 * R},0 Z M${r1(cx - Ri)},${cy} a${r1(Ri)},${r1(Ri)} 0 1,0 ${r1(2 * Ri)},0 a${r1(Ri)},${r1(Ri)} 0 1,0 ${r1(-2 * Ri)},0 Z" fill-rule="evenodd" class="fill-accent"/>`;
        let body = ring + circle(cx, cy, R, "ink");
        const barH = 136 * share;
        body += `<rect x="206" y="16" width="30" height="136" class="ink"/>`;
        body += `<rect x="206" y="${r1(152 - barH)}" width="30" height="${r1(barH)}" class="fill-accent solid"/>`;
        body += text(246, r1(156 - barH), `${Math.round(share * 100)}% crust`);
        const readout = `A ${d}-inch pie: ${Math.round(share * 100)}% of it lies within ¾ inch of the edge. Edge ${(PI * d).toFixed(1)} in; filling ${(PI * (d / 2) ** 2).toFixed(1)} square in.`;
        return { svg: svg(320, 168, readout, body), readout };
      },
    },

    buffon: {
      params: [{ name: "drops", label: "Dropped", min: 0, max: 5000, step: 1, value: 0, kind: "hidden" }],
      buttons: [
        { name: "drops", step: 10, label: "Drop 10" },
        { name: "drops", step: 100, label: "Drop 100" },
        { name: "drops", step: "reset", label: "Pick them up" },
      ],
      render({ drops }) {
        let a = 31415;
        const rand = () => {
          a = (a + 0x6d2b79f5) | 0;
          let t = Math.imul(a ^ (a >>> 15), 1 | a);
          t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
          return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
        const W = 320;
        const H = 180;
        const L = 36;
        let body = "";
        for (let yLine = 0; yLine <= H; yLine += L) body += line(0, yLine, W, yLine, "faint");
        let crossed = 0;
        const drawn = [];
        for (let i = 0; i < drops; i += 1) {
          const cx = rand() * W;
          const cy = rand() * H;
          const th = rand() * PI;
          const dx = (L / 2) * Math.cos(th);
          const dy = (L / 2) * Math.sin(th);
          const hit = Math.floor((cy - dy) / L) !== Math.floor((cy + dy) / L);
          if (hit) crossed += 1;
          if (i >= drops - 250) drawn.push(line(cx - dx, cy - dy, cx + dx, cy + dy, hit ? "accent" : "needle"));
        }
        body += drawn.join("");
        const readout = drops === 0
          ? "No needles yet. The lines are one needle-length apart."
          : `Dropped ${drops}. ${crossed} crossed a line. ${
              crossed ? `Estimate: 2 × ${drops} ÷ ${crossed} = ${((2 * drops) / crossed).toFixed(4)}.` : "None has crossed yet."
            }`;
        return { svg: svg(W, H, readout, body), readout };
      },
    },

    sectors: {
      params: [{ name: "n", label: "Slices", min: 4, max: 48, step: 2, value: 8 }],
      render({ n }) {
        const r = 58;
        const h = PI / n;
        const sx = r * Math.sin(h);
        const cy = r * Math.cos(h);
        const T = 34;
        const x0 = (320 - (n - 1) * sx) / 2;
        let body = `<rect x="${r1((320 - PI * r) / 2)}" y="${T}" width="${r1(PI * r)}" height="${r}" class="guide"/>`;
        for (let i = 0; i < n; i += 1) {
          const x = x0 + i * sx;
          const cls = i % 2 ? "slice-b" : "slice-a";
          body += i % 2 === 0
            ? `<path d="M${r1(x)},${T} L${r1(x - sx)},${r1(T + cy)} A${r},${r} 0 0,0 ${r1(x + sx)},${r1(T + cy)} Z" class="${cls}"/>`
            : `<path d="M${r1(x)},${r1(T + cy)} L${r1(x - sx)},${T} A${r},${r} 0 0,1 ${r1(x + sx)},${T} Z" class="${cls}"/>`;
        }
        body += text(160, 128, "π radii", "middle");
        const readout = `${n} slices, laid point to crust. The row is ${(n * Math.sin(h)).toFixed(4)} radii long; thinner slices bring it to π, and the shape to a rectangle.`;
        return { svg: svg(320, 136, readout, body), readout };
      },
    },

    squarecircle: {
      params: [{ name: "d", label: "Round pan", min: 4, max: 14, step: 0.5, value: 9, unit: " in" }],
      render({ d }) {
        const s = 10;
        const side = (d * s * Math.sqrt(PI)) / 2;
        let body = circle(160, 84, (d * s) / 2, "soft accent");
        body += `<rect x="${r1(160 - side / 2)}" y="${r1(84 - side / 2)}" width="${r1(side)}" height="${r1(side)}" class="ink"/>`;
        const area = PI * (d / 2) ** 2;
        const readout = `A ${d}-inch round pan holds ${area.toFixed(1)} square inches. The square that holds exactly as much is ${((d * Math.sqrt(PI)) / 2).toFixed(2)} inches on a side.`;
        return { svg: svg(320, 168, readout, body), readout };
      },
    },

    leibniz: {
      params: [{ name: "n", label: "Steps", min: 1, max: 200, step: 1, value: 20 }],
      render({ n }) {
        const y = (v) => 20 + ((4.1 - v) / 1.6) * 150;
        const x = (k) => 24 + ((k - 1) / Math.max(n - 1, 1)) * 280;
        const pts = [];
        let sum = 0;
        for (let k = 1; k <= n; k += 1) {
          sum += (k % 2 ? 1 : -1) / (2 * k - 1);
          pts.push([x(k), y(4 * sum)]);
        }
        let body = line(24, y(PI), 304, y(PI), "accent dashed") + text(308, y(PI) + 4, "π");
        body += polyline(pts, "ink");
        if (n <= 40) body += pts.map(([px, py]) => circle(px, py, 1.8, "dot")).join("");
        const value = 4 * sum;
        const readout = `After ${n} ${n === 1 ? "step" : "steps"}: ${value.toFixed(5)}. Off by ${Math.abs(value - PI).toFixed(5)}.`;
        return { svg: svg(320, 190, readout, body), readout };
      },
    },

    compound: {
      params: [
        {
          name: "k", label: "Paid", min: 0, max: 6, step: 1, value: 3,
          format: (k) => ["once a year", "twice a year", "quarterly", "monthly", "weekly", "daily", "hourly"][k],
        },
      ],
      render({ k }) {
        const counts = [1, 2, 4, 12, 52, 365, 8760];
        const names = ["once a year", "twice a year", "quarterly", "monthly", "weekly", "daily", "hourly"];
        const n = counts[k];
        const x = (t) => 30 + t * 270;
        const y = (v) => 170 - ((v - 1) / 1.8) * 150;
        const steps = [[x(0), y(1)]];
        const every = Math.max(1, Math.floor(n / 400));
        for (let j = every; j <= n; j += every) {
          const before = (1 + 1 / n) ** (j - every);
          const after = (1 + 1 / n) ** j;
          steps.push([x(j / n), y(before)], [x(j / n), y(after)]);
        }
        const smooth = [];
        for (let i = 0; i <= 100; i += 1) smooth.push([x(i / 100), y(Math.exp(i / 100))]);
        let body = line(30, y(Math.E), 300, y(Math.E), "faint") + text(304, y(Math.E) + 4, "e");
        body += polyline(smooth, "accent") + polyline(steps, "ink");
        const value = (1 + 1 / n) ** n;
        const readout = `Paid ${names[k]}: ${value.toFixed(5)}. Paid every instant: e = 2.71828.`;
        return { svg: svg(320, 180, readout, body), readout };
      },
    },

    rise: {
      params: [
        { name: "t", label: "Hours", min: 0, max: 24, step: 1, value: 12, unit: " h" },
        { name: "d", label: "Doubles every", min: 2, max: 8, step: 0.5, value: 4, unit: " h" },
      ],
      render({ t, d }) {
        const top = 24 / d;
        const x = (hours) => 34 + (hours / 24) * 266;
        const y = (doublings) => 170 - (doublings / top) * 150;
        let body = "";
        for (let g = 0; g <= Math.floor(top); g += 1) {
          body += line(34, y(g), 300, y(g), "faint");
          if (top <= 8 || g % 2 === 0) body += text(30, y(g) + 4, `×${grouped(2 ** g)}`, "end");
        }
        body += line(x(0), y(0), x(24), y(top), "accent thick");
        body += line(x(t), 170, x(t), y(t / d), "ink dashed") + circle(x(t), y(t / d), 3.5, "dot-accent");
        const factor = 2 ** (t / d);
        const rate = Math.LN2 / d;
        const readout = `After ${t} hours, doubling every ${d}: ${factor < 100 ? factor.toFixed(2) : grouped(factor)} times the start. Written with e, that is e to the ${rate.toFixed(3)} per hour.`;
        return { svg: svg(320, 180, readout, body), readout };
      },
    },
  };

  const clamp = (def, name, raw) => {
    const p = def.params.find((param) => param.name === name);
    if (!p) return raw;
    let v = Number(raw);
    if (!Number.isFinite(v)) v = p.value;
    v = Math.min(p.max, Math.max(p.min, v));
    v = p.min + Math.round((v - p.min) / p.step) * p.step;
    return Number(v.toFixed(6));
  };

  const read = (kind, get) => {
    const def = figures[kind];
    const values = {};
    for (const p of def.params) {
      const raw = get(p.name);
      values[p.name] = raw === null || raw === undefined || raw === "" ? p.value : clamp(def, p.name, raw);
    }
    return values;
  };

  const show = (p, v) => (p.format ? p.format(v) : `${v}${p.unit || ""}`);

  const stepValue = (def, name, step, values) => {
    const p = def.params.find((param) => param.name === name);
    if (step === "reset") return p.min;
    return clamp(def, name, values[name] + Number(step));
  };

  return { figures, read, clamp, show, stepValue, esc };
}

/* Runs in the browser. Wires every printed figure to the same kit. */
export function figureClient(kit) {
  document.querySelectorAll("figure[data-fig]").forEach((fig) => {
    const kind = fig.getAttribute("data-fig");
    const def = kit.figures[kind];
    const form = fig.querySelector("form");
    const stage = fig.querySelector(".fig-stage");
    const readout = fig.querySelector(".fig-readout");
    if (!def || !form || !stage || !readout) return;
    fig.classList.add("is-live");
    const current = () =>
      kit.read(kind, (name) => {
        const el = form.elements.namedItem(name);
        return el ? el.value : null;
      });
    const draw = (values) => {
      const out = def.render(values);
      stage.innerHTML = out.svg;
      readout.textContent = out.readout;
      for (const p of def.params) {
        const input = form.elements.namedItem(p.name);
        if (input) input.value = String(values[p.name]);
        const output = fig.querySelector(`output[for="${fig.id}-${p.name}"]`);
        if (output) output.textContent = kit.show(p, values[p.name]);
      }
      form.querySelectorAll("button[data-step]").forEach((button) => {
        button.value = String(kit.stepValue(def, button.name, button.getAttribute("data-step"), values));
      });
      const query = new URLSearchParams(location.search);
      for (const p of def.params) query.set(p.name, String(values[p.name]));
      history.replaceState(null, "", `${location.pathname}?${query}#${fig.id}`);
    };
    form.addEventListener("input", () => draw(current()));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = current();
      const button = event.submitter;
      if (button && button.name) values[button.name] = kit.clamp(def, button.name, button.value);
      draw(values);
    });
  });
}

const KIT = figureKit();

// esbuild may wrap functions in __name(); define it so serialized code runs.
const PRELUDE =
  'var __defProp = (t, p, d) => Object.defineProperty(t, p, d); var __name = (t, v) => __defProp(t, "name", { value: v, configurable: true });';

export const FIGURES_JS = `(() => {\n${PRELUDE}\n(${figureClient.toString()})((${figureKit.toString()})());\n})();\n`;

export function hasFigure(issue) {
  return Boolean(issue.figure && KIT.figures[issue.figure.kind]);
}

/* Print a figure. `searchParams` sets its controls; `still` drops them. */
export function figureHtml(issue, searchParams, { still = false } = {}) {
  if (!hasFigure(issue)) return "";
  const kind = issue.figure.kind;
  const def = KIT.figures[kind];
  const id = `fig-${issue.slug}`;
  const values = KIT.read(kind, (name) => (searchParams ? searchParams.get(name) : null));
  const out = def.render(values);
  const esc = KIT.esc;
  const inputs = def.params
    .map((p) =>
      p.kind === "hidden"
        ? `<input type="hidden" name="${p.name}" value="${values[p.name]}">`
        : `<div class="fig-control">
      <label for="${id}-${p.name}">${esc(p.label)}</label>
      <input type="range" id="${id}-${p.name}" name="${p.name}" min="${p.min}" max="${p.max}" step="${p.step}" value="${values[p.name]}">
      <output for="${id}-${p.name}">${esc(KIT.show(p, values[p.name]))}</output>
    </div>`
    )
    .join("\n    ");
  const buttons = (def.buttons || [])
    .map((b) => `<button type="submit" name="${b.name}" value="${KIT.stepValue(def, b.name, b.step, values)}" data-step="${b.step}">${esc(b.label)}</button>`)
    .join("");
  const draw = def.params.some((p) => p.kind !== "hidden") ? `<button type="submit" class="fig-draw">Draw</button>` : "";
  const controls = still
    ? ""
    : `<form class="fig-controls" method="get" action="#${id}">
    ${inputs}
    <div class="fig-buttons">${buttons}${draw}</div>
  </form>`;
  return `<figure class="fig" id="${id}" data-fig="${kind}">
  <div class="fig-stage">${out.svg}</div>
  <p class="fig-readout" aria-live="polite">${esc(out.readout)}</p>
  ${controls}
  <figcaption><span class="caps">Figure</span> ${esc(issue.figure.caption)}</figcaption>
</figure>`;
}
