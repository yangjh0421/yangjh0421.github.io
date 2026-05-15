# PaperLens（Microsoft Edge Manifest V3 插件）

PaperLens 是一个本地运行的浏览器插件原型，面向论文阅读场景：
- 一键解析当前论文页面。
- 提取结构化字段：
  - research question
  - method
  - data / sample / experiment setup
  - results
  - limitations
  - evidence snippets
- 在右侧 Side Panel 展示卡片结果。
- 支持保存到 `chrome.storage.local`。
- 支持复制为 Markdown。

> 第一版不接后端、不调用任何外部 API，全部逻辑在本地完成。

---

## 目录结构

```text
paperlens/
  manifest.json
  background.js
  content.js
  parser.js
  popup.html
  popup.js
  popup.css
  sidepanel.html
  sidepanel.js
  sidepanel.css
  options.html
  options.js
  README.md
```

---

## 解析逻辑说明

1. **popup 触发解析**：点击“解析当前页面”后，向当前标签页发送消息。
2. **content script 抽取文本**：读取论文页面主文本与元信息（title/url）。
3. **parser 解析结构化字段**：
   - 优先识别 `arXiv abstract` 页面（如 `https://arxiv.org/abs/...`）。
   - 若非 arXiv，使用通用规则：按章节标题 + 关键词提取。
4. **保存与展示**：结果保存到 `chrome.storage.local`，并在 Side Panel 渲染卡片。

---

## 在 Microsoft Edge 本地加载（开发者模式）

1. 打开 Edge，访问：`edge://extensions/`
2. 打开右上角 **开发人员模式**。
3. 点击 **加载解压缩的扩展**。
4. 选择本项目中的 `paperlens/` 目录。
5. 加载成功后，将 PaperLens 固定到工具栏（可选）。

---

## 本地测试步骤

1. 打开一个论文页面（建议先测 arXiv abstract 页面，例如 `https://arxiv.org/abs/1706.03762`）。
2. 点击工具栏中的 **PaperLens** 图标，打开 popup。
3. 点击 **解析当前页面**。
4. 若开启自动打开侧栏，会直接展示结果；否则点击 **打开侧边面板**。
5. 在 side panel 中检查：
   - 五个核心字段是否有文本。
   - “证据片段”是否列出命中句子。
6. 点击 **复制为 Markdown**，粘贴到本地编辑器，确认格式正确。
7. 打开插件设置页（popup 中“设置”），修改“解析后自动打开侧边面板”后重试。

---

## 备注

- 本版本采用启发式关键词与章节匹配，适合快速原型验证。
- 不同站点 DOM 结构差异大，后续可继续增强站点适配与规则准确率。
