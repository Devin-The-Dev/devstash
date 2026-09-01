import { describe, expect, it, vi, afterEach } from "vitest";
import { formatRelativeTime, formatDate, formatFileSize, getInitials } from "@/lib/format";

describe("formatRelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for timestamps under a minute old", () => {
    expect(formatRelativeTime(new Date())).toBe("just now");
  });

  it("formats minutes, hours, and days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-10T00:00:00Z"));

    expect(formatRelativeTime(new Date("2026-01-09T23:55:00Z"))).toBe("5m ago");
    expect(formatRelativeTime(new Date("2026-01-09T18:00:00Z"))).toBe("6h ago");
    expect(formatRelativeTime(new Date("2026-01-07T00:00:00Z"))).toBe("3d ago");
  });
});

describe("formatDate", () => {
  it("formats a date in long US style", () => {
    expect(formatDate(new Date("2026-03-05T00:00:00Z"))).toMatch(/March/);
  });
});

describe("formatFileSize", () => {
  it("formats byte counts under 1 KB as bytes", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(0)).toBe("0 B");
  });

  it("formats byte counts under 1 MB as whole kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(1536)).toBe("2 KB");
  });

  it("formats byte counts at or over 1 MB as megabytes with one decimal", () => {
    expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
    expect(formatFileSize(5.5 * 1024 * 1024)).toBe("5.5 MB");
  });
});

describe("getInitials", () => {
  it("takes the first letter of up to two words", () => {
    expect(getInitials("Devin Udy")).toBe("DU");
  });

  it("uppercases a single name", () => {
    expect(getInitials("devin")).toBe("D");
  });

  it("ignores extra whitespace", () => {
    expect(getInitials("  devin   udy  ")).toBe("DU");
  });
});
