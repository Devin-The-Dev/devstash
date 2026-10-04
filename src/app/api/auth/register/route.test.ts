import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, sendVerificationEmailMock, sendAccountExistsEmailMock, createVerificationTokenMock } =
  vi.hoisted(() => ({
    prismaMock: { user: { findUnique: vi.fn(), create: vi.fn() } },
    sendVerificationEmailMock: vi.fn(),
    sendAccountExistsEmailMock: vi.fn(),
    createVerificationTokenMock: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/email/send-verification-email", () => ({ sendVerificationEmail: sendVerificationEmailMock }));
vi.mock("@/lib/email/send-account-exists-email", () => ({
  sendAccountExistsEmail: sendAccountExistsEmailMock,
}));
vi.mock("@/lib/db/verification", () => ({ createVerificationToken: createVerificationTokenMock }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: async () => ({ success: true, remaining: 2, reset: 0 }),
  getClientIp: async () => "203.0.113.7",
  rateLimitMessage: () => "",
  registerRateLimit: null,
  retryAfterSeconds: () => 1,
}));
vi.mock("bcryptjs", () => ({ default: { hash: async () => "hashed" } }));

const { POST } = await import("@/app/api/auth/register/route");

function register(body: Record<string, string>) {
  return POST(new Request("http://localhost/api/auth/register", { method: "POST", body: JSON.stringify(body) }));
}

const valid = { name: "Ada", email: "ada@example.com", password: "password123", confirmPassword: "password123" };

beforeEach(() => {
  vi.clearAllMocks();
  createVerificationTokenMock.mockResolvedValue("raw-token");
});

describe("POST /api/auth/register", () => {
  it("creates the user and sends a verification email for a new address", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const response = await register(valid);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ success: true });
    expect(sendVerificationEmailMock).toHaveBeenCalledWith(
      "ada@example.com",
      "Ada",
      expect.stringContaining("/verify-email?token=raw-token"),
    );
    expect(prismaMock.user.create).toHaveBeenCalled();
  });

  it("returns the same response for an existing address and emails the owner instead", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ name: "Ada Lovelace" });

    const response = await register(valid);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ success: true });
    expect(sendAccountExistsEmailMock).toHaveBeenCalledWith(
      "ada@example.com",
      "Ada Lovelace",
      expect.stringContaining("/sign-in"),
      expect.stringContaining("/forgot-password"),
    );
    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(sendVerificationEmailMock).not.toHaveBeenCalled();
  });
});
