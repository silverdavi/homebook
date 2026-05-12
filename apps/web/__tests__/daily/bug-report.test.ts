import { describe, expect, it } from "vitest";
import { buildBugEmail } from "@/lib/daily/bug-report";

describe("bug-report email", () => {
  it("includes the user message verbatim", () => {
    const e = buildBugEmail({
      message: "Question 5 says 1939 is wrong but it is right",
    });
    expect(e.subject).toContain("Daily bug report");
    expect(e.html).toContain(
      "Question 5 says 1939 is wrong but it is right",
    );
    expect(e.text).toContain(
      "Question 5 says 1939 is wrong but it is right",
    );
  });

  it("includes profile, date, and version when supplied", () => {
    const e = buildBugEmail({
      message: "broken",
      profileName: "Adam",
      profileId: "abc123",
      date: "2026-05-12",
      version: "a",
    });
    expect(e.subject).toContain("Adam");
    expect(e.subject).toContain("2026-05-12");
    expect(e.html).toContain("Adam");
    expect(e.html).toContain("vA");
  });

  it("falls back to anonymous when no profile", () => {
    const e = buildBugEmail({ message: "no login still wants to report" });
    expect(e.subject).toContain("anonymous");
  });

  it("escapes HTML in the message", () => {
    const e = buildBugEmail({
      message: '<script>alert("xss")</script> & "quoted"',
    });
    expect(e.html).not.toContain("<script>");
    expect(e.html).toContain("&lt;script&gt;");
    expect(e.html).toContain("&amp;");
    expect(e.html).toContain("&quot;quoted&quot;");
  });

  it("escapes HTML in metadata", () => {
    const e = buildBugEmail({
      message: "x",
      profileName: "<b>Adam</b>",
      pageUrl: "https://teacher.ninja/daily?<x>",
      userAgent: "Mozilla & Co",
    });
    expect(e.html).toContain("&lt;b&gt;Adam&lt;/b&gt;");
    expect(e.html).toContain("&lt;x&gt;");
    expect(e.html).toContain("Mozilla &amp; Co");
  });

  it("preserves multi-line messages with white-space:pre-wrap", () => {
    const e = buildBugEmail({ message: "line1\nline2\nline3" });
    expect(e.html).toMatch(/white-space:pre-wrap/);
    // Confirm the newlines are preserved, not stripped or doubled.
    expect(e.html).toContain("line1\nline2\nline3");
  });

  it("includes a category badge in subject when provided", () => {
    const e = buildBugEmail({
      message: "x",
      category: "wrong-answer",
    });
    expect(e.subject).toContain("[wrong-answer]");
  });
});
