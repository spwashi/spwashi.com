export type ComponentCaptureFlow = 'page' | 'region' | 'component' | 'template';

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
    layoutScenarios: ['phone', 'desktop'],
    captureFlows: ['page', 'component', 'template'],
    publishTargets: ['design-review', 'starter-kit', 'agent-brief'],
    captureValue: 'Primary structural vessel — slot anatomy and packing posture.',
  },
  {
    id: 'frame-card',
    label: 'Frame card',
    selector: '.frame-card',
    regionSelector: '#entry-loops',
    specimenRoute: '/',
    cssOwner: 'public/css/components/cards.css',
    snippet: 'design/components/snippets/frame-card.html',
    requiredSlots: ['body'],
    states: ['ambient', 'focal', 'collected'],
    layoutScenarios: ['phone', 'desktop'],
    captureFlows: ['page', 'region', 'component', 'template'],
    publishTargets: ['starter-kit', 'template-pipeline', 'agent-brief'],
    captureValue: 'Portable card unit — glass surface + slot grammar without shell.',
  },
  {
    id: 'operator-chip',
    label: 'Operator chip',
    selector: '#component-anatomy-slots .spw-chip',
    regionSelector: '#component-anatomy-slots',
    specimenRoute: '/design/components/#component-anatomy-slots',
    cssOwner: 'public/css/handles/operators/sigils-and-chips.css',
    snippet: 'design/components/snippets/operator-chip.html',
    requiredSlots: [],
    states: ['frame', 'probe', 'action'],
    layoutScenarios: ['phone', 'desktop'],
    captureFlows: ['region', 'component', 'template'],
    publishTargets: ['starter-kit', 'template-pipeline', 'agent-brief'],
    captureValue: 'Operator handle density — small clip more valuable than full page.',
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
    layoutScenarios: ['phone', 'desktop'],
    captureFlows: ['region', 'component', 'template'],
    publishTargets: ['starter-kit', 'template-pipeline', 'agent-brief'],
    captureValue: 'Compact control grouping — wrapping and label clarity matter more than route context.',
  },
] as const satisfies readonly ComponentFixture[]);

export function getComponentFixture(id: string): ComponentFixture | undefined {
  return COMPONENT_FIXTURES.find((fixture) => fixture.id === id);
}
