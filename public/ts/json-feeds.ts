import type {
  JsonValidationIssue,
  JsonValidationResult,
  MediaItem,
  MediaPublishingConfig,
  PromoWonderCard,
  PromoWonderFeed,
  PromoWonderPair,
} from '../../types/json-feeds';

export type {
  JsonValidationIssue,
  JsonValidationResult,
  LocaleCode,
  LocalizationMeta,
  MediaItem,
  MediaPublishingConfig,
  PromoPresentation,
  PromotionDetails,
  PromotionKind,
  PromotionPlaybook,
  PromotionPlaybookEntry,
  PromoWonderCard,
  PromoWonderFeed,
  PromoWonderPair,
} from '../../types/json-feeds';

import { DAY_KEYS } from './feed-utils.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function pushIssue(issues: JsonValidationIssue[], path: string, message: string): void {
  issues.push({ path, message });
}

function validateMediaItem(value: unknown, path: string, issues: JsonValidationIssue[]): value is MediaItem {
  if (!isRecord(value)) {
    pushIssue(issues, path, 'expected an object');
    return false;
  }

  const title = asString(value.title);
  const summary = asString(value.summary);
  const href = asString(value.href);

  if (!title) pushIssue(issues, `${path}.title`, 'title is required');
  if (!summary) pushIssue(issues, `${path}.summary`, 'summary is required');
  if (!href) pushIssue(issues, `${path}.href`, 'href is required');

  return Boolean(title && summary && href);
}

function validatePromoWonderCard(
  value: unknown,
  path: string,
  issues: JsonValidationIssue[],
  role: 'promo' | 'wonder',
): value is PromoWonderCard {
  if (!isRecord(value)) {
    pushIssue(issues, path, 'expected an object');
    return false;
  }

  const title = asString(value.title);
  const summary = asString(value.summary);
  const href = asString(value.href);

  if (!title) pushIssue(issues, `${path}.title`, `${role} title is required`);
  if (!summary) pushIssue(issues, `${path}.summary`, `${role} summary is required`);
  if (!href) pushIssue(issues, `${path}.href`, `${role} href is required`);

  if (value.promotion != null) {
    if (!isRecord(value.promotion)) {
      pushIssue(issues, `${path}.promotion`, 'promotion must be an object');
    } else if (Array.isArray(value.promotion.handles)) {
      const invalidHandle = value.promotion.handles.find((handle) => typeof handle !== 'string');
      if (invalidHandle != null) {
        pushIssue(issues, `${path}.promotion.handles`, 'handles must be strings');
      }
    } else if (value.promotion.handles != null) {
      pushIssue(issues, `${path}.promotion.handles`, 'handles must be an array');
    }
  }

  return Boolean(title && summary && href);
}

function validatePromoWonderPair(value: unknown, path: string, issues: JsonValidationIssue[]): value is PromoWonderPair {
  if (!isRecord(value)) {
    pushIssue(issues, path, 'expected an object');
    return false;
  }

  const promoOk = validatePromoWonderCard(value.promo, `${path}.promo`, issues, 'promo');
  const wonderOk = validatePromoWonderCard(value.wonder, `${path}.wonder`, issues, 'wonder');
  return promoOk && wonderOk;
}

export function validatePromoWonderFeed(value: unknown): JsonValidationResult<PromoWonderFeed> {
  const issues: JsonValidationIssue[] = [];

  if (!isRecord(value)) {
    pushIssue(issues, '$', 'feed must be an object');
    return { ok: false, value: null, issues };
  }

  if (!Array.isArray(value.daily) || !value.daily.length) {
    pushIssue(issues, 'daily', 'daily must be a non-empty array');
  } else {
    value.daily.forEach((entry, index) => {
      validatePromoWonderPair(entry, `daily[${index}]`, issues);
    });
  }

  if (!Array.isArray(value.weekly) || !value.weekly.length) {
    pushIssue(issues, 'weekly', 'weekly must be a non-empty array');
  } else {
    value.weekly.forEach((entry, index) => {
      validatePromoWonderPair(entry, `weekly[${index}]`, issues);
    });
  }

  if (value.localization != null && !isRecord(value.localization)) {
    pushIssue(issues, 'localization', 'localization must be an object');
  }

  if (value.promotionPlaybook != null && !isRecord(value.promotionPlaybook)) {
    pushIssue(issues, 'promotionPlaybook', 'promotionPlaybook must be an object');
  }

  return {
    ok: issues.length === 0,
    value: issues.length === 0 ? (value as PromoWonderFeed) : null,
    issues,
  };
}

export function validateMediaPublishingConfig(value: unknown): JsonValidationResult<MediaPublishingConfig> {
  const issues: JsonValidationIssue[] = [];

  if (!isRecord(value)) {
    pushIssue(issues, '$', 'config must be an object');
    return { ok: false, value: null, issues };
  }

  if (value.weekly != null) {
    validateMediaItem(value.weekly, 'weekly', issues);
  } else {
    pushIssue(issues, 'weekly', 'weekly focus is required');
  }

  if (value.daily != null) {
    if (!isRecord(value.daily)) {
      pushIssue(issues, 'daily', 'daily must be an object keyed by weekday');
    } else {
      for (const day of DAY_KEYS) {
        if (value.daily[day] != null) {
          validateMediaItem(value.daily[day], `daily.${day}`, issues);
        }
      }
    }
  } else {
    pushIssue(issues, 'daily', 'daily focus map is required');
  }

  for (const collectionKey of ['featuredPages', 'featuredTopics', 'featuredComponents'] as const) {
    const collection = value[collectionKey];
    if (collection == null) continue;
    if (!Array.isArray(collection)) {
      pushIssue(issues, collectionKey, `${collectionKey} must be an array`);
      continue;
    }
    collection.forEach((entry, index) => {
      validateMediaItem(entry, `${collectionKey}[${index}]`, issues);
    });
  }

  return {
    ok: issues.length === 0,
    value: issues.length === 0 ? (value as MediaPublishingConfig) : null,
    issues,
  };
}

export function parseJsonValue(text: string, label = 'json'): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[${label}] invalid JSON: ${message}`);
  }
}

export function formatJsonIssues(issues: JsonValidationIssue[]): string[] {
  return issues.map((issue) => `${issue.path}: ${issue.message}`);
}