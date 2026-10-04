import { afterEach, describe, expect, it, vi } from "vitest";
import { getBaseUrl } from "@/lib/url";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getBaseUrl", () => {
  it("returns APP_URL without a trailing slash", () => {
    vi.stubEnv("APP_URL", "https://devstash.example.com/");
    expect(getBaseUrl()).toBe("https://devstash.example.com");
  });

  it("falls back to localhost outside production", () => {
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(getBaseUrl()).toBe("http://localhost:3000");
  });

  it("throws in production when APP_URL is unset", () => {
    vi.stubEnv("APP_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => getBaseUrl()).toThrow("APP_URL is not set");
  });
});
