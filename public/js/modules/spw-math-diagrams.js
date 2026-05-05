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

function formatNumber(value, digits = 2) {
  return Number(value).toFixed(digits).replace(/\.?0+$/, '');
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
        ? `Every mark moves, but nothing collapses: multiplication by ${multiplier} simply permutes the residues mod ${modulus}. Because ${modulus} is prime, the nonzero residues keep a clean inverse structure as well.`
        : `Every mark still moves to its own destination because gcd(${multiplier}, ${modulus}) = 1, but mod ${modulus} is composite overall. The picture stays orderly here without gaining the full field behavior that prime moduli support.`;
      return;
    }

    status.textContent = `Some marks now collapse into the same sectors because gcd(${multiplier}, ${modulus}) = ${divisor}. That overlap is divisibility made visible: the motion is still there, but shared factors keep different residues from staying distinct.`;
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
    upper: 'Follow the top path first: one local change feeds the next. Category theory remembers that this whole walk can be treated as a single composite move.',
    lower: 'Follow the side path first: the intermediate object changes, but the promised destination should still agree with the other route.',
    both: 'The real invariant is the end result. A commuting square is satisfying because two different journeys are identified as one dependable composite effect.',
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

function initTrigUnitCircle(root) {
  const angleInput = safeQuery('[data-control="angle"]', root);
  const angleDegreesOutput = safeQuery('[data-output="angleDegrees"]', root);
  const angleRadiansOutput = safeQuery('[data-output="angleRadians"]', root);
  const svg = safeQuery('svg', root);
  const status = safeQuery('[data-role="status"]', root);
  if (!angleInput || !svg || !status) return;

  const cx = 196;
  const cy = 190;
  const radius = 110;

  function quadrantName(angle) {
    if (angle === 0 || angle === 90 || angle === 180 || angle === 270) return 'axis';
    if (angle > 0 && angle < 90) return 'quadrant I';
    if (angle > 90 && angle < 180) return 'quadrant II';
    if (angle > 180 && angle < 270) return 'quadrant III';
    return 'quadrant IV';
  }

  function render() {
    const angleDegrees = ((Number.parseInt(angleInput.value, 10) || 0) % 360 + 360) % 360;
    const angleRadians = (angleDegrees * Math.PI) / 180;
    const x = Math.cos(angleRadians);
    const y = Math.sin(angleRadians);
    const px = cx + (x * radius);
    const py = cy - (y * radius);

    if (angleDegreesOutput) angleDegreesOutput.textContent = String(angleDegrees);
    if (angleRadiansOutput) angleRadiansOutput.textContent = formatNumber(angleRadians, 3);

    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 720 380');

    const background = createSvgNode('rect', {
      x: 14,
      y: 14,
      width: 692,
      height: 352,
      rx: 24,
      fill: 'rgba(255,255,255,0.88)',
      stroke: 'rgba(0,128,128,0.16)',
    });
    const xAxis = createSvgNode('line', {
      x1: 48,
      y1: cy,
      x2: 348,
      y2: cy,
      stroke: 'rgba(0,128,128,0.2)',
      'stroke-width': 2,
    });
    const yAxis = createSvgNode('line', {
      x1: cx,
      y1: 44,
      x2: cx,
      y2: 336,
      stroke: 'rgba(0,128,128,0.2)',
      'stroke-width': 2,
    });
    const circle = createSvgNode('circle', {
      cx,
      cy,
      r: radius,
      fill: 'rgba(255,255,255,0.9)',
      stroke: 'rgba(0,128,128,0.2)',
      'stroke-width': 2,
    });

    const triangle = createSvgNode('path', {
      d: `M ${cx} ${cy} L ${px} ${cy} L ${px} ${py} Z`,
      fill: 'rgba(23,130,130,0.12)',
      stroke: 'rgba(23,130,130,0.18)',
      'stroke-width': 1.2,
    });
    const radiusLine = createSvgNode('line', {
      x1: cx,
      y1: cy,
      x2: px,
      y2: py,
      stroke: 'var(--op-frame-color, #178282)',
      'stroke-width': 4,
      'stroke-linecap': 'round',
    });
    const cosineProjection = createSvgNode('line', {
      x1: cx,
      y1: cy,
      x2: px,
      y2: cy,
      stroke: 'var(--op-object-color, #c68a22)',
      'stroke-width': 4,
      'stroke-linecap': 'round',
    });
    const sineProjection = createSvgNode('line', {
      x1: px,
      y1: cy,
      x2: px,
      y2: py,
      stroke: 'var(--op-probe-color, #6a3fb8)',
      'stroke-width': 4,
      'stroke-linecap': 'round',
    });
    const point = createSvgNode('circle', {
      cx: px,
      cy: py,
      r: 6,
      fill: 'var(--op-topic-color, #2a8c76)',
      stroke: 'rgba(255,255,255,0.95)',
      'stroke-width': 2,
    });

    const labelLayer = createSvgNode('g', {
      'font-family': 'JetBrains Mono, monospace',
      'font-size': 14,
      fill: 'var(--ink-soft, rgba(0,0,0,0.72))',
    });

    const addText = (text, xPos, yPos, attrs = {}) => {
      const node = createSvgNode('text', { x: xPos, y: yPos, ...attrs });
      node.textContent = text;
      labelLayer.append(node);
    };

    addText('1', cx + radius + 12, cy + 5);
    addText('-1', cx - radius - 26, cy + 5);
    addText('1', cx - 8, cy - radius - 12);
    addText('-1', cx - 12, cy + radius + 24);
    addText(`cos θ = ${formatNumber(x)}`, cx + ((px - cx) / 2), cy + 28, { 'text-anchor': 'middle', fill: 'var(--op-object-color, #c68a22)' });
    addText(`sin θ = ${formatNumber(y)}`, px + 18, cy - ((cy - py) / 2), { fill: 'var(--op-probe-color, #6a3fb8)' });
    addText(`(${formatNumber(x)}, ${formatNumber(y)})`, px + (px >= cx ? 14 : -14), py - 10, { 'text-anchor': px >= cx ? 'start' : 'end', fill: 'var(--ink)' });

    const identityPanel = createSvgNode('g');
    identityPanel.append(createSvgNode('rect', {
      x: 404,
      y: 72,
      width: 248,
      height: 208,
      rx: 20,
      fill: 'rgba(255,255,255,0.92)',
      stroke: 'rgba(0,128,128,0.14)',
    }));
    const panelText = createSvgNode('g', {
      'font-family': 'JetBrains Mono, monospace',
      'font-size': 16,
      fill: 'var(--ink)',
    });
    const panelLines = [
      'unit circle',
      `θ = ${angleDegrees}°`,
      `${formatNumber(angleRadians, 3)} rad`,
      '',
      `sin²θ + cos²θ = ${formatNumber((x * x) + (y * y), 4)}`,
      `tan θ = ${Math.abs(x) < 0.0001 ? 'undefined' : formatNumber(y / x, 3)}`,
      '',
      'identities are reuse rules',
      'for the same rotation',
    ];
    panelLines.forEach((line, index) => {
      const textNode = createSvgNode('text', {
        x: 430,
        y: 104 + (index * 20),
      });
      textNode.textContent = line;
      panelText.append(textNode);
    });
    identityPanel.append(panelText);

    svg.append(
      background,
      xAxis,
      yAxis,
      circle,
      triangle,
      cosineProjection,
      sineProjection,
      radiusLine,
      point,
      labelLayer,
      identityPanel,
    );

    status.textContent = `${angleDegrees}° sits in ${quadrantName(angleDegrees)}. The radius stays length 1, while sine and cosine behave like reusable coordinate handles for the same rotation.`;
  }

  angleInput.addEventListener('input', render);
  render();
}

