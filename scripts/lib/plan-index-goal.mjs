/**
 * Goal extraction for plan indexes.
 *
 * Concatenating a whole Goal section (lede + every bullet) is how
 * navigation-header-disclosure's index.spw grew an Owner-intent splice and
 * kept "Routes as primary" after the hamburger landed. First paragraph only.
 * PLAN_REFINEMENTS[slug].goal wins when the hand map names one.
 */

export function sectionText(markdown, heading) {
  const pattern = new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'im');
  const match = pattern.exec(markdown);
  if (!match) return '';
  const start = match.index + match[0].length;
  const rest = markdown.slice(start);
  const next = rest.search(/^##\s+/m);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

export function firstParagraph(markdown) {
  for (const line of String(markdown || '').split('\n')) {
    if (/^#/.test(line)) continue;
    if (!line.trim()) continue;
    return line.trim();
  }
  return '';
}

function firstBullet(text) {
  for (const line of String(text || '').split('\n')) {
    const trimmed = line.trim();
    if (!/^[-*]/.test(trimmed) && !/^\d+\./.test(trimmed)) continue;
    return trimmed
      .replace(/^[-*]\s+/, '')
      .replace(/^\d+\.\s+/, '')
      .replace(/\*\*/g, '')
      .trim();
  }
  return '';
}

function collapse(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().replace(/^[-*]\s+/, '');
}

export function extractPlanGoal(source, { kind = 'plan', override = '' } = {}) {
  if (override) return collapse(override);
  let goal = '';
  if (kind === 'fix') {
    const planned = sectionText(source, 'Planned Fix');
    const diagnosis = sectionText(source, 'Diagnosis');
    goal = firstBullet(planned)
      || firstParagraph(planned)
      || firstParagraph(diagnosis)
      || firstBullet(sectionText(source, 'Failures'))
      || firstParagraph(source);
  } else {
    const section = sectionText(source, 'Public Goal') || sectionText(source, 'Goal');
    goal = firstParagraph(section) || firstParagraph(source);
  }
  return collapse(goal);
}
