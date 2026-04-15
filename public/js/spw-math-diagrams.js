/**
 * spw-math-diagrams.js
 * --------------------------------------------------------------------------
 * Lightweight page-scoped interactivity for the math field-guide routes.
 * Keeps diagrams portable by updating inline SVG and nearby status text only.
 * --------------------------------------------------------------------------
 */

function safeQuery(selector, root = document) {
  try {
    return root.querySelector(selector);
  } catch {
    return null;
  }
}

function safeQueryAll(selector, root = document) {
  try {
    return [...root.querySelectorAll(selector)];
  } catch {
    return [];
  }
}

function createSvgNode(name, attrs = {}) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [key, value] of Object.entries(attrs)) {
    if (value != null) node.setAttribute(key, String(value));
  }
  return node;
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 1;
}

function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i += 1) {
    if (n % i === 0) return false;
  }
  return true;
}

function initModClock(root) {
  const modulusInput = safeQuery('[data-control="modulus"]', root);
  const multiplierInput = safeQuery('[data-control="multiplier"]', root);
  const modulusOutput = safeQuery('[data-output="modulus"]', root);
  const multiplierOutput = safeQuery('[data-output="multiplier"]', root);
  const svg = safeQuery('svg', root);
  const status = safeQuery('[data-role="status"]', root);

  if (!modulusInput || !multiplierInput || !svg || !status) return;

  const centerX = 310;
  const centerY = 190;
  const radius = 138;

  function render() {
    const modulus = Math.max(5, Number.parseInt(modulusInput.value, 10) || 12);
    modulusInput.value = String(modulus);

    multiplierInput.max = String(Math.max(2, modulus - 1));
    let multiplier = Number.parseInt(multiplierInput.value, 10) || 5;
    if (multiplier >= modulus) {
      multiplier = modulus - 1;
      multiplierInput.value = String(multiplier);
    }
    multiplier = Math.max(2, multiplier);

    if (modulusOutput) modulusOutput.textContent = String(modulus);
    if (multiplierOutput) multiplierOutput.textContent = String(multiplier);

    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 620 380');

    const background = createSvgNode('rect', {
      x: 14,
      y: 14,
      width: 592,
      height: 352,
      rx: 24,
      fill: 'rgba(255,255,255,0.88)',
      stroke: 'rgba(0,128,128,0.16)',
    });

    const circle = createSvgNode('circle', {
      cx: centerX,
      cy: centerY,
      r: radius,
      fill: 'rgba(255,255,255,0.9)',
      stroke: 'rgba(0,128,128,0.18)',
      'stroke-width': 2,
    });

    const chordLayer = createSvgNode('g', {
      fill: 'none',
      stroke: 'rgba(29,87,163,0.34)',
      'stroke-width': 2.5,
      'stroke-linecap': 'round',
    });

    const pointLayer = createSvgNode('g');
    const labelLayer = createSvgNode('g', {
      'font-size': 14,
      'font-family': 'JetBrains Mono, monospace',
      fill: 'var(--ink-soft, rgba(0,0,0,0.68))',
    });

    const points = [];
    for (let i = 0; i < modulus; i += 1) {
      const angle = (-Math.PI / 2) + ((2 * Math.PI * i) / modulus);
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        labelX: centerX + Math.cos(angle) * (radius + 24),
        labelY: centerY + Math.sin(angle) * (radius + 24),
      });
    }

    points.forEach((point, index) => {
      const target = points[(index * multiplier) % modulus];
      chordLayer.append(
        createSvgNode('line', {
          x1: point.x,
          y1: point.y,
          x2: target.x,
          y2: target.y,
        })
      );
    });

    points.forEach((point, index) => {
      pointLayer.append(
        createSvgNode('circle', {
          cx: point.x,
          cy: point.y,
          r: 4.8,
          fill: 'var(--op-object-color, #c68a22)',
          stroke: 'rgba(255,255,255,0.94)',
          'stroke-width': 1.5,
        })
      );

      const label = createSvgNode('text', {
        x: point.labelX,
        y: point.labelY,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
      });
      label.textContent = String(index);
      labelLayer.append(label);
    });

    const title = createSvgNode('text', {
      x: centerX,
      y: 46,
      'text-anchor': 'middle',
      'font-size': 18,
      fill: 'var(--ink)',
    });
    title.textContent = 'modular multiplication clock';

    const subtitle = createSvgNode('text', {
      x: centerX,
      y: 338,
      'text-anchor': 'middle',
      'font-size': 14,
      fill: 'var(--ink-soft, rgba(0,0,0,0.68))',
    });
    subtitle.textContent = `map each residue i to ${multiplier}×i (mod ${modulus})`;

    svg.append(background, circle, chordLayer, pointLayer, labelLayer, title, subtitle);

    const divisor = gcd(modulus, multiplier);
    if (divisor === 1) {
      status.textContent = isPrime(modulus)
        ? `Because gcd(${multiplier}, ${modulus}) = 1, the map permutes all residues. Since ${modulus} is prime, the nonzero residues also form a finite field under multiplication.`
        : `Because gcd(${multiplier}, ${modulus}) = 1, multiplication by ${multiplier} permutes the residues. Composite moduli still show orderly cycles, but they do not have the same field behavior as prime moduli.`;
      return;
    }

    status.textContent = `Because gcd(${multiplier}, ${modulus}) = ${divisor}, the chords collapse into repeated sectors. The overlap is a visual clue that divisibility is constraining the arithmetic.`;
  }

  modulusInput.addEventListener('input', render);
  multiplierInput.addEventListener('input', render);
  render();
}

function initCategorySquare(root) {
  const buttons = safeQueryAll('[data-category-path]', root);
  const status = safeQuery('[data-role="status"]', root);
  const segments = safeQueryAll('[data-segment]', root);
  if (!buttons.length || !status || !segments.length) return;

  const states = {
    upper: 'The upper path composes f and h. One local journey becomes a single composite arrow.',
    lower: 'The lower path composes g and k. Commutativity says this different route lands in the same place.',
    both: 'A commuting square is fun because two different journeys count as one result. Category theory keeps its attention on that sameness of composition.',
  };

  function setState(nextState) {
    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.categoryPath === nextState));
    });

    segments.forEach((segment) => {
      const kind = segment.dataset.segment;
      const isActive =
        nextState === 'both'
        || (nextState === 'upper' && kind === 'upper')
        || (nextState === 'lower' && kind === 'lower');
      segment.dataset.segmentState = isActive ? 'active' : 'muted';
    });

    status.textContent = states[nextState] || states.both;
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => setState(button.dataset.categoryPath || 'both'));
  });

  setState('both');
}

function init() {
  safeQueryAll('[data-math-visual="mod-clock"]').forEach(initModClock);
  safeQueryAll('[data-math-visual="commuting-square"]').forEach(initCategorySquare);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
