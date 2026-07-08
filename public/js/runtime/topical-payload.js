/**
 * topical-payload.js
 * ---------------------------------------------------------------------------
 * Portable topical payloads: topics, lore roles, scene handles, prompt hosts,
 * and active scene context — serializable to Spw and JSON for LM handoff.
 */

import { bus } from '/public/js/kernel/bus.js';
import { writeDatasetValue } from '/public/js/kernel/dom-contracts.js';
import { collapseText as normalizeText } from '/public/js/kernel/text-normalization.js';

const TOPIC_SELECTOR = '.spw-topic, [data-spw-topic]';
const LORE_SELECTOR = '[data-spw-lore-role]';
const HANDLE_SELECTOR = [
  '[data-spw-scene-interpret]',
  '[data-spw-prompt-host]',
  '.spw-scene-bed[data-spw-scene-posture]',
].join(', ');
const EXPRESSION_SELECTOR = '[data-spw-semantic-expression]';
const PROMPT_CHIP_SELECTOR = 'a.operator-chip[href*="spw_prompt"]';

let initialized = false;
let lastRefreshAt = 0;

function escapeSpwString(value = '') {
  return normalizeText(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function describePath(element) {
  if (!(element instanceof HTMLElement)) return '';
  if (element.id) return `#${element.id}`;
  const anatomy = element.dataset.spwAnatomy ? `[${element.dataset.spwAnatomy}]` : '';
  return `${element.localName}${anatomy}`;
}

function readElementLabel(element) {
  if (!(element instanceof HTMLElement)) return '';
  return normalizeText(
    element.getAttribute('aria-label')
    || element.querySelector('h1, h2, h3, .frame-sigil, strong')?.textContent
    || element.dataset.spwPromptTitle
    || element.id
    || ''
  );
}

function collectTopics(root = document) {
  const index = window.spwTopics?.index?.();
  if (index instanceof Map) {
    return [...index.entries()].map(([text, entries]) => ({
      text,
      count: entries.length,
      operators: [...new Set(entries.map((entry) => entry.operator).filter(Boolean))],
      sections: [...new Set(entries.map((entry) => entry.section).filter(Boolean))],
      semanticFamilies: [...new Set(entries.map((entry) => entry.semanticFamily).filter(Boolean))],
    })).slice(0, 24);
  }

  const map = new Map();
  root.querySelectorAll(TOPIC_SELECTOR).forEach((element) => {
    const text = normalizeText(element.dataset.spwTopic || element.textContent).toLowerCase();
    if (!text) return;
    map.set(text, (map.get(text) || 0) + 1);
  });
  return [...map.entries()].map(([text, count]) => ({ text, count })).slice(0, 24);
}

function collectLoreFrames(root = document) {
  return [...root.querySelectorAll(LORE_SELECTOR)]
    .filter((element) => element instanceof HTMLElement)
    .slice(0, 12)
    .map((element) => ({
      id: element.id || '',
      role: element.dataset.spwLoreRole || '',
      seed: element.dataset.spwSeed || '',
      wonder: element.dataset.spwWonder || '',
      context: element.dataset.spwContext || '',
      promptability: element.dataset.spwPromptability || '',
      path: describePath(element),
      label: readElementLabel(element),
    }));
}

function resolveHandleKind(element) {
  if (element.dataset.spwSceneInterpret) return 'scene-interpret';
  if (element.dataset.spwPromptHost !== undefined) return 'prompt-host';
  if (element.matches('.spw-scene-bed[data-spw-scene-posture]')) return 'scene-bed';
  return 'handle';
}

function buildHandleRecord(element) {
  const frame = element.closest('.site-frame');
  return {
    id: element.id || frame?.id || '',
    kind: resolveHandleKind(element),
    interpret: element.dataset.spwSceneInterpret || '',
    promptTitle: element.dataset.spwPromptTitle || '',
    promptTeaser: element.dataset.spwPromptTeaser || '',
    seed: element.dataset.spwSeed || frame?.dataset?.spwSeed || '',
    posture: element.dataset.spwScenePosture || '',
    wonder: element.dataset.spwWonder || frame?.dataset?.spwWonder || '',
    context: element.dataset.spwContext || frame?.dataset?.spwContext || '',
    loreRole: element.dataset.spwLoreRole || frame?.dataset?.spwLoreRole || '',
    semanticExpression: element.dataset.spwSemanticExpression || frame?.dataset?.spwSemanticExpression || '',
    contextRelevance: element.dataset.spwContextRelevance || frame?.dataset?.spwContextRelevance || '',
    sceneState: element.dataset.spwSceneState || '',
    path: describePath(element),
    label: readElementLabel(element),
    frameId: frame?.id || '',
  };
}

function collectHandles(root = document) {
  const seen = new Set();
  const handles = [];

  root.querySelectorAll(HANDLE_SELECTOR).forEach((element) => {
    if (!(element instanceof HTMLElement)) return;
    const key = element.id || describePath(element);
    if (seen.has(key)) return;
    seen.add(key);
    handles.push(buildHandleRecord(element));
  });

  return handles.slice(0, 16);
}

function collectPromptChips(root = document) {
  return [...root.querySelectorAll(PROMPT_CHIP_SELECTOR)]
    .filter((element) => element instanceof HTMLElement)
    .slice(0, 12)
    .map((element) => {
      let host = '';
      let target = '';
      let generator = '';
      let focus = '';
      try {
        const url = new URL(element.href, window.location.origin);
        host = url.searchParams.get('spw_prompt_host') || '';
        target = url.searchParams.get('spw_prompt_target') || '';
        generator = url.searchParams.get('spw_prompt_generator') || '';
        focus = url.searchParams.get('spw_prompt_focus') || '';
      } catch {
        // ignore malformed href
      }
      return {
        label: normalizeText(element.textContent),
        href: element.getAttribute('href') || '',
        host,
        target,
        generator,
        focus,
        operator: element.dataset.spwOperator || '',
      };
    });
}

function collectExpressions(root = document) {
  return [...root.querySelectorAll(EXPRESSION_SELECTOR)]
    .filter((element) => element instanceof HTMLElement)
    .slice(0, 12)
    .map((element) => ({
      expression: element.dataset.spwSemanticExpression || '',
      path: describePath(element),
      frameId: element.closest('.site-frame')?.id || '',
      label: readElementLabel(element),
    }));
}

function collectActiveScene() {
  const keyEvents = window.__SPW_KEY_EVENTS__?.snapshot?.() || null;
  return keyEvents?.scene?.active || null;
}

export function collectTopicalPayload(root = document) {
  const body = root.body;
  const html = root.documentElement;

  return {
    route: window.location.pathname || '/',
    hash: window.location.hash || '',
    surface: body?.dataset?.spwSurface || 'site',
    pageFamily: body?.dataset?.spwPageFamily || '',
    topics: collectTopics(root),
    lore: collectLoreFrames(root),
    handles: collectHandles(root),
    promptChips: collectPromptChips(root),
    expressions: collectExpressions(root),
    activeScene: collectActiveScene(),
    sceneInteraction: window.__SPW_SCENE_INTERACTION__?.snapshot?.() || null,
    medium: window.__SPW_INTERACTIVE_MEDIUM__?.snapshot?.() || null,
    sceneDepth: Number.parseInt(html.dataset.spwSceneDepth || '', 10) || 0,
    universe: window.__spwPageUniverse ? {
      surface: window.__spwPageUniverse.surface,
      operators: window.__spwPageUniverse.operators,
      gestureVocabulary: window.__spwPageUniverse.gestureVocabulary,
    } : null,
    collectedAt: Date.now(),
  };
}

export function serializeTopicalPayloadToSpw(payload = collectTopicalPayload()) {
  const lines = ['topical_payload = .{'];
  lines.push(`  route = "${payload.route || '/'}"`);
  if (payload.surface) lines.push(`  surface = "${payload.surface}"`);

  if (payload.topics?.length) {
    lines.push('  topics = #[');
    payload.topics.forEach((topic) => {
      lines.push(`    .{ text="${escapeSpwString(topic.text)}" count=${topic.count} }`);
    });
    lines.push('  ][reg=set]');
  }

  if (payload.lore?.length) {
    lines.push('  lore = #[');
    payload.lore.forEach((entry) => {
      lines.push(`    .{ role="${escapeSpwString(entry.role)}" id="${escapeSpwString(entry.id)}" seed="${escapeSpwString(entry.seed)}" label="${escapeSpwString(entry.label)}" }`);
    });
    lines.push('  ][reg=set]');
  }

  if (payload.handles?.length) {
    lines.push('  handles = #[');
    payload.handles.forEach((handle) => {
      const interpret = handle.interpret ? ` interpret="${escapeSpwString(handle.interpret)}"` : '';
      const posture = handle.posture ? ` posture="${escapeSpwString(handle.posture)}"` : '';
      const prompt = handle.promptTitle ? ` prompt="${escapeSpwString(handle.promptTitle)}"` : '';
      lines.push(`    .{ kind="${escapeSpwString(handle.kind)}" id="${escapeSpwString(handle.id)}"${interpret}${posture}${prompt} label="${escapeSpwString(handle.label)}" }`);
    });
    lines.push('  ][reg=set]');
  }

  if (payload.promptChips?.length) {
    lines.push('  image_handles = #[');
    payload.promptChips.forEach((chip) => {
      lines.push(`    .{ label="${escapeSpwString(chip.label)}" host="${escapeSpwString(chip.host)}" target="${escapeSpwString(chip.target)}" generator="${escapeSpwString(chip.generator)}" focus="${escapeSpwString(chip.focus)}" }`);
    });
    lines.push('  ][reg=set]');
  }

  if (payload.expressions?.length) {
    lines.push('  expressions = #[');
    payload.expressions.forEach((entry) => {
      lines.push(`    .{ expression="${escapeSpwString(entry.expression)}" frame="${escapeSpwString(entry.frameId)}" }`);
    });
    lines.push('  ][reg=set]');
  }

  if (payload.sceneInteraction?.beds?.length) {
    lines.push('  scene_state = #[');
    payload.sceneInteraction.beds.forEach((bed) => {
      lines.push(`    .{ bed="${escapeSpwString(bed.bedId)}" mode="${escapeSpwString(bed.mode)}" lane="${escapeSpwString(bed.focusLane)}" lens="${escapeSpwString(bed.imageLens)}" }`);
    });
    lines.push('  ][reg=set]');
  }

  if (payload.medium?.register) {
    lines.push('  interactive_medium = .{');
    lines.push(`    register = "${escapeSpwString(payload.medium.register)}"`);
    if (payload.medium.posture) lines.push(`    posture = "${escapeSpwString(payload.medium.posture)}"`);
    if (payload.medium.intensity) lines.push(`    intensity = ${payload.medium.intensity}`);
    if (payload.medium.viewportTier) lines.push(`    viewport_tier = "${escapeSpwString(payload.medium.viewportTier)}"`);
    if (payload.medium.pointerMode) lines.push(`    pointer_mode = "${escapeSpwString(payload.medium.pointerMode)}"`);
    lines.push('  }');
  }

  if (payload.activeScene) {
    const scene = payload.activeScene;
    lines.push('  active_scene = .{');
    lines.push(`    id = "${escapeSpwString(scene.id || '')}"`);
    if (scene.posture) lines.push(`    posture = "${escapeSpwString(scene.posture)}"`);
    if (scene.promptTitle) lines.push(`    prompt = "${escapeSpwString(scene.promptTitle)}"`);
    if (scene.wonder) lines.push(`    wonder = "${escapeSpwString(scene.wonder)}"`);
    lines.push(`    depth = ${payload.sceneDepth || 0}`);
    lines.push('  }');
  }

  lines.push('}');
  return lines.join('\n');
}

function publishApi() {
  const api = {
    snapshot: () => collectTopicalPayload(document),
    serialize: () => serializeTopicalPayloadToSpw(collectTopicalPayload(document)),
    refresh: () => {
      lastRefreshAt = Date.now();
      writeDatasetValue(document.documentElement, 'spwTopicalPayloadReady', 'true', {
        source: 'topical-payload',
        reason: 'refresh',
      });
      return collectTopicalPayload(document);
    },
  };

  window.__SPW_TOPICAL_PAYLOAD__ = api;
  window.spwTopicalPayload = api;

  writeDatasetValue(document.documentElement, 'spwTopicalPayloadReady', 'true', {
    source: 'topical-payload',
    reason: 'api-ready',
  });
}

export function initTopicalPayload(root = document) {
  if (initialized) return () => {};
  initialized = true;

  publishApi();

  const refresh = () => {
    lastRefreshAt = Date.now();
    bus.emit('topical:refreshed', { at: lastRefreshAt });
  };

  const offs = [
    bus.on('scene:enter', refresh),
    bus.on('scene:exit', refresh),
    bus.on('topic:selected', refresh),
    bus.on('prompt:serialized', refresh),
  ];

  root.addEventListener('spw:scene-enter', refresh);
  root.addEventListener('spw:scene-exit', refresh);
  root.addEventListener('spw:interactive-medium-ready', refresh);
  root.addEventListener('spw:scene-lane-focus', refresh);

  return () => {
    initialized = false;
    offs.forEach((off) => off?.());
    root.removeEventListener('spw:scene-enter', refresh);
    root.removeEventListener('spw:scene-exit', refresh);
    root.removeEventListener('spw:interactive-medium-ready', refresh);
    root.removeEventListener('spw:scene-lane-focus', refresh);
    writeDatasetValue(document.documentElement, 'spwTopicalPayloadReady', null, {
      source: 'topical-payload',
      reason: 'cleanup',
    });
    delete window.__SPW_TOPICAL_PAYLOAD__;
    delete window.spwTopicalPayload;
  };
}

export const spwModule = {
  mount: initTopicalPayload,
};