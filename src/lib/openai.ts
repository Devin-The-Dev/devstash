import OpenAI from "openai";

export const AI_MODEL = "gpt-5-nano";

// Null when unconfigured, so AI actions can report "unavailable" instead of
// failing at import time (same approach as the Redis client in rate-limit.ts).
export const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      // The SDK default is 10 minutes, far too long for an interactive button.
      timeout: 30_000,
      maxRetries: 1,
    })
  : null;
