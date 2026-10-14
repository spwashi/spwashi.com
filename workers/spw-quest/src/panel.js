// One quest step drawn as a storyboard panel: the scene as a small label, the
// speaker named, and the line in a balloon whose shape follows the bubble kind.
// The shape is decoration; the kind is also written beside the speaker.
import { escapeHtml } from "../../lib/shell.js";
import { BALLOON_WORDS, LINE_LIMIT, readLine, renderReading } from "./reader.js";
import { STEPS } from "./steps.js";

/** A jagged rim for the burst balloon: spikes on the outer edge, valleys on the balloon's own edge. */
function burstRim(depth = 11, across = 12, down = 4) {
  const inset = () => `calc(100% - ${depth}px)`;
  const points = [];
  for (let i = 0; i <= across; i += 1) points.push([`${((i / across) * 100).toFixed(2)}%`, i % 2 ? `${depth}px` : "0"]);
  for (let j = 1; j <= down; j += 1) points.push([j % 2 ? inset() : "100%", `${((j / down) * 100).toFixed(2)}%`]);
  for (let k = 1; k <= across; k += 1) points.push([`${((1 - k / across) * 100).toFixed(2)}%`, k % 2 ? inset() : "100%"]);
  for (let j = 1; j < down; j += 1) points.push([j % 2 ? `${depth}px` : "0", `${((1 - j / down) * 100).toFixed(2)}%`]);
  return `polygon(${points.map(([x, y]) => `${x} ${y}`).join(", ")})`;
}

