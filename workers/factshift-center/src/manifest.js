// factshift.center's installed face, layered over the snapshot's manifest.
//
// The snapshot supplies the app's name and colors. The site carries the artwork
// and the fields that describe how the canvas launches and receives a line.

/** The app's own sentence, from the snapshot's <meta name="description">. */
export const DESCRIPTION = "Lay out an idea as nodes to move, link, and rewrite.";

const ARTWORK = "/branding";
export const SOCIAL_IMAGE = `${ARTWORK}/share.png`;

function icon(size, purpose = "any") {
  const name = purpose === "maskable" ? "maskable" : "icon";
  return { src: `${ARTWORK}/${name}-${size}.png`, sizes: `${size}x${size}`, type: "image/png", purpose };
}

export const SITE_MANIFEST = Object.freeze({
  id: "/",
  icons: [32, 96, 192, 512].map((size) => icon(size)).concat(icon(512, "maskable")),
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
      icons: [{ src: icon(96).src, sizes: "96x96", type: "image/png" }],
    },
    {
      name: "Spw window",
      short_name: "Spw",
      url: "/?mode=spw",
      description: "Open the prompt and thread on the canvas.",
      icons: [{ src: icon(96).src, sizes: "96x96", type: "image/png" }],
    },
    {
      name: "Help",
      short_name: "Help",
      url: "/help",
      description: "The help topics, open in the Spw window.",
      icons: [{ src: icon(96).src, sizes: "96x96", type: "image/png" }],
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
  return [
    `<meta name="theme-color" content="${manifest.theme_color || "#4c1d1d"}">`,
    `<meta name="mobile-web-app-capable" content="yes">`,
    `<meta name="apple-mobile-web-app-capable" content="yes">`,
    `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`,
    `<link rel="icon" type="image/png" sizes="32x32" href="${icon(32).src}">`,
    `<link rel="apple-touch-icon" sizes="180x180" href="${icon(180).src}">`,
    `<meta name="apple-mobile-web-app-title" content="${manifest.short_name || "factshift"}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="factshift.center">`,
    `<meta property="og:title" content="factshift.center">`,
    `<meta property="og:description" content="${DESCRIPTION}">`,
    `<meta property="og:url" content="${ORIGIN}${document}">`,
    `<meta property="og:image" content="${ORIGIN}${SOCIAL_IMAGE}">`,
    `<meta property="og:image:type" content="image/png">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="Factshift’s maroon frame surrounds a gray canvas with a highlighted focal square and linked nodes.">`,
    `<meta name="twitter:card" content="summary_large_image">`,
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
