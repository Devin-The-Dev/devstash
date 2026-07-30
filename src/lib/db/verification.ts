import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function createVerificationToken(email: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({ data: { identifier: email, token, expires } });

  return token;
}

export type VerifyEmailResult = "success" | "expired" | "invalid";

export async function consumeVerificationToken(token: string): Promise<VerifyEmailResult> {
  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record) {
    return "invalid";
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return "expired";
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);

  return "success";
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const RESET_IDENTIFIER_PREFIX = "reset:";

export async function createPasswordResetToken(email: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  const identifier = RESET_IDENTIFIER_PREFIX + email;

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({ data: { identifier, token, expires } });

  return token;
}

async function findResetTokenRecord(token: string) {
  const record = await prisma.verificationToken.findUnique({ where: { token } });
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
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return "expired";
  }

  const email = record.identifier.slice(RESET_IDENTIFIER_PREFIX.length);

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { password: newPasswordHash },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);

  return "success";
}
