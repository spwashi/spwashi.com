// One specimen's reading, made when carry-specimens.mjs carries it, so the
// worker paints and compares without parsing on each request. The paint is the
// file reader's; the slots come from the site's one slot reader,
// public/js/semantic/expression-query.js, and a line it takes only part of
// says so (whole = false) instead of being guessed at.
import { readCompoundJoin, readExpressionSlots, shapeFromExpression } from "../../../public/js/semantic/expression-query.js";
import { paintFile, readFile } from "./file-reader.js";

/** How many lines of a file a card shows before it folds. */
export const FILE_LINES = 8;

const flat = (value) => String(value || "").replace(/\s+/g, "");
const dropEmpty = (object) => Object.fromEntries(Object.entries(object).filter(([, value]) => (Array.isArray(value) ? value.length : value)));

/** Whether the slots read back into the line: if not, the reader took only part of it. */
function readsWhole(text, raw) {
  const line = (leading) => `${raw.charge.join(".")}${leading ? `(${raw.scope})` : ""}${raw.subject}`
    + `${raw.mode ? `[${raw.mode}]` : ""}${raw.body ? `{${raw.body}}` : ""}${!leading && raw.scope ? `(${raw.scope})` : ""}${raw.projection ? `<${raw.projection}>` : ""}`;
  return [false, Boolean(raw.scope)].some((leading) => flat(line(leading)) === flat(text));
}

/** What a search reads: the slots of one side, as shapeFromExpression gives them. */
const searchShape = (shape) => dropEmpty({
  subject: shape.subject, mode: shape.mode, parts: shape.parts, projection: shape.projection, scope: shape.scope, charge: shape.charge,
});

export function readSpecimen(line) {
  const text = String(line || "").trim();
  if (text.includes("\n")) {
    const lines = text.split("\n");
    const shown = lines.length > FILE_LINES ? `${lines.slice(0, FILE_LINES).join("\n")}\n…` : text;
    return { file: true, paint: paintFile(readFile(shown)) };
  }
  const compound = readCompoundJoin(text);
  const left = compound ? compound.left : text;
  const raw = readExpressionSlots(left);
  const slots = { subject: raw.subject, mode: raw.mode, body: raw.body, projection: raw.projection, scope: raw.scope, charge: raw.charge.join(".") };
  let whole = readsWhole(left, raw);
  if (compound) {
    slots.join = `${compound.operator} ${compound.bond}`;
    slots.with = compound.right;
    whole = whole && readsWhole(compound.right, readExpressionSlots(compound.right));
  }
  const shape = shapeFromExpression(text);
  return {
    paint: paintFile(readFile(text)),
    slots: dropEmpty(slots),
    ...(whole ? {} : { part: true }),
    shape: searchShape(shape),
    ...(shape.compound ? { right: searchShape(shape.compound.right) } : {}),
  };
}
