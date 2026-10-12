// The first steps into Spw, as storyboard panels at one door, copied verbatim from
// the workbench's single source (.spw/_workbench/docs/learn/quest.spw: ^["storyboard"],
// ^["steps"] and ^["checks"]). A host may show fewer fields; it may not reorder the
// panels or reword a try line. The route test compares this copy to that file
// whenever the mount carries it.

export const STEPS = Object.freeze([
  {
    id: "write",
    scene: "(morning)",
    speaker: "@you",
    bubble: "caption",
    layer: "level_1",
    try: "the same door, again this morning",
    reads: "Plain words. Spw keeps them as words and asks nothing of you.",
    notice: "Nothing is missing from a sentence. The file stays a note you could read on paper.",
    check: "parses",
    grow: "Anything you already write can move into .spw as it is.",
  },
  {
    id: "act",
    scene: "(threshold)",
    speaker: "@you",
    bubble: "thought, then question, then burst",
    layer: "level_4",
    try: "~door",
    then: ["?door", "!door"],
    reads: "One mark in front of the word and the door is doing something. ~ keeps it as a maybe. ? asks about it. ! opens it.",
    notice: "The door never changed. Only how you stand toward it did. Write the mark after the word, door~, and today Spw reads two things: a door, then a thought with nothing to hold. Whether it should bind is an open question.",
    check: "operation_before_word",
    grow: "Mark a word by what it is doing, without rewriting the sentence around it.",
  },
  {
    id: "hold",
    scene: "(threshold)",
    speaker: "@door",
    bubble: "statement",
    layer: "level_4",
    try: "door[closed]{hinge, frame, key}",
    reads: "Brackets say how you are seeing it: closed. Braces hold what belongs to it, one comma at a time.",
    notice: "Write hinge.frame.key instead and it becomes one long name; the commas are what make three. Four ways to hold: < > what it is about, ( ) where it happens, [ ] how you see it, { } what belongs to it.",
    check: "frame_and_body",
    grow: "Group the parts of one thing so a tool reads them as one.",
  },
  {
    id: "name",
    scene: "(desk)",
    speaker: "@you",
    bubble: "name plate",
    layer: "level_2",
    try: "#>my_notes",
    then: ["noticed = `the same door`"],
    reads: "#> gives the page a name other pages can call. = keeps what you noticed under a word of its own.",
    notice: "A name is a handle: editors list it in the outline and find it from any other file.",
    check: "frame_address_and_binding",
    grow: "Each .spw file in a repository answers to one name; .spw/index.spw routes to them.",
  },
  {
    id: "point",
    scene: "(kitchen)",
    speaker: "@yesterday",
    bubble: "thought",
    layer: "level_4",
    try: "@yesterday: ~\"./yesterday.spw\"",
    reads: "@ says from where you are looking. ~ keeps yesterday's page within reach without opening it.",
    notice: "A citation is a path the tools can follow, and they tell you when it breaks.",
    check: "path_ref",
    grow: "Link your pages; spw resolve reports every citation as file, route, directory or external.",
  },
  {
    id: "ask",
    scene: "(kitchen)",
    speaker: "@you",
    bubble: "question, with a burst inside",
    layer: "level_4",
    try: "?[\"why the same door\"]{ !probe{ \"count the doors this week\" } }",
    reads: "? opens a question you can come back and close. Inside it, !probe names the small act that would answer it.",
    notice: "A question with a probe is an experiment, not a loose end.",
    check: "wonder_with_probe",
    grow: "Questions across a repository can be gathered and run; plans keep the answers.",
  },
  {
    id: "grow",
    scene: "(repository)",
    speaker: "@tools",
    bubble: "caption",
    layer: "level_4",
    try: "spw lint .spw && spw resolve --from .spw",
    reads: "In a repository with the workbench mounted, the same moves become files the tools can check.",
    notice: "Nothing here commits. Read the diff, then decide.",
    check: "commands_pass",
    grow: "Add one page, name it, cite it from .spw/index.spw, and ask one question in it.",
  },
].map((step) => Object.freeze({ ...step, ...(step.then ? { then: Object.freeze([...step.then]) } : {}) })));

/** How a host draws a panel, as the workbench words it. */
export const STORYBOARD = Object.freeze({
  scene: "a ( ) scene: where the panel happens",
  speaker: "an @ perspective: whose bubble it is",
  bubble: "the operator in front of the word picks the balloon: ~ thought, ? question, ! burst, . statement, #> name plate, no operator a caption",
  layer: "how far the line has become structure, from the ladder in apposition.spw: level_1 words, level_2 a named datum, level_3 a reading pinned beside something, level_4 structure",
});

/** Each check as the workbench words it: a shape over the spw-seed parse result. src/reader.js implements them. */
export const CHECKS = Object.freeze({
  parses: "success is true",
  operation_before_word: "an Operation node whose operator is one of ~ ? ! * . ^ # & = % $ applies to an Identifier (its operatorLabel); @ before a word parses as a Reference node, which also counts",
  frame_and_body: "an Expression carries a Frame (with a Parameter) and a Body whose Sequence holds at least two parts; tight dots (hinge.frame.key) lex as one identifier, so they are one part",
  frame_address_and_binding: "a #> Particle, and for the then line an Operation whose operator is =",
  path_ref: "a Binding whose key is a Reference (@name) and whose value holds a PathRef",
  wonder_with_probe: "an Operation on ? with a Frame and a Body, and inside the Body an Operation on ! named probe",
  commands_pass: "both commands exit 0; terminal and agent hosts only",
});
