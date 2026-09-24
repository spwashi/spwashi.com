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
    status: "open",
    title: "355/113",
    question: "Why is 355/113 closer to π than 22/7 by a factor of nearly five thousand, for only three more digits?",
  },
  {
    slug: "crust",
    status: "open",
    title: "Crust",
    question: "What does a crust hold that a filling cannot?",
  },
];
