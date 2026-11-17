// The hold as two lines of Spw. One writer: mutex.buzz's page and
// tealstripesvibes.com's /@lock both say what holds the lock, and which hour
// of that hold it is. This formats a record. It does not parse.
//
// *holds[cycle]{title}(since ~> until)
// %turn[n/of]{hour}

/** A hold's hour, in milliseconds. */
export const HOLD_MS = 3_600_000;

/** A title or a day, as the line spells it: lower case, letters and digits. */
export const holdWords = (text) => String(text).toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

/** A moment as "november 14", in UTC, where the closes are kept. */
export const holdDay = (ms) => holdWords(new Date(ms).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" }));

const at = (moment) => {
  if (moment instanceof Date) return moment.getTime();
  if (typeof moment === "number") return moment;
  return Date.parse(moment);
};

/**
 * Which hour of the hold a moment is. index is 0 on the first hour.
 * of is how many hours the hold covers.
 */
export function holdTurn(hold, moment) {
  const since = Date.parse(hold.since);
  const of = Math.round((Date.parse(hold.releasesAt) - since) / HOLD_MS);
  const index = Math.min(of - 1, Math.max(0, Math.floor((at(moment) - since) / HOLD_MS)));
  return { index, of };
}

/** The turn as a line: a measure, its place in the hold as a ratio. */
export const formatTurn = (index, of) => `%turn[${index + 1}/${of}]{hour}`;

/**
 * The two lines. The first does not depend on the moment. The second is the
 * hour `moment` falls in.
 */
export function holdLines(hold, moment) {
  const since = Date.parse(hold.since);
  const { index, of } = holdTurn(hold, moment);
  const title = holdWords(hold.title);
  const from = holdDay(since);
  const until = holdDay(Date.parse(hold.releasesAt) - 1);
  return [
    `*holds[${hold.cycle}]{${title}}(${from} ~> ${until})`,
    formatTurn(index, of),
  ];
}
