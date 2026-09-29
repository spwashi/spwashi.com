/**
 * modules/rpg-wednesday/morale-closes.js
 *
 * Bonus morale at October's closes (13th, 26th, 31st). A reader marks a close
 * they reached; the morale lands on what it reaches, and the ornaments that
 * stand for that reach take it up through the existing collection field:
 *
 *   13 → cycle A (support) : days 1–13, the ~doodle_first chip
 *   26 → cycle B (build)   : days 14–26, the table shelf
 *   31 → cycle C (refer)   : days 27–31, the >lore.land chip
 *
 * Readers only ever see A, B, C; the intention words stay internal color keys.
 *
 * The reach vocabulary is data-spw-collection-intention; how much morale the
 * set holds is data-spw-collection-strength (0–1) with measure-kind
 * "subjective", so ornament.css renders it and the measure stays traceable.
 * With JavaScript off the closes read as plain milestones; the mark buttons
 * stay hidden until this script can honour them. Marks live in this reader's
 * browser only.
 */

export const STORAGE_KEY = 'spw.rpg-wednesday.inktober-2026.morale';

export const CLOSES = Object.freeze([
  { day: 13, from: 1, reach: 'support', touches: 'A' },
  { day: 26, from: 14, reach: 'build', touches: 'B' },
  { day: 31, from: 27, reach: 'refer', touches: 'C' },
]);

const ordinal = (day) => `${day}${day === 31 ? 'st' : 'th'}`;

const closeFor = (day) => CLOSES.find((close) => close.day === Number(day)) || null;

/** Sorted, de-duplicated close days from anything a store might hold. */
export function normalizeMarks(value) {
  const list = Array.isArray(value) ? value : [];
  return [...new Set(list.map(Number).filter((day) => closeFor(day)))].sort((a, b) => a - b);
}

export function toggleMark(marks, day) {
  const set = new Set(normalizeMarks(marks));
  if (set.has(Number(day))) set.delete(Number(day));
  else if (closeFor(day)) set.add(Number(day));
  return normalizeMarks([...set]);
}

/** Share of the month's morale the reader holds, as the collection strength. */
export const moraleStrength = (marks) => Number((normalizeMarks(marks).length / CLOSES.length).toFixed(2));

/** One plain sentence: what the reader's morale reaches so far. */
export function moraleReadout(marks) {
  const reached = normalizeMarks(marks).map((day) => closeFor(day).touches);
  if (!reached.length) return '';
  const list = reached.length === 1
    ? reached[0]
    : `${reached.slice(0, -1).join(', ')} and ${reached.at(-1)}`;
  const count = `${reached.length} of ${CLOSES.length} closes`;
  return `Morale, ${count}: cycle${reached.length > 1 ? 's' : ''} ${list}.`;
}

function readMarks() {
  try {
    return normalizeMarks(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return [];
  }
}

function writeMarks(marks) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(marks));
  } catch {
    /* Private windows and blocked storage still get the in-page response. */
  }
}

const setCollected = (element, reach, on, strength) => {
  if (!(element instanceof HTMLElement)) return;
  if (on) {
    element.dataset.spwCollected = 'true';
    element.dataset.spwCollectionIntention = reach;
    element.dataset.spwCollectionStrength = String(strength);
    element.dataset.spwMeasureKind = 'subjective';
  } else {
    delete element.dataset.spwCollected;
    delete element.dataset.spwCollectionIntention;
    delete element.dataset.spwCollectionStrength;
    delete element.dataset.spwMeasureKind;
  }
};

export function initMoraleCloses(root = document, { emit } = {}) {
  const field = root.querySelector('[data-rpg-morale-field]');
  if (!(field instanceof HTMLElement)) return null;
  const section = field.closest('section');
  const days = [...(section?.querySelector('[data-rpg-morale-days]')?.children || [])];
  const readout = section?.querySelector('[data-rpg-morale-readout]');
  const closes = [...field.querySelectorAll('[data-rpg-morale]')];
  const buttons = closes.map((close) => close.querySelector('[data-rpg-morale-claim]')).filter(Boolean);
  let marks = readMarks();

  const render = (justMarked = null) => {
    const strength = moraleStrength(marks);
    closes.forEach((close) => {
      const def = closeFor(close.dataset.rpgMorale);
      if (!def) return;
      const on = marks.includes(def.day);
      setCollected(close, def.reach, on, strength);
      close.querySelector('[data-rpg-morale-claim]')?.setAttribute('aria-pressed', String(on));
      days.slice(def.from - 1, def.day).forEach((pill) => setCollected(pill, def.reach, on, strength));
      section?.querySelectorAll(`[data-rpg-morale-touch="${def.reach}"]`)
        .forEach((target) => setCollected(target, def.reach, on, strength));
      close.toggleAttribute('data-rpg-morale-arrived', justMarked === def.day);
    });
    field.dataset.spwCollectionStrength = String(strength);
    field.dataset.spwMeasureKind = 'subjective';
    if (readout instanceof HTMLElement) {
      readout.textContent = moraleReadout(marks);
      readout.hidden = !marks.length;
    }
  };

  const onClick = (event) => {
    const button = event.target.closest('[data-rpg-morale-claim]');
    if (!(button instanceof HTMLElement)) return;
    const def = closeFor(button.closest('[data-rpg-morale]')?.dataset.rpgMorale);
    if (!def) return;
    const had = marks.includes(def.day);
    marks = toggleMark(marks, def.day);
    writeMarks(marks);
    render(had ? null : def.day);
    emit?.('*morale.close', had
      ? `released the ${ordinal(def.day)} close`
      : `made it to ${def.day}: cycle ${def.touches}`);
  };

  buttons.forEach((button) => { button.hidden = false; });
  field.addEventListener('click', onClick);
  render();

  return {
    destroy: () => {
      field.removeEventListener('click', onClick);
      buttons.forEach((button) => { button.hidden = true; });
    },
  };
}
