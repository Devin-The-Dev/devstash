import { beforeEach, describe, expect, it, vi } from "vitest";

const { headersMock } = vi.hoisted(() => ({ headersMock: vi.fn() }));

vi.mock("next/headers", () => ({ headers: headersMock }));

const { checkRateLimit, getClientIp } = await import("@/lib/rate-limit");

function withHeaders(values: Record<string, string>) {
  headersMock.mockResolvedValue(new Headers(values));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getClientIp", () => {
  it("prefers x-real-ip over x-forwarded-for", async () => {
    withHeaders({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "198.51.100.1, 10.0.0.1" });
    expect(await getClientIp()).toBe("203.0.113.7");
  });

  it("falls back to the first x-forwarded-for entry", async () => {
    withHeaders({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" });
    expect(await getClientIp()).toBe("198.51.100.1");
  });

  it("returns null when neither header is present", async () => {
    withHeaders({});
    expect(await getClientIp()).toBeNull();
  });
});

describe("checkRateLimit", () => {
  it("skips the check when there's no identifier", async () => {
    const limiter = { limit: vi.fn() };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await checkRateLimit(limiter as any, null);

    expect(result.success).toBe(true);
    expect(limiter.limit).not.toHaveBeenCalled();
  });
});
