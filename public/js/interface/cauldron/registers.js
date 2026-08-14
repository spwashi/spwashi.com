/**
 * Cauldron registers — the spaces an ingredient has coordinates in.
 *
 * An ingredient was a flat bag of about twenty sibling fields. Several of those
 * fields are not independent facts about the fragment; they are projections of
 * other fields, stored next to their own sources:
 *
 *   element        assigned the identical variable as `phase` — an exact alias
 *   tangibility    a pure function of `phase` (inferTangibility switches on it)
 *   succession     a pure function of `fixity` (computeSuccession switches on it)
 *
 * Persisting a projection beside its source means the two can disagree, and
 * normalizeIngredient prefers the stored copy over recomputation, so a drift is
 * permanent once it happens. Worse for reading: nothing in the shape says which
 * fields are independent, so no consumer can tell whether comparing two
 * ingredients on `tangibility` says anything that comparing them on `phase` did
 * not.
 *
 * A register fixes this by being explicit about four things a register cannot say
 * about itself:
 *
 *   carrier      the live `data-spw-*` register this coordinate reads from, so a
 *                stored coordinate and a running register are the same value
 *                addressed twice rather than two parallel vocabularies
 *   ordering     whether distance between two values means anything. The
 *                liminality ladder is ordered and `entry → deep` is a distance
 *                of two; biome is categorical and `prairie → wetland` is not a
 *                distance, it is a difference
 *   identity     the value that changes nothing when composed — a register
 *                without one cannot accumulate
 *   compose      what two values do when a spell holds both
 *
 * `compose` is what makes gathering pay. A cauldron holding four fragments is a
 * list until the registers say what the four amount to together; with them it is
 * a point per register, which is a spell's actual reading.
 *
 * Nothing here parses. Nothing here touches the DOM. Every register is data, so
 * the set can be queried, printed into a `.spw` surface, or served to a probe
 * without loading the cauldron interface at all.
 */

/** Ladders are ordered; distance along one is meaningful. */
const LIMINALITY_LADDER = Object.freeze(['entry', 'threshold', 'deep', 'projected', 'settled']);
const FIXITY_LADDER = Object.freeze(['volatile', 'experimental', 'tending', 'stable', 'fixed']);

/**
 * Phase is categorical, but it has a scalar shadow: how much a thing is there.
 * Keeping the scalar as a projection *of* the register rather than as a second
 * field is the whole point — tangibility is a view, not a fact.
 */
const PHASE_TANGIBILITY = Object.freeze({
  radiant: 0.15,
  fluid: 0.35,
  membrane: 0.50,
  plastic: 0.55,
  lattice: 0.75,
  ground: 0.95,
});

const SUCCESSION_BY_FIXITY = Object.freeze({
  fixed: 'canopy',
  stable: 'cluster',
  tending: 'root',
  experimental: 'spore',
  volatile: 'spore',
});

/**
 * Valence — signed charge per operator.
 *
 * The sign is about what an operator does to a reader's balance, not about
 * whether it is good: `?` opens something and credits, `!` commits and spends,
 * `#>` carries structure and does neither. This is the one register where
 * gathering literally adds up, which is what lets a spell report whether a
 * visit accrued or spent without anyone scoring it by hand.
 */
const OPERATOR_VALENCE = Object.freeze({
  '#>': 0,     // ground — structure/carrier
  '^': 1,      // lift — arrival/benefit
  '~': 0,      // induct — signal/relay, carries without sign
  '?': 1,      // probe — opens, so it credits
  '!': -1,     // assert — spends
  '@': 0,      // lens — relocates rather than charges
  '&': 1,      // subject — accrues
  '<': 0,
  '>': 0,
});

const clamp01 = (n) => Math.min(1, Math.max(0, n));
const rank = (ladder, value) => ladder.indexOf(value);

/**
 * The register set.
 *
 * Each entry is the complete contract for one coordinate. `read` pulls the
 * coordinate off an ingredient (tolerating the legacy flat shape, because
 * stored cauldrons predate this file and must keep loading).
 */
