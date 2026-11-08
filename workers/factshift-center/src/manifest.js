// factshift.center's installed face, layered over the snapshot's manifest.
//
// The app owns its name, colors and icons (assets/manifest.json, carried with
// each snapshot). The site adds what makes it a good app on a home screen next
// to spw.quest and spwashi.com (.spw/caches/pwa-roles-2026-11.spw): what it is
// for, that a canvas turns, that a line arriving from spw.quest lands in the
// open window, and two shortcuts to things it does. The mark stays the app's
// until the creator chooses one.

/** The app's own sentence, from the snapshot's <meta name="description">. */
export const DESCRIPTION = "factshift.center lays out a line of Spw: who is looking, from where, and what is still open, as nodes to move, link, and rewrite.";

export const SITE_MANIFEST = Object.freeze({
  id: "/",
  description: DESCRIPTION,
  // A canvas reads in either direction; the snapshot says portrait-primary.
  orientation: "any",
  // spw.quest's Canvas link and a shared ?spw= line reuse the open window.
  launch_handler: { client_mode: ["navigate-existing", "auto"] },
  categories: ["education", "productivity"],
  shortcuts: [
    { name: "Lay out a line", short_name: "A line", url: "/?spw=garden%5Bcare%5D%7Bseed%2C%20water%7D", description: "garden[care]{seed, water}, as nodes to move and link." },
    { name: "Help", short_name: "Help", url: "/help", description: "The help topics, open in the Spw window." },
  ],
});

/** The snapshot's manifest with the site's fields on top. */
export function siteManifest(snapshot = {}) {
  return { ...snapshot, ...SITE_MANIFEST };
}

/** Head lines the snapshot lacks: the bar color, the iOS icon, and a link preview's words. */
export function headLines(manifest = {}) {
  const icon = (manifest.icons || []).find((entry) => entry.sizes === "192x192")?.src || "/v0.0.1/favicon/192.png";
  return [
    `<meta name="theme-color" content="${manifest.theme_color || "#4c1d1d"}">`,
    `<link rel="apple-touch-icon" href="${icon}">`,
    `<meta name="apple-mobile-web-app-title" content="${manifest.short_name || "factshift"}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="factshift.center">`,
    `<meta property="og:title" content="factshift.center">`,
    `<meta property="og:description" content="${DESCRIPTION}">`,
    `<meta property="og:url" content="https://factshift.center/">`,
    `<meta name="twitter:card" content="summary">`,
  ].join("\n    ");
}
