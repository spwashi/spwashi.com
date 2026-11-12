// The held names. Each answers one page, its door: one sentence, one place the
// work already lives, and two neighbors. A door reads nothing from the request
// but its host, so renderDoor(host) is the page a carry script writes as that
// host's file once it is served without a script.
import { escapeHtml } from "../../../lib/http.js";
import { HOST as MUTEX_HOST } from "../mutex.js";
import { HOST as TEALSTRIPES_HOST } from "../tealstripes.js";
import { neighborLine, renderPage } from "../set.js";

/** Hosts this script serves that are not yet their own product. */
export const DOORS = {
  "boon.land": {
    title: "boon.land",
    job: "A neutral frame pulled toward arrival. A concept stays words until a viewport is sponsored to show a picture.",
    href: "https://spwashi.com/about/domains/boon.land/",
    cta: "Read the field",
    neighbors: ["frame", "pictures"],
  },
  "bane.land": {
    title: "bane.land",
    job: "The same frame, pulled toward departure. A concept stays words until a viewport is sponsored to show a picture.",
    href: "https://spwashi.com/about/domains/bane.land/",
    cta: "Read the field",
    neighbors: ["frame", "pictures"],
  },
  "bone.land": {
    title: "bone.land",
    job: "The same frame, held still. A concept stays words until a viewport is sponsored to show a picture.",
    href: "https://spwashi.com/about/domains/bone.land/",
    cta: "Read the field",
    neighbors: ["frame", "pictures"],
  },
  "tealstripesvibes.com": {
    title: "Teal Stripes Vibes",
    job: "Designer seeds under masks, painted as stripes: every address is a picture, and a screenshot carries its own receipt.",
    href: "https://tealstripesvibes.com/harbor",
    cta: "Open a vibe",
    neighbors: ["grain", "pictures"],
  },
  "rpgwednesday.shop": {
    title: "RPG Wednesday",
    job: "The play table. The public night is on spwashi.com.",
    href: "https://spwashi.com/play/rpg-wednesday/",
    cta: "Sit at the table",
    neighbors: ["story", "work"],
  },
  "trope.wiki": {
    title: "trope.wiki",
    job: "A name for story moves. The long form you can read now is lore.land.",
    href: "https://lore.land/",
    cta: "Read the long form",
    neighbors: ["story", "work"],
  },
  "spwashi.ink": {
    title: "spwashi.ink",
    job: "The press name. The editions you can see now are the folios.",
    href: "https://spwashi.com/design/folios/",
    cta: "See the folios",
    neighbors: ["work", "story"],
  },
  "newyear.life": {
    title: "newyear.life",
    job: "The year as a threshold you can write on.",
    href: "https://spwashi.com/newyear/",
    cta: "Open the year",
    neighbors: ["work", "pictures"],
  },
  "brainstorm.monster": {
    title: "brainstorm.monster",
    job: "A name for thinking together. It is quiet. The work is on spwashi.com.",
    href: "https://spwashi.com/",
    cta: "Go to the work",
    neighbors: ["work", "path"],
  },
  "mutex.buzz": {
    title: "mutex.buzz",
    job: "The lock: one concept in the frame at a time. Each hold releases at a close, and a laminated folio holds it the rest of the time.",
    href: "https://mutex.buzz/now/",
    cta: "See what holds it",
    neighbors: ["pictures", "work"],
  },
  "spw.rest": {
    title: "spw.rest",
    job: "A resting name. The live path into the language is spw.quest.",
    href: "https://spw.quest/",
    cta: "Take the path",
    neighbors: ["path", "work"],
  },
  "spwashi.biz": {
    title: "spwashi.biz",
    job: "A held name. Commissions are on the services ladder.",
    href: "https://spwashi.com/services/",
    cta: "See the ladder",
    neighbors: ["work", "pictures"],
  },
  "spwashi.click": {
    title: "spwashi.click",
    job: "A held name. The site is spwashi.com.",
    href: "https://spwashi.com/",
    cta: "Go to the site",
    neighbors: ["work", "grain"],
  },
};

/**
 * The hosts whose answer is their door. mutex.buzz and tealstripesvibes.com stay
 * in DOORS so the set lists them, but each answers with a script of its own.
 */
export const DOOR_HOSTS = Object.freeze(
  Object.keys(DOORS).filter((host) => host !== MUTEX_HOST && host !== TEALSTRIPES_HOST)
);

export function renderDoor(host) {
  const door = DOORS[host];
  return renderPage({
    title: door.title,
    description: door.job,
    canonical: `https://${host}/`,
    robots: "noindex",
    body: `<p class="kicker">${escapeHtml(host)}</p>
    <h1>${escapeHtml(door.title)}</h1>
    <p class="lede">${escapeHtml(door.job)}</p>
    <p class="actions"><a class="primary" href="${escapeHtml(door.href)}">${escapeHtml(door.cta)}</a></p>
    <footer><p>Nearby: ${neighborLine(door.neighbors)}</p></footer>`,
  });
}