export const CAULDRON_REGISTERS = Object.freeze({
  /* ------------------------------------------------------------------ */
  phase: Object.freeze({
    label: 'phase',
    carrier: 'data-spw-phase',
    alsoWritten: ['data-spw-element'],
    kind: 'categorical',
    ordered: false,
    values: Object.keys(PHASE_TANGIBILITY),
    identity: 'ground',
    read: (ing) => ing?.phase || ing?.element || ing?.payload?.phase || ing?.payload?.element || '',
    /** The scalar shadow. Consumers wanting a number ask for it here. */
    scalar: (value) => PHASE_TANGIBILITY[value] ?? 0.5,
    /**
     * Phases do not average — a spell holding radiant and ground is not
     * membrane. It takes the most tangible phase present, because the least
     * abstract ingredient is what a reader will believe the spell is made of.
     */
    compose: (values) => values
      .filter(Boolean)
      .reduce((best, v) => ((PHASE_TANGIBILITY[v] ?? 0) > (PHASE_TANGIBILITY[best] ?? -1) ? v : best), ''),
    reading: (value) => (value
      ? `${value} — ${Math.round((PHASE_TANGIBILITY[value] ?? 0.5) * 100)}% there`
      : 'phaseless'),
  }),

  /* ------------------------------------------------------------------ */
  liminality: Object.freeze({
    label: 'liminality',
    carrier: 'data-spw-liminality',
    kind: 'ladder',
    ordered: true,
    values: LIMINALITY_LADDER,
    identity: 'entry',
    read: (ing) => ing?.payload?.liminality || ing?.liminality || '',
    scalar: (value) => {
      const i = rank(LIMINALITY_LADDER, value);
      return i < 0 ? 0 : i / (LIMINALITY_LADDER.length - 1);
    },
    /**
     * A gathering does not collapse to one band; it covers a span. The span is
     * the interesting quantity — a cauldron drawn entirely from `entry` is a
     * visit that never went inside, whatever else it holds.
     */
    compose: (values) => {
      const ranks = values.map((v) => rank(LIMINALITY_LADDER, v)).filter((i) => i >= 0);
      if (!ranks.length) return '';
      const lo = Math.min(...ranks);
      const hi = Math.max(...ranks);
      return lo === hi ? LIMINALITY_LADDER[lo] : `${LIMINALITY_LADDER[lo]}..${LIMINALITY_LADDER[hi]}`;
    },
    /** Distance is defined here and nowhere else. */
    distance: (a, b) => {
      const i = rank(LIMINALITY_LADDER, a);
      const j = rank(LIMINALITY_LADDER, b);
      return i < 0 || j < 0 ? null : Math.abs(i - j);
    },
    reading: (value) => (value.includes('..')
      ? `spans ${value} — this visit went somewhere`
      : `all at ${value || 'no band'}`),
  }),

  /* ------------------------------------------------------------------ */
  fixity: Object.freeze({
    label: 'fixity',
    carrier: 'data-spw-fixity',
    kind: 'ladder',
    ordered: true,
    values: FIXITY_LADDER,
    identity: 'tending',
    /**
     * Settledness only. The other sense of fixity — operator position, prefix
     * versus infix versus postfix — is the `position` register below. One word
     * carried both senses and the collision is why they are separated here.
     */
    sense: 'settledness',
    read: (ing) => ing?.fixity || ing?.payload?.fixity || '',
    scalar: (value) => {
      const i = rank(FIXITY_LADDER, value);
      return i < 0 ? 0.5 : i / (FIXITY_LADDER.length - 1);
    },
    /** A spell is only as settled as its least settled ingredient. */
    compose: (values) => {
      const ranks = values.map((v) => rank(FIXITY_LADDER, v)).filter((i) => i >= 0);
      return ranks.length ? FIXITY_LADDER[Math.min(...ranks)] : '';
    },
    project: (value) => SUCCESSION_BY_FIXITY[value] || 'spore',
    reading: (value) => `${value || 'unsettled'} — grows as ${SUCCESSION_BY_FIXITY[value] || 'spore'}`,
  }),

  /* ------------------------------------------------------------------ */
  valence: Object.freeze({
    label: 'valence',
    carrier: 'data-spw-charge',
    kind: 'signed',
    ordered: true,
    identity: 0,
    read: (ing) => {
      if (Number.isFinite(ing?.valence)) return ing.valence;
      return OPERATOR_VALENCE[ing?.operator] ?? 0;
    },
    scalar: (value) => clamp01((Number(value) + 1) / 2),
    /** Charge sums. This is the one register where gathering literally adds up. */
    compose: (values) => values.reduce((sum, v) => sum + (Number(v) || 0), 0),
    reading: (value) => {
      const n = Number(value) || 0;
      if (n > 0) return `+${n} — this gathering credits`;
      if (n < 0) return `${n} — this gathering spends`;
      return '0 — balanced, or structural';
    },
  }),

  /* ------------------------------------------------------------------ */
  position: Object.freeze({
    label: 'position',
    carrier: 'data-spw-operator-position',
    kind: 'categorical',
    ordered: false,
    values: ['prefix', 'infix', 'postfix', 'bare'],
    identity: 'bare',
    /** The other sense of fixity, named separately so neither has to disambiguate. */
    sense: 'operator geometry',
    read: (ing) => ing?.position || ing?.niche?.position || (ing?.operator ? 'prefix' : 'bare'),
    scalar: () => 0,
    /**
     * Positions do not merge — they describe how fragments could bind. A
     * gathering of all-prefix ingredients cannot form a compound, which is a
     * real finding about a cauldron and the reason this register exists.
     */
    compose: (values) => {
      const set = new Set(values.filter(Boolean));
      if (set.size === 0) return 'bare';
      if (set.size === 1) return [...set][0];
      return 'mixed';
    },
    reading: (value) => (value === 'mixed'
      ? 'mixed positions — these can bind into a compound'
      : `all ${value} — nothing here binds to anything else`),
  }),

  /* ------------------------------------------------------------------ */
  biome: Object.freeze({
    label: 'biome',
    carrier: 'data-spw-biome',
    kind: 'categorical',
    ordered: false,
    identity: 'prairie',
    read: (ing) => ing?.biome || ing?.payload?.biome || '',
    scalar: () => 0,
    /** Categorical: the composition is the census, not a winner. */
    compose: (values) => {
      const counts = values.filter(Boolean).reduce((acc, v) => {
        acc[v] = (acc[v] || 0) + 1;
        return acc;
      }, {});
      const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      return entries.length ? entries[0][0] : '';
    },
    reading: (value) => (value ? `mostly ${value}` : 'no biome'),
  }),
});

