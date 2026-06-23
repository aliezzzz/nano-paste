import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("go", go);
hljs.registerLanguage("java", java);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("python", python);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("yaml", yaml);

const aliases: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  shell: "bash",
  sh: "bash",
  html: "xml",
  yml: "yaml",
};

export function highlightCode(code: string, language?: string): { html: string; language?: string } {
  const normalized = normalizeLanguage(language);
  if (normalized && hljs.getLanguage(normalized)) {
    const result = hljs.highlight(code, { language: normalized, ignoreIllegals: true });
    return { html: result.value, language: normalized };
  }

  const result = hljs.highlightAuto(code);
  return { html: result.value, language: result.language };
}

function normalizeLanguage(language?: string): string {
  const raw = language?.trim().toLowerCase() ?? "";
  return aliases[raw] ?? raw;
}
