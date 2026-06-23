export interface ItemView {
  id: string;
  type: "text" | "file";
  title?: string;
  content?: string;
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  isFavorite: boolean;
  createdAt: string;
  iconSvg: string;
  tags?: string[];
  topic?: string;
  contentKind?: "text" | "code";
  language?: string;
}

export type ItemActionType = "copy" | "download" | "delete" | "favorite" | "preview" | "preview-code" | "set-topic";

export interface ItemActionPayload {
  id: string;
  action: ItemActionType;
  type: "text" | "file";
  content?: string;
  fileId?: string;
  fileName?: string;
  isFavorite: boolean;
  topic?: string;
  title?: string;
  language?: string;
}
