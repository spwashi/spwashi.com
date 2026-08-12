export const DEFAULT_COPY_CONCURRENCY = 8;
export const DEFAULT_COPY_PROGRESS_INTERVAL = 100;

export type BuildOptions = {
  outDir: string;
  clean: boolean;
  imageCheck: boolean;
  sitemap: boolean;
  catalog: boolean;
  fingerprintAssets: boolean;
  /** Per-file minify of dist/public/js via rolldown (preserves module URLs). */
  minifyJs: boolean;
  local: boolean;
  quiet: boolean;
  copyConcurrency: number;
  progressInterval: number;
  help?: boolean;
};

export type BuildLogger = {
  info(message: string): void;
  warn(message: string): void;
};

export type CopyResult = 'rendered' | 'copied' | 'symlinked' | 'skipped-directory' | 'skipped-missing' | 'skipped-special';

export type CopyStats = {
  copied: number;
  rendered: number;
  symlinked: number;
  skipped: number;
  /** Template renderer wall ms (from getTemplateStats). */
  templateMs?: number;
  /** Partial cache hits during HTML render. */
  templatePartialHits?: number;
  /** Partial cache misses during HTML render. */
  templatePartialMisses?: number;
  /** Include expansions during HTML render. */
  templateIncludes?: number;
};
