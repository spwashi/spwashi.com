/**
 * Intake guards. They store nothing themselves.
 * A public file must not carry a secret. A burst of posts or meter checks
 * from one address is slowed. A desk opens only for the operator token set on
 * the worker or for the owner key whose hash the site publishes, each
 * compared in constant time; with neither set it stays shut.
 */

const WINDOW_SECONDS = 600;
const POST_LIMIT = 8;
const METER_LIMIT = 20;
const SECRET_FIELDS = ["token", "bearer", "secret", "password", "inboxToken", "inbox_token"];

export function rejectPublicSecrets(raw, problems) {
  if (!raw || typeof raw !== "object") return;
  for (const key of SECRET_FIELDS) {
    if (raw[key] != null && String(raw[key]).trim()) {
      problems.push(`${key} does not belong in this file. A public file cannot hold an inbox token.`);
    }
  }
}

export function tokensMatch(presented, secret) {
  const encode = (value) => new TextEncoder().encode(value);
  const a = encode(presented);
  const b = encode(secret);
  if (a.byteLength !== b.byteLength) return false;
  if (typeof crypto.subtle?.timingSafeEqual === "function") return crypto.subtle.timingSafeEqual(a, b);
  let diff = 0;
  for (let i = 0; i < a.byteLength; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** The token from "Authorization: Bearer …", or "". */
export function bearerOf(header) {
  const value = header || "";
  return value.toLowerCase().startsWith("bearer ") ? value.slice(7).trim() : "";
}

/** One cookie's value, or "". */
export function cookieOf(request, name) {
  for (const part of (request.headers.get("cookie") || "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

/**
 * Who is opening a desk. The operator token (INBOX_READ_TOKEN) opens every
 * desk. An owner key opens its own site's desk: the client file publishes only
 * its SHA-256 as inbox.key, so the public file never holds the secret.
 * With neither configured, nothing opens.
 * @returns {Promise<"operator"|"owner"|"locked"|"wrong"|"unset">}
 */
export async function deskAccess(presented, { operator = "", ownerHash = "" } = {}) {
  if (!presented) return "locked";
  if (!operator && !ownerHash) return "unset";
  if (operator && tokensMatch(presented, operator)) return "operator";
  if (ownerHash && tokensMatch(`sha256:${await sha256Hex(presented)}`, ownerHash)) return "owner";
  return "wrong";
}

async function addressKey(request) {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  return [...new Uint8Array(digest)].slice(0, 8).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Allow a burst, then ask the caller to wait. If the cache is unavailable, allow the request. */
export async function intakeOpen(request, bucket, limit = POST_LIMIT) {
  let cache;
  try {
    cache = caches.default;
  } catch {
    return true;
  }
  if (!cache?.match) return true;
  const key = new Request(`https://autonomous.feedback/intake/${bucket}/${await addressKey(request)}`);
  try {
    const hit = await cache.match(key);
    const count = hit ? Number(await hit.text()) || 0 : 0;
    if (count >= limit) return false;
    await cache.put(key, new Response(String(count + 1), {
      headers: { "cache-control": `public, max-age=${WINDOW_SECONDS}` },
    }));
    return true;
  } catch {
    return true;
  }
}

export const SLOW_NOTE = "Too many notes from this network. Wait a few minutes and send again.";
export { METER_LIMIT, POST_LIMIT };
