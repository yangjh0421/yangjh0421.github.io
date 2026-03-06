(function initPaperLensParser(globalScope) {
  function normalizeText(input) {
    return (input || "")
      .replace(/\r/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim();
  }

  function splitSections(text) {
    const headingRegex = /\n\s*(abstract|introduction|background|related work|method(?:s|ology)?|approach|data(?:set)?|experiment(?:s|al setup)?|results?|discussion|limitations?|conclusion)\s*\n/gi;
    const sections = {};
    let match;
    let lastIndex = 0;
    let lastHeading = "full";

    while ((match = headingRegex.exec(`\n${text}\n`)) !== null) {
      const currentIndex = Math.max(0, match.index - 1);
      const chunk = text.slice(lastIndex, currentIndex).trim();
      if (chunk) {
        sections[lastHeading] = sections[lastHeading]
          ? `${sections[lastHeading]}\n\n${chunk}`
          : chunk;
      }
      lastHeading = match[1].toLowerCase();
      lastIndex = currentIndex + match[0].length - 2;
    }

    const tail = text.slice(lastIndex).trim();
    if (tail) {
      sections[lastHeading] = sections[lastHeading]
        ? `${sections[lastHeading]}\n\n${tail}`
        : tail;
    }

    if (!sections.full) {
      sections.full = text;
    }
    return sections;
  }

  function firstSentences(input, n = 2) {
    const text = normalizeText(input);
    if (!text) return "未识别到相关内容。";
    const sentences = text
      .split(/(?<=[。！？.!?])\s+|\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return sentences.slice(0, n).join(" ");
  }

  function findByKeywords(text, keywords) {
    const lines = normalizeText(text)
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    const matched = [];
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (keywords.some((kw) => lower.includes(kw))) {
        matched.push(line);
      }
      if (matched.length >= 6) break;
    }
    return matched;
  }

  function arxivSpecific(data) {
    const abstractNode = document.querySelector("blockquote.abstract, .abstract.mathjax");
    const titleNode = document.querySelector("h1.title, h1.title.mathjax");

    if (!abstractNode) return null;

    const abstractText = normalizeText(
      abstractNode.textContent.replace(/^\s*Abstract:\s*/i, "")
    );

    const rqKeywords = ["we study", "we investigate", "this paper", "we ask", "problem"];
    const methodKeywords = ["we propose", "method", "framework", "model", "approach"];
    const dataKeywords = ["dataset", "data", "benchmark", "experiment", "evaluation"];
    const resultKeywords = ["result", "improve", "outperform", "achieve", "state-of-the-art"];
    const limitationKeywords = ["limitation", "future work", "however", "challenge", "restricted"];

    const rqEvidence = findByKeywords(abstractText, rqKeywords);
    const methodEvidence = findByKeywords(abstractText, methodKeywords);
    const dataEvidence = findByKeywords(abstractText, dataKeywords);
    const resultEvidence = findByKeywords(abstractText, resultKeywords);
    const limitationEvidence = findByKeywords(abstractText, limitationKeywords);

    return {
      sourceType: "arXiv abstract",
      title: normalizeText(titleNode?.textContent || data.title || "未命名论文"),
      researchQuestion: rqEvidence[0] || firstSentences(abstractText, 1),
      method: methodEvidence[0] || firstSentences(abstractText, 2),
      dataSetup: dataEvidence[0] || "摘要中未明确提及数据集或实验设置。",
      results: resultEvidence[0] || "摘要中未明确提及关键结果。",
      limitations: limitationEvidence[0] || "摘要中未直接给出局限，可在正文中进一步确认。",
      evidenceSnippets: {
        researchQuestion: rqEvidence,
        method: methodEvidence,
        dataSetup: dataEvidence,
        results: resultEvidence,
        limitations: limitationEvidence
      }
    };
  }

  function genericParse(data) {
    const cleanText = normalizeText(data.text || "");
    const sections = splitSections(cleanText);

    const methodPool = `${sections.method || ""}\n${sections.methods || ""}\n${sections.approach || ""}`;
    const dataPool = `${sections.data || ""}\n${sections.dataset || ""}\n${sections.experiments || ""}\n${sections["experimental setup"] || ""}`;
    const resultsPool = `${sections.result || ""}\n${sections.results || ""}\n${sections.discussion || ""}`;
    const limitationsPool = `${sections.limitation || ""}\n${sections.limitations || ""}\n${sections.conclusion || ""}`;
    const rqPool = `${sections.abstract || ""}\n${sections.introduction || ""}\n${sections.full || ""}`;

    const rqEvidence = findByKeywords(rqPool, ["we study", "research question", "aim", "motivation", "problem"]);
    const methodEvidence = findByKeywords(methodPool || cleanText, ["method", "approach", "framework", "model", "algorithm"]);
    const dataEvidence = findByKeywords(dataPool || cleanText, ["dataset", "sample", "participants", "experiment", "evaluation"]);
    const resultEvidence = findByKeywords(resultsPool || cleanText, ["result", "improve", "outperform", "accuracy", "significant"]);
    const limitationEvidence = findByKeywords(limitationsPool || cleanText, ["limitation", "future work", "bias", "restricted", "threat"]);

    return {
      sourceType: "generic",
      title: normalizeText(data.title || document.title || "未命名论文"),
      researchQuestion: rqEvidence[0] || firstSentences(rqPool, 2),
      method: methodEvidence[0] || firstSentences(methodPool, 2),
      dataSetup: dataEvidence[0] || firstSentences(dataPool, 2),
      results: resultEvidence[0] || firstSentences(resultsPool, 2),
      limitations: limitationEvidence[0] || firstSentences(limitationsPool, 2),
      evidenceSnippets: {
        researchQuestion: rqEvidence,
        method: methodEvidence,
        dataSetup: dataEvidence,
        results: resultEvidence,
        limitations: limitationEvidence
      }
    };
  }

  function parsePaper(data) {
    const url = (data.url || location.href || "").toLowerCase();
    if (url.includes("arxiv.org/abs/") || document.querySelector("meta[name='citation_arxiv_id']")) {
      const arxiv = arxivSpecific(data);
      if (arxiv) return arxiv;
    }
    return genericParse(data);
  }

  globalScope.PaperLensParser = {
    parsePaper,
    normalizeText
  };
})(typeof window !== "undefined" ? window : self);
