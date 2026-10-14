import { describe, expect, it, vi, beforeEach } from "vitest";
import { APIConnectionError, InternalServerError, RateLimitError } from "openai";
import {
  AI_BUSY_ERROR,
  AI_SERVICE_ERROR,
  AI_UNAVAILABLE_ERROR,
  AI_CONTENT_MAX,
  NO_EXPLANATION_ERROR,
  NO_OPTIMIZATION_ERROR,
  NO_SUMMARY_ERROR,
  NO_TAGS_ERROR,
  PROMPT_OPTIMIZE_MAX,
} from "@/lib/ai";

const { authMock, canUseProFeatureMock, checkRateLimitMock, openaiState } = vi.hoisted(() => ({
  authMock: vi.fn(),
  canUseProFeatureMock: vi.fn(),
  checkRateLimitMock: vi.fn(),
  openaiState: {
    client: { responses: { create: vi.fn() } } as { responses: { create: ReturnType<typeof vi.fn> } } | null,
  },
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/usage-limits", () => ({
  canUseProFeature: canUseProFeatureMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  aiRateLimit: null,
  checkRateLimit: checkRateLimitMock,
  rateLimitMessage: () => "Too many attempts. Please try again in 30 minutes.",
}));

vi.mock("@/lib/openai", () => ({
  AI_MODEL: "gpt-5-nano",
  get openai() {
    return openaiState.client;
  },
}));

const { explainCode, generateAutoTags, generateSummary, optimizePrompt } = await import(
  "@/actions/ai"
);

const createMock = () => openaiState.client!.responses.create;

const validInput = { title: "useDebounce hook", content: "export function useDebounce() {}" };

