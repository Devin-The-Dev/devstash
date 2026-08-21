import { describe, expect, it, vi, beforeEach } from "vitest";

const { authMock, prismaMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    item: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

const { toggleItemFavorite, toggleItemPinned } = await import("@/actions/items");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("toggleItemFavorite", () => {
  it("returns an error when there is no authenticated session", async () => {
    authMock.mockResolvedValue(null);

    const result = await toggleItemFavorite("item-1");

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(prismaMock.item.findFirst).not.toHaveBeenCalled();
  });

  it("returns an error when the item doesn't belong to the user", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.item.findFirst.mockResolvedValue(null);

    const result = await toggleItemFavorite("item-1");

    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(prismaMock.item.findFirst).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
      select: { isFavorite: true },
    });
    expect(prismaMock.item.update).not.toHaveBeenCalled();
  });

  it("flips isFavorite from false to true", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.item.findFirst.mockResolvedValue({ isFavorite: false });
    prismaMock.item.update.mockResolvedValue({ isFavorite: true });

    const result = await toggleItemFavorite("item-1");

    expect(result).toEqual({ success: true, data: { isFavorite: true } });
    expect(prismaMock.item.update).toHaveBeenCalledWith({
      where: { id: "item-1" },
      data: { isFavorite: true },
      select: { isFavorite: true },
    });
  });

  it("flips isFavorite from true to false", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.item.findFirst.mockResolvedValue({ isFavorite: true });
    prismaMock.item.update.mockResolvedValue({ isFavorite: false });

    const result = await toggleItemFavorite("item-1");

    expect(result).toEqual({ success: true, data: { isFavorite: false } });
    expect(prismaMock.item.update).toHaveBeenCalledWith({
      where: { id: "item-1" },
      data: { isFavorite: false },
      select: { isFavorite: true },
    });
  });
});

describe("toggleItemPinned", () => {
  it("returns an error when there is no authenticated session", async () => {
    authMock.mockResolvedValue(null);

    const result = await toggleItemPinned("item-1");

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(prismaMock.item.findFirst).not.toHaveBeenCalled();
  });

  it("returns an error when the item doesn't belong to the user", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.item.findFirst.mockResolvedValue(null);

    const result = await toggleItemPinned("item-1");

    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(prismaMock.item.update).not.toHaveBeenCalled();
  });

  it("flips isPinned from false to true", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.item.findFirst.mockResolvedValue({ isPinned: false });
    prismaMock.item.update.mockResolvedValue({ isPinned: true });

    const result = await toggleItemPinned("item-1");

    expect(result).toEqual({ success: true, data: { isPinned: true } });
    expect(prismaMock.item.update).toHaveBeenCalledWith({
      where: { id: "item-1" },
      data: { isPinned: true },
      select: { isPinned: true },
    });
  });
});
