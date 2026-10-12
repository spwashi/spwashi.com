/**
 * site-clock — one clock for every script and agent in this workspace.
 *
 * Agents have written stream entries in UTC and in Central time, and scripts
 * have computed "today" both ways, so after 7pm Central half of them think
 * it is tomorrow. The zone is named once, in .spw/site.spw ^"clock", and
 * SPW_TZ overrides it for one run. A stamp is a date and a time in that
 * zone, with no offset on the entry; the zone is said once, not on every
 * line:
 *
 *   >>[2026-10-12 10:54] verify — …
 *
 *   siteZone()                "America/Chicago"
 *   siteToday(date?)          "2026-10-12", the date in the site zone
 *   siteStamp(date?)          "2026-10-12 10:54"
 *   siteInstant(date, time)   the instant a site-zone date and time name
 *   parseStamp(text)          { date, time, instant } or null
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.spw', 'site.spw');

/** YYYY-MM-DD, then HH:MM when the entry has a time. */
export const STAMP = /(\d{4}-\d{2}-\d{2})(?: (\d{2}):(\d{2}))?/;

let zone = null;
export function siteZone() {
  if (zone) return zone;
  if (process.env.SPW_TZ) return (zone = process.env.SPW_TZ);
  try {
    const hit = /\^"clock"\{[\s\S]*?\bzone\s*=\s*"([^"]+)"/.exec(fs.readFileSync(SITE, 'utf8'));
    if (hit) return (zone = hit[1]);
  } catch { /* no site.spw: fall back to the machine */ }
  return (zone = Intl.DateTimeFormat().resolvedOptions().timeZone);
}

function partsIn(date, timeZone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    timeZoneName: 'longOffset',
  }).formatToParts(date).map((part) => [part.type, part.value]));
  const offset = parts.timeZoneName === 'GMT' ? '+00:00' : parts.timeZoneName.replace('GMT', '');
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}`, offset };
}

export const siteStamp = (date = new Date()) => {
  const { date: day, time } = partsIn(date, siteZone());
  return `${day} ${time}`;
};
export const siteToday = (date = new Date()) => partsIn(date, siteZone()).date;

const offsetMinutes = (offset) => (offset.startsWith('-') ? -1 : 1) * (Number(offset.slice(1, 3)) * 60 + Number(offset.slice(4, 6)));

/** The instant a date and time on the site's clock name (the offset is read at that wall time). */
export function siteInstant(date, time) {
  const wall = Date.parse(`${date}T${time}:00Z`);
  return wall - offsetMinutes(partsIn(new Date(wall), siteZone()).offset) * 60000;
}

export function parseStamp(text) {
  const hit = STAMP.exec(text);
  if (!hit) return null;
  const [, date, hh, mm] = hit;
  const time = hh ? `${hh}:${mm}` : null;
  return { date, time, instant: time ? new Date(siteInstant(date, time)) : null };
}
