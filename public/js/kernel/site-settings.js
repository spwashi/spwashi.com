/**
 * Site settings public entry — profiles + engine only.
 *
 * Form/readout bindings live in site-settings-ui.js. They load when:
 *   - apply() finds a settings scope/form/trigger on the page, or
 *   - the settings-page catalog module mounts initSiteSettingsPage, or
 *   - a console caller touches a bind/init/recipe method on window.spwSettings.
 *
 * Keep this file free of a static UI import so CORE boot can apply datasets
 * without parsing the settings form module. The browser console object is
 * installed by the engine, which CORE actually mounts.
 */

export * from './site-settings-profiles.js';
export * from './site-settings-engine.js';
