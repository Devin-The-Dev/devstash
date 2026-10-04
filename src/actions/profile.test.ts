import { describe, expect, it, vi, beforeEach } from "vitest";

const { authMock, signOutMock, prismaMock, bcryptMock, stripeMock, checkRateLimitMock } = vi.hoisted(() => ({
  checkRateLimitMock: vi.fn(),
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

vi.mock("@/lib/rate-limit", () => ({
  changePasswordRateLimit: null,
  checkRateLimit: checkRateLimitMock,
  rateLimitMessage: () => "Too many attempts. Please try again in 15 minutes.",
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
  checkRateLimitMock.mockResolvedValue({ success: true, remaining: 4, reset: 0 });
});

describe("changePassword", () => {
  it("returns an error when there is no authenticated session", async () => {
    authMock.mockResolvedValue(null);

    const result = await changePassword(
      undefined,
      formData({ currentPassword: "a", newPassword: "b", confirmNewPassword: "b" })
    );

    expect(result).toEqual({ error: "You need to be signed in to change your password" });
  });

  it("returns the rate limit message and skips the password check when limited", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    checkRateLimitMock.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() + 60_000 });

    const result = await changePassword(
      undefined,
      formData({ currentPassword: "current", newPassword: "newpassword", confirmNewPassword: "newpassword" })
    );

    expect(result).toEqual({ error: "Too many attempts. Please try again in 15 minutes." });
    expect(prismaMock.user.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it("returns a generic error when the database throws", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.user.findUniqueOrThrow.mockRejectedValueOnce(new Error("db down"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await changePassword(
      undefined,
      formData({ currentPassword: "current", newPassword: "newpassword", confirmNewPassword: "newpassword" })
    );

    expect(result).toEqual({ error: "Something went wrong. Please try again." });
    expect(signOutMock).not.toHaveBeenCalled();
    consoleError.mockRestore();
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

  it("updates the password, invalidates sessions and signs out on success", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({ password: "hashed" });
    bcryptMock.compare.mockResolvedValue(true);
    bcryptMock.hash.mockResolvedValue("new-hashed");

    const result = await changePassword(
      undefined,
      formData({ currentPassword: "current", newPassword: "newpassword", confirmNewPassword: "newpassword" })
    );

    expect(result).toBeUndefined();
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { password: "new-hashed", sessionVersion: { increment: 1 } },
    });
    expect(signOutMock).toHaveBeenCalledWith({ redirectTo: "/sign-in?reset=changed" });
  });
});

describe("deleteAccount", () => {
  it("returns an error when there is no authenticated session", async () => {
    authMock.mockResolvedValue(null);

    const result = await deleteAccount(undefined, formData({ confirmation: "DELETE" }));

    expect(result).toEqual({ error: "You need to be signed in to delete your account" });
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });

  it("returns a generic error and doesn't sign out when the delete throws", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    prismaMock.user.findUniqueOrThrow.mockResolvedValue({ stripeSubscriptionId: null });
    prismaMock.user.delete.mockRejectedValueOnce(new Error("db down"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await deleteAccount(undefined, formData({ confirmation: "DELETE" }));

    expect(result).toEqual({ error: "Something went wrong. Please try again." });
    expect(signOutMock).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

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
