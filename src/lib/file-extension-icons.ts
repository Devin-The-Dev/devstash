import { File, FileCode, FileJson, FileSpreadsheet, FileText, type LucideIcon } from "lucide-react";

// Keyed by the extensions in UPLOAD_CONSTRAINTS.file (src/lib/upload-constraints.ts).
export const fileExtensionIconMap: Record<string, LucideIcon> = {
  ".pdf": FileText,
  ".txt": FileText,
  ".md": FileText,
  ".json": FileJson,
  ".yaml": FileCode,
  ".yml": FileCode,
  ".xml": FileCode,
  ".toml": FileCode,
  ".ini": FileCode,
  ".csv": FileSpreadsheet,
};

// Falls back to File for extensions outside the upload allowlist (e.g. a
// file created before a constraint change).
export const FALLBACK_FILE_ICON = File;

export function getFileExtension(fileName: string): string {
  return fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
}
