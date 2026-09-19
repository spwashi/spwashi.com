/**
 * smut.today — a small daily erotic zine.
 * Attached only to smut.today. Does not serve spwashi.com.
 */

const STORIES = [
  {
    slug: "meeting",
    title: "Before the meeting",
    kicker: "twelve minutes, glass walls, a lock that actually works",
    summary: "You already know how the pitch will go. You do not know if you can stand up without giving yourself away.",
    setup: [
      "The twelfth-floor conference room still smells like dry-erase and the coffee nobody finished. Your deck is open on the laptop you are not looking at. Two desks over, Jules has been watching your mouth all morning like it is a problem they intend to solve.",
      "You have been wet since the standup. Not poetic-wet. Ruin-your-afternoon wet. Every time you uncross your legs the fabric drags and you have to swallow. Jules notices. Of course they notice. They mouth conference B when the calendar ping hits, and you stand up like a person who has somewhere professional to be.",
      "The lock clicks. Blinds down. Jules does not rush you. That is the filthy part. They wait until you put your palms on the table, until you look back, until you say it.",
    ],
    slow: [
      "“Please.” It comes out quieter than the HVAC. Jules kisses the hinge of your jaw first, then the place under your ear that makes your knees dishonest. Skirt up. Knuckles tracing the soaked cotton like they are reading. They drop to a crouch and drag their tongue in one long, mean stripe, then stop, breathing on you until you rock back onto their mouth.",
      "They take their time. Circling. Sucking just enough. Two fingers slide in when you are already shaking, curling until your thighs try to close and they hold you open with a forearm. You come on their tongue with your wrist in your teeth, ugly and grateful.",
      "Only then do they stand, spit-slick and smiling, and push into you in one unhurried stroke. Slow enough that you feel every inch. A hand on your clit in the same rhythm. You come again, clenching. Jules follows with a sound they will deny in the hallway.",
    ],
    fast: [
      "Blinds. Lock. Jules is on their knees before your back hits the table, panties yanked aside, mouth on your clit like they have been starving since nine. Two fingers, no ceremony. You come in under a minute, shaking, laughing once because it is ridiculous and perfect.",
      "They stand, turn you, fold you over the table, and fuck you hard enough the laptop hops. You come again, muffling it in your own sleeve. Jules spills with a bitten-off groan against your shoulder. You both have eleven minutes to look like people.",
    ],
  },
  {
    slug: "train",
    title: "The last car",
    kicker: "coat, pole, a question asked with a look",
    summary: "Late train. Almost empty. You do not pretend you got on this car by accident.",
    setup: [
      "The last car is fluorescent and rattling and yours. A kid’s balloon from three stops ago is still stuck to the ceiling. Ren stands close enough that their coat brushes yours when the train leans. They smell like cold air and the peppermint they had on the platform.",
      "You look at their mouth. They look at your hand on the pole. The look is the consent form. You nod, small. Ren’s gloved fingers find the inside of your wrist, then the gap of your coat, then the heat of you through clothes that were not designed for this.",
      "Nobody else in the car is paying attention. That is the lie you both agree to keep.",
    ],
    slow: [
      "Ren does not go under your waistband at first. They press, patient, finding the seam and working it until you have to hang on the pole with both hands. Your breath fogs. They watch your face like a map. When you mouth yes they slip inside, two fingers, slow because the train is not, curling in time with the joints in the track.",
      "You come standing, biting the collar of your own coat, knees a rumor. Ren kisses the corner of your mouth like a secret they will not spend. At the next stop they get off first. You ride one more, because you can.",
    ],
    fast: [
      "The tunnel takes the lights. Ren’s hand is already in your clothes, already slick, already rubbing you in tight filthy circles. You come before the station announcement finishes the name of the stop. They lick their fingers without theater, straighten your coat, and step off at yours as if they had only been holding the pole.",
    ],
  },
  {
    slug: "dishes",
    title: "Leave the dishes",
    kicker: "soap, tile, the kind of hunger that lives in a house",
    summary: "The sink is full. You are not going to finish it. That is the point.",
    setup: [
      "Io is behind you with dishwater still on their wrists. The radio is doing something old and too loud. You feel them get hard against the small of your back before they say a word. You keep washing one plate like a person with standards.",
      "“Leave it,” they say into your neck. You leave it. The plate clinks. Their wet hands find your hips, your belly, the button you already knew they would open. The kitchen is the opposite of discreet and you do not care.",
    ],
    slow: [
      "Io kisses down your spine while they work you with a soapy hand that shouldn’t feel this good and does. You brace on the counter, laughing once when a fork skitters into the sink. They drop to their knees on the kitchen mat, tug you back onto their mouth, and eat you like the chores can wait until morning.",
      "You come on their tongue with the tap still running. They stand, turn you, lift you onto the only dry stretch of counter, and push in slow, forehead to yours, fucking you in the rhythm of a house that has decided to be kind. You come again. They follow, biting your shoulder through your shirt.",
    ],
    fast: [
      "Pants down. You up on your toes. Io spits, lines up, and fucks you against the counter with the tap screaming behind you. You come fast, loud, no performance. They come with their mouth open on your name. Someone’s neighbor has opinions. Not your problem tonight.",
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
  return layout({
    title: `${story.title} — smut.today`,
    description: story.summary,
    canonical: `https://smut.today/${story.slug}/`,
    body: `<p class="kicker"><a href="/">smut.today</a> · ${escapeHtml(story.kicker)}</p>
<article>
  <h1>${escapeHtml(story.title)}</h1>
  ${renderParagraphs(story.setup)}
  <details>
    <summary>Slow — make me wait</summary>
    ${renderParagraphs(story.slow)}
  </details>
  <details>
    <summary>Fast — now</summary>
    ${renderParagraphs(story.fast)}
  </details>
</article>`,
  });
}

function jsonToday(now) {
  const featured = featuredStory(now);
  return {
    site: "smut.today",
    date: new Date(now).toISOString().slice(0, 10),
    featured: featured.slug,
    stories: STORIES.map(({ slug, title, summary }) => ({ slug, title, summary })),
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
