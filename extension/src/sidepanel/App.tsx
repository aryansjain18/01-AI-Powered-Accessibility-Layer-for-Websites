import { useCallback, useEffect, useState } from 'react';
import {
  REQUEST_SELECTION,
  isCapturedSelection,
  type CapturedSelection,
  type SelectionResponse,
} from '../types/messages';
import './App.css';

type Status = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

export default function App() {
  const [status, setStatus] = useState<Status>('idle');
  const [selection, setSelection] = useState<CapturedSelection | null>(null);
  const [notice, setNotice] = useState<string>('Select text on a webpage to start learning.');

  const applyResult = useCallback((result: SelectionResponse) => {
    if (result.success && isCapturedSelection(result.payload)) {
      setSelection(result.payload);
      setStatus('ready');
      setNotice('');
    } else {
      const errorResult = result as Extract<SelectionResponse, { success: false }>;
      setSelection(null);
      setStatus(errorResult.reason === 'NO_SELECTION' ? 'empty' : 'error');
      setNotice(errorResult.message);
    }
  }, []);

  const requestSelection = useCallback(() => {
    setStatus('loading');
    chrome.runtime.sendMessage({ type: REQUEST_SELECTION }, (response: SelectionResponse) => {
      if (chrome.runtime.lastError || !response) {
        setStatus('error');
        setNotice('Could not reach the StudyLens background worker. Reload the extension.');
        return;
      }
      applyResult(response);
    });
  }, [applyResult]);

  useEffect(() => {
    // Listen for push updates from background (e.g., after toolbar click)
    const listener = (message: unknown) => {
      const m = message as { type?: string; result?: SelectionResponse };
      if (m?.type === 'SELECTION_RESULT' && m.result) applyResult(m.result);
    };
    chrome.runtime.onMessage.addListener(listener);
    
    // Auto-capture on mount
    requestSelection();
    
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [applyResult, requestSelection]);

  return (
    <div className="sl-container">
      <header className="sl-header">
        <span className="sl-logo" aria-hidden="true">◎</span>
        <h1>StudyLens</h1>
      </header>

      {/* Primary Action Button - Always visible for retries */}
      <button 
        className="sl-primary" 
        onClick={requestSelection} 
        disabled={status === 'loading'}
        aria-label="Capture current text selection"
      >
        {status === 'loading' ? 'Capturing…' : 'Capture selection'}
      </button>

      {/* Status Messages */}
      {status === 'loading' && (
        <p className="sl-status" role="status">Reading your selection…</p>
      )}

      {(status === 'empty' || status === 'error' || status === 'idle') && (
        <p className={status === 'error' ? 'sl-status sl-error' : 'sl-status'} role="status">
          {notice}
        </p>
      )}

      {/* Success State */}
      {status === 'ready' && selection && (
        <section className="sl-card" aria-label="Selected text">
          <div className="sl-meta">
            <span className="sl-badge">Selected text</span>
            <span className="sl-title" title={selection.source.pageTitle}>
              {selection.source.pageTitle}
            </span>
          </div>
          
          {selection.source.truncated && (
            <p className="sl-warn">Text was shortened to fit the 5000-character limit.</p>
          )}
          
          {/* Plain text only. Never innerHTML. */}
          <div className="sl-text">{selection.text}</div>
          
          <div className="sl-actions">
            <span className="sl-count">{selection.text.length} characters</span>
            <button
              className="sl-secondary"
              onClick={() => {
                setSelection(null);
                setStatus('empty');
                setNotice('Selection cleared. Select new text and capture again.');
              }}
              aria-label="Clear current selection"
            >
              Clear selection
            </button>
          </div>
        </section>
      )}
    </div>
  );
}