/**
 * care-intake.js
 *
 * A reflective intake form for people considering therapy.
 * Not a diagnostic tool — a thinking aid and care-profile generator.
 *
 * State: localStorage under key 'spw:care-intake'
 * Output: a screenshottable care profile card
 *
 * Design intent: help someone arrive at a first conversation with a therapist
 * already knowing what they want to say.
 */

const STORAGE_KEY = 'spw:care-intake';

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

  const situations = (state.situation || []).map(s => SITUATION_LABELS[s] || s);
  const supports   = (state.support || []).map(s => SUPPORT_LABELS[s] || s);
  const readiness  = state.readiness ? READINESS_LABELS[state.readiness] || state.readiness : null;
  const format     = state.format || null;
  const medium     = state.medium || null;
  const note       = (state.note || '').trim();

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
      <span class="care-profile-section-label">questions to ask a prospective therapist</span>
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

  <div class="care-profile-controls" data-screenshot-hidden>
    <button class="operator-chip" data-care-screenshot aria-label="Toggle screenshot mode">@ screenshot mode</button>
  </div>
</div>`.trim();
}

// ─── Charge ───────────────────────────────────────────────────────────────────

function computeCharge(state) {
  const fields = ['situation', 'support', 'format', 'medium', 'readiness'];
  const filled = fields.filter(k => {
    const v = state[k];
    return Array.isArray(v) ? v.length > 0 : !!v;
  }).length;
  return Math.min((filled + (state.note ? 0.5 : 0)) / (fields.length + 0.5), 1);
}

// ─── Storage ──────────────────────────────────────────────────────────────────

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── Mount ────────────────────────────────────────────────────────────────────

export function mount(root) {
  if (!root) return;

  let state = loadState();

  // Restore selections
  root.querySelectorAll('[data-care-key][data-care-val]').forEach(chip => {
    const { careKey: key, careVal: val } = chip.dataset;
    const saved = state[key];
    const active = Array.isArray(saved) ? saved.includes(val) : saved === val;
    chip.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  // Restore textarea
  const textarea = root.querySelector('[data-care-key="note"]');
  if (textarea && state.note) textarea.value = state.note;

  refresh(root, state);

  // Chip toggles
  root.addEventListener('click', e => {
    const chip = e.target.closest('[data-care-key][data-care-val]');
    if (chip) {
      handleChip(chip, state, root);
      return;
    }
    const generateBtn = e.target.closest('[data-care-generate]');
    if (generateBtn) {
      generate(root, state);
      return;
    }
    const resetBtn = e.target.closest('[data-care-reset]');
    if (resetBtn) {
      reset(root, state);
    }
  });

  // Screenshot toggle (delegated — card is dynamically inserted)
  root.addEventListener('click', e => {
    const btn = e.target.closest('[data-care-screenshot]');
    if (!btn) return;
    const card = root.querySelector('[data-care-profile]');
    if (!card) return;
    const on = card.hasAttribute('data-screenshot-mode');
    card.toggleAttribute('data-screenshot-mode', !on);
    btn.textContent = on ? '@ screenshot mode' : '@ exit screenshot mode';
  });

  // Textarea
  if (textarea) {
    textarea.addEventListener('input', () => {
      state.note = textarea.value.trim();
      saveState(state);
      refresh(root, state);
    });
  }
}

function handleChip(chip, state, root) {
  const { careKey: key, careVal: val, careMulti } = chip.dataset;
  const multi = careMulti === 'true';

  if (multi) {
    const current = Array.isArray(state[key]) ? state[key] : [];
    const idx = current.indexOf(val);
    if (idx >= 0) {
      current.splice(idx, 1);
      chip.setAttribute('aria-pressed', 'false');
    } else {
      current.push(val);
      chip.setAttribute('aria-pressed', 'true');
    }
    state[key] = current;
  } else {
    root.querySelectorAll(`[data-care-key="${key}"][data-care-val]`).forEach(c => {
      c.setAttribute('aria-pressed', 'false');
    });
    state[key] = val;
    chip.setAttribute('aria-pressed', 'true');
  }

  saveState(state);
  refresh(root, state);
}

function refresh(root, state) {
  const charge = computeCharge(state);
  root.style.setProperty('--care-charge', charge.toFixed(2));

  const generateBtn = root.querySelector('[data-care-generate]');
  if (generateBtn) {
    generateBtn.disabled = charge < 0.1;
    generateBtn.textContent = charge >= 0.1
      ? (root.querySelector('[data-care-profile]') ? '@ regenerate profile' : '@ generate care profile')
      : '@ generate care profile';
  }
}

function generate(root, state) {
  const output = root.querySelector('[data-care-output]');
  if (!output) return;
  output.innerHTML = buildProfileCard(state);
  output.removeAttribute('hidden');
  output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  refresh(root, state);
}

function reset(root, state) {
  localStorage.removeItem(STORAGE_KEY);
  Object.keys(state).forEach(k => delete state[k]);
  root.querySelectorAll('[data-care-key][data-care-val]').forEach(c => {
    c.setAttribute('aria-pressed', 'false');
  });
  const textarea = root.querySelector('[data-care-key="note"]');
  if (textarea) textarea.value = '';
  const output = root.querySelector('[data-care-output]');
  if (output) {
    output.innerHTML = '';
    output.setAttribute('hidden', '');
  }
  refresh(root, state);
}
