import { resend, EMAIL_FROM } from "@/lib/resend";

export async function sendVerificationEmail(email: string, name: string, verifyUrl: string) {
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [email],
    subject: "Verify your DevStash email",
    html: `
      <p>Hi ${name},</p>
      <p>Confirm your email address to finish setting up your DevStash account.</p>
      <p><a href="${verifyUrl}">Verify email address</a></p>
      <p>This link expires in 24 hours. If you didn't create a DevStash account, you can ignore this email.</p>
    `,
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}
