import { describe, expect, it, vi, beforeEach } from "vitest";

const { authMock, signOutMock, prismaMock, bcryptMock, stripeMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  signOutMock: vi.fn(),
  prismaMock: {
    user: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
  bcryptMock: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
  stripeMock: {
    subscriptions: { cancel: vi.fn() },
  },
}));

vi.mock("@/auth", () => ({
  auth: authMock,
  signOut: signOutMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: () => stripeMock,
}));

vi.mock("bcryptjs", () => ({
  default: bcryptMock,
}));

const { changePassword, deleteAccount } = await import("@/actions/profile");

function formData(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("changePassword", () => {
  it("throws when there is no authenticated session", async () => {
    authMock.mockResolvedValue(null);

    await expect(
      changePassword(undefined, formData({ currentPassword: "a", newPassword: "b", confirmNewPassword: "b" }))
    ).rejects.toThrow("requires an authenticated session");
  });

  it("returns a validation error for mismatched new passwords", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    const result = await changePassword(
      undefined,
      formData({ currentPassword: "current", newPassword: "newpassword", confirmNewPassword: "different" })
    );

    expect(result).toEqual({ error: "Passwords do not match" });
    expect(prismaMock.user.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("rejects an incorrect current password", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({ password: "hashed" });
    bcryptMock.compare.mockResolvedValue(false);

    const result = await changePassword(
      undefined,
      formData({ currentPassword: "wrong", newPassword: "newpassword", confirmNewPassword: "newpassword" })
    );

    expect(result).toEqual({ error: "Current password is incorrect" });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("updates the password on success", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({ password: "hashed" });
    bcryptMock.compare.mockResolvedValue(true);
    bcryptMock.hash.mockResolvedValue("new-hashed");

    const result = await changePassword(
      undefined,
      formData({ currentPassword: "current", newPassword: "newpassword", confirmNewPassword: "newpassword" })
    );

    expect(result).toEqual({ success: true });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { password: "new-hashed" },
    });
  });
});

describe("deleteAccount", () => {
  it("requires a typed DELETE confirmation", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    const result = await deleteAccount(undefined, formData({ confirmation: "nope" }));

    expect(result).toEqual({ error: "Type DELETE to confirm" });
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });

  it("deletes the user and signs out on confirmation without calling Stripe when there's no subscription", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({ stripeSubscriptionId: null });

    await deleteAccount(undefined, formData({ confirmation: "DELETE" }));

    expect(stripeMock.subscriptions.cancel).not.toHaveBeenCalled();
    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: "user-1" } });
    expect(signOutMock).toHaveBeenCalledWith({ redirectTo: "/" });
  });

  it("cancels the Stripe subscription before deleting the user", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({ stripeSubscriptionId: "sub_1" });
    stripeMock.subscriptions.cancel.mockResolvedValue({ id: "sub_1", status: "canceled" });

    await deleteAccount(undefined, formData({ confirmation: "DELETE" }));

    expect(stripeMock.subscriptions.cancel).toHaveBeenCalledWith("sub_1");
    expect(stripeMock.subscriptions.cancel.mock.invocationCallOrder[0]).toBeLessThan(
      prismaMock.user.delete.mock.invocationCallOrder[0],
    );
    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: "user-1" } });
  });

  it("still deletes the user when the Stripe cancel throws", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({ stripeSubscriptionId: "sub_1" });
    stripeMock.subscriptions.cancel.mockRejectedValue(new Error("Stripe is down"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await deleteAccount(undefined, formData({ confirmation: "DELETE" }));

    expect(consoleError).toHaveBeenCalled();
    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: "user-1" } });
    expect(signOutMock).toHaveBeenCalledWith({ redirectTo: "/" });
    consoleError.mockRestore();
  });
});
