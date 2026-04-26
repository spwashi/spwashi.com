import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, type Plugin } from 'vite';

import { renderTemplate as renderTemplateRuntime } from './scripts/template.mjs';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const ignoredSegments = new Set([
  '.agents',
  '.git',
  '.github',
  '.idea',
  '00.unsorted',
  '_partials',
  'dist',
  'dist-vite',
  'node_modules',
  'scripts',
]);
const ignoredPrefixes = [
  '.spw/_workbench',
  'design/catalog',
];
const templateDependencyPrefixes = [
  '_partials',
];
const templateDependencyFiles = new Set([
  'scripts/template.mjs',
]);
const renderTemplate = renderTemplateRuntime as (
  source: string,
  options?: { sourceLabel?: string },
) => Promise<{ output: string; warnings: string[] }>;

function toPosixPath(value: string): string {
  return value.split(path.sep).join('/');
}

function shouldIgnoreEntry(relativePath: string): boolean {
  const normalizedPath = toPosixPath(relativePath).replace(/^\/+/, '');
  if (!normalizedPath) return true;

  const segments = normalizedPath.split('/');
  if (segments.some((segment) => ignoredSegments.has(segment))) return true;
  return ignoredPrefixes.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`));
}

function isRouteHtmlFile(relativePath: string): boolean {
  const normalizedPath = toPosixPath(relativePath).replace(/^\/+/, '');
  return normalizedPath.endsWith('.html') && !shouldIgnoreEntry(normalizedPath);
}

function isTemplateDependency(relativePath: string): boolean {
  const normalizedPath = toPosixPath(relativePath).replace(/^\/+/, '');
  if (templateDependencyFiles.has(normalizedPath)) return true;
  return templateDependencyPrefixes.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`));
}

function toInputKey(relativePath: string): string {
  const normalizedPath = toPosixPath(relativePath).replace(/^\/+/, '');
  if (normalizedPath === 'index.html') return 'home';

  return normalizedPath
    .replace(/\/index\.html$/i, '')
    .replace(/\.html$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'home';
}

function collectHtmlInputs(directoryPath: string, inputs: Record<string, string> = {}): Record<string, string> {
  const entries = readdirSync(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name);
    const relativePath = path.relative(rootDir, entryPath);
    if (shouldIgnoreEntry(relativePath)) continue;

    if (entry.isDirectory()) {
      collectHtmlInputs(entryPath, inputs);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.html')) {
      inputs[toInputKey(relativePath)] = entryPath;
    }
  }

  return inputs;
}

function spwHtmlTemplates(): Plugin {
  return {
    name: 'spw-html-templates',
    enforce: 'pre',
    configureServer(server) {
      server.watcher.add(Object.values(htmlInputs));
      server.watcher.add(path.join(rootDir, '_partials'));
    },
    handleHotUpdate({ file, server }) {
      const relativePath = path.relative(rootDir, file);
      if (!isRouteHtmlFile(relativePath) && !isTemplateDependency(relativePath)) return;

      server.ws.send({
        type: 'full-reload',
        path: '*',
      });
      return [];
    },
    transformIndexHtml: {
      order: 'pre',
      async handler(html, context) {
        const sourceLabel = context.path || context.filename || '<vite>';
        const { output, warnings } = await renderTemplate(html, { sourceLabel });

        for (const warning of warnings) {
          this.warn(`[template] ${warning}`);
        }

        return output;
      },
    },
  };
}

const htmlInputs = collectHtmlInputs(rootDir);

export default defineConfig({
  root: rootDir,
  appType: 'mpa',
  publicDir: false,
  plugins: [spwHtmlTemplates()],
  server: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: false,
  },
  preview: {
    host: '127.0.0.1',
    port: 4174,
    strictPort: false,
  },
  build: {
    outDir: 'dist-vite',
    emptyOutDir: true,
    rollupOptions: {
      input: htmlInputs,
    },
  },
});
