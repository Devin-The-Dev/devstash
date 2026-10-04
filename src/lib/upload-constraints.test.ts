import { describe, expect, it } from "vitest";
import {
  contentTypeForExtension,
  getExtension,
  matchesMagicBytes,
  validateUpload,
} from "@/lib/upload-constraints";

describe("validateUpload", () => {
  it("accepts a file within the allowed extension, MIME type, and size", () => {
    const result = validateUpload("image", { name: "photo.png", type: "image/png", size: 1024 });
    expect(result).toEqual({ valid: true });
  });

  it("rejects an extension outside the allowed list for the kind", () => {
    const result = validateUpload("image", { name: "photo.bmp", type: "image/bmp", size: 1024 });
    expect(result.valid).toBe(false);
  });

  it("rejects a file whose extension belongs to the other kind", () => {
    const result = validateUpload("image", { name: "notes.pdf", type: "application/pdf", size: 1024 });
    expect(result.valid).toBe(false);
  });

  it("rejects a MIME type that isn't in the kind's allowed list", () => {
    const result = validateUpload("image", {
      name: "photo.png",
      type: "application/pdf",
      size: 1024,
    });
    expect(result).toEqual({ valid: false, error: "File type doesn't match its extension" });
  });

  it("skips the MIME check for .ini files, which browsers report inconsistently", () => {
    const result = validateUpload("file", { name: "config.ini", type: "", size: 1024 });
    expect(result).toEqual({ valid: true });
  });

  it("rejects a file over the size limit for its kind", () => {
    const result = validateUpload("image", {
      name: "huge.png",
      type: "image/png",
      size: 6 * 1024 * 1024,
    });
    expect(result.valid).toBe(false);
  });

  it("accepts a file exactly at the size limit", () => {
    const result = validateUpload("file", {
      name: "max.pdf",
      type: "application/pdf",
      size: 10 * 1024 * 1024,
    });
    expect(result).toEqual({ valid: true });
  });

  it("matches extensions case-insensitively", () => {
    const result = validateUpload("image", { name: "photo.PNG", type: "image/png", size: 1024 });
    expect(result).toEqual({ valid: true });
  });
});

describe("getExtension", () => {
  it("returns the lowercased extension with its dot", () => {
    expect(getExtension("Photo.PNG")).toBe(".png");
  });

  it("returns an empty string for a name with no dot", () => {
    expect(getExtension("Makefile")).toBe("");
  });
});

describe("contentTypeForExtension", () => {
  it("maps a known extension to its content type", () => {
    expect(contentTypeForExtension(".jpg")).toBe("image/jpeg");
  });

  it("falls back to octet-stream for an unknown extension", () => {
    expect(contentTypeForExtension(".exe")).toBe("application/octet-stream");
  });
});

describe("matchesMagicBytes", () => {
  const bytes = (...values: number[]) => new Uint8Array(values);

  it("accepts a PNG signature", () => {
    expect(matchesMagicBytes(".png", bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe(true);
  });

  it("rejects HTML saved as .png", () => {
    expect(matchesMagicBytes(".png", new TextEncoder().encode("<html>"))).toBe(false);
  });

  it("checks both halves of a WEBP signature", () => {
    const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBP");
    const wav = new TextEncoder().encode("RIFF\0\0\0\0WAVE");
    expect(matchesMagicBytes(".webp", webp)).toBe(true);
    expect(matchesMagicBytes(".webp", wav)).toBe(false);
  });

  it("accepts any bytes for text formats", () => {
    expect(matchesMagicBytes(".md", new TextEncoder().encode("# Notes"))).toBe(true);
  });
});

describe("contentTypeForExtension for .xml", () => {
  it("serves XML as plain text so browsers don't render it", () => {
    expect(contentTypeForExtension(".xml")).toBe("text/plain");
  });
});
