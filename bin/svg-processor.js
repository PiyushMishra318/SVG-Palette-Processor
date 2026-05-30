#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { processSvgFile } = require('../src/svg-processor');

function printUsage() {
  console.log(`Usage: svg-processor <input.svg> [options]

Extract fills, strokes, and gradient stops from an SVG and rewrite solid
colors as reusable gradient definitions for design tooling workflows.

Options:
  -o, --output-svg <path>   Output SVG (default: updated_svg.svg)
  -j, --output-json <path>  Palette JSON (default: svg_json.json)
  -h, --help                Show help
`);
}

function parseArgs(argv) {
  const args = { input: null, outputSvg: 'updated_svg.svg', outputJson: 'svg_json.json' };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      printUsage();
      process.exit(0);
    }
    if ((arg === '-o' || arg === '--output-svg') && argv[i + 1]) {
      args.outputSvg = argv[++i];
      continue;
    }
    if ((arg === '-j' || arg === '--output-json') && argv[i + 1]) {
      args.outputJson = argv[++i];
      continue;
    }
    if (!args.input) {
      args.input = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  if (!args.input) {
    throw new Error('Input SVG path is required');
  }

  return args;
}

function main() {
  try {
    const args = parseArgs(process.argv);
    const inputPath = path.resolve(args.input);

    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    const result = processSvgFile(inputPath);
    fs.writeFileSync(args.outputSvg, result.svg, 'utf8');
    fs.writeFileSync(args.outputJson, JSON.stringify(result.palette, null, 2), 'utf8');

    console.log(JSON.stringify({
      outputSvg: path.resolve(args.outputSvg),
      outputJson: path.resolve(args.outputJson),
      fillCount: Object.keys(result.palette.fills).length,
      strokeCount: Object.keys(result.palette.strokes).length,
      gradientCount: Object.keys(result.palette.gradients).length,
    }, null, 2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
