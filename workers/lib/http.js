// What every worker in the cluster sends and escapes the same way (2026-11-11).
// Six workers each wrote these for themselves; a site now says only its stance:
// whether anything may frame it, what a link it leaves says about where it came
// from, who may load its files, and its content policy. The order of the headers
// is the order every worker already sent, so carried _headers files are unchanged.

export const PERMISSIONS_POLICY = "camera=(), microphone=(), geolocation=(), payment=(), usb=()";

export const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/**
 * The security headers for a site's stance. `frame: null` lets a page be framed
 * (its CSP says by whom); `corp` and `csp` are added only when a site sets them.
 */
export function securityHeaders({ frame = "DENY", referrer = "no-referrer", corp, csp } = {}) {
  return {
    "X-Content-Type-Options": "nosniff",
    ...(frame ? { "X-Frame-Options": frame } : {}),
    "Referrer-Policy": referrer,
    "Permissions-Policy": PERMISSIONS_POLICY,
    ...(corp ? { "Cross-Origin-Resource-Policy": corp } : {}),
    ...(csp ? { "Content-Security-Policy": csp } : {}),
  };
}
