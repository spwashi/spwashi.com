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
// the syntax itself: joins in pairs worth comparing, three headings kept in
// company at one subject, a pattern whose performance sets the theme of the
// field, and numbers written whole the way the workbench's number reader takes
// them (spw.number-form/1: 400ms, 0.1%, 4/3, 412(18)ms). Lines are written
// short enough that no word breaks in a phone's editor. The guide opens one at a
// time in its editor, and the reading beside it says what a tool can take from
// the file. `try` names one edit whose effect shows in that reading.
//
// The files join each other (2026-11-10): where one speaks of another's
// subject it says so with a path, @chip: ~"./chip.spw", and a path may name the
// line it means, ~"./themes.spw#matte". The guide's reading turns each such
// path into a way to that file, landing on that line, and the file it reaches
// lists who points to it. Paths outside the guide's files stay as written.
//
// The trial row is written against the canvas (2026-11-10). Each file is one a
// person could keep, and each asks factshift.center something the other rows
// do not: how far down a reader can walk, whether a word holds still while its
// slot changes, whether neighbors under different laws can say why they differ,
// and what a wide body does on a phone. `asks` says which.
//
// The team row is what a software team passes around, written so a reader at
// any level can find their way in (2026-11-14). The pipeline walks the common
// data-processing pass with each step wearing the mark that names its job; the
// review says one point by valence, stance and register; the records are the
// forms engineering data takes; the surfaces are print's and the screen's; and
// the primitives and algorithms name the parts most code is built from, each
// with its cost class in the concept, <O(n log n)>; a role card holds one
// member's skills applied to a role, with the snippets they kept; the levels
// hold one ticket at four rungs, so a hold and a compare on the canvas name
// the slots that move; and the onboarding path routes a junior, a mid-level, a
// senior and a staff engineer through the files (2026-11-16).

export const EXAMPLE_GROUPS = Object.freeze(["Bench","Study","Board","Stage","Trial","Team","Practice"]);

