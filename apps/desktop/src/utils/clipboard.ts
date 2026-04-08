import { showToast } from "../components/feedback/toast";

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

interface PasteDeps {
  hasSession: () => boolean;
  enqueueFiles: (files: File[]) => void;
  sendText: (payload: { content: string }) => Promise<void>;
}

export async function handleGlobalPaste(event: ClipboardEvent, deps: PasteDeps): Promise<void> {
  if (event.defaultPrevented) return;
  if (isEditableTarget(event.target)) return;

  if (!deps.hasSession()) return;

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
