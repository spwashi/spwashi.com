/**
 * modules/profile/builder.js
 *
 * Data-driven professional profile card.
 * JSON in → rendered card + copyable outputs.
 *
 * Schema:
 * {
 *   header: { name, role, status, sigil, tagline },
 *   badges: [{ cluster, value }],
 *   sections: [{ heading, body, operator }],
 *   footer: { contact, links: [{ label, href }] }
 * }
 *
 * State contract: empty → draft → preview → exported
 */

import { getOperatorDefinition } from '/public/js/kernel/operator-detection.js';

export const STATUS_OPTIONS = [
  { value: 'available',   label: 'available',         hint: 'Open to new work now.' },
  { value: 'consulting',  label: 'consulting',         hint: 'Taking project-based engagements.' },
  { value: 'open',        label: 'open to offers',     hint: 'Employed but listening.' },
  { value: 'building',    label: 'building',           hint: 'Heads-down on something.' },
  { value: 'looking',     label: 'actively looking',   hint: 'Seeking the next collaboration or sprint.' },
];

// The sigil's name comes from the operator canon; the hint is how a profile says it.
const operatorOption = (value, hint) => ({ value, label: `${value} ${getOperatorDefinition(value).type}`, hint });

export const OPERATOR_OPTIONS = [
  operatorOption('~', 'I keep useful possibilities visible.'),
  operatorOption('#', 'I help ideas resonate and become recognizable.'),
  operatorOption('.', 'I stabilize work so people can stand on it.'),
  operatorOption('?', 'I investigate, question, and discover.'),
  operatorOption('!', 'I make consequential moves inspectable.'),
  operatorOption('*', 'I make the concrete value legible.'),
  operatorOption('&', 'I name the person, system, or relation at stake.'),
  operatorOption('@', 'I shift viewpoint and make context explicit.'),
  operatorOption('^', 'I combine parts into learnable systems.'),
];

export const BADGE_CLUSTERS = [
  { value: 'stack',    label: 'stack',    hint: 'Languages, frameworks, and tools.' },
  { value: 'domain',   label: 'domain',   hint: 'Industry, problem space, or specialty.' },
  { value: 'approach', label: 'approach', hint: 'How you work — your method or stance.' },
  { value: 'context',  label: 'context',  hint: 'Where you have worked or what you have shipped.' },
  { value: 'role',     label: 'role',     hint: 'Formal or informal titles and functions.' },
  { value: 'practice', label: 'practice', hint: 'Software, film, illustration, design, oration, organization.' },
];

/** Empty profile schema */
export function emptyProfile() {
  return {
    header: { name: '', role: '', status: 'available', sigil: '^', tagline: '' },
    badges: [],
    sections: [
      { heading: 'What I bring', body: '', operator: '^' },
      { heading: 'Context',      body: '', operator: '~' },
    ],
    footer: { contact: '', links: [] },
  };
}

/** Render the profile card into a container element */
export function renderProfileCard(profile, container) {
  const { header, badges, sections, footer } = profile;
  const statusObj = STATUS_OPTIONS.find(s => s.value === header.status) || STATUS_OPTIONS[0];

  const badgesByCluster = BADGE_CLUSTERS
    .map(c => ({ cluster: c, items: badges.filter(b => b.cluster === c.value) }))
    .filter(g => g.items.length > 0);

  const sectionHTML = sections
    .filter(s => s.heading || s.body)
    .map(s => `
      <div class="profile-section" data-operator="${s.operator || '^'}">
        ${s.heading ? `<h3 class="profile-section-heading">
          <span class="profile-section-op" aria-hidden="true">${s.operator || '^'}</span>
          ${escHtml(s.heading)}
        </h3>` : ''}
        ${s.body ? `<p class="profile-section-body">${escHtml(s.body)}</p>` : ''}
      </div>
    `).join('');

  const badgeHTML = badgesByCluster.length ? `
    <div class="profile-badges">
      ${badgesByCluster.map(g => `
        <div class="profile-badge-group">
          ${g.items.map(b => `
            <span class="spec-pill" data-cluster="${escHtml(b.cluster)}">${escHtml(b.value)}</span>
          `).join('')}
        </div>
      `).join('')}
    </div>
  ` : '';

  const linksHTML = footer.links.filter(l => l.label && l.href).map(l => `
    <a class="profile-footer-link spw-chip" href="${escHtml(l.href)}" target="_blank" rel="noopener">${escHtml(l.label)}</a>
  `).join('');

  container.innerHTML = `
    <div class="profile-card" data-spw-kind="island" data-spw-role="vessel" data-spw-form="brace">
      <header class="profile-card-header" data-spw-slot="header">
        <div class="profile-identity">
          <span class="profile-sigil" aria-hidden="true">${escHtml(header.sigil || '^')}"${escHtml(header.name || '...')}"</span>
          <div class="profile-name-role">
            ${header.name ? `<strong class="profile-name">${escHtml(header.name)}</strong>` : '<strong class="profile-name profile-name--empty">your name</strong>'}
            ${header.role ? `<span class="profile-role">${escHtml(header.role)}</span>` : ''}
          </div>
        </div>
        <span class="profile-status spec-pill" data-cluster="status" data-status="${escHtml(statusObj.value)}">${escHtml(statusObj.label)}</span>
      </header>

      ${header.tagline ? `<p class="profile-tagline" data-spw-slot="meta">${escHtml(header.tagline)}</p>` : ''}

      ${badgeHTML ? `<div data-spw-slot="meta">${badgeHTML}</div>` : ''}

      ${sectionHTML ? `<div class="profile-sections" data-spw-slot="body">${sectionHTML}</div>` : ''}

      ${footer.contact || linksHTML ? `
        <footer class="profile-card-footer" data-spw-slot="footer">
          ${footer.contact ? `<span class="profile-contact">${escHtml(footer.contact)}</span>` : ''}
          ${linksHTML ? `<nav class="profile-links" aria-label="profile links">${linksHTML}</nav>` : ''}
        </footer>
      ` : ''}
    </div>
  `;
}

/** Export profile as formatted JSON */
export function profileToJSON(profile) {
  return JSON.stringify(profile, null, 2);
}

/** Export profile as Spw seed block */
export function profileToSpw(profile) {
  const { header, badges, sections, footer } = profile;
  const badgeLines = badges.map(b => `    { cluster: "${b.cluster}", value: "${b.value}" }`).join('\n');
  const sectionLines = sections
    .filter(s => s.body)
    .map(s => `  ${s.operator || '^'}"${s.heading}"{ "${s.body}" }`)
    .join('\n');

  return `${header.sigil || '^'}"${header.name || 'profile'}"{\n` +
    `  role:    "${header.role}"\n` +
    `  status:  "${header.status}"\n` +
    `  tagline: "${header.tagline}"\n` +
    (badgeLines ? `  badges:  [\n${badgeLines}\n  ]\n` : '') +
    (sectionLines ? `${sectionLines}\n` : '') +
    (footer.contact ? `  contact: "${footer.contact}"\n` : '') +
    `}`;
}

/** Parse a comma-separated badge list into badge objects */
export function parseBadgeLine(text, cluster = 'stack') {
  return text.split(/[,\n]+/).map(s => s.trim()).filter(Boolean).map(value => ({ cluster, value }));
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
