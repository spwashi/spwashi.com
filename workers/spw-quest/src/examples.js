// Files people keep, written in Spw. Each is whole and practical: a log, a
// question, a decision, reading notes, a commit note. The guide opens one at a
// time in its editor, and the reading beside it says what a tool can take from
// the file. `try` names one edit whose effect shows in that reading.

export const EXAMPLES = Object.freeze([
  {
    id: "notebook",
    tab: "Notebook",
    file: "garden.spw",
    says: "Dated entries, each with a kind, so a tool can sort them and count what was decided.",
    try: "Add a line inside the braces: >>[2026-10-14 07:30] verify — no new spots on bed B",
    script: `#>garden_log
#:log #!beds

^"stream"{
 >>[2026-10-09 07:30] observe — mildew on the squash in bed B
 >>[2026-10-10 18:10] decide — water bed B at dawn for two weeks
 >>[2026-10-13 07:45] verify — fewer spotted leaves on new growth
}`,
  },
  {
    id: "question",
    tab: "Question",
    file: "mildew.spw",
    says: "A question that says what would answer it, so it can be tested instead of argued.",
    try: "Delete the !probe line, and the check beside it changes.",
    script: `?["Does watering at dusk bring more mildew?"]{
  ~#hypothesis: \`leaves that stay wet overnight spot first\`
  !probe{ "water bed A at dusk and bed B at dawn; count spotted leaves each Sunday" }
}`,
  },
  {
    id: "decision",
    tab: "Decision",
    file: "decision.spw",
    says: "What was chosen, why, and when to look again, under names a tool can read back.",
    try: "Change the status from \"trial\" to \"kept\".",
    script: `^"decision_2026_10_13"{
  chose = \`one shared calendar for the garden beds\`
  because = \`two lists drifted, and bed B was watered twice\`
  revisit = \`after the first frost\`
  status = "trial"
}`,
  },
  {
    id: "reading",
    tab: "Reading notes",
    file: "reading.spw",
    says: "Notes that point at their sources, so every link can be followed and checked.",
    try: "Add a source: @also: ~\"./sources/how-people-learn.spw\"",
    script: `#>reading_notes
@source: ~"./sources/make-it-stick.spw"
@applies_to: ~"./plans/onboarding.spw"

^"chapter_2"{
  claim = \`recalling something fixes it better than rereading it\`
  use = \`end each lesson with a question, not a summary\`
}[reg=facet]`,
  },
  {
    id: "commit",
    tab: "Commit note",
    file: "commit.spw",
    says: "A change, why it happened, and how it was checked: the form this site's own commits close with.",
    try: "Delete the *[verify] line, and the check beside it changes.",
    script: `#[episode]{
  ~[scene]{ new readers stopped at the install step }
  ![change]{ the guide opens with a file you can edit }
  *[verify]{ routes test passes, and nothing overflows at phone width }
}`,
  },
]);

export const exampleById = (id) => EXAMPLES.find((example) => example.id === id) || null;
