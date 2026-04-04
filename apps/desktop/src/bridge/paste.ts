import { showToast } from "../ui/components/toast";

interface PasteDeps {
  hasSession: () => boolean;
  hasApiClient: () => boolean;
  enqueueFiles: (files: File[]) => void;
  sendText: (payload: { content: string }) => Promise<void>;
}

export async function handleGlobalPaste(event: ClipboardEvent, deps: PasteDeps): Promise<void> {
  if (event.defaultPrevented) return;
  if (isEditableTarget(event.target)) return;

  if (!deps.hasSession()) return;
  if (!deps.hasApiClient()) return;

  const clipboardData = event.clipboardData;
  if (!clipboardData) return;

  const files = Array.from(clipboardData.files || []);
  if (files.length > 0) {
    event.preventDefault();
    deps.enqueueFiles(files);
    showToast(`已粘贴并开始上传 ${files.length} 个文件`, "success");
    return;
  }

  const text = clipboardData.getData("text/plain").trim();
  if (!text) return;

  try {
    event.preventDefault();
    await deps.sendText({ content: text });
    showToast("已粘贴并发送文本", "success");
  } catch (err) {
    const message = err instanceof Error ? err.message : "未知错误";
    showToast(`粘贴处理失败: ${message}`, "error");
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element) return false;
  return Boolean(element.closest("input, textarea, [contenteditable], [role=\"textbox\"]"));
}
