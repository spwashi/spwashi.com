// attention.productions: the pictures. Its page frames the lock from mutex.buzz
// and says where the season stands, which is the one thing it reads per request.
import { escapeHtml } from "../../../lib/http.js";
import { HTML_CSP, htmlResponse } from "../respond.js";
import { neighborLine, renderPage } from "../set.js";

export const HOST = "attention.productions";

const ATTENTION_FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#140e18"/>
  <rect x="6" y="8" width="20" height="14" rx="1.5" fill="none" stroke="#e7d7f2" stroke-width="1.6"/>
  <path d="M10 26h12" stroke="#c8ff00" stroke-width="2" stroke-linecap="round"/>
</svg>`;

/** October 1, 2026, Chicago. The season line stays true on either side of that morning. */
const SEASON_OPEN = Date.parse("2026-10-01T00:00:00-05:00");

function seasonSentence(now) {
  if (now < SEASON_OPEN) {
    return "The production season opens October 1 and runs through New Year: a little promo every day.";
  }
  return "The production season runs from October 1 through New Year: a little promo every day.";
}

export function renderAttention(now) {
  return renderPage({
    title: "Attention Productions",
    description: "I'm Spwashi. Attention Productions is the name for the pictures: a feature in 2027, and a season of daily promo from October 1 through New Year.",
    canonical: "https://attention.productions/",
    robots: "index, follow",
    body: `<p class="kicker">attention.productions</p>
    <h1>Attention Productions</h1>
    <p class="lede">I'm Spwashi. This is the name for the pictures. A feature-length film is due in 2027, and I'm doing its marketing.</p>
    <p>${escapeHtml(seasonSentence(now))} A moment holds one concept. That rule is <a href="https://mutex.buzz/">mutex.buzz</a>. The frame is <a href="https://factshift.center/">factshift.center</a>. boon, bane, and bone are that same frame with a pull: toward, away, or still. A sponsored viewport can show a picture. A physics setting is a query on the frame, once those three names serve it.</p>
    <p class="actions">
      <a class="primary" href="https://spwashi.com/cards/#back-the-film">Back the season</a>
      <a href="https://spwashi.com/topics/film/">Film paths</a>
      <a href="https://autonomous.feedback/attention.productions">Leave a note</a>
    </p>
    <figure class="held">
      <iframe src="https://mutex.buzz/now/" title="What holds the frame now, from mutex.buzz" loading="lazy"></iframe>
      <figcaption>What holds the frame this cycle, from <a href="https://mutex.buzz/">mutex.buzz</a>. When nothing else holds it, a laminated folio does. <a href="https://mutex.buzz/now/">Open it on its own</a>.</figcaption>
    </figure>
    <h2>What is open</h2>
    <p>Backing keeps the daily promo daily. The card on spwashi.com asks what being part of it would mean to you. Nothing on that card is a promise; we agree on what fits.</p>
    <footer>
      <p>Nearby: ${neighborLine(["work", "story", "grain"])}</p>
      <p><a href="/ecosystem.json">The set, as data</a></p>
    </footer>`,
  });
}

/** attention.productions frames the lock from mutex.buzz. */
const ATTENTION_CSP = HTML_CSP.replace("default-src 'none';", "default-src 'none'; frame-src https://mutex.buzz;");

export const site = {
  host: HOST,
  favicon: ATTENTION_FAVICON,
  robots: "User-agent: *\nAllow: /\n",
  page: (cache) => htmlResponse(renderAttention(Date.now()), { cache, robots: "index, follow", csp: ATTENTION_CSP }),
};
