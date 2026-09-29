export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export const MAX_FILES_PER_SUBJECT = 20;

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const ALLOWED_MIME = new Set(Object.values(MIME_BY_EXT));

export function fileExtension(name: string) {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "";
  return name.slice(dot + 1).toLowerCase();
}

export function resolveMimeType(name: string, type: string) {
  if (type && ALLOWED_MIME.has(type)) return type;
  return MIME_BY_EXT[fileExtension(name)] ?? "";
}

export function isAllowedUpload(name: string, type: string) {
  return Boolean(resolveMimeType(name, type));
}

export function fileMeta(row: {
  id: string;
  subjectId: string;
  name: string;
  mimeType: string;
  createdAt: Date;
}) {
  return {
    id: row.id,
    subjectId: row.subjectId,
    name: row.name,
    mimeType: row.mimeType,
    createdAt: row.createdAt,
  };
}

export function contentDisposition(name: string, mode: "inline" | "attachment") {
  const safe = name.replace(/["\\]/g, "_");
  return `${mode}; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}
