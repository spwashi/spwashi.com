#!/usr/bin/env node
/**
 * Storybook-esque component fixture contract, without a component framework.
 *
 * The registry describes real, hand-authored specimens. This check verifies
 * that each fixture keeps a route, CSS owner, selector, and slot contract.
 */

import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { COMPONENT_FIXTURES } from '../public/js/kernel/component-fixtures.js';
import { REGION_ECOLOGY_FIXTURES } from '../public/js/kernel/region-ecology-fixtures.js';
import {
  DEVICE_REASONS,
  REGION_SEATS,
  SOCIAL_ASPECTS,
  VIEWPORT_ALIASES,
} from './lib/visual-capture-plan.mjs';

const PHONE_FAMILY = new Set(['phone', 'pocket', 'phablet']);
const DESKTOP_FAMILY = new Set(['desktop', 'broadsheet', 'laptop', 'wide']);

function isKnownLayoutScenario(scenario) {
  return Boolean(VIEWPORT_ALIASES[scenario] || DEVICE_REASONS[scenario]);
}

function layoutFamily(scenario) {
  const alias = VIEWPORT_ALIASES[scenario] || scenario;
  if (PHONE_FAMILY.has(scenario) || PHONE_FAMILY.has(alias)) return 'phone';
  if (DESKTOP_FAMILY.has(scenario) || DESKTOP_FAMILY.has(alias)) return 'desktop';
  return alias;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function routeToFile(route) {
  const pathname = route.split('#')[0].replace(/^\//, '');
  return path.join(ROOT, pathname, 'index.html');
}

async function fileText(filePath) {
  return readFile(filePath, 'utf8');
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function selectorNeedle(selector) {
  const parts = String(selector || '').trim().split(/\s+/);
  const terminal = parts.at(-1) || '';
  const match = /^([.#])([a-z0-9_-]+)$/i.exec(terminal);
  return match ? { marker: match[1], name: match[2] } : null;
}

function sourceHasSelector(source, selector) {
  const needle = selectorNeedle(selector);
  if (!needle) return false;
  return needle.marker === '#'
    ? source.includes(`id="${needle.name}"`)
    : source.includes(needle.name);
}

function sourceHasEcologySelector(source, selector) {
  const idMatch = String(selector || '').match(/^#([A-Za-z0-9_-]+)/);
  if (idMatch) return source.includes(`id="${idMatch[1]}"`);
  const clusterMatch = String(selector || '').match(/data-spw-cluster="([^"]+)"/);
  if (clusterMatch) return source.includes(`data-spw-cluster="${clusterMatch[1]}"`);
  return source.includes(selector);
}

export async function collectComponentContractReport() {
  const errors = [];
  const ids = new Set();

  for (const fixture of COMPONENT_FIXTURES) {
    if (ids.has(fixture.id)) errors.push(`${fixture.id}: duplicate fixture id`);
    ids.add(fixture.id);

    const routeFile = routeToFile(fixture.specimenRoute);
    const cssFile = path.join(ROOT, fixture.cssOwner);
    const snippetFile = path.join(ROOT, fixture.snippet);
    if (!(await exists(routeFile))) {
      errors.push(`${fixture.id}: missing specimen route ${fixture.specimenRoute}`);
      continue;
    }
    if (!(await exists(cssFile))) {
      errors.push(`${fixture.id}: missing CSS owner ${fixture.cssOwner}`);
      continue;
    }
    if (!(await exists(snippetFile))) {
      errors.push(`${fixture.id}: missing snippet ${fixture.snippet}`);
      continue;
    }

    const [routeText, cssText, snippetText] = await Promise.all([fileText(routeFile), fileText(cssFile), fileText(snippetFile)]);
    if (!selectorNeedle(fixture.selector)) {
      errors.push(`${fixture.id}: selector must end in a class or id selector`);
      continue;
    }
    if (!sourceHasSelector(routeText, fixture.selector)) errors.push(`${fixture.id}: specimen route lacks ${fixture.selector}`);
    const componentNeedle = selectorNeedle(fixture.selector);
    if (componentNeedle.marker === '.' && !cssText.includes(`.${componentNeedle.name}`)) {
      errors.push(`${fixture.id}: CSS owner lacks .${componentNeedle.name}`);
    }
    if (!sourceHasSelector(snippetText, `.${fixture.id}`) && !sourceHasSelector(snippetText, fixture.selector)) {
      errors.push(`${fixture.id}: snippet lacks component selector`);
    }
    if (fixture.captureFlows?.includes('region')) {
      if (!fixture.regionSelector) {
        errors.push(`${fixture.id}: region flow requires regionSelector`);
      } else if (!sourceHasSelector(routeText, fixture.regionSelector)) {
        errors.push(`${fixture.id}: specimen route lacks region ${fixture.regionSelector}`);
      }
    }
    if (!fixture.layoutScenarios.every((scenario) => isKnownLayoutScenario(scenario))) {
      errors.push(`${fixture.id}: layout scenarios must be named device-reasons or viewport aliases`);
    } else {
      const families = new Set(fixture.layoutScenarios.map(layoutFamily));
      if (!families.has('phone') || !families.has('desktop')) {
        errors.push(`${fixture.id}: layout scenarios must include a pocket/phone still and a broadsheet/desktop still`);
      }
    }
    if (fixture.socialAspects && !fixture.socialAspects.every((aspect) => Boolean(SOCIAL_ASPECTS[aspect]))) {
      errors.push(`${fixture.id}: socialAspects must be fit/square/portrait/story/landscape/og`);
    }

    for (const slot of fixture.requiredSlots) {
      if (!routeText.includes(`data-spw-slot=\"${slot}\"`)) {
        errors.push(`${fixture.id}: specimen route lacks ${slot} slot`);
      }
      if (!snippetText.includes(`data-spw-slot=\"${slot}\"`)) {
        errors.push(`${fixture.id}: snippet lacks ${slot} slot`);
      }
    }
  }

  for (const fixture of REGION_ECOLOGY_FIXTURES) {
    if (ids.has(fixture.id)) errors.push(`${fixture.id}: duplicate fixture id`);
    ids.add(fixture.id);
    if (!REGION_SEATS.includes(fixture.seat)) {
      errors.push(`${fixture.id}: seat must be one of ${REGION_SEATS.join(', ')}`);
    }
    const routeFile = routeToFile(fixture.specimenRoute);
    const cssFile = path.join(ROOT, fixture.cssOwner);
    if (!(await exists(routeFile))) {
      errors.push(`${fixture.id}: missing specimen route ${fixture.specimenRoute}`);
      continue;
    }
    if (!(await exists(cssFile))) {
      errors.push(`${fixture.id}: missing CSS owner ${fixture.cssOwner}`);
    }
    const routeText = await fileText(routeFile);
    if (!sourceHasEcologySelector(routeText, fixture.selector)) {
      errors.push(`${fixture.id}: specimen route lacks ${fixture.selector}`);
    }
    if (fixture.socialAspects && !fixture.socialAspects.every((aspect) => Boolean(SOCIAL_ASPECTS[aspect]))) {
      errors.push(`${fixture.id}: socialAspects must be fit/square/portrait/story/landscape/og`);
    }
    if (!fixture.layoutScenarios?.length) {
      errors.push(`${fixture.id}: ecology fixture needs layoutScenarios`);
    }
  }

  return {
    fixtures: COMPONENT_FIXTURES.length,
    ecology: REGION_ECOLOGY_FIXTURES.length,
    errors,
  };
}

export async function main() {
  const report = await collectComponentContractReport();
  if (report.errors.length) {
    report.errors.forEach((error) => console.error(`[component:check] ${error}`));
    process.exitCode = 1;
    return;
  }
  console.log(`[component:check] ${report.fixtures} fixtures + ${report.ecology} ecology seats passed`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
