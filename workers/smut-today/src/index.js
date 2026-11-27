/**
 * smut.today — a small daily erotic zine, four rooms down one corridor,
 * a letter to the person in the room, and a shelf of book pitches.
 *
 * The reader is an adult who reads porn on purpose. Every piece names its
 * mood, its audience, its pairing, and its length before the door shuts,
 * and then gets out of the way. Scripts optional, zero tracking, zero ads.
 */

import { escapeHtml, securityHeaders } from "../../lib/http.js";
import { rgbOf, squarePng } from "../../lib/png.js";
import { peerScriptPath } from "../../lib/peer-kit.js";
import {
  CARRIED_PINCH,
  CARRIED_TEXT_SCALE,
  CARRIED_TEXT_SCALE_CSS,
  CARRIED_TEXT_SCALE_HEAD,
} from "../../lib/peer-carried.js";
import { DEFAULT_SPW_PRESETS, evalSpwDynamics, highlightSpw, serializeSpwClient } from "./spw.js";

const VERSION = "0.1.2";
const PINCH_PATH = peerScriptPath("pinch-text-scale");

const WORDS_PER_MINUTE = 220;

const STORIES = [
  {
    slug: "after-hours",
    title: "Closing the press",
    register: "slow",
    audience: "For unhurried readers who want sensory craft, withheld touch, and tension held past the last second.",
    since: "2026-11-17",
    cadence: { baseMs: 2800, jitterMs: 900 },
    kicker: "turpentine, rag paper, the last bus already gone",
    summary: "The drying racks are full and your shift ended forty minutes ago. Nadia still has two plates left to wipe.",
    pairing: "Nadia (she/her), master printer · you, the apprentice who stayed",
    tags: ["print studio", "ink on wrists", "held still", "tongue", "slow buildup", "consent asked twice"],
    body: [
      "The Vandercook press clicks as it cools, iron ticking back toward room temperature. Outside, the avenue drains from wet headlights to sodium amber. Nadia wipes black oil ink from a copperplate with the heel of her rag, forearms corded, sleeves rolled above the elbow where a smudge of Prussian blue sits like a thumbprint nobody washed away.",
      {
        text: "You stayed to stack the rag paper because she asked if you wanted a ride home, and neither of you mentioned the rain stopped twenty minutes ago. When she rinses her hands at the deep porcelain sink, she does not reach for a towel. She walks behind your stool instead and sets both cool, damp {slot:touch|palms|knuckles|fingers|mouth} over your collarbones, waiting there until your breathing shifts under them.",
        beat: {
          kind: "linger",
          label: "Hold this moment",
          alt: "Her thumb finds the hollow at the base of your throat and rests on the pulse there—not pressing, only measuring how long it takes you to tilt your head back into her ribs.",
        },
      },
      "“You’re allowed to walk out,” she says near your temple, voice dry as cotton rag. You turn in your stool until your knees bracket hers and pull her apron ties loose with two fingers. The heavy canvas drops around her ankles. Underneath she wears an unbuttoned work shirt and nothing that pretends she isn’t warm.",
      "She keeps your wrists pinned loosely to the edge of the proofing table—not hard, only enough to establish who gets to set the pace. Her mouth starts at the pulse below your jaw and takes an unholy amount of time crossing your sternum. When she slides your trousers down to mid-thigh and parts you with her thumbs, she stops completely just to watch your stomach tighten in the cold studio air.",
      {
        text: "“Ask me properly,” she says, breath brushing the inside of your thigh. When you say {slot:honorific|please|ma’am|don’t stop|right there}, she answers with the flat of her tongue, broad and deliberate, circling until the rag paper rustles behind your elbows. She works two fingers inside you slowly enough that you count every ridge, curling upward against the place that makes your ankles lock around her shoulders while she keeps her eyes open on your face.",
        beat: {
          kind: "sharpen",
          label: "Cut closer",
          alt: "“Don’t look away,” she mutters against your skin, mouth slick, dragging one crooked knuckle deep while her other hand flattens over your hip to keep you from escaping the table.",
        },
      },
      "You come quietly into the crook of your own forearm, hips lifting off the oak while she stays right where she is, humming against you until the aftershocks thin out to shivers. She stands only when your legs go slack, climbs onto the low bench beside you, and pulls you down across her lap with your chest flush to hers so she can grind lazily against your thigh until she breaks too—a sharp, bitten-off curse straight into your collar.",
      "Afterward she hands you a clean shop rag and a paper cup of lukewarm {slot:aftertaste|chamomile|peppermint|tap water|ginger tea} from the kettle by the paper cutter. Her knuckles are red from turpentine and warm water. When she finally unlocks the steel alley door, the street is clean and silver, and she walks you to your bike without letting go of your coat sleeve once.",
    ],
    keeps: [
      "ticking back toward room temperature",
      "nobody washed away",
      "flat of her tongue",
      "without letting go",
    ],
    edition: {
      tease: "Cool, damp {slot:touch|palms} on dry collarbones—waiting there without reaching for a towel until your {slot:honorific|please} changes the speed limit of the room.",
      couplePrompt: "Tonight: agree that the slower person keeps both hands still for sixty seconds before naming what they want.",
      circleNote: "Craft lens: physical labor (ink, rag paper, cooling iron) doubles as pacing clock—try writing an encounter timed to an object cooling down.",
    },
    linger: [
      {
        ask: "Where did the balance tip?",
        say: "At the sink, when she skipped the towel. Cool wet hands on dry skin say more than a speech ever does.",
        shift: "cool hands, dry collarbones, no towel reached for",
      },
      {
        ask: "Why keep your eyes open?",
        say: "Because slow is only slow when both people have to witness the speed limit. Hiding makes it quick.",
        shift: "both people watching the speed limit hold",
      },
      {
        ask: "Go back through at half speed.",
        say: "Start right after the apron drops. Stay at the proofing table until you hear the paper rustle twice.",
        shift: "start where the apron drops. let the paper rustle twice",
        again: true,
      },
    ],
  },
  {
    slug: "dispatch",
    title: "Mile marker 47",
    register: "dirty",
    audience: "For readers who want blunt spoken heat, zero preamble, and kinetic rhythm.",
    since: "2026-11-17",
    cadence: { baseMs: 1100, jitterMs: 450 },
    kicker: "ice machine humming, neon bleeding under the door",
    summary: "You split the same storm corridor in two cars and took adjacent rooms. Nobody made it past the coat rack.",
    pairing: "Mateo (he/him), courier running the same route · you",
    tags: ["motel stop", "spoken filth", "against the wall", "fast", "hands and mouth", "no preamble"],
    body: [
      "Room 11 smells like cedar air freshener and wet wool. You barely have the deadbolt thrown before Mateo’s boots hit the linoleum and his hands catch the waistband of your jeans—not asking about the pass, not shaking off his jacket, just hauling you backward until the light switch clicks off behind your shoulder blades.",
      {
        text: "“I stared at your tail-lights for ninety miles,” he says against your mouth, {slot:touch|teeth|tongue|thumb|knuckles} catching your lower lip until you groan into him. His palm slides straight down the front of your shirt, rough-knuckled and hot from the truck heater. “Tell me you weren’t driving with one hand between your legs around Baker’s Ridge.”",
        beat: {
          kind: "sharpen",
          label: "Say what he asked",
          alt: "“Only past the tunnel,” you admit, grabbing the hair at his nape to pull his mouth back onto yours. He laughs low in his throat and shoves your jeans down around your calves in one impatient yank.",
        },
      },
      "“You’re soaked,” he rasps, thumb parting you through cotton already ruined. No ceremony, no soft lighting—just the green vacancy sign cutting stripes across his collarbone while he drops to his knees on the thin carpet and hooks one of your thighs over his shoulder. His stubble scrapes the inside of your leg and his tongue goes straight to work, hungry and noisy, sucking your clit between his lips while two thick fingers slam home.",
      "You brace one palm flat against the painted cinderblock to stay upright while he fucks you with his hand, wrist turning in crisp, filthy strokes that splash loud against your skin. “Keep talking,” you pant, fingers digging into his shoulder through damp denim, and he looks up from between your legs with spit shining on his chin. “{slot:honorific|Baby|Good girl|Good boy|Look at yourself},” he says, voice wrecked. “Taking my whole hand in a thirty-dollar room.”",
      {
        text: "You break hard enough to slap the drywall, thighs clamping his ears while he rides it out with short, ruthless flicks of his tongue. Before your breath comes back, he is up, kicking off his soaked jeans, rolling a foil wrapper open with his teeth, and pressing you face-first into the stiff motel spread with one hand flat between your shoulder blades.",
        beat: {
          kind: "linger",
          label: "Catch one breath",
          alt: "For two heartbeats he pauses flush over your back, sweating into your neck, giving you time to widen your stance and reach back to guide him home yourself.",
        },
      },
      "He pushes in {slot:paceWord|hard|deep|fast|steady} on the first thrust—heavy, hot, zero hesitation—and sets a brutal, knocking rhythm that makes the headboard thud once before you wedge a pillow behind it with your fist. His grip bruises slightly on your hipbone; yours twists in the coarse sheet until he spills against your back with a ragged {slot:sound|curse|groan|whisper|laugh} and drops his forehead straight between your shoulders.",
      "Ten minutes later the highway wind rattles the windowpane and he is pulling fresh coffee out of a battered thermos on the nightstand. He hands you the lid cup without a word, kisses the sweaty hairline behind your ear, and checks the radar while your knees are still shaking.",
    ],
    keeps: [
      "deadbolt thrown",
      "rough-knuckled and hot",
      "green vacancy sign",
      "without a word",
    ],
    edition: {
      tease: "“I stared at your tail-lights for ninety miles,” he says, {slot:touch|teeth} at your lower lip—not even taking off the wet jacket before the deadbolt throws.",
      couplePrompt: "Tonight: skip the warm-up talk; describe the first thirty seconds when one of you walks through the door.",
      circleNote: "Craft lens: ambient budget motel cues (thermos, ice machine, drywall) make fast heat credible—where does speed feel earned rather than rushed?",
    },
    linger: [
      {
        ask: "Why didn’t either of you unpack?",
        say: "Because the whole point of mile marker 47 is not pretending you are staying for breakfast.",
        shift: "nobody unpacked; nobody lied about staying till morning",
      },
      {
        ask: "What ruined you faster—the mouth or the talking?",
        say: "The talking. Cold motel glass and a voice that does not edit itself once the lock catches.",
        shift: "the voice that stopped editing the second the lock caught",
      },
      {
        ask: "Hit it from the deadbolt again.",
        say: "Skip the first line. Go straight to the light switch clicking off behind your shoulder blades.",
        shift: "straight to the light switch clicking behind your shoulders",
        again: true,
      },
    ],
  },
  {
    slug: "threshold",
    title: "Salt on the counter",
    register: "warm",
    audience: "For readers who want domestic affection, unforced humor, shared breath, and greedy closeness.",
    since: "2026-11-17",
    cadence: { baseMs: 1900, jitterMs: 650 },
    kicker: "rain on the skylight, wooden spoon, nobody dressed for company",
    summary: "You both meant to cook dinner properly. Instead, Eli steals an olive off your thumb and forgets the burner is off.",
    pairing: "Eli (they/them), years in and still greedy · you",
    tags: ["domestic warmth", "teasing", "laughter mid-kiss", "mouths and hands", "familiar touch", "aftercare baked in"],
    body: [
      "The garlic is already minced and the pot isn’t even warm yet when Eli crowds you back against the butcher block, hips settling between yours with the shameless ease of someone who knows where all the drawers stick. They smell like cedar soap, rosemary, and the wool sweater they stole from your closet three winters ago.",
      {
        text: "“Taste,” they say, holding a brined olive between two fingers right at your {slot:touch|mouth|lips|chin|throat}, except when you part for it they nudge it against your bottom lip slowly and kiss the salt right off instead. You laugh against them, hands slipping up under the hem of their oversized sweater where the skin over their ribs is always {slot:temperature|three degrees warmer|fever-warm|flush with heat|soft under wool} than yours.",
        beat: {
          kind: "linger",
          label: "Stay in the laugh",
          alt: "Eli grins into your cheek, nose cold from stepping onto the porch for herbs, and murmurs, “Dinner was a polite fiction twenty minutes ago,” before lifting you onto the counter next to the cutting board.",
        },
      },
      "You kick a flour canister sideways with your heel as they step right up into the V of your knees. Nothing about this is rehearsed or stern—Eli’s thumbs hook your pajama waist down with an affectionate tug, kissing the crease of your hipbone like they’re greeting an old friend they missed all Tuesday.",
      "When their mouth meets you, it isn’t hurried theater; it is an absurdly specific education in everything you like. Two slow passes flat and warm, a soft hum right over your clit that makes your heels dig into their lower back, and then one finger gliding easily inside because you’ve been winding each other up since noon.",
      {
        text: "“Wait—look at me,” you gasp, grabbing the front of their sweater because you want to see their eyelashes flutter when you arch. Eli looks up immediately, mouth shining, smiling crookedly around the edge of the syllable as they slide a second finger beside the first and press their palm down gently against your lower belly so the angle catches everything.",
        beat: {
          kind: "sharpen",
          label: "Turn the heat up",
          alt: "“You’re getting prettier every time you talk back, {slot:honorific|sweetheart|trouble|gorgeous|love},” Eli mutters, rolling their wrist sharper until your knees tremble against their ears and laughter turns straight into a sharp whine.",
        },
      },
      "You come clinging to their shoulders with your forehead pressed to their temple, half-crying with relief while they keep whispering nonsense praise into your hair. Before you catch your breath, you drag them up beside you on the wide lip of the sink, tugging their sweats down until you can wrap your slick hand around them—thumbing the wet tip while you kiss them slow and messy, sharing the taste of you until Eli bucks into your fist with a shaky {slot:sound|laugh|sigh|groan|cry} that turns into a long, shuddering groan against your neck.",
      "Eli fetches two damp washcloths from the utility drawer, wipes your thighs clean with absurd tenderness, and drops their forehead against your collarbone while the rain beats silver across the skylight. Five minutes later you turn the stove back on in nothing but two unmatched socks and the same borrowed sweater.",
    ],
    keeps: [
      "where all the drawers stick",
      "polite fiction",
      "specific education",
      "unmatched socks",
    ],
    edition: {
      tease: "“Taste,” Eli says with an olive at your {slot:touch|mouth}, grinning against your skin: dinner was a polite fiction twenty minutes ago.",
      couplePrompt: "Tonight: pause halfway through a mundane chore and refuse to explain why you’re grinning until the other person guesses.",
      circleNote: "Craft lens: laughter mid-climax dissolves stiffness fast—notice how humor raises stakes by making both characters dangerously unguarded.",
    },
    linger: [
      {
        ask: "Why does laughter make it hotter?",
        say: "Because nobody is performing invulnerability. If you can grin mid-sentence and still fall apart thirty seconds later, the room is actually safe.",
        shift: "no performance; just safe enough to laugh and fall apart",
      },
      {
        ask: "Who turns the burner back on?",
        say: "Whichever one remembers first—and even then, dinner is going to be twenty minutes late and nobody cares.",
        shift: "the garlic is still on the board; dinner can wait",
      },
      {
        ask: "Take the kitchen counter again.",
        say: "Go back to the olive at your bottom lip. Don’t rush past the part where they smile against your mouth.",
        shift: "back to the olive. stay inside the grin",
        again: true,
      },
    ],
  },
  {
    slug: "dossier",
    title: "Clause four",
    register: "sharp",
    audience: "For readers who want negotiated authority, crisp protocol, and precise psychological edge.",
    since: "2026-11-17",
    cadence: { baseMs: 3200, jitterMs: 850 },
    kicker: "brass desk lamp, fountain pen, three rules spoken before touching",
    summary: "Every Tuesday she drafts the terms on heavy cream cardstock. Tonight you asked her to underline clause four twice.",
    pairing: "Dr. Vale (she/her) · you, who signed the margin",
    tags: ["structured protocol", "praise and edge", "kneeling", "spoken terms", "controlled pace", "clear safeword"],
    body: [
      "The study holds one warm cone of light from the green glass banker’s lamp; everything outside it is bookshelves and quiet street noise three floors down. Dr. Vale sits in the leather wingback with a fountain pen capped beside a single index card. You kneel on the folded wool rug to the left of her knee, posture {slot:stance|straight|still|open|composed}, hands open palms-up on your thighs because that was clause one.",
      {
        text: "“Color check first,” she says, voice calm and exact. “{slot:checkWord|Green|Steady|Clear|Ready},” you answer without shifting. She sets a brass kitchen timer face-down on the desk blotter so only she sees the dial, then reaches down to tilt your chin up with two dry knuckles. “Clause four,” she reads smoothly. “You do not touch yourself, and you do not come without naming the exact sensation that would push you over.”",
        beat: {
          kind: "sharpen",
          label: "Read the fine print",
          alt: "“If you lose words,” she adds, {slot:touch|thumb|knuckle|fingertip|pen} stroking once across your lower lip, “we drop back down to stillness for sixty seconds and start over. Clear?”",
        },
      },
      "“Yes, {slot:honorific|ma’am|doctor|sir|mistress}.” Your pulse kicks clean into your throat. She leans forward and unbuttons your collar one notch at a time, taking infuriating care not to brush your collarbone until the shirt hangs open. Then her bare hand slides down your ribcage—firm, cool, unhurried—stopping flush over your navel until your stomach flattens under the pressure.",
      "She stands, guides you cleanly onto the low ottoman with your thighs parted over the leather edge, and kneels in front of you in tailored slacks without once breaking composure. Her first touch between your legs is dry fingertips framing you cleanly, testing how wet you already are before she lets out a quiet, approving breath. “Good. You kept your head all week.”",
      {
        text: "When she puts her mouth on you, the control is terrifyingly precise: flat broad strokes until your hips lift off the leather, then an immediate pause—just her warm breath hovering an inch away while her fingers press into your inner thighs to hold you still. “Name it,” she orders softly. “Your tongue at the top edge,” you manage, voice thin. She rewards the precision immediately: two thick, steady passes right there until your knees shake, followed by two fingers sinking deep and stroking smoothly against the front wall.",
        beat: {
          kind: "linger",
          label: "Hold the edge",
          alt: "Twice more she brings you right up to the shelf—letting heat flood behind your eyelids—and stops dead the instant your heels dig into the rug, making you articulate every millimeter before she resumes.",
        },
      },
      "On the fourth climb you barely hold syntax together: “Your thumb circling while your fingers stay still—please, {slot:honorific|ma’am|doctor|sir|mistress}, that’s it.” She doesn’t hesitate. She holds the exact rhythm she promised, speaking steady low praise against your hipbone until you break violently, arching off the ottoman with both hands white-knuckled on its sides while she anchors you cleanly through the crest.",
      "When the timer rings softly from the blotter three minutes later, you are wrapped in her cashmere cardigan on the rug, sipping cold mineral water from a heavy tumbler while she initials the index card in wet black ink and drops it into the cedar box between you.",
    ],
    keeps: [
      "hands open palms-up",
      "timer face-down",
      "kept your head all week",
      "initialed in wet black ink",
    ],
    edition: {
      tease: "“You do not come,” she reads from clause four, “without naming the exact sensation that pushes you over.” Answer cleanly—{slot:honorific|ma’am} is listening.",
      couplePrompt: "Tonight: write three short rules on a scrap of paper before undressing, and require plain spoken syntax right at the brink.",
      circleNote: "Craft lens: forcing articulate speech inside peak arousal creates instant dramatic friction—test what happens when consent rules double as dirty talk.",
    },
    linger: [
      {
        ask: "Why write three lines down beforehand?",
        say: "Because ambiguity is sloppy. When the boundary is inked in daylight, nobody has to guess how far the floor can drop.",
        shift: "ambiguity is sloppy; ink in daylight sets the floor free",
      },
      {
        ask: "Was stopping hardest, or naming it?",
        say: "Naming it. Having to use clean English right when your body wants only vowels.",
        shift: "clean English required at the exact moment you only want vowels",
      },
      {
        ask: "Go back to clause one.",
        say: "Sit straight on the wool rug. Wait for the fountain pen cap to click before moving a finger.",
        shift: "back on the rug. wait for the fountain pen cap to click",
        again: true,
      },
    ],
  },
];

