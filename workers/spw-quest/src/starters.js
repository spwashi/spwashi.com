// Lines to start from, one for each setting where a link to spw.quest tends to
// be shared: a post about marketing, growth, frontend work, finding someone to
// hire, or finding a place to work. Each line is three things at once:
//   ask    a question it raises in one reply
//   talk   a turn that keeps a longer conversation going
//   build  a file it could start, and which of the guide's files to open first
// Every line opens in /build to change a slot (the guide links no /pivot of its
// own), and is short enough for /pivot?line= and the canvas (test/starters.test.mjs).

export const STARTERS = Object.freeze([
  Object.freeze({
    id: "marketing",
    setting: "Marketing",
    line: "launch[soft]{waitlist, story, proof}<audience>",
    ask: "Which of the three would you cut first?",
    talk: "Change soft to loud and say what each part has to become.",
    build: "One line per launch you have run, so the next one starts from them.",
    open: "review",
  }),
  Object.freeze({
    id: "growth",
    setting: "Growth",
    line: "funnel[weekly]{visit ~> signup ~> paid}<cohort>",
    ask: "Where does this funnel leak most?",
    talk: "Add a step between signup and paid, and say what it measures.",
    build: "A pipeline that counts each step by cohort, week over week.",
    open: "pipeline",
  }),
  Object.freeze({
    id: "frontend",
    setting: "Frontend",
    line: "page[slow]{bundle, images, fonts}<phone>",
    ask: "Which of these would you measure first?",
    talk: "Change phone to desk, and say what drops off the list.",
    build: "A record of each fix: the metric, the diff, and the test run.",
    open: "records",
  }),
  Object.freeze({
    id: "hiring",
    setting: "Finding talent",
    line: "role[frontend]{react, a11y, design}<team>",
    ask: "Which skill is this role really asking for?",
    talk: "Write the same role at junior and at senior, and say which parts move.",
    build: "A role card per person, pointing to the snippets they kept.",
    open: "role",
  }),
  Object.freeze({
    id: "search",
    setting: "Finding a company",
    line: "search[senior]{fit, pay, growth}<company>",
    ask: "Which of the three would you trade first?",
    talk: "Add a fourth part, and say what it costs the other three.",
    build: "One line per company you talk to, compared two at a time.",
    open: "onboarding",
  }),
]);

/** The section the guide shows under its opening. `href` builders come from the worker so links stay in one form. */
export function startersSection(escapeHtml, { editHref, exampleHref, canvasHref, tabOf }) {
  const cards = STARTERS.map((s) => `<article class="door starter" id="start-${escapeHtml(s.id)}">
      <h3>${escapeHtml(s.setting)}</h3>
      <p><code>${escapeHtml(s.line)}</code></p>
      <p><strong>Ask</strong> ${escapeHtml(s.ask)}</p>
      <p><strong>Talk</strong> ${escapeHtml(s.talk)}</p>
      <p><strong>Build</strong> ${escapeHtml(s.build)}</p>
      <p class="starter-ways"><a href="${escapeHtml(editHref(s.line))}">Change a slot</a> · <a href="${escapeHtml(exampleHref(s.open))}">Open ${escapeHtml(tabOf(s.open))}</a> · <a href="${escapeHtml(canvasHref(s.line))}" target="_blank" rel="noopener">Canvas ↗</a></p>
    </article>`).join("\n    ");
  return `<section id="start" class="band" aria-labelledby="start-title">
  <h2 id="start-title">Start from a line</h2>
  <p>Each line below is a question to ask in one reply, a turn that keeps a longer conversation going, and a seed for a file. Change any slot to make it yours.</p>
  <div class="doors">
    ${cards}
  </div>
</section>`;
}