function initCalculusRelationships(root) {
  const xInput = safeQuery('[data-control="position"]', root);
  const xOutput = safeQuery('[data-output="position"]', root);
  const slopeOutput = safeQuery('[data-output="slope"]', root);
  const areaOutput = safeQuery('[data-output="area"]', root);
  const svg = safeQuery('svg', root);
  const status = safeQuery('[data-role="status"]', root);
  if (!xInput || !svg || !status) return;

  const svgWidth = 720;
  const svgHeight = 380;
  const plot = { left: 60, right: 660, top: 52, bottom: 320 };
  const domain = { min: -5, max: 5 };

  const sample = (x) => 2 + (0.22 * x * x) + (0.45 * x) + (0.7 * Math.sin(0.8 * x));
  const derivative = (x) => (0.44 * x) + 0.45 + (0.56 * Math.cos(0.8 * x));
  const integrate = (toX) => {
    const steps = 180;
    const start = domain.min;
    const dx = (toX - start) / steps;
    let total = 0;
    let current = start;
    for (let i = 0; i < steps; i += 1) {
      const next = current + dx;
      total += ((sample(current) + sample(next)) * 0.5 * dx);
      current = next;
    }
    return total;
  };

  const yRange = { min: -0.5, max: 9 };
  const toSvgX = (x) => plot.left + (((x - domain.min) / (domain.max - domain.min)) * (plot.right - plot.left));
  const toSvgY = (y) => plot.bottom - (((y - yRange.min) / (yRange.max - yRange.min)) * (plot.bottom - plot.top));

  function render() {
    const x = Number.parseFloat(xInput.value) || 0;
    const y = sample(x);
    const slope = derivative(x);
    const area = integrate(x);

    if (xOutput) xOutput.textContent = formatNumber(x, 2);
    if (slopeOutput) slopeOutput.textContent = formatNumber(slope, 2);
    if (areaOutput) areaOutput.textContent = formatNumber(area, 2);

    svg.innerHTML = '';
    svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

    const background = createSvgNode('rect', {
      x: 14,
      y: 14,
      width: 692,
      height: 352,
      rx: 24,
      fill: 'rgba(255,255,255,0.88)',
      stroke: 'rgba(0,128,128,0.16)',
    });
    const xAxis = createSvgNode('line', {
      x1: plot.left,
      y1: toSvgY(0),
      x2: plot.right,
      y2: toSvgY(0),
      stroke: 'rgba(0,128,128,0.18)',
      'stroke-width': 2,
    });
    const yAxis = createSvgNode('line', {
      x1: toSvgX(0),
      y1: plot.bottom,
      x2: toSvgX(0),
      y2: plot.top,
      stroke: 'rgba(0,128,128,0.18)',
      'stroke-width': 2,
    });

    const curvePoints = [];
    for (let i = 0; i <= 220; i += 1) {
      const px = domain.min + ((i / 220) * (domain.max - domain.min));
      curvePoints.push(`${toSvgX(px)},${toSvgY(sample(px))}`);
    }
    const curve = createSvgNode('polyline', {
      points: curvePoints.join(' '),
      fill: 'none',
      stroke: 'var(--op-frame-color, #178282)',
      'stroke-width': 4,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    });

    const areaPoints = [`${toSvgX(domain.min)},${toSvgY(0)}`];
    for (let i = 0; i <= 140; i += 1) {
      const px = domain.min + ((i / 140) * (x - domain.min));
      areaPoints.push(`${toSvgX(px)},${toSvgY(sample(px))}`);
    }
    areaPoints.push(`${toSvgX(x)},${toSvgY(0)}`);
    const areaShape = createSvgNode('polygon', {
      points: areaPoints.join(' '),
      fill: 'rgba(198,138,34,0.16)',
      stroke: 'rgba(198,138,34,0.22)',
      'stroke-width': 1.4,
    });

    const xSvg = toSvgX(x);
    const ySvg = toSvgY(y);
    const tangentSpan = 1.4;
    const tangentX1 = Math.max(domain.min, x - tangentSpan);
    const tangentX2 = Math.min(domain.max, x + tangentSpan);
    const tangentY1 = y + (slope * (tangentX1 - x));
    const tangentY2 = y + (slope * (tangentX2 - x));
    const tangent = createSvgNode('line', {
      x1: toSvgX(tangentX1),
      y1: toSvgY(tangentY1),
      x2: toSvgX(tangentX2),
      y2: toSvgY(tangentY2),
      stroke: 'var(--op-probe-color, #6a3fb8)',
      'stroke-width': 3.5,
      'stroke-linecap': 'round',
    });
    const guide = createSvgNode('line', {
      x1: xSvg,
      y1: toSvgY(0),
      x2: xSvg,
      y2: ySvg,
      stroke: 'rgba(0,128,128,0.2)',
      'stroke-width': 2,
      'stroke-dasharray': '6 6',
    });
    const point = createSvgNode('circle', {
      cx: xSvg,
      cy: ySvg,
      r: 6,
      fill: 'var(--op-topic-color, #2a8c76)',
      stroke: 'rgba(255,255,255,0.95)',
      'stroke-width': 2,
    });

    const labels = createSvgNode('g', {
      'font-family': 'JetBrains Mono, monospace',
      'font-size': 14,
      fill: 'var(--ink-soft, rgba(0,0,0,0.72))',
    });
    const addText = (text, xPos, yPos, attrs = {}) => {
      const node = createSvgNode('text', { x: xPos, y: yPos, ...attrs });
      node.textContent = text;
      labels.append(node);
    };
    addText('x', plot.right + 10, toSvgY(0) + 4);
    addText('f(x)', toSvgX(0) - 8, plot.top - 10);
    addText(`local slope = ${formatNumber(slope, 2)}`, xSvg + 12, ySvg - 16, { fill: 'var(--op-probe-color, #6a3fb8)' });
    addText(`area ≈ ${formatNumber(area, 2)}`, plot.left + 18, plot.top + 20, { fill: 'var(--op-object-color, #c68a22)' });

    const panel = createSvgNode('g');
    panel.append(createSvgNode('rect', {
      x: 458,
      y: 66,
      width: 198,
      height: 198,
      rx: 18,
      fill: 'rgba(255,255,255,0.92)',
      stroke: 'rgba(0,128,128,0.14)',
    }));
    const panelText = createSvgNode('g', {
      'font-family': 'JetBrains Mono, monospace',
      'font-size': 15,
      fill: 'var(--ink)',
    });
    [
      'derivative = local rate',
      'integral = accumulated area',
      '',
      `x = ${formatNumber(x, 2)}`,
      `f(x) = ${formatNumber(y, 2)}`,
      `f\'(x) = ${formatNumber(slope, 2)}`,
      `A(x) = ${formatNumber(area, 2)}`,
      '',
      'same curve, two questions',
    ].forEach((line, index) => {
      const node = createSvgNode('text', { x: 478, y: 96 + (index * 20) });
      node.textContent = line;
      panelText.append(node);
    });
    panel.append(panelText);

    svg.append(background, xAxis, yAxis, areaShape, curve, tangent, guide, point, labels, panel);

    status.textContent = `At x = ${formatNumber(x, 2)}, the derivative is the local slope ${formatNumber(slope, 2)} while the integral tracks accumulated area ${formatNumber(area, 2)} from the left boundary. Calculus becomes readable when rate and accumulation stay on the same picture.`;
  }

  xInput.addEventListener('input', render);
  render();
}

