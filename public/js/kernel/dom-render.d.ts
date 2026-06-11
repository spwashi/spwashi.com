export const HYDRATION_STATES: readonly string[];
export const SKELETON_ROLES: readonly string[];

export type HydrationState = 'loading' | 'ready' | 'error';
export type SkeletonRole = 'heading' | 'line' | 'card';
export type ElementProps = Record<string, unknown> & {
  className?: string;
  text?: string;
  html?: string;
  trusted?: boolean;
  dataset?: Record<string, string | null | undefined>;
};

export function normalizeError(error: unknown, fallback?: string): string;
export function reportRenderError(
  source: string,
  error: unknown,
  options?: { host?: Element | null; silent?: boolean },
): { source: string; message: string; host: Element | null };

export function runSafe<T>(
  task: (() => T | Promise<T>) | Promise<T>,
  options?: { source?: string; fallback?: T; host?: Element | null; silent?: boolean },
): Promise<{ ok: boolean; value: T | null; error: unknown }>;

export function guardCall<T>(
  fn: ((...args: never[]) => T) | null | undefined,
  source?: string,
  options?: { fallback?: T; host?: Element | null; silent?: boolean },
): (...args: never[]) => T | undefined;

export function cleanText(value?: unknown): string;
export function escapeHtml(value?: unknown): string;
export function escapeAttr(value?: unknown): string;

export function interpolateTemplate(
  template: string,
  vars?: Record<string, unknown>,
  options?: { escape?: boolean; onUnknown?: (key: string) => void },
): string;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  attrs?: Record<string, unknown>,
): HTMLElementTagNameMap[K];

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: ElementProps,
  children?: Array<Node | string | number | null | false | undefined> | Node | string | number | null | false | undefined,
): HTMLElementTagNameMap[K];

export const createElement: typeof el;

export function fragment(
  children?: Array<Node | string | number | null | false | undefined> | Node | string | number | null | false | undefined,
): DocumentFragment;

export function clearChildren(parent: ParentNode | null | undefined): void;
export function replaceChildren(
  parent: ParentNode | null | undefined,
  children?: Array<Node | string | number | null | false | undefined> | Node | string | number | null | false | undefined,
): void;

export function setTrustedHtml(element: Element | null | undefined, html?: string): void;
export function createSkeleton(role?: SkeletonRole): HTMLDivElement;

export function setHydrationState(
  element: Element | null | undefined,
  state: HydrationState,
  options?: { label?: string; message?: string },
): boolean;

export function hydrateHost<T>(
  host: Element | null | undefined,
  options?: {
    load?: () => T | Promise<T>;
    render?: (data: T, host: Element) => Node | string | Array<Node | string> | null | undefined | Promise<Node | string | Array<Node | string> | null | undefined>;
    source?: string;
    onError?: (error: unknown, host: Element) => void;
    fallbackLabel?: string;
  },
): Promise<{ ok: boolean; value: T | null; error: unknown }>;

export function createJsonFeedLoader<T>(
  url: string,
  fallbackValue: T,
  options?: { source?: string; cache?: RequestCache; silent?: boolean },
): (() => Promise<T>) & {
  getLastError: () => unknown;
  reset: () => void;
};

export const SPW_DOM_RENDER_CONTRACT: Readonly<{
  hydrationStates: readonly string[];
  skeletonRoles: readonly string[];
  portableUse: string;
}>;