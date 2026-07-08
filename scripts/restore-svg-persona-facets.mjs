#!/usr/bin/env node
/**
 * Restore data-spw-svg-persona facets + FACET-safe copy from session diffs.
 * Geometry-first titles/descs/aria; personas live on hosts.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;

function patch(path, edits) {
  const full = `${ROOT}/${path}`;
  let html = readFileSync(full, 'utf8');
  const before = html;
  for (const [from, to] of edits) {
    if (!html.includes(from)) {
      console.warn(`[skip] ${path}: missing fragment: ${from.slice(0, 60).replace(/\n/g, ' ')}...`);
      continue;
    }
    html = html.replace(from, to);
  }
  if (html !== before) {
    writeFileSync(full, html);
    console.log(`patched: ${path}`);
    return true;
  }
  console.log(`unchanged: ${path}`);
  return false;
}

function addPersonaToFigure(html, persona, figureMatch = '<figure class="spw-svg-figure"') {
  if (html.includes('data-spw-svg-persona=')) return html;
  return html.replace(
    figureMatch,
    `<figure class="spw-svg-figure" data-spw-svg-persona="${persona}"`,
  );
}

function addPersonaToNthFigure(html, persona, n = 0) {
  let i = 0;
  return html.replace(/<figure class="spw-svg-figure"([^>]*)>/g, (m, rest) => {
    if (rest.includes('data-spw-svg-persona=')) return m;
    if (i++ !== n) return m;
    return `<figure class="spw-svg-figure" data-spw-svg-persona="${persona}"${rest}>`;
  });
}

const files = [];

// about
files.push(['about/index.html', [
  [`data-spw-svg-pointer-state="active"
            >`, `data-spw-svg-pointer-state="active"
                data-spw-svg-persona="reader artist storyteller rendering-model"
            >`],
  ['bone = skeleton', 'bone = reusable skeleton'],
  ['boon = arrival', 'boon = generous arrival'],
  ['bane = constraint', 'bane = useful constraint'],
  ['bonk = experiment', 'bonk = experiment beat'],
  ['honk = discovery', 'honk = discovery signal'],
]]);

// about/website
files.push(['about/website/index.html', [
  ['data-spw-svg-companion="rail"\n                    data-spw-role="illustration"', `data-spw-svg-companion="rail"
                    data-spw-svg-persona="visitor editor maintainer rendering-model"
                    data-spw-role="illustration"`],
  ['<text class="spw-svg-note" x="126" y="165" text-anchor="middle"># frame</text>', '<text class="spw-svg-note" x="126" y="165" text-anchor="middle">visitor frame</text>'],
  ['<text class="spw-svg-note" x="248" y="109" text-anchor="middle">? probe</text>', '<text class="spw-svg-note" x="248" y="109" text-anchor="middle">editor probe</text>'],
  ['<text class="spw-svg-note" x="360" y="165" text-anchor="middle">@ action</text>', '<text class="spw-svg-note" x="360" y="165" text-anchor="middle">action seam</text>'],
  ['<text class="spw-svg-note" x="472" y="221" text-anchor="middle">$ meta</text>', '<text class="spw-svg-note" x="472" y="221" text-anchor="middle">state mirror</text>'],
  ['<text class="spw-svg-note" x="594" y="165" text-anchor="middle">&gt; surface</text>', '<text class="spw-svg-note" x="594" y="165" text-anchor="middle">route pivot</text>'],
  ['orient / frame', 'visitor frame'],
  ['inspect / probe', 'editor probe'],
  ['invoke / action', 'action seam'],
  ['reflect / meta', 'state mirror'],
  ['pivot / surface', 'route pivot'],
]]);

// blog
files.push(['blog/index.html', [
  ['<svg class="blog-hero-svg" viewBox="0 0 800 220" aria-label="Fiber weave diagram: self/world plates, charged nodes, signal path"', '<svg class="blog-hero-svg" data-spw-svg-persona="reader writer editor rendering-model" viewBox="0 0 800 220" aria-label="Fiber weave diagram: self/world plates, charged nodes, signal path"'],
  ['text-anchor="middle">meaning</text>', 'text-anchor="middle">meaning / draft</text>'],
]]);

// care
files.push(['care/index.html', [
  ['<figure class="spw-svg-figure" data-spw-svg-host="care-model" data-spw-svg-kind="addressable-diagram" data-spw-svg-scale="wide">', '<figure class="spw-svg-figure" data-spw-svg-host="care-model" data-spw-svg-kind="addressable-diagram" data-spw-svg-scale="wide" data-spw-svg-persona="client helper coordinator reviewer">'],
  ['<text class="spw-svg-note" x="72" y="200">what hurts?</text>', '<text class="spw-svg-note" x="72" y="200">client signal</text>'],
  ['<text class="spw-svg-note" x="214" y="199">shared words</text>', '<text class="spw-svg-note" x="214" y="199">shared language</text>'],
  ['<text class="spw-svg-note" x="374" y="199">hold state</text>', '<text class="spw-svg-note" x="374" y="199">private record</text>'],
  ['<text class="spw-svg-note" x="708" y="199">choose room</text>', '<text class="spw-svg-note" x="708" y="199">choose audience</text>'],
  ['<figure class="spw-svg-figure" data-spw-svg-host="social-care-routing" data-spw-svg-kind="addressable-diagram" data-spw-svg-scale="wide">', '<figure class="spw-svg-figure" data-spw-svg-host="social-care-routing" data-spw-svg-kind="addressable-diagram" data-spw-svg-scale="wide" data-spw-svg-persona="client friend facilitator publisher">'],
  ['<text class="spw-svg-note" x="730" y="98">friend / circle</text>', '<text class="spw-svg-note" x="730" y="98">friend / group</text>'],
  ['<text class="spw-svg-note" x="724" y="238">video / thread</text>', '<text class="spw-svg-note" x="724" y="238">video / post</text>'],
  ['The platform can start the thought. The card decides what is safe to share.', 'The platform can start the thought; the card decides each audience boundary.'],
]]);

// recipes index
files.push(['recipes/index.html', [
  ['<figure class="spw-svg-figure" aria-labelledby="composition-wheel-title">', '<figure class="spw-svg-figure" aria-labelledby="composition-wheel-title" data-spw-svg-persona="cook host writer rendering-model">'],
  ['<figure class="spw-svg-figure" aria-labelledby="blogger-handoff-title">', '<figure class="spw-svg-figure" aria-labelledby="blogger-handoff-title" data-spw-svg-persona="cook photographer writer archivist">'],
  ['<figure class="spw-svg-figure" aria-labelledby="synesthesia-map-title">', '<figure class="spw-svg-figure" aria-labelledby="synesthesia-map-title" data-spw-svg-persona="cook writer designer rendering-model">'],
]]);

// recipes subpages
files.push(['recipes/fermentation/index.html', [
  ['<figure class="spw-svg-figure" aria-label="Eventual consistency convergence diagram">', '<figure class="spw-svg-figure" data-spw-svg-persona="cook systems-thinker writer rendering-model" aria-label="Eventual consistency convergence diagram">'],
]]);
files.push(['recipes/mise-en-place/index.html', [
  ['<figure class="spw-svg-figure" aria-label="Compilation pipeline as mise en place">', '<figure class="spw-svg-figure" data-spw-svg-persona="cook planner compiler rendering-model" aria-label="Compilation pipeline as mise en place">'],
]]);
files.push(['recipes/reduction/index.html', [
  ['<figure class="spw-svg-figure" aria-label="Abstraction funnel: implementation to interface">', '<figure class="spw-svg-figure" data-spw-svg-persona="cook editor architect rendering-model" aria-label="Abstraction funnel: implementation to interface">'],
]]);

// topics index + load symphony
const learningPosture = [
  ['class="spw-svg-surface"\n                    viewBox="0 0 720 280"', `class="spw-svg-surface"
                    data-spw-svg-persona="learner maintainer maker explorer"
                    viewBox="0 0 720 280"`],
  ['study = model', 'study = learner model'],
  ['stabilize = baseline', 'stabilize = maintainer baseline'],
  ['build = craft', 'build = maker craft'],
  ['play = probe', 'play = explorer probe'],
];
files.push(['topics/index.html', learningPosture]);
files.push(['design/experiments/load-symphony/a/index.html', learningPosture]);
files.push(['design/experiments/load-symphony/b/index.html', learningPosture]);

// site-design
files.push(['topics/site-design/index.html', [
  ['<figure class="spw-svg-figure" data-spw-accent="resonance"', '<figure class="spw-svg-figure" data-spw-svg-persona="reader designer editor rendering-model" data-spw-accent="resonance"'],
]]);

// math hub
files.push(['topics/math/index.html', [
  ['<figure class="spw-svg-figure">\n                    <svg viewBox="0 0 700 300"', '<figure class="spw-svg-figure" data-spw-svg-persona="learner mapper software-neighbor rendering-model">\n                    <svg viewBox="0 0 700 300"'],
]]);

// calculus specifics
files.push(['topics/math/calculus/index.html', [
  ['<figure class="spw-svg-figure">\n                        <svg viewBox="0 0 720 400"', '<figure class="spw-svg-figure" data-spw-svg-persona="learner teacher engineer rendering-model">\n                        <svg viewBox="0 0 720 400"'],
  ['<figure class="spw-svg-figure">\n                        <svg viewBox="0 0 720 380" role="img" aria-labelledby="integration-by-parts-title', '<figure class="spw-svg-figure" data-spw-svg-persona="learner teacher proof-reviewer rendering-model">\n                        <svg viewBox="0 0 720 380" role="img" aria-labelledby="integration-by-parts-title'],
  ['<figure class="spw-svg-figure">\n                        <svg viewBox="0 0 760 420"', '<figure class="spw-svg-figure" data-spw-svg-persona="learner surface-analyst engineer rendering-model">\n                        <svg viewBox="0 0 760 420"'],
]]);

// craft svg
files.push(['topics/craft/svg/index.html', [
  ['data-spw-svg-companion="rail"\n                        data-spw-operator="frame">', `data-spw-svg-companion="rail"
                        data-spw-svg-persona="author illustrator designer rendering-model"
                        data-spw-operator="frame">`],
  ['motif kit → publishing surfaces', 'motif kit → persona-ready marks'],
  ['one family, many roles', 'one family, many handoffs'],
  ['data-spw-svg-motion="static"\n                            data-spw-operator="frame">', `data-spw-svg-motion="static"
                            data-spw-svg-persona="reader illustrator rendering-model"
                            data-spw-operator="frame">`],
  ['data-spw-svg-motion="static"\n                            data-spw-operator="stream">', `data-spw-svg-motion="static"
                            data-spw-svg-persona="reader illustrator rendering-model"
                            data-spw-operator="stream">`],
  ['data-spw-svg-motion="static"\n                            data-spw-operator="object">', `data-spw-svg-motion="static"
                            data-spw-svg-persona="reader illustrator rendering-model"
                            data-spw-operator="object">`],
]]);

// browser diagrams
files.push(['topics/software/browser/index.html', [
  ['<svg class="diagram" viewBox="0 0 640 196"', '<svg class="diagram" data-spw-svg-persona="learner frontend-engineer performance-reviewer rendering-model" viewBox="0 0 640 196"'],
  ['<svg class="diagram" viewBox="0 0 640 140"', '<svg class="diagram" data-spw-svg-persona="learner frontend-engineer performance-reviewer rendering-model" viewBox="0 0 640 140"'],
  ['<svg class="diagram" viewBox="0 0 540 170"', '<svg class="diagram" data-spw-svg-persona="learner security-reviewer implementer rendering-model" viewBox="0 0 540 170"'],
  ['<!-- Type Lattice SVG -->\n                <svg class="diagram" viewBox="0 0 560 200"', '<!-- Type Lattice SVG -->\n                <svg class="diagram" data-spw-svg-persona="learner library-author reviewer rendering-model" viewBox="0 0 560 200"'],
]]);

// design css lab
files.push(['design/experiments/css/index.html', [
  ['<figure class="design-rule-map spw-svg-figure" data-spw-svg-host="css-rule-map"', '<figure class="design-rule-map spw-svg-figure" data-spw-svg-host="css-rule-map" data-spw-svg-persona="designer learner maintainer rendering-model"'],
]]);

// software topics default persona
for (const p of [
  'topics/software/parsers/index.html',
  'topics/software/renderers/index.html',
  'topics/software/geometry/index.html',
  'topics/software/compression/index.html',
  'topics/software/schedulers/index.html',
]) {
  files.push([p, [
    ['<figure class="spw-svg-figure">', '<figure class="spw-svg-figure" data-spw-svg-persona="learner implementer reviewer rendering-model">'],
  ]]);
}

// math subroutes default persona
for (const p of [
  'topics/math/category-theory/index.html',
  'topics/math/combinatorics/index.html',
  'topics/math/complexity/index.html',
  'topics/math/differential-equations/index.html',
  'topics/math/field-theory/index.html',
  'topics/math/numerical-methods/index.html',
  'topics/math/number-theory/index.html',
  'topics/math/symmetry/index.html',
  'topics/math/topology/index.html',
  'topics/math/trigonometry/index.html',
  'topics/math/vector-calculus/index.html',
]) {
  files.push([p, [
    ['<figure class="spw-svg-figure">', '<figure class="spw-svg-figure" data-spw-svg-persona="learner teacher engineer rendering-model">'],
  ]]);
}

// craft fragments - 3 figures
const fragmentsPath = 'topics/craft/fragments/index.html';
try {
  let fr = readFileSync(`${ROOT}/${fragmentsPath}`, 'utf8');
  let n = 0;
  fr = fr.replace(/<figure class="spw-svg-figure"([^>]*)>/g, (m, rest) => {
    if (rest.includes('data-spw-svg-persona=')) return m;
    const personas = ['author reader illustrator rendering-model', 'author reader illustrator rendering-model', 'author reader illustrator rendering-model'];
    const persona = personas[n++] || 'author reader illustrator rendering-model';
    return `<figure class="spw-svg-figure" data-spw-svg-persona="${persona}"${rest}>`;
  });
  writeFileSync(`${ROOT}/${fragmentsPath}`, fr);
  console.log(`patched: ${fragmentsPath}`);
} catch (e) {
  console.warn(`skip fragments: ${e.message}`);
}

let changed = 0;
for (const [path, edits] of files) {
  if (patch(path, edits)) changed += 1;
}

console.log(`[restore-svg-persona-facets] changed=${changed} files=${files.length}`);