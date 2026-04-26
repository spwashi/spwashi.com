export type TemplateRenderOptions = {
  sourceLabel?: string;
};

export type TemplateRenderResult = {
  output: string;
  vars: Record<string, string>;
  warnings: string[];
};

export function renderTemplate(
  source: string,
  options?: TemplateRenderOptions,
): Promise<TemplateRenderResult>;

export function renderTemplateFile(absPath: string): Promise<TemplateRenderResult>;
