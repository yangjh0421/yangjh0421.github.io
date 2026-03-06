const autoOpenEl = document.getElementById("autoOpenSidePanel");
const maxEvidenceEl = document.getElementById("maxEvidenceSnippets");
const statusEl = document.getElementById("status");
const saveBtn = document.getElementById("saveBtn");

async function loadOptions() {
  const { paperlensOptions } = await chrome.storage.local.get("paperlensOptions");
  const options = paperlensOptions || {
    autoOpenSidePanel: true,
    maxEvidenceSnippets: 5
  };

  autoOpenEl.checked = Boolean(options.autoOpenSidePanel);
  maxEvidenceEl.value = String(options.maxEvidenceSnippets || 5);
}

async function saveOptions() {
  const options = {
    autoOpenSidePanel: autoOpenEl.checked,
    maxEvidenceSnippets: Math.min(20, Math.max(1, Number(maxEvidenceEl.value) || 5))
  };

  await chrome.storage.local.set({ paperlensOptions: options });
  statusEl.textContent = "设置已保存。";
  setTimeout(() => (statusEl.textContent = ""), 1200);
}

saveBtn.addEventListener("click", saveOptions);
loadOptions();
