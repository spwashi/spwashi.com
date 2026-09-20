/**
 * modules/services/care-intake.js
 *
 * A reflective check-in for continuing conversations.
 * Not a diagnostic tool — a thinking aid and care-profile generator.
 *
 * State: localStorage under key 'spw:care-intake'
 * Output: a screenshottable care profile card
 *
 * Design intent: hold onto something to revisit in a continuing conversation.
 */

import { escapeHtml } from '/public/js/kernel/dom-render.js';
import { createIntake } from '/public/js/interface/intake.js';
import { bindSeedExits } from '/public/js/interface/seed-exits.js';

const STORAGE_KEY = 'spw:care-intake';
const CHARGE_FIELDS = ['situation', 'support', 'format', 'medium', 'readiness'];

// Maps selections → therapy approaches (each approach scores a point per match)
const APPROACH_MATRIX = {
  CBT:                  { situation: ['anxiety', 'low-mood'], support: ['tools', 'patterns'] },
  ACT:                  { situation: ['anxiety', 'burnout', 'transition'], support: ['tools', 'present'] },
  IFS:                  { situation: ['self', 'relationships', 'past'], support: ['patterns', 'past', 'relationships'] },
  EMDR:                 { situation: ['past'], support: ['past'] },
  'somatic therapy':    { situation: ['past', 'burnout', 'grief'], support: ['past', 'present'] },
  'psychodynamic':      { situation: ['self', 'low-mood', 'relationships'], support: ['patterns', 'past'] },
  EFT:                  { situation: ['relationships'], support: ['relationships'] },
  DBT:                  { situation: ['anxiety', 'burnout'], support: ['tools'] },
  'narrative therapy':  { situation: ['self', 'transition', 'grief'], support: ['patterns', 'past', 'listen'] },
  'person-centered':    { situation: ['uncertain', 'self'], support: ['listen'] },
  'grief therapy':      { situation: ['grief', 'transition'], support: ['listen', 'past'] },
  'mindfulness-based':  { situation: ['anxiety', 'burnout'], support: ['present'] },
};

const APPROACH_DESCRIPTIONS = {
  CBT:                 'examining how thoughts, feelings, and behaviors connect',
  ACT:                 'building flexibility and values-based action',
  IFS:                 'understanding the different "parts" of your inner world',
  EMDR:                'processing difficult memories through structured attention',
  'somatic therapy':   'working with what the body holds alongside the mind',
  'psychodynamic':     'exploring roots, patterns, and deeper emotional history',
  EFT:                 'attachment and emotional bonds in close relationships',
  DBT:                 'emotional regulation and distress tolerance skills',
  'narrative therapy': 'reauthoring your story on your own terms',
  'person-centered':   'unconditional positive regard; your direction, your pace',
  'grief therapy':     'making space for loss without rushing through it',
  'mindfulness-based': 'present-moment awareness as a foundation',
};

const APPROACH_QUESTIONS = {
  CBT:                'Do you use Cognitive Behavioral Therapy? What does that look like in your practice?',
  ACT:                'Are you familiar with Acceptance and Commitment Therapy?',
  IFS:                'Do you work with Internal Family Systems or parts work?',
  EMDR:               'Do you practice EMDR or other trauma-focused approaches?',
  'somatic therapy':  'Do you incorporate body-based or somatic work?',
  'psychodynamic':    'Would you describe your approach as psychodynamic or depth-oriented?',
  EFT:                'Do you practice Emotionally Focused Therapy?',
  DBT:                'Do you use DBT skills or distress tolerance frameworks?',
  'narrative therapy':'Do you use any narrative therapy approaches?',
};

const SITUATION_LABELS = {
  anxiety:      'anxiety or worry',
  'low-mood':   'low mood',
  relationships:'relationship difficulty',
  transition:   'a big life change',
  grief:        'grief or loss',
  burnout:      'burnout or exhaustion',
  past:         'something from the past',
  self:         'understanding myself',
  uncertain:    'not sure yet',
};

const SUPPORT_LABELS = {
  listen:        'someone to listen',
  tools:         'practical tools',
  patterns:      'understanding patterns',
  past:          'working with the past',
  present:       'staying present-focused',
  relationships: 'relationship help',
};

const READINESS_LABELS = {
  ready:      'ready to start',
  thinking:   'still thinking it through',
  skeptical:  'skeptical but curious',
  suggested:  'someone suggested it',
};

// ─── Scoring ─────────────────────────────────────────────────────────────────

function suggestApproaches(state) {
  const scores = {};
  const situation = state.situation || [];
  const support = state.support || [];

  for (const [approach, matrix] of Object.entries(APPROACH_MATRIX)) {
    let score = 0;
    for (const s of situation) if (matrix.situation?.includes(s)) score += 2;
    for (const s of support) if (matrix.support?.includes(s)) score += 1;
    if (score > 0) scores[approach] = score;
  }

  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([approach]) => approach);
}

// ─── Profile card HTML ────────────────────────────────────────────────────────

