import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    verificationToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: { findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

const {
  hashToken,
  createVerificationToken,
  consumeVerificationToken,
  createPasswordResetToken,
  consumePasswordResetToken,
} = await import("@/lib/db/verification");

const FUTURE = new Date(Date.now() + 60_000);

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.verificationToken.delete.mockResolvedValue({});
  prismaMock.$transaction.mockResolvedValue([]);
});

describe("token storage", () => {
  it("stores only the hash of a verification token and returns the raw token", async () => {
    const token = await createVerificationToken("a@example.com");

    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(prismaMock.verificationToken.create).toHaveBeenCalledWith({
      data: { identifier: "a@example.com", token: hashToken(token), expires: expect.any(Date) },
    });
  });

  it("stores only the hash of a reset token under the reset prefix", async () => {
    const token = await createPasswordResetToken("a@example.com");

    expect(prismaMock.verificationToken.create).toHaveBeenCalledWith({
      data: { identifier: "reset:a@example.com", token: hashToken(token), expires: expect.any(Date) },
    });
  });
});

describe("consumeVerificationToken", () => {
  it("looks up the hashed token and verifies the email", async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue({
      identifier: "a@example.com",
      token: hashToken("raw"),
      expires: FUTURE,
    });

    expect(await consumeVerificationToken("raw")).toBe("success");
    expect(prismaMock.verificationToken.findUnique).toHaveBeenCalledWith({ where: { token: hashToken("raw") } });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { email: "a@example.com" },
      data: { emailVerified: expect.any(Date) },
    });
  });

  it("rejects a password reset token", async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue({
      identifier: "reset:a@example.com",
      token: hashToken("raw"),
      expires: FUTURE,
    });

    expect(await consumeVerificationToken("raw")).toBe("invalid");
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("returns invalid instead of throwing when the user was deleted", async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue({
      identifier: "gone@example.com",
      token: hashToken("raw"),
      expires: FUTURE,
    });
    prismaMock.$transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Record not found", { code: "P2025", clientVersion: "7" }),
    );

    expect(await consumeVerificationToken("raw")).toBe("invalid");
  });
});

describe("consumePasswordResetToken", () => {
  const record = { identifier: "reset:a@example.com", token: hashToken("raw"), expires: FUTURE };

  it("sets the password, bumps sessionVersion and verifies an unverified email", async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue(record);
    prismaMock.user.findUnique.mockResolvedValue({ emailVerified: null });

    expect(await consumePasswordResetToken("raw", "new-hash")).toBe("success");
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { email: "a@example.com" },
      data: { password: "new-hash", sessionVersion: { increment: 1 }, emailVerified: expect.any(Date) },
    });
  });

  it("leaves an existing emailVerified date alone", async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue(record);
    prismaMock.user.findUnique.mockResolvedValue({ emailVerified: new Date("2026-01-01") });

    await consumePasswordResetToken("raw", "new-hash");

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { email: "a@example.com" },
      data: { password: "new-hash", sessionVersion: { increment: 1 } },
    });
  });

  it("returns invalid for a verification (non-reset) token", async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue({ ...record, identifier: "a@example.com" });

    expect(await consumePasswordResetToken("raw", "new-hash")).toBe("invalid");
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("returns invalid when the user no longer exists", async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValue(record);
    prismaMock.user.findUnique.mockResolvedValue(null);

    expect(await consumePasswordResetToken("raw", "new-hash")).toBe("invalid");
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
