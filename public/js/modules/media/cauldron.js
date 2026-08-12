/**
 * modules/media/cauldron.js
 * ---------------------------------------------------------------------------
 * Media-publishing prompt cauldron controls and local seed generation.
 */

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
  worldBuildingMode: Object.freeze({
    off: 'General media seed',
    lore: 'Lore increment',
    faction: 'Faction pressure',
    character: 'Character beat',
    atlas: 'Town Atlas note'
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

const WORLD_BUILDING_NOTES = Object.freeze({
  off: 'Keep the seed useful for the selected medium; do not force lore if the source ingredient wants another form.',
  lore: 'Name one public detail, the pressure that could change it, and the boundary that keeps the draft reviewable.',
  faction: 'Name a group, its want, its friction with another force, and one visible artifact of that pressure.',
  character: 'Name a person or guide, their current pressure, one playable gesture, and the line they would not say directly.',
  atlas: 'Shape the output as a Town Atlas candidate: place, rule, evidence, unresolved question, and next review action.'
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

const buildContext = (root) => {
  const attention = readRootAttention();
  const genre = readValue(root, 'mediaGenre', 'prose');
  const focus = readValue(root, 'relationalFocus', 'triad');
  const worldMode = readValue(root, 'worldBuildingMode', 'off');
  const prime = readValue(root, 'attentionPrime', '').trim();
  const ingredient = readValue(root, 'sourceIngredient', '').trim();
  const genreLabel = getLabel('mediaGenre', genre);
  const focusLabel = getLabel('relationalFocus', focus);
  const worldModeLabel = getLabel('worldBuildingMode', worldMode);
  const self = getLabel('attentionSelfRelation', attention.attentionSelfRelation);
  const local = getLabel('attentionLocalRelation', attention.attentionLocalRelation);
  const global = getLabel('attentionGlobalRelation', attention.attentionGlobalRelation);
  const template = TEMPLATES[genre] || TEMPLATES.prose;
  const worldNote = WORLD_BUILDING_NOTES[worldMode] || WORLD_BUILDING_NOTES.off;

  return {
    genre,
    focus,
    worldMode,
    prime,
    ingredient,
    genreLabel,
    focusLabel,
    worldModeLabel,
    self,
    local,
    global,
    template,
    worldNote
  };
};

const buildSeed = (root) => {
  const context = buildContext(root);
  return [
    `#>media_seed{${context.genre}}`,
    `medium: ${context.genreLabel}`,
    `relational_focus: ${context.focusLabel}`,
    `world_building_mode: ${context.worldModeLabel}`,
    `attention_prime: ${context.prime || 'self -> local -> global; keep the first usable image'}`,
    `shaped_by: self=${context.self} | local=${context.local} | global=${context.global}`,
    `self_relation: ${context.self}`,
    `local_relation: ${context.local}`,
    `global_relation: ${context.global}`,
    `source_ingredient: ${context.ingredient || 'one observed detail, route, memory, or concept from the current surface'}`,
    '',
    'prompt_pack:',
    `- ${context.template}`,
    `- World-building bias: ${context.worldNote}`,
    '- Preserve Spwashi voice: concrete, inspectable, playful, technically literate, and local-first.',
    '- Include one artifact handle that can travel: title, caption, scene beat, route note, chorus line, or proof-card claim.',
    '- Make the relation visible without explaining meditation as a lecture.',
    '',
    'attention_notes:',
    `- self: return through ${context.self}; name the felt constraint before expanding.`,
    `- local: test against ${context.local}; include a witness, room, table, or proof surface.`,
    `- global: keep ${context.global} as horizon; show inheritance, system pressure, or stewardship through image and consequence.`
  ].join('\n');
};

const buildProofCard = (root) => {
  const context = buildContext(root);
  return [
    `^proof_card{media_canon_candidate}`,
    `claim: ${context.ingredient || 'This source ingredient can become a public artifact after review.'}`,
    `medium: ${context.genreLabel}`,
    `world_mode: ${context.worldModeLabel}`,
    `shaped_by: self=${context.self} | local=${context.local} | global=${context.global}`,
    `evidence: generated locally from Media Cauldron; source remains draft/private until intentionally published.`,
    `boundary_test: What would make this misleading, overexposed, or not ready for public canon?`,
    `next_action: review, revise, then route to /cards/, /town/, or /play/rpg-wednesday/library/.`
  ].join('\n');
};

const buildTownNote = (root) => {
  const context = buildContext(root);
  return [
    `#>town_atlas_note{${context.worldMode === 'off' ? 'canon-candidate' : context.worldMode}}`,
    `source: ${context.ingredient || 'one observed detail, route, memory, or concept from the current surface'}`,
    `mode: ${context.worldModeLabel}`,
    `attention_posture: self=${context.self}; local=${context.local}; global=${context.global}`,
    '',
    `atlas_entry: Name the place, custom, guide, faction, object, rule, or scene pressure this seed wants to become.`,
    `public_evidence: Add one screenshot, session line, route note, proof-card claim, or repeated detail.`,
    `open_question: What should stay unresolved so the world can keep moving?`,
    `review_path: compare against /town/ and /play/rpg-wednesday/library/ before treating it as public canon.`
  ].join('\n');
};

const buildMarkdown = (root) => {
  const context = buildContext(root);
  return [
    `## Media Cauldron Seed`,
    '',
    `- **Medium:** ${context.genreLabel}`,
    `- **Relational focus:** ${context.focusLabel}`,
    `- **World-building mode:** ${context.worldModeLabel}`,
    `- **Attention posture:** self=${context.self}; local=${context.local}; global=${context.global}`,
    `- **Source ingredient:** ${context.ingredient || 'one observed detail, route, memory, or concept from the current surface'}`,
    '',
    `### Prompt Pack`,
    '',
    `- ${context.template}`,
    `- ${context.worldNote}`,
    `- Include one artifact handle that can travel into a route note, proof card, Town Atlas entry, scene beat, caption, or chorus line.`,
    '',
    `### Review Boundary`,
    '',
    `Keep drafts private until the proof, route, or canon claim is intentionally selected for publication.`
  ].join('\n');
};

const buildFormattedOutput = (root, format) => {
  if (format === 'proof-card') return buildProofCard(root);
  if (format === 'town-note') return buildTownNote(root);
  if (format === 'markdown') return buildMarkdown(root);
  return buildSeed(root);
};

const writeOutput = (root, value) => {
  const output = root.querySelector('[data-media-cauldron-output]');
  if (!output) return;
  output.value = value;
  root.dataset.mediaCauldronState = 'generated';
  output.dispatchEvent(new Event('input', { bubbles: true }));
};

export function initMediaCauldron(ctx, root) {
  if (!(root instanceof Node)) {
    root = document;
  }
  const cauldron = root.matches?.('[data-media-cauldron]') ? root : root.querySelector?.('[data-media-cauldron]');
  if (!(cauldron instanceof HTMLElement)) return null;

  const generate = cauldron.querySelector('[data-media-cauldron-action="generate"]');
  const copy = cauldron.querySelector('[data-media-cauldron-action="copy"]');
  const copyProofCard = cauldron.querySelector('[data-media-cauldron-action="copy-proof-card"]');
  const copyTownNote = cauldron.querySelector('[data-media-cauldron-action="copy-town-note"]');
  const copyMarkdown = cauldron.querySelector('[data-media-cauldron-action="copy-markdown"]');
  const status = cauldron.querySelector('[data-media-cauldron-status]');
  const posture = cauldron.querySelector('[data-media-cauldron-posture]');

  const syncPosture = () => {
    if (!posture) return;
    const context = buildContext(cauldron);
    posture.textContent = `Shaped by: self ${context.self} | local ${context.local} | global ${context.global}.`;
  };

  const handleGenerate = () => {
    const seed = buildSeed(cauldron);
    writeOutput(cauldron, seed);
    syncPosture();
    if (status) status.textContent = 'Media seed generated locally.';
  };

  const copyValue = async (value, successMessage) => {
    if (!value) return;
    const output = cauldron.querySelector('[data-media-cauldron-output]');
    try {
      await navigator.clipboard.writeText(value);
      if (status) status.textContent = successMessage;
    } catch {
      if (output) output.value = value;
      output?.focus();
      output?.select();
      if (status) status.textContent = 'Select the generated text and copy it manually.';
    }
  };

  const handleCopy = async () => {
    const output = cauldron.querySelector('[data-media-cauldron-output]');
    if (!output?.value) handleGenerate();
    await copyValue(output?.value || buildSeed(cauldron), 'Copied media seed.');
  };

  const handleCopyFormat = (format, message) => async () => {
    const value = buildFormattedOutput(cauldron, format);
    writeOutput(cauldron, value);
    syncPosture();
    await copyValue(value, message);
  };

  const handleCopyProofCard = handleCopyFormat('proof-card', 'Copied proof card draft.');
  const handleCopyTownNote = handleCopyFormat('town-note', 'Copied Town Atlas note draft.');
  const handleCopyMarkdown = handleCopyFormat('markdown', 'Copied markdown seed.');

  generate?.addEventListener('click', handleGenerate);
  copy?.addEventListener('click', handleCopy);
  copyProofCard?.addEventListener('click', handleCopyProofCard);
  copyTownNote?.addEventListener('click', handleCopyTownNote);
  copyMarkdown?.addEventListener('click', handleCopyMarkdown);
  const fields = [...cauldron.querySelectorAll('select, textarea, input')];
  fields.forEach((field) => field.addEventListener('change', handleGenerate));

  handleGenerate();

  return {
    cleanup() {
      generate?.removeEventListener('click', handleGenerate);
      copy?.removeEventListener('click', handleCopy);
      copyProofCard?.removeEventListener('click', handleCopyProofCard);
      copyTownNote?.removeEventListener('click', handleCopyTownNote);
      copyMarkdown?.removeEventListener('click', handleCopyMarkdown);
      fields.forEach((field) => field.removeEventListener('change', handleGenerate));
    },
    refresh() {
      handleGenerate();
    }
  };
}
