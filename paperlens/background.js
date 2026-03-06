chrome.runtime.onInstalled.addListener(async () => {
  const defaults = {
    paperlensOptions: {
      autoOpenSidePanel: true,
      maxEvidenceSnippets: 5
    }
  };

  const current = await chrome.storage.local.get("paperlensOptions");
  if (!current.paperlensOptions) {
    await chrome.storage.local.set(defaults);
  }

  if (chrome.sidePanel?.setPanelBehavior) {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "PAPERLENS_SAVE_RESULT") {
    chrome.storage.local
      .set({ paperlensLastResult: message.payload, paperlensUpdatedAt: Date.now() })
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (message?.type === "PAPERLENS_OPEN_SIDE_PANEL") {
    const tabId = sender?.tab?.id || message.tabId;
    if (!tabId || !chrome.sidePanel?.open) {
      sendResponse({ ok: false, error: "sidePanel API 不可用" });
      return false;
    }

    chrome.sidePanel
      .open({ tabId })
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  return false;
});
