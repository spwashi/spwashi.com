import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const jsRoot = path.join(root, 'public/js');
const cssRoot = path.join(root, 'public/css');

const jsMap = {
  kernel: [
    'spw-bus.js',
    'spw-core.js',
    'spw-runtime-environment.js',
    'spw-shared.js',
    'spw-dom-contracts.js',
    'spw-states.js',
    'site-settings.js',
    'spw-page-metadata.js',
    'spw-copy.js',
  ],
  semantic: [
    'spw-operators.js',
    'spw-lattice.js',
    'spw-projection.js',
    'spw-semantic-utils.js',
    'spw-component-semantics.js',
    'spw-pretext-physics.js',
    'spw-pretext-presets.js',
    'pretext-utils.js',
    'pretext-lab.js',
    'spw-cognitive-surface.js',
    'recipe-semantics.js',
    'spw-page-universe.js',
    'spw-smart.js',
  ],
  runtime: [
    'spw-gate.js',
    'spw-interaction-loop.js',
    'spw-visitation.js',
    'spw-navigation-spells.js',
    'spw-state-inspector.js',
    'spw-pwa-update-handler.js',
    'pwa-update-handler.js',
    'frame-navigator.js',
    'frame-metrics.js',
    'brace-gestures.js',
    'spw-brace-actions.js',
    'spw-brace-pivots.js',
    'spw-reactive-spine.js',
    'spw-spells.js',
    'spw-experiential.js',
    'spw-shell-disclosure.js',
    'spw-attention-architecture.js',
  ],
  interface: [
    'spw-contextual-ui.js',
    'spw-semantic-chrome.js',
    'spw-guide-badge.js',
    'spw-guide.js',
    'spw-haptics.js',
    'spw-local-memory-controls.js',
    'spw-local-notes.js',
    'spw-palette-resonance.js',
    'spw-accent-palette.js',
    'spw-canvas-accents.js',
    'spw-logo-runtime.js',
    'spw-personas.js',
    'spw-persona-selector.js',
    'spw-console.js',
    'spw-developmental-climate.js',
    'spw-discovery-notices.js',
    'spw-prompt-utils.js',
    'spw-topic-discovery.js',
  ],
  modules: [
    'spw-blog-interpreter.js',
    'spw-blog-specimens.js',
    'blog-interpreter.js',
    'blog-specimens.js',
    'spw-attn-register.js',
    'attn-register.js',
    'spw-seed-card.js',
    'seed-card.js',
    'spw-payment-card.js',
    'payment-card.js',
    'spw-services-configurator.js',
    'services-configurator.js',
    'rpg-wednesday.js',
    'rpg-wednesday-asset-atlas.js',
    'rpg-wednesday-character-lab.js',
    'rpg-wednesday-dom.js',
    'rpg-wednesday-shortcuts.js',
    'rpg-wednesday-state.js',
    'home-section-index.js',
    'design-experiments.js',
    'spw-profile-builder.js',
    'profile-builder.js',
    'spw-profile-tool.js',
    'spw-tool-budgeting.js',
    'care-intake.js',
    'boonhonk-mixer.js',
    'spw-math-diagrams.js',
    'electromagnetic-containers.js',
  ],
  media: [
    'spw-image-store.js',
    'spw-image-metaphysics.js',
    'spw-svg-filters.js',
  ],
};

const cssMap = {
  reset: ['spw-reset.css'],
  tokens: ['spw-tokens.css'],
  shell: ['spw-shell.css', 'spw-chrome.css'],
  typography: ['spw-typography.css', 'spw-typography-context.css', 'spw-typesetting.css'],
  grammar: ['spw-grammar.css'],
  components: ['spw-components.css'],
  systems: [
    'spw-substrate-ecology.css',
    'spw-surfaces.css',
    'svg-surfaces.css',
    'spw-svg-personas.css',
    'spw-pretext-physics.css',
  ],
  routes: [
    'home-surface.css',
    'contact-surface.css',
    'about-surface.css',
    'services-surface.css',
    'topics-surface.css',
    'website-surface.css',
    'design-surface.css',
    'plans-surface.css',
    'craft-surface.css',
    'blog-surface.css',
    'settings-surface.css',
    'recipes-surface.css',
    'play-surface.css',
    'rpg-wednesday-surface.css',
    'tools-budgeting-surface.css',
    'design-experiments.css',
    'care-intake.css',
    'services-configurator.css',
    'payment-card.css',
    'seed-card.css',
    'profile-card.css',
    'boonhonk-mixer.css',
  ],
  handles: ['cognitive-handles.css', 'spw-handles.css', 'phase-controls.css', 'spw-logo.css'],
  effects: [
    'spw-material.css',
    'enhancements.css',
    'grain-texture.css',
    'spw-electromagnetic-container.css',
    'spw-cinematic.css',
    'spw-developmental-climate.css',
    'spw-enrichment.css',
    'spw-demos.css',
    'spw-wonder.css',
    'spw-metaphysical-paper.css',
    'spw-debug.css',
  ],
  ornament: ['spw-whimsy.css', 'spw-canvas-accents.css', 'spw-ornament.css'],
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function moveIfPresent(base, dir, file) {
  const from = path.join(base, file);
  if (!fs.existsSync(from)) return null;
  const toDir = path.join(base, dir);
  ensureDir(toDir);
  const to = path.join(toDir, file);
  fs.renameSync(from, to);
  return to;
}

function rewriteJsImports(content) {
  return content
    .replace(/(from\s*['"])\.\/([^'"]+\.js)(['"])/g, '$1/public/js/$2$3')
    .replace(/(import\(\s*['"])\.\/([^'"]+\.js)(['"]\s*\))/g, '$1/public/js/$2$3')
    .replace(/(export\s+\*\s+from\s*['"])\.\/([^'"]+\.js)(['"])/g, '$1/public/js/$2$3')
    .replace(/(export\s+\{\s*default\s*\}\s+from\s*['"])\.\/([^'"]+\.js)(['"])/g, '$1/public/js/$2$3');
}

for (const [dir, files] of Object.entries(jsMap)) {
  for (const file of files) {
    const moved = moveIfPresent(jsRoot, dir, file);
    if (!moved) continue;

    const rewritten = rewriteJsImports(fs.readFileSync(moved, 'utf8'));
    fs.writeFileSync(moved, rewritten);

    let stub = `export * from './${dir}/${file}';\n`;
    if (file === 'spw-bus.js') {
      stub += `export { default } from './${dir}/${file}';\n`;
    }
    fs.writeFileSync(path.join(jsRoot, file), stub);
  }
}

for (const [dir, files] of Object.entries(cssMap)) {
  for (const file of files) {
    const moved = moveIfPresent(cssRoot, dir, file);
    if (!moved) continue;
    fs.writeFileSync(path.join(cssRoot, file), `@import url('/public/css/${dir}/${file}');\n`);
  }
}
