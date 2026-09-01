import { describe, expect, it, vi, beforeEach } from "vitest";

const {
  authMock,
  prismaMock,
  createItemQueryMock,
  updateItemQueryMock,
  deleteItemQueryMock,
  getSystemItemTypesMock,
  deleteFromR2Mock,
  keyFromPublicUrlMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    item: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    collection: {
      findFirst: vi.fn(),
    },
  },
  createItemQueryMock: vi.fn(),
  updateItemQueryMock: vi.fn(),
  deleteItemQueryMock: vi.fn(),
  getSystemItemTypesMock: vi.fn(),
  deleteFromR2Mock: vi.fn(),
  keyFromPublicUrlMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/db/items", () => ({
  createItem: createItemQueryMock,
  updateItem: updateItemQueryMock,
  deleteItem: deleteItemQueryMock,
  getSystemItemTypes: getSystemItemTypesMock,
}));

vi.mock("@/lib/r2", () => ({
  deleteFromR2: deleteFromR2Mock,
  keyFromPublicUrl: keyFromPublicUrlMock,
}));

const { createItem, toggleItemFavorite, toggleItemPinned, updateItem, deleteItem } = await import(
  "@/actions/items"
);

const SNIPPET_TYPE = { id: "type-snippet", name: "Snippet", icon: "code", color: "#000" };
const LINK_TYPE = { id: "type-link", name: "Link", icon: "link", color: "#000" };
const FILE_TYPE = { id: "type-file", name: "File", icon: "file", color: "#000" };
const NON_CREATABLE_TYPE = { id: "type-video", name: "Video", icon: "video", color: "#000" };

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

