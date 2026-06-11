export function createFrameSigil(options?: {
  href?: string;
  sigilText?: string;
  operator?: string;
  asLink?: boolean | null;
}): HTMLAnchorElement | HTMLSpanElement;

export function createFrameHeading(options?: {
  href?: string;
  sigilText?: string;
  title?: string;
  headingLevel?: number;
  operator?: string;
  headingId?: string;
}): HTMLElement;

export function createCardSigil(
  sigilText?: string,
  options?: {
    operator?: string;
    className?: string;
    ariaHidden?: boolean;
  }
): HTMLSpanElement;