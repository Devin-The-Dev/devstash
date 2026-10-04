import { resend, EMAIL_FROM } from "@/lib/resend";
import { escapeHtml } from "@/lib/email/escape-html";

// Sent instead of an error when someone registers with an email that already
// has an account, so the register form doesn't reveal which emails exist.
export async function sendAccountExistsEmail(
  email: string,
  name: string,
  signInUrl: string,
  resetUrl: string,
) {
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [email],
    subject: "You already have a DevStash account",
    html: `
      <p>Hi ${escapeHtml(name)},</p>
      <p>Someone tried to create a DevStash account with this email address, but you already have one.</p>
      <p><a href="${signInUrl}">Sign in</a> or, if you've forgotten your password, <a href="${resetUrl}">reset it</a>.</p>
      <p>If this wasn't you, you can ignore this email.</p>
    `,
  });

  if (error) {
    throw new Error(`Failed to send account exists email: ${error.message}`);
  }
}