const LETTER = {
  slug: "to-you",
  title: "For the one who sits",
  kicker: "not a follower. a person in the room.",
  body: [
    "I keep meaning to say this without making it a caption. You sit and the room has a job. I draw, I write, I ruin a paragraph trying to keep up with a mouth I am not allowed to rush.",
    "This site is the private heat. The periodical next door is the public one: Wondering About Pi, a pie that is also a proof. You would look ridiculous and perfect holding the 22/7 issue to a camera. I will not tell anyone what the letters are for. They already know.",
    "If we work, we work like this: you in the chair, me on the sentence, both of us pretending the oven is the only thing that is hot. Come sit. Bring the look you use when you are about to laugh.",
  ],
};

const PITCHES = [
  {
    slug: "ministry",
    title: "The Ministry of Circumference",
    hook: "A math office that files wonders about a number that never ends. Domestic. Exact. Warm.",
    why: "A premise you can hold up to a camera without a synopsis. A ministry. A pie. A proof that flakes.",
  },
  {
    slug: "issue-pie",
    title: "Issue pie",
    hook: "A periodical that arrives the way a pie arrives: steam, a knife, a claim.",
    why: "Short enough for a stitch. Serious enough for a shelf. The innuendo is optional and not printed.",
  },
  {
    slug: "sits-for-proofs",
    title: "She sits for the proof",
    hook: "A sitting. A circle. A kitchen that is also a department of wonder.",
    why: "The model is the argument. The math is the alibi. The comments will do the rest.",
  },
];

/* Where the leave link goes. Somewhere boring, loads fast, explains nothing. */
const LEAVE_URL = "https://en.wikipedia.org/wiki/Main_Page";

/* The site talking to itself, one line a day, under the door. */
const MURMURS = [
  "Turpentine, neon, kitchen salt, brass ink. Four doors down the same corridor.",
  "You came here for a scene. Stay for the sentence you did not expect to keep.",
  "Slow, dirty, warm, sharp: every reader deserves a door built for how they actually want it.",
  "Nobody on this page is in a rush. Even the fast door waits for your signal first.",
  "Read it once for the heat. Open a margin beat for the edge you almost missed.",
  "The press, the deadbolt, the olive, the timer. Small things carry the weight here.",
  "You do not owe anyone an explanation for the tab you have open.",
];

function murmur(now) {
  return MURMURS[dayIndex(now) % MURMURS.length];
}

const BASE_SECURITY = securityHeaders({
  corp: "same-origin",
  csp: "default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self'; connect-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
});

const SMUT_BG = rgbOf("#11090c");
const SMUT_CRIMSON = rgbOf("#d85a73");
const SMUT_RING_SOFT = rgbOf("#572330");

function smutIconPng(size, { scale = 1 } = {}) {
  return squarePng(size, (x, y) => {
    const u = (x / size - 0.5) / scale;
    const v = (y / size - 0.5) / scale;
    const d = Math.hypot(u, v);
    if (d <= 0.085) return SMUT_CRIMSON;
    if (d >= 0.23 && d <= 0.30) return SMUT_CRIMSON;
    if (d >= 0.36 && d <= 0.39) return SMUT_RING_SOFT;
    return SMUT_BG;
  });
}

const ICONS = Object.freeze({
  "icon-192.png": { size: 192 },
  "icon-512.png": { size: 512 },
  "icon-maskable-512.png": { size: 512, scale: 0.78 },
  "apple-touch-icon.png": { size: 180 },
});

