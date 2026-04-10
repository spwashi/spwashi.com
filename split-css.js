const fs = require('fs');

const css = fs.readFileSync('public/css/style.css', 'utf8');
const lines = css.split('\n');

const layers = {};
let currentLayer = null;
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (currentLayer) {
    // track braces
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    
    braceCount += openBraces - closeBraces;
    
    if (braceCount === 0) {
      // End of layer
      currentLayer = null;
    } else {
      layers[currentLayer].push(line);
    }
  } else {
    const match = line.match(/^@layer\s+([a-z]+)\s*\{/);
    if (match) {
      currentLayer = match[1];
      if (!layers[currentLayer]) layers[currentLayer] = [];
      braceCount = 1;
    }
  }
}

// Write layer files
for (const [layer, content] of Object.entries(layers)) {
  const fileName = `public/css/spw-${layer}.css`;
  let existing = '';
  if (fs.existsSync(fileName)) {
    existing = fs.readFileSync(fileName, 'utf8') + '\n\n';
  }
  fs.writeFileSync(fileName, existing + content.join('\n'));
}

console.log("Extracted layers:", Object.keys(layers).join(', '));
