// Files people keep, written in Spw, in four rows, each useful as it stands
// for a kind of journaling or production management. The bench is a lab
// notebook for developer-creators with a library and information science slant:
// each file catalogs, describes or changes part of a component and theming
// ecology; some keep what happened (a dated log, a catalog record, a controlled
// vocabulary, a change record) and some act or speak (an experiment and its
// probe, a session's steps, a persona held in regard). The study is
// metacognition from more than one place: a prediction checked, and a chapter
// read from four perspectives. The board lays professional personas side by
// side around one reference: their loops in parallel and their handoff in
// series, and the gradient of positions between two stances. The stage shows
// the syntax itself: joins, three headings kept in company at one subject, and
// a pattern whose performance sets the theme of the field. Lines are written
// short enough that no word breaks in a phone's editor. The guide opens one at a
// time in its editor, and the reading beside it says what a tool can take from
// the file. `try` names one edit whose effect shows in that reading.
//
// The files join each other (2026-11-10): where one speaks of another's
// subject it says so with a path, @chip: ~"./chip.spw", and a path may name the
// line it means, ~"./themes.spw#matte". The guide's reading turns each such
// path into a way to that file, landing on that line, and the file it reaches
// lists who points to it. Paths outside the fourteen stay as written.

export const EXAMPLE_GROUPS = Object.freeze(["Bench","Study","Board","Stage"]);