beforeEach(() => {
  vi.clearAllMocks();
  openaiState.client = { responses: { create: vi.fn() } };
  authMock.mockResolvedValue({ user: { id: "user-1" } });
  canUseProFeatureMock.mockResolvedValue({ allowed: true });
  checkRateLimitMock.mockResolvedValue({ success: true, remaining: 19, reset: 0 });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("generateAutoTags", () => {
  it("returns an error when there is no authenticated session", async () => {
    authMock.mockResolvedValue(null);

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(canUseProFeatureMock).not.toHaveBeenCalled();
    expect(createMock()).not.toHaveBeenCalled();
  });

  it("blocks free users before rate limiting or calling OpenAI", async () => {
    canUseProFeatureMock.mockResolvedValue({
      allowed: false,
      error: "AI tag suggestions requires DevStash Pro",
    });

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({ success: false, error: "AI tag suggestions requires DevStash Pro" });
    expect(canUseProFeatureMock).toHaveBeenCalledWith("user-1", "AI tag suggestions");
    expect(checkRateLimitMock).not.toHaveBeenCalled();
    expect(createMock()).not.toHaveBeenCalled();
  });

  it("returns the rate limit message when the user is over the AI limit", async () => {
    checkRateLimitMock.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() });

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({
      success: false,
      error: "Too many attempts. Please try again in 30 minutes.",
    });
    expect(checkRateLimitMock).toHaveBeenCalledWith(null, "user-1");
    expect(createMock()).not.toHaveBeenCalled();
  });

  it("rejects input with neither a title nor content", async () => {
    const result = await generateAutoTags({ title: "  ", content: "" });

    expect(result).toEqual({ success: false, error: "Add a title or content first" });
    expect(createMock()).not.toHaveBeenCalled();
  });

  it("rejects malformed input", async () => {
    const result = await generateAutoTags({ title: 42 });

    expect(result.success).toBe(false);
    expect(createMock()).not.toHaveBeenCalled();
  });

  it("reports AI as unavailable when OpenAI isn't configured", async () => {
    openaiState.client = null;

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({ success: false, error: AI_UNAVAILABLE_ERROR });
  });

  it("calls the Responses API with JSON output and truncated content", async () => {
    createMock().mockResolvedValue({ output_text: '{"tags": ["react"]}' });
    const longContent = "x".repeat(AI_CONTENT_MAX + 500);

    await generateAutoTags({ title: "Hook", content: longContent, typeName: "Snippet" });

    const request = createMock().mock.calls[0][0];
    expect(request).toMatchObject({
      model: "gpt-5-nano",
      text: { format: { type: "json_object" } },
      store: false,
    });
    // json_object mode is rejected unless the input itself mentions JSON.
    expect(request.input).toMatch(/json/i);
    expect(request.input).toContain("Type: Snippet");
    expect(request.input).toContain("Title: Hook");
    expect(request.input).toContain("x".repeat(AI_CONTENT_MAX));
    expect(request.input).not.toContain("x".repeat(AI_CONTENT_MAX + 1));
  });

  it("returns cleaned suggestions, excluding tags the item already has", async () => {
    createMock().mockResolvedValue({ output_text: '{"tags": ["React", "hooks", "debounce"]}' });

    const result = await generateAutoTags({ ...validInput, existingTags: ["hooks"] });

    expect(result).toEqual({ success: true, data: { tags: ["react", "debounce"] } });
  });

  it("accepts a bare array reply", async () => {
    createMock().mockResolvedValue({ output_text: '["typescript", "hooks"]' });

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({ success: true, data: { tags: ["typescript", "hooks"] } });
  });

  it("returns an error when the model gives no usable tags", async () => {
    createMock().mockResolvedValue({ output_text: "" });

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({ success: false, error: NO_TAGS_ERROR });
  });

  it("maps an OpenAI rate limit error to the busy message", async () => {
    createMock().mockRejectedValue(new RateLimitError(429, undefined, "Rate limit", new Headers()));

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({ success: false, error: AI_BUSY_ERROR });
  });

  it("maps an exhausted OpenAI balance to the unavailable message, not busy", async () => {
    createMock().mockRejectedValue(
      new RateLimitError(
        429,
        // Shape of OpenAI's real "no credits" error body.
        { type: "insufficient_quota", code: "credit_balance_exhausted", message: "No credits" },
        "No credits",
        new Headers(),
      ),
    );

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({ success: false, error: AI_UNAVAILABLE_ERROR });
  });

  it("maps a connection error to the unavailable message", async () => {
    createMock().mockRejectedValue(new APIConnectionError({ message: "Connection error" }));

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({ success: false, error: AI_UNAVAILABLE_ERROR });
  });

  it("maps other OpenAI errors to the service error message", async () => {
    createMock().mockRejectedValue(
      new InternalServerError(500, undefined, "Server error", new Headers()),
    );

    const result = await generateAutoTags(validInput);

    expect(result).toEqual({ success: false, error: AI_SERVICE_ERROR });
  });
});

