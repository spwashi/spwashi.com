// Stable JavaScript consumer seam for the typed component fixture registry.
// Promote a small, data-oriented abstraction to public/ts/ first; keep browser
// modules importing this facade so the rest of the runtime stays plain JS.
export * from '../typed/component-fixtures.js';
