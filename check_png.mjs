import fs from 'fs';
import path from 'path';

function checkPng(filePath) {
  const buffer = fs.readFileSync(filePath);
  // Just print the first 100 bytes to see if it's a valid PNG and maybe look at the size
  console.log(`File: ${path.basename(filePath)}, Size: ${buffer.length} bytes`);
  
  // A completely blank 2880x1800 PNG is usually very small (e.g., < 10KB).
  // If it's 25KB, it has structure.
}

checkPng('./scripts/captures/frame-card--desktop--region.png');
