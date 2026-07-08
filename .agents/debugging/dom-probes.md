# DOM probes for agentic debugging

Console-pasteable probes for state-dependent layout problems. Each one answers a
question the instrumentation attributes cannot: *which rule*, *which sheet*,
*when*, *what changed*. Validated 2026-07-07 root-causing the 416px root squeeze
(typography-packing.css measure clamp matching `html[data-spw-packing-state]`).

## Quick element position / constraint check

```js
const el = document.documentElement; // or any element
const cs = getComputedStyle(el);
({ w: cs.width, maxW: cs.maxWidth, maxIS: cs.maxInlineSize, rect: el.getBoundingClientRect(),
   anims: el.getAnimations({ subtree: false }).map(a => a.animationName || a.constructor.name) })
```

Finished animations with `fill: both` hold keyframe values that appear in
computed style with no rule in the cascade — always check `getAnimations()`.

## Which rule sets a property on an element (full cascade scan)

Walks `@import` chains (`rule.styleSheet`) and CSS nesting. Two traps this
avoids: imported sheets are invisible to a flat `document.styleSheets` rule
walk, and a style rule with nested child rules still carries its own
declarations (do not `continue` after recursing).

```js
const PROP = 'max-width'; const target = document.documentElement;
const hits = [];
const scan = (rules, href) => { for (const rule of rules) { try {
  if (rule.styleSheet) { try { scan(rule.styleSheet.cssRules, rule.styleSheet.href); } catch {} continue; }
  if (rule.selectorText && rule.style) {
    const v = rule.style.getPropertyValue(PROP);
    if (v) { let m = false; try { m = target.matches(rule.selectorText); } catch {}
      if (m) hits.push({ sheet: href, sel: rule.selectorText, v }); } }
  if (rule.cssRules) scan(rule.cssRules, href);
} catch {} } };
for (const s of document.styleSheets) { try { scan(s.cssRules, s.href || 'inline'); } catch {} }
hits
```

## Owner bisection when the scan finds nothing

Toggle sheets and watch the computed value; recurse into the winner's imports.
(`sheet.disabled = true` works on top-level sheets; imported sheets are
unreliable — prefer the scan above once the owning top-level sheet is known.)

```js
const before = () => getComputedStyle(document.documentElement).maxWidth;
for (const s of document.styleSheets) { const b = before(); s.disabled = true;
  if (before() !== b) console.log('owner:', s.href); s.disabled = false; }
```

## Root altitude-leak audit (fractal attribute hygiene)

Finds selectors that match `html`/`body` without naming them — component
vocabulary leaking to root altitude. Anything applying box or animation
properties here is a container bug per the `rhythm.altitude_rule` in
`data-spw-attribute-governance.spw`.

```js
const leaks = new Map();
const scan = (rules, href) => { for (const rule of rules) { try {
  if (rule.styleSheet) { try { scan(rule.styleSheet.cssRules, rule.styleSheet.href); } catch {} continue; }
  if (rule.selectorText && rule.style && !/(^|[^a-z-])(html|:root)/i.test(rule.selectorText)) {
    let m = false; try { m = document.documentElement.matches(rule.selectorText) || document.body.matches(rule.selectorText); } catch {}
    if (m) leaks.set(rule.selectorText, { sheet: href, props: [...rule.style].filter(p => !p.startsWith('--')) }); }
  if (rule.cssRules) scan(rule.cssRules, href);
} catch {} } };
for (const s of document.styleSheets) { try { scan(s.cssRules, s.href || 'inline'); } catch {} }
[...leaks.entries()].filter(([, v]) => v.props.length)
```

## State-dependent effect chains (attribute write → layout consequence)

Register the *timing* of a structural change and the attribute writes around it:

```js
const t0 = performance.now(); const log = [];
new MutationObserver(muts => muts.forEach(m => log.push({
  t: Math.round(performance.now() - t0), attr: m.attributeName,
  v: document.documentElement.getAttribute(m.attributeName),
  w: Math.round(document.documentElement.getBoundingClientRect().width),
}))).observe(document.documentElement, { attributes: true });
new ResizeObserver(() => log.push({ t: Math.round(performance.now() - t0), RESIZE: document.documentElement.getBoundingClientRect().width }))
  .observe(document.documentElement);
window.__chain = log; // inspect after the effect fires
```

Cross-reference with the boot's own clock: `performance.getEntriesByType('mark')`
(`spw:module:<name>:mount-end` timestamps identify which module's write landed
just before the resize).

## Cache honesty

`location.reload()` does not revalidate `@import`-ed CSS. Before concluding a
CSS fix "didn't work": `await fetch(path, { cache: 'reload' })` for each edited
file, then reload, then re-probe.
