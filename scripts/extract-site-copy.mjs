import fs from 'fs';
import path from 'path';

// Define the key routes and their relative paths
const routes = [
  { name: 'Home', path: 'index.html' },
  { name: 'About', path: 'about/index.html' },
  { name: 'Website', path: 'about/website/index.html' },
  { name: 'Play', path: 'play/index.html' },
  { name: 'RPG Wednesday', path: 'play/rpg-wednesday/index.html' },
  { name: 'Recipes', path: 'recipes/index.html' },
  { name: 'Fermentation', path: 'recipes/fermentation/index.html' },
  { name: 'Software', path: 'topics/software/index.html' },
  { name: 'Spw Operator', path: 'topics/software/spw/index.html' },
];

const workspaceRoot = process.cwd();

function cleanHtml(html) {
  // Simple regex to extract headings, paragraphs, and list items from <main>
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
  if (!mainMatch) return '';

  let content = mainMatch[1];
  
  // Remove scripts, styles, SVGs
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  content = content.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '');

  let markdown = [];
  const tagRegex = /<(h1|h2|h3|p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;

  while ((match = tagRegex.exec(content)) !== null) {
    const tag = match[1].toLowerCase();
    let text = match[2]
      .replace(/<[^>]+>/g, '') // strip nested HTML tags
      .replace(/\s+/g, ' ')   // normalize whitespace
      .trim();

    if (!text) continue;

    if (tag === 'h1') {
      markdown.push(`\n# ${text}\n`);
    } else if (tag === 'h2') {
      markdown.push(`\n## ${text}\n`);
    } else if (tag === 'h3') {
      markdown.push(`\n### ${text}\n`);
    } else if (tag === 'p') {
      markdown.push(`\n${text}\n`);
    } else if (tag === 'li') {
      markdown.push(`* ${text}`);
    }
  }

  return markdown.join('\n');
}

let fullMarkdown = `# spwashi.com — Consolidated Site Copy for Team Reading\n\n` +
  `*This document compiles the main narrative copy of spwashi.com to orient production and support collaborative reading.*\n\n` +
  `---\n`;

for (const route of routes) {
  const filePath = path.join(workspaceRoot, route.path);
  if (fs.existsSync(filePath)) {
    const html = fs.readFileSync(filePath, 'utf8');
    const routeCopy = cleanHtml(html);
    if (routeCopy.trim()) {
      fullMarkdown += `\n\n# Route: ${route.name} (${route.path})\n\n${routeCopy}\n\n---\n`;
    }
  }
}

const outputPath = path.join(workspaceRoot, '.agents/plans/team-orientation-reading.md');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, fullMarkdown, 'utf8');
console.log(`Successfully compiled copy to: ${outputPath}`);
