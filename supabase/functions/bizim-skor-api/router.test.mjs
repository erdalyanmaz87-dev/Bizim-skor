import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveRoute } from './router.mjs';

test('GET /health resolves to health route', () => {
  assert.deepEqual(resolveRoute('GET', '/health'), { type: 'health' });
});

test('unsupported method is rejected before route lookup', () => {
  assert.deepEqual(resolveRoute('POST', '/health'), { type: 'method_not_allowed' });
});

test('unknown GET route returns not_found', () => {
  assert.deepEqual(resolveRoute('GET', '/missing'), { type: 'not_found' });
});
