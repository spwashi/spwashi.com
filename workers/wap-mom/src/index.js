/**
 * wap.mom — Wondering About Pi.
 *
 * A periodical of record, set like print, with a supplement on e. It plays
 * everything straight; the domain is the only thing that winks.
 *
 *   room.js     what it says — the writers' room edits this
 *   catalog.js  numbering: each issue is its constant to one more place
 *   figures.js  instruments a reader can move, with or without script
 *   layout.js   type, mastheads, ornaments, responses
 *   pages.js    front page, issues, offprints, clippings, contents, colophon
 *   feeds.js    Atom feed, sitemap, now.json
 *   cabinet.js  old filings, behind a key, to read and discard
 */

import { bySlug } from "./catalog.js";
import { cabinet } from "./cabinet.js";
import { FIGURES_JS } from "./figures.js";
import { atom, nowJson, sitemap } from "./feeds.js";
import { BASE_SECURITY, FAVICON, html, jsonResponse, textResponse } from "./layout.js";
import {
  renderClip, renderColophon, renderContents, renderCorrections, renderFront, renderIssue, renderOffprint, renderRoom,
} from "./pages.js";

const PAGES = {
  "/": renderFront,
  "/room": renderRoom,
  "/contents": renderContents,
  "/colophon": renderColophon,
  "/corrections": renderCorrections,
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (url.hostname.startsWith("www.")) {
      return Response.redirect(`https://wap.mom${path}${url.search}`, 302);
    }
    if (path === "/favicon.svg") return textResponse(FAVICON, "image/svg+xml", "public, max-age=86400");
    if (path === "/robots.txt") {
      return textResponse("User-agent: *\nAllow: /\nDisallow: /cabinet\nSitemap: https://wap.mom/sitemap.xml\n", "text/plain");
    }
    if (path === "/figures.js") return textResponse(FIGURES_JS, "text/javascript", "public, max-age=3600");
    if (path === "/feed.xml") return textResponse(atom(), "application/atom+xml");
    if (path === "/sitemap.xml") return textResponse(sitemap(), "application/xml");
    if (path === "/now.json") return jsonResponse(nowJson());

    const page = PAGES[path.length > 1 ? path.replace(/\/$/, "") : path];
    if (page) return html(page());

    if (path.startsWith("/cabinet")) {
      const response = await cabinet(request, env, url);
      if (response) return response;
    }

    const match = path.match(/^\/([a-z0-9-]+)(?:\/(?:(offprint|clip)\/?)?)?$/);
    const issue = match ? bySlug(match[1]) : null;
    if (issue) {
      if (match[2] === "offprint") return html(renderOffprint(issue));
      if (match[2] === "clip" && issue.clip) return html(renderClip(issue));
      if (!match[2]) return html(renderIssue(issue, url.searchParams));
    }
    return new Response("Not found", {
      status: 404,
      headers: { ...BASE_SECURITY, "Content-Type": "text/plain; charset=UTF-8" },
    });
  },
};