describe("generateSummary", () => {
  it("returns an error when there is no authenticated session", async () => {
    authMock.mockResolvedValue(null);

    const result = await generateSummary(validInput);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(createMock()).not.toHaveBeenCalled();
  });

  it("blocks free users before rate limiting or calling OpenAI", async () => {
    canUseProFeatureMock.mockResolvedValue({
      allowed: false,
      error: "AI summaries requires DevStash Pro",
    });

    const result = await generateSummary(validInput);

    expect(result).toEqual({ success: false, error: "AI summaries requires DevStash Pro" });
    expect(canUseProFeatureMock).toHaveBeenCalledWith("user-1", "AI summaries");
    expect(checkRateLimitMock).not.toHaveBeenCalled();
    expect(createMock()).not.toHaveBeenCalled();
  });

  it("returns the rate limit message when the user is over the AI limit", async () => {
    checkRateLimitMock.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() });

    const result = await generateSummary(validInput);

    expect(result).toEqual({
      success: false,
      error: "Too many attempts. Please try again in 30 minutes.",
    });
    expect(createMock()).not.toHaveBeenCalled();
  });

  it("rejects input with no title, content, URL, or file name", async () => {
    const result = await generateSummary({ title: " ", content: "", url: "", fileName: null });

    expect(result).toEqual({ success: false, error: "Add a title or content first" });
    expect(createMock()).not.toHaveBeenCalled();
  });

  it("accepts a URL alone for link items", async () => {
    createMock().mockResolvedValue({ output_text: "The official React docs." });

    const result = await generateSummary({ url: "https://react.dev", typeName: "Link" });

    expect(result).toEqual({ success: true, data: { summary: "The official React docs." } });
    expect(createMock().mock.calls[0][0].input).toContain("URL: https://react.dev");
  });

  it("reports AI as unavailable when OpenAI isn't configured", async () => {
    openaiState.client = null;

    const result = await generateSummary(validInput);

    expect(result).toEqual({ success: false, error: AI_UNAVAILABLE_ERROR });
  });

  it("sends every available field with truncated content", async () => {
    createMock().mockResolvedValue({ output_text: "A summary." });
    const longContent = "x".repeat(AI_CONTENT_MAX + 500);

    await generateSummary({
      title: "Report",
      content: longContent,
      typeName: "File",
      language: "typescript",
      fileName: "report.pdf",
    });

    const request = createMock().mock.calls[0][0];
    expect(request).toMatchObject({ model: "gpt-5-nano", store: false });
    expect(request.input).toContain("Type: File");
    expect(request.input).toContain("Title: Report");
    expect(request.input).toContain("Language: typescript");
    expect(request.input).toContain("File name: report.pdf");
    expect(request.input).toContain("x".repeat(AI_CONTENT_MAX));
    expect(request.input).not.toContain("x".repeat(AI_CONTENT_MAX + 1));
  });

  it("returns the cleaned summary", async () => {
    createMock().mockResolvedValue({
      output_text: '  "A React hook that debounces a value.\n Useful for search inputs."  ',
    });

    const result = await generateSummary(validInput);

    expect(result).toEqual({
      success: true,
      data: { summary: "A React hook that debounces a value. Useful for search inputs." },
    });
  });

  it("returns an error when the model gives an empty reply", async () => {
    createMock().mockResolvedValue({ output_text: "   " });

    const result = await generateSummary(validInput);

    expect(result).toEqual({ success: false, error: NO_SUMMARY_ERROR });
  });

  it("maps an OpenAI rate limit error to the busy message", async () => {
    createMock().mockRejectedValue(new RateLimitError(429, undefined, "Rate limit", new Headers()));

    const result = await generateSummary(validInput);

    expect(result).toEqual({ success: false, error: AI_BUSY_ERROR });
  });

  it("maps other OpenAI errors to the service error message", async () => {
    createMock().mockRejectedValue(
      new InternalServerError(500, undefined, "Server error", new Headers()),
    );

    const result = await generateSummary(validInput);

    expect(result).toEqual({ success: false, error: AI_SERVICE_ERROR });
  });
});

