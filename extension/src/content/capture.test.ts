import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildSelection, MAX_TEXT_LENGTH } from './capture';

const T = 'Test Page';
const U = 'https://example.com/test';

describe('buildSelection', () => {
  it('captures normal text', () => {
    const r = buildSelection('Photosynthesis is a process.', T, U);
    assert.ok(r);
    assert.equal(r.text, 'Photosynthesis is a process.');
    assert.equal(r.source.type, 'selection');
    assert.equal(r.source.pageTitle, T);
    assert.equal(r.source.pageUrl, U);
    assert.equal(r.source.truncated, false);
  });

  it('trims whitespace', () => {
    const r = buildSelection('  hello  ', T, U);
    assert.ok(r);
    assert.equal(r.text, 'hello');
  });

  it('rejects empty selection', () => {
    assert.equal(buildSelection('', T, U), null);
  });

  it('rejects whitespace-only selection', () => {
    assert.equal(buildSelection('   \n\t ', T, U), null);
  });

  it('truncates text over the limit', () => {
    const r = buildSelection('a'.repeat(MAX_TEXT_LENGTH + 1), T, U);
    assert.ok(r);
    assert.equal(r.text.length, MAX_TEXT_LENGTH);
    assert.equal(r.source.truncated, true);
  });

  it('accepts text exactly at the limit', () => {
    const r = buildSelection('a'.repeat(MAX_TEXT_LENGTH), T, U);
    assert.ok(r);
    assert.equal(r.text.length, MAX_TEXT_LENGTH);
    assert.equal(r.source.truncated, false);
  });

  it('falls back when page title is missing', () => {
    const r = buildSelection('x', '', U);
    assert.ok(r);
    assert.equal(r.source.pageTitle, 'Untitled page');
  });
});