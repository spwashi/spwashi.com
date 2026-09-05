/** D4 acts on positions; operator meanings and destinations remain authored HTML. */
export const SQUARE_IDENTITY = Object.freeze([0, 1, 2, 3]);
const MOVES = Object.freeze({
  rotate: Object.freeze([2, 0, 3, 1]),
  reflect: Object.freeze([1, 0, 3, 2]),
});

export function transformSquare(state, move) {
  const permutation = MOVES[move];
  if (!permutation) throw new RangeError(`Unknown square move: ${move}`);
  return permutation.map(index => state[index]);
}

export function mountOperatorSymmetry(root) {
  const board = root?.querySelector('.operator-symmetry__board');
  const controls = root?.querySelector('.operator-symmetry__controls');
  const output = root?.querySelector('output');
  if (!board || !controls || !output || board.children.length !== 4) return;
  const cards = [...board.children];
  const initialOutput = output.textContent;
  const abort = new AbortController();
  let state = [...SQUARE_IDENTITY];
  let moves = [];

  const render = () => {
    // Reorder the DOM as well as the image: visual and keyboard order agree.
    board.replaceChildren(...state.map(index => cards[index]));
    const identity = state.every((value, index) => value === index);
    const labels = state.map(index => cards[index].querySelector('strong')?.textContent || cards[index].textContent.trim());
    output.textContent = `${moves.length ? moves.slice(-8).join(' → ') : 'Start'}${moves.length > 8 ? ' (last eight moves)' : ''}. Reading order: ${labels.join(', ')}. ${identity ? 'Original arrangement.' : 'Positions changed; labels and links stay attached.'}`;
  };

  controls.hidden = false;
  controls.addEventListener('click', event => {
    const button = event.target.closest('button[name="square-move"]');
    if (!button || !controls.contains(button)) return;
    const move = button.value;
    if (move === 'reset' || move === 'rotate-reflect' || move === 'reflect-rotate') {
      state = [...SQUARE_IDENTITY];
      moves = [];
    }
    for (const step of move === 'reset' ? [] : move.split('-')) {
      state = transformSquare(state, step);
      moves.push(step === 'rotate' ? 'R' : 'M');
    }
    render();
  }, { signal: abort.signal });

  return () => {
    abort.abort();
    board.replaceChildren(...cards);
    output.textContent = initialOutput;
    controls.hidden = true;
  };
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'operator-symmetry',
  mount: (_ctx, root) => mountOperatorSymmetry(root),
  describes: 'operator[square]{rotate.reflect.compare} invariant[labels|links]',
  timingArc: 'visible-feature',
  effectScope: 'local-dom listeners',
});