/** The panel's look, on the guide and on /read. The balloon edge keeps 3:1 against the field; controls keep 44px; the line wraps inside its balloon. */
export const PANEL_CSS = `:root { --ink-line: rgba(14, 18, 20, .72); --caption: hsl(42 62% 87%); --burst: rgba(27, 92, 93, .2); }
    @media (prefers-color-scheme: dark) { :root { --ink-line: rgba(228, 235, 232, .6); --caption: hsl(38 22% 16%); --burst: rgba(86, 210, 210, .22); } }
    .step { position: relative; padding: .85rem 1rem 1rem; border: 1px solid var(--edge); border-radius: 4px; background: var(--surface); box-shadow: var(--shadow); scroll-margin-top: 4.5rem; }
    .step:target { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent), var(--shadow); animation: settle 900ms ease-out 1; }
    @keyframes settle { from { box-shadow: 0 0 0 7px var(--accent-soft), 0 0 0 1px var(--accent), var(--shadow); } to { box-shadow: 0 0 0 1px var(--accent), var(--shadow); } }
    .panel-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: .25rem .8rem; margin: 0 0 .35rem; }
    .step :is(h1, h2) { display: flex; align-items: baseline; gap: .55rem; margin: 0; font-size: 1.45rem; }
    .step h1 { font-size: clamp(1.8rem, 6.4vw, 2.3rem); }
    .step .n { min-width: 2.2ch; color: var(--muted); font: 600 .9rem/1 var(--mono); font-variant-numeric: tabular-nums; text-align: right; text-decoration: none; }
    .step a.n:hover, .step a.n:focus-visible, .step:target a.n { color: var(--accent); }
    .scene { margin: 0; padding: .05rem .5rem; border: 1px solid var(--ink-line); background: var(--caption); font: .85rem/1.5 var(--mono); }
    form.line { margin: 0; }
    form.line label.speaker { display: flex; flex-wrap: wrap; align-items: baseline; gap: .1rem .45rem; margin: .4rem 0 0; color: var(--fg); font: 600 .92rem/1.3 var(--mono); }
    .speaker .kind { color: var(--muted); font: 400 .88rem/1.3 var(--font); }
    .balloon { position: relative; z-index: 0; margin: 1rem 0 0; padding: 0 1.1rem; border: 2px solid var(--ink-line); border-radius: 1.6rem; background: var(--field); }
    .balloon:focus-within { outline: 2px solid var(--accent); outline-offset: 3px; }
    form.line .balloon textarea[name="line"] { display: block; width: 100%; min-height: 48px; max-height: 12rem; margin: 0; padding: .7rem 0; border: 0; border-radius: 0; background: transparent; color: var(--fg); font: 1rem/1.45 var(--mono); resize: none; overflow-y: auto; field-sizing: content; }
    form.line .balloon textarea[name="line"]:focus-visible { outline: none; }
    .balloon:is([data-bubble="statement"], [data-bubble="question"])::before { content: ""; position: absolute; left: 1.4rem; top: -14px; width: 18px; height: 14px; background: var(--ink-line); clip-path: polygon(0 100%, 100% 100%, 12% 0); }
    .balloon:is([data-bubble="statement"], [data-bubble="question"])::after { content: ""; position: absolute; left: calc(1.4rem + 3px); top: -9px; width: 12.5px; height: 11px; background: var(--field); clip-path: polygon(0 100%, 100% 100%, 12% 0); }
    .balloon[data-bubble="question"] { border-style: dashed; }
    .balloon[data-bubble="thought"] { margin-top: 1.75rem; border-radius: 2.6rem; }
    .balloon[data-bubble="thought"]::before { content: ""; position: absolute; left: 1.3rem; top: -15px; width: 13px; height: 10px; border: 2px solid var(--ink-line); border-radius: 50%; background: var(--field); }
    .balloon[data-bubble="thought"]::after { content: ""; position: absolute; left: .7rem; top: -26px; width: 8px; height: 7px; border: 2px solid var(--ink-line); border-radius: 50%; background: var(--field); }
    .balloon[data-bubble="burst"] { margin: 1.35rem 0 .7rem; border-color: transparent; border-radius: 0; background: transparent; }
    .balloon[data-bubble="burst"]::before { content: ""; position: absolute; inset: -11px; z-index: -1; background: var(--burst); clip-path: ${burstRim()}; }
    .balloon[data-bubble="burst"]::after { content: ""; position: absolute; inset: -2px; z-index: -1; border: 3px solid var(--ink-line); border-radius: 3px; background: var(--field); }
    .balloon[data-bubble="caption"] { border-radius: 2px; background: var(--caption); }
    .balloon[data-bubble="nameplate"] { padding: 0 1.8rem; border: 4px double var(--ink-line); border-radius: 4px; background: radial-gradient(circle at .8rem 50%, var(--ink-line) 2.5px, transparent 3px), radial-gradient(circle at calc(100% - .8rem) 50%, var(--ink-line) 2.5px, transparent 3px), var(--field); }
    form.line .balloon[data-bubble="nameplate"] textarea[name="line"] { text-align: center; }
    .line-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .2rem 1rem; margin: .75rem 0 0; }
    .line-actions button { min-width: 5.5rem; margin: 0; }
    .then { margin: 0; color: var(--muted); font-size: .92rem; }
    .then a { display: inline-flex; align-items: center; min-height: 44px; padding: 0 .15rem; font-family: var(--mono); }
    .nuance { display: grid; grid-template-columns: max-content minmax(0, 1fr); margin: .8rem 0 0; padding: 0; border-top: 1px solid var(--line); list-style: none; }
    .nuance li { display: grid; grid-column: 1 / -1; grid-template-columns: subgrid; gap: .1rem .9rem; align-items: baseline; margin: 0; padding: .1rem .35rem; border-bottom: 1px solid var(--line); }
    .nuance li[aria-current] { background: var(--accent-soft); }
    .nuance .try { display: inline-flex; align-items: center; min-height: 44px; color: var(--muted); font: 1rem/1.25 var(--mono); text-decoration: none; overflow-wrap: anywhere; }
    .nuance mark { background: none; color: var(--accent); font-weight: 700; }
    .nuance .said a { font-weight: 600; }
    @media (max-width: 30rem) { .nuance li { column-gap: .6rem; } .nuance .said { font-size: .94rem; } }
    .reading { margin: .8rem 0 0; padding: .7rem .85rem .75rem; border-left: 3px solid var(--edge); border-radius: 0 calc(var(--radius) * .8) calc(var(--radius) * .8) 0; background: var(--field); }
    .reading:has(.check[data-state="pass"]) { border-left-color: var(--accent); }
    .reading:has(.check[data-state="fail"]) { border-left-color: var(--warn); }
    .check { margin: 0; }
    .check strong { margin-right: .15rem; }
    .check[data-state="pass"] strong { color: var(--accent); }
    .check[data-state="fail"] strong { color: var(--warn); }
    .parts { list-style: none; padding: 0; margin: .55rem 0 0; display: grid; gap: .4rem; }
    .parts li { display: grid; grid-template-columns: 2.6rem minmax(0, 1fr); gap: .5rem; align-items: baseline; margin: 0; }
    .mark { color: var(--accent); font: 600 1.05rem/1.35 var(--mono); white-space: nowrap; }
    .parts a { font-weight: 600; }
    .parts .held { color: var(--accent); font-family: var(--mono); }
    .reading .note { margin: .5rem 0 0; }
    .edges { display: flex; justify-content: space-between; gap: .5rem; margin: .9rem -.4rem -.35rem; padding-top: .55rem; border-top: 1px solid var(--line); font: .86rem/1.2 var(--mono); }
    .edges a { display: inline-flex; align-items: center; gap: .4rem; min-height: 44px; padding: 0 .4rem; border-radius: 4px; text-decoration: none; }
    .edges a[rel="next"] { margin-left: auto; }
    .edges .n { color: var(--muted); font-variant-numeric: tabular-nums; }
    .step a:not(.n):hover, .step a:focus-visible { background: var(--accent-soft); }
    .step a { transition: background-color 140ms ease, color 140ms ease; }
    @media (prefers-reduced-motion: reduce) { .step:target { animation: none; } .step a { transition: none; } }`;

