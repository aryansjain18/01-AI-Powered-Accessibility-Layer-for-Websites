import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isRequestSelectionMessage,
  isCaptureSelectionMessage,
  isCapturedSelection,
  isSupportedUrl,
} from './messages';

describe('message guards', () => {
  it('accepts REQUEST_SELECTION', () => {
    assert.ok(isRequestSelectionMessage({ type: 'REQUEST_SELECTION' }));
  });

  it('rejects wrong request type', () => {
    assert.equal(isRequestSelectionMessage({ type: 'X' }), false);
  });

  it('rejects non-object request values', () => {
    for (const v of [null, undefined, 'str', 42]) {
      assert.equal(isRequestSelectionMessage(v), false);
    }
  });

  it('accepts CAPTURE_SELECTION', () => {
    assert.ok(isCaptureSelectionMessage({ type: 'CAPTURE_SELECTION' }));
  });

  it('rejects wrong capture type', () => {
    assert.equal(isCaptureSelectionMessage({ type: 'X' }), false);
  });

  const valid = {
    text: 'x',
    source: { type: 'selection', pageTitle: 'T', pageUrl: 'https://t', truncated: false },
  };

  it('accepts a valid captured payload', () => {
    assert.ok(isCapturedSelection(valid));
  });

  it('rejects empty text', () => {
    assert.equal(isCapturedSelection({ ...valid, text: '' }), false);
  });

  it('rejects wrong source type', () => {
    assert.equal(isCapturedSelection({ ...valid, source: { type: 'page' } }), false);
  });

  it('rejects non-object payloads', () => {
    for (const v of [null, undefined]) assert.equal(isCapturedSelection(v), false);
  });

  it('supports http, https and file URLs', () => {
    assert.ok(isSupportedUrl('https://e.com'));
    assert.ok(isSupportedUrl('http://e.com'));
    assert.ok(isSupportedUrl('file:///a.html'));
  });

  it('rejects browser internal pages and undefined', () => {
    assert.equal(isSupportedUrl('chrome://extensions'), false);
    assert.equal(isSupportedUrl('vivaldi://extensions'), false);
    assert.equal(isSupportedUrl(undefined), false);
  });
});