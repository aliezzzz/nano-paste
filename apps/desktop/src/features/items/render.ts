import type { FileItemDetail, ItemDetail } from "../../../../../packages/contracts/v1";
import { escapeHtml, formatBytes } from "../../shared/format";

type DownloadHandler = (fileId: string) => Promise<void>;

export function renderItems(root: HTMLUListElement, items: ItemDetail[], onDownload: DownloadHandler): void {
  root.innerHTML = items
    .map((item) => {
      if (item.type === "text") {
        const title = item.title?.trim();
        return `
          <li class="item-card">
            <div class="item-head">
              <span class="item-type">文本</span>
              <time class="item-time">${new Date(item.createdAt).toLocaleString()}</time>
            </div>
            ${title ? `<p class="item-title">${escapeHtml(title)}</p>` : ""}
            <p class="item-content">${escapeHtml(item.content)}</p>
          </li>
        `;
      }

      const fileItem = item as FileItemDetail;
      return `
        <li class="item-card">
          <div class="item-head">
            <span class="item-type">文件</span>
            <time class="item-time">${new Date(item.createdAt).toLocaleString()}</time>
          </div>
          <p class="item-content">文件名：${escapeHtml(fileItem.fileName)}</p>
          <p class="item-content">大小：${formatBytes(fileItem.fileSize)}</p>
          <button class="btn btn-small" data-action="download" data-file-id="${escapeHtml(fileItem.fileId)}">获取下载地址</button>
        </li>
      `;
    })
    .join("");

  for (const button of root.querySelectorAll<HTMLButtonElement>('button[data-action="download"]')) {
    button.addEventListener("click", async () => {
      const fileId = button.dataset.fileId;
      if (!fileId) return;
      await onDownload(fileId);
    });
  }
}
