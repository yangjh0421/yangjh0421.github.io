const statusEl = document.getElementById("status");
const parseBtn = document.getElementById("parseBtn");
const openPanelBtn = document.getElementById("openPanelBtn");

function setStatus(text) {
  statusEl.textContent = text;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error("未找到当前标签页");
  }
  return tab;
}

async function openPanel(tabId) {
  return chrome.runtime.sendMessage({ type: "PAPERLENS_OPEN_SIDE_PANEL", tabId });
}

async function parseCurrentPage() {
  setStatus("正在解析页面，请稍候...");
  const tab = await getActiveTab();

  const response = await chrome.tabs.sendMessage(tab.id, { type: "PAPERLENS_PARSE" });
  if (!response?.ok) {
    throw new Error(response?.error || "内容脚本返回失败");
  }

  const result = response.data;
  await chrome.runtime.sendMessage({
    type: "PAPERLENS_SAVE_RESULT",
    payload: {
      ...result,
      pageUrl: tab.url,
      parsedAt: new Date().toISOString()
    }
  });

  const { paperlensOptions } = await chrome.storage.local.get("paperlensOptions");
  const autoOpen = paperlensOptions?.autoOpenSidePanel ?? true;

  if (autoOpen) {
    await openPanel(tab.id);
  }

  setStatus(`解析完成：\n${result.title}\n\n来源：${result.sourceType}`);
}

parseBtn.addEventListener("click", async () => {
  try {
    await parseCurrentPage();
  } catch (error) {
    setStatus(`解析失败：${error.message || String(error)}`);
  }
});

openPanelBtn.addEventListener("click", async () => {
  try {
    const tab = await getActiveTab();
    const resp = await openPanel(tab.id);
    if (!resp?.ok) throw new Error(resp?.error || "无法打开侧边栏");
    setStatus("侧边面板已打开。");
  } catch (error) {
    setStatus(`打开失败：${error.message || String(error)}`);
  }
});