function initIntegrationByParts(root) {
  const upperInput = safeQuery('[data-control="upperBound"]', root);
  const upperOutput = safeQuery('[data-output="upperBound"]', root);
  const integralOutput = safeQuery('[data-output="triangleArea"]', root);
  const boundaryOutput = safeQuery('[data-output="boundaryTerm"]', root);
  const svg = safeQuery('svg', root);
  const status = safeQuery('[data-role="status"]', root);
  if (!upperInput || !svg || !status) return;

  function render() {
    const a = Number.parseFloat(upperInput.value) || 4;
    const baseX = 96;
    const baseY = 306;
    const scale = 34;
    const size = a * scale;
    const topY = baseY - size;
    const rightX = baseX + size;
    const triangleArea = 0.5 * a * a;
    const boundaryTerm = a * a;

    if (upperOutput) upperOutput.textContent = formatNumber(a, 2);
    if (integralOutput) integralOutput.textContent = formatNumber(triangleArea, 2);
    if (boundaryOutput) boundaryOutput.textContent = formatNumber(boundaryTerm, 2);

    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 720 380');

    const background = createSvgNode('rect', {
      x: 14,
      y: 14,
      width: 692,
      height: 352,
      rx: 24,
      fill: 'rgba(255,255,255,0.88)',
      stroke: 'rgba(0,128,128,0.16)',
    });
    const square = createSvgNode('rect', {
      x: baseX,
      y: topY,
      width: size,
      height: size,
      fill: 'rgba(255,255,255,0.92)',
      stroke: 'rgba(0,128,128,0.2)',
      'stroke-width': 2,
    });
    const lowerTriangle = createSvgNode('polygon', {
      points: `${baseX},${baseY} ${rightX},${baseY} ${rightX},${topY}`,
      fill: 'rgba(198,138,34,0.2)',
      stroke: 'rgba(198,138,34,0.3)',
      'stroke-width': 1.5,
    });
    const upperTriangle = createSvgNode('polygon', {
      points: `${baseX},${baseY} ${baseX},${topY} ${rightX},${topY}`,
      fill: 'rgba(23,130,130,0.12)',
      stroke: 'rgba(23,130,130,0.2)',
      'stroke-width': 1.5,
    });
    const diagonal = createSvgNode('line', {
      x1: baseX,
      y1: baseY,
      x2: rightX,
      y2: topY,
      stroke: 'var(--op-frame-color, #178282)',
      'stroke-width': 3.5,
      'stroke-linecap': 'round',
    });

    const labels = createSvgNode('g', {
      'font-family': 'JetBrains Mono, monospace',
      'font-size': 14,
      fill: 'var(--ink-soft, rgba(0,0,0,0.72))',
    });
    const addText = (text, xPos, yPos, attrs = {}) => {
      const node = createSvgNode('text', { x: xPos, y: yPos, ...attrs });
      node.textContent = text;
      labels.append(node);
    };

    addText('x', baseX - 18, topY + 10);
    addText('a', rightX - 4, baseY + 22, { 'text-anchor': 'middle' });
    addText('a', baseX - 18, topY + 4, { 'text-anchor': 'middle' });
    addText('area under y = x', baseX + 30, baseY - 20, { fill: 'var(--op-object-color, #c68a22)' });
    addText('matching triangle', baseX + 18, topY + 24, { fill: 'var(--op-frame-color, #178282)' });

    const panel = createSvgNode('g');
    panel.append(createSvgNode('rect', {
      x: 404,
      y: 56,
      width: 266,
      height: 248,
      rx: 20,
      fill: 'rgba(255,255,255,0.92)',
      stroke: 'rgba(0,128,128,0.14)',
    }));
    const panelText = createSvgNode('g', {
      'font-family': 'JetBrains Mono, monospace',
      'font-size': 15,
      fill: 'var(--ink)',
    });
    [
      `I(a) = ∫₀ᵃ x dx`,
      'choose u = x, dv = dx',
      'then du = dx, v = x',
      '',
      'I(a) = [uv]₀ᵃ - ∫₀ᵃ v du',
      `I(a) = ${formatNumber(boundaryTerm, 2)} - I(a)`,
      `2I(a) = ${formatNumber(boundaryTerm, 2)}`,
      `I(a) = ${formatNumber(triangleArea, 2)}`,
      '',
      'reverse product rule:',
      'rectangle = two equal triangles',
    ].forEach((line, index) => {
      const node = createSvgNode('text', { x: 426, y: 84 + (index * 20) });
      node.textContent = line;
      panelText.append(node);
    });
    panel.append(panelText);

    svg.append(background, square, upperTriangle, lowerTriangle, diagonal, labels, panel);

    status.textContent = `Integration by parts is the product rule run backward. Here the boundary term is the full square area ${formatNumber(boundaryTerm, 2)}, and the swapped integral is the matching triangle, so the original integral must be half the square: ${formatNumber(triangleArea, 2)}.`;
  }

  upperInput.addEventListener('input', render);
  render();
}

