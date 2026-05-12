"use client";

import { useEffect, useState } from "react";
import { useProfile } from "@/lib/games/profile-context";

const CATEGORIES: Array<{ id: string; label: string }> = [
  { id: "wrong-answer", label: "I think a question is graded wrong" },
  { id: "stuck", label: "Something on the page won't work" },
  { id: "typo", label: "Typo or wrong info in a lesson" },
  { id: "layout", label: "The layout looks broken" },
  { id: "other", label: "Other" },
];

interface Props {
  /** Optional: prefill the date metadata (e.g. on a /daily/[date] page). */
  date?: string;
  /** Optional: prefill the exam version (e.g. inside an exam). */
  version?: "a" | "b";
}

/**
 * Floating "Report a problem" button visible across every daily page.
 *
 * Adam clicks it, types what's wrong, hits send. The report lands in
 * silverdavi@gmail.com via Resend with full page-URL + user-agent context.
 *
 * Designed to be aggressively visible and impossible to miss — fixed
 * bottom-right corner, with a contrasting color, so the kid never has to
 * hunt for help.
 */
export function BugReportButton({ date, version }: Props) {
  const { profile } = useProfile();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "sent" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const reset = () => {
    setCategory("");
    setMessage("");
    setStatus({ kind: "idle" });
    setSubmitting(false);
  };

  const submit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    setStatus({ kind: "idle" });
    try {
      const res = await fetch("/daily/api/bug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          category: category || undefined,
          pageUrl:
            typeof window !== "undefined" ? window.location.href : undefined,
          profileName: profile?.name,
          profileId: profile?.id,
          date,
          version,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setStatus({
          kind: "error",
          message: body?.error ?? `HTTP ${res.status}`,
        });
        setSubmitting(false);
        return;
      }
      setStatus({ kind: "sent" });
      setSubmitting(false);
      // Auto-close after 2.5s so the user sees the confirmation.
      setTimeout(() => {
        setOpen(false);
        reset();
      }, 2500);
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-200 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2"
        aria-label="Report a problem"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="13" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        Report a problem
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end bg-slate-900/40 p-4 sm:items-center sm:justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bug-report-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setOpen(false);
              reset();
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="bug-report-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Report a problem
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  This goes straight to your dad. Don&apos;t use it to ask
                  for help on a question — write that in the note next to
                  the question instead. Use this for things that look
                  broken.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="block text-sm font-medium text-slate-700">
                  What kind of problem?
                </span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  disabled={submitting || status.kind === "sent"}
                >
                  <option value="">Pick one…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block text-sm font-medium text-slate-700">
                  Describe what happened
                </span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What were you doing? What went wrong? Be specific."
                  rows={5}
                  maxLength={4000}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  disabled={submitting || status.kind === "sent"}
                />
                <div className="mt-1 text-xs text-slate-400">
                  {message.length} / 4000
                </div>
              </label>

              {status.kind === "error" && (
                <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                  Couldn&apos;t send: {status.message}
                </div>
              )}
              {status.kind === "sent" && (
                <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                  Sent. Closing in a moment.
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={
                  submitting ||
                  !message.trim() ||
                  status.kind === "sent"
                }
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Sending…" : "Send report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
