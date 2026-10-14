import { describe, expect, it } from "vitest";
import {
  AI_CONTENT_MAX,
  MAX_PROMPT_CHANGES,
  cleanSummary,
  parsePromptOptimization,
  parseTagSuggestions,
  truncateForAi,
} from "@/lib/ai";
import { CONTENT_MAX, DESCRIPTION_MAX } from "@/lib/validations/items";

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

describe("cleanSummary", () => {
  it("collapses whitespace and newlines", () => {
    expect(cleanSummary("  A hook.\n\n  For search.  ")).toBe("A hook. For search.");
  });

  it("strips straight and smart quotes around the summary", () => {
    expect(cleanSummary('"A shell command."')).toBe("A shell command.");
    expect(cleanSummary("“A shell command.”")).toBe("A shell command.");
  });

  it("clamps the summary to DESCRIPTION_MAX", () => {
    expect(cleanSummary("a".repeat(DESCRIPTION_MAX + 100))).toHaveLength(DESCRIPTION_MAX);
  });
});

describe("parsePromptOptimization", () => {
  const reply = (body: unknown) => JSON.stringify(body);

  it("returns the trimmed prompt and changes", () => {
    const result = parsePromptOptimization(
      reply({ optimizedPrompt: "  Summarize the text in 3 bullets.  ", changes: [" Set a format "] }),
      "Summarize this",
    );

    expect(result).toEqual({
      optimizedPrompt: "Summarize the text in 3 bullets.",
      changes: ["Set a format"],
      unchanged: false,
    });
  });

  it("reports a prompt identical to the original as unchanged, with no changes", () => {
    const result = parsePromptOptimization(
      reply({ optimizedPrompt: "Summarize this", changes: ["Nothing really"] }),
      "  Summarize this\n",
    );

    expect(result).toEqual({ optimizedPrompt: "Summarize this", changes: [], unchanged: true });
  });

  it("drops non-string and blank changes and caps the list", () => {
    const changes = ["a", 1, " ", "b", "c", "d", "e", "f", "g"];
    const result = parsePromptOptimization(reply({ optimizedPrompt: "New", changes }), "Old");

    expect(result?.changes).toEqual(["a", "b", "c", "d", "e", "f"].slice(0, MAX_PROMPT_CHANGES));
  });

  it("strips a <prompt> wrapper echoed from the input", () => {
    const result = parsePromptOptimization(
      reply({ optimizedPrompt: "<prompt>\nSummarize in 3 bullets.\n</prompt>", changes: [] }),
      "Old",
    );

    expect(result?.optimizedPrompt).toBe("Summarize in 3 bullets.");
  });

  it("treats a missing changes list as empty", () => {
    expect(parsePromptOptimization(reply({ optimizedPrompt: "New" }), "Old")?.changes).toEqual([]);
  });

  it("clamps the prompt to CONTENT_MAX", () => {
    const result = parsePromptOptimization(
      reply({ optimizedPrompt: "a".repeat(CONTENT_MAX + 10) }),
      "Old",
    );

    expect(result?.optimizedPrompt).toHaveLength(CONTENT_MAX);
  });

  it("returns null for invalid JSON, a wrong shape, or an empty prompt", () => {
    expect(parsePromptOptimization("not json", "Old")).toBeNull();
    expect(parsePromptOptimization("null", "Old")).toBeNull();
    expect(parsePromptOptimization(reply({ prompt: "New" }), "Old")).toBeNull();
    expect(parsePromptOptimization(reply({ optimizedPrompt: "   " }), "Old")).toBeNull();
  });
});
