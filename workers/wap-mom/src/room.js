/**
 * The writers' room for Wondering About Pi.
 *
 * Everything the periodical says lives in this file, so it can be read and
 * changed on stream, in conversation. The other modules only set it in type.
 *
 * An issue moves through three states:
 *   "open"  — a slot the room is holding. A working title and a question, no text.
 *   "draft" — text exists and is printed, but the room has not settled it.
 *   "set"   — the room agrees. Change it only with a correction (see CORRECTIONS).
 *
 * Each series is numbered by its own constant. Wondering About Pi runs
 * 3.1, 3.14, 3.141…; The e Supplement runs 2.7, 2.71, 2.718…. Order within a
 * series in the ISSUES list is the number.
 *
 * An issue may carry a figure: an instrument the reader can move. `kind`
 * names a drawing in figures.js; `caption` is the room's.
 */

// How the periodical writes. Agreed in the room; revised the same way.
export const HOUSE_STYLE = [
  "Every sentence is meant. The periodical does not wink.",
  "The mathematics is right. When a figure is approximate, say by how much.",
  "Pie is treated with the same care as π.",
  "No reader is described. Write for someone who will pass it on without a synopsis.",
  "Write like a host, not a lecturer. Every issue leaves uses: something for the hand, the table, the work, and the mind.",
  "A figure is an instrument, not an illustration. It should be worth moving.",
];

// Questions the room is holding. A stream can take one up.
export const OPEN_QUESTIONS = [
  "What is the smallest true thing about π that still surprises?",
  "Which approximation deserves an issue of its own?",
  "What does a recipe prove?",
  "Where do π and e meet outside of an equation?",
];

// The dimensions every issue offers a use in. Rename them here and every
// issue's Uses panel follows.
export const USES = [
  ["hand", "In the hand"],
  ["table", "At the table"],
  ["work", "At work"],
  ["mind", "In the mind"],
];

// The two series. Each is numbered by its constant and printed in its own ink.
export const SERIES = {
  pi: {
    name: "Wondering About Pi",
    short: "π",
    digits: "3.14159265358979323846264338327950288419716939937510",
    volume: "Vol. 3",
    label: "No.",
    about: "The periodical. Circles, approximations, and pie.",
  },
  e: {
    name: "The e Supplement",
    short: "e",
    digits: "2.71828182845904523536028747135266249775724709369995",
    volume: "Vol. 2",
    label: "Supplement",
    about: "Bound in with the periodical. Growth, rising, and things that compound.",
  },
};

// Departments group issues in the table of contents.
export const DEPARTMENTS = {
  constants: { name: "Constants", about: "The numbers themselves." },
  approximations: { name: "Approximations", about: "Close, and by how much." },
  kitchen: { name: "Kitchen", about: "Pie, treated with the same care." },
  chance: { name: "Chance", about: "Constants that turn up in random things." },
  proofs: { name: "Proofs", about: "What can be shown, and what cannot." },
  series: { name: "Series", about: "Sums that go on forever and still arrive." },
  growth: { name: "Growth", about: "Things that feed on themselves." },
};

// Corrections, newest first: { date, issue (slug), text }.
export const CORRECTIONS = [];

// People who shaped an issue in the room. Names appear only with their say-so.
export const ROOM = [];

