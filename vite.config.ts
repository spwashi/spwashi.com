import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, type Plugin } from 'vite';

import { renderTemplate as renderTemplateRuntime } from './scripts/template.mjs';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const renderTemplate = renderTemplateRuntime as (
  source: string,
  options?: { sourceLabel?: string },
) => Promise<{ output: string; warnings: string[] }>;

function spwHtmlTemplates(): Plugin {
  return {
    name: 'spw-html-templates',
    enforce: 'pre',
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
      input: {
        home: path.resolve(rootDir, 'index.html'),
      },
    },
  },
});
