/**
 * A handle for a feeling.
 *
 * Four choices fill the four slots of one Spw expression, and the same
 * choices precipitate into two other forms a person can use the same day:
 *
 *   subject     the state, in the smallest honest word
 *   [mode]      the practice: notice, name, hold, share, practice, rest
 *   {direction} where it is heading, when there is a word for that
 *   <projection> who it is for
 *
 *   ?overloaded[notice]{steady}<myself>          the handle
 *   "Note to self: I am noticing that I feel…"   a line to say
 *   steady-one-walk                               a name to type
 *
 * The prefix is the practice, in the operator canon: ? opens curiosity,
 * = pins a name, ~ holds a possibility open, @ situates a viewpoint,
 * ! commits a visible move, . settles to ground.
 *
 * The name is the third form because a person types the names they choose
 * for years: a branch, a folder, a package. A name can be an affirmation.
 *
 * Nothing is stored and nothing leaves the page. The form is readable with
 * scripts off; this module only keeps the three outputs in step with it.
 */

export const CARE_PRACTICES = Object.freeze({
  notice: { prefix: '?', operator: 'wonder', say: (state) => `I am noticing that I feel ${state}.` },
  name: { prefix: '=', operator: 'binding', say: (state) => `The closest word I have is ${state}.` },
  hold: { prefix: '~', operator: 'potential', say: (state) => `I feel ${state}, and I am not fixing it yet.` },
  share: { prefix: '@', operator: 'perspective', say: (state) => `I feel ${state}. I would like you to hear it before we solve anything.` },
  practice: { prefix: '!', operator: 'action', say: (state, step) => `I feel ${state}. One small thing I will try: ${step || 'one small step'}.` },
  rest: { prefix: '.', operator: 'ground', say: (state) => `I feel ${state}. I am stopping here for now.` },
});

export const CARE_WITNESSES = Object.freeze({
  myself: 'Note to self:',
  friend: 'Can I tell you something?',
  group: 'Checking in:',
  professional: 'Something to bring to our next session:',
});

const clean = (value = '', max = 48) => String(value).replace(/\s+/g, ' ').trim().slice(0, max);

/** A word as an expression part: lower case, joined by underscores. */
export function handlePart(value = '') {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/** A word as a name to type: lower case, joined by hyphens. */
export function namePart(value = '') {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * @param {{ state?: string, practice?: string, toward?: string, witness?: string, step?: string }} choice
 */
export function composeCareHandle(choice = {}) {
  const practiceId = CARE_PRACTICES[choice.practice] ? choice.practice : 'notice';
  const practice = CARE_PRACTICES[practiceId];
  const witnessId = CARE_WITNESSES[choice.witness] ? choice.witness : 'myself';
  const state = clean(choice.state) || 'not sure yet';
  const toward = clean(choice.toward);
  const step = clean(choice.step, 80).replace(/[.!?]+$/, '');

  const subject = handlePart(state) || 'not_sure_yet';
  const direction = handlePart(toward);
  const expression = `${practice.prefix}${subject}[${practiceId}]${direction ? `{${direction}}` : ''}<${witnessId}>`;

  const sentence = [
    CARE_WITNESSES[witnessId],
    practice.say(state, step),
    toward ? `I am heading toward ${toward}.` : '',
  ].filter(Boolean).join(' ');

  const name = [namePart(toward || state), namePart(step) || practiceId].filter(Boolean).join('-').slice(0, 48).replace(/-+$/, '');

  return { prefix: practice.prefix, operator: practice.operator, practice: practiceId, witness: witnessId, expression, sentence, name };
}

function readChoice(form) {
  const data = new FormData(form);
  const pick = (group) => clean(data.get(`${group}-own`)) || clean(data.get(group));
  return {
    state: pick('care-state'),
    toward: pick('care-toward'),
    practice: clean(data.get('care-practice')),
    witness: clean(data.get('care-witness')),
    step: clean(data.get('care-step'), 80),
  };
}

async function copyText(text, button) {
  const label = button.dataset.label || button.textContent;
  button.dataset.label = label;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = 'copied';
  } catch {
    button.textContent = 'select the text to copy';
  }
  globalThis.setTimeout(() => { button.textContent = label; }, 1600);
}

export function initCareHandle(ctx = {}) {
  const root = ctx.root?.querySelector ? ctx.root : document;
  const host = root.matches?.('[data-care-handle]') ? root : root.querySelector('[data-care-handle]');
  const form = host?.querySelector('form');
  if (!host || !form) return () => {};

  const out = {
    prefix: host.querySelector('[data-care-handle-prefix]'),
    body: host.querySelector('[data-care-handle-body]'),
    sentence: host.querySelector('[data-care-handle-sentence]'),
    name: host.querySelector('[data-care-handle-name]'),
  };
  let current = composeCareHandle(readChoice(form));

  const render = () => {
    current = composeCareHandle(readChoice(form));
    if (out.prefix) {
      out.prefix.textContent = current.prefix;
      out.prefix.dataset.spwOperator = current.operator;
    }
    if (out.body) out.body.textContent = current.expression.slice(current.prefix.length);
    if (out.sentence) out.sentence.textContent = current.sentence;
    if (out.name) out.name.textContent = current.name;
    host.dataset.spwSemanticExpression = current.expression;
    host.dataset.careHandleState = 'live';
  };

  const abort = new AbortController();
  const { signal } = abort;
  form.addEventListener('input', render, { signal });
  form.addEventListener('change', render, { signal });
  form.addEventListener('submit', (event) => event.preventDefault(), { signal });
  form.addEventListener('reset', () => globalThis.setTimeout(render, 0), { signal });
  host.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-care-handle-copy]');
    if (!button) return;
    const which = button.dataset.careHandleCopy;
    const text = which === 'all'
      ? `${current.expression}\n${current.sentence}\n${current.name}`
      : current[which] || '';
    if (text) copyText(text, button);
  }, { signal });

  render();
  return () => abort.abort();
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'care-handle',
  mount: (ctx, root) => initCareHandle({ root: root instanceof Element ? root : ctx?.root }),
  describes: 'care[handle]{state.practice.toward.witness}<form> four choices fill one Spw expression and precipitate a line to say and a name to type; nothing is stored',
  timingArc: 'visible-feature',
  effectScope: ['local-dom', 'element-state', 'listeners'],
});
