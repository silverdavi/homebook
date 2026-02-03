import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  BarChart3,
  FileDown,
  BookCheck,
} from "lucide-react";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Differentiated Learning",
    description:
      "Three difficulty levels with adjustable denominator ranges so every student is challenged.",
  },
  {
    icon: Calculator,
    title: "Visual Models",
    description:
      "Fraction bars and number lines help students build conceptual understanding.",
  },
  {
    icon: FileDown,
    title: "Instant PDF",
    description:
      "Generate beautifully formatted worksheets and download as PDF in seconds.",
  },
  {
    icon: BookCheck,
    title: "Standards Aligned",
    description:
      "Problems mapped to Common Core standards for grades 3–8.",
  },
];

const TOPICS = [
  "Fractions",
  "Multiplication",
  "Division",
  "Decimals",
  "Algebra",
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <span className="font-display text-xl font-bold text-slate-800">
            teacher<span className="text-subject-math">.ninja</span>
          </span>
          <Link
            href="/generate"
            className="text-sm font-medium text-subject-math hover:text-subject-math/80 transition-colors"
          >
            Start Creating
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight tracking-tight">
            Generate beautiful, personalized{" "}
            <span className="text-subject-math">worksheets</span> in seconds
          </h1>
          <p className="mt-6 text-lg text-slate-500 leading-relaxed max-w-lg">
            Create differentiated math worksheets with answer keys, visual
            models, and hints — tailored to each student&apos;s level.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/generate"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-subject-math px-6 py-3 text-base font-medium text-white shadow-paper hover:shadow-paper-md hover:bg-subject-math/90 transition-all duration-200 active:scale-[0.98]"
            >
              Start Creating
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {TOPICS.map((topic, i) => (
              <span
                key={topic}
                className={`inline-flex items-center gap-1.5 text-sm ${i === 0 ? "text-subject-math font-medium" : "text-slate-400"}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-subject-math" : "bg-slate-300"}`}
                />
                {topic}
                {i === 0 && (
                  <span className="text-[10px] bg-subject-math-light text-subject-math px-1.5 py-0.5 rounded-full font-medium">
                    NEW
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900 text-center">
            Everything you need for great worksheets
          </h2>
          <p className="mt-3 text-center text-slate-500 max-w-lg mx-auto">
            Built by teachers, for teachers. Focus on teaching while we handle
            the worksheet creation.
          </p>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl bg-white border border-slate-200 p-6 shadow-paper hover:shadow-paper-md transition-shadow duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-subject-math-light flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-subject-math" />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-slate-800">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-sm font-bold text-slate-400">
            teacher<span className="text-slate-300">.ninja</span>
          </span>
          <p className="text-xs text-slate-400">
            Built with care for educators everywhere.
          </p>
        </div>
      </footer>
    </div>
  );
}
