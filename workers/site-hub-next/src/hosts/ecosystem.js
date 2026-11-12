// What a host with nothing of its own answers, and the set as data, which every
// host answers: ecosystem.json, the hub's favicon, a robots.txt that keeps held
// names out of search, and the set page for any host this script does not name.
import { escapeHtml } from "../../../lib/http.js";
import { PRODUCTS, renderPage } from "../set.js";
import { DOORS } from "./doors.js";

export const ecosystemJson = {
  schema: "ecosystem.v1",
  products: PRODUCTS.map(({ id, host, title, job, href }) => ({ id, host, title, job, href })),
  doors: Object.entries(DOORS).map(([host, door]) => ({
    host,
    title: door.title,
    job: door.job,
    href: door.href,
    neighbors: door.neighbors,
  })),
};

export const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0d1117"/>
  <path d="M7 11h18M7 16h18M7 21h18" stroke="#5eead4" stroke-width="2" stroke-linecap="round"/>
  <circle cx="23" cy="11" r="2" fill="#c8ff00"/>
</svg>`;

export const ROBOTS = "User-agent: *\nDisallow: /\n";

export function renderSet() {
  const cards = PRODUCTS.map(
    (product) => `<article>
  <h2><a href="${escapeHtml(product.href)}">${escapeHtml(product.title)}</a></h2>
  <p>${escapeHtml(product.job)}</p>
</article>`
  ).join("");
  return renderPage({
    title: "Spwashi",
    description: "Software and art, and the names around that work.",
    canonical: "https://spwashi.com/",
    robots: "noindex",
    body: `<p class="kicker">I'm Spwashi.</p>
    <h1>Software and art, and the names around that work.</h1>
    <p class="lede">Each name has one job. The work they point at already exists.</p>
    <div class="grid">${cards}</div>`,
  });
}
