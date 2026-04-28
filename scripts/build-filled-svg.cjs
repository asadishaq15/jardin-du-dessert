/**
 * Generates public/logo-filled.svg from public/new_log_img.svg.
 *
 * Strategy:
 *  - Skip path 0 (the black background compound path that masks the cactus).
 *  - Keep every other path with its ORIGINAL fill color.
 *  - Crop viewBox to the cactus area only.
 */
const fs   = require('fs');
const path = require('path');

const src  = fs.readFileSync(path.join(__dirname, '../public/new_log_img.svg'), 'utf8');

// Split on <path fill= to get each raw path block
const blocks = src.split('<path fill="').slice(1);

const paths = blocks.map((block) => {
  const fillMatch = block.match(/^(#[0-9A-Fa-f]+)"/);
  const dMatch    = block.match(/d="([\s\S]*?)"\s*\/>/);
  if (!fillMatch || !dMatch) return null;
  return { fill: fillMatch[1], d: dMatch[1].trim() };
}).filter(Boolean);

console.log('Total paths found:', paths.length);

// Path 0 is the black compound background — skip it.
// Also skip any remaining black (#000000) overlay/shadow paths.
const cactusColorPaths = paths.slice(1).filter((p) => p.fill !== '#000000');

// Map original fill colors to named CSS variables / hex
// #99542D → dark copper, #D99D69 → light copper, #000000 → dark detail
function colorForFill(hex) {
  if (hex === '#99542D') return '#99542D';
  if (hex === '#D99D69') return '#D99D69';
  return hex;
}

const pathElems = cactusColorPaths.map(({ fill, d }) =>
  `  <path fill="${colorForFill(fill)}" stroke="none" d="${d}"/>`
).join('\n');

const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="700 680 620 820" role="img" aria-label="Jardin du Desert mark">
${pathElems}
</svg>`;

const dest = path.join(__dirname, '../public/logo-filled.svg');
fs.writeFileSync(dest, out);
console.log('Written', dest);
console.log('Paths written:', cactusColorPaths.length);
