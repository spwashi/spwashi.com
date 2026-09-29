/**
 * modules/rpg-wednesday/name-cadence.js
 *
 * A stranger at the table: one fictional name with a fixed cadence —
 * a one-beat given name, then a three-beat surname that leans on its
 * first syllable (DUM · DUM-da-da) — and the job they keep in town.
 *
 * The card ships one sample name in HTML, so it reads with JavaScript off.
 * The reroll chip stays hidden until this script can honour it.
 */
import { emitSpwAction } from '/public/js/kernel/shared.js';

/* One beat each. Short, plain, and easy to say across a table. */
export const GIVEN = Object.freeze([
  'Bram', 'Wren', 'Tam', 'Hal', 'Nell', 'Rook', 'Jem', 'Pell', 'Cass', 'Fen',
  'Lark', 'Moss', 'Tove', 'Quill', 'Rue', 'Sol', 'Tess', 'Kit', 'Dell', 'Bea',
]);

/* Three beats, stress first: places and trades a town would keep. */
export const SURNAMES = Object.freeze([
  'Aldercott', 'Hollowell', 'Marrowfield', 'Emberly', 'Candlewick', 'Bramblecote',
  'Hazelden', 'Ashenford', 'Willowby', 'Thistlewood', 'Barrowby', 'Lanternfield',
  'Saddlerow', 'Whittaker', 'Pepperell', 'Tinderly', 'Copperlane', 'Juniper',
  'Rivermoor', 'Kettleby',
]);

/* What they do in town, in the page's own rooms: sale clock, library, ferment, garden. */
export const CALLINGS = Object.freeze([
  'keeps the sale clock honest',
  'reads soil for the Town Library garden',
  'salts the winter ferment',
  'carves stamps for library cards',
  'trades turnips for stories',
  'mends lanterns before the market',
  'copies recipes into the party ledger',
  'counts bees at the orchard gate',
  'sweeps the stage after a read-aloud',
  'keeps a folio of other people’s doodles',
]);

const pick = (list, random) => list[Math.floor(random() * list.length) % list.length];

/** Pure: pass a random source for tests, Math.random otherwise. */
export function cadenceName(random = Math.random) {
  return {
    given: pick(GIVEN, random),
    surname: pick(SURNAMES, random),
    calling: pick(CALLINGS, random),
  };
}

export const formatStranger = ({ given, surname, calling }) => `${given} ${surname}, who ${calling}`;

export function initNameCadence(root = document) {
  const host = root.querySelector('[data-rpg-name-cadence]');
  if (!(host instanceof HTMLElement)) return null;
  const output = host.querySelector('output');
  const roll = host.querySelector('[data-rpg-name-roll]');
  if (!output || !(roll instanceof HTMLElement)) return null;

  let last = output.textContent.trim();
  const reroll = () => {
    let next = formatStranger(cadenceName());
    for (let tries = 0; next === last && tries < 4; tries += 1) next = formatStranger(cadenceName());
    last = next;
    output.textContent = next;
    emitSpwAction('?stranger.name', next);
  };

  roll.hidden = false;
  roll.addEventListener('click', reroll);
  return {
    destroy: () => {
      roll.removeEventListener('click', reroll);
      roll.hidden = true;
    },
  };
}
