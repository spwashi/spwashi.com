export type ComponentCaptureFlow = 'page' | 'component' | 'template';

export type ComponentFixture = Readonly<{
  id: string;
  label: string;
  selector: string;
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
    selector: '.site-frame',
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
    specimenRoute: '/design/composition/#spatial-gravity-title',
    cssOwner: 'public/css/components/cards.css',
    snippet: 'design/components/snippets/frame-card.html',
    requiredSlots: ['body'],
    states: ['ambient', 'focal', 'collected'],
    layoutScenarios: ['phone', 'desktop'],
    captureFlows: ['page', 'component', 'template'],
    publishTargets: ['starter-kit', 'template-pipeline', 'agent-brief'],
    captureValue: 'Portable card unit — glass surface + slot grammar without shell.',
  },
  {
    id: 'operator-chip',
    label: 'Operator chip',
    selector: '.operator-chip',
    specimenRoute: '/design/components/#component-anatomy-slots',
    cssOwner: 'public/css/handles/operators/sigils-and-chips.css',
    snippet: 'design/components/snippets/operator-chip.html',
    requiredSlots: [],
    states: ['frame', 'probe', 'action'],
    layoutScenarios: ['phone', 'desktop'],
    captureFlows: ['component', 'template'],
    publishTargets: ['starter-kit', 'template-pipeline', 'agent-brief'],
    captureValue: 'Operator handle density — small clip more valuable than full page.',
  },
  {
    id: 'tuning-strip',
    label: 'Tuning strip',
    selector: '.tuning-strip',
    specimenRoute: '/design/components/#component-recipes-capture',
    cssOwner: 'public/css/components/controls.css',
    snippet: 'design/components/snippets/tuning-strip.html',
    requiredSlots: [],
    states: ['compact', 'wrapped'],
    layoutScenarios: ['phone', 'desktop'],
    captureFlows: ['component', 'template'],
    publishTargets: ['starter-kit', 'template-pipeline', 'agent-brief'],
    captureValue: 'Compact control grouping — wrapping and label clarity matter more than route context.',
  },
] as const satisfies readonly ComponentFixture[]);

export function getComponentFixture(id: string): ComponentFixture | undefined {
  return COMPONENT_FIXTURES.find((fixture) => fixture.id === id);
}
