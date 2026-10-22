// Automatische Tests für js/calc.js. Ausführen mit: npm test  (oder: node --test tests/)
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('Testumgebung läuft', () => {
  assert.equal(1 + 1, 2);
});