export const EXAMPLES = Object.freeze([
  {
    id: "notebook",
    group: "Bench",
    tab: "Lab notebook",
    file: "lab-notebook.spw",
    says: "Chronological empirical log: dated entries categorized by epistemological kind, allowing automated synthesis of bench progression across cataloging, experimental trials, metric measurements, and landed invariants.",
    try: "Add a line inside the braces: >>[2026-11-07 10:00] catalog — the card, in two dialects: lifted and flat",
    script: `#>lab_notebook
#:log #!components #!themes
@chip: ~"./chip.spw"
@matte: ~"./themes.spw#matte"

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
    says: "Bibliographic catalog record grounded in information science: title, cross-reference variants, categorical subjects, and evidentiary provenance.",
    try: "Add a see-also inside the braces: related_card = ~\"./card.spw\"",
    script: `#>component_chip
#:record #!component
@broader: ~"./control.spw"
@related: ~"./sigil.spw"
@tried: ~"./experiment.spw"

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
    says: "Controlled vocabulary and ontological schema: canonical preferred terms, non-preferred synonyms, and scoping notes ensuring conceptual alignment.",
    try: "Add a metamaterial term: ^\"vellum\"{ broader = `metamaterial` }[reg=facet]",
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
    says: "Metacognitive hypothesis testing: an epistemic inquiry pairing an interrogative wonder with an explicit hypothesis, expected outcome, and empirical verification probe.",
    try: "Delete the !probe line to observe the cognitive check report an ungrounded inquiry.",
    script: `#>wonder_ring_on_glass
@chip: ~"./chip.spw"
@glass: ~"./themes.spw#glass"
?["Does the ring chip read on the glass theme at a phone's width?"]{
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
    says: "Procedural session script: sequential operational transitions modeled as ordered path steps, enabling step-by-step execution tracking and state verification.",
    try: "Add a step: after !shelve, write ;?review",
    script: `#>catalog_session
#:script #!session
@record: ~"./chip.spw#record"

steps = path{~gather; *describe; ^classify; !shelve}
gather = shelf[ui]{chip.card}<record>`,
  },
  {
    id: "revision",
    group: "Bench",
    tab: "Change record",
    file: "change.spw",
    says: "Tripartite change episode: context scene, state transformation, and empirical verification criteria—the syntactic contract of every repository mutation.",
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
    says: "Situated epistemic persona: communicative voice, observational locus, epistemic axioms, and persistent heuristic habits held in regard.",
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
    says: "Metacognitive calibration model: pre-task prediction vs. post-task recall with scalar confidence assessments, quantified by a dimensional gradient %.",
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
}[reg=facet]

%confidence{before ~> after}`,
  },
  {
    id: "perspectives",
    group: "Study",
    tab: "Perspectives",
    file: "perspectives.spw",
    says: "Multi-agent deictic perspectivism: examining one focal chapter across four situated epistemic vantage points, aggregated into a unified thematic subject.",
    try: "Add a reading: kin = parent@ch2[curious]{why}<dinner>",
    script: `#>four_readings
#:reflection #!metacognition
@measured: ~"./calibration.spw"

me = student@ch2[sure]{recall}<quiz>
peer = peer@ch2[unsure]{spacing}<ask>
later = later@ch2[review]{kept}<exam>
tutor = tutor@ch2[watch]{gap}<lesson>

&ch2{recall, spacing, kept, gap}`,
  },
  {
    id: "loops",
    group: "Board",
    tab: "Persona loops",
    file: "loops.spw",
    says: "Collaborative workflow orchestration: concurrent persona execution loops coordinated through serial handoff gates and inter-loop communicative relays.",
    try: "Add a loop inside the braces: , conservator@scan{handling}",
    script: `#>persona_loops
#:board #!loops #!production
@archivist: ~"./archivist.spw"

reference = ~"./folios/release.spw"
ahead = #[\`the holds\`, \`the scans\`][reg=set]
loops = {
  archivist@scan{provenance},
  designer@scan{placement},
  editor@scan{caption}
}
each = path{~read; *note; ?ask; !hand_back}
handoff = path{^gather; ?check; !release}
relay = {archivist.provenance ~> editor.caption}

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
    says: "Continuous epistemic gradient: parameterizing decisions along a scalar spectrum between polarized stances, replacing binary dichotomy with nuanced spatial positioning.",
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
  {
    id: "syntax",
    group: "Stage",
    tab: "Syntax",
    file: "syntax.spw",
    says: "Syntactic and relational joins: associative company, sequential path order, communicative reach with ~>, perspectival regard, and nested constituent hierarchies.",
    try: "Change regard to tutor@indexing. The field beside it names tutor.",
    script: `#>syntax_stage
#:showcase #!syntax
@company: ~"./headings.spw#headings"

company = {student, classmate, later}
order = path{~read; *note; ?ask}
reach = home ~> topics
regard = student@indexing
nest = shelf{chip{ring, pill}, card{lifted}}
line = home[hook]{software.art}(atlas)<record>`,
  },
  {
    id: "headings",
    group: "Stage",
    tab: "Headings",
    file: "headings.spw",
    says: "Information organization and subject indexing: multiple competing indexing terms held in associative company, preserving ambiguity prior to catalog authorization.",
    try: "Add kin inside the brace, or change @indexing to @aboutness. The field lists the company and the subject.",
    script: `#>subject_headings
#:showcase #!indexing #!library

speaker = I
wondered = indexing
headings = {student, classmate, later}@indexing

?["Which heading would a catalog keep, and which stay in company?"]{
  ~#expect: \`the three stay; the catalog's one term is a later choice\`
  !probe{ "read the three names in the brace and say which one a shelf would authorize" }
}`,
  },
  {
    id: "perform",
    group: "Stage",
    tab: "Performs",
    file: "perform.spw",
    says: "Dynamic architectural configuration: when a structural pattern performs against an operational slot, the runtime materializes its declared theme consequence.",
    try: "Change theme from glass to matte and watch the field lose its shadow.",
    script: `#>pattern_performance
#:showcase #!pattern #!theme
@line: ~"./syntax.spw#line"

pattern = pivot
performs = one.slot
theme = glass
line = home[hook]{software.art}<atlas>

?["When the pivot performs, which theme should the page take?"]{
  ~#expect: \`glass, while one slot moves and the rest stays\`
  !probe{ "change theme to matte and watch the field lose its shadow" }
}`,
  },
]);

export const exampleById = (id) => EXAMPLES.find((example) => example.id === id) || null;