describe("createItem", () => {
  const validInput = {
    typeId: "type-snippet",
    collectionId: null,
    title: "useDebounce hook",
    description: null,
    content: "const x = 1;",
    url: null,
    language: "typescript",
    tags: ["react"],
  };

  it("returns an error when there is no authenticated session", async () => {
    authMock.mockResolvedValue(null);

    const result = await createItem(validInput);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(getSystemItemTypesMock).not.toHaveBeenCalled();
    expect(createItemQueryMock).not.toHaveBeenCalled();
  });

  it("returns a validation error for an empty title", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    const result = await createItem({ ...validInput, title: "  " });

    expect(result).toEqual({ success: false, error: "Title is required" });
    expect(getSystemItemTypesMock).not.toHaveBeenCalled();
    expect(createItemQueryMock).not.toHaveBeenCalled();
  });

  it("returns a validation error for an invalid url", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    const result = await createItem({ ...validInput, url: "not-a-url" });

    expect(result.success).toBe(false);
    expect(getSystemItemTypesMock).not.toHaveBeenCalled();
    expect(createItemQueryMock).not.toHaveBeenCalled();
  });

  it("returns an error for an unknown or non-creatable type id", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    getSystemItemTypesMock.mockResolvedValue([SNIPPET_TYPE, LINK_TYPE, NON_CREATABLE_TYPE]);

    const result = await createItem({ ...validInput, typeId: NON_CREATABLE_TYPE.id });

    expect(result).toEqual({ success: false, error: "Invalid item type" });
    expect(createItemQueryMock).not.toHaveBeenCalled();
  });

  it("returns an error when a link item has no url", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    getSystemItemTypesMock.mockResolvedValue([SNIPPET_TYPE, LINK_TYPE]);

    const result = await createItem({ ...validInput, typeId: LINK_TYPE.id, url: null });

    expect(result).toEqual({ success: false, error: "URL is required for link items" });
    expect(createItemQueryMock).not.toHaveBeenCalled();
  });

  it("returns an error when the collection doesn't belong to the user", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    getSystemItemTypesMock.mockResolvedValue([SNIPPET_TYPE]);
    prismaMock.collection.findFirst.mockResolvedValue(null);

    const result = await createItem({ ...validInput, collectionId: "collection-1" });

    expect(result).toEqual({ success: false, error: "Collection not found" });
    expect(prismaMock.collection.findFirst).toHaveBeenCalledWith({
      where: { id: "collection-1", userId: "user-1" },
      select: { id: true },
    });
    expect(createItemQueryMock).not.toHaveBeenCalled();
  });

  it("creates a text item and returns the detail on success", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    getSystemItemTypesMock.mockResolvedValue([SNIPPET_TYPE]);
    const created = { id: "item-1", title: "useDebounce hook" };
    createItemQueryMock.mockResolvedValue(created);

    const result = await createItem(validInput);

    expect(result).toEqual({ success: true, data: created });
    expect(createItemQueryMock).toHaveBeenCalledWith("user-1", {
      typeId: SNIPPET_TYPE.id,
      collectionId: null,
      title: "useDebounce hook",
      description: null,
      contentType: "TEXT",
      content: "const x = 1;",
      url: null,
      fileUrl: null,
      fileName: null,
      fileSize: null,
      language: "typescript",
      tags: ["react"],
    });
  });

  it("creates a link item with URL contentType and no content", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    getSystemItemTypesMock.mockResolvedValue([LINK_TYPE]);
    const created = { id: "item-2", title: "shadcn/ui" };
    createItemQueryMock.mockResolvedValue(created);

    const result = await createItem({
      ...validInput,
      typeId: LINK_TYPE.id,
      title: "shadcn/ui",
      url: "https://ui.shadcn.com",
    });

    expect(result).toEqual({ success: true, data: created });
    expect(createItemQueryMock).toHaveBeenCalledWith("user-1", {
      typeId: LINK_TYPE.id,
      collectionId: null,
      title: "shadcn/ui",
      description: null,
      contentType: "URL",
      content: null,
      url: "https://ui.shadcn.com",
      fileUrl: null,
      fileName: null,
      fileSize: null,
      language: "typescript",
      tags: ["react"],
    });
  });

  it("returns an error when a file item has no fileUrl", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    getSystemItemTypesMock.mockResolvedValue([SNIPPET_TYPE, FILE_TYPE]);

    const result = await createItem({ ...validInput, typeId: FILE_TYPE.id, content: null });

    expect(result).toEqual({ success: false, error: "A file upload is required" });
    expect(createItemQueryMock).not.toHaveBeenCalled();
  });

  it("creates a file item with FILE contentType and no text content", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    getSystemItemTypesMock.mockResolvedValue([SNIPPET_TYPE, FILE_TYPE]);
    const created = { id: "item-3", title: "Pre-deploy checklist.pdf" };
    createItemQueryMock.mockResolvedValue(created);

    const result = await createItem({
      ...validInput,
      typeId: FILE_TYPE.id,
      title: "Pre-deploy checklist.pdf",
      content: null,
      fileUrl: "https://files.example.com/user-1/abc.pdf",
      fileName: "checklist.pdf",
      fileSize: 1024,
    });

    expect(result).toEqual({ success: true, data: created });
    expect(createItemQueryMock).toHaveBeenCalledWith("user-1", {
      typeId: FILE_TYPE.id,
      collectionId: null,
      title: "Pre-deploy checklist.pdf",
      description: null,
      contentType: "FILE",
      content: null,
      url: null,
      fileUrl: "https://files.example.com/user-1/abc.pdf",
      fileName: "checklist.pdf",
      fileSize: 1024,
      language: "typescript",
      tags: ["react"],
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
    deleteItemQueryMock.mockResolvedValue({ fileUrl: null });

    const result = await deleteItem("item-1");

    expect(result).toEqual({ success: true, data: { id: "item-1" } });
    expect(deleteItemQueryMock).toHaveBeenCalledWith("user-1", "item-1");
    expect(deleteFromR2Mock).not.toHaveBeenCalled();
  });

  it("also deletes the R2 object when the item had a file", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.item.findFirst.mockResolvedValue({ id: "item-1" });
    deleteItemQueryMock.mockResolvedValue({ fileUrl: "https://files.example.com/user-1/abc.pdf" });
    keyFromPublicUrlMock.mockReturnValue("user-1/abc.pdf");
    deleteFromR2Mock.mockResolvedValue(undefined);

    const result = await deleteItem("item-1");

    expect(result).toEqual({ success: true, data: { id: "item-1" } });
    expect(keyFromPublicUrlMock).toHaveBeenCalledWith("https://files.example.com/user-1/abc.pdf");
    expect(deleteFromR2Mock).toHaveBeenCalledWith("user-1/abc.pdf");
  });
});
