import { resend, EMAIL_FROM } from "@/lib/resend";

export async function sendPasswordResetEmail(email: string, name: string, resetUrl: string) {
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [email],
    subject: "Reset your DevStash password",
    html: `
      <p>Hi ${name},</p>
      <p>We received a request to reset your DevStash password.</p>
      <p><a href="${resetUrl}">Reset password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `,
  });

  if (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}
