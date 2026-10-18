import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recommendationForRule } from '../lib/recommendations.ts';

test('color contrast recommendations are actionable without claiming verification', () => {
  const text = recommendationForRule('color-contrast');
  assert.match(text, /contrast ratio/);
  assert.match(text, /focus/);
  assert.doesNotMatch(text, /guarantee|certified/i);
});

test('unknown rules have a safe non-fabricated fallback', () => {
  const text = recommendationForRule('a-new-unknown-axe-rule');
  assert.match(text, /affected element/);
  assert.match(text, /rule documentation/);
});

test('missing labels have concrete remediation guidance', () => {
  assert.match(recommendationForRule('label'), /visible label/);
});
