import { describe, expect, it, vi, beforeEach } from "vitest";

const { authMock, toggleCollectionFavoriteQueryMock, revalidatePathMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  toggleCollectionFavoriteQueryMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/db/collections", () => ({
  toggleCollectionFavorite: toggleCollectionFavoriteQueryMock,
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
}));

const { toggleCollectionFavorite } = await import("@/actions/collections");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("toggleCollectionFavorite", () => {
  it("returns an error when there is no authenticated session", async () => {
    authMock.mockResolvedValue(null);

    const result = await toggleCollectionFavorite("collection-1");

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(toggleCollectionFavoriteQueryMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("returns an error when the collection doesn't belong to the user", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    toggleCollectionFavoriteQueryMock.mockResolvedValue(null);

    const result = await toggleCollectionFavorite("collection-1");

    expect(result).toEqual({ success: false, error: "Collection not found" });
    expect(toggleCollectionFavoriteQueryMock).toHaveBeenCalledWith("user-1", "collection-1");
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("returns the new favorite state and revalidates the app shell", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    toggleCollectionFavoriteQueryMock.mockResolvedValue({ isFavorite: true });

    const result = await toggleCollectionFavorite("collection-1");

    expect(result).toEqual({ success: true, data: { isFavorite: true } });
    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
  });
});
