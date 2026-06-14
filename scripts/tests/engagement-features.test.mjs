import assert from 'node:assert/strict';
import test from 'node:test';

import { clampIndex, getWeekIndex } from '../../public/js/typed/feed-utils.js';
import {
  buildDismissKey,
  buildVisibleNotices,
  getDateKeys,
  getRuntimeRewardPolicy,
  normalizeNotice,
  resolveNoticePresentation,
  selectScheduleItems,
  slugify,
  shouldSuppressNotice,
} from '../../public/js/interface/discovery-notices.js';
import {
  feedLocale,
  pickDaily,
  pickWeekly,
} from '../../public/js/typed/promo-wonder-cycle.js';

const noticeFeed = {
  sourceLocale: 'en',
  daily: [
    {
      promo: {
        label: 'Daily promo',
        title: 'Help the next release land',
        summary: 'Releases are scheduled for the 13th and 26th of each month.',
        href: '/services/#support',
        cta: 'Open support',
        why: 'A direct contribution keeps the monthly cadence steady.',
      },
    },
    {
      promo: {
        label: 'Daily promo',
        title: 'Keep the release rhythm steady',
        summary: 'Development costs are around $250 per month.',
        href: '/now/',
        cta: 'Review funding',
      },
    },
  ],
  weekly: [
    {
      promo: {
        label: 'Weekly promo',
        title: 'Keep the release rhythm steady',
        summary: 'Development costs are around $250 per month.',
        href: '/now/',
        cta: 'Review funding',
        why: 'One steady contribution helps keep releases on the 13th and 26th.',
      },
    },
    {
      promo: {
        label: 'Weekly promo',
        title: 'Support the next release',
        summary: 'Direct support keeps the public cadence open.',
        href: '/services/#support',
        cta: 'Open support',
      },
    },
  ],
};

const promoFeed = {
  sourceLocale: '  fr ',
  daily: [
    {
      promo: {
        title: 'Monday promo',
        summary: 'First daily option.',
        href: '/alpha/',
      },
      wonder: {
        title: 'Monday wonder',
        summary: 'First daily wonder.',
        href: '/wonder-alpha/',
      },
    },
    {
      promo: {
        title: 'Tuesday promo',
        summary: 'Second daily option.',
        href: '/beta/',
      },
      wonder: {
        title: 'Tuesday wonder',
        summary: 'Second daily wonder.',
        href: '/wonder-beta/',
      },
    },
  ],
  weekly: [
    {
      promo: {
        title: 'Week one promo',
        summary: 'First weekly option.',
        href: '/week-one/',
      },
      wonder: {
        title: 'Week one wonder',
        summary: 'First weekly wonder.',
        href: '/wonder-week-one/',
      },
    },
    {
      promo: {
        title: 'Week two promo',
        summary: 'Second weekly option.',
        href: '/week-two/',
      },
      wonder: {
        title: 'Week two wonder',
        summary: 'Second weekly wonder.',
        href: '/wonder-week-two/',
      },
    },
  ],
};

const date = new Date('2026-04-13T12:00:00-05:00');

test('discovery notice selection stays deterministic', () => {
  const keys = getDateKeys(date);
  const selected = selectScheduleItems(noticeFeed, date);
  const weeklyIndex = clampIndex(getWeekIndex(date), noticeFeed.weekly.length);

  assert.equal(keys.isoDay, '2026-04-13');
  assert.equal(selected.length, 2);
  assert.equal(selected[0].cadence, 'daily');
  assert.equal(selected[0].label, 'monday promo');
  assert.equal(selected[0].source.title, 'Keep the release rhythm steady');
  assert.equal(selected[1].cadence, 'weekly');
  assert.equal(selected[1].scheduleKey, keys.isoWeek);
  assert.equal(selected[1].source.title, noticeFeed.weekly[weeklyIndex].promo.title);
});

test('discovery notices keep dismiss keys and suppression rules stable', () => {
  const normalized = normalizeNotice(
    {
      title: 'Help the next release land',
      summary: 'Releases are scheduled for the 13th and 26th of each month.',
      href: '/services/#support',
      cta: 'Open support',
      why: 'A direct contribution keeps the monthly cadence steady.',
    },
    'daily',
    '2026-04-13',
    1,
    'en',
  );

  assert.ok(normalized);
  assert.equal(normalized.why, 'A direct contribution keeps the monthly cadence steady.');
  assert.equal(normalized.dismissKey, buildDismissKey('daily', normalized, '2026-04-13', 1));
  assert.equal(slugify('  Help the next release land  '), 'help-the-next-release-land');
  assert.equal(shouldSuppressNotice(normalized, '2026-04-13', {}, '/services/'), true);
  assert.equal(shouldSuppressNotice(normalized, '2026-04-13', { [normalized.dismissKey]: '2026-04-13' }, '/other/'), true);
  assert.equal(shouldSuppressNotice(normalized, '2026-04-14', {}, '/other/'), false);
});