function initPartialDerivatives(root) {
  const xInput = safeQuery('[data-control="surfaceX"]', root);
  const yInput = safeQuery('[data-control="surfaceY"]', root);
  const xOutput = safeQuery('[data-output="surfaceX"]', root);
  const yOutput = safeQuery('[data-output="surfaceY"]', root);
  const zOutput = safeQuery('[data-output="surfaceHeight"]', root);
  const fxOutput = safeQuery('[data-output="partialX"]', root);
  const fyOutput = safeQuery('[data-output="partialY"]', root);
  const svg = safeQuery('svg', root);
  const status = safeQuery('[data-role="status"]', root);
  if (!xInput || !yInput || !svg || !status) return;

  const surface = (x, y) => (0.28 * x * x) - (0.22 * y * y) + (0.75 * Math.sin(x + (0.5 * y)));
  const partialX = (x, y) => (0.56 * x) + (0.75 * Math.cos(x + (0.5 * y)));
  const partialY = (x, y) => (-0.44 * y) + (0.375 * Math.cos(x + (0.5 * y)));
  const project = (x, y, z) => ({
    x: 254 + ((x - y) * 62),
    y: 260 + ((x + y) * 26) - (z * 56),
  });

  function makePolyline(points, attrs) {
    return createSvgNode('polyline', {
      points: points.map((point) => `${formatNumber(point.x, 2)},${formatNumber(point.y, 2)}`).join(' '),
      fill: 'none',
      ...attrs,
    });
  }

  function render() {
    const x = Number.parseFloat(xInput.value) || 0;
    const y = Number.parseFloat(yInput.value) || 0;
    const z = surface(x, y);
    const fx = partialX(x, y);
    const fy = partialY(x, y);

    if (xOutput) xOutput.textContent = formatNumber(x, 2);
    if (yOutput) yOutput.textContent = formatNumber(y, 2);
    if (zOutput) zOutput.textContent = formatNumber(z, 2);
    if (fxOutput) fxOutput.textContent = formatNumber(fx, 2);
    if (fyOutput) fyOutput.textContent = formatNumber(fy, 2);

    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 760 420');

    const background = createSvgNode('rect', {
      x: 14,
      y: 14,
      width: 732,
      height: 392,
      rx: 24,
      fill: 'rgba(255,255,255,0.88)',
      stroke: 'rgba(0,128,128,0.16)',
    });
    svg.append(background);

    const gridLayer = createSvgNode('g');
    for (let gx = -2.5; gx <= 2.5001; gx += 0.5) {
      const points = [];
      for (let gy = -2.5; gy <= 2.5001; gy += 0.2) {
        points.push(project(gx, gy, surface(gx, gy)));
      }
      gridLayer.append(makePolyline(points, {
        stroke: 'rgba(0,128,128,0.16)',
        'stroke-width': 1.4,
      }));
    }
    for (let gy = -2.5; gy <= 2.5001; gy += 0.5) {
      const points = [];
      for (let gx = -2.5; gx <= 2.5001; gx += 0.2) {
        points.push(project(gx, gy, surface(gx, gy)));
      }
      gridLayer.append(makePolyline(points, {
        stroke: 'rgba(29,87,163,0.12)',
        'stroke-width': 1.4,
      }));
    }
    svg.append(gridLayer);

    const xSlicePoints = [];
    for (let px = -2.5; px <= 2.5001; px += 0.12) {
      xSlicePoints.push(project(px, y, surface(px, y)));
    }
    const ySlicePoints = [];
    for (let py = -2.5; py <= 2.5001; py += 0.12) {
      ySlicePoints.push(project(x, py, surface(x, py)));
    }

    const xSlice = makePolyline(xSlicePoints, {
      stroke: 'var(--op-object-color, #c68a22)',
      'stroke-width': 3.5,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    });
    const ySlice = makePolyline(ySlicePoints, {
      stroke: 'var(--op-probe-color, #6a3fb8)',
      'stroke-width': 3.5,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    });

    const point = project(x, y, z);
    const tangentX1 = project(x - 0.65, y, z - (0.65 * fx));
    const tangentX2 = project(x + 0.65, y, z + (0.65 * fx));
    const tangentY1 = project(x, y - 0.65, z - (0.65 * fy));
    const tangentY2 = project(x, y + 0.65, z + (0.65 * fy));
    const tangentXLine = createSvgNode('line', {
      x1: tangentX1.x,
      y1: tangentX1.y,
      x2: tangentX2.x,
      y2: tangentX2.y,
      stroke: 'var(--op-object-color, #c68a22)',
      'stroke-width': 5,
      'stroke-linecap': 'round',
    });
    const tangentYLine = createSvgNode('line', {
      x1: tangentY1.x,
      y1: tangentY1.y,
      x2: tangentY2.x,
      y2: tangentY2.y,
      stroke: 'var(--op-probe-color, #6a3fb8)',
      'stroke-width': 5,
      'stroke-linecap': 'round',
    });
    const pointNode = createSvgNode('circle', {
      cx: point.x,
      cy: point.y,
      r: 6,
      fill: 'var(--op-topic-color, #2a8c76)',
      stroke: 'rgba(255,255,255,0.95)',
      'stroke-width': 2,
    });

    const labels = createSvgNode('g', {
      'font-family': 'JetBrains Mono, monospace',
      'font-size': 14,
      fill: 'var(--ink-soft, rgba(0,0,0,0.72))',
    });
    const addText = (text, xPos, yPos, attrs = {}) => {
      const node = createSvgNode('text', { x: xPos, y: yPos, ...attrs });
      node.textContent = text;
      labels.append(node);
    };
    addText('x-slice: hold y fixed', 54, 48, { fill: 'var(--op-object-color, #c68a22)' });
    addText('y-slice: hold x fixed', 54, 70, { fill: 'var(--op-probe-color, #6a3fb8)' });
    addText(`f(x, y) = ${formatNumber(z, 2)}`, point.x + 14, point.y - 14, { fill: 'var(--ink)' });

    const panel = createSvgNode('g');
    panel.append(createSvgNode('rect', {
      x: 500,
      y: 58,
      width: 212,
      height: 224,
      rx: 18,
      fill: 'rgba(255,255,255,0.92)',
      stroke: 'rgba(0,128,128,0.14)',
    }));
    const panelText = createSvgNode('g', {
      'font-family': 'JetBrains Mono, monospace',
      'font-size': 15,
      fill: 'var(--ink)',
    });
    [
      'partial derivatives',
      'hold one variable fixed',
      '',
      `x = ${formatNumber(x, 2)}`,
      `y = ${formatNumber(y, 2)}`,
      `f(x,y) = ${formatNumber(z, 2)}`,
      `∂f/∂x = ${formatNumber(fx, 2)}`,
      `∂f/∂y = ${formatNumber(fy, 2)}`,
      '',
      'gradient = local uphill map',
    ].forEach((line, index) => {
      const node = createSvgNode('text', { x: 522, y: 86 + (index * 20) });
      node.textContent = line;
      panelText.append(node);
    });
    panel.append(panelText);

    svg.append(xSlice, ySlice, tangentXLine, tangentYLine, pointNode, labels, panel);

    status.textContent = `At (${formatNumber(x, 2)}, ${formatNumber(y, 2)}), ∂f/∂x = ${formatNumber(fx, 2)} measures slope if y stays fixed, while ∂f/∂y = ${formatNumber(fy, 2)} measures slope if x stays fixed. Partial derivatives are slice-specific rates, not competing truths.`;
  }

  xInput.addEventListener('input', render);
  yInput.addEventListener('input', render);
  render();
}

