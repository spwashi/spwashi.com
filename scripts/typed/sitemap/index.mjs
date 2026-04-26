import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { renderTemplate } from '../../template.mjs';
import { buildSitemapXml, extractCanonical, isNoIndex, } from './helpers.mjs';
import { listSourceRouteFiles, } from './topology.mjs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const DEFAULT_OUT = path.join(ROOT_DIR, 'dist', 'sitemap.xml');
function relRepo(absPath) {
    return path.relative(ROOT_DIR, absPath).split(path.sep).join('/');
}
function parseOutPath(argv) {
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === '--out' && argv[index + 1])
            return path.resolve(argv[index + 1]);
        if (arg.startsWith('--out='))
            return path.resolve(arg.slice('--out='.length));
    }
    return DEFAULT_OUT;
}
async function collectUrls(routeFiles) {
    const urls = [];
    for (const repoPath of routeFiles) {
        const absPath = path.join(ROOT_DIR, repoPath);
        const source = await fs.readFile(absPath, 'utf8');
        const { output } = await renderTemplate(source, { sourceLabel: relRepo(absPath) });
        if (isNoIndex(output))
            continue;
        urls.push(extractCanonical(output, repoPath));
    }
    return [...new Set(urls)].sort((a, b) => a.localeCompare(b));
}
export async function main() {
    const outputPath = parseOutPath(process.argv.slice(2));
    const routeFiles = listSourceRouteFiles();
    const urls = await collectUrls(routeFiles);
    const xml = buildSitemapXml(urls);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, xml, 'utf8');
    console.log(`[sitemap] wrote ${relRepo(outputPath)}`);
    console.log(`[sitemap] ${urls.length} urls from ${routeFiles.length} routes`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    await main();
}
