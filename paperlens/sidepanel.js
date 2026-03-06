const cardsEl = document.getElementById("cards");
const metaEl = document.getElementById("meta");
const template = document.getElementById("cardTpl");
const copyBtn = document.getElementById("copyBtn");
const refreshBtn = document.getElementById("refreshBtn");

let currentData = null;

const fields = [
  ["researchQuestion", "Research Question"],
  ["method", "Method"],
  ["dataSetup", "Data / Sample / Experiment Setup"],
  ["results", "Results"],
  ["limitations", "Limitations"]
];

function renderCards(data) {
  cardsEl.innerHTML = "";

  for (const [key, title] of fields) {
    const node = template.content.cloneNode(true);
    node.querySelector("h2").textContent = title;
    node.querySelector(".content").textContent = data[key] || "未提取到内容";

    const ul = node.querySelector(".evidence");
    const snippets = data.evidenceSnippets?.[key] || [];
    if (!snippets.length) {
      const li = document.createElement("li");
      li.textContent = "暂无证据片段";
      ul.appendChild(li);
    } else {
      snippets.forEach((snippet) => {
        const li = document.createElement("li");
        li.textContent = snippet;
        ul.appendChild(li);
      });
    }

    cardsEl.appendChild(node);
  }
}

function toMarkdown(data) {
  const lines = [
    `# ${data.title || "未命名论文"}`,
    "",
    `- 来源类型：${data.sourceType || "unknown"}`,
    `- 页面链接：${data.pageUrl || ""}`,
    `- 解析时间：${data.parsedAt || ""}`,
    ""
  ];

  for (const [key, title] of fields) {
    lines.push(`## ${title}`);
    lines.push(data[key] || "未提取到内容", "");

    const snippets = data.evidenceSnippets?.[key] || [];
    lines.push("**Evidence snippets**");
    if (!snippets.length) {
      lines.push("- 暂无证据片段", "");
    } else {
      snippets.forEach((item) => lines.push(`- ${item}`));
      lines.push("");
    }
  }

  return lines.join("\n");
}

async function copyMarkdown() {
  if (!currentData) return;
  const md = toMarkdown(currentData);
  try {
    await navigator.clipboard.writeText(md);
    copyBtn.textContent = "已复制";
    setTimeout(() => (copyBtn.textContent = "复制为 Markdown"), 1000);
  } catch (error) {
    copyBtn.textContent = "复制失败";
    setTimeout(() => (copyBtn.textContent = "复制为 Markdown"), 1000);
  }
}

async function loadData() {
  const { paperlensLastResult, paperlensUpdatedAt } = await chrome.storage.local.get([
    "paperlensLastResult",
    "paperlensUpdatedAt"
  ]);

  currentData = paperlensLastResult;

  if (!currentData) {
    metaEl.textContent = "暂无解析结果，请先在弹窗中点击“解析当前页面”。";
    cardsEl.innerHTML = "";
    return;
  }

  const time = paperlensUpdatedAt ? new Date(paperlensUpdatedAt).toLocaleString() : "未知";
  metaEl.innerHTML = `<strong>${currentData.title || "未命名论文"}</strong><br/>上次更新：${time}<br/>来源：${currentData.sourceType || "unknown"}`;
  renderCards(currentData);
}

copyBtn.addEventListener("click", copyMarkdown);
refreshBtn.addEventListener("click", loadData);
loadData();
