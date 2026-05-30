# SVG Palette Processor
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg)](package.json)

Parse SVG files, extract **fills**, **strokes**, and **gradient stops** into a JSON palette, and rewrite solid colors as reusable `linearGradient` definitions for design-tooling workflows.

## Features

- Normalizes fill/stroke colors to RGBA objects
- Deduplicates identical colors across elements
- Preserves existing gradient references
- Writes an updated SVG plus a structured palette JSON

## Requirements

- Node.js 18+

## Install

```bash
git clone git@github.com:PiyushMishra318/SVG_Processor.git
cd SVG_Processor
npm install
```

## CLI

```bash
node bin/svg-processor.js fixtures/input.svg
# or after npm link / npm install -g
svg-processor fixtures/input.svg -o updated_svg.svg -j svg_json.json
```

Outputs:

| File | Description |
|------|-------------|
| `updated_svg.svg` | SVG with `<defs id="generated_def">` and `url(#gradient-*)` references |
| `svg_json.json` | Palette: `fills`, `strokes`, `gradients`, `obsoleteGradients` |

## Library API

```javascript
const { processSvg, processSvgFile } = require('./src/svg-processor');

const { svg, palette } = processSvgFile('fixtures/input.svg');
// or
const result = processSvg(fs.readFileSync('input.svg', 'utf8'));
```

## Development

```bash
npm test
```

## Project layout

```text
src/
  svg-processor.js   # Core parser and rewriter
bin/
  svg-processor.js   # CLI entry point
test/
  svg-processor.test.js
fixtures/
  input.svg          # Sample SVG for tests
```

## License

MIT © 2026 [Piyush Mishra](https://github.com/PiyushMishra318)
