import {
  REQUEST_SELECTION,
  CAPTURE_SELECTION,
  SELECTION_RESULT,
  isRequestSelectionMessage,
  isCapturedSelection,
  isSupportedUrl,
  type CaptureResponse,
  type SelectionResponse,
} from '../types/messages';

const sidePanel = chrome.sidePanel as unknown as {
  open(options: { tabId?: number; windowId?: number }): Promise<void>;
};

// Disable auto-open so we can control timing and ensure panel is ready
try {
  (chrome.sidePanel as any).setPanelBehavior?.({ openPanelOnActionClick: false });
} catch (e) { /* Ignore in older Chrome versions */ }

async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function captureFromTab(tabId: number): Promise<SelectionResponse> {
  try {
    const response = (await chrome.tabs.sendMessage(tabId, {
      type: CAPTURE_SELECTION,
    })) as CaptureResponse | undefined;

    if (!response) {
      return {
        success: false,
        reason: 'INJECTION_FAILED',
        message: 'StudyLens is not running on this page yet. Reload the page and try again.',
      };
    }

    if (response.success && isCapturedSelection(response.payload)) {
      return { success: true, payload: response.payload };
    }
    
    return {
      success: false,
      reason: 'NO_SELECTION',
      message: 'No text selected. Highlight some text and click "Capture selection".',
    };
  } catch {
    return {
      success: false,
      reason: 'INJECTION_FAILED',
      message: 'Could not communicate with the page. Please reload.',
    };
  }
}

async function resolveSelection(): Promise<SelectionResponse> {
  const tab = await getActiveTab();
  
  if (!tab?.id) {
    return { success: false, reason: 'NO_ACTIVE_TAB', message: 'No active tab found.' };
  }
  
  if (!isSupportedUrl(tab.url)) {
    return {
      success: false,
      reason: 'UNSUPPORTED_PAGE',
      message: 'StudyLens cannot read browser internal pages or the Web Store. Open a normal webpage.',
    };
  }
  
  return captureFromTab(tab.id);
}

// Toolbar Click Handler
chrome.action.onClicked.addListener((tab) => {
  const windowId = tab.windowId;
  
  void (async () => {
    try {
      // 1. Open Panel First
      await sidePanel.open({ windowId });
      
      // 2. Wait briefly for React to mount listeners
      await new Promise(r => setTimeout(r, 300));
      
      // 3. Capture and Push Result
      const result = await resolveSelection();
      chrome.runtime.sendMessage({ type: SELECTION_RESULT, result }, () => {
        void chrome.runtime.lastError; // Safe to ignore if panel isn't ready
      });
      
    } catch (error) {
      console.error('[StudyLens BG] Failed to open side panel', error);
    }
  })();
});

// Explicit Request Handler (for "Capture selection" button)
chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse: (response: SelectionResponse) => void) => {
    if (!isRequestSelectionMessage(message)) return false;

    void resolveSelection().then((result) => {
      sendResponse(result);
    });
    
    return true; // Keep port open for async response
  }
);