/**
 * Daily — bug-report email pipeline.
 *
 * When Adam clicks "Report a problem" anywhere in the daily app, this is
 * the path the report takes:
 *
 *   client form → POST /daily/api/bug → buildBugEmail() → sendEmail()
 *
 * Recipient is hard-coded (parent-only) so the kid can submit without
 * exposing email selection in the UI.
 */

import "server-only";
import { sendEmail, type SendEmailResult } from "./email";
import { saveBugReport as persistBugReport } from "@/lib/db";

export const BUG_REPORT_TO = ["silverdavi@gmail.com"] as const;

export interface BugReportInput {
  /** What Adam typed. Required. */
  message: string;
  /** Optional category radio: layout / wrong-answer / typo / stuck / other. */
  category?: string;
  /** The page he was on. Comes from window.location, not user input. */
  pageUrl?: string;
  /** His user-agent for diagnostics. */
  userAgent?: string;
  /** His profile name + id, if logged in. */
  profileName?: string;
  profileId?: string;
  /** Date being viewed, e.g. "2026-05-12". */
  date?: string;
  /** Exam version if relevant: "a" or "b". */
  version?: "a" | "b";
}

export interface BugReportEmail {
  subject: string;
  html: string;
  text: string;
}

function escape(html: string): string {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildBugEmail(input: BugReportInput): BugReportEmail {
  const who = input.profileName
    ? `${input.profileName}${input.profileId ? ` (${input.profileId})` : ""}`
    : "anonymous";
  const cat = input.category ? input.category : "(uncategorized)";
  const subjectBits = ["Daily bug report", who];
  if (input.date) subjectBits.push(input.date);
  if (input.category) subjectBits.push(`[${input.category}]`);
  const subject = subjectBits.join(" — ");

  const sentAt = new Date().toISOString();

  const text = [
    `Daily app — bug report`,
    `From: ${who}`,
    `Date: ${input.date ?? "(none)"}${input.version ? ` (version ${input.version.toUpperCase()})` : ""}`,
    `Category: ${cat}`,
    `Page: ${input.pageUrl ?? "(unknown)"}`,
    `User-agent: ${input.userAgent ?? "(unknown)"}`,
    `Submitted: ${sentAt}`,
    ``,
    `Message:`,
    input.message,
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
    <div style="padding:20px 24px;background:#fef2f2;border-bottom:1px solid #fecaca;">
      <div style="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#dc2626;font-weight:700;margin-bottom:2px;">Daily app — bug report</div>
      <div style="font-size:18px;font-weight:600;color:#0f172a;">${escape(who)}${input.date ? ` · ${escape(input.date)}` : ""}${input.version ? ` · v${input.version.toUpperCase()}` : ""}</div>
    </div>
    <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
      <div style="font-size:11px;text-transform:uppercase;color:#9ca3af;font-weight:600;letter-spacing:.04em;margin-bottom:6px;">Message</div>
      <div style="font-size:15px;line-height:1.55;color:#111827;white-space:pre-wrap;">${escape(input.message)}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tbody>
        ${row("Category", cat)}
        ${row("Page", input.pageUrl ?? "(unknown)")}
        ${row("User-agent", input.userAgent ?? "(unknown)")}
        ${row("Submitted", sentAt)}
      </tbody>
    </table>
    <div style="padding:14px 24px;background:#f9fafb;color:#9ca3af;font-size:12px;">
      Sent by the daily-trial bug-report button. Adam does not see the recipient address.
    </div>
  </div>
</body></html>`;

  return { subject, html, text };
}

function row(label: string, value: string): string {
  return `
        <tr>
          <td style="padding:8px 24px;border-bottom:1px solid #f3f4f6;color:#6b7280;width:120px;vertical-align:top;">${escape(label)}</td>
          <td style="padding:8px 24px;border-bottom:1px solid #f3f4f6;color:#111827;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all;">${escape(value)}</td>
        </tr>`;
}

export interface SendBugReportResult {
  ok: boolean;
  email?: SendEmailResult;
  error?: string;
}

export async function sendBugReport(
  input: BugReportInput,
  to: readonly string[] = BUG_REPORT_TO,
): Promise<SendBugReportResult> {
  let emailOk = false;
  let emailResult: SendEmailResult | undefined;
  let emailError: string | undefined;
  try {
    const { subject, html, text } = buildBugEmail(input);
    emailResult = await sendEmail({ to: [...to], subject, html, text });
    emailOk = emailResult.ok;
    emailError = emailResult.error;
  } catch (err) {
    emailError = err instanceof Error ? err.message : String(err);
  }

  // Persist the report regardless of email status — this is the queryable
  // store so we don't lose reports if Resend is down or rate-limits us.
  try {
    persistBugReport({
      message: input.message,
      category: input.category,
      pageUrl: input.pageUrl,
      userAgent: input.userAgent,
      profileName: input.profileName,
      profileId: input.profileId,
      date: input.date,
      version: input.version,
      emailOk,
      emailError,
    });
  } catch (err) {
    // Don't let a DB failure mask the email outcome — log and continue.
    console.error(
      "[bug-report] failed to persist bug report:",
      err instanceof Error ? err.message : err,
    );
  }

  if (emailOk) {
    return { ok: true, email: emailResult };
  }
  return { ok: false, email: emailResult, error: emailError };
}
