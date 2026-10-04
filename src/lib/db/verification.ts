import crypto from "crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
// Reset tokens share the VerificationToken table, told apart by this prefix.
const RESET_IDENTIFIER_PREFIX = "reset:";

// Only a SHA-256 of each token is stored, so a database or backup leak doesn't
// hand out working verification or reset links. The raw token only goes in the email.
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateToken(): { token: string; hashed: string } {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, hashed: hashToken(token) };
}

function isRecordNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

export async function createVerificationToken(email: string) {
  const { token, hashed } = generateToken();
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({ data: { identifier: email, token: hashed, expires } });

  return token;
}

export type VerifyEmailResult = "success" | "expired" | "invalid";

export async function consumeVerificationToken(token: string): Promise<VerifyEmailResult> {
  const hashed = hashToken(token);
  const record = await prisma.verificationToken.findUnique({ where: { token: hashed } });

  // A reset token shares the table but must never verify an email.
  if (!record || record.identifier.startsWith(RESET_IDENTIFIER_PREFIX)) {
    return "invalid";
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token: hashed } }).catch(() => {});
    return "expired";
  }

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { email: record.identifier },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({ where: { token: hashed } }),
    ]);
  } catch (error) {
    // The user was deleted after the email went out.
    if (isRecordNotFound(error)) {
      await prisma.verificationToken.delete({ where: { token: hashed } }).catch(() => {});
      return "invalid";
    }
    throw error;
  }

  return "success";
}

export async function createPasswordResetToken(email: string) {
  const { token, hashed } = generateToken();
  const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  const identifier = RESET_IDENTIFIER_PREFIX + email;

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({ data: { identifier, token: hashed, expires } });

  return token;
}

async function findResetTokenRecord(token: string) {
  const record = await prisma.verificationToken.findUnique({ where: { token: hashToken(token) } });
  if (!record || !record.identifier.startsWith(RESET_IDENTIFIER_PREFIX)) {
    return null;
  }
  return record;
}

export type PasswordResetTokenStatus = "valid" | "expired" | "invalid";

export async function checkPasswordResetToken(token: string): Promise<PasswordResetTokenStatus> {
  const record = await findResetTokenRecord(token);

  if (!record) {
    return "invalid";
  }

  return record.expires < new Date() ? "expired" : "valid";
}

export type ResetPasswordResult = "success" | "expired" | "invalid";

export async function consumePasswordResetToken(
  token: string,
  newPasswordHash: string,
): Promise<ResetPasswordResult> {
  const record = await findResetTokenRecord(token);

  if (!record) {
    return "invalid";
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token: record.token } }).catch(() => {});
    return "expired";
  }

  const email = record.identifier.slice(RESET_IDENTIFIER_PREFIX.length);
  const user = await prisma.user.findUnique({ where: { email }, select: { emailVerified: true } });
  if (!user) {
    await prisma.verificationToken.delete({ where: { token: record.token } }).catch(() => {});
    return "invalid";
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: {
        password: newPasswordHash,
        // Signs out every existing session.
        sessionVersion: { increment: 1 },
        // Following the emailed link proves ownership of the address, which
        // also lets the real owner reclaim an account someone else registered
        // with their email but never verified.
        ...(user.emailVerified ? {} : { emailVerified: new Date() }),
      },
    }),
    prisma.verificationToken.delete({ where: { token: record.token } }),
  ]);

  return "success";
}
