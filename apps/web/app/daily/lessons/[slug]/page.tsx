import { notFound } from "next/navigation";
import Link from "next/link";
import { Markdown } from "@/components/daily/Markdown";
import { loadMarkdown } from "@/lib/daily/content/loader";
import { ArrowLeft, Beaker } from "lucide-react";

const SLUGS = [
  "gcf",
  "lcm",
  "fraction-add",
  "fraction-sub",
  "fraction-mul",
  "fraction-div",
  "fraction-inverse",
  "periodic-table-rows-1-3",
  "history-wars",
  "evolution-timeline",
] as const;

type Slug = (typeof SLUGS)[number];

const TITLES: Record<Slug, string> = {
  gcf: "Greatest Common Factor",
  lcm: "Least Common Multiple",
  "fraction-add": "Adding Fractions",
  "fraction-sub": "Subtracting Fractions",
  "fraction-mul": "Multiplying Fractions",
  "fraction-div": "Dividing Fractions",
  "fraction-inverse": "Inverses",
  "periodic-table-rows-1-3": "Periodic Table — Rows 1-3",
  "history-wars": "15 Wars",
  "evolution-timeline": "Evolution Timeline",
};

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  if (!(SLUGS as readonly string[]).includes(slug)) return {};
  return {
    title: `${TITLES[slug as Slug]} | Daily | teacher.ninja`,
  };
}

export default async function LessonPage({ params }: PageProps) {
  const { slug } = await params;
  if (!(SLUGS as readonly string[]).includes(slug)) notFound();
  const content = loadMarkdown(`lessons/${slug}.md`);

  const isFractionTopic = slug.startsWith("fraction-") || slug === "gcf" || slug === "lcm";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/daily"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          The week
        </Link>
      </div>

      {isFractionTopic && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900 flex items-start gap-2">
          <Beaker className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            For interactive practice, the{" "}
            <Link href="/fractions" className="underline font-semibold">
              Fractions Lab
            </Link>{" "}
            has live problems for this topic. Open it in a new tab and play
            with it.
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-paper">
        <Markdown content={content} />
      </div>
    </div>
  );
}
