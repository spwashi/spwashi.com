/**
 * site-hub-next — one public job per hostname.
 *
 * attention.productions is the pictures. texture.website left for its own
 * files-only unit, workers/texture-website, on 2026-11-12.
 * Every other host this script serves is a door: one sentence, one place
 * the work already lives, and two neighbors. Does not serve spwashi.com.
 * Do not attach this script to spwashi.com/*.
 *
 * This file only routes. Each host's answers live in a module of its own, so a
 * host leaves for a unit of its own by deleting its import and its line here.
 */

import { HOST as TEALSTRIPES_HOST, handleTealstripes } from "./tealstripes.js";
import { HOST as MUTEX_HOST, handleMutex } from "./mutex.js";
import { site as attention } from "./hosts/attention.js";
import { DOORS, renderDoor } from "./hosts/doors.js";
import { FAVICON, ROBOTS, ecosystemJson, renderSet } from "./hosts/ecosystem.js";
import { htmlResponse, iconResponse, jsonResponse, notFound, textResponse } from "./respond.js";

/** Hosts that answer every path with a script of their own, but for the set's shared files. */
const SCRIPTED = new Map([
  [TEALSTRIPES_HOST, handleTealstripes],
  [MUTEX_HOST, handleMutex],
]);
const SET_PATHS = ["/ecosystem.json", "/registry.json", "/favicon.svg"];

/**
 * Hosts with a page of their own: its favicon, robots.txt, page, and, where it
 * keeps one, its registry and any path it answers on every host. Any other host
 * is a door, or the set.
 */
const SITES = [
  attention,
];
const SITE_BY_HOST = new Map(SITES.map((site) => [site.host, site]));
const ANY_HOST = new Map(SITES.flatMap((site) => Object.entries(site.anyHost || {})));

export default {
  async fetch(request, env = {}) {
    const url = new URL(request.url);
    const host = url.hostname;
    const scripted = SCRIPTED.get(host);
    if (scripted && !SET_PATHS.includes(url.pathname)) return scripted(request, env);

    if (host.startsWith("www.")) {
      return Response.redirect(
        `https://${host.slice(4)}${url.pathname}${url.search}`,
        302
      );
    }

    const cache = host.endsWith(".workers.dev")
      ? "no-store"
      : "public, max-age=300";
    const site = SITE_BY_HOST.get(host);

    if (url.pathname === "/favicon.svg") return iconResponse(site?.favicon ?? FAVICON);
    if (url.pathname === "/robots.txt") return textResponse(site?.robots ?? ROBOTS, cache);
    if (ANY_HOST.has(url.pathname)) return jsonResponse(ANY_HOST.get(url.pathname), cache);
    if (url.pathname === "/ecosystem.json") return jsonResponse(ecosystemJson, cache);
    if (url.pathname === "/registry.json") return jsonResponse(site?.registry ?? ecosystemJson, cache);

    if (url.pathname === "/" || url.pathname === "") {
      if (site) return site.page(cache);
      if (DOORS[host]) return htmlResponse(renderDoor(host), { cache, robots: "noindex" });
      return htmlResponse(renderSet(), { cache, robots: "noindex" });
    }

    return notFound();
  },
};
