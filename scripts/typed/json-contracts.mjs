import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(ROOT_DIR, 'public/data');
const JSON_CONTRACTS = [
    'promo-wonder-cycle.json',
    'media-focus.json',
];
function relativeRepoPath(absolutePath) {
    return path.relative(ROOT_DIR, absolutePath).split(path.sep).join('/');
}
async function loadJsonValidators() {
    const modulePath = path.join(ROOT_DIR, 'public/js/typed/json-feeds.js');
    return import(pathToFileURL(modulePath).href);
}
export async function collectJsonContractReport() {
    const { formatJsonIssues, parseJsonValue, validateMediaPublishingConfig, validatePromoWonderFeed, } = await loadJsonValidators();
    const validators = new Map([
        ['promo-wonder-cycle.json', validatePromoWonderFeed],
        ['media-focus.json', validateMediaPublishingConfig],
    ]);
    const errors = [];
    const warnings = [];
    let checked = 0;
    for (const file of JSON_CONTRACTS) {
        const absolutePath = path.join(DATA_DIR, file);
        const label = relativeRepoPath(absolutePath);
        let source = '';
        try {
            source = await fs.readFile(absolutePath, 'utf8');
        }
        catch (error) {
            if (error?.code === 'ENOENT') {
                errors.push(`[json] missing feed file: ${label}`);
                continue;
            }
            throw error;
        }
        checked += 1;
        let parsed;
        try {
            parsed = parseJsonValue(source, label);
        }
        catch (error) {
            errors.push(`[json] ${label}: ${error instanceof Error ? error.message : String(error)}`);
            continue;
        }
        const validate = validators.get(file);
        if (!validate) {
            errors.push(`[json] missing validator for ${label}`);
            continue;
        }
        const result = validate(parsed);
        if (!result.ok) {
            for (const issue of formatJsonIssues(result.issues)) {
                errors.push(`[json] ${label}: ${issue}`);
            }
        }
    }
    return { checked, errors, warnings };
}
export async function main() {
    const report = await collectJsonContractReport();
    console.log(`[json] checked=${report.checked} errors=${report.errors.length}`);
    if (report.warnings.length) {
        for (const warning of report.warnings) {
            console.log(`  warn: ${warning}`);
        }
    }
    if (report.errors.length) {
        for (const error of report.errors.slice(0, 24)) {
            console.log(`  error: ${error}`);
        }
        if (report.errors.length > 24) {
            console.log(`  ... ${report.errors.length - 24} more json errors`);
        }
        process.exit(1);
    }
    console.log('[json] passed');
}