export const ISSUES = [
  {
    slug: "pi",
    series: "pi",
    department: "constants",
    status: "draft",
    date: "2026-09-24",
    title: "π",
    dek: "It does not close.",
    body: [
      "Wrap a string around a pie tin, then lay the same string across the middle. The string around is a little more than three times as long as the string across.",
      "It is the same amount more for every tin, every plate, every round thing in the house. That amount is π. Its digits never end and never settle into a pattern. Every digit is exact, and there is always another: an infinite courtesy.",
      "This periodical is numbered by it. Each issue adds a digit. We will not run out.",
    ],
    clip: "Every digit is exact, and there is always another: an infinite courtesy.",
    figure: { kind: "unroll", caption: "Change the width. The circle's edge, unrolled, is always a little over three widths long." },
    uses: {
      hand: "Measure across a round pan and multiply by a little over three to know how much ribbon goes around it. A 10-inch pan takes about 31½ inches.",
      table: "Every round thing on the table, plate or glass rim, carries the same ratio. Anyone with a string can check.",
      work: "Some ratios do not depend on size. When something works the same at every scale, find out what it is keeping constant.",
      mind: "There is a digit of π no one has ever looked at, and it is already decided.",
    },
  },
  {
    slug: "22-7",
    series: "pi",
    department: "approximations",
    status: "draft",
    date: "2026-09-24",
    title: "22/7",
    dek: "Close enough to share.",
    body: [
      "Twenty-two divided by seven is 3.142857, repeating. It is a little too big, off by about one part in 2,500.",
      "Over two thousand years ago, Archimedes trapped π between two shapes with ninety-six sides each, one just inside a circle and one just outside. 22/7 was the outside edge of the trap, and it is the one people kept.",
      "Close is not cheap. Close is hospitality.",
    ],
    clip: "Close is not cheap. Close is hospitality.",
    figure: { kind: "polygons", caption: "Archimedes' trap. Double the sides and the inside and outside close in on π from both directions." },
    uses: {
      hand: "A 7-inch plate is 22 inches around, near enough. Multiply a width by 22, divide by 7, and you are within a hair.",
      table: "An answer someone can use now is often kinder than an exact one that arrives late.",
      work: "Before chasing precision, say how close is close enough. One part in 2,500 has served for two thousand years.",
      mind: "Archimedes knew his answer was wrong, and exactly how wrong. That is its own kind of knowing.",
    },
  },
  {
    slug: "pie",
    series: "pi",
    department: "kitchen",
    status: "draft",
    date: "2026-09-24",
    title: "Pie",
    dek: "The crust is a proof.",
    body: [
      "A pie is a circle you are allowed to cut.",
      "Everything about it is measured before it is baked: the flour, the fat, the heat, the time. The oven is the only argument that convinces a room.",
      "A pie that waits for the knife is a theorem with a crust. π never ends. Pie ends when it is shared.",
    ],
    clip: "A pie that waits for the knife is a theorem with a crust.",
    figure: { kind: "tins", caption: "Moving a recipe between tins. The filling scales with the square of the width." },
    uses: {
      hand: "Moving a 9-inch recipe into a 10-inch tin? The bigger tin holds about a quarter more, so scale the filling up by a quarter.",
      table: "The first slice always comes out untidy. Serve it to the baker.",
      work: "A recipe is a claim anyone with an oven can test. Write methods down so someone else could bake them.",
      mind: "π cannot be finished. A pie has to be. Most good things are one or the other.",
    },
  },
  {
    slug: "355-113",
    series: "pi",
    department: "approximations",
    status: "draft",
    date: "2026-09-24",
    title: "355/113",
    dek: "Six digits, six places.",
    body: [
      "About fifteen hundred years ago, the astronomer Zu Chongzhi gave two fractions for π. He called 22/7 the approximate ratio. He called 355/113 the close one.",
      "Divide it out and it matches π to six decimal places, off by less than three ten-millionths.",
      "No fraction with a smaller denominator comes closer. The next one that does is 52163/16604, which no one keeps anywhere.",
    ],
    clip: "No fraction with a smaller denominator comes closer.",
    figure: { kind: "fractions", caption: "Every denominator, and how close its best fraction gets. Higher is closer. A few stand far above their neighbors." },
    uses: {
      hand: "Write 113355, split it down the middle, and put the second half over the first. That is π to six places, with no calculator.",
      table: "For roughly nine hundred years after Zu Chongzhi, no one on record had a closer value.",
      work: "A big jump in effort for a small gain means the good version has already been found. After 355/113, the next better fraction needs five-digit numbers.",
      mind: "He reached it by hand, working with polygons of more than twelve thousand sides.",
    },
  },
  {
    slug: "crust",
    series: "pi",
    department: "kitchen",
    status: "draft",
    date: "2026-09-24",
    title: "Crust",
    dek: "The edge grows more slowly than the middle.",
    body: [
      "A nine-inch pie has about twenty-eight inches of edge. That is nine times π.",
      "Bake one twice as wide and it gets twice the edge, but four times the filling. The edge grows with the width. The middle grows with the width times itself.",
      "So a small pie has more edge for its size than a large one. The ratio is not a matter of taste. It is a matter of radius.",
    ],
    clip: "The ratio is not a matter of taste. It is a matter of radius.",
    figure: { kind: "edge", caption: "Every pie drawn the same size, with its outer ¾ inch shaded. The shaded share shrinks as the real pie grows." },
    uses: {
      hand: "One 18-inch pizza holds more than two 12-inch pizzas. Square the widths and compare: 324 against 288.",
      table: "Whoever loves the crust should ask for the small pie.",
      work: "In anything that grows outward, the part touching the outside grows more slowly than the whole. Plan for the middle.",
      mind: "A pie the size of a town would be nearly all filling. A pie the size of a coin would be nearly all crust.",
    },
  },
  {
    slug: "needles",
    series: "pi",
    department: "chance",
    status: "draft",
    date: "2026-09-24",
    title: "Needles",
    dek: "π, found by dropping things.",
    body: [
      "Draw straight lines across a sheet of paper, each one a toothpick's length from the next. Drop a toothpick on it, again and again, and count how often it lands across a line.",
      "It crosses about 64 times in every 100. The exact share is two divided by π. The Comte de Buffon asked this question in the 1700s. Floors have been answering it ever since.",
      "Drop enough toothpicks and you can work π backwards from your count. It takes a while: ten thousand drops usually gets you within a few hundredths.",
    ],
    clip: "Floors have been answering it ever since.",
    figure: { kind: "buffon", caption: "Needles one line-width long. Those that cross a line are marked. The same drops fall for every reader." },
    uses: {
      hand: "Any stick and any parallel lines will do, as long as the lines are one stick-length apart. A hundred drops often lands within a quarter of π.",
      table: "Two people dropping toothpicks can race to the better π. Whoever loses has still found π.",
      work: "A steady number can hide inside a pile of random events. Count enough small things and it shows itself.",
      mind: "π is in the kitchen floor, waiting for someone to drop something.",
    },
  },
  {
    slug: "slice",
    series: "pi",
    department: "kitchen",
    status: "draft",
    date: "2026-09-24",
    title: "Slice",
    dek: "Half the radius, times the crust.",
    body: [
      "Cut a pie into eight equal slices. Each one is an eighth of a full turn: forty-five degrees at the point.",
      "Here is a rule for any slice. Measure from the point to the crust, then along the crust. Multiply the two and take half. That is how much pie is in the slice.",
      "Do the same for the whole pie and you get the area of a circle, πr². The rule holds for any slice, of any pie, cut by anyone.",
    ],
    clip: "The rule holds for any slice, of any pie, cut by anyone.",
    figure: { kind: "sectors", caption: "The slices laid point to crust. The thinner they are cut, the closer the row comes to a rectangle π radii long." },
    uses: {
      hand: "For six slices, cut straight through the middle along the hands of a clock at 12, at 2, and at 4.",
      table: "One person cuts and the other chooses first. It is the oldest known way to make a division fair.",
      work: "A rule that holds however the cut is made is a rule you can hand to someone else.",
      mind: "Cut a pie into more and more slices and lay them point to crust, alternating. They become a rectangle: half the edge long and one radius tall. That is where πr² comes from.",
    },
  },
  {
    slug: "square",
    series: "pi",
    department: "proofs",
    status: "draft",
    date: "2026-09-24",
    title: "The Square",
    dek: "The one shape it will not become.",
    body: [
      "For more than two thousand years, people tried to draw a square with exactly the area of a circle, using only a compass and a straightedge. No measuring. No guessing.",
      "In 1882, Ferdinand von Lindemann proved it cannot be done. The reason is π itself: it is not only endless, it is a kind of number those two tools can never build.",
      "The circle keeps its area. It only declines to be squared.",
    ],
    clip: "The circle keeps its area. It only declines to be squared.",
    figure: { kind: "squarecircle", caption: "A round pan and the square that holds exactly as much. The kitchen can measure it; the compass cannot draw it." },
    uses: {
      hand: "A 9-inch round pan and an 8-inch square pan hold almost the same, within about half a percent. The kitchen squares the circle close enough.",
      table: "Some questions are answered by proving they cannot be. That is still an answer, and it lets everyone stop.",
      work: "When a goal keeps failing, check whether the tools allow it at all. Change the tools before blaming the effort.",
      mind: "The attempts turned up other discoveries along the way. A problem can be worth having even when it cannot be solved.",
    },
  },
  {
    slug: "patience",
    series: "pi",
    department: "series",
    status: "draft",
    date: "2026-09-24",
    title: "Patience",
    dek: "One, minus a third, plus a fifth, and so on.",
    body: [
      "Start with one. Take away a third. Add a fifth. Take away a seventh. Keep going forever, multiply what you have by four, and you have π exactly.",
      "Madhava found this in fourteenth-century India; Leibniz found it again in 1674. It is exact, and it is slow. A thousand steps in, you are still off by about a thousandth.",
      "Exact is not the same as quick.",
    ],
    clip: "Exact is not the same as quick.",
    figure: { kind: "leibniz", caption: "Each step overshoots, then undershoots, by a little less each time. The line is π." },
    uses: {
      hand: "Count along if you like. Ten steps leaves you off by about a tenth; a hundred, by about a hundredth.",
      table: "Everyone at the table can add the next fraction. No one finishes. Everyone gets closer.",
      work: "Here each new correct digit costs ten times the steps of the last. Some improvements are priced like that; know the price before starting.",
      mind: "The series is exact and never arrives. It is possible to be completely right and still on the way.",
    },
  },
  {
    slug: "steam",
    series: "pi",
    status: "open",
    title: "Steam",
    question: "How long should a pie rest, and can the resting be written down?",
  },
  {
    slug: "lattice",
    series: "pi",
    status: "open",
    title: "Lattice",
    question: "What does a lattice top count?",
  },
  {
    slug: "interest",
    series: "e",
    department: "growth",
    status: "draft",
    date: "2026-09-24",
    title: "Interest",
    dek: "Growth that never stops to count.",
    body: [
      "In 1683, Jacob Bernoulli asked a banker's question. Lend one coin for a year at one hundred percent. Paid once, it becomes two. Paid half at midyear and the rest at the end, with the half already earning, it becomes 2.25.",
      "Pay more often and it grows more, but not without limit. Monthly gives about 2.613. Daily gives about 2.715. Paid every instant, it gives 2.71828…, and that number is e.",
      "e is what growth comes to when it never stops to count.",
    ],
    clip: "e is what growth comes to when it never stops to count.",
    figure: { kind: "compound", caption: "One coin over one year at one hundred percent. The steps are the payments; the smooth curve is paying every instant." },
    uses: {
      hand: "Divide 72 by a yearly rate to find how many years it takes to double. At 6 percent, about 12.",
      table: "Paying more often always helps, and past monthly it barely does: 2.613 monthly against 2.718 forever.",
      work: "Small gains taken often add up to a ceiling, not to infinity. Know where the ceiling is.",
      mind: "Somewhere between once a year and every instant, the answer stops being a banker's and becomes a constant.",
    },
  },
  {
    slug: "rise",
    series: "e",
    department: "growth",
    status: "draft",
    date: "2026-09-24",
    title: "Rise",
    dek: "Half full, one doubling before the top.",
    body: [
      "A starter that doubles every four hours grows by the same small fraction every minute of those four hours. Growth that feeds on itself is written with e.",
      "Left a day, it would double six times and be sixty-four times its size, if the jar allowed.",
      "The jar is half full one doubling before it overflows. Most of the rising happens at the end.",
    ],
    clip: "The jar is half full one doubling before it overflows.",
    figure: { kind: "rise", caption: "Each gridline is one more doubling. On this scale, steady doubling is a straight line." },
    uses: {
      hand: "Put a rubber band around the jar at the level of a freshly fed starter. The band shows when it has doubled.",
      table: "Anything that doubles on a schedule gets away in its last few doublings. Check early.",
      work: "Compounding looks slow for most of its life and sudden at the end. Measure it by the doubling time, not the size.",
      mind: "Doubling every four hours for a week is forty-two doublings: more than four trillion times the start.",
    },
  },
  {
    slug: "starter",
    series: "e",
    status: "open",
    title: "Starter",
    question: "What does a sourdough starter know about e?",
  },
];
