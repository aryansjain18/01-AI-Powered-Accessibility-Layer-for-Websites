import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_TEXT_LENGTH, ERROR_CODES, ERROR_HTTP_STATUS, validateProcessRequest } from '../contracts/api';

const source = { type: 'selection' as const, pageTitle: 'Photosynthesis' };

test('simplify: valid request accepted and text trimmed', () => {
  const r = validateProcessRequest({ action: 'simplify', text: '  Plants make food.  ', source });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.value.text, 'Plants make food.');
});

test('explain: valid request accepted', () => {
  assert.equal(validateProcessRequest({ action: 'explain', text: 'Chlorophyll absorbs light.', source }).ok, true);
});

test('steps: valid request accepted', () => {
  assert.equal(validateProcessRequest({ action: 'steps', text: 'Boil water. Add tea leaves.', source }).ok, true);
});

test('translate: targetLanguage is required', () => {
  const r = validateProcessRequest({ action: 'translate', text: 'Hello', source });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.code, 'INVALID_INPUT');
});

test('translate: en, hi, kn accepted', () => {
  for (const lang of ['en', 'hi', 'kn'] as const) {
    assert.equal(validateProcessRequest({ action: 'translate', text: 'Hello', source, targetLanguage: lang }).ok, true);
  }
});

test('unsupported language returns UNSUPPORTED_LANGUAGE', () => {
  const r = validateProcessRequest({ action: 'translate', text: 'Hello', source, targetLanguage: 'fr' });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.code, 'UNSUPPORTED_LANGUAGE');
});

test('empty or whitespace-only text rejected', () => {
  for (const text of ['', '   ', '\n\t']) {
    const r = validateProcessRequest({ action: 'simplify', text, source });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.code, 'INVALID_INPUT');
  }
});

test('invalid action rejected', () => {
  const r = validateProcessRequest({ action: 'summarize', text: 'Hello', source });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.code, 'INVALID_INPUT');
});

test('oversized text returns TEXT_TOO_LONG', () => {
  const r = validateProcessRequest({ action: 'simplify', text: 'a'.repeat(MAX_TEXT_LENGTH + 1), source });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.code, 'TEXT_TOO_LONG');
});

test('text exactly at limit accepted', () => {
  assert.equal(validateProcessRequest({ action: 'simplify', text: 'a'.repeat(MAX_TEXT_LENGTH), source }).ok, true);
});

test('missing or malformed source rejected', () => {
  assert.equal(validateProcessRequest({ action: 'simplify', text: 'Hello' }).ok, false);
  assert.equal(validateProcessRequest({ action: 'simplify', text: 'Hello', source: { type: 'pdf' } }).ok, false);
});

test('non-object bodies rejected', () => {
  for (const body of [null, undefined, [], 'text', 42]) {
    assert.equal(validateProcessRequest(body).ok, false);
  }
});

test('every error code has an HTTP status; INTERNAL_ERROR is 500', () => {
  for (const code of ERROR_CODES) assert.equal(typeof ERROR_HTTP_STATUS[code], 'number');
  assert.equal(ERROR_HTTP_STATUS.INTERNAL_ERROR, 500);
});