/** The panels on either side, as links: the guide can be walked one edge at a time. */
function edges(index) {
  const near = (i, rel) => {
    const step = STEPS[i];
    if (!step) return "";
    const label = `<span class="n">${i + 1}</span> ${escapeHtml(step.id)}`;
    return `<a href="#${escapeHtml(step.id)}" rel="${rel}">${rel === "prev" ? `← ${label}` : `${label} →`}</a>`;
  };
  return `
    <nav class="edges" aria-label="Panels">${near(index - 1, "prev")}${near(index + 1, "next")}</nav>`;
}

/** The lines a panel compares, one row each: only the part that changes is marked, so the rows scan as a difference. */
function nuances(step, current) {
  const lines = [step.try, ...step.then];
  const shortest = Math.min(...lines.map((l) => l.length));
  let pre = 0;
  while (pre < shortest && lines.every((l) => l[pre] === lines[0][pre])) pre += 1;
  let suf = 0;
  while (suf < shortest - pre && lines.every((l) => l[l.length - 1 - suf] === lines[0][lines[0].length - 1 - suf])) suf += 1;
  if (!pre && !suf) return null;
  const rows = lines.map((line) => {
    const mid = line.slice(pre, line.length - suf);
    const shown = mid.length === line.length ? escapeHtml(line) : `${escapeHtml(line.slice(0, pre))}<mark>${escapeHtml(mid)}</mark>${escapeHtml(line.slice(line.length - suf))}`;
    const reading = readLine(step.id, line);
    const op = reading.operators[0];
    const said = op ? `${op.name ? `<a href="/#op-${escapeHtml(op.name)}">${escapeHtml(op.name)}</a> ` : ""}${escapeHtml(op.reads)}` : escapeHtml(reading.says);
    return `<li${line === current ? ' aria-current="true"' : ""}><a class="try" href="/read?step=${encodeURIComponent(step.id)}&amp;line=${encodeURIComponent(line)}" data-then="${escapeHtml(step.id)}"><code>${shown}</code></a><span class="said">${said}</span></li>`;
  });
  return `
    <ul class="nuance" aria-label="${escapeHtml(lines.join(", "))}">
      ${rows.join("\n      ")}
    </ul>`;
}

/** Rows a line needs at phone width, so a balloon wraps its whole line before any script runs. */
const rowsFor = (line) => Math.min(5, Math.max(1, Math.ceil(String(line).length / 26)));

/** One panel: the line in a balloon inside a GET form to /read, and the worker's reading of that line. */
export function stepSurface(step, { index, line = step.try, heading = "h2" }) {
  const home = heading === "h1" ? "/learn" : "";
  const id = escapeHtml(step.id);
  const terminal = step.check === "commands_pass";
  const reading = readLine(step.id, line);
  const compared = step.then ? nuances(step, line) : null;
  const then = compared || !step.then ? [] : step.then.map((t) => `<a href="/read?step=${encodeURIComponent(step.id)}&amp;line=${encodeURIComponent(t)}" data-then="${id}">${escapeHtml(t)}</a>`);
  return `<section class="step" id="${id}" aria-labelledby="${id}-title">
    <div class="panel-head">
      <${heading} id="${id}-title"><a class="n" href="${home}#${id}">${index + 1}</a> ${id}</${heading}>
      <p class="scene"><span class="sr-only">Scene: </span>${escapeHtml(step.scene)}</p>
    </div>
    <form class="line" id="form-${id}" method="get" action="/read">
      <input type="hidden" name="step" value="${id}">
      <label class="speaker" for="line-${id}"><span class="who">${escapeHtml(step.speaker)}</span> <span class="kind">${escapeHtml(BALLOON_WORDS[reading.balloon] || reading.balloon)}</span><span class="sr-only"> balloon, ${terminal ? "the commands" : "your line"}</span></label>
      <div class="balloon" data-bubble="${escapeHtml(reading.balloon)}">
        <textarea id="line-${id}" name="line" rows="${rowsFor(line)}" maxlength="${LINE_LIMIT}" spellcheck="false" autocomplete="off" autocapitalize="none" autocorrect="off" enterkeyhint="go" aria-describedby="check-${id}">${escapeHtml(line)}</textarea>
      </div>
      <div class="line-actions">
        <button type="submit">Read</button>
        ${then.length ? `<p class="then">Then try ${then.join(" and ")}.</p>` : ""}
      </div>
    </form>
    <div class="reading" id="reading-${id}">${renderReading(reading)}</div>${compared || ""}${home ? "" : edges(index)}
  </section>`;
}
