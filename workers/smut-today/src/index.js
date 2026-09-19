/**
 * smut.today — a small daily erotic zine.
 * Attached only to smut.today. Does not serve spwashi.com.
 */

const STORIES = [
  {
    slug: "meeting",
    title: "Before the meeting",
    register: "slow",
    since: "2026-09-19",
    kicker: "twelve minutes, glass walls, a lock that actually works",
    summary: "You already know how the pitch will go. You do not know if you can stand up without giving yourself away.",
    body: [
      "The twelfth-floor conference room still smells like dry-erase and the coffee nobody finished. Your deck is open on a laptop you are not looking at. Two desks over, Jules has been watching your mouth all morning like it is a problem they intend to solve carefully, with both hands.",
      "You have been wet since the standup. Not the poetic kind. The kind that ruins an afternoon by degrees, so that every time you uncross your legs the fabric drags and you have to swallow before you can say a number out loud. Jules notices. Jules always notices; it is the least professional thing about them and the reason you are still here. When the calendar pings they mouth conference B without looking up, and you stand like a person with somewhere to be.",
      "The lock clicks. The blinds come down one slat at a time, which is a cruelty, because you have to stand there while the room turns private. Jules does not touch you. That is the filthy part. They lean on the far end of the table and wait: for your palms to find the wood, for you to look back over your shoulder, for you to say it.",
      "“Please.” It comes out under the HVAC. They cross the room slowly enough that you feel each step in your knees. The first kiss lands on the hinge of your jaw, the second under your ear, in the place that makes your knees dishonest. Your skirt goes up an inch at a time. Their knuckles trace the soaked cotton the way a hand traces a sentence it wants to remember, and then they are on the floor, and their tongue takes one long, mean stripe through you and stops, breathing, until you rock back onto their mouth and ask again without words.",
      "They take their time because time is the whole point. Circling. Sucking just enough to make you say their name into your own wrist. Two fingers slide in when you are already shaking and curl until your thighs try to close; they hold you open with a forearm and keep going, patient as a proof, until you come on their tongue with your teeth in your sleeve, ugly and grateful and quieter than you thought you could be.",
      "Only then do they stand. Spit-slick, smiling, unhurried. They push into you in one stroke slow enough to count, a hand on your clit in the same rhythm, their breath on the back of your neck saying nothing at all. You come again with the table edge in your palms, clenching around them, and Jules follows with a sound they will deny in the hallway.",
      "Eleven minutes. The blinds go up one slat at a time. You fix your hair in the black of the screen and they fix your collar, and when the room fills you sit across from each other and you give the pitch, and you are very good, and nobody on the twelfth floor ever finds out why.",
    ],
    keeps: [
      "dishonest knees",
      "the room turns private",
      "patient as a proof",
      "ugly and grateful",
    ],
  },
  {
    slug: "train",
    title: "The last car",
    register: "dirty",
    since: "2026-09-19",
    kicker: "coat, pole, a question asked with a look",
    summary: "Late train. Almost empty. You did not get on this car by accident.",
    body: [
      "Last car. Fluorescent. A balloon from three stops ago stuck to the ceiling. Ren stands close enough that their coat brushes yours when the train leans, and they smell like cold air and the peppermint from the platform.",
      "You look at their mouth. They look at your hand on the pole. The look is the consent form. You nod. Ren’s gloved fingers find the inside of your wrist, the gap in your coat, the heat of you through clothes that were not designed for this.",
      "The tunnel takes the lights. Their hand is already in your underwear, already slick, already rubbing you in tight filthy circles while the car rattles. Nobody is watching. That is the lie you both keep. You come before the announcement finishes saying the name of the stop, biting the collar of your own coat, knees a rumor.",
      "Ren licks their fingers without theater, straightens your coat, and steps off at your stop as if they had only ever been holding the pole. You ride one more. Because you can.",
    ],
    keeps: [
      "the look is the consent form",
      "knees a rumor",
      "without theater",
    ],
  },
];

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const BASE_SECURITY = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Content-Security-Policy":
    "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests",
};

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#14040a"/>
  <circle cx="16" cy="16" r="7" fill="none" stroke="#ff3366" stroke-width="2"/>
  <circle cx="16" cy="16" r="2" fill="#ff3366"/>
