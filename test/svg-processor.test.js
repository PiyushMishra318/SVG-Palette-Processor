const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { processSvgFile, convertToRGBA } = require('../src/svg-processor');

const fixture = path.join(__dirname, '../fixtures/input.svg');

test('convertToRGBA normalizes colors', () => {
  const rgba = convertToRGBA('#ff0000');
  assert.equal(rgba.r, 255);
  assert.equal(rgba.g, 0);
  assert.equal(rgba.b, 0);
  assert.equal(rgba.a, 1);
});

test('processSvgFile extracts palette and rewrites svg', () => {
  const result = processSvgFile(fixture);
  assert.ok(result.svg.includes('<svg'));
  assert.ok(result.svg.includes('generated_def'));
  assert.ok(Object.keys(result.palette.fills).length > 0);
  assert.ok(Object.keys(result.palette.gradients).length > 0);
});
