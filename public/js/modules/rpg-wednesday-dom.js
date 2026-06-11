import {
    createCardSigil,
    createFrameHeading,
    createFrameSigil
} from '/public/js/kernel/dom-contracts.js';
import { createElement, el } from '/public/js/kernel/dom-render.js';

export { createCardSigil, createFrameHeading, createFrameSigil, createElement, el };

export const createField = ({ id, label, value, rows = 2, placeholder }) => {
    const input = createElement('textarea', {
        id,
        className: 'rpg-gameplay-input',
        rows,
        placeholder,
        value
    });

    const field = createElement('label', { className: 'rpg-gameplay-field' }, [
        createElement('span', { text: label }),
        input
    ]);

    return { field, input };
};

export const createLineField = ({ id, label, value, placeholder, type = 'text' }) => {
    const input = createElement('input', {
        id,
        type,
        className: 'rpg-gameplay-line-input',
        value,
        placeholder
    });

    const field = createElement('label', { className: 'rpg-gameplay-field' }, [
        createElement('span', { text: label }),
        input
    ]);

    return { field, input };
};

export const createSelectField = ({ id, label, value, options }) => {
    const input = createElement('select', {
        id,
        className: 'rpg-gameplay-line-input'
    });

    options.forEach((option) => {
        input.appendChild(createElement('option', {
            value: option.value,
            text: option.label,
            selected: option.value === value
        }));
    });

    const field = createElement('label', { className: 'rpg-gameplay-field' }, [
        createElement('span', { text: label }),
        input
    ]);

    return { field, input };
};

export const createShortcutToken = ({ key, label }) => createElement('span', {
    className: 'rpg-shortcut-token'
}, [
    createElement('kbd', { text: key }),
    createElement('span', { text: label })
]);