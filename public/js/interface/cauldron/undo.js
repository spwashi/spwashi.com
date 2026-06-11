const MAX_UNDO = 8;
const undoStack = [];

export function pushUndoSnapshot(ingredients = []) {
  if (!Array.isArray(ingredients)) return;
  undoStack.push(JSON.parse(JSON.stringify(ingredients)));
  if (undoStack.length > MAX_UNDO) undoStack.shift();
}

export function popUndoSnapshot() {
  return undoStack.pop() || null;
}

export function canUndo() {
  return undoStack.length > 0;
}

export function clearUndoStack() {
  undoStack.length = 0;
}