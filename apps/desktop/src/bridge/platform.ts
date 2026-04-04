export async function copyTextToClipboard(text: string): Promise<void> {
  const normalized = text ?? "";

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(normalized);
      return;
    } catch {
      // Fallback to execCommand for non-secure contexts (e.g. http://192.168.x.x)
    }
  }

  if (copyWithExecCommand(normalized)) {
    return;
  }

  const insecureHint = window.isSecureContext
    ? ""
    : "（当前为非安全上下文，局域网 http 地址下浏览器可能限制剪贴板）";
  throw new Error(`复制失败，请手动复制${insecureHint}`);
}

export async function triggerFileDownload(url: string, fileName: string): Promise<void> {
  const normalizedUrl = url?.trim();
  if (!normalizedUrl) {
    throw new Error(`无法打开下载链接: ${fileName}`);
  }

  try {
    const anchor = document.createElement("a");
    anchor.href = normalizedUrl;
    anchor.download = fileName || "";
    anchor.rel = "noopener";
    anchor.style.display = "none";

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    return;
  } catch {
    try {
      window.location.assign(normalizedUrl);
      return;
    } catch {
      throw new Error(`无法打开下载链接: ${fileName}`);
    }
  }
}

function copyWithExecCommand(text: string): boolean {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}
