import { beforeEach, describe, expect, it, vi } from "vitest";
import * as z from "zod";

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/auth", () => ({ auth: authMock }));

import { firstIssue, GENERIC_ACTION_ERROR, runAction, runUserAction } from "./action-result";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("runAction", () => {
  it("returns the generic error when the body throws", async () => {
    const result = await runAction("test", async () => {
      throw new Error("db down");
    });
    expect(result).toEqual({ success: false, error: GENERIC_ACTION_ERROR });
  });

  it("uses the fallback error when one is given", async () => {
    const result = await runAction(
      "test",
      async () => {
        throw new Error("stripe down");
      },
      "Could not start checkout",
    );
    expect(result).toEqual({ success: false, error: "Could not start checkout" });
  });
});

describe("runUserAction", () => {
  it("returns Unauthorized without calling the body when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const body = vi.fn();

    const result = await runUserAction("test", body);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(body).not.toHaveBeenCalled();
  });

  it("passes the user id to the body", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    const result = await runUserAction("test", async (userId) => ({
      success: true,
      data: userId,
    }));

    expect(result).toEqual({ success: true, data: "user-1" });
  });
});

describe("firstIssue", () => {
  it("returns the first issue's message", () => {
    const parsed = z.string().min(3, "Too short").safeParse("a");
    expect(firstIssue(parsed.error!)).toBe("Too short");
  });

  it("falls back when there are no issues", () => {
    expect(firstIssue(new z.ZodError([]), "Type DELETE to confirm")).toBe("Type DELETE to confirm");
  });
});
