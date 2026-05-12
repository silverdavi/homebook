/**
 * Daily — Resend email client (server-only).
 *
 * Wraps the Resend REST API. The API key comes from RESEND_API_KEY (env or
 * fallback file). Caller passes recipient(s), subject, and HTML body.
 */

import "server-only";
import { getEnv } from "./env";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export interface SendEmailArgs {
  from?: string;
  to: string[];
  subject: string;
  html: string;
  /** Optional plain-text fallback. */
  text?: string;
}

export interface SendEmailResult {
  id: string | null;
  ok: boolean;
  error?: string;
}

/**
 * Send an email via Resend. Default `from` is the Resend onboarding sender
 * which works without DNS verification.
 */
export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const key = getEnv("RESEND_API_KEY");
  if (!key) {
    return { id: null, ok: false, error: "RESEND_API_KEY not set" };
  }
  const from = args.from ?? "Daily Trial <onboarding@resend.dev>";
  const body = {
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    ...(args.text ? { text: args.text } : {}),
  };
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        id: null,
        ok: false,
        error: `resend ${res.status}: ${text.slice(0, 300)}`,
      };
    }
    const data = (await res.json().catch(() => null)) as
      | { id?: string }
      | null;
    return { id: data?.id ?? null, ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { id: null, ok: false, error: msg };
  }
}
