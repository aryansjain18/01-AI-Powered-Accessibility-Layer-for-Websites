import {
  CAPTURE_SELECTION,
  isRequestSelectionMessage,
  isCapturedSelection,
  isSupportedUrl,
  type CaptureResponse,
  type SelectionResponse,
} from '../types/messages';

const sidePanel = chrome.sidePanel as unknown as {
  open(options: { tabId?: number; windowId?: number }): Promise<void>;
  setPanelBehavior?(options: { openPanelOnActionClick: boolean }): Promise<void>;
};

sidePanel.setPanelBehavior?.({ openPanelOnActionClick: false }).catch(() => undefined);

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
        message: 'No response from the page. Reload the page and try again.',
      };
    }
    if (response.success && isCapturedSelection(response.payload)) {
      return { success: true, payload: response.payload };
    }
    return {
      success: false,
      reason: 'NO_SELECTION',
      message: 'Select text on a webpage to start learning.',
    };
  } catch {
    return {
      success: false,
      reason: 'INJECTION_FAILED',
      message: 'StudyLens is not running on this page yet. Reload the page and try again.',
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
      message: 'StudyLens cannot read browser pages or the Web Store. Open a normal webpage.',
    };
  }
  return captureFromTab(tab.id);
}

chrome.action.onClicked.addListener((tab) => {
  const windowId = tab.windowId;
  void (async () => {
    try {
      await sidePanel.open({ windowId });
    } catch (error) {
      console.error('[StudyLens bg] sidePanel.open failed', error);
      return;
    }
    const result = await resolveSelection();
    console.log('[StudyLens bg] toolbar capture:', result.success, tab.id);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await new Promise((r) => setTimeout(r, 150));
      chrome.runtime.sendMessage({ type: 'SELECTION_RESULT', result }, () => {
        void chrome.runtime.lastError;
      });
      if (result.success) break;
    }
  })();
});

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender, sendResponse: (response: SelectionResponse) => void) => {
    if (!isRequestSelectionMessage(message)) return false;

    void resolveSelection().then((result) => {
      console.log('[StudyLens bg] panel request:', result.success);
      sendResponse(result);
    });
    return true;
  }
);