function buildProfileCard(state) {
  const approaches = suggestApproaches(state);
  const questions = approaches.filter(a => APPROACH_QUESTIONS[a]).slice(0, 3);

  const situations = (state.situation || []).map(s => escapeHtml(SITUATION_LABELS[s] || s));
  const supports   = (state.support || []).map(s => escapeHtml(SUPPORT_LABELS[s] || s));
  const readiness  = state.readiness ? escapeHtml(READINESS_LABELS[state.readiness] || state.readiness) : null;
  const format     = state.format ? escapeHtml(state.format) : null;
  const medium     = state.medium ? escapeHtml(state.medium) : null;
  const note       = escapeHtml((state.note || '').trim());

  const row = (key, val) => val
    ? `<div class="care-profile-row"><span class="care-profile-key">${key}</span><span class="care-profile-val">${val}</span></div>`
    : '';

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
<div class="care-profile-card" data-care-profile data-spw-metamaterial="paper">
  <header class="care-profile-header">
    <span class="care-profile-sigil">~care</span>
    <span class="care-profile-title">care profile</span>
    <span class="care-profile-date">${today}</span>
  </header>

  <div class="care-profile-body">
    ${row('what\'s going on', situations.join(' · '))}
    ${row('looking for', supports.join(' · '))}
    ${row('setting', [format, medium].filter(Boolean).join(', '))}
    ${row('where I am', readiness)}
    ${note ? `<div class="care-profile-note-row">
      <span class="care-profile-key">one thing</span>
      <blockquote class="care-profile-quote">${note}</blockquote>
    </div>` : ''}

    ${approaches.length ? `
    <div class="care-profile-section">
      <span class="care-profile-section-label">approaches that might resonate</span>
      <ul class="care-approaches-list">
        ${approaches.map(a => `<li class="care-approach-item">
          <strong class="care-approach-name">${a}</strong>
          ${APPROACH_DESCRIPTIONS[a] ? ` — <span class="care-approach-desc">${APPROACH_DESCRIPTIONS[a]}</span>` : ''}
        </li>`).join('')}
      </ul>
    </div>` : ''}

    ${questions.length ? `
    <div class="care-profile-section">
      <span class="care-profile-section-label">questions to revisit together</span>
      <ol class="care-questions-list">
        ${questions.map(a => `<li>${APPROACH_QUESTIONS[a]}</li>`).join('')}
      </ol>
    </div>` : ''}
  </div>

  <footer class="care-profile-footer">
    <div class="care-profile-ai-note">
      <span class="care-profile-key">a note on AI</span>
      <p>AI tools can support between-session journaling, help you put something into words before a session, or explain what an approach involves. They work alongside a therapist — not instead of one.</p>
    </div>
    <div class="care-profile-meta">
      <span class="care-profile-privacy">your answers live only on this device · nothing is sent anywhere</span>
      <span class="care-profile-brand">spwashi.com</span>
    </div>
  </footer>

  <div class="care-profile-controls frame-operators" data-screenshot-hidden>
    <button class="spw-chip" data-spw-handle="true" data-care-copy data-spw-operator="wonder">? copy profile</button>
    <button class="spw-chip" data-spw-handle="true" data-care-download data-spw-operator="value" title="Save the profile as a .spw.txt you can bring to our next conversation">*download .txt</button>
    <button class="spw-chip" data-spw-handle="true" data-care-screenshot data-spw-operator="perspective" aria-label="Toggle screenshot mode">@ screenshot mode</button>
    <a class="spw-chip" data-spw-handle="true" href="#practices" data-spw-operator="potential" data-spw-action="explore">~revisit the practices</a>
  </div>
</div>`.trim();
}

/* The profile as Spw, the way the order card and the services bundle
   serialize: one block a person can paste into a message or keep. */
function buildProfileSeed(state) {
  const year = new Date().getFullYear();
  const line = (key, value) => `  ${key.padEnd(10)}: "${String(value || '').replace(/"/g, '\\"')}"`;
  const approaches = suggestApproaches(state);
  return [
    `^seed[Care.Profile ref:${year}]{`,
    line('situation', (state.situation || []).map(s => SITUATION_LABELS[s] || s).join(' · ')),
    line('support', (state.support || []).map(s => SUPPORT_LABELS[s] || s).join(' · ')),
    line('setting', [state.format, state.medium].filter(Boolean).join(', ')),
    line('readiness', state.readiness ? READINESS_LABELS[state.readiness] || state.readiness : ''),
    line('note', (state.note || '').trim()),
    line('approaches', approaches.join(' · ')),
    line('next', 'bring this to our next conversation; nothing here is a diagnosis'),
    '}',
  ].join('\n');
}

// ─── Mount ────────────────────────────────────────────────────────────────────

/**
 * Care is one intake (interface/intake.js): chips keyed data-care-*, a note,
 * a charge, a generated card. The card's exits are the site's (interface/
 * seed-exits.js): copy the ^seed block, download it as .spw.txt, screenshot
 * posture. The catalog loader passes (ctx, root); a direct caller passes (root).
 */
export function mount(ctxOrRoot, rootArg) {
  const root = rootArg instanceof Element ? rootArg : (ctxOrRoot instanceof Element ? ctxOrRoot : null);
  if (!root) return () => {};

  const intake = createIntake(root, {
    ns: 'care',
    storageKey: STORAGE_KEY,
    fields: CHARGE_FIELDS,
    noteKey: 'note',
    render: buildProfileCard,
    onChange: (_state, charge) => root.style.setProperty('--care-charge', charge.toFixed(2)),
    labels: { generate: '!generate[care_profile]', regenerate: '!regenerate[care_profile]' },
  });

  const unbindExits = bindSeedExits(root, {
    seed: () => buildProfileSeed(intake.state),
    filename: () => `care-profile-${new Date().getFullYear()}`,
    card: () => root.querySelector('[data-care-profile]'),
    actions: { copy: '[data-care-copy]', download: '[data-care-download]', screenshot: '[data-care-screenshot]' },
    hook: 'data-screenshot-mode',
    labels: { screenshotOn: '@ exit screenshot mode', screenshotOff: '@ screenshot mode' },
  });

  return () => {
    unbindExits();
    intake.destroy();
  };
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'care-intake',
  mount,
  describes: 'care[situation|support|setting|readiness]{profile.card} intake[chips|note|charge] exits[copy|download|screenshot]',
  timingArc: 'visible-feature',
  effectScope: 'local-dom storage',
});
