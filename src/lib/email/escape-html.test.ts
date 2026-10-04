import { describe, expect, it } from "vitest";
import { escapeHtml } from "@/lib/email/escape-html";

describe("escapeHtml", () => {
  it("escapes markup characters", () => {
    expect(escapeHtml(`<a href="x">Tom & 'Jerry'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;",
    );
  });

  it("leaves plain text unchanged", () => {
    expect(escapeHtml("Demo User")).toBe("Demo User");
  });
});
