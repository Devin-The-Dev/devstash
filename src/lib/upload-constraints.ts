export type UploadKind = "image" | "file";

type UploadConstraint = {
  maxSize: number;
  extensions: string[];
  mimeTypes: string[];
};

export const UPLOAD_CONSTRAINTS: Record<UploadKind, UploadConstraint> = {
  image: {
    maxSize: 5 * 1024 * 1024,
    extensions: [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"],
    mimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"],
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

export function validateUpload(
  kind: UploadKind,
  file: { name: string; type: string; size: number },
): { valid: true } | { valid: false; error: string } {
  const constraint = UPLOAD_CONSTRAINTS[kind];
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

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
