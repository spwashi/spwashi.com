// Files people keep, written in Spw. Each is whole and practical, and each
// belongs to reading, writing, study or a persona held in regard: a reading
// log, a seminar question, a narrator's persona, reading notes, a revision
// note. The guide opens one at a time in its editor, and the reading beside it
// says what a tool can take from the file. `try` names one edit whose effect
// shows in that reading.

export const EXAMPLES = Object.freeze([
  {
    id: "notebook",
    tab: "Reading log",
    file: "reading-log.spw",
    says: "Dated entries, each with a kind, so a tool can sort them and count what was read, noticed and drafted.",
    try: "Add a line inside the braces: >>[2026-10-14 07:30] draft — a second paragraph, on Dorothea's letters",
    script: `#>reading_log
#:log #!seminar

^"stream"{
 >>[2026-10-09 07:30] read — Middlemarch, chapters 1 to 3
 >>[2026-10-11 21:10] notice — the narrator forgives a character before the reader does
 >>[2026-10-13 08:00] draft — one paragraph on sympathy as a way of reading
}`,
  },
  {
    id: "question",
    tab: "Question",
    file: "seminar.spw",
    says: "A question that says what would answer it, so it can be tested instead of argued.",
    try: "Delete the !probe line, and the check beside it changes.",
    script: `?["Does writing a question before reading help a seminar recall a chapter?"]{
  ~#hypothesis: \`a question gives the reading somewhere to land\`
  !probe{ "one group writes a question first, one reads cold; compare their summaries a week later" }
}`,
  },
  {
    id: "persona",
    tab: "Persona",
    file: "narrator.spw",
    says: "A persona held in regard: its voice, where it looks from, what it affirms, and what stayed.",
    try: "Add a line inside the braces: still_learning = `when to leave a question open`",
    script: `#>narrator_persona
#:persona #!novel

^"persona"{
  voice = \`patient, exact, fond of margins\`
  regards = \`the town from the library window\`
  affirms = \`a second reading is a new reading\`
  stayed = \`the habit of dating every note\`
}[reg=facet]`,
  },
  {
    id: "reading",
    tab: "Reading notes",
    file: "reading.spw",
    says: "Notes that point at their sources, so every link can be followed and checked.",
    try: "Add a source: @also: ~\"./sources/how-people-learn.spw\"",
    script: `#>reading_notes
@source: ~"./sources/make-it-stick.spw"
@applies_to: ~"./syllabus/week-3.spw"

^"chapter_2"{
  claim = \`recalling something fixes it better than rereading it\`
  use = \`close each seminar with a question, not a summary\`
}[reg=facet]`,
  },
  {
    id: "revision",
    tab: "Revision note",
    file: "revision.spw",
    says: "A revision, why it happened, and how it was checked: the form this site's own commits close with.",
    try: "Delete the *[verify] line, and the check beside it changes.",
    script: `#[episode]{
  ~[scene]{ the second chapter reads more clearly aloud than on the page }
  ![change]{ the letters now arrive before the garden scene }
  *[verify]{ a reader in the workshop found the turn on the first pass }
}`,
  },
]);

export const exampleById = (id) => EXAMPLES.find((example) => example.id === id) || null;
