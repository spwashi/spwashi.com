export type ComponentCaptureFlow = 'page' | 'region' | 'component' | 'template';
export type SocialAspectId = 'fit' | 'square' | 'portrait' | 'story' | 'landscape' | 'og';

export type ComponentFixture = Readonly<{
  id: string;
  label: string;
  selector: string;
  /** Stable page region that owns the specimen in its live route. */
  regionSelector?: string;
  specimenRoute: string;
  cssOwner: string;
  snippet: string;
  requiredSlots: readonly string[];
  states: readonly string[];
  layoutScenarios: readonly string[];
  /** Preferred capture flows; capture tool defaults to all three when omitted. */
  captureFlows?: readonly ComponentCaptureFlow[];
  /** Where capture evidence is expected to publish long-term. */
  publishTargets?: readonly string[];
  /** One-line reason this fixture earns screenshot budget. */
  captureValue?: string;
  /** Named social canvases this unit is allowed to precipitate into. `fit` is the unique ratio. */
  socialAspects?: readonly SocialAspectId[];
  /** Copy-flow measure token that sizes unique/social cards. */
  sizeToken?: 'measure-compact' | 'measure-card' | 'measure-reading';
  /** Combination this still is meant to show, when the intrigue is synergy not isolation. */
  synergy?: Readonly<{ with: string; reason: string }>;
  wonder?: string;
  /** Review-arc chapter for capture galleries. Existing vocabulary, not a new attribute family. */
  chapter?: 'linguistics' | 'physics' | 'region' | 'personality' | 'page' | 'climate';
  /** Authored liminality of the live specimen, when the host already carries it. */
  liminality?: 'entry' | 'threshold' | 'middle' | 'return' | 'exit';
}>;

export const COMPONENT_FIXTURES = Object.freeze([
  {
    id: 'site-frame',
    label: 'Site frame',
    selector: '#component-anatomy-slots',
    specimenRoute: '/design/components/#component-anatomy-slots',
    cssOwner: 'public/css/components/foundation.css',
    snippet: 'design/components/snippets/site-frame.html',
    requiredSlots: ['header', 'body'],
    states: ['reading', 'inspect', 'dense'],
    layoutScenarios: ['pocket', 'fold', 'broadsheet'],
    captureFlows: ['page', 'component', 'template'],
    publishTargets: ['design-review', 'starter-kit', 'agent-brief'],
    captureValue: 'Primary structural vessel — slot anatomy and packing posture.',
    socialAspects: ['fit', 'landscape'],
    sizeToken: 'measure-reading',
    chapter: 'physics',
    liminality: 'return',
    wonder: 'Slot anatomy as a still — the frame is the physics, not the chrome around it.',
  },
  {
    id: 'frame-card',
    label: 'Frame card',
    selector: '#entry-loops .frame-card',
    regionSelector: '#entry-loops',
    specimenRoute: '/',
    cssOwner: 'public/css/components/cards.css',
    snippet: 'design/components/snippets/frame-card.html',
    requiredSlots: ['body'],
    states: ['ambient', 'focal', 'collected'],
    layoutScenarios: ['pocket', 'fold', 'broadsheet'],
    captureFlows: ['page', 'region', 'component', 'template'],
    publishTargets: ['starter-kit', 'template-pipeline', 'agent-brief', 'social-still'],
    captureValue: 'Portable card unit — glass surface + slot grammar without shell.',
    socialAspects: ['fit', 'square', 'portrait'],
    sizeToken: 'measure-card',
    synergy: { with: '#entry-loops', reason: 'card sitting in the home loop, not a studio void' },
    chapter: 'physics',
    liminality: 'entry',
    wonder: 'A unique content-fit card of one loop is more postable than a full-page home dump.',
  },
  {
    id: 'operator-chip',
    label: 'Operator chip',
    selector: '#components-glossary-hook .spw-chip',
    regionSelector: '#components-glossary-hook',
    specimenRoute: '/design/components/#components-glossary-hook',
    cssOwner: 'public/css/handles/operators/sigils-and-chips.css',
    snippet: 'design/components/snippets/operator-chip.html',
    requiredSlots: [],
    states: ['frame', 'probe', 'action'],
    layoutScenarios: ['pocket', 'fold', 'broadsheet'],
    captureFlows: ['region', 'component', 'template'],
    publishTargets: ['starter-kit', 'template-pipeline', 'agent-brief', 'social-still'],
    captureValue: 'Operator handle density — small clip more valuable than full page.',
    socialAspects: ['fit', 'square'],
    sizeToken: 'measure-compact',
    chapter: 'linguistics',
    liminality: 'entry',
    wonder: 'The unique ratio is the chip itself. A 1/1 still asks whether the sigil still reads.',
  },
  {
    id: 'tuning-strip',
    label: 'Tuning strip',
    selector: '#structural-vocabulary .tuning-strip',
    regionSelector: '#structural-vocabulary',
    specimenRoute: '/design/components/#structural-vocabulary',
    cssOwner: 'public/css/components/controls.css',
    snippet: 'design/components/snippets/tuning-strip.html',
    requiredSlots: [],
    states: ['compact', 'wrapped'],
    layoutScenarios: ['pocket', 'fold', 'broadsheet'],
    captureFlows: ['region', 'component', 'template'],
    publishTargets: ['starter-kit', 'template-pipeline', 'agent-brief'],
    captureValue: 'Compact control grouping — wrapping and label clarity matter more than route context.',
    socialAspects: ['fit', 'landscape'],
    sizeToken: 'measure-card',
    chapter: 'physics',
    liminality: 'threshold',
    wonder: 'Wrapping is the physics. A landscape still should show the strip turning, not a single button.',
  },
] as const satisfies readonly ComponentFixture[]);

export function getComponentFixture(id: string): ComponentFixture | undefined {
  return COMPONENT_FIXTURES.find((fixture) => fixture.id === id);
}