describe("explainCode", () => {
  const explainInput = {
    title: "useDebounce hook",
    content: "export function useDebounce() {}",
    typeName: "Snippet",
    language: "typescript",
  };

  it("returns an error when there is no authenticated session", async () => {
    authMock.mockResolvedValue(null);

    const result = await explainCode(explainInput);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(createMock()).not.toHaveBeenCalled();
  });

  it("blocks free users before rate limiting or calling OpenAI", async () => {
    canUseProFeatureMock.mockResolvedValue({
      allowed: false,
      error: "AI code explanations requires DevStash Pro",
    });

    const result = await explainCode(explainInput);

    expect(result).toEqual({ success: false, error: "AI code explanations requires DevStash Pro" });
    expect(canUseProFeatureMock).toHaveBeenCalledWith("user-1", "AI code explanations");
    expect(checkRateLimitMock).not.toHaveBeenCalled();
    expect(createMock()).not.toHaveBeenCalled();
  });

  it("returns the rate limit message when the user is over the AI limit", async () => {
    checkRateLimitMock.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() });

    const result = await explainCode(explainInput);

    expect(result).toEqual({
      success: false,
      error: "Too many attempts. Please try again in 30 minutes.",
    });
    expect(createMock()).not.toHaveBeenCalled();
  });

  it("rejects blank content", async () => {
    const result = await explainCode({ ...explainInput, content: "   " });

    expect(result).toEqual({ success: false, error: "There's no code to explain" });
    expect(createMock()).not.toHaveBeenCalled();
  });

  it("rejects item types other than snippets and commands", async () => {
    const result = await explainCode({ ...explainInput, typeName: "Note" });

    expect(result.success).toBe(false);
    expect(createMock()).not.toHaveBeenCalled();
  });

  it("reports AI as unavailable when OpenAI isn't configured", async () => {
    openaiState.client = null;

    const result = await explainCode(explainInput);

    expect(result).toEqual({ success: false, error: AI_UNAVAILABLE_ERROR });
  });

  it("sends the type, title, language, and truncated content", async () => {
    createMock().mockResolvedValue({ output_text: "Explanation." });
    const longContent = "x".repeat(AI_CONTENT_MAX + 500);

    await explainCode({ ...explainInput, content: longContent, typeName: "Command", language: "bash" });

    const request = createMock().mock.calls[0][0];
    expect(request).toMatchObject({ model: "gpt-5-nano", store: false });
    expect(request.input).toContain("Type: Command");
    expect(request.input).toContain("Title: useDebounce hook");
    expect(request.input).toContain("Language: bash");
    expect(request.input).toContain("x".repeat(AI_CONTENT_MAX));
    expect(request.input).not.toContain("x".repeat(AI_CONTENT_MAX + 1));
  });

  it("returns the trimmed markdown explanation", async () => {
    createMock().mockResolvedValue({
      output_text: "\n  Debounces a value.\n\n- Uses `setTimeout`\n  ",
    });

    const result = await explainCode(explainInput);

    expect(result).toEqual({
      success: true,
      data: { explanation: "Debounces a value.\n\n- Uses `setTimeout`" },
    });
  });

  it("returns an error when the model gives an empty reply", async () => {
    createMock().mockResolvedValue({ output_text: "  " });

    const result = await explainCode(explainInput);

    expect(result).toEqual({ success: false, error: NO_EXPLANATION_ERROR });
  });

  it("maps an OpenAI rate limit error to the busy message", async () => {
    createMock().mockRejectedValue(new RateLimitError(429, undefined, "Rate limit", new Headers()));

    const result = await explainCode(explainInput);

    expect(result).toEqual({ success: false, error: AI_BUSY_ERROR });
  });

  it("maps other OpenAI errors to the service error message", async () => {
    createMock().mockRejectedValue(
      new InternalServerError(500, undefined, "Server error", new Headers()),
    );

    const result = await explainCode(explainInput);

    expect(result).toEqual({ success: false, error: AI_SERVICE_ERROR });
  });
});

