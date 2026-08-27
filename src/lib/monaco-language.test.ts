import { describe, expect, it } from "vitest";
import { resolveMonacoLanguage } from "@/lib/monaco-language";

describe("resolveMonacoLanguage", () => {
  it("returns plaintext for null, undefined, or empty input", () => {
    expect(resolveMonacoLanguage(null)).toBe("plaintext");
    expect(resolveMonacoLanguage(undefined)).toBe("plaintext");
    expect(resolveMonacoLanguage("")).toBe("plaintext");
  });

  it("maps known aliases to their Monaco language id", () => {
    expect(resolveMonacoLanguage("bash")).toBe("shell");
    expect(resolveMonacoLanguage("sh")).toBe("shell");
    expect(resolveMonacoLanguage("zsh")).toBe("shell");
    expect(resolveMonacoLanguage("js")).toBe("javascript");
    expect(resolveMonacoLanguage("ts")).toBe("typescript");
    expect(resolveMonacoLanguage("yml")).toBe("yaml");
  });

  it("passes through languages Monaco already recognizes by id", () => {
    expect(resolveMonacoLanguage("typescript")).toBe("typescript");
    expect(resolveMonacoLanguage("python")).toBe("python");
  });

  it("normalizes case and surrounding whitespace before resolving", () => {
    expect(resolveMonacoLanguage("BASH")).toBe("shell");
    expect(resolveMonacoLanguage("  TypeScript  ")).toBe("typescript");
  });
});
