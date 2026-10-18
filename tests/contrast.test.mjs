import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readRGB, contrast, toHex, findAccessibleColor } from '../lib/contrast.ts';

test('WCAG relative luminance contrast for white on gray is below AA', () => {
  const white = readRGB('rgb(255, 255, 255)');
  const grey = readRGB('rgb(136, 136, 136)');
  assert(contrast(white, grey) < 4.5);
});

test('suggestion meets AA for ordinary text', () => {
  const white = readRGB('#FFFFFF');
  const grey = readRGB('rgb(136, 136, 136)');
  const improved = findAccessibleColor(grey, white, 4.5);
  assert(improved);
  assert(contrast(improved, white) >= 4.5);
  assert.notEqual(toHex(improved), '#888888');
});

test('transparent and semi-transparent backgrounds are conservatively skipped', () => {
  assert.equal(readRGB('rgba(255, 255, 255, 0)'), null);
  assert.equal(readRGB('rgba(20, 50, 40, 0.5)'), null);
});
