export function getBaseUrl() {
  const url = process.env.APP_URL;
  if (url) return url.replace(/\/$/, "");

  // A silent localhost fallback in production sent Stripe Checkout back to
  // localhost once; fail loudly instead.
  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_URL is not set");
  }
  return "http://localhost:3000";
}