</svg>`;

function dayIndex(now = Date.now()) {
  return Math.floor(now / 86400000);
}

function featuredStory(now) {
  return STORIES[dayIndex(now) % STORIES.length];
}

function storyBySlug(slug) {
  return STORIES.find((s) => s.slug === slug) || null;
}

function otherStory(story) {
  return STORIES.find((s) => s.slug !== story.slug) || null;
}

/* The zine keeps its own words. Each piece names the phrases it adds, dated
   to the day it ran, so the language grows one issue at a time and a later
   piece can lean on a phrase an earlier one earned. */
const LEXICON = STORIES.flatMap((story) =>
  (story.keeps || []).map((phrase) => ({ phrase, from: story.slug, register: story.register, since: story.since }))
);

const REGISTER_LINE = Object.freeze({
  slow: "slow · make me wait",
  dirty: "dirty · now",
});

const REGISTER_NAME = Object.freeze({
  slow: "slow and well-written",
  dirty: "quick and dirty",
});

function renderKeeps(story) {
  const items = (story.keeps || []).map((phrase) => `<li>${escapeHtml(phrase)}</li>`).join("");
  if (!items) return "";
  return `<section aria-label="Words this piece keeps">
    <p class="kicker">words this piece keeps · since ${escapeHtml(story.since)}</p>
    <ul>${items}</ul>
  </section>`;
}

function renderParagraphs(lines) {
  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

function layout({ title, description, canonical, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#14040a">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <style>
    :root { color-scheme: dark; --bg:#14040a; --fg:#f3dce4; --muted:#c49aa8; --line:rgba(255,51,102,.28); --accent:#ff3366; }
    * { box-sizing: border-box; }
    body { margin: 0; font: 1.05rem/1.6 ui-serif, Georgia, serif; background: var(--bg); color: var(--fg); }
    main { width: min(40rem, calc(100% - 2rem)); margin: 0 auto; padding: 2.2rem 0 4rem; }
    h1 { font-size: clamp(1.8rem, 5vw, 2.6rem); line-height: 1.05; letter-spacing: -.03em; color: var(--accent); margin: .2rem 0 .5rem; }
    h2 { font-size: 1.35rem; margin: 0 0 .4rem; }
    p { margin: 0 0 1rem; }
    a { color: var(--accent); }
    .kicker, .note, footer { font: .92rem/1.5 ui-sans-serif, system-ui, sans-serif; color: var(--muted); }
    .lede { font-size: 1.15rem; max-width: 36ch; }
    article { border: 1px solid var(--line); border-radius: 1.1rem; padding: 1.2rem 1.15rem 1.3rem; background: #1b0710; margin: 1.2rem 0; }
    details { margin: 1rem 0 0; border-top: 1px dashed var(--line); padding-top: .85rem; }
    summary { cursor: pointer; color: var(--accent); font: .95rem/1.4 ui-sans-serif, system-ui, sans-serif; }
    summary:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
    ul { padding-left: 1.1rem; }
    li { margin: .35rem 0; }
    footer { margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid var(--line); }
  </style>
</head>
<body>
  <main>
    ${body}
    <footer>
      <p>Adults only. 18+. Short, disposable, rewritten when the day turns. No accounts. No feed.</p>
      <p><a href="/">smut.today</a> · <a href="/today.json">today.json</a></p>
    </footer>
  </main>
</body>
</html>`;
}

