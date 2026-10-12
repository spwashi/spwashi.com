#!/usr/bin/env node
/**
 * clock — the site's time, in the form a stream entry takes.
 *
 *   npm run -s clock                      2026-10-12 10:54
 *   npm run -s clock -- --entry=verify    >>[2026-10-12 10:54] verify —
 *   npm run -s clock -- --date            2026-10-12
 *   npm run -s clock -- --zone            America/Chicago (from .spw/site.spw, or SPW_TZ)
 *
 * Paste the stamp; do not write one from your own sense of the time. The
 * zone lives in .spw/site.spw ^"clock" (scripts/lib/site-clock.mjs).
 */

import { siteStamp, siteToday, siteZone } from './lib/site-clock.mjs';

const args = process.argv.slice(2);
const entry = args.find((arg) => arg.startsWith('--entry='))?.slice(8);

if (args.includes('--zone')) console.log(siteZone());
else if (args.includes('--date')) console.log(siteToday());
else if (entry) console.log(`>>[${siteStamp()}] ${entry} —`);
else console.log(siteStamp());
