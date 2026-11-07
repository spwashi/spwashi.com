// Files people keep, written in Spw, in three rows, each useful as it stands
// for a kind of journaling or production management. The bench is a lab
// notebook for developer-creators with a library and information science slant:
// each file catalogs, describes or changes part of a component and theming
// ecology; some keep what happened (a dated log, a catalog record, a controlled
// vocabulary, a change record) and some act or speak (an experiment and its
// probe, a session's steps, a persona held in regard). The study is
// metacognition from more than one place: a prediction checked, and a chapter
// read from four perspectives. The board lays professional personas side by
// side around one reference: their loops in parallel and their handoff in
// series, and the gradient of positions between two stances. Lines are written
// short enough that no word breaks in a phone's editor. The guide opens one at a
// time in its editor, and the reading beside it says what a tool can take from
// the file. `try` names one edit whose effect shows in that reading.

export const EXAMPLE_GROUPS = Object.freeze(["Bench","Study","Board"]);

export const EXAMPLES = Object.freeze([
  {
    id: "notebook",
    group: "Bench",
    tab: "Lab notebook",
    file: "lab-notebook.spw",
    says: "Dated entries, each with a kind, so a tool can sort the bench's days and count what was cataloged, tried, measured and landed.",
    try: "Add a line inside the braces: >>[2026-11-07 10:00] catalog — the card, in two dialects: lifted and flat",
    script: `#>lab_notebook
#:log #!components #!themes

^"stream"{
 >>[2026-11-06 09:10] catalog — the chip, in three dialects on one screen: pill, ring, plain
 >>[2026-11-06 11:40] try — the matte theme on the chip: the ring holds its edge, the pill loses it
 >>[2026-11-06 14:05] measure — --shape-panel read 22 times in 11 files, with three fallbacks
 >>[2026-11-06 17:30] land — one inset for every panel on a phone
}`,
  },
  {
    id: "record",
    group: "Bench",
    tab: "Catalog record",
    file: "chip.spw",
    says: "A component cataloged as a library would: its title, the names it also goes by, what it sits under and beside, and where the record came from.",
    try: "Add a see-also inside the braces: related_card = ~\"./card.spw\"",
    script: `#>component_chip
#:record #!component
@broader: ~"./control.spw"
@related: ~"./sigil.spw"

^"record"{
  title = \`chip\`
  also_called = #[\`pill\`, \`ring\`, \`plain\`][reg=set]
  subjects = #[\`handle\`, \`operator\`, \`touch target\`][reg=set]
  provenance = \`cataloged 2026-11-06 from three screens\`
}[reg=facet]`,
  },
  {
    id: "vocabulary",
    group: "Bench",
    tab: "Theme vocabulary",
    file: "themes.spw",
    says: "A controlled vocabulary: one preferred word per theme, the words it is used for, and a scope note, so two people file a look under the same name.",
    try: "Add a term: ^\"paper\"{ broader = `metamaterial` }[reg=facet]",
    script: `#>theme_vocabulary
#:vocabulary #!themes

^"matte"{
  use_for = #[\`flat\`, \`chalk\`][reg=set]
  scope = \`a surface that takes no light; text sits on it at full contrast\`
  broader = \`metamaterial\`
}[reg=facet]

^"glass"{
  use_for = #[\`frosted\`, \`liquid\`][reg=set]
  scope = \`a surface that lets what lies beneath show through, refracted\`
  broader = \`metamaterial\`
}[reg=facet]`,
  },
  {
    id: "question",
    group: "Bench",
    tab: "Experiment",
    file: "experiment.spw",
    says: "A question that says what it expects and how to find out, so it can be run instead of argued.",
    try: "Delete the !probe line, and the check beside it changes.",
    script: `?["Does the ring chip read on the glass theme at a phone's width?"]{
  ~#hypothesis: \`a ring keeps its edge where a pill's fill washes out\`
  ~#expect: \`the ring holds 3:1 against the busiest panel; the pill does not\`
  !probe{ "screenshot the chip row on glass at 390px and measure each edge's contrast" }
  $%[ring.reads, pill.reads, neither]
}`,
  },
  {
    id: "script",
    group: "Bench",
    tab: "Session script",
    file: "session.spw",
    says: "A session written as steps in order, so a tool can walk them one at a time and say which step it is on.",
    try: "Add a step: after !shelve, write ;?review",
    script: `#>catalog_session
#:script #!session

steps = path{~gather; *describe; ^classify; !shelve}
gather = shelf[ui]{chip.card}<record>`,
  },
  {
    id: "revision",
    group: "Bench",
    tab: "Change record",
    file: "change.spw",
    says: "A change, why it happened, and how it was checked: the form this site's own commits close with.",
    try: "Delete the *[verify] line, and the check beside it changes.",
    script: `#[episode]{
  ~[scene]{ a panel body drew a second wall on a phone, and its text sat on the line }
  ![change]{ a body slot keeps no wall of its own below 45rem }
  *[verify]{ heading, body and first line share one edge on fourteen frames }
}`,
  },
  {
    id: "persona",
    group: "Bench",
    tab: "Persona",
    file: "archivist.spw",
    says: "A persona held in regard: its voice, where it looks from, what it affirms, and what stayed.",
    try: "Add a line inside the braces: still_learning = `when a record should stay open`",
    script: `#>archivist_persona
#:persona #!library

^"persona"{
  voice = \`plain, exact, fond of see-also\`
  regards = \`the component shelf from the reading room\`
  affirms = \`a record is a promise that a thing can be found again\`
  stayed = \`the habit of naming where each thing came from\`
}[reg=facet]`,
  },
  {
    id: "calibration",
    group: "Study",
    tab: "Calibration",
    file: "calibration.spw",
    says: "A prediction before studying and a check after it, each with a confidence, so a student can see whether they knew what they thought they knew.",
    try: "Change the confidence after to 0.8, and the change between the two facets shows beside it.",
    script: `#>calibration
#:study #!metacognition

^"before"{
  predict = \`I can say why recalling beats rereading\`
  confidence = 0.7
}[reg=facet]

^"after"{
  recalled = \`two of the three reasons\`
  confidence = 0.5
  next = \`reread chapter 2 with a question written first\`
}[reg=facet]`,
  },
  {
    id: "perspectives",
    group: "Study",
    tab: "Perspectives",
    file: "perspectives.spw",
    says: "One chapter read from four places: the student, a classmate, a future self and a teacher, each with how sure they are and where the reading leads.",
    try: "Add a reading: kin = parent@ch2[curious]{why}<dinner>",
    script: `#>four_readings
#:reflection #!metacognition

me = student@ch2[sure]{recall}<quiz>
peer = peer@ch2[unsure]{spacing}<ask>
later = later@ch2[review]{kept}<exam>
tutor = tutor@ch2[watch]{gap}<lesson>`,
  },
  {
    id: "loops",
    group: "Board",
    tab: "Persona loops",
    file: "loops.spw",
    says: "A board of personas, each running its own loop around one reference: what is planned ahead, what runs in parallel (the loops, joined by ,), and what has to follow in series (the handoff, joined by ;).",
    try: "Add a loop inside the braces: , conservator@scan{handling}",
    script: `#>persona_loops
#:board #!loops #!production

reference = ~"./folios/release.spw"
ahead = #[\`the holds\`, \`the scans\`][reg=set]
loops = {
  archivist@scan{provenance},
  designer@scan{placement},
  editor@scan{caption}
}
each = path{~read; *note; ?ask; !hand_back}
handoff = path{^gather; ?check; !release}

?["What must one loop hand another before it can start?"]{
  ~#expect: \`only the caption waits, on provenance\`
  !probe{ "list what each loop reads; what another loop writes goes in the handoff" }
}`,
  },
  {
    id: "gradient",
    group: "Board",
    tab: "Gradient space",
    file: "gradient.spw",
    says: "One reference laid out between two professional stances, an archivist who keeps and a designer who reshapes, as positions from 0.10 to 0.90, so a choice is a place on the gradient instead of a side.",
    try: "Add a position: `0.55 keep the slices, ask the reader`",
    script: `#>gradient_space
#:board #!gradient

reference = ~"./plans/index.spw"
from = archivist@plans{keep}
to = designer@plans{reshape}
gradient = #[
  \`0.10 keep every line as written\`,
  \`0.40 keep the dates, rewrite the slices\`,
  \`0.70 keep the wonders, redraw the order\`,
  \`0.90 rebuild around the reader\`
][reg=set]

?["Where on this gradient does each plan sit today?"]{
  ~#expect: \`most sit near 0.40\`
  !probe{ "read each plan's head line and name its place" }
}`,
  },
]);

export const exampleById = (id) => EXAMPLES.find((example) => example.id === id) || null;