function renderIndex(now) {
  const featured = featuredStory(now);
  const others = STORIES.filter((s) => s.slug !== featured.slug);
  const list = others
    .map(
      (s) =>
        `<li><a href="/${escapeHtml(s.slug)}/">${escapeHtml(s.title)}</a> — ${escapeHtml(s.summary)}</li>`
    )
    .join("");
  return layout({
    title: "smut.today — today's piece",
    description: "A short erotic scene for today. No account. No feed. Ten minutes if you have them.",
    canonical: "https://smut.today/",
    body: `<header>
  <p class="kicker">smut.today</p>
  <h1>Today’s smut is a scene, not a tab.</h1>
  <p class="lede">One short piece, turned over with the date. Read it. Come. Go back to your life.</p>
</header>
<article>
  <p class="kicker">featured</p>
  <h2><a href="/${escapeHtml(featured.slug)}/">${escapeHtml(featured.title)}</a></h2>
  <p>${escapeHtml(featured.kicker)}</p>
  <p>${escapeHtml(featured.summary)}</p>
</article>
<nav aria-label="Also in the drawer">
  <p class="kicker">also here</p>
  <ul>${list}</ul>
</nav>`,
  });
}

function renderStory(story) {
  const other = otherStory(story);
  const registerLine = REGISTER_LINE[story.register] || REGISTER_LINE.slow;
  const otherLine = other
    ? `<p class="note">The other register: <a href="/${escapeHtml(other.slug)}/">${escapeHtml(other.title)}</a> — ${escapeHtml(REGISTER_NAME[other.register] || "")}.</p>`
    : "";
  return layout({
    title: `${story.title} — smut.today`,
    description: story.summary,
    canonical: `https://smut.today/${story.slug}/`,
    body: `<p class="kicker"><a href="/">smut.today</a> · ${escapeHtml(registerLine)} · ${escapeHtml(story.kicker)}</p>
<article>
  <h1>${escapeHtml(story.title)}</h1>
  ${renderParagraphs(story.body)}
  ${renderKeeps(story)}
</article>
${otherLine}`,
  });
}

function jsonToday(now) {
  const featured = featuredStory(now);
  return {
    site: "smut.today",
    date: new Date(now).toISOString().slice(0, 10),
    featured: featured.slug,
    stories: STORIES.map(({ slug, title, summary, register, since }) => ({ slug, title, summary, register, since })),
    language: LEXICON,
  };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const now = Date.now();
    const cache = "public, max-age=300";

    if (url.hostname.startsWith("www.")) {
      return Response.redirect(`https://smut.today${url.pathname}${url.search}`, 302);
    }

    if (url.pathname === "/favicon.svg") {
      return new Response(FAVICON, {
        headers: {
          ...BASE_SECURITY,
          "Content-Type": "image/svg+xml; charset=UTF-8",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /\n", {
        headers: {
          ...BASE_SECURITY,
          "Content-Type": "text/plain; charset=UTF-8",
          "Cache-Control": cache,
        },
      });
    }

    if (url.pathname === "/today.json") {
      return new Response(JSON.stringify(jsonToday(now), null, 2), {
        headers: {
          ...BASE_SECURITY,
          "Content-Type": "application/json; charset=UTF-8",
          "Cache-Control": cache,
          "X-Robots-Tag": "noindex",
        },
      });
    }

    const htmlHeaders = {
      ...BASE_SECURITY,
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": cache,
      "X-Robots-Tag": "noindex, nofollow",
    };

    if (url.pathname === "/" || url.pathname === "") {
      return new Response(renderIndex(now), { headers: htmlHeaders });
    }

    const slug = url.pathname.replace(/^\/+|\/+$/g, "");
    const story = storyBySlug(slug);
    if (story) {
      return new Response(renderStory(story), { headers: htmlHeaders });
    }

    return new Response("Not found", {
      status: 404,
      headers: {
        ...BASE_SECURITY,
        "Content-Type": "text/plain; charset=UTF-8",
        "Cache-Control": "no-store",
      },
    });
  },
};
