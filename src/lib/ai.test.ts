import { describe, expect, it } from "vitest";
import { AI_CONTENT_MAX, parseTagSuggestions, truncateForAi } from "@/lib/ai";

describe("truncateForAi", () => {
  it("leaves short text unchanged", () => {
    expect(truncateForAi("hello")).toBe("hello");
  });

  it("cuts text to AI_CONTENT_MAX characters", () => {
    expect(truncateForAi("a".repeat(AI_CONTENT_MAX + 50))).toHaveLength(AI_CONTENT_MAX);
  });
});

describe("parseTagSuggestions", () => {
  it("reads tags from an object reply", () => {
    expect(parseTagSuggestions('{"tags": ["react", "hooks"]}')).toEqual(["react", "hooks"]);
  });

  it("reads tags from a bare array reply", () => {
    expect(parseTagSuggestions('["react", "hooks"]')).toEqual(["react", "hooks"]);
  });

  it("lowercases, trims, and de-duplicates tags", () => {
    expect(parseTagSuggestions('{"tags": [" React ", "react", "Hooks"]}')).toEqual([
      "react",
      "hooks",
    ]);
  });

  it("drops tags the item already has, ignoring case", () => {
    expect(parseTagSuggestions('["react", "hooks"]', ["React"])).toEqual(["hooks"]);
  });

  it("drops non-strings, empty, comma-containing, and overlong tags", () => {
    const reply = JSON.stringify(["ok", 42, "", "a,b", "x".repeat(41)]);
    expect(parseTagSuggestions(reply)).toEqual(["ok"]);
  });

  it("returns at most five tags", () => {
    expect(parseTagSuggestions('["a", "b", "c", "d", "e", "f"]')).toHaveLength(5);
  });

  it("returns an empty array for invalid JSON or an unexpected shape", () => {
    expect(parseTagSuggestions("not json")).toEqual([]);
    expect(parseTagSuggestions('{"labels": ["react"]}')).toEqual([]);
    expect(parseTagSuggestions("null")).toEqual([]);
  });
});
