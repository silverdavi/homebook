/**
 * Daily — OpenAI Chat Completions client (server-only).
 *
 * Minimal fetch-based wrapper. We avoid the SDK to keep dependencies tight
 * and to make it easy to fall back to Gemini later if needed.
 */

import "server-only";
import { getEnv } from "./env";

const ENDPOINT = "https://api.openai.com/v1/chat/completions";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatArgs {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  /** Hard cap on output tokens. Default 800. */
  maxTokens?: number;
}

export interface ChatResult {
  ok: boolean;
  text: string;
  error?: string;
}

export async function chatComplete(args: ChatArgs): Promise<ChatResult> {
  const key = getEnv("OPENAI_API_KEY");
  if (!key) {
    return { ok: false, text: "", error: "OPENAI_API_KEY not set" };
  }
  const model = args.model ?? "gpt-4o-mini";
  const body = {
    model,
    messages: args.messages,
    temperature: args.temperature ?? 0.4,
    max_tokens: args.maxTokens ?? 800,
  };
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        text: "",
        error: `openai ${res.status}: ${text.slice(0, 300)}`,
      };
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    return { ok: true, text };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, text: "", error: msg };
  }
}