describe("optimizePrompt", () => {
  const promptInput = { title: "Code reviewer", content: "Review my code" };
  const optimizedReply = JSON.stringify({
    optimizedPrompt: "Review the code below for bugs and readability. List issues by severity.",
    changes: ["Stated what to look for", "Defined the output format"],
  });

  it("returns an error when there is no authenticated session", async () => {
    authMock.mockResolvedValue(null);

    const result = await optimizePrompt(promptInput);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(createMock()).not.toHaveBeenCalled();
  });

  it("blocks free users before rate limiting or calling OpenAI", async () => {
    canUseProFeatureMock.mockResolvedValue({
      allowed: false,
      error: "AI prompt optimization requires DevStash Pro",
    });

    const result = await optimizePrompt(promptInput);

    expect(result).toEqual({
      success: false,
      error: "AI prompt optimization requires DevStash Pro",
    });
    expect(canUseProFeatureMock).toHaveBeenCalledWith("user-1", "AI prompt optimization");
    expect(checkRateLimitMock).not.toHaveBeenCalled();
    expect(createMock()).not.toHaveBeenCalled();
  });

  it("returns the rate limit message when the user is over the AI limit", async () => {
    checkRateLimitMock.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() });

    const result = await optimizePrompt(promptInput);

    expect(result).toEqual({
      success: false,
      error: "Too many attempts. Please try again in 30 minutes.",
    });
    expect(createMock()).not.toHaveBeenCalled();
  });

  it("rejects a blank prompt", async () => {
    const result = await optimizePrompt({ ...promptInput, content: "  " });

    expect(result).toEqual({ success: false, error: "There's no prompt to optimize" });
    expect(createMock()).not.toHaveBeenCalled();
  });

  it("refuses prompts over the limit instead of truncating them", async () => {
    const result = await optimizePrompt({
      ...promptInput,
      content: "x".repeat(PROMPT_OPTIMIZE_MAX + 1),
    });

    expect(result).toEqual({
      success: false,
      error: "Prompts over 8,000 characters can't be optimized",
    });
    expect(createMock()).not.toHaveBeenCalled();
  });

  it("reports AI as unavailable when OpenAI isn't configured", async () => {
    openaiState.client = null;

    const result = await optimizePrompt(promptInput);

    expect(result).toEqual({ success: false, error: AI_UNAVAILABLE_ERROR });
  });

  it("sends the whole prompt with a strict JSON schema", async () => {
    createMock().mockResolvedValue({ output_text: optimizedReply });
    const longPrompt = "x".repeat(PROMPT_OPTIMIZE_MAX);

    await optimizePrompt({ ...promptInput, content: longPrompt });

    const request = createMock().mock.calls[0][0];
    expect(request).toMatchObject({
      model: "gpt-5-nano",
      text: { format: { type: "json_schema", name: "prompt_optimization", strict: true } },
      store: false,
    });
    expect(request.input).toContain('"Code reviewer"');
    expect(request.input).toContain(`<prompt>\n${longPrompt}\n</prompt>`);
  });

  it("returns the optimized prompt and changes", async () => {
    createMock().mockResolvedValue({ output_text: optimizedReply });

    const result = await optimizePrompt(promptInput);

    expect(result).toEqual({
      success: true,
      data: {
        optimizedPrompt: "Review the code below for bugs and readability. List issues by severity.",
        changes: ["Stated what to look for", "Defined the output format"],
        unchanged: false,
      },
    });
  });

  it("flags an unchanged prompt", async () => {
    createMock().mockResolvedValue({
      output_text: JSON.stringify({ optimizedPrompt: "Review my code", changes: [] }),
    });

    const result = await optimizePrompt(promptInput);

    expect(result).toEqual({
      success: true,
      data: { optimizedPrompt: "Review my code", changes: [], unchanged: true },
    });
  });

  it("returns an error when the model gives an unusable reply", async () => {
    createMock().mockResolvedValue({ output_text: "not json" });

    const result = await optimizePrompt(promptInput);

    expect(result).toEqual({ success: false, error: NO_OPTIMIZATION_ERROR });
  });

  it("maps an OpenAI rate limit error to the busy message", async () => {
    createMock().mockRejectedValue(new RateLimitError(429, undefined, "Rate limit", new Headers()));

    const result = await optimizePrompt(promptInput);

    expect(result).toEqual({ success: false, error: AI_BUSY_ERROR });
  });

  it("maps other OpenAI errors to the service error message", async () => {
    createMock().mockRejectedValue(
      new InternalServerError(500, undefined, "Server error", new Headers()),
    );

    const result = await optimizePrompt(promptInput);

    expect(result).toEqual({ success: false, error: AI_SERVICE_ERROR });
  });
});
