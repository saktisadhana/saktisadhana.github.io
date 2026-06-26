// Renders the brand favicon SVG to a high-res transparent PNG.
// Used by generate_icons.py to build the raster favicon set.
// Run from the project root: node tools/render_svg.js
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const svg = fs.readFileSync(path.join(__dirname, '..', 'assets', 'favicon.svg'));
const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 600 } });
const png = resvg.render().asPng();
fs.writeFileSync(path.join(__dirname, '_logo.png'), png);
console.log('wrote tools/_logo.png');
