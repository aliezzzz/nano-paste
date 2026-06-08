import { describe, expect, it } from "vitest";
import { escapeHtml, formatBytes } from "./format";

describe("formatBytes", () => {
  it("formats byte, KB and MB values", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(2 * 1024 * 1024)).toBe("2.0 MB");
  });
});

describe("escapeHtml", () => {
  it("escapes dangerous html characters", () => {
    expect(escapeHtml(`<script a="1">'x'&</script>`)).toBe("&lt;script a=&quot;1&quot;&gt;&#39;x&#39;&amp;&lt;/script&gt;");
  });
});
