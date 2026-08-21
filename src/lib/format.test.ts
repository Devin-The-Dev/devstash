import { describe, expect, it, vi, afterEach } from "vitest";
import { formatRelativeTime, formatDate, getInitials } from "@/lib/format";

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