export const EXAMPLES = Object.freeze([
  {
    id: "notebook",
    group: "Bench",
    tab: "Lab notebook",
    file: "lab-notebook.spw",
    says: "A dated work log tagged by what happened: catalog something noticed, try an alternative, measure what changed, and land the fix.",
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
    says: "A compact library card for one UI component: canonical name, aliases across teams, searchable subjects, and links to related specs.",
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
    says: "A shared glossary so designers and engineers use one canonical term instead of drifting between synonyms.",
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
    says: "A testable UI question before opening a PR: state the hypothesis, predict the failing edge case, and name the screenshot or check that settles it.",
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
    says: "A short repeatable checklist in execution order, linking to the record it operates on.",
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
    says: "A three-part changelog or commit contract: what was broken in context, what changed, and how you verified it.",
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
    says: "A working persona card for an assistant or teammate: tone, vantage point, core promise, and daily habit.",
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
    says: "A confidence check before and after studying or shipping: capture prediction errors early so estimates improve next round.",
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
    says: "Four viewpoints on the same material — self, peer, future self, tutor — showing where each reader sees something different.",
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
    says: "Parallel team tracks that meet at explicit handoffs: spot the single dependency blocking another collaborator before work stalls.",
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
    says: "A spectrum of concrete middle-ground options between two extremes, helping teams locate where they actually stand.",
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
    id: "debate",
    group: "Board",
    tab: "Debate & repair",
    file: "debate.spw",
    says: "Three collaborators heard one word — cut — and walked away with three different plans. Putting every reading into the same slots exposes which constraint parted them, names quiet assumptions beside the lines, and logs each round toward repair.",
    try: "Change priya@[story]'s scene from (tuesday) to (friday), or add an alex@[...] reading.",
    asks: "Before debating who is wrong, which slot did the speakers read differently?",
    script: `#>resolve_misunderstanding
#:dialogue #!mediation
@critique: ~"./review.spw#stance"

topic = term[shared]{"hold the cut on Friday"}

maya@[picture]{pacing, sound_lock}(friday)<cut>
devon@[budget]{overtime, gear_return}(friday)<cut>
priya@[story]{opening_scene, title_card}(tuesday)<cut>

^"assumptions"{
  ~#maya_expects(friday locks picture; mix runs next week)
  ~#devon_expects(friday ends stage rental and overtime)
  ~#priya_expects(tuesday trims narrative before sound mixes)
}

^"rounds"{
  >>[2026-11-12 10:00] crux — Maya heard timing, Devon heard spend, Priya heard deletion
  >>[2026-11-12 10:15] reframe — separate priya@<trim> on Tuesday from maya@<lock> and devon@<wrap> on Friday
  >>[2026-11-12 10:30] settle — three named milestones replace the single overloaded word
}

?["Can Tuesday narrative trim clear before Friday sound and wrap without overtime?"]{
  ~#expect: \`naming trim and wrap separately turns one impasse into an ordered sequence\`
  !probe{ "trace Tuesday trim ~> Thursday mix ~> Friday wrap and ask each speaker which blocker remains" }
}`,
  },
  {
    id: "syntax",
    group: "Stage",
    tab: "Syntax",
    file: "syntax.spw",
    says: "Joins in pairs worth comparing: company and order (no order, then an order), reach and chain (~> goes toward, -> chains into), regard and subject (@ from where, & about what); a nest; and one line beside itself with one slot turned.",
    try: "Change regard to tutor@indexing. The field beside it names tutor.",
    script: `#>syntax_stage
#:showcase #!syntax
@company: ~"./headings.spw#headings"

company = {student, classmate, later}
order = path{~read; *note; ?ask}
reach = home ~> topics
chain = draft -> page
regard = student@indexing
subject = &indexing{student, classmate}
nest = shelf{chip{ring, pill}, card{lifted}}
line = home[hook]{software.art}(atlas)<record>
turned = home[live]{software.art}(atlas)<record>`,
  },
  {
    id: "headings",
    group: "Stage",
    tab: "Headings",
    file: "headings.spw",
    says: "Candidate taxonomy terms held together before committing one label across docs, navigation, or search.",
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
    says: "A live style directive: changing `theme` between glass, matte, and paper switches this workspace card's material on the spot.",
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
  {
    id: "numbers",
    group: "Stage",
    tab: "Numbers",
    file: "numbers.spw",
    says: "A number written whole inside a measure's brackets, the way the workbench's number reader takes it: 400ms, 0.1%, 4/3, 1e6, a range 3.8..4.6%, and an uncertainty in its last digits, 412(18)ms. The body says what was measured and the scene when; a cost class rides in the concept; math Spw would misread stays in backticks. A percent's % still counts as a measure mark on this page.",
    try: "Change 412(18)ms to 412(6)ms. Its low end is now 406ms, over the budget.",
    script: `#>numbers
#:showcase #!notation
@metric: ~"./records.spw#metric"
@cost: ~"./algorithms.spw#merge_sort"

budget = ^checkout{ %p95[400ms] %errors[0.1%] =retries[3] }
latency = %p95[412(18)ms]{checkout}(week)
change = %p95{612ms ~> 412ms}(checkout)
conversion = %rate[3.8..4.6%]{signup}(week)
scale = %step[4/3]{type}
rows = %count[1e6]{orders}
cost = sort[merge]{runs}<O(n log n)>
growth = \`1 < log n < n < n log n < n^2 < 2^n\`

?["Is checkout over its budget this week?"]{
  ~#expect: \`not surely: 412(18)ms reaches down to 394ms, under 400ms\`
  !probe{ "measure more requests until the uncertainty is under 12ms" }
}`,
  },
  {
    id: "outline",
    group: "Trial",
    tab: "Outline",
    file: "outline.spw",
    says: "A course four levels deep: terms hold units, units hold weeks, weeks hold what is read and done.",
    try: "Add a part inside the deepest braces: margin, recall, retell",
    asks: "On the canvas, walk down to one reading and back up without losing your place.",
    script: `#>course_outline
#:outline #!curriculum
@session: ~"./session.spw"

course = term{
  unit{
    week{read{chapter, margin}, do{drill, recall}},
    week{read{essay}, do{studio}}
  },
  unit{
    week{read{review}, do{retry}}
  }
}`,
  },
  {
    id: "recurrence",
    group: "Trial",
    tab: "Recurrence",
    file: "rain.spw",
    says: "One word in four slots: rain as the subject, a part, a scene, and where a line goes.",
    try: "Change the scene on song from rain to dusk, and the word appears once less.",
    asks: "On the canvas, pin rain and step the lines. It should hold still while its slot changes.",
    script: `#>rain_ledger
#:study #!identity
@headings: ~"./headings.spw"

morning = rain[light]{gutter, path}
field = soil[wet]{rain, roots}
song = chorus{verse, bridge}(rain)
barrel = !water{roof ~> barrel}<rain>`,
  },
  {
    id: "laws",
    group: "Trial",
    tab: "Local laws",
    file: "kitchen.spw",
    says: "Four neighbors under four laws: what lifts, what drifts, what stays, and what will not close.",
    try: "Change ~soup to =soup, and on the canvas its parts stop drifting.",
    asks: "On the canvas, frame each body and read why its parts move as they do. ?stock will not fold.",
    script: `#>kitchen_laws
#:showcase #!physics
@perform: ~"./perform.spw"

kitchen = {
  ^bread{flour, water},
  ~soup{beans, salt},
  =spice{cumin, clove},
  ?stock{bones, time}
}`,
  },
  {
    id: "pantry",
    group: "Trial",
    tab: "Wide body",
    file: "pantry.spw",
    says: "A census of one shelf: sixteen things in company, read as a list and as a set of places.",
    try: "Add a seventeenth part after dill.",
    asks: "On a phone's canvas, can all sixteen be read, or does it have to fold?",
    script: `#>pantry_census
#:record #!inventory

pantry = shelf[full]{
  oats, rice, lentils, barley,
  salt, sugar, yeast, honey,
  vinegar, oil, cumin, clove,
  bay, thyme, sage, dill
}`,
  },
  {
    id: "pipeline",
    group: "Team",
    tab: "Data pipeline",
    file: "pipeline.spw",
    says: "The common data-processing pass, in order: ground the units, fix the schema, keep valid rows, compute, join, group, sum, rank, index, show, and page on. Each step wears the mark that names its job.",
    try: "Add a step after &join{customers}: ; ?keep[active]{customer}",
    script: `#>order_pipeline
#:pipeline #!data
@records: ~"./records.spw#schema"
@review: ~"./review.spw"

source = $orders[csv]{id, customer, qty, price}
steps = path{
  .ground{utc, usd};
  =schema{qty, price};
  ?keep[valid]{qty, price};
  !map{total};
  &join{customers};
  ^group[by]{customer};
  %sum{total};
  *rank[desc]{total};
  #index{customer};
  @show[top]{ten};
  ~next{page}
}
run = {source ~> steps ~> report}

?["Which step must run before the sum?"]{
  ~#expect: \`the keep, so a bad row never reaches %sum\`
  !probe{ "move ?keep below %sum and read what the total now counts" }
}`,
  },
  {
    id: "review",
    group: "Team",
    tab: "Review voice",
    file: "review.spw",
    says: "One review point said three ways: by valence, from warm to blocking; by stance, from a question to a requirement, with a confidence; and by register, for a junior, a mid-level or a senior engineer.",
    try: "Change confidence to 0.5, and add a boon line of your own.",
    script: `#>review_voice
#:nuance #!review
@pipeline: ~"./pipeline.spw#steps"

point = keep{before ~> sum}

^"valence"{
  boon = \`Good catch: no bad row reaches the sum.\`
  bone = \`The keep runs before the sum.\`
  bane = \`A bad row can still reach the sum.\`
  bonk = \`The total doubled after this merge.\`
  honk = \`This blocks the release.\`
}[reg=facet]

^"stance"{
  ask = ?point<curious>
  offer = ~point<suggestion>
  need = !point<blocking>
  credit = *point<kept>
  confidence = 0.8
}[reg=facet]

^"register"{
  junior = explain[step]{why, how, try}
  mid = weigh[trade]{cost, option}
  senior = flag[risk]{scope, owner}
}[reg=facet]`,
  },
  {
    id: "records",
    group: "Team",
    tab: "Engineering records",
    file: "records.spw",
    says: "The records a software team passes around, each in a line: a schema, a config, an API contract, a dependency graph, a test run, a metric, a diff, a ticket, a trace, and a dated log.",
    try: "Add a line: owner = team[payments]{checkout, refunds}",
    script: `#>engineering_records
#:record #!engineering
@pipeline: ~"./pipeline.spw"

schema = order{id, customer, qty, price}
config = checkout[prod]{timeout, retries}
contract = post[orders]{order ~> receipt}<api>
deps = service{web ~> api, api ~> db}
tests = suite[checkout]{pass, fail, skip}
metric = latency[p95]{checkout}<week>
diff = change[timeout]{ten ~> thirty}
ticket = bug[open]{checkout, timeout}<t812>
trace = request{web ~> api ~> db}<span>

^"log"{
 >>[2026-11-14 09:12] error — checkout timed out at 10s
 >>[2026-11-14 09:40] change — timeout raised to 30s
 >>[2026-11-14 10:05] measure — p95 back under 400ms
}`,
  },
  {
    id: "surfaces",
    group: "Team",
    tab: "Publishing surfaces",
    file: "surfaces.spw",
    says: "The interactive surfaces of print and of the screen as two censuses, the hand each one asks for, and the print surface each screen surface grew from.",
    try: "Add a print surface after insert: , bookmark",
    script: `#>publishing_surfaces
#:census #!publishing
@records: ~"./records.spw"

print = book{
  cover, spine, endpaper, contents,
  spread, margin, footnote, caption,
  pull_quote, index, fold_out, insert
}
screen = page{
  link, button, menu, search,
  form, field, dialog, tab,
  scroll, carousel, comment, share,
  player, map, toast, tooltip
}
hands = {
  turn{spread, fold_out, insert},
  scan{contents, index, caption},
  tap{link, button, tab, share},
  type{search, field, comment},
  drag{scroll, carousel, map}
}
lineage = {
  contents ~> menu, index ~> search,
  footnote ~> tooltip, spread ~> scroll,
  margin ~> comment, insert ~> dialog
}`,
  },
  {
    id: "primitives",
    group: "Team",
    tab: "Primitives",
    file: "primitives.spw",
    says: "The values and structures most code is built from, each with what it does quickly and what that costs in O(): scalars, then lists, maps and sets, stacks and queues, heaps, trees and graphs.",
    try: "Add a structure: trie = tree[prefix]{insert, lookup}<O(k)>",
    script: `#>primitives
#:census #!computing
@algorithms: ~"./algorithms.spw#dedupe"

scalars = {number, text, flag, none, time}
array = list[indexed]{read, append}<O(1)>
map = table[hashed]{put, get, has}<O(1)>
set = table[unique]{add, has}<O(1)>
stack = list[last_in]{push, pop}<O(1)>
queue = list[first_in]{enqueue, dequeue}<O(1)>
heap = tree[ordered]{push, pop_min}<O(log n)>
tree = node[balanced]{value, children}<O(log n)>
graph = node{value, edges}<O(V + E)>

?["Which structure would you reach for to dedupe a stream?"]{
  ~#expect: \`a set, since has is O(1) where a list's is O(n)\`
  !probe{ "count lookups per row with a list, then with a set" }
}`,
  },
  {
    id: "algorithms",
    group: "Team",
    tab: "Algorithms",
    file: "algorithms.spw",
    says: "Common algorithms as paths of marked steps, each with its cost class in the concept: search two ways, a sort beside its recurrence, three graph walks that differ only in what holds the frontier (a queue, a stack, a heap), an order of dependencies, a dedupe, a window, and a memo.",
    try: "Add one: two_pointers = path{=left{start}; =right{end}; ~step{inward}; ?meet}<O(n)>",
    script: `#>algorithms
#:study #!computing
@primitives: ~"./primitives.spw"
@pipeline: ~"./pipeline.spw#steps"

linear_search = path{~scan{each}; ?compare{target}}<O(n)>
binary_search = path{
  =range{low, high};
  ~halve{mid};
  ?compare{target};
  @return{index}
}<O(log n)>
merge_sort = path{~split{half}; *sort{each}; ^merge{runs}}<O(n log n)>
recurrence = \`T(n) = 2T(n/2) + n\`
bfs = path{=queue{start}; ~visit{edges}; #seen{node}}<O(V + E)>
dfs = path{=stack{start}; ~visit{edges}; #seen{node}}<O(V + E)>
dijkstra = path{=heap{start}; ~relax{edges}; #seen{node}}<O(E log V)>
topo_sort = path{=queue{no_incoming}; ~remove{edges}; @emit{order}}<O(V + E)>
dedupe = path{=set{seen}; ?has{row}; !add{row}}<O(n)>
window = path{=edges{left, right}; ~slide; %sum{inside}}<O(n)>
memo = path{?seen{subproblem}; !solve; #keep{answer}}<O(states)>

?["Which two lines differ in one word, and what does it change?"]{
  ~#expect: \`bfs and dfs: a queue walks out by distance, a stack down by depth\`
  !probe{ "walk the site's links from Home both ways and list the first five pages each reaches" }
}`,
  },
  {
    id: "role",
    group: "Team",
    tab: "Role card",
    file: "role.spw",
    says: "One member's skills applied to a role: what they bring, the snippets they kept and where each came from, and what they will build first. A team can read every card and build from the snippets the cards point to.",
    try: "Add a kept snippet: ~\"./records.spw#trace\"",
    script: `#>role_card
#:role #!team
@pipeline: ~"./pipeline.spw"
@records: ~"./records.spw"
@surfaces: ~"./surfaces.spw"

role = frontend[mid]{pages, forms, speed}<team>
brings = skill{a11y, testing, design_handoff}
kept = #[
  ~"./surfaces.spw#lineage",
  ~"./records.spw#metric",
  ~"./pipeline.spw#steps"
][reg=set]
first = !build[form]{checkout ~> receipt}
measure = %latency[p95]{before ~> after}

?["Which kept snippet does the first build lean on?"]{
  ~#expect: \`the lineage, since a form grew from a printed one\`
  !probe{ "build the form, then say which snippet you reread twice" }
}`,
  },
  {
    id: "levels",
    group: "Team",
    tab: "Levels",
    file: "levels.spw",
    says: "One ticket at four levels. The act and the problem stay the same on every line; what a junior, a mid-level, a senior and a staff engineer touch, where it lives, and how far ahead they plan each move one rung.",
    try: "Add a rung: principal = !fix[timeout]{strategy, hiring}(company)<years>",
    script: `#>levels
#:compare #!engineering
@ticket: ~"./records.spw#ticket"
@onboarding: ~"./onboarding.spw"

task = bug[open]{checkout, timeout}<t812>
junior = !fix[timeout]{checkout}(function)<day>
mid = !fix[timeout]{checkout, retries}(service)<week>
senior = !fix[timeout]{retries, alert, budget}(system)<quarter>
staff = !fix[timeout]{budget, owner, policy}(teams)<year>

?["What moves from one level to the next, and what stays?"]{
  ~#expect: \`the act and the problem stay; the parts, the place and the horizon move\`
  !probe{ "hold junior on the canvas, compare it with staff, and name each slot that moved" }
}`,
  },
  {
    id: "onboarding",
    group: "Team",
    tab: "Onboarding path",
    file: "onboarding.spw",
    says: "Four paths through the team's files: what a junior, a mid-level, a senior and a staff engineer read first, change, and teach in their first week.",
    try: "Add a step to the junior path, after ?ask{review}: ; ~read{levels}",
    script: `#>team_onboarding
#:plan #!onboarding
@pipeline: ~"./pipeline.spw"
@review: ~"./review.spw#register"
@records: ~"./records.spw"
@surfaces: ~"./surfaces.spw"
@levels: ~"./levels.spw"

junior = path{~read{pipeline}; !change{one_step}; ?ask{review}}
mid = path{^own{pipeline}; ~read{records}; !review{peer}}
senior = path{*shape{surfaces}; =set{contract}; !teach{review}}
staff = path{^align{teams}; *shape{records}; !write{levels}}
week = {junior, mid, senior, staff} ~> demo

?["What can each of them change by Friday?"]{
  ~#expect: \`a junior one step, a mid one record, a senior one contract, a staff one plan two teams share\`
  !probe{ "each says in one line what they changed and where it shows" }
}`,
  },
  {
    id: "cinema",
    group: "Team",
    tab: "Film career",
    file: "film-stages.spw",
    says: "A film student across four career stages: first-year coverage, junior sound and assembly cut, senior thesis lock, and festival release. Keeping every stage in the same slots shows what shifts from shoot to mix to release.",
    try: "Change cut_two to picture_lock in senior, or add an alum line.",
    asks: "As the crew and stakes change from freshman exercises to festival distribution, which slot carries the shift first?",
    script: `#>film_career
#:curriculum #!film
@notes: ~"./notebook.spw"
@feedback: ~"./review.spw#valence"

year_1 = !shoot[coverage]{framing, eyeline, room_tone}(hallway)<assembly>
junior = !cut[rough_cut]{rhythm, dialogue, temp_mix}(edit_bay)<screening>
senior = !lock[cut_two]{color, foley, title_cards}(thesis_suite)<master>
fest = !ship[premiere]{dcp_check, press_kit, q_and_a}(festival)<release>

^"dailies"{
  >>[2026-11-10 18:40] take_04 — corridor walk holds focus past the doorway turn
  >>[2026-11-11 09:15] mix — drop temp score under the kitchen line so the mug lands
}

?["Does the corridor cut carry the beat without the temp score?"]{
  ~#expect: \`the eyeline turn holds attention when the music drops out\`
  !probe{ "mute the score track from slate 04 to the doorway cut and screen with cold ears" }
}`,
  },
  {
    id: "checkin",
    group: "Practice",
    tab: "Room check-in",
    file: "studio-sync.spw",
    says: "Short (6 lines). A lightweight weekly household or shared-studio reset: what is covered, what needs restocking, and one open ask before errands.",
    try: "Swap @sam's part from trash to compost, or add a third item to $pot.",
    script: `#>studio_weekly_sync
#:social #!routine

@alex[kitchen]{dishes, counters}(sunday)<clear>
@sam[floor]{trash, recycling}(sunday)<curb>
$pot[shared]{%balance[42usd]; need{filter, tape, soap}}
?["Who can grab oat milk before Tuesday morning?"]{
  ~#expect: \`whoever passes the corner market on Monday evening\`
  !probe{ "reply in the kitchen chat with an emoji if picked up" }
}`,
  },
  {
    id: "decision",
    group: "Practice",
    tab: "Compact ADR",
    file: "adr-014.spw",
    says: "Short (9 lines). A scannable one-screen architecture decision record naming options weighed, chosen boundary, cost, and reversal condition.",
    try: "Move sse out of considered into chosen, or tighten revisit from 90d to 30d.",
    script: `#>adr_014_live_updates
#:decision #!architecture
@records: ~"./records.spw"

=revisit[90d]{metrics}
considered = #[polling, sse, websocket][reg=set]
!choose[sse]{one_way, standard_http}(browser)<stream>
?["When does two-way editing force a move to websockets?"]{
  ~#expect: \`when presence cursors exceed 15fps per room\`
  !probe{ "measure outbound frames per minute once collaborative cursors ship" }
}`,
  },
  {
    id: "gathering",
    group: "Practice",
    tab: "Potluck & access",
    file: "potluck.spw",
    says: "Medium (19 lines). Social event organizing with allergy labels, transit/wheelchair access, shift handoffs, and backup seating capacity.",
    try: "Add a label to dishes, or change cap from 24 to 30 and check what tightens.",
    script: `#>autumn_potluck
#:social #!event
@debate: ~"./debate.spw"

cap = %guests[24]{main_room}
access = =venue{step_free, quiet_alcove, unscented_soap}
hosts = {
  nina@[welcome]{badges, pronoun_pins, coat_rack}(door)<greeting>,
  omar@[table]{ingredient_cards, vegan_tray, nut_free_zone}(kitchen)<safety>,
  lin@[cleanup]{compost_bins, leftovers_jars, dish_wash}(sink)<reset>
}
flow = path{~arrive[18:00]; *eat[18:45]; ^skill_share[19:45]; !pack[21:15]}

^"notes"{
  >>[2026-11-15 12:00] check — radiator bleed finished; side window latches cleanly
  >>[2026-11-16 09:30] restock — added compostable containers for unclaimed leftovers
}

?["Can every guest eat two mains safely without cross-contact?"]{
  ~#expect: \`two labeled nut-free vegan trays sit on a separate counter\`
  !probe{ "walk the serving table with Omar at 18:15 and verify spoon tags" }
}`,
  },
  {
    id: "incident",
    group: "Practice",
    tab: "Incident review",
    file: "incident.spw",
    says: "Medium (23 lines). Blameless production P1 postmortem mixing exact SLA numbers, a dated timeline, root cause episode, and concrete follow-ups.",
    try: "Lower %errors[4.8 ~> 0.04%] target, or add a follow-up item inside corrective.",
    script: `#>inc_2026_11_12_checkout
#:postmortem #!sre
@pipeline: ~"./pipeline.spw"
@records: ~"./records.spw#ticket"

impact = ^checkout{ %p95[412ms ~> 1840ms] %errors[0.1 ~> 4.8%] $window[19m] }
responders = {
  @oncall[triage]{rollback, feature_flag}<mitigate>,
  @db_lead[diagnostics]{connection_pool, lock_wait}<root_cause>,
  @comms[status_page]{customer_notice, merchant_eta}<trust>
}

#[episode]{
  ~[scene]{ a catalog sync deployed without jitter drained checkout read replicas }
  ![change]{ cap sync workers at 4 with exponential backoff and pool isolation }
  *[verify]{ soak test at 3x Tuesday peak holds p95 below 380ms }
}

^"timeline"{
  >>[2026-11-12 14:02] alert — checkout p95 crossed 1200ms threshold in us-east
  >>[2026-11-12 14:11] isolate — paused catalog sync workers; connection wait dropped
  >>[2026-11-12 14:21] resolve — error rate returned to 0.08% across all shards
}`,
  },
  {
    id: "critique",
    group: "Practice",
    tab: "Reading circle",
    file: "reading-circle.spw",
    says: "Medium (16 lines). A structured peer critique or seminar format holding generous timeboxes, concrete text citations, and unanswered questions.",
    try: "Add a fourth reader stance after @skeptic, or adjust turn length.",
    script: `#>thursday_reading_circle
#:social #!study
@perspectives: ~"./perspectives.spw"
@headings: ~"./headings.spw"

protocol = =session[60m]{
  silent_read[10m],
  descriptive_echo[15m],
  open_questions[20m],
  maker_response[15m]
}
stances = {
  @first_reader[surface]{pacing, opening_hook}<clarity>,
  @craft_peer[structure]{transitions, evidence_links}<form>,
  @skeptic[assumption]{edge_cases, missing_voices}<rigor>
}

?["Did the group name what the draft actually does before advising fixes?"]{
  ~#expect: \`fifteen minutes of descriptive echo keeps early advice from flattening intent\`
  !probe{ "ask the maker which observation in phase two surprised them most" }
}`,
  },
  {
    id: "negotiation",
    group: "Practice",
    tab: "SLA redlines",
    file: "vendor-sla.spw",
    says: "Long & detailed (36 lines). Multi-team SaaS procurement and contract negotiation reconciling security, legal, and product constraints into concrete redlines.",
    try: "Tighten rto from 4h to 1h, or log a new round in ^\"rounds\".",
    script: `#>vendor_sla_negotiation
#:contract #!procurement
@incident: ~"./incident.spw"
@gradient: ~"./gradient.spw"

targets = ^sla{ %uptime[99.95%] %rto[4h] %rpo[15m] %p99_webhook[250ms] }
non_negotiable = =security{
  soc2_type2,
  eu_residency,
  breach_notice[24h],
  key_rotation[90d]
}

stances = {
  @security[compliance]{audit_logs, subprocessor_notice}(pre_sign)<gate>,
  @legal[liability]{indemnity_cap, termination_notice}(msa)<redline>,
  @product[timeline]{sandbox_access, webhook_replay}(q4_launch)<value>
}

redlines = path{
  ~request[48h_breach_window ~> 24h_breach_window];
  =anchor[cap_2x_annual ~> cap_12m_fees];
  ^bundle[sso_saml, scim_provisioning]{included_at_tier}
}

^"rounds"{
  >>[2026-11-04 11:00] draft — vendor standard MSA omitted subprocessor 30d objection right
  >>[2026-11-08 15:20] revise — vendor accepted 24h breach notice and EU cluster pinning
  >>[2026-11-13 10:15] counter — legal swapped unlimited cap for 2x fees plus data escrow
}

#[episode]{
  ~[scene]{ launch slipped two weeks while security and vendor legal argued indemnity wording }
  ![change]{ separate operational security controls from liability cap using escrow trigger }
  *[verify]{ countersigned DPA plus passing sandbox webhook replay test before cutoff }
}`,
  },
  {
    id: "charter",
    group: "Practice",
    tab: "Co-op charter",
    file: "coop-charter.spw",
    says: "Long & detailed (39 lines). Community tool-library and shared press co-op governance: sliding-scale dues, tool checkout safety, conflict repair, and audit ledger.",
    try: "Adjust dues sliding range or add a seasonal maintenance task inside care.",
    script: `#>eastside_tool_coop
#:civic #!commons
@gathering: ~"./potluck.spw"
@debate: ~"./debate.spw"

stewardship = ^membership{
  $dues[15..45usd]{sliding_scale, work_trade_option}
  ?badge[certified]{bandsaw, risograph, kiln}(orientation)<safety>
  =access{keycard[7..22h], buddy_rule[power_tools]}
}

roles = {
  @librarian[catalog]{barcodes, overdue_nudges, waitlist}(desk)<circulation>,
  @mechanic[shop]{blade_tension, belt_check, calibration}(bench)<safety>,
  @treasurer[ledger]{grants, rent_split, fee_waivers}(books)<solvency>,
  @mediator[care]{conflict_notes, repair_circle, boundary}(room)<trust>
}

borrow_cycle = path{
  ~reserve[7d];
  ?verify_badge;
  !checkout[log_condition];
  *use[safe_hours];
  %inspect[clean, sharp];
  !return
}

^"audit"{
  >>[2026-10-18 14:00] inspect — replaced frayed cord on orbital sander before Sunday hours
  >>[2026-11-02 19:15] policy — waived late fees during transit strike week for all members
  >>[2026-11-14 16:40] workshop — certified 9 new risograph stewards with two-color run
}

?["Do sliding-scale dues and two annual grants cover shop rent plus blades?"]{
  ~#expect: \`38 active members at 26usd median plus grant headroom keeps 3 months reserve\`
  !probe{ "reconcile October bank statements against tool replacement invoices at open meeting" }
}`,
  },
  {
    id: "synthesis",
    group: "Practice",
    tab: "Field research",
    file: "field-study.spw",
    says: "Long & detailed (38 lines). Research synthesis turning 14 recorded sessions into uncertainty bounds, opposing mental models, and an actionable product bet.",
    try: "Adjust %completion[0.64(0.12)] sample stats or add a bet inside ^\"bets\".",
    script: `#>checkout_accessibility_study
#:research #!ux
@calibration: ~"./calibration.spw"
@incident: ~"./incident.spw"

sample = ^cohort{
  %sessions[14]{screen_reader[5], low_vision[4], keyboard_only[3], voice[2]}
  %completion[0.64(0.12)]{coupon_flow}(mobile)
  %time_on_task[148(31)s ~> 62(14)s]{after_focus_fix}
}

mental_models = {
  @newcomer[visual]{expects_inline_error_by_button}(card_form)<feedback>,
  @screen_reader[sequential]{loses_focus_when_promo_drawer_remounts}(dom)<trap>,
  @keyboard_user[rapid]{needs_skip_to_pay_above_shipping_upsells}(tab_order)<speed>
}

tensions = &friction{
  speed_upsell ~ accessibility,
  animation ~ focus_stability,
  compact_summary ^ full_line_item_clarity
}

^"bets"{
  *bet_one[inline_live_region]{announce coupon delta in aria_live instead of modal}<week>
  *bet_two[preserve_focus]{keep focus on toggle button across drawer open and close}<week>
  ~bet_three[one_page_summary]{collapse itemized taxes behind explicit disclosure}<quarter>
}

^"sessions"{
  >>[2026-11-05 10:30] observe — VoiceOver jumped to footer when discount field cleared DOM
  >>[2026-11-09 14:15] prototype — stable DOM container cut promo abandonment in 4 of 5 trials
}

?["Does fixing focus restoration raise VoiceOver completion past 0.85 without slowing sighted users?"]{
  ~#expect: \`keeping one live node lifts screen-reader pass rate and trims median checkout by 18s\`
  !probe{ "re-run the 5-task scripted benchmark with 8 assistive-tech testers on staging build" }
}`,
  },
]);

export const exampleById = (id) => EXAMPLES.find((example) => example.id === id) || null;
