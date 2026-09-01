import { beforeAll, describe, expect, it } from "vitest";

let keyFromPublicUrl: (url: string) => string | null;

// R2_PUBLIC_URL is read into a module-level constant at import time, so it
// must be set before the module is first imported.
beforeAll(async () => {
  process.env.R2_PUBLIC_URL = "https://files.example.com";
  ({ keyFromPublicUrl } = await import("@/lib/r2"));
});

describe("keyFromPublicUrl", () => {
  it("strips the public URL prefix to recover the object key", () => {
    expect(keyFromPublicUrl("https://files.example.com/user-1/abc.png")).toBe("user-1/abc.png");
  });

  it("returns null for a URL from a different host", () => {
    expect(keyFromPublicUrl("https://evil.example.com/user-1/abc.png")).toBeNull();
  });

  it("returns null for the bare public URL with no key", () => {
    expect(keyFromPublicUrl("https://files.example.com")).toBeNull();
  });

  it("returns null for an unrelated string", () => {
    expect(keyFromPublicUrl("not-a-url")).toBeNull();
  });
});
