import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();
const EXCLUDED_DIRS = new Set(['node_modules', '.git', 'dist', 'dist-vite', '.spw']);

const OPERATOR_PREFIXES = ['#>', '#:', '#', '.', '^', '~', '?', '@', '*', '&', '=', '$', '%', '!', '>', '<', '(', '[', '{'];
const INLINE_PAYLOAD_OPERATORS = new Set(['#', '?']);
const CONTAINER_START = new Set(['[', '{', '(', '<']);

function decodeEntities(str) {
  return str.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
}

function categorize(text) {
  text = text.trim();
  
  let matchedPrefix = null;
  for (const prefix of OPERATOR_PREFIXES) {
    if (text.startsWith(prefix)) {
      matchedPrefix = prefix;
      break;
    }
  }
  
  if (!matchedPrefix) {
    return 'no-sigil';
  }
  
  if (CONTAINER_START.has(matchedPrefix)) {
    return 'container';
  }
  
  const rest = text.slice(matchedPrefix.length);
  
  if (rest.length > 0 && (rest[0] === ' ' || rest[0] === '\t')) {
    if (INLINE_PAYLOAD_OPERATORS.has(matchedPrefix)) {
      return 'inline-payload';
    } else {
      return 'spaced-violation';
    }
  }
  
  return 'tight';
}

function findHtmlFiles(dir, fileList = []) {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (err) {
    return fileList;
  }
  
  for (const file of files) {
    if (EXCLUDED_DIRS.has(file)) continue;
    const filePath = path.join(dir, file);
    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch (err) {
      continue;
    }
    
    if (stat.isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else if (filePath.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function runAudit() {
  const htmlFiles = findHtmlFiles(PROJECT_ROOT);
  const regex = /<([a-zA-Z0-9-]+)[^>]*\bclass=["'][^"']*\boperator-chip\b[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi;
  
  let violations = [];
  let stats = {
    tight: 0,
    'inline-payload': 0,
    container: 0,
    'spaced-violation': 0,
    'no-sigil': 0
  };
  
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = regex.exec(content)) !== null) {
      let innerHtml = match[2];
      let text = innerHtml.replace(/<[^>]+>/g, '').trim();
      text = decodeEntities(text);
      
      const category = categorize(text);
      stats[category]++;
      
      if (category === 'spaced-violation') {
        violations.push({ file, text, category });
      }
    }
  }
  
  console.log('--- Operator Chip Grammar Audit ---');
  console.log(`Scanned ${htmlFiles.length} HTML files.\n`);
  console.log('Stats:');
  console.log(`  Tight (correct):          ${stats.tight}`);
  console.log(`  Inline-payload (correct): ${stats['inline-payload']}`);
  console.log(`  Container (correct):      ${stats.container}`);
  console.log(`  Spaced-violation:         ${stats['spaced-violation']}`);
  console.log(`  No-sigil:                 ${stats['no-sigil']}\n`);
  
  if (violations.length > 0) {
    console.log(`Found ${violations.length} violation(s):`);
    for (const v of violations) {
      const relPath = path.relative(PROJECT_ROOT, v.file);
      console.log(`  ${relPath} => "${v.text}"`);
    }
    process.exit(1);
  } else {
    console.log('No violations found. Clean!');
    process.exit(0);
  }
}

runAudit();
