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
