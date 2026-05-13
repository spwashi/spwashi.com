/**
 * profile-builder.js
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

export const STATUS_OPTIONS = [
  { value: 'available',   label: 'available',         hint: 'Open to new work now.' },
  { value: 'consulting',  label: 'consulting',         hint: 'Taking project-based engagements.' },
  { value: 'open',        label: 'open to offers',     hint: 'Employed but listening.' },
  { value: 'building',    label: 'building',           hint: 'Heads-down on something.' },
  { value: 'looking',     label: 'actively looking',   hint: 'Recently laid off, seeking.' },
];

export const OPERATOR_OPTIONS = [
  { value: '^',  label: '^ object',   hint: 'I build stable, lasting systems.' },
  { value: '~',  label: '~ relay',    hint: 'I connect, translate, and transmit.' },
  { value: '@',  label: '@ event',    hint: 'I make things happen at the right moment.' },
  { value: '?[', label: '?[ probe',   hint: 'I investigate, question, and discover.' },
  { value: '>',  label: '> boon',     hint: 'I bring arrival — resources, possibility.' },
  { value: '!',  label: '! pragma',   hint: 'I enforce constraints and make things correct.' },
];

export const BADGE_CLUSTERS = [
  { value: 'stack',    label: 'stack',    hint: 'Languages, frameworks, and tools.' },
  { value: 'domain',   label: 'domain',   hint: 'Industry, problem space, or specialty.' },
  { value: 'approach', label: 'approach', hint: 'How you work — your method or stance.' },
  { value: 'context',  label: 'context',  hint: 'Where you have worked or what you have shipped.' },
  { value: 'role',     label: 'role',     hint: 'Formal or informal titles and functions.' },
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
    <a class="profile-footer-link operator-chip" href="${escHtml(l.href)}" target="_blank" rel="noopener">${escHtml(l.label)}</a>
  `).join('');

  container.innerHTML = `
    <div class="profile-card" data-spw-kind="island" data-spw-role="vessel" data-spw-form="brace">
      <header class="profile-card-header">
        <div class="profile-identity">
          <span class="profile-sigil" aria-hidden="true">${escHtml(header.sigil || '^')}"${escHtml(header.name || '...')}"</span>
          <div class="profile-name-role">
            ${header.name ? `<strong class="profile-name">${escHtml(header.name)}</strong>` : '<strong class="profile-name profile-name--empty">your name</strong>'}
            ${header.role ? `<span class="profile-role">${escHtml(header.role)}</span>` : ''}
          </div>
        </div>
        <span class="profile-status spec-pill" data-cluster="status" data-status="${escHtml(statusObj.value)}">${escHtml(statusObj.label)}</span>
      </header>

      ${header.tagline ? `<p class="profile-tagline">${escHtml(header.tagline)}</p>` : ''}

      ${badgeHTML}

      ${sectionHTML ? `<div class="profile-sections">${sectionHTML}</div>` : ''}

      ${footer.contact || linksHTML ? `
        <footer class="profile-card-footer">
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