function initDiffEqSlopeField(root) {
  const y0Input = safeQuery('[data-control="initialY"]', root);
  const y0Output = safeQuery('[data-output="initialY"]', root);
  const slopeOutput = safeQuery('[data-output="initialSlope"]', root);
  const svg = safeQuery('svg', root);
  const status = safeQuery('[data-role="status"]', root);
  if (!y0Input || !svg || !status) return;

  const domain = { xMin: -4, xMax: 4, yMin: -3, yMax: 3 };
  const plot = { left: 58, right: 670, top: 52, bottom: 330 };
  const slopeAt = (x, y) => x - y;
  const exact = (x, y0) => x - 1 + ((y0 + 1) * Math.exp(-x));
  const toSvgX = (x) => plot.left + (((x - domain.xMin) / (domain.xMax - domain.xMin)) * (plot.right - plot.left));
  const toSvgY = (y) => plot.bottom - (((y - domain.yMin) / (domain.yMax - domain.yMin)) * (plot.bottom - plot.top));

  function render() {
    const y0 = Number.parseFloat(y0Input.value) || 0;
    const slope0 = slopeAt(0, y0);
    if (y0Output) y0Output.textContent = formatNumber(y0, 2);
    if (slopeOutput) slopeOutput.textContent = formatNumber(slope0, 2);

    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 720 390');

    const background = createSvgNode('rect', {
      x: 14,
      y: 14,
      width: 692,
      height: 362,
      rx: 24,
      fill: 'rgba(255,255,255,0.88)',
      stroke: 'rgba(0,128,128,0.16)',
    });
    const xAxis = createSvgNode('line', {
      x1: plot.left,
      y1: toSvgY(0),
      x2: plot.right,
      y2: toSvgY(0),
      stroke: 'rgba(0,128,128,0.18)',
      'stroke-width': 2,
    });
    const yAxis = createSvgNode('line', {
      x1: toSvgX(0),
      y1: plot.bottom,
      x2: toSvgX(0),
      y2: plot.top,
      stroke: 'rgba(0,128,128,0.18)',
      'stroke-width': 2,
    });
    const field = createSvgNode('g');
    for (let gx = domain.xMin; gx <= domain.xMax + 0.001; gx += 0.5) {
      for (let gy = domain.yMin; gy <= domain.yMax + 0.001; gy += 0.5) {
        const slope = slopeAt(gx, gy);
        const rawDx = 0.18;
        const rawDy = slope * rawDx;
        const norm = Math.sqrt((rawDx * rawDx) + (rawDy * rawDy)) || 1;
        const dx = (rawDx / norm) * 0.18;
        const dy = (rawDy / norm) * 0.18;
        field.append(createSvgNode('line', {
          x1: toSvgX(gx - dx),
          y1: toSvgY(gy - dy),
          x2: toSvgX(gx + dx),
          y2: toSvgY(gy + dy),
          stroke: 'rgba(29,87,163,0.28)',
          'stroke-width': 1.8,
          'stroke-linecap': 'round',
        }));
      }
    }

    const exactPoints = [];
    for (let x = domain.xMin; x <= domain.xMax + 0.001; x += 0.06) {
      exactPoints.push(`${toSvgX(x)},${toSvgY(exact(x, y0))}`);
    }
    const exactCurve = createSvgNode('polyline', {
      points: exactPoints.join(' '),
      fill: 'none',
      stroke: 'var(--op-frame-color, #178282)',
      'stroke-width': 4,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    });

    const eulerPoints = [];
    let x = 0;
    let y = y0;
    eulerPoints.push([x, y]);
    for (let i = 0; i < 40; i += 1) {
      const step = 0.1;
      y += (step * slopeAt(x, y));
      x += step;
      eulerPoints.push([x, y]);
    }
    x = 0;
    y = y0;
    for (let i = 0; i < 40; i += 1) {
      const step = -0.1;
      y += (step * slopeAt(x, y));
      x += step;
      eulerPoints.unshift([x, y]);
    }
    const eulerCurve = createSvgNode('polyline', {
      points: eulerPoints.map(([px, py]) => `${toSvgX(px)},${toSvgY(py)}`).join(' '),
      fill: 'none',
      stroke: 'var(--op-object-color, #c68a22)',
      'stroke-width': 2.8,
      'stroke-dasharray': '7 6',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    });

    const anchor = createSvgNode('circle', {
      cx: toSvgX(0),
      cy: toSvgY(y0),
      r: 6,
      fill: 'var(--op-topic-color, #2a8c76)',
      stroke: 'rgba(255,255,255,0.95)',
      'stroke-width': 2,
    });

    const labels = createSvgNode('g', {
      'font-family': 'JetBrains Mono, monospace',
      'font-size': 14,
      fill: 'var(--ink-soft, rgba(0,0,0,0.72))',
    });
    const addText = (text, xPos, yPos, attrs = {}) => {
      const node = createSvgNode('text', { x: xPos, y: yPos, ...attrs });
      node.textContent = text;
      labels.append(node);
    };
    addText('exact family member', 70, 48, { fill: 'var(--op-frame-color, #178282)' });
    addText('Euler approximation', 70, 70, { fill: 'var(--op-object-color, #c68a22)' });
    addText(`y\' = x - y`, 540, 76, { fill: 'var(--ink)' });

    const panel = createSvgNode('g');
    panel.append(createSvgNode('rect', {
      x: 490,
      y: 94,
      width: 184,
      height: 176,
      rx: 18,
      fill: 'rgba(255,255,255,0.92)',
      stroke: 'rgba(0,128,128,0.14)',
    }));
    const panelText = createSvgNode('g', {
      'font-family': 'JetBrains Mono, monospace',
      'font-size': 15,
      fill: 'var(--ink)',
    });
    [
      'slope field',
      'tells how curves want to move',
      '',
      `y(0) = ${formatNumber(y0, 2)}`,
      `y\'(0) = ${formatNumber(slope0, 2)}`,
      '',
      'exact: x - 1 + Ce^-x',
      `C = ${formatNumber(y0 + 1, 2)}`,
    ].forEach((line, index) => {
      const node = createSvgNode('text', { x: 510, y: 122 + (index * 20) });
      node.textContent = line;
      panelText.append(node);
    });
    panel.append(panelText);

    svg.append(background, xAxis, yAxis, field, exactCurve, eulerCurve, anchor, labels, panel);

    status.textContent = `The slope field shows the local direction before you solve the equation. The initial condition y(0) = ${formatNumber(y0, 2)} selects one solution curve, and the starting slope is ${formatNumber(slope0, 2)}. Differential equations become friendlier when field, condition, and family stay visible at once.`;
  }

  y0Input.addEventListener('input', render);
  render();
}

function init() {
  safeQueryAll('[data-math-visual="mod-clock"]').forEach(initModClock);
  safeQueryAll('[data-math-visual="commuting-square"]').forEach(initCategorySquare);
  safeQueryAll('[data-math-visual="trig-unit-circle"]').forEach(initTrigUnitCircle);
  safeQueryAll('[data-math-visual="calculus-relationships"]').forEach(initCalculusRelationships);
  safeQueryAll('[data-math-visual="integration-by-parts"]').forEach(initIntegrationByParts);
  safeQueryAll('[data-math-visual="partial-derivatives"]').forEach(initPartialDerivatives);
  safeQueryAll('[data-math-visual="diff-eq-slope-field"]').forEach(initDiffEqSlopeField);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
