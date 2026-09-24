/**
 * The room's issues, numbered. Issue n of a series is its constant to n
 * decimal places: 3.1, 3.14, … for π; 2.7, 2.71, … for e.
 */
import { ISSUES, SERIES } from "./room.js";

const counters = {};
export const numbered = ISSUES.map((issue) => {
  const index = (counters[issue.series] = (counters[issue.series] ?? -1) + 1);
  return { ...issue, index, no: SERIES[issue.series].digits.slice(0, index + 3) };
});

export const printed = numbered.filter((i) => i.status !== "open");
export const inSeries = (series) => numbered.filter((i) => i.series === series);
export const printedIn = (series) => printed.filter((i) => i.series === series);
export const forthcomingIn = (series) => numbered.filter((i) => i.series === series && i.status === "open");
export const bySlug = (slug) => printed.find((i) => i.slug === slug) || null;

export function dateline(date) {
  if (!date) return "";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
}
