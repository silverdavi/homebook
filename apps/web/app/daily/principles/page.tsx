import { Markdown } from "@/components/daily/Markdown";
import { loadMarkdown } from "@/lib/daily/content/loader";

export const metadata = {
  title: "The trial | Daily | teacher.ninja",
};

export default function PrinciplesPage() {
  const content = loadMarkdown("ADAM-PRINCIPLES.md");
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-paper">
      <Markdown content={content} />
    </div>
  );
}
