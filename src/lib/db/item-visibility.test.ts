import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

const { getVisibleItemsFilter } = await import("@/lib/db/item-visibility");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getVisibleItemsFilter", () => {
  it("adds no restriction for Pro users", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ isPro: true });
    expect(await getVisibleItemsFilter("user-1")).toEqual({});
  });

  it("excludes Pro-only item types for free users", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ isPro: false });
    expect(await getVisibleItemsFilter("user-1")).toEqual({
      type: { name: { notIn: ["File", "Image"] } },
    });
  });

  it("treats a missing user as free", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    expect(await getVisibleItemsFilter("user-1")).toEqual({
      type: { name: { notIn: ["File", "Image"] } },
    });
  });
});
