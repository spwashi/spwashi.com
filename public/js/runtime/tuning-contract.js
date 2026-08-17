/** Shared event vocabulary for tuning-surface producers and shell consumers. */

export const TUNING_SURFACES_EVENT = 'spw:tuning-surfaces-updated';

export const SPW_TUNING_CONTRACT = Object.freeze({
  surfacesUpdated: TUNING_SURFACES_EVENT,
  relation:
    'Tuning discovery owns surface annotation; shell disclosure only consumes its update signal.',
});