test('discovery notices suppress duplicate visible routes', () => {
  const { visible } = buildVisibleNotices(noticeFeed, date, {}, '/other/');
  const sameRoute = buildVisibleNotices(noticeFeed, date, {}, '/now/');

  assert.equal(visible.length, 1);
  assert.equal(visible[0].href, '/now/');
  assert.equal(sameRoute.visible.length, 0);
});

test('discovery notices downgrade modal promos on reading-quiet chrome', () => {
  assert.equal(resolveNoticePresentation('modal', { readingQuiet: true }), 'toast');
  assert.equal(resolveNoticePresentation('modal', { readingQuiet: false }), 'modal');
  assert.equal(resolveNoticePresentation('modal', { forceModal: true, readingQuiet: true }), 'modal');
  assert.equal(resolveNoticePresentation('popup', { readingQuiet: true }), 'popup');

  const normalized = normalizeNotice(
    {
      title: 'Open the culinary route into play',
      summary: 'Recipes now carry cuisine taxonomy and software metaphors.',
      href: '/recipes/',
      cta: 'Open recipes',
      presentation: 'modal',
      promotion: { presentation: 'modal' },
    },
    'daily',
    '2026-06-14',
    0,
    'en',
  );

  document.documentElement.dataset.spwDebugMode = 'off';
  document.documentElement.dataset.spwCognitiveHandles = 'off';
  document.body.dataset.spwSurface = 'topics';

  assert.ok(normalized);
  assert.equal(normalized.presentation, 'toast');

  document.documentElement.dataset.spwDebugMode = 'on';
  const debugNotice = normalizeNotice(
    {
      title: 'Open the culinary route into play',
      summary: 'Recipes now carry cuisine taxonomy and software metaphors.',
      href: '/recipes/',
      cta: 'Open recipes',
      presentation: 'modal',
      promotion: { presentation: 'modal' },
    },
    'daily',
    '2026-06-14',
    0,
    'en',
  );
  assert.equal(debugNotice.presentation, 'modal');

  delete document.documentElement.dataset.spwDebugMode;
  delete document.documentElement.dataset.spwCognitiveHandles;
  delete document.body.dataset.spwSurface;
});

test('discovery notices accept image reward popup presentation', () => {
  const normalized = normalizeNotice(
    {
      title: 'Golden spiral discovered',
      summary: 'A visual invariant can become a prompt seed.',
      href: '/public/images/renders/2026-05-B-rhythms/rhythms-prompt-pack.md',
      presentation: 'popup',
      cadenceMotion: 'compare.orbit',
      rewardKind: 'math-prompt',
      productionSeed: 'symmetry-motion-card',
      promotion: {
        handles: ['image', 'spiral', 'reward'],
      },
    },
    'reward',
    'runtime-test',
    0,
    'en',
  );

  assert.ok(normalized);
  assert.equal(normalized.presentation, 'popup');
  assert.deepEqual(normalized.handles, ['image', 'spiral', 'reward']);
  assert.equal(normalized.cadenceMotion, 'compare.orbit');
  assert.equal(normalized.rewardKind, 'math-prompt');
  assert.equal(normalized.productionSeed, 'symmetry-motion-card');
});

test('runtime reward policy keeps credits transient and deduplicated', () => {
  const policy = getRuntimeRewardPolicy({
    cadence: 'reward',
    presentation: 'credits',
    rewardKind: 'spell-cauldron-literacy',
    title: 'Spell cast',
    href: '/design/palettes/#spell-cauldron-hooks',
  });
  const custom = getRuntimeRewardPolicy({
    presentation: 'toast',
    linger: 250,
    rewardKey: 'custom-key',
  });

  assert.equal(policy.presentation, 'credits');
  assert.equal(policy.cadence, 'reward');
  assert.equal(policy.autoDismissMs, 5600);
  assert.equal(policy.maxVisible, 2);
  assert.equal(policy.rewardKey, 'reward:spell-cauldron-literacy:Spell cast:/design/palettes/#spell-cauldron-hooks');
  assert.equal(custom.autoDismissMs, 800);
  assert.equal(custom.rewardKey, 'custom-key');
});

test('promo wonder selection remains data driven', () => {
  const daily = pickDaily(promoFeed, date);
  const weekly = pickWeekly(promoFeed, date);
  const weeklyIndex = clampIndex(getWeekIndex(date), promoFeed.weekly.length);

  assert.equal(feedLocale(promoFeed), 'fr');
  assert.equal(daily.promo.title, 'Tuesday promo');
  assert.equal(weekly.promo.title, promoFeed.weekly[weeklyIndex].promo.title);
});
