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
    if (!fixture.layoutScenarios.every((scenario) => ['phone', 'desktop'].includes(scenario))) {
      errors.push(`${fixture.id}: layout scenarios must use phone and/or desktop`);
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

  return { fixtures: COMPONENT_FIXTURES.length, errors };
}

export async function main() {
  const report = await collectComponentContractReport();
  if (report.errors.length) {
    report.errors.forEach((error) => console.error(`[component:check] ${error}`));
    process.exitCode = 1;
    return;
  }
  console.log(`[component:check] ${report.fixtures} fixtures passed`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
