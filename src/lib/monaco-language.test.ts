import { describe, expect, it } from "vitest";
import {
  LANGUAGE_OPTIONS,
  languageOptionsFor,
  resolveMonacoLanguage,
  toLanguageSelectValue,
} from "@/lib/monaco-language";

describe("toLanguageSelectValue", () => {
  it("returns null for empty or plaintext languages", () => {
    expect(toLanguageSelectValue(null)).toBeNull();
    expect(toLanguageSelectValue("")).toBeNull();
    expect(toLanguageSelectValue("plaintext")).toBeNull();
  });

  it("resolves aliases to the matching option value", () => {
    expect(toLanguageSelectValue("bash")).toBe("shell");
    expect(toLanguageSelectValue("TS")).toBe("typescript");
  });
});

describe("languageOptionsFor", () => {
  it("returns the standard options for listed or empty languages", () => {
    expect(languageOptionsFor("bash")).toBe(LANGUAGE_OPTIONS);
    expect(languageOptionsFor(null)).toBe(LANGUAGE_OPTIONS);
  });

  it("appends an unlisted stored language so it stays selected", () => {
    const options = languageOptionsFor(" Elixir ");
    expect(options).toHaveLength(LANGUAGE_OPTIONS.length + 1);
    expect(options.at(-1)).toEqual({ value: "elixir", label: "Elixir" });
  });
});

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
