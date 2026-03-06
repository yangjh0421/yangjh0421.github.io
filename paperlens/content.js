(function initPaperLensContent() {
  function getMainText() {
    const selectors = ["article", "main", "#content", ".content", "body"];
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      if (node && node.innerText && node.innerText.trim().length > 300) {
        return node.innerText;
      }
    }
    return document.body?.innerText || "";
  }

  function extractPaperInfo() {
    const data = {
      url: location.href,
      title: document.title,
      text: getMainText(),
      timestamp: Date.now()
    };

    if (!window.PaperLensParser) {
      throw new Error("parser.js 未加载");
    }

    return window.PaperLensParser.parsePaper(data);
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "PAPERLENS_PARSE") {
      try {
        const parsed = extractPaperInfo();
        sendResponse({ ok: true, data: parsed });
      } catch (error) {
        sendResponse({ ok: false, error: error.message || String(error) });
      }
      return true;
    }
    return false;
  });
})();
