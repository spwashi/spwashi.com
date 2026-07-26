export type TemplateRenderOptions = {
  sourceLabel?: string;
};

export type TemplateRenderResult = {
  output: string;
  vars: Record<string, string>;
  warnings: string[];
  /** Wall milliseconds for this render (includes partial I/O). */
  ms?: number;
};

export type TemplateStats = {
  renders: number;
  passthrough: number;
  includes: number;
  partialHits: number;
  partialMisses: number;
  renderMs: number;
  partialCacheSize: number;
};

export function renderTemplate(
  source: string,
  options?: TemplateRenderOptions,
): Promise<TemplateRenderResult>;

export function renderTemplateFile(absPath: string): Promise<TemplateRenderResult>;

export function clearTemplatePartialCache(): void;

export function getTemplateStats(): TemplateStats;

export function resetTemplateStats(): void;

export const TEMPLATE_INTERNALS: {
  PARTIALS_DIR: string;
  SPW_PAGE_RE: RegExp;
  SPW_INCLUDE_RE: RegExp;
  SPW_SITE_HEAD_RE: RegExp;
  SPW_SITE_HEADER_RE: RegExp;
  SPW_SITE_FOOTER_RE: RegExp;
  VAR_RE: RegExp;
};
