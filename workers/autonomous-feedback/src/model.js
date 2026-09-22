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
 * Four kinds of note. The slug is the URL and never changes; the title names
 * the intent; the prompt says what to write; the example shows one.
 */
export const CONTEXTS = Object.freeze([
  {
    slug: "wonder",
    title: "Appreciation",
    operator: "wonder",
    prompt: "Something on the site that worked for you, or that you kept thinking about.",
    example: "The recipe page scaled every quantity when I changed the servings. That saved me a calculator.",
    copy_unit: "feedback.wonder.lede",
    expression: "feedback[wonder]{gift}",
  },
  {
    slug: "review",
    title: "Problem",
    operator: "action",
    prompt: "Something that is broken, confusing, or hard to use, and where it happened.",
    example: "On the checkout page, the Pay button does nothing on my phone (Safari, iOS 18).",
    copy_unit: "feedback.review.lede",
    expression: "feedback[review]{claim}",
  },
  {
    slug: "practice",
    title: "Suggestion",
    operator: "concept-edge",
    prompt: "An idea for what the site could add, change, or stop doing.",
    example: "A dark mode would help; I read the archive at night.",
    copy_unit: "feedback.practice.lede",
    expression: "feedback[practice]{brief}",
  },
  {
    slug: "brief",
    title: "Question",
    operator: "frame",
    prompt: "Something you want the person who runs the site to answer.",
    example: "Is the print edition still shipping outside the US?",
    copy_unit: "feedback.brief.lede",
    expression: "feedback[brief]{address}",
  },
]);

export function contextBySlug(slug) {
  return CONTEXTS.find((c) => c.slug === slug) || null;
}

/** Why a note cannot become a card yet, in the writer's words. */
export function noteProblem(text) {
  if (text.length < NOTE_MIN) return `Write at least ${NOTE_MIN} characters.`;
  if (text.length > NOTE_MAX) return `Keep it under ${NOTE_MAX.toLocaleString("en-US")} characters. This one has ${text.length.toLocaleString("en-US")}.`;
  return "";
}
