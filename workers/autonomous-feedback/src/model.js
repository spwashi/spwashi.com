/**
 * What a note is and which site it is about. No rendering, no network.
 *
 * A note is a card its writer keeps. Nothing here stores, counts, or sends
 * one: the writer decides where the card goes.
 */

export const VERSION = "0.4.0";

/** Floor for a written note that has no type. A chosen kind, common note, or thanks is a complete submission. */
export const NOTE_MIN = 8;
export const NOTE_MAX = 2000;

// A reference selects a namespace, never permission or an origin to fetch.
export function validSubject(value) {
  return value.length <= 253 && value.includes(".") && value.split(".").every(
    (label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)
  );
}

export function isPublicSite(value) {
  if (!validSubject(value)) return false;
  const labels = value.split(".");
  if (labels.every((label) => /^\d+$/.test(label))) return false;
  const last = labels[labels.length - 1];
  return !["local", "localhost", "internal", "intranet"].includes(last);
}

/**
 * People paste links, not hostnames. Keep the host and drop the rest:
 * "https://www.Example.com/about?x#y" → "example.com". Returns "" when nothing
 * host-shaped is left, so callers decide whether an empty field is an error.
 */
export function normalizeHost(input) {
  let value = String(input || "").trim().toLowerCase();
  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  value = value.replace(/^[^@/]*@/, "");
  value = value.split(/[/?#]/)[0];
  value = value.replace(/:\d+$/, "").replace(/\.$/, "").replace(/^www\./, "");
  return value;
}

/**
 * The sites a card can be about: one person's sites, read by that person.
 * LISTED are the ones that link here, in the order the home page names them.
 */
export const OWN_SITES = Object.freeze([
  "spwashi.com", "resume.spwashi.com", "lore.land", "texture.website", "attention.productions",
  "bane.land", "bone.land", "boon.land", "brainstorm.monster", "factshift.center", "mutex.buzz",
  "newyear.life", "rpgwednesday.shop", "spw.rest", "spwashi.biz", "spwashi.click", "spwashi.ink",
  "tealstripesvibes.com", "trope.wiki", "smut.today", "wap.mom", "spw.quest",
]);
export const LISTED = Object.freeze(["spwashi.com", "lore.land", "spw.quest", "attention.productions"]);

export function isOwnSite(host) {
  return OWN_SITES.includes(String(host || "").toLowerCase());
}

/**
 * Kinds of note. The slug is the URL and matches the title. The first four
 * sort a QA report; question and appreciation stay available.
 */
export const CONTEXTS = Object.freeze([
  {
    slug: "broken",
    tap: "Something here is broken.",
    title: "Broken",
    operator: "action",
    prompt: "What failed, and what you did just before it failed.",
    example: "I pressed Next. The button spun, then the page went blank.",
    copy_unit: "feedback.broken.lede",
    expression: "feedback[broken]{claim}",
  },
  {
    slug: "confusing",
    tap: "This was confusing.",
    title: "Confusing",
    operator: "concept-edge",
    prompt: "What you could not tell how to do, and where you were.",
    example: "The menu looks like a heading. I tapped the title instead.",
    copy_unit: "feedback.confusing.lede",
    expression: "feedback[confusing]{claim}",
  },
  {
    slug: "missing",
    tap: "Something I expected is missing.",
    title: "Missing",
    operator: "frame",
    prompt: "What you expected to find on the page, and did not.",
    example: "There is no way back to the start after the second step.",
    copy_unit: "feedback.missing.lede",
    expression: "feedback[missing]{claim}",
  },
  {
    slug: "wrong",
    tap: "Something here is wrong.",
    title: "Wrong",
    operator: "action",
    prompt: "What the page says or does that does not match the thing it is about.",
    example: "The page says it was posted Monday. The date beside it says Tuesday.",
    copy_unit: "feedback.wrong.lede",
    expression: "feedback[wrong]{claim}",
  },
  {
    slug: "question",
    tap: "I have a question about this.",
    title: "Question",
    operator: "frame",
    prompt: "What you need the person who runs the site to answer.",
    example: "Can I read this without the sound on?",
    copy_unit: "feedback.question.lede",
    expression: "feedback[question]{address}",
  },
  {
    slug: "appreciation",
    tap: "This was good.",
    title: "Appreciation",
    operator: "wonder",
    prompt: "What was clear or easy, and where you noticed it.",
    example: "The line under the field told me exactly what to change.",
    copy_unit: "feedback.appreciation.lede",
    expression: "feedback[appreciation]{gift}",
  },
]);

/**
 * The kind a note has when nobody chose one. Not a chip and not an address:
 * a preselected kind would sort every untouched note under it, so an unsorted
 * note stays a plain note.
 */
export const NOTE = Object.freeze({
  slug: "note",
  tap: "",
  title: "Note",
  operator: "frame",
  prompt: "What happened, and where were you?",
  example: "I looked for the next page and found it only at the very end.",
  copy_unit: "feedback.note.lede",
  expression: "feedback[note]{claim}",
});

/** Older slugs still resolve. The address redirects to the current one. */
export const LEGACY_SLUGS = Object.freeze({
  problem: "broken",
  review: "broken",
  suggestion: "confusing",
  practice: "confusing",
  wonder: "appreciation",
  brief: "question",
});

/** A site path, or "" when the value is not a path. */
export function cleanPath(value) {
  let path = String(value || "").trim();
  if (!path) return "";
  try {
    if (/^https?:\/\//i.test(path)) path = new URL(path).pathname;
  } catch {
    return "";
  }
  path = path.split(/[?#]/)[0];
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 200 || path.includes("..") || /[\u0000-\u001f]/.test(path)) return "";
  return path;
}

/**
 * The page a reader came from, when the Referer is the site itself (or its
 * www form). A bare "/" is ignored: browsers cut a cross-site Referer to the
 * origin by default, so "/" cannot be told apart from "unknown". The sites'
 * links send the full URL with referrerpolicy="no-referrer-when-downgrade".
 */
export function refererPath(referer, host) {
  if (!referer || !host) return "";
  let url;
  try {
    url = new URL(referer);
  } catch {
    return "";
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return "";
  const from = url.hostname.toLowerCase().replace(/^www\./, "");
  if (from !== String(host).toLowerCase()) return "";
  const path = cleanPath(url.pathname);
  return path === "/" ? "" : path;
}

/** The current slug for a slug or a legacy alias, or "" if it names no kind. */
export function resolveSlug(slug) {
  const value = String(slug || "").toLowerCase();
  if (CONTEXTS.some((c) => c.slug === value)) return value;
  return LEGACY_SLUGS[value] || "";
}

export function contextBySlug(slug) {
  if (String(slug || "").toLowerCase() === NOTE.slug) return NOTE;
  const resolved = resolveSlug(slug);
  return CONTEXTS.find((c) => c.slug === resolved) || null;
}

/** Why untyped prose cannot become a card yet. A chosen type does not come through here. */
export function noteProblem(text) {
  if (!text.length) return "Pick what this is. That is enough to send. Or write what happened.";
  if (text.length < NOTE_MIN) return `Pick what this is, or write at least ${NOTE_MIN} characters. This note has ${text.length}.`;
  if (text.length > NOTE_MAX) return `Keep it under ${NOTE_MAX.toLocaleString("en-US")} characters. This one has ${text.length.toLocaleString("en-US")}.`;
  return "";
}
