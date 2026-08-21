import { describe, expect, it, vi, beforeEach } from "vitest";

const { authMock, prismaMock, updateItemQueryMock, deleteItemQueryMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    item: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
  updateItemQueryMock: vi.fn(),
  deleteItemQueryMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/db/items", () => ({
  updateItem: updateItemQueryMock,
  deleteItem: deleteItemQueryMock,
}));

const { toggleItemFavorite, toggleItemPinned, updateItem, deleteItem } = await import(
  "@/actions/items"
);

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

describe("updateItem", () => {
  const validInput = {
    title: "Updated title",
    description: "Updated description",
    content: null,
    url: null,
    language: null,
    tags: ["react", "hooks"],
  };

  it("returns an error when there is no authenticated session", async () => {
    authMock.mockResolvedValue(null);

    const result = await updateItem("item-1", validInput);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(prismaMock.item.findFirst).not.toHaveBeenCalled();
    expect(updateItemQueryMock).not.toHaveBeenCalled();
  });

  it("returns a validation error for an empty title", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    const result = await updateItem("item-1", { ...validInput, title: "  " });

    expect(result).toEqual({ success: false, error: "Title is required" });
    expect(prismaMock.item.findFirst).not.toHaveBeenCalled();
    expect(updateItemQueryMock).not.toHaveBeenCalled();
  });

  it("returns a validation error for an invalid url", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    const result = await updateItem("item-1", { ...validInput, url: "not-a-url" });

    expect(result.success).toBe(false);
    expect(updateItemQueryMock).not.toHaveBeenCalled();
  });

  it("returns an error when the item doesn't belong to the user", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.item.findFirst.mockResolvedValue(null);

    const result = await updateItem("item-1", validInput);

    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(prismaMock.item.findFirst).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
      select: { id: true },
    });
    expect(updateItemQueryMock).not.toHaveBeenCalled();
  });

  it("updates the item and returns the detail on success", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.item.findFirst.mockResolvedValue({ id: "item-1" });
    const updated = { id: "item-1", title: "Updated title" };
    updateItemQueryMock.mockResolvedValue(updated);

    const result = await updateItem("item-1", validInput);

    expect(result).toEqual({ success: true, data: updated });
    expect(updateItemQueryMock).toHaveBeenCalledWith("user-1", "item-1", validInput);
  });
});

describe("deleteItem", () => {
  it("returns an error when there is no authenticated session", async () => {
    authMock.mockResolvedValue(null);

    const result = await deleteItem("item-1");

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(prismaMock.item.findFirst).not.toHaveBeenCalled();
    expect(deleteItemQueryMock).not.toHaveBeenCalled();
  });

  it("returns an error when the item doesn't belong to the user", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.item.findFirst.mockResolvedValue(null);

    const result = await deleteItem("item-1");

    expect(result).toEqual({ success: false, error: "Item not found" });
    expect(prismaMock.item.findFirst).toHaveBeenCalledWith({
      where: { id: "item-1", userId: "user-1" },
      select: { id: true },
    });
    expect(deleteItemQueryMock).not.toHaveBeenCalled();
  });

  it("deletes the item and returns its id on success", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.item.findFirst.mockResolvedValue({ id: "item-1" });
    deleteItemQueryMock.mockResolvedValue(undefined);

    const result = await deleteItem("item-1");

    expect(result).toEqual({ success: true, data: { id: "item-1" } });
    expect(deleteItemQueryMock).toHaveBeenCalledWith("user-1", "item-1");
  });
});
