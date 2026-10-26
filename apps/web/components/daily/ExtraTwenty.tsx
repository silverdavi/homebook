import Image from "next/image";
import { Lightbulb, Printer, Timer } from "lucide-react";
import type { Extra } from "@/lib/daily/extras";
import { ExtraQuizGame } from "./ExtraQuizGame";

interface Props {
  extra: Extra;
  number: number;
}

export function ExtraTwenty({ extra, number }: Props) {
  return (
    <section
      id="extra"
      aria-labelledby="extra-title"
      className="mt-10 mb-24 overflow-hidden rounded-2xl border-2 border-rose-200 bg-rose-50/40"
    >
      <div className="border-b border-rose-200 bg-white px-5 py-5 sm:px-6">
        <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-600">
          <Timer className="h-4 w-4" />
          Extra 20 minutes · {number} of 30 · optional, not graded
        </p>
        <h2
          id="extra-title"
          className="font-display text-2xl font-bold text-slate-900"
        >
          {extra.title}
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-700">
          {extra.hook}
        </p>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
          <Printer className="h-4 w-4" />
          The matching sheet is in the printer tray.
        </p>
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        {extra.groups.map((group) => (
          <div key={group.heading}>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-rose-700">
              {group.heading}
            </h3>
            {group.items.some((item) => item.image) ? (
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {group.items.map((item) => (
                  <li
                    key={item.name}
                    className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                  >
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={400}
                        height={400}
                        className="aspect-square w-full object-cover"
                      />
                    )}
                    <div className="px-2.5 py-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-xs leading-4 text-slate-600">
                        {item.note}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {group.items.map((item) => (
                  <li
                    key={item.name}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-sm leading-5 text-slate-600">
                      {item.note}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        <div className="rounded-xl bg-white p-4">
          <h3 className="mb-2 flex items-center gap-1.5 font-semibold text-slate-900">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Worth remembering
          </h3>
          <ul className="space-y-1.5 text-sm leading-5 text-slate-700">
            {extra.facts.map((fact) => (
              <li key={fact}>• {fact}</li>
            ))}
          </ul>
        </div>

        {extra.credit && (
          <p className="text-xs text-slate-400">{extra.credit}</p>
        )}

        <div className="rounded-xl border border-rose-200 bg-white p-4">
          <h3 className="font-semibold text-slate-900">Do it</h3>
          <p className="mt-1 text-sm leading-5 text-slate-700">{extra.doIt}</p>
        </div>

        <ExtraQuizGame extra={extra} />
      </div>
    </section>
  );
}
