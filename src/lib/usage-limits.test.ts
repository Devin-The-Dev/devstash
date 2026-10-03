import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: { findUnique: vi.fn() },
    item: { count: vi.fn() },
    collection: { count: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

const {
  isBillingEnforced,
  getUserIsPro,
  canCreateItem,
  canCreateCollection,
  canUseProFeature,
  FREE_ITEM_LIMIT,
  FREE_COLLECTION_LIMIT,
} = await import("@/lib/usage-limits");

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function enforce() {
  vi.stubEnv("BILLING_ENFORCED", "true");
}

function asUser(isPro: boolean) {
  prismaMock.user.findUnique.mockResolvedValue({ isPro });
}

describe("isBillingEnforced", () => {
  it('is enforced when BILLING_ENFORCED is "true"', () => {
    enforce();
    expect(isBillingEnforced()).toBe(true);
  });

  it.each([undefined, "false", "1", "TRUE", "yes"])("is not enforced when BILLING_ENFORCED is %s", (value) => {
    vi.stubEnv("BILLING_ENFORCED", value);
    expect(isBillingEnforced()).toBe(false);
  });
});

describe("getUserIsPro", () => {
  it("returns the row's isPro", async () => {
    asUser(true);

    expect(await getUserIsPro("user-1")).toBe(true);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { isPro: true },
    });
  });

  it("returns false when the user row is missing", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    expect(await getUserIsPro("user-1")).toBe(false);
  });
});

describe("canCreateItem", () => {
  it("allows without querying Prisma when enforcement is off", async () => {
    expect(await canCreateItem("user-1", "File")).toEqual({ allowed: true });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.item.count).not.toHaveBeenCalled();
  });

  it.each(["Snippet", "File", "Image"])("allows Pro users any type (%s) without counting", async (type) => {
    enforce();
    asUser(true);

    expect(await canCreateItem("user-1", type)).toEqual({ allowed: true });
    expect(prismaMock.item.count).not.toHaveBeenCalled();
  });

  it("allows a free user below the item limit", async () => {
    enforce();
    asUser(false);
    prismaMock.item.count.mockResolvedValue(FREE_ITEM_LIMIT - 1);

    expect(await canCreateItem("user-1", "Snippet")).toEqual({ allowed: true });
    expect(prismaMock.item.count).toHaveBeenCalledWith({ where: { userId: "user-1" } });
  });

  it("blocks a free user at the item limit", async () => {
    enforce();
    asUser(false);
    prismaMock.item.count.mockResolvedValue(FREE_ITEM_LIMIT);

    expect(await canCreateItem("user-1", "Snippet")).toEqual({
      allowed: false,
      error: "Free plan is limited to 50 items. Upgrade to Pro for unlimited items.",
    });
  });

  it.each(["File", "Image"])("blocks %s items for free users without counting", async (type) => {
    enforce();
    asUser(false);

    expect(await canCreateItem("user-1", type)).toEqual({
      allowed: false,
      error: `${type} items require DevStash Pro`,
    });
    expect(prismaMock.item.count).not.toHaveBeenCalled();
  });
});

describe("canCreateCollection", () => {
  it("allows when enforcement is off", async () => {
    expect(await canCreateCollection("user-1")).toEqual({ allowed: true });
    expect(prismaMock.collection.count).not.toHaveBeenCalled();
  });

  it("allows Pro users", async () => {
    enforce();
    asUser(true);

    expect(await canCreateCollection("user-1")).toEqual({ allowed: true });
    expect(prismaMock.collection.count).not.toHaveBeenCalled();
  });

  it("allows a free user below the collection limit", async () => {
    enforce();
    asUser(false);
    prismaMock.collection.count.mockResolvedValue(FREE_COLLECTION_LIMIT - 1);

    expect(await canCreateCollection("user-1")).toEqual({ allowed: true });
    expect(prismaMock.collection.count).toHaveBeenCalledWith({ where: { userId: "user-1" } });
  });

  it("blocks a free user at the collection limit", async () => {
    enforce();
    asUser(false);
    prismaMock.collection.count.mockResolvedValue(FREE_COLLECTION_LIMIT);

    expect(await canCreateCollection("user-1")).toEqual({
      allowed: false,
      error: "Free plan is limited to 3 collections. Upgrade to Pro for unlimited collections.",
    });
  });
});

describe("canUseProFeature", () => {
  it("allows when enforcement is off", async () => {
    expect(await canUseProFeature("user-1", "AI tagging")).toEqual({ allowed: true });
  });

  it("allows Pro users", async () => {
    enforce();
    asUser(true);

    expect(await canUseProFeature("user-1", "AI tagging")).toEqual({ allowed: true });
  });

  it("blocks free users", async () => {
    enforce();
    asUser(false);

    expect(await canUseProFeature("user-1", "AI tagging")).toEqual({
      allowed: false,
      error: "AI tagging requires DevStash Pro",
    });
  });
});
