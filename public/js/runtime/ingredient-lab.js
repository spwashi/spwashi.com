const LAB_SELECTOR = '[data-spw-ingredient-lab]';

const MODES = [
  ['cook', 'Cook lens'],
  ['shop', 'Provision lens'],
  ['scene', 'Story lens'],
];

function createButton(mode, label, current) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'operator-chip';
  button.dataset.spwIngredientModeSet = mode;
  button.setAttribute('aria-pressed', String(mode === current));
  button.textContent = label;
  return button;
}

function setMode(lab, mode) {
  lab.dataset.spwIngredientMode = mode;
  lab.querySelectorAll('[data-spw-ingredient-mode-set]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.spwIngredientModeSet === mode));
  });

  const status = lab.querySelector('[data-spw-ingredient-status]');
  if (status) {
    status.textContent = `Classic pivot lab showing ${mode} lens.`;
  }
}

function enhanceLab(lab) {
  if (!(lab instanceof HTMLElement) || lab.dataset.spwIngredientEnhanced === 'true') return null;
  lab.dataset.spwIngredientEnhanced = 'true';

  const initial = lab.dataset.spwIngredientMode || 'cook';
  const controls = document.createElement('div');
  controls.className = 'spw-ingredient-lenses';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Ingredient lab lenses');

  MODES.forEach(([mode, label]) => {
    controls.append(createButton(mode, label, initial));
  });

  const status = document.createElement('span');
  status.className = 'vibe-widget-status';
  status.dataset.spwIngredientStatus = '';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  const heading = lab.querySelector('.frame-heading, .frame-topline, h2, h3');
  if (heading?.parentNode) {
    heading.insertAdjacentElement('afterend', controls);
    controls.insertAdjacentElement('afterend', status);
  } else {
    lab.prepend(status);
    lab.prepend(controls);
  }

  const onClick = (event) => {
    const button = event.target.closest('[data-spw-ingredient-mode-set]');
    if (!button || !lab.contains(button)) return;
    setMode(lab, button.dataset.spwIngredientModeSet || 'cook');
  };

  lab.addEventListener('click', onClick);
  setMode(lab, initial);

  return () => {
    lab.removeEventListener('click', onClick);
    controls.remove();
    status.remove();
    delete lab.dataset.spwIngredientEnhanced;
  };
}

export function initIngredientLabs(root = document) {
  const labs = [...root.querySelectorAll(LAB_SELECTOR)];
  const cleanups = labs.map(enhanceLab).filter(Boolean);
  return () => cleanups.forEach((cleanup) => cleanup());
}
