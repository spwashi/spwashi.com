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
  display_override: ["window-controls-overlay", "standalone", "minimal-ui", "browser"],
  // spw.quest's Canvas link and a shared ?spw= line reuse the open window.
  launch_handler: { client_mode: ["navigate-existing", "auto"] },
  categories: ["education", "productivity", "utilities"],
  // Text shared from another app lands as a line, by the address the canvas already reads.
  share_target: { action: "/", method: "GET", params: { text: "spw" } },
  file_handlers: [
    {
      action: "/",
      accept: {
        "text/plain": [".spw", ".txt"],
        "application/x-spw": [".spw"],
      },
      launch_type: "single-client",
    },
  ],
  shortcuts: [
    {
      name: "Lay out a line",
      short_name: "A line",
      url: "/?spw=garden%5Bcare%5D%7Bseed%2C%20water%7D",
      description: "garden[care]{seed, water}, as nodes to move and link.",
      icons: [{ src: "/v0.0.1/favicon/96.png", sizes: "96x96", type: "image/png" }],
    },
    {
      name: "Spw window",
      short_name: "Spw",
      url: "/?mode=spw",
      description: "Open the prompt and thread on the canvas.",
      icons: [{ src: "/v0.0.1/favicon/96.png", sizes: "96x96", type: "image/png" }],
    },
    {
      name: "Help",
      short_name: "Help",
      url: "/help",
      description: "The help topics, open in the Spw window.",
      icons: [{ src: "/v0.0.1/favicon/96.png", sizes: "96x96", type: "image/png" }],
    },
  ],
});

/** The snapshot's manifest with the site's fields on top. */
export function siteManifest(snapshot = {}) {
  return { ...snapshot, ...SITE_MANIFEST };
}

export const ORIGIN = "https://factshift.center";

/** The documents a search may index: the canvas. The secondary entry (/_spwashi@/) is followed, not indexed. */
export const INDEXED = Object.freeze(["/"]);

/**
 * Head lines the snapshot lacks: the bar color, the iOS icon, a link
 * preview's words, and the document's canonical address and robots value.
 * A line in the address (?spw=) is the same canvas, so every variant names
 * the bare document as canonical.
 */
export function headLines(manifest = {}, document = "/") {
  const icon = (manifest.icons || []).find((entry) => entry.sizes === "192x192")?.src || "/v0.0.1/favicon/192.png";
  return [
    `<meta name="theme-color" content="${manifest.theme_color || "#4c1d1d"}">`,
    `<meta name="mobile-web-app-capable" content="yes">`,
    `<meta name="apple-mobile-web-app-capable" content="yes">`,
    `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`,
    `<link rel="apple-touch-icon" href="${icon}">`,
    `<meta name="apple-mobile-web-app-title" content="${manifest.short_name || "factshift"}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="factshift.center">`,
    `<meta property="og:title" content="factshift.center">`,
    `<meta property="og:description" content="${DESCRIPTION}">`,
    `<meta property="og:url" content="${ORIGIN}${document}">`,
    `<meta name="twitter:card" content="summary">`,
    `<link rel="canonical" href="${ORIGIN}${document}">`,
    `<meta name="robots" content="${INDEXED.includes(document) ? "index, follow" : "noindex, follow"}">`,
  ].join("\n    ");
}

/** robots.txt: every address is open; the sitemap names what is indexed. */
export const ROBOTS = `User-agent: *
Allow: /
Sitemap: ${ORIGIN}/sitemap.xml
`;

export function sitemap(documents = INDEXED) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${documents.map((document) => `  <url><loc>${ORIGIN}${document}</loc></url>`).join("\n")}
</urlset>
`;
}
