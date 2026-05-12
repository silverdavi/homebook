import { notFound } from "next/navigation";
import { getDay } from "@/lib/daily/week";
import { MorningBrief } from "@/components/daily/MorningBrief";

interface PageProps {
  params: Promise<{ date: string }>;
}

export default async function DayPage({ params }: PageProps) {
  const { date } = await params;
  const day = getDay(date);
  if (!day) notFound();

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-paper">
      <MorningBrief day={day} />
    </div>
  );
}