export const REGISTER_NAMES = Object.freeze(Object.keys(CAULDRON_REGISTERS));

/**
 * Where one ingredient sits — its coordinates, and only its coordinates.
 * Derived values are absent by construction; ask a register for them.
 */
export function locate(ingredient) {
  const at = {};
  for (const [name, register] of Object.entries(CAULDRON_REGISTERS)) {
    at[name] = register.read(ingredient);
  }
  return at;
}

/**
 * Recompute every projection from its source. This is what replaces storing
 * `element`, `tangibility` and `succession` — they are views, computed on read,
 * and so cannot drift from what they are views of.
 */
export function project(ingredient) {
  const at = locate(ingredient);
  return {
    tangibility: CAULDRON_REGISTERS.phase.scalar(at.phase),
    succession: CAULDRON_REGISTERS.fixity.project(at.fixity),
    element: at.phase,
  };
}

/**
 * What a gathering amounts to — one value per register, each by that register's own
 * rule. This is the spell's reading, and the reason a cauldron is more than a
 * list of what you clicked.
 */
export function composeRegisters(ingredients = []) {
  const items = Array.isArray(ingredients) ? ingredients.filter(Boolean) : [];
  const composed = {};
  for (const [name, register] of Object.entries(CAULDRON_REGISTERS)) {
    const values = items.map((item) => register.read(item));
    composed[name] = {
      value: register.compose(values),
      get reading() { return register.reading(this.value); },
    };
  }
  return composed;
}

/**
 * Render a composition as Spw, so a spell states its own coordinates in the
 * language rather than in a table only this file knows how to read.
 *
 *   spell[phase.fixity]{liminality.biome}<valence>
 */
export function composedExpression(ingredients = []) {
  const c = composeRegisters(ingredients);
  const frame = [c.phase.value, c.fixity.value].filter(Boolean).join('.');
  const body = [c.liminality.value, c.biome.value].filter(Boolean).join('.');
  const valence = c.valence.value;
  const projection = valence > 0 ? `+${valence}` : String(valence);
  return `spell${frame ? `[${frame}]` : ''}${body ? `{${body}}` : ''}<${projection}>`;
}

/**
 * The registry as data, for a probe or a `.spw` emitter. Deliberately excludes
 * the functions: a consumer asking what registers exist wants the contract, and a
 * consumer wanting to compute imports the registry itself.
 */
export function describeRegisters() {
  return REGISTER_NAMES.map((name) => {
    const d = CAULDRON_REGISTERS[name];
    return {
      name,
      carrier: d.carrier,
      kind: d.kind,
      ordered: d.ordered,
      identity: d.identity,
      values: d.values || null,
      sense: d.sense || null,
      citedBy: d.citedBy || null,
    };
  });
}
