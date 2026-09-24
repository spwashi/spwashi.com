/**
 * The writers' room for Wondering About Pi.
 *
 * Everything the periodical says lives in this file, so it can be read and
 * changed on stream, in conversation. index.js only sets it in type.
 *
 * An issue moves through three states:
 *   "open"  — a slot the room is holding. A working title and a question, no text.
 *   "draft" — text exists and is printed, but the room has not settled it.
 *   "set"   — the room agrees. Change it only with a correction.
 *
 * Issues are numbered by the decimal expansion of π: the first issue is
 * No. 3.1, the next 3.14, then 3.141. Order in this list is the number.
 */

// How the periodical writes. Agreed in the room; revised the same way.
export const HOUSE_STYLE = [
  "Every sentence is meant. The periodical does not wink.",
  "The mathematics is right. When a figure is approximate, say by how much.",
  "Pie is treated with the same care as π.",
  "No reader is described. Write for someone who will pass it on without a synopsis.",
];

// Questions the room is holding. A stream can take one up.
export const OPEN_QUESTIONS = [
  "What is the smallest true thing about π that still surprises?",
  "Which approximation deserves an issue of its own?",
  "What does a recipe prove?",
];

// People who shaped an issue in the room. Names appear only with their say-so.
export const ROOM = [];

export const ISSUES = [
  {
    slug: "pi",
    status: "draft",
    title: "π",
    dek: "It does not close.",
    body: [
      "Measure the distance around a circle and divide it by the distance across. Every circle gives the same answer, and no one can write that answer down in full.",
      "π is the work here: an infinite courtesy. Every digit is exact, and there is always another.",
      "This periodical is numbered by it. Each issue adds a place. We will not run out.",
    ],
    clip: "π is the work here: an infinite courtesy.",
  },
  {
    slug: "22-7",
    status: "draft",
    title: "22/7",
    dek: "Close enough to share.",
    body: [
      "Twenty-two sevenths is 3.142857, repeating. It is larger than π by about 0.00126, an error of four parts in ten thousand.",
      "Archimedes reached it by drawing polygons of ninety-six sides inside and outside a circle. He showed that π lies between 223/71 and 22/7. The upper bound is the one that stayed in use.",
      "Close is not cheap. Close is hospitality.",
    ],
    clip: "Close is not cheap. Close is hospitality.",
  },
  {
    slug: "pie",
    status: "draft",
    title: "Pie",
    dek: "The crust is a proof.",
    body: [
      "A pie is a circle you are allowed to divide. Cut through the center and every slice keeps its share of the edge.",
      "Mise en place is the lemma. The oven is the only argument that convinces a room. A pie that waits for the knife is a theorem with a crust.",
      "Wonder about π, then about pie: the same sound, different duties. One never ends. One ends when it is shared.",
    ],
    clip: "A pie that waits for the knife is a theorem with a crust.",
  },
  {
    slug: "355-113",
    status: "draft",
    title: "355/113",
    dek: "Six places from six digits.",
    body: [
      "Zu Chongzhi, working in fifth-century China, gave two fractions for π. He called 22/7 the approximate ratio and 355/113 the close one.",
      "The close one agrees with π to six decimal places; it is off by about 0.00000027. No fraction with a smaller denominator comes nearer. The next that does is 52163/16604.",
      "The reason is written in π itself. Its continued fraction begins 3; 7, 15, 1, 292, and a large term like 292 means the fraction just before it was already very nearly exact.",
    ],
    clip: "No fraction with a smaller denominator comes nearer.",
  },
  {
    slug: "crust",
    status: "draft",
    title: "Crust",
    dek: "The edge grows more slowly than the middle.",
    body: [
      "A nine-inch pie has about twenty-eight and a quarter inches of edge. That is nine times π.",
      "Double the width and the edge doubles, but the filling quadruples. The crust holds the circumference; the filling holds the area, and area grows with the square.",
      "A small pie has more rim for its filling than a large one. The ratio is not a matter of taste. It is a matter of radius.",
    ],
    clip: "The ratio is not a matter of taste. It is a matter of radius.",
  },
  {
    slug: "needles",
    status: "draft",
    title: "Needles",
    dek: "π, arrived at by chance.",
    body: [
      "Rule a floor with parallel lines one needle's length apart and drop the needle anywhere. It will cross a line about sixty-four times in a hundred.",
      "The exact chance is two divided by π. Georges-Louis Leclerc, Comte de Buffon, posed the question in the eighteenth century, and the floor has been answering it since.",
      "Count the crossings and π comes back, slowly. Ten thousand drops typically land within a few hundredths of it.",
    ],
    clip: "The floor has been answering it since.",
  },
  {
    slug: "slice",
    status: "draft",
    title: "Slice",
    dek: "Half the radius, times the crust.",
    body: [
      "Cut a pie into eight equal pieces and each takes an eighth of a turn: π/4 radians, or forty-five degrees.",
      "The filling in a slice is exactly half the radius times the length of its crust. The rule holds for any slice, of any pie, cut by anyone.",
      "Apply it to the whole pie and it becomes the area of a circle: half the radius times the full edge, which is πr².",
    ],
    clip: "The rule holds for any slice, of any pie, cut by anyone.",
  },
  {
    slug: "square",
    status: "draft",
    title: "The Square",
    dek: "The one figure it will not become.",
    body: [
      "For more than two thousand years, geometers tried to draw, with compass and straightedge alone, a square with exactly the area of a given circle.",
      "In 1882 Ferdinand von Lindemann proved that π is transcendental: it is not the root of any polynomial with whole-number coefficients. That settled the matter. The square cannot be drawn.",
      "The circle keeps its area. It only declines to be squared.",
    ],
    clip: "The circle keeps its area. It only declines to be squared.",
  },
  {
    slug: "patience",
    status: "draft",
    title: "Patience",
    dek: "One, minus a third, plus a fifth, and so on.",
    body: [
      "Madhava of Sangamagrama found, in the fourteenth century, that π/4 = 1 − 1/3 + 1/5 − 1/7 + …, forever. Leibniz found it again in 1674.",
      "It is exact, and it is slow. After a thousand terms, four times the sum still misses π by about a thousandth.",
      "Exact is not the same as quick.",
    ],
    clip: "Exact is not the same as quick.",
  },
  {
    slug: "steam",
    status: "open",
    title: "Steam",
    question: "How long should a pie rest, and can the resting be written down?",
  },
  {
    slug: "lattice",
    status: "open",
    title: "Lattice",
    question: "What does a lattice top count?",
  },
];
