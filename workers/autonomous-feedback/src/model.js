/**
 * What a note is and which site it is about. No rendering, no network.
 */

export const VERSION = "0.3.0";

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

export function orgFromHostname(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/\.$/, "");
  if (host === "autonomous.feedback" || host === "www.autonomous.feedback") return null;
  const suffix = ".autonomous.feedback";
  if (!host.endsWith(suffix)) return null;
  const label = host.slice(0, -suffix.length);
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) return null;
  return label;
}

/**
 * Four kinds of note. The slug is the URL and matches the title; the prompt
 * says what to write; the example shows one.
 */
export const CONTEXTS = Object.freeze([
  {
    slug: "problem",
    title: "Problem",
    operator: "action",
    prompt: "What was hard to understand or use, and which page you were on.",
    example: "The search box looks like a button. I typed in the heading instead.",
    copy_unit: "feedback.problem.lede",
    expression: "feedback[problem]{claim}",
  },
  {
    slug: "suggestion",
    title: "Suggestion",
    operator: "concept-edge",
    prompt: "What would make the page clearer or easier to use.",
    example: "Show the price before the form asks for an email address.",
    copy_unit: "feedback.suggestion.lede",
    expression: "feedback[suggestion]{idea}",
  },
  {
    slug: "question",
    title: "Question",
    operator: "frame",
    prompt: "What you need the person who runs the site to answer.",
    example: "Can I finish this step without creating an account?",
    copy_unit: "feedback.question.lede",
    expression: "feedback[question]{address}",
  },
  {
    slug: "appreciation",
    title: "Appreciation",
    operator: "wonder",
    prompt: "What was clear or easy, and where you noticed it.",
    example: "The message under the email field told me exactly what to fix.",
    copy_unit: "feedback.appreciation.lede",
    expression: "feedback[appreciation]{gift}",
  },
]);

/** Slugs used before 2026-09-22, when the URL did not match the label. */
export const LEGACY_SLUGS = Object.freeze({ wonder: "appreciation", review: "problem", practice: "suggestion", brief: "question" });

export const DEFAULT_KIND = "problem";

/** The current slug for a slug or a legacy alias, or "" if it names no kind. */
export function resolveSlug(slug) {
  const value = String(slug || "").toLowerCase();
  if (CONTEXTS.some((c) => c.slug === value)) return value;
  return LEGACY_SLUGS[value] || "";
}

export function contextBySlug(slug) {
  const resolved = resolveSlug(slug);
  return CONTEXTS.find((c) => c.slug === resolved) || null;
}

/** Why a note cannot become a card yet, in the writer's words. */
export function noteProblem(text) {
  if (text.length < NOTE_MIN) return `Write at least ${NOTE_MIN} characters.`;
  if (text.length > NOTE_MAX) return `Keep it under ${NOTE_MAX.toLocaleString("en-US")} characters. This one has ${text.length.toLocaleString("en-US")}.`;
  return "";
}
