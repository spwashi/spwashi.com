/**
 * Spw Brace Pivots
 *
 * Makes the objective (left) and subjective (right) brace walls interactive.
 * Clicking a wall cycles a dimension of experience:
 *
 *   Objective wall (left, { side) → cycles semantic density
 *     minimal → normal → rich → minimal
 *
 *   Subjective wall (right, } side) → cycles operator saturation
 *     muted → normal → vibrant → muted
 *
 * This turns the side walls — which already carry structural meaning
 * (objective = shared structure, subjective = situated meaning) — into
 * first-class customization affordances.
 *
 * Settings are persisted via the site settings bus so they survive navigation.
 *
 * Agent note (external):
 *   This file is standalone and imports only from spw-bus.js and site-settings.js.
 *   To add a new pivot dimension, add an entry to PIVOT_SEQUENCES and wire a wall
 *   element via data-spw-pivot="<key>".
 */

import { bus } from '/public/js/spw-bus.js';
import { getSettingValue, saveSiteSettings } from '/public/js/site-settings.js';

const PIVOT_SEQUENCES = {
    semanticDensity:    ['minimal', 'normal', 'rich'],
    operatorSaturation: ['muted', 'normal', 'vibrant'],
};

const PIVOT_LABELS = {
    semanticDensity: {
        minimal: '{ sparse',
        normal:  '{ balanced',
        rich:    '{ dense',
    },
    operatorSaturation: {
        muted:   'muted }',
        normal:  'vibrant }',
        vibrant: 'saturated }',
    },
};

function cycleValue(sequence, current) {
    const idx = sequence.indexOf(current);
    return sequence[(idx + 1) % sequence.length];
}

function getCurrentSetting(key) {
    return getSettingValue(key) ?? null;
}

function setSetting(key, value) {
    const saved = saveSiteSettings({ [key]: value });
    bus.emit('brace:pivoted', { key, value, settings: saved });
    return saved;
}

function installPivotAffordance(wall, settingKey, labelMap) {
    if (!wall) return;

    wall.setAttribute('role', 'button');
    wall.setAttribute('tabindex', '0');
    wall.setAttribute('aria-label', `Cycle ${settingKey}`);
    wall.style.cursor = 'pointer';

    const updateLabel = (value) => {
        const labelEl = wall.querySelector('.spw-pivot-label');
        if (labelEl) {
            labelEl.textContent = labelMap[value] ?? value;
        }
        wall.dataset.spwPivotValue = value;
    };

    // Inject a small label element
    const label = document.createElement('span');
    label.className = 'spw-pivot-label';
    label.setAttribute('aria-hidden', 'true');
    wall.appendChild(label);

    const current = getCurrentSetting(settingKey)
        ?? PIVOT_SEQUENCES[settingKey]?.[0]
        ?? 'normal';
    updateLabel(current);

    const activate = () => {
        const seq = PIVOT_SEQUENCES[settingKey];
        const cur = getCurrentSetting(settingKey) ?? seq[0];
        const next = cycleValue(seq, cur);
        setSetting(settingKey, next);
        updateLabel(next);

        // Visual feedback: briefly highlight the wall
        wall.dataset.spwPivotActive = 'true';
        setTimeout(() => delete wall.dataset.spwPivotActive, 320);
    };

    wall.addEventListener('click', activate);
    wall.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            activate();
        }
    });

    // Listen for external settings changes (e.g. from settings page)
    bus.on('settings:changed', ({ key, value }) => {
        if (key === settingKey) updateLabel(value);
    });
}

export function initBracePivots() {
    const objectiveWall  = document.querySelector('.spw-objective-wall, .spw-boon-wall');
    const subjectiveWall = document.querySelector('.spw-subjective-wall, .spw-bane-wall');

    installPivotAffordance(objectiveWall,  'semanticDensity',    PIVOT_LABELS.semanticDensity);
    installPivotAffordance(subjectiveWall, 'operatorSaturation', PIVOT_LABELS.operatorSaturation);
}
