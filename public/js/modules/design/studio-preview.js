const cardRoot = document.querySelector('[data-design-studio="cards"]');

if (cardRoot) {
  const image = cardRoot.querySelector('[data-card-image]');
  const caption = cardRoot.querySelector('[data-card-caption-preview]');
  let localImageUrl;

  cardRoot.querySelector('[data-card-crop]').addEventListener('change', (event) => {
    cardRoot.dataset.crop = event.target.value;
  });
  cardRoot.querySelector('[data-card-frame]').addEventListener('change', (event) => {
    cardRoot.dataset.frame = event.target.value;
  });
  cardRoot.querySelector('[data-card-caption]').addEventListener('input', (event) => {
    caption.textContent = event.target.value || 'Untitled image';
  });
  cardRoot.querySelector('[data-card-file]').addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    if (localImageUrl) URL.revokeObjectURL(localImageUrl);
    localImageUrl = URL.createObjectURL(file);
    image.src = localImageUrl;
    image.alt = `Local preview: ${file.name}`;
  });
  window.addEventListener('pagehide', () => {
    if (localImageUrl) URL.revokeObjectURL(localImageUrl);
  }, { once: true });
}

const colorRoot = document.querySelector('[data-design-studio="colors"]');

if (colorRoot) {
  const roles = ['field', 'paper', 'ink', 'signal'];
  const controls = Object.fromEntries(roles.map((role) => [role, colorRoot.querySelector(`[data-color-role="${role}"]`)]));
  const preview = colorRoot.querySelector('.design-studio-color-preview');
  const presets = {
    current: { field: '#203b36', paper: '#f4e8c9', ink: '#203b36', signal: '#dba84f' },
    oxide: { field: '#4a332d', paper: '#f3e7d5', ink: '#3d2823', signal: '#c68b62' },
    electric: { field: '#142b49', paper: '#e7f1f3', ink: '#142b49', signal: '#f2bc5d' },
  };

  function luminance(hex) {
    const rgb = hex.match(/[0-9a-f]{2}/gi).map((part) => parseInt(part, 16) / 255);
    const linear = rgb.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  }

  function contrast(first, second) {
    const a = luminance(first);
    const b = luminance(second);
    return ((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2);
  }

  function update() {
    const colors = Object.fromEntries(roles.map((role) => [role, controls[role].value]));
    for (const role of roles) preview.style.setProperty(`--studio-${role}`, colors[role]);
    for (const [key, first, second] of [['ink-paper', 'ink', 'paper'], ['paper-field', 'paper', 'field'], ['field-signal', 'field', 'signal']]) {
      const ratio = contrast(colors[first], colors[second]);
      const reading = key === 'paper-field' ? '' : ratio >= 4.5 ? ' · passes' : ' · below 4.5:1';
      colorRoot.querySelector(`[data-contrast="${key}"]`).textContent = `${ratio}:1${reading}`;
    }
    colorRoot.querySelector('[data-color-values]').value = roles.map((role) => `--studio-${role}: ${colors[role]};`).join('\n');
  }

  for (const control of Object.values(controls)) control.addEventListener('input', update);
  for (const button of colorRoot.querySelectorAll('[data-color-preset]')) {
    button.addEventListener('click', () => {
      for (const role of roles) controls[role].value = presets[button.dataset.colorPreset][role];
      update();
    });
  }
  update();
}
