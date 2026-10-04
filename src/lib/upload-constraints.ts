export type UploadKind = "image" | "file";

type UploadConstraint = {
  maxSize: number;
  extensions: string[];
  mimeTypes: string[];
};

export const UPLOAD_CONSTRAINTS: Record<UploadKind, UploadConstraint> = {
  image: {
    maxSize: 5 * 1024 * 1024,
    extensions: [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    mimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
  },
  file: {
    maxSize: 10 * 1024 * 1024,
    extensions: [".pdf", ".txt", ".md", ".json", ".yaml", ".yml", ".xml", ".csv", ".toml", ".ini"],
    mimeTypes: [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/json",
      "application/x-yaml",
      "text/yaml",
      "application/xml",
      "text/xml",
      "text/csv",
      "application/toml",
    ],
  },
};

// Stored Content-Type is derived from the extension server-side rather than
// trusting the browser-reported type.
const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".json": "application/json",
  ".yaml": "application/x-yaml",
  ".yml": "application/x-yaml",
  ".xml": "application/xml",
  ".csv": "text/csv",
  ".toml": "application/toml",
  ".ini": "text/plain",
};

/** Lowercased extension including the dot, or "" if the name has none. */
export function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
}

export function contentTypeForExtension(extension: string): string {
  return EXTENSION_CONTENT_TYPES[extension] ?? "application/octet-stream";
}

export function validateUpload(
  kind: UploadKind,
  file: { name: string; type: string; size: number },
): { valid: true } | { valid: false; error: string } {
  const constraint = UPLOAD_CONSTRAINTS[kind];
  const extension = getExtension(file.name);

  if (!constraint.extensions.includes(extension)) {
    return { valid: false, error: `Unsupported file type. Allowed: ${constraint.extensions.join(", ")}` };
  }

  // .ini has no dedicated MIME type (browsers/OS report it as text/plain or empty), so skip the MIME check for it.
  if (extension !== ".ini" && file.type && !constraint.mimeTypes.includes(file.type)) {
    return { valid: false, error: "File type doesn't match its extension" };
  }

  if (file.size > constraint.maxSize) {
    return { valid: false, error: `File too large. Max size is ${constraint.maxSize / (1024 * 1024)} MB` };
  }

  return { valid: true };
}
