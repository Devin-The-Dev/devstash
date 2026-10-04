import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, searchItemsQueryMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  searchItemsQueryMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/db/items", () => ({ searchItems: searchItemsQueryMock }));

const { searchItems } = await import("@/actions/search");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("searchItems", () => {
  it("returns an error when there is no authenticated session", async () => {
    authMock.mockResolvedValue(null);

    expect(await searchItems("hook")).toEqual({ success: false, error: "Unauthorized" });
    expect(searchItemsQueryMock).not.toHaveBeenCalled();
  });

  it("searches the current user's items", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    const results = [{ id: "item-1", title: "useDebounce hook" }];
    searchItemsQueryMock.mockResolvedValue(results);

    expect(await searchItems("hook")).toEqual({ success: true, data: results });
    expect(searchItemsQueryMock).toHaveBeenCalledWith("user-1", "hook");
  });

  it("rejects a non-string or overly long query", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    expect(await searchItems(42)).toEqual({ success: false, error: "Invalid search" });
    expect(await searchItems("x".repeat(201))).toEqual({ success: false, error: "Invalid search" });
  });
});
