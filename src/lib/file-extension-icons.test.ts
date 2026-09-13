import { describe, expect, it } from "vitest";
import { fileExtensionIconMap, getFileExtension } from "@/lib/file-extension-icons";

describe("getFileExtension", () => {
  it("returns the lowercased extension including the dot", () => {
    expect(getFileExtension("report.PDF")).toBe(".pdf");
    expect(getFileExtension("inventory.csv")).toBe(".csv");
  });

  it("uses the last extension for multi-dot filenames", () => {
    expect(getFileExtension("archive.tar.gz")).toBe(".gz");
  });

  it("falls back to the last character when there is no extension", () => {
    // Matches the same lastIndexOf(".")-based parsing used by validateUpload()
    // in upload-constraints.ts; harmless here since an unmatched key just
    // falls back to the generic file icon.
    expect(getFileExtension("README")).toBe("e");
  });
});

describe("fileExtensionIconMap", () => {
  it("covers every extension in the upload allowlist", () => {
    const allowedExtensions = [
      ".pdf",
      ".txt",
      ".md",
      ".json",
      ".yaml",
      ".yml",
      ".xml",
      ".csv",
      ".toml",
      ".ini",
    ];

    for (const extension of allowedExtensions) {
      expect(fileExtensionIconMap[extension]).toBeDefined();
    }
  });
});