const MANIFEST = Object.freeze({
  name: "smut.today",
  short_name: "smut.today",
  description: "Four rooms down one corridor. Short explicit fiction for adults.",
  id: "/",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#11090c",
  theme_color: "#11090c",
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
  ],
  shortcuts: [
    { name: "Today", url: "/", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
    { name: "The letter", url: "/to-you/", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
    { name: "Settle in", url: "/settle/", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
  ],
});

const STORY_SLUGS = STORIES.map((s) => `/${s.slug}/`);
const SW_JS = `const CACHE = "smut-today-${VERSION}";
const KEPT = ${JSON.stringify([
  "/",
  "/to-you/",
  "/pitches/",
  ...STORY_SLUGS,
  "/app.js",
  "/text-scale-head.js",
  "/text-scale.js",
  "/text-scale.css",
  PINCH_PATH,
  "/favicon.svg",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
])};

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(KEPT)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("smut-today-") && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/settle")) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && !res.headers.get("Set-Cookie")) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit ?? (req.mode === "navigate" ? caches.match("/") : Response.error())))
  );
});
`;

const APP_JS = `(() => {
  if ("serviceWorker" in navigator && window.top === window) navigator.serviceWorker.register("/sw.js").catch(() => {});

  /* 1. The peer kit pinches the words (70%–120%, key "set.text-scale/1"). The button below uses the same step. */
  const STEPS = ["70", "80", "90", "100", "110", "120"];
  const TEXT_KEY = "set.text-scale/1";
  const ROOM_KEY = "set.spw-room/1";
  const getScale = () => {
    const v = document.documentElement.getAttribute("data-text-scale");
    return STEPS.includes(v) ? v : "100";
  };
  let kitSet = null;
  const setScale = (step) => {
    if (kitSet) { kitSet(step); return; }
    if (!STEPS.includes(step)) return;
    if (step === "100") document.documentElement.removeAttribute("data-text-scale");
    else document.documentElement.setAttribute("data-text-scale", step);
    try {
      if (step === "100") localStorage.removeItem(TEXT_KEY);
      else localStorage.setItem(TEXT_KEY, step);
    } catch {}
  };
  const main = document.querySelector("main");
  import("/text-scale.js").then(({ mountTextScale, setTextScale }) => {
    kitSet = setTextScale;
    if (main) mountTextScale(main, { ignore: ".spw-editor, .word-slot, .room-dial, .corridor" });
  }).catch(() => {});

  /* 2. PWA controls & privacy sweep on Forget me. */
  const keep = document.getElementById("keep-app");
  const pwaNote = document.getElementById("pwa-status");
  const isStandalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  if (pwaNote) {
    if (!navigator.onLine) { pwaNote.textContent = "Offline — reading saved copy on device."; pwaNote.hidden = false; }
    else if (isStandalone) { pwaNote.textContent = "Kept privately on this device. Tapping Forget clears saved offline copies too."; pwaNote.hidden = false; }
    else if (isIos) { pwaNote.textContent = "For offline reading on iOS: tap Share, then Add to Home Screen."; pwaNote.hidden = false; }
  }
  let offer = null;
  if (keep) {
    addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      offer = e;
      keep.hidden = false;
    });
    keep.addEventListener("click", async () => {
      if (!offer) return;
      offer.prompt();
      await offer.userChoice.catch(() => null);
      offer = null;
      keep.hidden = true;
    });
    addEventListener("appinstalled", () => {
      keep.hidden = true;
      if (pwaNote) { pwaNote.textContent = "Kept offline on this device."; pwaNote.hidden = false; }
    });
  }
  const forgetBtn = document.querySelector('form.settle button[name="forget"]');
  forgetBtn?.addEventListener("click", async () => {
    try { localStorage.removeItem(TEXT_KEY); localStorage.removeItem(ROOM_KEY); } catch {}
    try {
      if ("caches" in window) {
        for (const k of await caches.keys()) {
          if (k.startsWith("smut-today-")) await caches.delete(k);
        }
      }
      const regs = await navigator.serviceWorker?.getRegistrations?.();
      if (regs) await Promise.all(regs.map((r) => r.unregister()));
    } catch {}
  });

  /* 3. Scroll-tracking crimson reading thread on prose/letter pages. */
  const prose = document.querySelector(".prose");
  const thread = document.querySelector(".reading-thread");
  if (prose && thread) {
    const syncThread = () => {
      const rect = prose.getBoundingClientRect();
      const total = Math.max(1, prose.offsetHeight - window.innerHeight * 0.65);
      const passed = Math.min(total, Math.max(0, -rect.top + window.innerHeight * 0.2));
      thread.style.setProperty("--read-progress", (passed / total).toFixed(4));
    };
    addEventListener("scroll", syncThread, { passive: true });
    addEventListener("resize", syncThread, { passive: true });
    syncThread();
  }

  /* 4. Scene chamber: "One breath at a time", "Voices only", keyboard stepping, and scale step. */
  const paras = prose ? [...prose.querySelectorAll(":scope > p, .beat-wrap > p")] : [];
  const focusBtn = document.getElementById("focus-toggle");
  const breathCount = document.getElementById("breath-count");
  let focusedIdx = -1;
  const paintFocus = () => {
    if (!prose || !focusBtn) return;
    const on = focusedIdx >= 0;
    prose.classList.toggle("is-focused", on);
    focusBtn.setAttribute("aria-pressed", String(on));
    focusBtn.textContent = on ? "Open full page" : "One breath";
    paras.forEach((p, idx) => p.classList.toggle("is-lit", !on || idx === focusedIdx));
    if (breathCount) {
      breathCount.textContent = on ? (focusedIdx + 1) + " / " + paras.length : "";
      breathCount.hidden = !on;
    }
    if (on && paras[focusedIdx]) paras[focusedIdx].scrollIntoView({ behavior: document.documentElement.dataset.move === "still" ? "auto" : "smooth", block: "center" });
  };
  if (prose && focusBtn && paras.length) {
    focusBtn.hidden = false;
    focusBtn.addEventListener("click", () => {
      focusedIdx = focusedIdx >= 0 ? -1 : 0;
      paintFocus();
    });
    paras.forEach((p, idx) => {
      p.addEventListener("click", (e) => {
        if (focusedIdx < 0 || e.target.closest(".beat-note")) return;
        if (idx === focusedIdx) {
          focusedIdx = idx + 1 < paras.length ? idx + 1 : -1;
        } else {
          focusedIdx = idx;
        }
        paintFocus();
      });
    });
    addEventListener("keydown", (e) => {
      if (focusedIdx < 0 || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        focusedIdx = Math.min(paras.length - 1, focusedIdx + 1);
        paintFocus();
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        focusedIdx = Math.max(0, focusedIdx - 1);
        paintFocus();
      }
    });
  }

  const voicesBtn = document.getElementById("voices-toggle");
  if (prose && voicesBtn && paras.length) {
    const voiced = paras.filter((p) => /[“”"]/.test(p.textContent));
    if (voiced.length) {
      voiced.forEach((p) => p.classList.add("has-voice"));
      voicesBtn.hidden = false;
      voicesBtn.addEventListener("click", () => {
        const next = voicesBtn.getAttribute("aria-pressed") !== "true";
        voicesBtn.setAttribute("aria-pressed", String(next));
        prose.classList.toggle("is-voices", next);
      });
    }
  }

  const scaleBtn = document.getElementById("scale-step");
  if (scaleBtn) {
    const CYCLE = ["90", "100", "110", "120"];
    const paintScaleBtn = () => { scaleBtn.textContent = "Text " + getScale() + "%"; };
    scaleBtn.hidden = false;
    paintScaleBtn();
    scaleBtn.addEventListener("click", () => {
      const cur = getScale();
      const idx = CYCLE.indexOf(cur);
      const next = CYCLE[(idx + 1) % CYCLE.length];
      setScale(next);
      paintScaleBtn();
    });
  }

  document.querySelectorAll("details.beat-note").forEach((note) => {
    note.addEventListener("toggle", () => {
      if (!note.open) return;
      note.dataset.turn = "true";
      setTimeout(() => { delete note.dataset.turn; }, 260);
    });
  });

  /* 4b. Room dial on "/" — instant oklab temperature + shelf filter with ?mood= URL parity. */
  const dial = document.getElementById("room-dial");
  const shelf = document.querySelector("ul.pieces");
  const dialStatus = document.getElementById("dial-status");
  if (dial && shelf) {
    const pills = [...dial.querySelectorAll("a[data-mood]")];
    const applyMood = (mood, push = true) => {
      const next = mood || "all";
      if (next === "all") delete document.documentElement.dataset.moodTint;
      else document.documentElement.dataset.moodTint = next;
      pills.forEach((a) => {
        if (a.dataset.mood === next) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
      let visible = 0;
      shelf.querySelectorAll(":scope > li").forEach((li) => {
        const card = li.querySelector("[data-register]");
        const show = next === "all" || (card && card.dataset.register === next);
        li.hidden = !show;
        if (show) visible += 1;
      });
      if (dialStatus) {
        dialStatus.textContent = next === "all"
          ? "Showing all four doors in the corridor."
          : "Tuned to " + next + " — " + visible + (visible === 1 ? " scene open below." : " scenes open below.");
      }
      if (push && "replaceState" in history) {
        const target = next === "all" ? "/" : "/?mood=" + encodeURIComponent(next);
        history.replaceState(null, "", target);
      }
    };
    dial.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-mood]");
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      applyMood(a.dataset.mood, true);
    });
    document.querySelectorAll(".registers a[data-mood]").forEach((a) => {
      a.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        applyMood(a.dataset.mood, true);
        shelf.scrollIntoView({ behavior: document.documentElement.dataset.move === "still" ? "auto" : "smooth", block: "nearest" });
      });
    });
  }

  /* 4c. Configurable steamy word slots & editorial screenshot framing. */
  const slotState = (() => {
    try { return JSON.parse(localStorage.getItem(ROOM_KEY) || "{}") || {}; } catch { return {}; }
  })();
  const saveRoomState = (patch) => {
    Object.assign(slotState, patch);
    try { localStorage.setItem(ROOM_KEY, JSON.stringify(slotState)); } catch {}
  };
  const paintSlots = (overrides = {}) => {
    document.querySelectorAll(".word-slot[data-slot]").forEach((btn) => {
      const key = (btn.dataset.slot || "").toLowerCase();
      const val = overrides[key] || (slotState.words && slotState.words[key]);
      if (val) btn.textContent = val;
    });
  };
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".word-slot[data-slot]");
    if (!btn) return;
    const key = (btn.dataset.slot || "").toLowerCase();
    const choices = (btn.dataset.choices || "").split("|").filter(Boolean);
    if (!choices.length) return;
    const cur = btn.textContent.trim();
    const idx = choices.indexOf(cur);
    const next = choices[(idx + 1) % choices.length];
    const words = { ...(slotState.words || {}), [key]: next };
    saveRoomState({ words });
    paintSlots(words);
    btn.dataset.turn = "true";
    setTimeout(() => { delete btn.dataset.turn; }, 240);
  });

  document.addEventListener("click", (e) => {
    const shotBtn = e.target.closest("[data-shot-btn]");
    if (!shotBtn) return;
    const card = shotBtn.closest(".tease-shot");
    const nextClean = document.documentElement.dataset.shot !== "clean";
    if (nextClean) {
      document.documentElement.dataset.shot = "clean";
      card?.setAttribute("data-shot-focus", "true");
      shotBtn.textContent = "Exit frame";
      shotBtn.setAttribute("aria-pressed", "true");
    } else {
      delete document.documentElement.dataset.shot;
      document.querySelectorAll("[data-shot-focus]").forEach((el) => el.removeAttribute("data-shot-focus"));
      document.querySelectorAll("[data-shot-btn]").forEach((b) => {
        b.textContent = "Frame card";
        b.setAttribute("aria-pressed", "false");
      });
    }
  });

  /* 4d. Short & variable timeouts ("Timed unfold") calibrated to mood, syntax, and Spw pause. */
  const timedBtn = document.getElementById("timed-toggle");
  const timedBar = document.getElementById("timed-bar");
  const timedFill = document.getElementById("timed-fill");
  const timedLabel = document.getElementById("timed-label");
  const timedSkip = document.getElementById("timed-skip");
  let timedBaseOverride = null;
  let timedHandle = 0;
  let timedIdx = -1;
  const beatNodes = prose ? [...prose.querySelectorAll(":scope > p, .beat-wrap")] : [];
  const nextTimedDelay = (node, idx) => {
    const still = document.documentElement.dataset.move === "still" || matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) return 150;
    const base = timedBaseOverride || Number(timedBtn?.dataset.baseMs) || 2000;
    const jitter = Number(timedBtn?.dataset.jitterMs) || 600;
    const txt = node.textContent || "";
    const words = txt.split(/\s+/).length;
    const weight = Math.min(1.45, Math.max(0.65, words / 42));
    const wave = ((idx * 37) % 100) / 100 - 0.5;
    return Math.max(550, Math.round(base * weight + wave * jitter));
  };
  const stopTimed = () => {
    clearTimeout(timedHandle);
    timedHandle = 0;
    timedIdx = -1;
    prose?.classList.remove("is-timed");
    beatNodes.forEach((n) => n.classList.remove("is-veiled", "is-current-beat"));
    if (timedBar) timedBar.hidden = true;
    if (timedBtn) {
      timedBtn.setAttribute("aria-pressed", "false");
      timedBtn.textContent = "Timed unfold";
    }
  };
  const stepTimed = () => {
    if (timedIdx < 0) return;
    if (timedIdx >= beatNodes.length) {
      stopTimed();
      return;
    }
    clearTimeout(timedHandle);
    const node = beatNodes[timedIdx];
    beatNodes.forEach((n, i) => {
      n.classList.toggle("is-veiled", i > timedIdx);
      n.classList.toggle("is-current-beat", i === timedIdx);
    });
    node.scrollIntoView({ behavior: document.documentElement.dataset.move === "still" ? "auto" : "smooth", block: "center" });
    if (timedIdx + 1 >= beatNodes.length) {
      if (timedLabel) timedLabel.textContent = "Final beat reached.";
      if (timedFill) timedFill.style.transform = "scaleX(1)";
      return;
    }
    const ms = nextTimedDelay(node, timedIdx);
    if (timedLabel) timedLabel.textContent = "Next beat in " + (ms / 1000).toFixed(1) + "s";
    if (timedFill) {
      timedFill.style.transition = "none";
      timedFill.style.transform = "scaleX(0)";
      void timedFill.offsetWidth;
      timedFill.style.transition = "transform " + ms + "ms linear";
      timedFill.style.transform = "scaleX(1)";
    }
    timedHandle = setTimeout(() => {
      timedIdx += 1;
      stepTimed();
    }, ms);
  };
  if (prose && timedBtn && beatNodes.length > 1) {
    timedBtn.hidden = false;
    timedBtn.addEventListener("click", () => {
      if (timedIdx >= 0) {
        stopTimed();
      } else {
        timedIdx = 0;
        prose.classList.add("is-timed");
        timedBtn.setAttribute("aria-pressed", "true");
        timedBtn.textContent = "Show whole page";
        if (timedBar) timedBar.hidden = false;
        stepTimed();
      }
    });
    timedSkip?.addEventListener("click", () => {
      if (timedIdx < 0) return;
      timedIdx += 1;
      stepTimed();
    });
  }

  /* 5. Interactive "Words this piece keeps" -> locate and pulse phrase right in the prose without breaking .word-slot buttons. */
  const escapeRe = (s) => s.replace(/[.*+?^$\{\}()|[\\]\\\\]/g, "\\\\$&");
  document.querySelectorAll(".keeps li").forEach((li) => {
    const phrase = li.textContent.trim();
    if (!prose || !phrase) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "keep-jump";
    btn.textContent = phrase;
    btn.title = "Find this phrase in the piece";
    li.replaceChildren(btn);
    btn.addEventListener("click", () => {
      prose.querySelectorAll("mark.prose-echo").forEach((m) => m.replaceWith(document.createTextNode(m.textContent)));
      const re = new RegExp(escapeRe(phrase), "i");
      for (const p of paras) {
        const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
        let node;
        let matched = false;
        while ((node = walker.nextNode())) {
          const hit = node.nodeValue.match(re);
          if (!hit) continue;
          const idx = hit.index;
          const val = node.nodeValue;
          const frag = document.createDocumentFragment();
          if (idx > 0) frag.append(document.createTextNode(val.slice(0, idx)));
          frag.append(Object.assign(document.createElement("mark"), { className: "prose-echo", textContent: val.slice(idx, idx + hit[0].length) }));
          if (idx + hit[0].length < val.length) frag.append(document.createTextNode(val.slice(idx + hit[0].length)));
          node.parentNode.replaceChild(frag, node);
          matched = true;
          break;
        }
        if (matched) {
          p.scrollIntoView({ behavior: document.documentElement.dataset.move === "still" ? "auto" : "smooth", block: "center" });
          break;
        }
      }
    });
  });

  /* 6. Interactive murmur cycle, .end closing whisper, 22/7 letter note & colophon pace slider. */
  const murmurEl = document.querySelector(".murmur");
  const MURMURS_ALL = ${JSON.stringify(MURMURS)};
  if (murmurEl && MURMURS_ALL.length > 1) {
    murmurEl.setAttribute("role", "button");
    murmurEl.tabIndex = 0;
    murmurEl.title = "Tap for another line under the door";
    let at = Math.max(0, MURMURS_ALL.indexOf(murmurEl.textContent.trim()));
    const nextMurmur = () => {
      at = (at + 1) % MURMURS_ALL.length;
      murmurEl.dataset.turn = "true";
      murmurEl.textContent = MURMURS_ALL[at];
      setTimeout(() => { delete murmurEl.dataset.turn; }, 220);
    };
    murmurEl.addEventListener("click", nextMurmur);
    murmurEl.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nextMurmur(); } });
  }

  document.querySelectorAll(".end").forEach((end) => {
    end.removeAttribute("aria-hidden");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "end-btn";
    btn.textContent = end.textContent;
    btn.title = "Tap";
    end.replaceChildren(btn);
    const whisper = document.createElement("p");
    whisper.className = "end-whisper note";
    whisper.hidden = true;
    whisper.innerHTML = 'Nothing here kept your name. <a href="#main">Top</a> · <a href="/">Today</a>';
    end.after(whisper);
    btn.addEventListener("click", () => { whisper.hidden = !whisper.hidden; });
  });

  /* Highlight 22/7 reference inside /to-you/ letter when hovered or tapped. */
  if (location.pathname.startsWith("/to-you") && prose) {
    for (const p of paras) {
      if (!p.textContent.includes("22/7")) continue;
      p.innerHTML = p.innerHTML.replace(/22\\/7/, '<a class="pi-wink" href="https://wap.mom/22-7/" title="The periodical next door (off by 1 part in 2,500)">22/7</a>');
      break;
    }
  }

  /* 7. Hidden Spw room parser & syntactically-highlighted configuration panel. */
` + "  " + serializeSpwClient() + `
  const spwDoor = document.getElementById("spw-door");
  const spwPanel = document.getElementById("spw-panel");
  const spwInput = document.getElementById("spw-input");
  const spwHl = document.getElementById("spw-hl");
  const spwStatus = document.getElementById("spw-status");
  const applySpwExpression = (src, persist = true) => {
    if (spwHl) spwHl.innerHTML = highlightSpw(src) + "\\n";
    const { config, ast } = evalSpwDynamics(src);
    if (spwStatus) {
      const errCount = ast.errors.length;
      spwStatus.textContent = errCount
        ? ast.errors[0].message + " (char " + ast.errors[0].pos + ")"
        : ast.frames.length + " Spw frames · pause " + (config.pauseMs ? config.pauseMs + "ms" : "story default");
      spwStatus.dataset.valid = errCount ? "false" : "true";
    }
    if (config.mood) {
      if (config.mood === "all") delete document.documentElement.dataset.moodTint;
      else document.documentElement.dataset.moodTint = config.mood;
    }
    if (config.pauseMs) timedBaseOverride = config.pauseMs;
    if (config.scale) setScale(config.scale);
    if (Object.keys(config.words).length) paintSlots(config.words);
    if (config.focus === "voices" && voicesBtn && prose && !prose.classList.contains("is-voices")) voicesBtn.click();
    if (config.focus === "breath" && focusBtn && paras.length && focusedIdx < 0) { focusedIdx = 0; paintFocus(); }
    if (config.focus === "full" && focusBtn && focusedIdx >= 0) { focusedIdx = -1; paintFocus(); }
    if (persist) saveRoomState({ spw: src, words: { ...(slotState.words || {}), ...config.words } });
  };
  if (spwDoor && spwPanel && spwInput) {
    const syncScroll = () => {
      if (!spwHl) return;
      spwHl.scrollTop = spwInput.scrollTop;
      spwHl.scrollLeft = spwInput.scrollLeft;
    };
    spwInput.addEventListener("scroll", syncScroll);
    spwInput.addEventListener("input", () => applySpwExpression(spwInput.value, true));
    spwPanel.querySelectorAll("[data-spw-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const expr = DEFAULT_SPW_PRESETS[btn.dataset.spwPreset] || "";
        if (!expr) return;
        spwInput.value = expr;
        applySpwExpression(expr, true);
      });
    });
    document.getElementById("spw-reset")?.addEventListener("click", () => {
      timedBaseOverride = null;
      delete document.documentElement.dataset.moodTint;
      try { localStorage.removeItem(ROOM_KEY); } catch {}
      location.reload();
    });
    const toggleSpwPanel = () => {
      const open = spwPanel.hidden;
      spwPanel.hidden = !open;
      spwDoor.setAttribute("aria-expanded", String(open));
      if (open) {
        if (spwHl) spwHl.innerHTML = highlightSpw(spwInput.value) + "\\n";
        spwInput.focus();
      }
    };
    spwDoor.addEventListener("click", toggleSpwPanel);
    if (slotState.spw) {
      spwInput.value = slotState.spw;
      applySpwExpression(slotState.spw, false);
    } else {
      paintSlots();
      if (spwHl) spwHl.innerHTML = highlightSpw(spwInput.value) + "\\n";
    }
    document.getElementById("spw-hide")?.addEventListener("click", () => {
      spwPanel.hidden = true;
      spwDoor.setAttribute("aria-expanded", "false");
    });
  } else {
    paintSlots();
  }

  /* Colophon pace calibrator & Leave shortcut (double-Escape or "l"; "\\" opens Spw panel). */
  const verNote = document.getElementById("footer-colophon");
  const paceDrawer = document.getElementById("pace-drawer");
  if (verNote && paceDrawer) {
    verNote.setAttribute("role", "button");
    verNote.tabIndex = 0;
    verNote.setAttribute("aria-expanded", "false");
    const toggle = () => {
      const open = paceDrawer.hidden;
      paceDrawer.hidden = !open;
      verNote.setAttribute("aria-expanded", String(open));
    };
    verNote.addEventListener("click", toggle);
    verNote.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
    const wpmInput = paceDrawer.querySelector("input[type='range']");
    const wpmOut = paceDrawer.querySelector("output");
    if (wpmInput && wpmOut) {
      const syncWpm = () => {
        const wpm = Number(wpmInput.value) || 220;
        wpmOut.textContent = wpm + " wpm";
        document.querySelectorAll("[data-words]").forEach((el) => {
          const words = Number(el.dataset.words);
          if (!words) return;
          const mins = Math.max(1, Math.round(words / wpm));
          el.textContent = mins + " min";
        });
      };
      wpmInput.addEventListener("input", syncWpm);
    }
  }

  let lastEsc = 0;
  const leaveLink = document.querySelector("a.leave")?.getAttribute("href");
  addEventListener("keydown", (e) => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "Escape") {
      if (document.documentElement.dataset.shot === "clean") {
        delete document.documentElement.dataset.shot;
        document.querySelectorAll("[data-shot-focus]").forEach((el) => el.removeAttribute("data-shot-focus"));
        document.querySelectorAll("[data-shot-btn]").forEach((b) => { b.textContent = "Frame card"; b.setAttribute("aria-pressed", "false"); });
        return;
      }
      const now = Date.now();
      if (now - lastEsc < 500 && leaveLink) location.replace(leaveLink);
      lastEsc = now;
    } else if (e.key === "l" && leaveLink) {
      location.replace(leaveLink);
    } else if (e.key === "\\\\" && spwDoor) {
      spwDoor.click();
    }
  });
})();
`;

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#11090c"/>
  <circle cx="16" cy="16" r="7" fill="none" stroke="#d85a73" stroke-width="2"/>
  <circle cx="16" cy="16" r="2" fill="#d85a73"/>
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
  const idx = STORIES.findIndex((s) => s.slug === story.slug);
  return idx >= 0 ? STORIES[(idx + 1) % STORIES.length] : STORIES[0] || null;
}

/* Settling in. One small cookie, set only when the reader asks, holding how
   they like the room: which register leads, how big the words are, whether
   the page moves. Cleared with one button. Never read for anything else. */
const SETTLE_COOKIE = "settle";
const SETTLE = Object.freeze({
  pace: Object.freeze({
    day: "let the day pick",
    slow: "slow first",
    dirty: "dirty first",
    warm: "warm first",
    sharp: "sharp first",
  }),
  type: Object.freeze({ set: "as they are", larger: "larger" }),
  move: Object.freeze({ breathe: "let it breathe", still: "hold still" }),
});
const SETTLE_DEFAULT = Object.freeze({ pace: "day", type: "set", move: "breathe" });

function readSettle(request) {
  const header = request.headers.get("Cookie") || "";
  const raw = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SETTLE_COOKIE}=`));
  const prefs = { ...SETTLE_DEFAULT, kept: false };
  if (!raw) return prefs;
  for (const pair of raw.slice(SETTLE_COOKIE.length + 1).split(".")) {
    const [key, value] = pair.split("-");
    if (SETTLE[key] && SETTLE[key][value]) {
      prefs[key] = value;
      prefs.kept = true;
    }
  }
  return prefs;
}

function settleCookie(prefs) {
  const value = Object.keys(SETTLE)
    .map((key) => `${key}-${prefs[key]}`)
    .join(".");
  return `${SETTLE_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax; Secure; HttpOnly`;
}

const SETTLE_CLEAR = `${SETTLE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; Secure; HttpOnly`;

function isSettled(prefs) {
  return Object.keys(SETTLE).some((key) => prefs[key] !== SETTLE_DEFAULT[key]);
}

/* What the room remembers, said back in a line. */
function settleLine(prefs) {
  const parts = Object.keys(SETTLE)
    .filter((key) => prefs[key] !== SETTLE_DEFAULT[key])
    .map((key) => SETTLE[key][prefs[key]]);
  return parts.join(", ");
}

function leadStory(now, prefs, mood = "") {
  const target = mood && Object.hasOwn(REGISTER, mood) ? mood : prefs.pace;
  if (Object.hasOwn(REGISTER, target)) {
    const own = STORIES.filter((s) => s.register === target);
    if (own.length) return own[dayIndex(now) % own.length];
  }
  return featuredStory(now);
}

function plainSlotText(str) {
  return String(str).replace(/\{slot:[^|}]+?\|([^|}]+)(?:\|[^}]*)?\}/g, "$1");
}

function paraText(item) {
  const raw = typeof item === "string" ? item : item.text;
  return plainSlotText(raw);
}

function wordCount(story) {
  return story.body.map(paraText).join(" ").split(/\s+/).filter(Boolean).length;
}

function readMinutes(story) {
  return Math.max(1, Math.round(wordCount(story) / WORDS_PER_MINUTE));
}

function readLength(story) {
  const minutes = readMinutes(story);
  return minutes === 1 ? "1 min" : `${minutes} min`;
}

/* The zine keeps its own words. Each piece names the phrases it adds, dated
   to the day it ran, so the language grows one issue at a time and a later
   piece can lean on a phrase an earlier one earned. */
const LEXICON = STORIES.flatMap((story) =>
  (story.keeps || []).map((phrase) => ({ phrase, from: story.slug, register: story.register, since: story.since }))
);

/* Four registers across four distinct adult audiences. */
const REGISTER = Object.freeze({
  slow: {
    name: "slow",
    promise: "make me wait",
    audience: "Sensory & unhurried",
    pick: "Takes its time. Sensory craft, quiet tension, and patience held past the last possible second.",
    handoff: "Want the pace turned up or warmer? Try another door."
  },
  dirty: {
    name: "dirty",
    promise: "now",
    audience: "Direct & kinetic",
    pick: "Blunt, fast, and spoken out loud. No preamble once the deadbolt clicks.",
    handoff: "Want domestic heat or cool restraint instead? Try another door."
  },
  warm: {
    name: "warm",
    promise: "stay inside",
    audience: "Affectionate & playful",
    pick: "Domestic closeness, unforced humor, shared breath, and chemistry between people who know each other.",
    handoff: "Want sharper edges or quiet restraint next? Try another door."
  },
  sharp: {
    name: "sharp",
    promise: "keep score",
    audience: "Protocol & exchange",
    pick: "Consented authority, explicit rules spoken up front, praise, and deliberate edge control.",
    handoff: "Want to loosen the collar? Try another door."
  },
});

function registerOf(story) {
  return REGISTER[story.register] || REGISTER.slow;
}

/* brief: the page head already said register and length; only say who, who it fits, and what. */
function renderMeta(story, { brief = false } = {}) {
  const reg = registerOf(story);
  const head = brief
    ? ""
    : `<dt>Pace</dt><dd><span class="badge badge-${escapeHtml(reg.name)}">${escapeHtml(reg.name)}</span> · ${escapeHtml(reg.promise)}</dd>
    <dt>Takes</dt><dd data-words="${wordCount(story)}">${escapeHtml(readLength(story))}</dd>`;
  const tags = story.tags?.length
    ? `<dt>Inside</dt><dd class="tags-line">${story.tags.map((t) => escapeHtml(t)).join(" · ")}</dd>`
    : "";
  return `<dl class="meta">
    ${head}
    ${story.audience ? `<dt>Room</dt><dd>${escapeHtml(story.audience)}</dd>` : ""}
    ${story.pairing ? `<dt>With</dt><dd>${escapeHtml(story.pairing)}</dd>` : ""}
    ${tags}
  </dl>`;
}

/* Stay a minute: a few questions the reader can open after the text, answered
   in the scene's own voice. Details, so it reads with no script and opens from
   the keyboard. */
function renderLinger(story) {
  const items = (story.linger || [])
    .map(
      (l, i) => `<details class="linger-item" id="linger-${i}" name="linger">
      <summary>${escapeHtml(l.ask)}</summary>
      <p>${escapeHtml(l.say)}${l.again ? ` <a href="#text">Go back in</a>.` : ""}</p>
    </details>`
    )
    .join("");
  if (!items) return "";
  return `<section class="linger" aria-labelledby="linger-title">
    <h2 id="linger-title" class="kicker">Stay a minute</h2>
    <p class="note">Open one and the line under the title turns with it. Close it and the line comes back. Nothing here is loud.</p>
    ${items}
  </section>`;
}

/* The line under the title. Opening a linger item fades it into the phrase
   that choice earned; closing it fades the original back. CSS only, so the
   page keeps the no-script promise, and the reader keeps a light hand. */
function renderShift(story) {
  const alts = (story.linger || [])
    .map((l, i) => (l.shift ? `<span class="shift-alt" data-shift="${i}" aria-hidden="true">${escapeHtml(l.shift)}</span>` : ""))
    .join("");
  return `<p class="card-kicker shift"><span class="shift-base">${escapeHtml(story.kicker)}</span>${alts}</p>`;
}

function renderKeeps(story) {
  const items = (story.keeps || []).map((phrase) => `<li>${escapeHtml(phrase)}</li>`).join("");
  if (!items) return "";
  return `<section class="keeps" aria-labelledby="keeps-title">
    <h2 id="keeps-title" class="kicker">Words this piece keeps · since ${escapeHtml(story.since)}</h2>
    <ul>${items}</ul>
  </section>`;
}

function renderInlineSlots(raw) {
  const src = String(raw);
  const re = /\{slot:([a-zA-Z0-9_-]+)\|([^}]+)\}/g;
  let out = "";
  let last = 0;
  let m;
  while ((m = re.exec(src))) {
    out += escapeHtml(src.slice(last, m.index));
    const slotName = m[1];
    const choices = m[2].split("|").filter(Boolean);
    const first = choices[0] || "";
    out += `<button type="button" class="word-slot" data-slot="${escapeHtml(slotName)}" data-choices="${escapeHtml(choices.join("|"))}" title="Tap to change wording">${escapeHtml(first)}</button>`;
    last = re.lastIndex;
  }
  out += escapeHtml(src.slice(last));
  return out;
}

function renderParagraphs(lines) {
  return lines
    .map((item) => {
      if (typeof item === "string") return `<p>${renderInlineSlots(item)}</p>`;
      const text = `<p>${renderInlineSlots(item.text)}</p>`;
      if (!item.beat) return text;
      const kind = item.beat.kind === "sharpen" ? "sharpen" : "linger";
      const glyph = kind === "sharpen" ? "!" : "~";
      return `<div class="beat-wrap">${text}<details class="beat-note beat-${kind}" data-beat-kind="${kind}">
        <summary><span class="beat-glyph" aria-hidden="true">${glyph}</span> <span class="beat-label">${escapeHtml(item.beat.label)}</span></summary>
        <p>${renderInlineSlots(item.beat.alt)}</p>
      </details></div>`;
    })
    .join("");
}

function moodSuffix(mood) {
  return mood && Object.hasOwn(REGISTER, mood) ? `?mood=${encodeURIComponent(mood)}` : "";
}

function storyHref(slug, mood) {
  return `/${slug}/${moodSuffix(mood)}`;
}

function corridorNav(currentSlug, mood) {
  const doors = STORIES.map((story, index) => {
    const reg = registerOf(story);
    const here = story.slug === currentSlug;
    return `<a class="corridor-door" href="${storyHref(story.slug, mood)}" data-register="${escapeHtml(reg.name)}"${here ? ' aria-current="page"' : ""}><span class="corridor-index">${index + 1}</span> <span class="badge badge-${escapeHtml(reg.name)}">${escapeHtml(reg.name)}</span> <span class="corridor-title">${escapeHtml(story.title)}</span></a>`;
  }).join("");
  return `<nav class="corridor" aria-label="The four rooms">${doors}</nav>`;
}

function renderEditorialShot(story, { showLink = false, mood = "" } = {}) {
  const ed = story.edition;
  if (!ed) return "";
  const reg = registerOf(story);
  return `<section class="tease-shot tease-${escapeHtml(reg.name)}" data-shot-card="${escapeHtml(story.slug)}" aria-label="${escapeHtml(story.title)} discussable prompt card">
  <div class="shot-head">
    <span class="badge badge-${escapeHtml(reg.name)}">${escapeHtml(reg.name)}</span>
    <span class="shot-brand">smut.today · <em>${escapeHtml(story.title)}</em></span>
    <button type="button" class="focus-toggle shot-btn" data-shot-btn aria-pressed="false">Frame card</button>
  </div>
  <blockquote class="shot-tease">${renderInlineSlots(ed.tease)}</blockquote>
  <dl class="shot-notes">
    <dt>Try tonight</dt><dd>${escapeHtml(ed.couplePrompt)}</dd>
    <dt>Writing circle</dt><dd>${escapeHtml(ed.circleNote)}</dd>
  </dl>
  ${showLink ? `<p class="shot-foot"><a class="read-link" href="${storyHref(story.slug, mood)}">Read the scene →</a></p>` : ""}
</section>`;
}

function renderStoryCard(story, { today = false, mood = "" } = {}) {
  const reg = registerOf(story);
  const href = storyHref(story.slug, mood);
  return `<article class="card card-${escapeHtml(reg.name)}${today ? " card-today" : " card-row"}" data-register="${escapeHtml(reg.name)}">
  <p class="kicker"><span class="badge badge-${escapeHtml(reg.name)}">${escapeHtml(reg.name)}</span> · ${escapeHtml(reg.promise)} · <span data-words="${wordCount(story)}">${escapeHtml(readLength(story))}</span></p>
  <h3 class="card-title"><a href="${href}">${escapeHtml(story.title)}</a></h3>
  <p class="card-kicker">${escapeHtml(story.kicker)}</p>
  <p class="card-summary">${escapeHtml(story.summary)}</p>
  ${renderMeta(story, { brief: !today })}
  <p class="cta-row">${today
    ? `<a class="cta" href="${href}">Enter the room <span aria-hidden="true">→</span></a>`
    : `<a class="read-link" href="${href}">Open ${escapeHtml(story.title)} <span aria-hidden="true">→</span></a>`}</p>
</article>`;
}

function layout({ title, description, canonical, body, crumb = "", prefs = SETTLE_DEFAULT, mood = "", carry, slug = "" }) {
  const current = (name) => (crumb === name ? ' aria-current="page"' : "");
  const carried = carry === undefined ? mood : carry;
  const moodAttr = mood && Object.hasOwn(REGISTER, mood) ? ` data-mood-tint="${escapeHtml(mood)}"` : "";
  const htmlAttrs = [prefs.type === "larger" ? ' data-type="larger"' : "", prefs.move === "still" ? ' data-move="still"' : "", moodAttr].join("");
  return `<!DOCTYPE html>
<html lang="en"${htmlAttrs}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="noindex, nofollow">
  <meta name="rating" content="adult">
  <meta name="theme-color" content="#11090c">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="smut.today">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="stylesheet" href="/text-scale.css">
  <link rel="modulepreload" id="text-pinch" href="${escapeHtml(PINCH_PATH)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <script src="/text-scale-head.js"></script>
  <script src="/app.js" defer></script>
  <style>
    :root {
      color-scheme: dark;
      --bg: #11090c;
      --panel: #170d11;
      --panel-2: #1f1217;
      --fg: #eee1db;
      --muted: #ae959c;
      --accent: #d85a73;
      --accent-ink: #11090c;
      --slow: #dfaab6;
      --dirty: #e46b7d;
      --warm: #dfb18c;
      --sharp: #c3a3d4;
      --room-accent: var(--accent);
      --line: color-mix(in oklab, var(--room-accent) 20%, rgba(238, 225, 219, .1));
      --touch: 44px;
      --measure: 37rem;
    }
    html[data-mood-tint="slow"] { --room-accent: var(--slow); }
    html[data-mood-tint="dirty"] { --room-accent: var(--dirty); }
    html[data-mood-tint="warm"] { --room-accent: var(--warm); }
    html[data-mood-tint="sharp"] { --room-accent: var(--sharp); }
    * { box-sizing: border-box; }
    html { -webkit-text-size-adjust: 100%; }
    ::selection { background: color-mix(in oklab, var(--room-accent) 30%, transparent); color: var(--fg); }
    body {
      margin: 0;
      font: 1.08rem/1.72 "Iowan Old Style", "Palatino Linotype", Palatino, ui-serif, Georgia, serif;
      background:
        radial-gradient(ellipse 68% 36% at 80% -6%, color-mix(in oklab, var(--room-accent) 11%, transparent), transparent 64%),
        radial-gradient(ellipse 55% 40% at 15% 18%, color-mix(in oklab, var(--warm) 5%, transparent), transparent 70%),
        var(--bg);
      color: var(--fg);
      font-kerning: normal;
      transition: background 280ms ease;
    }
    body > header, main, body > footer { width: min(var(--measure), 100% - 2.25rem); margin-inline: auto; padding-inline: env(safe-area-inset-left) env(safe-area-inset-right); }
    body > header { padding-top: max(1.15rem, env(safe-area-inset-top)); padding-bottom: .65rem; border-bottom: 1px solid var(--line); }
    main { padding: 1.65rem 0 3.5rem; }
    /* Cluster-shared pinch-to-scale steps & transient badge. */
    html[data-text-scale="70"] { font-size: 70%; }
    html[data-text-scale="80"] { font-size: 80%; }
    html[data-text-scale="90"] { font-size: 90%; }
    html[data-text-scale="110"] { font-size: 110%; }
    html[data-text-scale="120"] { font-size: 120%; }
    .text-scale-badge { position: fixed; left: 50%; top: max(14px, env(safe-area-inset-top)); z-index: 60; margin: 0; padding: 7px 14px; border-radius: 999px; border: 1px solid var(--line); background: color-mix(in oklab, var(--bg) 92%, black); color: var(--fg); font: 600 12px/1 ui-monospace, SFMono-Regular, Menlo, monospace; transform: translateX(-50%); opacity: 0; pointer-events: none; transition: opacity .2s ease; }
    .text-scale-badge.on { opacity: 1; }
    .reading-thread { position: fixed; inset: 0 0 auto; height: 1.5px; z-index: 50; background: var(--room-accent); transform-origin: left center; transform: scaleX(var(--read-progress, 0)); opacity: .7; pointer-events: none; }
    html[data-move="still"] .reading-thread { display: none; }
    main > section + section { margin-top: 2.35rem; }
    h1, h2, h3 { font-weight: 400; line-height: 1.14; letter-spacing: -.022em; margin: 0 0 .55rem; text-wrap: balance; color: var(--fg); }
    h1 { font-size: clamp(2rem, 5.5vw, 2.7rem); }
    h2 { font-size: 1.45rem; }
    h3 { font-size: 1.38rem; }
    p { margin: 0 0 1.05rem; text-wrap: pretty; }
    a { color: color-mix(in oklab, var(--fg) 35%, var(--room-accent)); text-underline-offset: .22em; text-decoration-thickness: 1px; }
    a:hover { color: var(--fg); }
    :focus-visible { outline: 1.5px solid var(--room-accent); outline-offset: 3px; border-radius: .15rem; }
    .kicker, .note, .meta, .badge, .topbar, body > footer, .cta, .room-dial, .scene-stage, .beat-note summary, .read-link {
      font: .88rem/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    }
    .kicker, .note, .meta, body > footer { color: var(--muted); }
    .kicker { text-transform: uppercase; letter-spacing: .12em; font-size: .72rem; margin: 0 0 .65rem; font-weight: 500; }
    .lede { font-size: 1.18rem; line-height: 1.58; max-width: 42ch; color: color-mix(in oklab, var(--fg) 90%, var(--muted)); }
    .skip { position: absolute; left: -9999px; top: 0; padding: .6rem .9rem; background: var(--room-accent); color: var(--accent-ink); font-weight: 600; text-decoration: none; }
    .skip:focus { left: 1rem; top: 1rem; z-index: 2; }

    /* Chrome: restrained serif/sans editorial wordmark + minimal topbar */
    .topbar { display: flex; flex-wrap: wrap; align-items: center; gap: .25rem .85rem; }
    .wordmark { font: 500 1.08rem/1 "Iowan Old Style", Georgia, serif; letter-spacing: -.01em; color: var(--fg); text-decoration: none; display: inline-flex; align-items: center; min-height: var(--touch); }
    .wordmark b { color: var(--room-accent); font-weight: 600; font-style: italic; padding-right: .04em; }
    .topbar nav { display: flex; flex-wrap: wrap; gap: .15rem .35rem; margin-left: auto; }
    .topbar nav a, .leave { display: inline-flex; align-items: center; min-height: var(--touch); padding: 0 .55rem; color: var(--muted); text-decoration: none; font-size: .84rem; letter-spacing: .02em; }
    .topbar nav a[aria-current="page"] { color: var(--fg); text-decoration: underline; text-decoration-color: var(--room-accent); text-underline-offset: .38em; }
    .topbar nav a:hover, .leave:hover { color: var(--fg); }
    .leave { color: var(--muted); border: 1px solid var(--line); border-radius: .35rem; padding: 0 .7rem; margin-left: .2rem; }
    .leave:hover { border-color: var(--room-accent); }
    .age { font-size: .84rem; margin: .35rem 0 0; color: var(--muted); }

    /* Room dial: understated underlined tab rail rather than button pills */
    .corridor { display: flex; gap: .35rem; overflow-x: auto; margin: 0; padding: .35rem 0 .55rem; border-bottom: 1px solid var(--line); }
    .corridor-door { display: inline-flex; align-items: center; gap: .35rem; min-height: var(--touch); padding: 0 .55rem; flex: 0 0 auto; border-bottom: 2px solid transparent; color: var(--muted); text-decoration: none; }
    .corridor-door[aria-current="page"] { color: var(--fg); border-bottom-color: var(--room-accent); }
    .corridor-index { font-size: .75rem; font-variant-numeric: tabular-nums; }
    .corridor-title { font-size: .92rem; }
    .room-dial { display: flex; flex-wrap: wrap; align-items: center; gap: .1rem 1.1rem; margin: 1.1rem 0 .4rem; border-bottom: 1px solid var(--line); }
    .dial-pill {
      display: inline-flex; align-items: center; min-height: var(--touch); padding: 0 .1rem;
      color: var(--muted); text-decoration: none; text-transform: uppercase; letter-spacing: .1em; font-size: .74rem; font-weight: 500;
      border-bottom: 2px solid transparent; margin-bottom: -1px;
      transition: color 180ms ease, border-color 180ms ease;
    }
    .dial-pill:hover { color: var(--fg); }
    .dial-pill[aria-current="true"] { color: var(--fg); border-bottom-color: var(--room-accent); font-weight: 600; }
    .dial-pill[data-mood="slow"][aria-current="true"] { border-bottom-color: var(--slow); color: var(--slow); }
    .dial-pill[data-mood="dirty"][aria-current="true"] { border-bottom-color: var(--dirty); color: var(--dirty); }
    .dial-pill[data-mood="warm"][aria-current="true"] { border-bottom-color: var(--warm); color: var(--warm); }
    .dial-pill[data-mood="sharp"][aria-current="true"] { border-bottom-color: var(--sharp); color: var(--sharp); }

    /* Cards & hairline editorial index rows */
    .card { margin: 1rem 0; }
    .card-today {
      border: 1px solid color-mix(in oklab, var(--room-accent) 34%, transparent);
      border-radius: .65rem; padding: 1.4rem 1.35rem 1.25rem;
      background: linear-gradient(165deg, color-mix(in oklab, var(--panel-2) 88%, var(--room-accent)), var(--panel));
      box-shadow: 0 12px 32px color-mix(in oklab, black 38%, transparent);
    }
    .card-row { padding: 1.05rem 0 1.15rem; border-top: 1px solid var(--line); margin: 0; }
    .card-title { font-size: 1.55rem; margin-bottom: .2rem; }
    .card-today .card-title { font-size: 1.85rem; }
    .card-title a { color: var(--fg); text-decoration: none; }
    .card-title a:hover, .card-title a:focus-visible { color: var(--room-accent); }
    .card-kicker { color: var(--muted); font-style: italic; font-size: 1.02rem; margin-bottom: .65rem; }
    .card-summary { font-size: 1.06rem; line-height: 1.62; color: color-mix(in oklab, var(--fg) 92%, var(--muted)); }
    .cta-row { margin: 1rem 0 0; }
    .cta {
      display: inline-flex; align-items: center; gap: .45rem; min-height: var(--touch); padding: 0 1.15rem;
      border-radius: .4rem; background: color-mix(in oklab, var(--room-accent) 88%, #1a0a0f); color: var(--accent-ink); font-weight: 600; font-size: .84rem; letter-spacing: .03em; text-decoration: none;
    }
    .cta:hover { background: var(--room-accent); color: var(--accent-ink); }
    .cta-quiet { background: transparent; color: var(--fg); border: 1px solid var(--line); }
    .cta-quiet:hover { background: color-mix(in oklab, var(--room-accent) 12%, transparent); border-color: var(--room-accent); color: var(--fg); }
    .read-link {
      display: inline-flex; align-items: center; gap: .35rem; min-height: var(--touch);
      color: color-mix(in oklab, var(--fg) 75%, var(--room-accent)); font-weight: 500; font-size: .86rem; letter-spacing: .02em; text-decoration: underline; text-underline-offset: .25em;
    }
    .read-link:hover { color: var(--fg); }

    /* Meta: crisp typographic colophon instead of noisy bubble tags */
    .meta { display: grid; grid-template-columns: max-content 1fr; gap: .25rem .9rem; margin: .6rem 0 0; font-size: .84rem; }
    .meta dt { color: var(--muted); text-transform: uppercase; letter-spacing: .08em; font-size: .68rem; padding-top: .22rem; }
    .meta dd { margin: 0; color: color-mix(in oklab, var(--fg) 88%, var(--muted)); }
    .tags-line { color: var(--muted); }
    .badge { display: inline-block; font-weight: 600; font-size: .7rem; letter-spacing: .12em; text-transform: uppercase; }
    .badge-slow { color: var(--slow); }
    .badge-dirty { color: var(--dirty); }
    .badge-warm { color: var(--warm); }
    .badge-sharp { color: var(--sharp); }

    /* Register guide on the index */
    .registers { display: grid; gap: .85rem 1.25rem; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); margin: .5rem 0 1.25rem; padding: 0; list-style: none; }
    .registers li { border-top: 1px solid var(--line); padding: .85rem 0 .25rem; display: grid; gap: .28rem; align-content: start; }
    .registers .badge { justify-self: start; }
    .registers p { margin: 0; color: var(--muted); font-size: .94rem; line-height: 1.52; }
    .register-link { display: inline-flex; align-items: center; min-height: var(--touch); font: 500 .8rem/1 ui-sans-serif, system-ui, sans-serif; text-decoration: none; color: color-mix(in oklab, var(--fg) 78%, var(--room-accent)); }
    .register-link:hover { color: var(--fg); text-decoration: underline; text-underline-offset: .25em; }

    /* Story opening & reading chamber */
    .piece-head { margin-bottom: 1.5rem; }
    .piece-head .card-kicker { font-size: 1.06rem; }
    .before { border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 1.05rem 0 .9rem; margin: 0 0 2rem; }
    .before .kicker { margin-bottom: .45rem; }
    .before .note { margin: .65rem 0 0; font-size: .84rem; }
    .scene-stage { display: flex; flex-wrap: wrap; align-items: center; gap: .35rem .7rem; margin-top: .85rem; padding-top: .7rem; border-top: 1px dashed var(--line); }
    .scene-stage .stage-link { display: inline-flex; align-items: center; min-height: var(--touch); padding-right: .35rem; font-weight: 600; font-size: .84rem; text-decoration: none; color: var(--fg); }
    .scene-stage .stage-link:hover { color: var(--room-accent); text-decoration: underline; text-underline-offset: .25em; }
    .breath-count { font: 600 .78rem/1 ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--room-accent); }
    .prose { font-size: 1.14rem; line-height: 1.78; max-width: 35rem; }
    .prose > p, .beat-wrap > p { margin: 0 0 1.35rem; }
    .prose > p:first-of-type::first-letter { font-size: 3.05em; line-height: .82; float: left; padding: .08em .18em 0 0; color: var(--room-accent); font-style: normal; }
    .prose.is-focused > p, .prose.is-focused .beat-wrap > p { opacity: .22; cursor: pointer; transition: opacity .25s ease; }
    .prose.is-focused > p.is-lit, .prose.is-focused .beat-wrap > p.is-lit { opacity: 1; }
    .prose.is-voices > p:not(.has-voice), .prose.is-voices .beat-wrap > p:not(.has-voice) { opacity: .34; transition: opacity .25s ease; }
    .prose.is-voices > p.has-voice, .prose.is-voices .beat-wrap > p.has-voice { opacity: 1; border-left: 1.5px solid color-mix(in oklab, var(--room-accent) 55%, transparent); padding-left: .95rem; }

    /* Inline margin beats (~ linger / ! sharpen) */
    .beat-wrap { margin: 0 0 1.35rem; }
    .beat-wrap > p { margin-bottom: .5rem; }
    .beat-note {
      margin: 0 0 .25rem .35rem; padding-left: .9rem;
      border-left: 1.5px solid color-mix(in oklab, var(--room-accent) 36%, transparent);
    }
    .beat-note[data-turn="true"] { border-left-color: var(--room-accent); }
    .beat-note summary {
      display: inline-flex; align-items: center; gap: .45rem; min-height: var(--touch);
      padding: .1rem .3rem; color: var(--muted); cursor: pointer; list-style: none; font-size: .82rem; letter-spacing: .02em;
    }
    .beat-note summary::-webkit-details-marker { display: none; }
    .beat-note summary:hover, .beat-note[open] summary { color: var(--fg); }
    .beat-glyph {
      color: var(--room-accent); font: 700 .88rem/1 ui-monospace, SFMono-Regular, Menlo, monospace;
      width: 1.1rem; text-align: center;
    }
    .beat-note p {
      margin: .3rem 0 .25rem; font-size: 1.02rem; line-height: 1.68; font-style: italic;
      color: color-mix(in oklab, var(--fg) 84%, var(--room-accent));
    }

    .end { margin: 1.5rem 0 0; color: var(--muted); text-align: center; letter-spacing: .5em; }
    .linger { margin: 2rem 0 0; border-top: 1px solid var(--line); padding-top: 1.15rem; }
    .linger .note { margin-bottom: .35rem; font-size: .84rem; }
    .linger-item { border-bottom: 1px solid var(--line); }
    .linger-item summary { display: flex; align-items: center; gap: .65rem; min-height: var(--touch); padding: .4rem 0; cursor: pointer; font-style: italic; font-size: 1.08rem; list-style: none; }
    .linger-item summary::-webkit-details-marker { display: none; }
    .linger-item summary::before { content: "○"; color: var(--room-accent); font-style: normal; flex: none; font-size: .85em; }
    .linger-item[open] summary::before { content: "●"; }
    .linger-item summary:hover { color: var(--room-accent); }
    .linger-item p { margin: 0 0 1rem 1.4rem; color: color-mix(in oklab, var(--fg) 90%, var(--muted)); line-height: 1.68; }
    .murmur { font-style: italic; color: var(--muted); text-align: center; margin: .85rem 0 .25rem; font-size: .98rem; }
    .shift { display: grid; }
    .shift > span { grid-area: 1 / 1; transition: opacity 1.1s ease; }
    .shift-alt { opacity: 0; }
    article:has(#linger-0[open]) .shift-base, article:has(#linger-1[open]) .shift-base, article:has(#linger-2[open]) .shift-base { opacity: 0; }
    article:has(#linger-0[open]) [data-shift="0"], article:has(#linger-1[open]) [data-shift="1"], article:has(#linger-2[open]) [data-shift="2"] { opacity: 1; }
    @media (prefers-reduced-motion: reduce) { .shift > span { transition: none; } }
    html[data-type="larger"] { font-size: 118%; }
    html[data-type="larger"] body { line-height: 1.72; }
    html[data-move="still"] .prose > p:first-of-type::first-letter { font-size: inherit; float: none; padding: 0; color: inherit; line-height: inherit; }
    html[data-move="still"] .shift > span { transition: none; }
    html[data-move="still"] body { background: var(--bg); }
    .settle fieldset { border: 1px solid var(--line); border-radius: .55rem; padding: .8rem 1.05rem .55rem; margin: 0 0 1.1rem; background: var(--panel); }
    .settle legend { padding: 0 .45rem; font-style: italic; color: var(--fg); }
    .settle label { display: flex; align-items: flex-start; gap: .75rem; min-height: var(--touch); padding: .5rem 0; cursor: pointer; }
    .settle input[type="radio"] { width: 1.1rem; height: 1.1rem; accent-color: var(--room-accent); margin: .25rem 0 0; flex: none; }
    .settle .actions { display: flex; flex-wrap: wrap; gap: .65rem; align-items: center; }
    .settle button { font: inherit; cursor: pointer; }
    .settle .cta { border: 0; }
    .settle .cta-quiet { background: transparent; }
    .settled { border-left: 2px solid var(--room-accent); padding: .25rem .8rem; margin: 1rem 0 0; }
    .keeps { margin: 2rem 0 0; border-top: 1px dashed var(--line); padding-top: 1.1rem; }
    .keeps ul { margin: 0; padding-left: 1.1rem; columns: 2 12rem; column-gap: 1.75rem; }
    .keeps li { margin: .2rem 0; break-inside: avoid; }
    /* Tactile transitions */
    .card-today, .registers li, .linger-item summary, .keeps li, .beat-note {
      transition: transform 140ms ease, border-color 200ms ease, background-color 200ms ease;
      -webkit-tap-highlight-color: transparent;
    }
    .card-today:active { transform: scale(.996); border-color: var(--room-accent); }
    .focus-toggle, .keep-jump, .end-btn {
      font: inherit; color: var(--muted); background: transparent; border: 1px solid var(--line); border-radius: .35rem;
      padding: .15rem .7rem; min-height: var(--touch); cursor: pointer; font-size: .8rem; letter-spacing: .02em;
    }
    .focus-toggle:hover, .keep-jump:hover, .end-btn:hover { color: var(--fg); border-color: var(--room-accent); background: color-mix(in oklab, var(--room-accent) 10%, transparent); }
    .focus-toggle[aria-pressed="true"] { background: color-mix(in oklab, var(--room-accent) 22%, var(--panel)); color: var(--fg); border-color: var(--room-accent); font-weight: 600; }
    .keep-jump { color: color-mix(in oklab, var(--fg) 88%, var(--muted)); border: 0; border-bottom: 1px dotted var(--line); border-radius: 0; padding: .15rem .15rem; text-align: left; font-size: .98rem; font-family: inherit; min-height: 36px; }
    .keep-jump:hover { border-bottom-color: var(--room-accent); color: var(--fg); background: transparent; }
    mark.prose-echo { background: color-mix(in oklab, var(--room-accent) 24%, transparent); color: var(--fg); padding: .04em .18em; border-radius: .15rem; border-bottom: 1px solid var(--room-accent); }

    /* Configurable steamy word slots inside prose and tease cards */
    .word-slot {
      font: inherit; color: color-mix(in oklab, var(--fg) 82%, var(--room-accent)); background: transparent;
      border: 0; border-bottom: 1px dotted color-mix(in oklab, var(--room-accent) 44%, transparent);
      border-radius: .12rem; padding: 0 .08em; margin: 0 -.04em; cursor: pointer; line-height: inherit;
      transition: color 180ms ease, background-color 180ms ease, border-color 180ms ease;
    }
    .word-slot:hover, .word-slot:focus-visible { color: var(--fg); background: color-mix(in oklab, var(--room-accent) 12%, transparent); border-bottom-color: var(--room-accent); border-bottom-style: solid; }
    .word-slot[data-turn="true"] { color: var(--room-accent); }

    /* Variable-timeout prose reveal */
    .timed-bar {
      display: grid; grid-template-columns: 1fr auto; gap: .35rem .75rem; align-items: center;
      margin: 0 0 1.4rem; padding: .6rem .85rem; border: 1px solid var(--line); border-radius: .45rem; background: var(--panel);
      font: .82rem/1.3 ui-sans-serif, system-ui, sans-serif; color: var(--muted);
    }
    .timed-bar[hidden] { display: none; }
    .timed-track { grid-column: 1 / -1; height: 1.5px; background: color-mix(in oklab, var(--line) 45%, transparent); overflow: hidden; }
    .timed-fill { height: 100%; background: var(--room-accent); transform-origin: left center; transform: scaleX(0); }
    .prose.is-timed .is-veiled { display: none; }
    .prose.is-timed .is-current-beat { animation: beatIn .35s ease; }
    @keyframes beatIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

    /* Chapbook-framed editorial & screenshotable prompt plates */
    .tease-grid { display: grid; gap: 1.05rem; margin: .75rem 0 0; }
    .tease-shot {
      margin: 1.75rem 0 0; padding: 1.35rem 1.35rem 1.25rem; border-radius: .55rem;
      border: 1px solid color-mix(in oklab, var(--room-accent) 26%, rgba(238, 225, 219, .08));
      background:
        radial-gradient(circle at 90% 10%, color-mix(in oklab, var(--room-accent) 9%, transparent), transparent 55%),
        var(--panel);
    }
    .shot-head { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem .65rem; margin-bottom: .85rem; padding-bottom: .6rem; border-bottom: 1px solid var(--line); font: .8rem/1.3 ui-sans-serif, system-ui, sans-serif; color: var(--muted); }
    .shot-brand { margin-right: auto; letter-spacing: .02em; }
    .shot-tease { margin: 0 0 1rem; padding: 0 0 0 1rem; border-left: 1.5px solid var(--room-accent); font-size: 1.15rem; font-style: italic; line-height: 1.6; color: var(--fg); }
    .shot-notes { display: grid; grid-template-columns: max-content 1fr; gap: .4rem .9rem; margin: 0; padding-top: .75rem; border-top: 1px dashed var(--line); font: .86rem/1.5 ui-sans-serif, system-ui, sans-serif; }
    .shot-notes dt { color: var(--muted); text-transform: uppercase; letter-spacing: .09em; font-size: .68rem; padding-top: .22rem; }
    .shot-notes dd { margin: 0; color: color-mix(in oklab, var(--fg) 88%, var(--muted)); }
    .shot-foot { margin: .85rem 0 0; }
    html[data-shot="clean"] body > header,
    html[data-shot="clean"] body > footer,
    html[data-shot="clean"] main > :not([data-shot-focus]):not(:has([data-shot-focus])),
    html[data-shot="clean"] article > :not([data-shot-focus]),
    html[data-shot="clean"] .tease-grid > :not([data-shot-focus]) { opacity: .04; }
    html[data-shot="clean"] [data-shot-focus="true"] { position: relative; z-index: 30; border-color: color-mix(in oklab, var(--room-accent) 45%, transparent); box-shadow: 0 24px 64px color-mix(in oklab, black 78%, transparent); }

    .murmur { cursor: pointer; border-radius: .3rem; padding: .2rem .5rem; transition: opacity 180ms ease, color 180ms ease; }
    .murmur:hover, .murmur[data-turn="true"] { color: var(--fg); }
    .end-btn { border: 0; color: var(--muted); letter-spacing: .5em; padding-inline: .8rem; }
    .end-whisper { text-align: center; margin: .4rem 0 0; }
    .pi-wink { text-decoration-style: dotted; }
    .pace-drawer { margin: .85rem 0; padding: .8rem .95rem; border: 1px solid var(--line); border-radius: .5rem; background: var(--panel); }
    .pace-drawer[hidden] { display: none; }
    .pace-drawer label { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem .8rem; font-size: .86rem; }
    .pace-drawer input[type="range"] { flex: 1 1 8rem; min-height: 44px; accent-color: var(--room-accent); }
    .colophon-row { display: flex; flex-wrap: wrap; align-items: center; gap: .35rem .75rem; margin-top: .35rem; }
    #footer-colophon { cursor: pointer; text-decoration: underline dotted var(--line); text-underline-offset: .25em; margin: 0; }
    .spw-door {
      font: 500 .78rem/1 ui-monospace, SFMono-Regular, Menlo, monospace; color: var(--muted);
      background: transparent; border: 1px solid transparent; border-radius: .3rem;
      min-height: 36px; padding: 0 .45rem; cursor: pointer; margin-left: auto;
    }
    .spw-door:hover, .spw-door[aria-expanded="true"] { color: var(--room-accent); border-color: var(--line); }

    /* Hidden syntactically-highlighted Spw configuration panel */
    .spw-panel { margin: .95rem 0 0; padding: .95rem; border: 1px solid var(--line); border-radius: .55rem; background: color-mix(in oklab, var(--bg) 55%, var(--panel)); }
    .spw-panel[hidden] { display: none; }
    .spw-presets { display: flex; flex-wrap: wrap; gap: .35rem; margin: 0 0 .65rem; }
    .spw-editor { position: relative; border: 1px solid var(--line); border-radius: .45rem; background: color-mix(in oklab, var(--bg) 90%, black); overflow: hidden; }
    .spw-hl, .spw-input {
      margin: 0; padding: .75rem .85rem; width: 100%; min-height: 9.5rem;
      font: 400 .84rem/1.55 ui-monospace, SFMono-Regular, Menlo, monospace; tab-size: 2;
      white-space: pre-wrap; word-wrap: break-word; overflow: auto; border: 0;
    }
    .spw-hl { pointer-events: none; color: var(--fg); }
    .spw-input {
      position: absolute; inset: 0; resize: vertical; background: transparent; color: transparent; caret-color: var(--room-accent);
      outline: none;
    }
    .spw-tok.spw-op { color: var(--accent); font-weight: 700; }
    .spw-tok.spw-brace { color: var(--warm); }
    .spw-tok.spw-head { color: var(--fg); font-weight: 600; }
    .spw-tok.spw-key { color: var(--slow); }
    .spw-tok.spw-string { color: var(--sharp); }
    .spw-tok.spw-number { color: var(--dirty); }
    .spw-tok.spw-comment { color: var(--muted); font-style: italic; }
    .spw-tok.spw-error { color: #e46b7d; text-decoration: wavy underline; }
    .spw-bar { display: flex; flex-wrap: wrap; align-items: center; gap: .45rem .65rem; margin-top: .65rem; font: .82rem/1.4 ui-sans-serif, system-ui, sans-serif; color: var(--muted); }
    .spw-status { margin-right: auto; }
    .spw-status[data-valid="false"] { color: var(--dirty); }

    .pwa-note { margin: .5rem 0 0; }
    @media (pointer: coarse) { .focus-toggle, .keep-jump, .end-btn, .beat-note summary, .spw-door, .dial-pill, .corridor-door { min-height: 44px; } }
    html[data-move="still"] *, html[data-move="still"] *::before, html[data-move="still"] *::after { transition: none !important; transform: none !important; animation: none !important; }
    @media (prefers-reduced-motion: reduce) {
      .card-today, .registers li, .linger-item summary, .keeps li, .text-scale-badge, .prose > p, .beat-wrap > p, .dial-pill, .tease-shot, .word-slot, body { transition: none; transform: none !important; animation: none !important; }
    }
    .next { margin: 2.25rem 0 0; }
    .next .card { margin-top: .5rem; }

    ul.pieces { list-style: none; padding: 0; margin: 0; }
    ul.pieces > li:last-child .card-row { border-bottom: 1px solid var(--line); }

    .also { display: grid; gap: .85rem 1.25rem; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); margin: .5rem 0 0; }
    .also .card { margin: 0; border-top: 1px solid var(--line); padding: .85rem 0 0; }
    .also h3 { font-size: 1.22rem; }
    .also a { display: inline-flex; align-items: center; min-height: var(--touch); }

    body > footer { padding: 1.25rem 0 2.75rem; border-top: 1px solid var(--line); font-size: .84rem; }
    body > footer nav { display: flex; flex-wrap: wrap; gap: .1rem .35rem; margin: 0 -.5rem; }
    body > footer nav a { display: inline-flex; align-items: center; min-height: var(--touch); padding: 0 .5rem; }

    @media (max-width: 30rem) {
      .meta, .shot-notes { grid-template-columns: 1fr; gap: .05rem; }
      .meta dt, .shot-notes dt { margin-top: .45rem; font-size: .7rem; text-transform: uppercase; letter-spacing: .08em; }
    }
    @media (hover: hover) and (pointer: fine) {
      :root { --touch: 36px; }
    }
    @media print {
      body > header, body > footer, .before, .next, .cta-row, .room-dial, .corridor, .beat-note, .timed-bar, .shot-btn { display: none; }
      body { background: #fff; color: #000; }
      h1, h2, h3, a { color: #000; }
    }
  </style>
</head>
<body>
  <div class="reading-thread" aria-hidden="true"></div>
  <a class="skip" href="#main">Skip to content</a>
  <header>
    <div class="topbar">
      <a class="wordmark" href="/" aria-label="smut.today home"><b>smut</b>.today</a>
      <nav aria-label="Site">
        <a href="/"${current("home")}>Today</a>
        <a href="/to-you/"${current("letter")}>The letter</a>
        <a href="/pitches/"${current("pitches")}>The shelf</a>
        <a href="/settle/"${current("settle")}>Settle in</a>
        <a class="leave" href="${escapeHtml(LEAVE_URL)}" rel="noreferrer">Leave</a>
      </nav>
    </div>
    ${corridorNav(slug, carried)}
  </header>
  <main id="main">
    ${body}
  </main>
  <footer>
    <p>For adults. Everyone in these pieces is grown and says yes. No ads, no accounts, nothing watching you read. <a href="${escapeHtml(LEAVE_URL)}" rel="noreferrer">Leave</a> whenever you like; the door does not lock behind you.</p>
    <nav aria-label="Footer">
      <a href="/">Today</a>
      <a href="/to-you/">The letter</a>
      <a href="/pitches/">The shelf</a>
      <a href="/settle/">Settle in</a>
      <a href="/today.json">today.json</a>
      <a href="https://wap.mom/">Wondering About Pi</a>
    </nav>
    <div class="colophon-row">
      <p class="note" id="footer-colophon">smut.today ${escapeHtml(VERSION)}. The periodical is next door.</p>
      <button type="button" class="spw-door" id="spw-door" aria-expanded="false" aria-controls="spw-panel" title="Room configuration">[ ~ ]</button>
    </div>
    <aside class="pace-drawer" id="pace-drawer" hidden>
      <label><span>Your reading pace</span><input type="range" min="150" max="320" step="10" value="220" aria-label="Reading pace in words per minute"><output>220 wpm</output></label>
      <p class="note">Recalculates reading time locally. Choosing Forget me in Settle in clears offline copies too.</p>
    </aside>
    <section class="spw-panel" id="spw-panel" hidden aria-label="Spw room configuration">
      <p class="kicker">Room dynamics · Spw</p>
      <div class="spw-presets">
        <button type="button" class="focus-toggle" data-spw-preset="couple">Couple in bed</button>
        <button type="button" class="focus-toggle" data-spw-preset="circle">Writing circle</button>
        <button type="button" class="focus-toggle" data-spw-preset="urgent">Urgent cadence</button>
        <button type="button" class="focus-toggle" data-spw-preset="protocol">Strict protocol</button>
      </div>
      <div class="spw-editor">
        <pre class="spw-hl" id="spw-hl" aria-hidden="true">${highlightSpw(DEFAULT_SPW_PRESETS.couple)}</pre>
        <textarea class="spw-input" id="spw-input" spellcheck="false" rows="7" aria-label="Spw room expression">${escapeHtml(DEFAULT_SPW_PRESETS.couple)}</textarea>
      </div>
      <div class="spw-bar">
        <span class="spw-status" id="spw-status">4 Spw frames · pause 2200ms</span>
        <button type="button" class="focus-toggle" id="spw-reset">Reset</button>
        <button type="button" class="focus-toggle" id="spw-hide">Hide</button>
      </div>
    </section>
  </footer>
</body>
</html>`;
}

function renderIndex(now, prefs, mood = "") {
  const activeMood = mood && Object.hasOwn(REGISTER, mood) ? mood : "";
  const featured = leadStory(now, prefs, activeMood);
  const others = STORIES.filter((s) => s.slug !== featured.slug);
  const settled = isSettled(prefs)
    ? `<p class="settled note">The room remembers: ${escapeHtml(settleLine(prefs))}. <a href="/settle/">Change it</a>, or forget it there.</p>`
    : `<p class="note">Want a different default room or larger words? <a href="/settle/">Settle in</a> and this device remembers.</p>`;

  const dialPills = [
    `<a class="dial-pill" data-mood="all" href="/"${!activeMood ? ' aria-current="true"' : ""}>Everything</a>`,
    ...Object.values(REGISTER).map(
      (reg) => `<a class="dial-pill" data-mood="${escapeHtml(reg.name)}" href="/?mood=${escapeHtml(reg.name)}"${activeMood === reg.name ? ' aria-current="true"' : ""}>${escapeHtml(reg.name)}</a>`
    ),
  ].join("");

  const registers = Object.values(REGISTER)
    .map(
      (reg) => `<li>
    <span class="badge badge-${escapeHtml(reg.name)}">${escapeHtml(reg.name)}</span> <span class="note">${escapeHtml(reg.promise)}</span>
    <p>${escapeHtml(reg.pick)}</p>
    <a class="register-link" data-mood="${escapeHtml(reg.name)}" href="/?mood=${escapeHtml(reg.name)}">${escapeHtml(reg.audience)} →</a>
  </li>`
    )
    .join("");

  const list = others
    .map((s) => `<li${activeMood && s.register !== activeMood ? " hidden" : ""}>${renderStoryCard(s, { mood: activeMood })}</li>`)
    .join("");

  const editorialTeases = STORIES.map((s) => renderEditorialShot(s, { showLink: true, mood: activeMood })).join("");

  return layout({
    prefs,
    mood: activeMood,
    crumb: "home",
    title: "smut.today — four rooms down one corridor",
    description: "Short, explicit fiction for adults across four distinct moods: slow, dirty, warm, and sharp. Transparent tags, timed beat pacing, and discussable teases.",
    canonical: "https://smut.today/",
    body: `<section aria-labelledby="site-title">
  <h1 id="site-title">Something to read with the door shut.</h1>
  <p class="lede">Four rooms down one corridor: slow restraint, urgent dispatch, domestic warmth, or strict protocol. You know what’s inside before the first line—read solo, share in bed, or dissect the craft.</p>
  <p class="age">18+. If that isn’t you, or this isn’t the night for it, <a href="${escapeHtml(LEAVE_URL)}" rel="noreferrer">leave</a>. Nothing here follows you out.</p>
  <nav class="room-dial" id="room-dial" aria-label="Room mood filter">${dialPills}</nav>
  <p class="note" id="dial-status" aria-live="polite">${activeMood ? `Tuned to ${escapeHtml(activeMood)} — ${escapeHtml(REGISTER[activeMood].audience)}.` : "Showing all four doors in the corridor."}</p>
</section>
<section aria-labelledby="today-title">
  <h2 id="today-title" class="kicker">${activeMood ? `${escapeHtml(activeMood)} lead` : `Today · ${escapeHtml(new Date(now).toISOString().slice(0, 10))}`}</h2>
  ${renderStoryCard(featured, { today: true, mood: activeMood })}
  <p class="murmur">${escapeHtml(murmur(now))}</p>
  ${settled}
</section>
<section aria-labelledby="registers-title">
  <h2 id="registers-title" class="kicker">Four ways in</h2>
  <ul class="registers">${registers}</ul>
</section>
<section aria-labelledby="pieces-title">
  <h2 id="pieces-title" class="kicker">Still warm</h2>
  <ul class="pieces">${list}</ul>
</section>
<section aria-labelledby="teases-title">
  <h2 id="teases-title" class="kicker">For two in bed · or the workshop table</h2>
  <p class="note">Tap underlined phrases to adjust phrasing, or tap Frame card for a clean screenshot to pass across a pillow or writing circle.</p>
  <div class="tease-grid">${editorialTeases}</div>
</section>
<section aria-labelledby="also-title">
  <h2 id="also-title" class="kicker">Down the hall</h2>
  <div class="also">
    <article class="card">
      <h3><a href="/to-you/">${escapeHtml(LETTER.title)}</a></h3>
      <p class="note">A letter to the person who sits for the drawings. Not smut. Not not.</p>
    </article>
    <article class="card">
      <h3><a href="/pitches/">Three book pitches</a></h3>
      <p class="note">Premises a hand can hold up to a camera. They belong to the periodical next door, <a href="https://wap.mom/">Wondering About Pi</a>.</p>
    </article>
  </div>
</section>`,
  });
}

function renderLetter(prefs) {
  return layout({
    prefs,
    crumb: "letter",
    mood: Object.hasOwn(REGISTER, prefs.pace) ? prefs.pace : "",
    title: `${LETTER.title} — smut.today`,
    description: LETTER.kicker,
    canonical: "https://smut.today/to-you/",
    body: `<article>
  <header class="piece-head">
    <p class="kicker">A letter · ${escapeHtml(LETTER.kicker)}</p>
    <h1>${escapeHtml(LETTER.title)}</h1>
    <div class="scene-stage">
      <button type="button" class="focus-toggle" id="focus-toggle" aria-pressed="false" hidden>One breath</button>
      <span class="breath-count" id="breath-count" hidden></span>
      <button type="button" class="focus-toggle" id="scale-step" hidden>Text 100%</button>
    </div>
  </header>
  <div class="prose">${renderParagraphs(LETTER.body)}</div>
  <p class="end" aria-hidden="true">· · ·</p>
</article>
<nav class="next" aria-label="Where next">
  <p class="cta-row"><a class="cta cta-quiet" href="/">Back to today’s piece</a></p>
</nav>`,
  });
}

function renderPitches(prefs) {
  const cards = PITCHES.map(
    (p) => `<article class="card">
  <h2>${escapeHtml(p.title)}</h2>
  <p>${escapeHtml(p.hook)}</p>
  <p class="note">${escapeHtml(p.why)}</p>
</article>`
  ).join("");
  return layout({
    prefs,
    crumb: "pitches",
    mood: Object.hasOwn(REGISTER, prefs.pace) ? prefs.pace : "",
    title: "The shelf — smut.today",
    description: "Three book premises for a shelf that already knows how to caption.",
    canonical: "https://smut.today/pitches/",
    body: `<header class="piece-head">
  <p class="kicker">For the shelf</p>
  <h1>Three books that would be good to be seen holding.</h1>
  <p class="lede">Premises, not manuscripts. Each one fits in a caption and survives being held up to a lens. None of them explain the domain next door: <a href="https://wap.mom/">wap.mom</a> is the periodical, and this side of the wall is the heat.</p>
</header>
${cards}
<nav class="next" aria-label="Where next">
  <p class="cta-row"><a class="cta cta-quiet" href="/">Back to today’s piece</a></p>
</nav>`,
  });
}

function renderStory(story, prefs, mood = "") {
  const other = otherStory(story);
  const reg = registerOf(story);
  const asked = mood && Object.hasOwn(REGISTER, mood) ? mood : "";
  const tint = asked || reg.name;
  const place = STORIES.findIndex((item) => item.slug === story.slug) + 1;
  const cadence = story.cadence || { baseMs: 2200, jitterMs: 650 };
  const next = other
    ? `<nav class="next" aria-labelledby="next-title">
  <h2 id="next-title" class="kicker">${escapeHtml(reg.handoff)}</h2>
  ${renderStoryCard(other, { mood: asked })}
</nav>`
    : "";
  return layout({
    prefs,
    mood: tint,
    carry: asked,
    slug: story.slug,
    title: `${story.title} — smut.today`,
    description: `${story.summary} ${reg.name[0].toUpperCase()}${reg.name.slice(1)}, ${readLength(story)}.`,
    canonical: `https://smut.today/${story.slug}/`,
    body: `<article>
  <header class="piece-head">
    <p class="kicker"><span class="badge badge-${escapeHtml(reg.name)}">${escapeHtml(reg.name)}</span> ${escapeHtml(reg.promise)} · <span data-words="${wordCount(story)}">${escapeHtml(readLength(story))}</span></p>
    <h1>${escapeHtml(story.title)}</h1>
    ${renderShift(story)}
  </header>
  <aside class="before" aria-labelledby="before-title">
    <h2 id="before-title" class="kicker">Before the door shuts</h2>
    ${renderMeta(story, { brief: true })}
    <p class="note">Door ${place} of ${STORIES.length}${other ? `. Next door: <a href="${storyHref(other.slug, asked)}">${escapeHtml(other.title)}</a>, ${escapeHtml(registerOf(other).name)}.` : ""}</p>
    <p class="note">Told to you, in second person. Everyone here is grown and says yes. Dotted phrases swap on tap.</p>
    <div class="scene-stage" role="group" aria-label="Reading controls">
      <a class="stage-link" href="#text">Go straight in</a>
      <button type="button" class="focus-toggle" id="focus-toggle" aria-pressed="false" hidden>One breath</button>
      <span class="breath-count" id="breath-count" hidden></span>
      <button type="button" class="focus-toggle" id="voices-toggle" aria-pressed="false" hidden>Voices</button>
      <button type="button" class="focus-toggle" id="timed-toggle" aria-pressed="false" data-base-ms="${escapeHtml(cadence.baseMs)}" data-jitter-ms="${escapeHtml(cadence.jitterMs)}" hidden>Timed unfold</button>
      <button type="button" class="focus-toggle" id="scale-step" hidden>Text 100%</button>
    </div>
  </aside>
  <div class="timed-bar" id="timed-bar" hidden>
    <span id="timed-label">Pacing...</span>
    <button type="button" class="focus-toggle" id="timed-skip">Take it now</button>
    <div class="timed-track"><div class="timed-fill" id="timed-fill"></div></div>
  </div>
  <div class="prose" id="text">${renderParagraphs(story.body)}</div>
  <p class="end" aria-hidden="true">· · ·</p>
  ${renderLinger(story)}
  ${renderKeeps(story)}
  ${renderEditorialShot(story)}
</article>
${next}`,
  });
}

const SETTLE_ASK = Object.freeze({
  pace: "Which room leads for you?",
  type: "How big should the words be?",
  move: "How much should the page move?",
});
const SETTLE_HINT = Object.freeze({
  pace: {
    day: "let today's calendar pick; all four are one tap away",
    slow: "make me wait — sensory craft and withheld touch first",
    dirty: "now — direct dialogue and heat first",
    warm: "stay inside — laughter and domestic closeness first",
    sharp: "keep score — negotiated authority and precision first",
  },
  type: { set: "", larger: "a size up, everywhere" },
  move: { breathe: "the drop cap, the line that turns, the timed pulse", still: "no fades, no waits, just the static page" },
});

function renderSettle(prefs) {
  const groups = Object.keys(SETTLE)
    .map((key) => {
      const options = Object.entries(SETTLE[key])
        .map(([value, label]) => {
          const hint = SETTLE_HINT[key][value];
          return `<label><input type="radio" name="${key}" value="${value}"${prefs[key] === value ? " checked" : ""}> <span>${escapeHtml(label)}${hint ? ` <span class="note">· ${escapeHtml(hint)}</span>` : ""}</span></label>`;
        })
        .join("");
      return `<fieldset><legend>${escapeHtml(SETTLE_ASK[key])}</legend>${options}</fieldset>`;
    })
    .join("");
  const remembered = isSettled(prefs)
    ? `<p class="settled note">Kept on this device: ${escapeHtml(settleLine(prefs))}.</p>`
    : "";
  return layout({
    prefs,
    crumb: "settle",
    mood: Object.hasOwn(REGISTER, prefs.pace) ? prefs.pace : "",
    title: "Settle in — smut.today",
    description: "Tell the room how you like it: which register leads, how big the words are, whether the page moves. Kept on this device until you say forget.",
    canonical: "https://smut.today/settle/",
    body: `<header class="piece-head">
  <p class="kicker">Settle in</p>
  <h1>Tell the room how you like it.</h1>
  <p class="lede">It remembers on this device only, in one small cookie, and only because you asked. Come back and the room is already the way you left it. Say forget and it is gone.</p>
  ${remembered}
</header>
<form class="settle" method="post" action="/settle/">
  ${groups}
  <p class="actions">
    <button class="cta" type="submit" name="keep" value="1">Keep this</button>
    <button class="cta cta-quiet" type="submit" name="forget" value="1">Forget me</button>
  </p>
  <p class="keep"><button type="button" class="cta cta-quiet" id="keep-app" hidden>Keep smut.today offline on this device</button></p>
  <p class="note pwa-note" id="pwa-status" aria-live="polite" hidden></p>
</form>`,
  });
}

function settleFromForm(form) {
  const prefs = { ...SETTLE_DEFAULT };
  for (const key of Object.keys(SETTLE)) {
    const value = String(form.get(key) || "");
    if (SETTLE[key][value]) prefs[key] = value;
  }
  return prefs;
}

function jsonToday(now) {
  const featured = featuredStory(now);
  return {
    site: "smut.today",
    date: new Date(now).toISOString().slice(0, 10),
    featured: featured.slug,
    registers: Object.keys(REGISTER),
    murmur: murmur(now),
    stories: STORIES.map((s) => ({
      slug: s.slug,
      title: s.title,
      summary: s.summary,
      register: s.register,
      audience: s.audience,
      since: s.since,
      minutes: readMinutes(s),
      pairing: s.pairing,
      tags: s.tags,
      cadence: s.cadence,
      linger: (s.linger || []).map((l) => l.ask),
      edition: s.edition,
    })),
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

    if (url.pathname === "/manifest.webmanifest") {
      return new Response(`${JSON.stringify(MANIFEST, null, 2)}\n`, {
        headers: {
          ...BASE_SECURITY,
          "Content-Type": "application/manifest+json; charset=UTF-8",
          "Cache-Control": cache,
        },
      });
    }

    if (url.pathname === "/text-scale-head.js") {
      return new Response(CARRIED_TEXT_SCALE_HEAD, {
        headers: {
          ...BASE_SECURITY,
          "Content-Type": "text/javascript; charset=UTF-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    if (url.pathname === "/text-scale.js") {
      return new Response(CARRIED_TEXT_SCALE, {
        headers: {
          ...BASE_SECURITY,
          "Content-Type": "text/javascript; charset=UTF-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    if (url.pathname === "/text-scale.css") {
      return new Response(CARRIED_TEXT_SCALE_CSS, {
        headers: {
          ...BASE_SECURITY,
          "Content-Type": "text/css; charset=UTF-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    if (PINCH_PATH && url.pathname === PINCH_PATH) {
      return new Response(CARRIED_PINCH, {
        headers: {
          ...BASE_SECURITY,
          "Content-Type": "text/javascript; charset=UTF-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    if (url.pathname === "/app.js") {
      return new Response(APP_JS, {
        headers: {
          ...BASE_SECURITY,
          "Content-Type": "text/javascript; charset=UTF-8",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    if (url.pathname === "/sw.js") {
      return new Response(SW_JS, {
        headers: {
          ...BASE_SECURITY,
          "Content-Type": "text/javascript; charset=UTF-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    const iconName = url.pathname.startsWith("/icons/") ? url.pathname.slice(7) : "";
    if (iconName && ICONS[iconName]) {
      return new Response(smutIconPng(ICONS[iconName].size, ICONS[iconName]), {
        headers: {
          ...BASE_SECURITY,
          "Content-Type": "image/png",
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
      return new Response(JSON.stringify({ version: VERSION, ...jsonToday(now) }, null, 2), {
        headers: {
          ...BASE_SECURITY,
          "Content-Type": "application/json; charset=UTF-8",
          "Cache-Control": cache,
          "X-Robots-Tag": "noindex",
        },
      });
    }

    const prefs = readSettle(request);
    const htmlHeaders = {
      ...BASE_SECURITY,
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": prefs.kept ? "private, max-age=300" : cache,
      Vary: "Cookie",
      "X-Robots-Tag": "noindex, nofollow",
    };

    if (url.pathname === "/settle" || url.pathname === "/settle/") {
      if (request.method === "POST") {
        const form = await request.formData();
        const forget = form.has("forget");
        return new Response(null, {
          status: 303,
          headers: {
            ...BASE_SECURITY,
            Location: "/",
            "Cache-Control": "no-store",
            "Set-Cookie": forget ? SETTLE_CLEAR : settleCookie(settleFromForm(form)),
          },
        });
      }
      return new Response(renderSettle(prefs), { headers: { ...htmlHeaders, "Cache-Control": "no-store" } });
    }

    if (url.pathname === "/" || url.pathname === "") {
      const mood = url.searchParams.get("mood") || "";
      return new Response(renderIndex(now, prefs, mood), { headers: htmlHeaders });
    }

    if (url.pathname === "/to-you" || url.pathname === "/to-you/") {
      return new Response(renderLetter(prefs), { headers: htmlHeaders });
    }

    if (url.pathname === "/pitches" || url.pathname === "/pitches/") {
      return new Response(renderPitches(prefs), { headers: htmlHeaders });
    }

    const slug = url.pathname.replace(/^\/+|\/+$/g, "");
    const story = storyBySlug(slug);
    if (story) {
      return new Response(renderStory(story, prefs, url.searchParams.get("mood") || ""), { headers: htmlHeaders });
    }

    return new Response("No door here. The way in is https://smut.today/\n", {
      status: 404,
      headers: {
        ...BASE_SECURITY,
        "Content-Type": "text/plain; charset=UTF-8",
        "Cache-Control": "no-store",
      },
    });
  },
};
