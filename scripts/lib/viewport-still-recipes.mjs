/**
 * Viewport still recipes — the still a person would take, not the region's
 * document box. Tooling-only; do not ship these through the public runtime
 * catalog. Region ecology fixtures remain the seat registry.
 *
 * clipSpace is always the device frame after prepare + scroll.
 */

export const VIEWPORT_STILL_RECIPES = Object.freeze([
  Object.freeze({
    id: 'home-opening',
    fixtureId: 'home-hook',
    label: 'Home opening',
    specimenRoute: '/',
    selector: '#home-frame',
    prepare: Object.freeze({
      close: Object.freeze(['.home-field-notes', '.home-depth-disclosure']),
    }),
    layoutScenarios: Object.freeze(['pocket', 'fold', 'broadsheet']),
    wonder: 'Identity leads. The working view is a local instrument, not the subject.',
    captureValue: 'One pocket frame: person, then the working view, then the first motifs.',
    sourceFiles: Object.freeze([
      'index.html',
      'public/css/routes/surfaces/home.css',
      'public/css/shell/chrome/adaptive.css',
      'public/css/shell/chrome/section-context.css',
      'public/css/handles/operators/state-semantics.css',
    ]),
  }),
  Object.freeze({
    id: 'home-reasons',
    fixtureId: 'home-hook',
    label: 'Home reasons',
    specimenRoute: '/',
    selector: '#home-reason-why',
    prepare: Object.freeze({
      close: Object.freeze(['.home-field-notes']),
    }),
    layoutScenarios: Object.freeze(['pocket', 'fold', 'broadsheet']),
    wonder: 'Three charges may share a fold, but they must not read as one unlabeled stack.',
    captureValue: 'Why / readers / takeaway as the visible subjects after the opening.',
    sourceFiles: Object.freeze([
      'index.html',
      'public/css/routes/surfaces/home.css',
    ]),
  }),
  Object.freeze({
    id: 'home-entrance-closed',
    fixtureId: 'home-hook',
    label: 'Home entrance closed',
    specimenRoute: '/',
    selector: '#choose-your-entrance',
    prepare: Object.freeze({
      close: Object.freeze(['.home-depth-disclosure']),
    }),
    layoutScenarios: Object.freeze(['pocket', 'fold', 'broadsheet']),
    wonder: 'Pick your door is the subject. Encyclopedic atlas stays deferred.',
    captureValue: 'Closed disclosure: role hooks visible, deeper atlas not in the first frame.',
    sourceFiles: Object.freeze([
      'index.html',
      'public/css/routes/surfaces/home.css',
    ]),
  }),
  Object.freeze({
    id: 'home-entrance-open',
    fixtureId: 'home-hook',
    label: 'Home entrance open',
    specimenRoute: '/',
    selector: '#choose-your-entrance',
    prepare: Object.freeze({
      open: Object.freeze(['.home-depth-disclosure']),
    }),
    layoutScenarios: Object.freeze(['pocket', 'fold', 'broadsheet']),
    wonder: 'Opening the atlas must change the still. If the first frame is unchanged, the disclosure is below the fold.',
    captureValue: 'Open disclosure: resonance and image atlas become the next subject, not a surprise dump.',
    sourceFiles: Object.freeze([
      'index.html',
      'public/css/routes/surfaces/home.css',
    ]),
  }),
]);

export const VIEWPORT_STILL_CHECKS = Object.freeze([
  Object.freeze({
    id: 'home-entry-loops-pin',
    fixtureId: 'home-hook',
    label: 'Home entry loops pin',
    specimenRoute: '/#entry-loops',
    selector: '#entry-loops',
    attention: Object.freeze({ section: 'entry-loops' }),
    layoutScenarios: Object.freeze(['pocket', 'fold', 'broadsheet']),
    wonder: 'A deep link pins the authored loops, not the nested hook.',
    captureValue: 'Attention architecture: fragment + pin outrank the viewport guess.',
    sourceFiles: Object.freeze([
      'index.html',
      'public/js/runtime/attention/section-handle.js',
      'public/js/runtime/attention/capture-pins.js',
    ]),
  }),
  Object.freeze({
    id: 'about-opening-dark',
    fixtureId: 'about-hook',
    label: 'About opening dark',
    specimenRoute: '/about/',
    selector: '#about-frame',
    conditions: Object.freeze({ colorMode: 'dark' }),
    layoutScenarios: Object.freeze(['pocket', 'fold', 'broadsheet']),
    wonder: 'Explicit dark about palette, not a comma-joined @media selector.',
    captureValue: 'Theming check: data-spw-color-mode=dark on the about surface.',
    sourceFiles: Object.freeze([
      'about/index.html',
      'public/css/routes/surfaces/about.css',
    ]),
  }),
  Object.freeze({
    id: 'topics-opening-dark',
    fixtureId: 'topics-register',
    label: 'Topics opening dark',
    specimenRoute: '/topics/',
    selector: '#topics-register',
    conditions: Object.freeze({ colorMode: 'dark' }),
    layoutScenarios: Object.freeze(['pocket', 'fold', 'broadsheet']),
    wonder: 'Explicit dark topics palette stays on the register, not a dropped selector.',
    captureValue: 'Theming check: data-spw-color-mode=dark on the topics surface.',
    sourceFiles: Object.freeze([
      'topics/index.html',
      'public/css/routes/surfaces/topics.css',
    ]),
  }),
  Object.freeze({
    id: 'home-opening-reduced',
    fixtureId: 'home-hook',
    label: 'Home opening reduced motion',
    specimenRoute: '/',
    selector: '#home-frame',
    conditions: Object.freeze({ reducedMotion: 'reduce' }),
    prepare: Object.freeze({
      close: Object.freeze(['.home-field-notes', '.home-depth-disclosure']),
    }),
    layoutScenarios: Object.freeze(['pocket']),
    wonder: 'Reduced motion still has a decisive opening subject without relying on animation peaks.',
    captureValue: 'Environment check: prefers-reduced-motion reduce on the home opening.',
    sourceFiles: Object.freeze([
      'index.html',
      'public/css/routes/surfaces/home.css',
    ]),
  }),
]);

export function getViewportStillRecipe(id) {
  return VIEWPORT_STILL_RECIPES.find((recipe) => recipe.id === id)
    || VIEWPORT_STILL_CHECKS.find((recipe) => recipe.id === id)
    || null;
}
