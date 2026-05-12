import type { Metadata } from "next";
import Link from "next/link";
import { DailyProviders } from "./DailyProviders";
import { BugReportButton } from "@/components/daily/BugReportButton";

export const metadata: Metadata = {
  title: "Daily — Independent homeschool trial | teacher.ninja",
  description:
    "A four-day, fully self-driven homeschool trial covering fractions, the periodic table, history, and biology.",
};

export default function DailyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DailyProviders>
      <div className="min-h-screen bg-slate-50/40">
        <nav className="border-b border-slate-100 bg-white">
          <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
            <Link
              href="/daily"
              className="font-display text-xl font-bold text-slate-800"
            >
              Daily<span className="text-indigo-600">.</span>
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link
                href="/daily/principles"
                className="text-slate-500 hover:text-slate-700"
              >
                The trial
              </Link>
              <Link
                href="/fractions"
                className="text-slate-500 hover:text-slate-700"
              >
                Fractions Lab
              </Link>
              <Link
                href="/games/progress"
                className="text-slate-500 hover:text-slate-700"
              >
                Profile
              </Link>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-3xl px-6 py-8 md:py-12">
          {children}
        </main>
        <BugReportButton />
      </div>
    </DailyProviders>
  );
}
