const fs = require('fs');
const path = require('path');

const svg = fs.readFileSync(path.join(__dirname, '../public/new_log_img.svg'), 'utf8');

// Split into path blocks by <path fill=
const blocks = svg.split('<path fill="').slice(1);
const paths = blocks.map(block => {
  const fillMatch = block.match(/^(#[0-9A-Fa-f]+)"/);
  const dMatch = block.match(/d="([\s\S]*?)"/);
  if (!fillMatch || !dMatch) return null;
  return { fill: fillMatch[1], d: dMatch[1].trim() };
}).filter(Boolean);

console.log('Extracted', paths.length, 'paths');

// Path 0 is the black background compound path.
// It contains two sub-paths: the outer rectangle (M1078...) and the cactus interior outline (M772...)
// We want just the cactus interior outline for the draw animation.
const bgPath = paths[0].d;
const secondMIdx = bgPath.indexOf('\nM', 1);
const cactusOutline = secondMIdx !== -1 ? bgPath.substring(secondMIdx + 1).trim() : '';
console.log('Cactus outline starts:', cactusOutline.substring(0, 60));

// Build the draw SVG
let pathElems = '';
// Main cactus silhouette outline
if (cactusOutline) {
  pathElems += '  <path class="dl-0" stroke-width="8" d="' + cactusOutline + ' z"/>\n';
}
// Colored detail paths (each one is a shape detail inside the cactus)
paths.slice(1).forEach((p, i) => {
  const sw = i < 3 ? '6' : '4';
  pathElems += '  <path class="dl-' + (i + 1) + '" stroke-width="' + sw + '" d="' + p.d + ' z"/>\n';
});

const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="700 680 620 820" role="img" aria-label="Jardin du Desert mark">
  <defs>
    <linearGradient id="cg" x1="850" y1="680" x2="1300" y2="1500" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#F2C58C"/>
      <stop offset="50%"  stop-color="#D68B51"/>
      <stop offset="100%" stop-color="#99542D"/>
    </linearGradient>
  </defs>
  <g fill="none" stroke="url(#cg)" stroke-linecap="round" stroke-linejoin="round">
${pathElems}  </g>
</svg>`;

fs.writeFileSync(path.join(__dirname, '../public/logo-draw.svg'), out);
console.log('Written public/logo-draw.svg');
