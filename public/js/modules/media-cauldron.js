const LABELS = Object.freeze({
  mediaGenre: Object.freeze({
    prose: 'Prose vignette',
    lyric: 'Lyric / song sketch',
    visual: 'Visual lattice',
    storyboard: 'Storyboard',
    curriculum: 'Curriculum fragment',
    audio: 'Audio texture'
  }),
  relationalFocus: Object.freeze({
    self: 'Self relation',
    local: 'Local context',
    global: 'Global horizon',
    triad: 'Full relation triad'
  }),
  attentionSelfRelation: Object.freeze({
    breath: 'breath',
    'inner-weather': 'inner weather',
    'dimensional-scan': 'dimensional scan'
  }),
  attentionLocalRelation: Object.freeze({
    'immediate-field': 'immediate field',
    witness: 'witness',
    'reciprocity-proof': 'reciprocity / proof'
  }),
  attentionGlobalRelation: Object.freeze({
    'horizon-systems': 'horizon systems',
    'cultural-fermentation': 'cultural inheritance / fermentation',
    stewardship: 'stewardship'
  })
});

const TEMPLATES = Object.freeze({
  prose: 'Write a scene or essay fragment with a concrete object, one local pressure, and one sentence that can become a route note.',
  lyric: 'Draft a lyric seed with sensory refrain, breath pacing, local witness, and a horizon image that can repeat without flattening.',
  visual: 'Generate a visual lattice: material palette, repeated form, foreground relation, background system, and one inspectable glyph.',
  storyboard: 'Create six beats: arrival, self check, local exchange, complication, horizon reveal, and return artifact.',
  curriculum: 'Build a teaching fragment with concept, analogy, boundary test, worked example, and carry-forward practice.',
  audio: 'Score an audio texture with breath rhythm, room tone, relational motif, system swell, and a quiet return cue.'
});

const getLabel = (group, value) => LABELS[group]?.[value] || String(value || '').replace(/-/g, ' ');

const readRootAttention = () => {
  const dataset = document.documentElement?.dataset || {};
  return {
    attentionSelfRelation: dataset.spwAttentionSelfRelation || 'breath',
    attentionLocalRelation: dataset.spwAttentionLocalRelation || 'immediate-field',
    attentionGlobalRelation: dataset.spwAttentionGlobalRelation || 'horizon-systems'
  };
};

const readValue = (root, name, fallback = '') => {
  const field = root.querySelector(`[name="${CSS.escape(name)}"]`);
  return field?.value || fallback;
};

const buildSeed = (root) => {
  const attention = readRootAttention();
  const genre = readValue(root, 'mediaGenre', 'prose');
  const focus = readValue(root, 'relationalFocus', 'triad');
  const prime = readValue(root, 'attentionPrime', '').trim();
  const ingredient = readValue(root, 'sourceIngredient', '').trim();
  const genreLabel = getLabel('mediaGenre', genre);
  const focusLabel = getLabel('relationalFocus', focus);
  const self = getLabel('attentionSelfRelation', attention.attentionSelfRelation);
  const local = getLabel('attentionLocalRelation', attention.attentionLocalRelation);
  const global = getLabel('attentionGlobalRelation', attention.attentionGlobalRelation);
  const template = TEMPLATES[genre] || TEMPLATES.prose;

  return [
    `#>media_seed{${genre}}`,
    `medium: ${genreLabel}`,
    `relational_focus: ${focusLabel}`,
    `attention_prime: ${prime || 'self -> local -> global; keep the first usable image'}`,
    `self_relation: ${self}`,
    `local_relation: ${local}`,
    `global_relation: ${global}`,
    `source_ingredient: ${ingredient || 'one observed detail, route, memory, or concept from the current surface'}`,
    '',
    'prompt_pack:',
    `- ${template}`,
    '- Preserve Spwashi voice: concrete, inspectable, playful, technically literate, and local-first.',
    '- Include one artifact handle that can travel: title, caption, scene beat, route note, chorus line, or proof-card claim.',
    '- Make the relation visible without explaining meditation as a lecture.',
    '',
    'attention_notes:',
    `- self: return through ${self}; name the felt constraint before expanding.`,
    `- local: test against ${local}; include a witness, room, table, or proof surface.`,
    `- global: keep ${global} as horizon; show inheritance, system pressure, or stewardship through image and consequence.`
  ].join('\n');
};

const writeOutput = (root, value) => {
  const output = root.querySelector('[data-media-cauldron-output]');
  if (!output) return;
  output.value = value;
  root.dataset.mediaCauldronState = 'generated';
  output.dispatchEvent(new Event('input', { bubbles: true }));
};

export function initMediaCauldron(root = document) {
  const cauldron = root.matches?.('[data-media-cauldron]') ? root : root.querySelector?.('[data-media-cauldron]');
  if (!(cauldron instanceof HTMLElement)) return null;

  const generate = cauldron.querySelector('[data-media-cauldron-action="generate"]');
  const copy = cauldron.querySelector('[data-media-cauldron-action="copy"]');
  const status = cauldron.querySelector('[data-media-cauldron-status]');

  const handleGenerate = () => {
    const seed = buildSeed(cauldron);
    writeOutput(cauldron, seed);
    if (status) status.textContent = 'Media seed generated locally.';
  };

  const handleCopy = async () => {
    const output = cauldron.querySelector('[data-media-cauldron-output]');
    const value = output?.value || '';
    if (!value) handleGenerate();
    const nextValue = output?.value || value;
    if (!nextValue) return;

    try {
      await navigator.clipboard.writeText(nextValue);
      if (status) status.textContent = 'Copied media seed.';
    } catch {
      output?.focus();
      output?.select();
      if (status) status.textContent = 'Select the seed and copy it manually.';
    }
  };

  generate?.addEventListener('click', handleGenerate);
  copy?.addEventListener('click', handleCopy);
  const fields = [...cauldron.querySelectorAll('select, textarea, input')];
  fields.forEach((field) => field.addEventListener('change', handleGenerate));

  handleGenerate();

  return {
    cleanup() {
      generate?.removeEventListener('click', handleGenerate);
      copy?.removeEventListener('click', handleCopy);
      fields.forEach((field) => field.removeEventListener('change', handleGenerate));
    },
    refresh() {
      handleGenerate();
    }
  };
}
