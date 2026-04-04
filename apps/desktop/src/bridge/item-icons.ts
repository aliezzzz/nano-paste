import type { ItemDetail } from "../../../../packages/contracts/v1";

type FileKind =
  | "text"
  | "word"
  | "pdf"
  | "image"
  | "archive"
  | "excel"
  | "ppt"
  | "audio"
  | "video"
  | "code"
  | "other";

export function getItemIconSvg(item: ItemDetail): string {
  if (item.type === "text") {
    return iconByKind.text;
  }

  const ext = getFileExtension(String(item.fileName || item.title || ""));
  const kind = resolveFileKind(ext);
  return iconByKind[kind] ?? iconByKind.other;
}

function getFileExtension(fileName: string): string {
  const normalized = fileName.trim().toLowerCase();
  const dotIndex = normalized.lastIndexOf(".");
  if (dotIndex < 0 || dotIndex === normalized.length - 1) return "";
  return normalized.slice(dotIndex + 1);
}

function resolveFileKind(ext: string): FileKind {
  if (!ext) return "other";
  if (["txt", "md", "rtf"].includes(ext)) return "text";
  if (["doc", "docx"].includes(ext)) return "word";
  if (ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "heic", "bmp"].includes(ext)) return "image";
  if (["zip", "rar", "7z", "tar", "gz", "bz2", "xz"].includes(ext)) return "archive";
  if (["xls", "xlsx", "csv"].includes(ext)) return "excel";
  if (["ppt", "pptx", "key"].includes(ext)) return "ppt";
  if (["mp3", "wav", "flac", "aac", "m4a", "ogg"].includes(ext)) return "audio";
  if (["mp4", "mov", "mkv", "avi", "webm", "m4v"].includes(ext)) return "video";
  if (["js", "ts", "jsx", "tsx", "json", "yaml", "yml", "xml", "html", "css", "go", "py", "java", "c", "cpp", "rs", "sh"].includes(ext)) return "code";
  return "other";
}

const iconByKind: Record<FileKind, string> = {
  text: '<svg class="w-7 h-7" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="6" width="48" height="52" rx="10" fill="#7b4dff"/><path d="M42 6v14h14" fill="#9d7aff"/><rect x="16" y="25" width="32" height="4" rx="2" fill="#f4edff"/><rect x="16" y="34" width="22" height="4" rx="2" fill="#d9c9ff"/></svg>',
  word: '<svg class="w-7 h-7" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="6" width="48" height="52" rx="10" fill="#1c73ff"/><path d="M42 6v14h14" fill="#4a93ff"/><rect x="15" y="34" width="34" height="16" rx="6" fill="#f0f7ff"/><rect x="20" y="39" width="24" height="2.8" rx="1.4" fill="#1c73ff"/><rect x="20" y="44" width="18" height="2.8" rx="1.4" fill="#4a93ff"/></svg>',
  pdf: '<svg class="w-7 h-7" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="6" width="48" height="52" rx="10" fill="#ff3b4f"/><path d="M42 6v14h14" fill="#ff6a78"/><rect x="16" y="33" width="32" height="17" rx="6" fill="#fff1f3"/><path d="M21 45l5-7 4 5 4-6 6 8" fill="none" stroke="#ff3b4f" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  image: '<svg class="w-7 h-7" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="48" height="48" rx="12" fill="#00bfa6"/><circle cx="24" cy="24" r="6" fill="#edfffb"/><path d="M14 46l12-12 8 8 6-5 10 9" fill="none" stroke="#edfffb" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  archive: '<svg class="w-7 h-7" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="6" width="48" height="52" rx="10" fill="#f7b212"/><path d="M42 6v14h14" fill="#ffca4b"/><rect x="26" y="20" width="12" height="4" rx="1.5" fill="#fff"/><rect x="28" y="26" width="8" height="4" rx="1.5" fill="#fff"/><rect x="26" y="32" width="12" height="4" rx="1.5" fill="#fff"/><rect x="24" y="40" width="16" height="8" rx="3" fill="#fff"/><rect x="30" y="42" width="4" height="4" rx="1" fill="#f7b212"/></svg>',
  excel: '<svg class="w-7 h-7" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="6" width="48" height="52" rx="10" fill="#08a66d"/><path d="M42 6v14h14" fill="#2fd48f"/><rect x="16" y="33" width="32" height="16" rx="6" fill="#ebfff4"/><rect x="20" y="37" width="10" height="10" rx="2" fill="#08a66d"/><rect x="32" y="37" width="12" height="2.8" rx="1.4" fill="#08a66d"/><rect x="32" y="41.6" width="12" height="2.8" rx="1.4" fill="#2fd48f"/></svg>',
  ppt: '<svg class="w-7 h-7" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="6" width="48" height="52" rx="10" fill="#ff8a00"/><path d="M42 6v14h14" fill="#ffab3d"/><rect x="16" y="34" width="32" height="15" rx="6" fill="#fff5e7"/><rect x="20" y="38" width="8" height="6" rx="2" fill="#ff8a00"/><rect x="30" y="38" width="14" height="2" rx="1" fill="#ff8a00"/><rect x="30" y="42" width="10" height="2" rx="1" fill="#ff8a00"/></svg>',
  audio: '<svg class="w-7 h-7" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><circle cx="512" cy="512" r="384" fill="#9a5cff"/><g transform="translate(210 200) scale(0.58)"><path d="M875.52 433.152q-7.168-1.024-12.8-10.24t-8.704-33.792q-5.12-39.936-26.112-58.88t-65.024-27.136q-46.08-9.216-81.408-37.376t-58.88-52.736q-22.528-21.504-34.816-15.36t-12.288 22.528l0 44.032 0 96.256q0 57.344-0.512 123.904t-0.512 125.952l0 104.448 0 58.368q1.024 24.576-7.68 54.784t-32.768 56.832-64 45.568-99.328 22.016q-60.416 3.072-109.056-21.504t-75.264-61.952-26.112-81.92 38.4-83.456 81.92-54.272 84.992-16.896 73.216 5.632 47.616 13.312l0-289.792q0-120.832 1.024-272.384 0-29.696 15.36-48.64t40.96-22.016q21.504-3.072 35.328 8.704t28.16 32.768 35.328 47.616 56.832 52.224q30.72 23.552 53.76 33.792t43.008 18.944 39.424 20.992 43.008 39.936q23.552 26.624 28.672 55.296t0.512 52.224-14.848 38.4-17.408 13.824z" fill="#f1e7ff"/></g></svg>',
  video: '<svg class="w-7 h-7" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="12" width="48" height="40" rx="10" fill="#2d7dff"/><polygon points="28,24 43,32 28,40" fill="#eef5ff"/><rect x="14" y="18" width="6" height="28" rx="3" fill="#eef5ff"/></svg>',
  code: '<svg class="w-7 h-7" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="10" width="48" height="44" rx="10" fill="#4f5dff"/><path d="M20 24l-6 8 6 8" fill="none" stroke="#f0f4ff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 24l6 8-6 8" fill="none" stroke="#f0f4ff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><rect x="29" y="22" width="6" height="20" rx="3" fill="#b6c2ff"/></svg>',
  other: '<svg class="w-7 h-7" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="6" width="48" height="52" rx="10" fill="#6f7a99"/><path d="M42 6v14h14" fill="#92a0c2"/><circle cx="32" cy="39" r="9" fill="#eef3ff"/><circle cx="32" cy="39" r="3" fill="#8494ba"/></svg>',
};
