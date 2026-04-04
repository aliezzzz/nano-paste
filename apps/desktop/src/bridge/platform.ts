export async function copyTextToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error("当前环境不支持剪贴板写入");
  }
  await navigator.clipboard.writeText(text);
}

export async function triggerFileDownload(url: string, fileName: string): Promise<void> {
  const opened = window.open(url, "_blank", "noopener");
  if (!opened) {
    throw new Error(`无法打开下载链接: ${fileName}`);
  }
}
