"use client";

import { useState } from "react";

type Mode = "perimeter" | "area";

const cells = Array.from({ length: 12 }, (_, index) => ({
  x: 42 + (index % 4) * 58,
  y: 34 + Math.floor(index / 4) * 48,
}));

export function GeometryLesson() {
  const [mode, setMode] = useState<Mode>("perimeter");

  return (
    <section className="my-8 overflow-hidden rounded-2xl border-2 border-indigo-200 bg-slate-950 text-slate-100 shadow-paper">
      <div className="border-b border-slate-700 px-5 py-4 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">
          Watch the difference
        </p>
        <h2 className="mt-1 font-display text-xl font-bold">
          The same rectangle has a perimeter and an area
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Nothing here is assumed. Switch views until the distinction is clear.
        </p>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_220px] sm:p-6">
        <div className="rounded-xl bg-slate-900 p-3">
          <svg
            viewBox="0 0 320 210"
            role="img"
            aria-label={
              mode === "perimeter"
                ? "An animation tracing the outside edge of a four by three rectangle"
                : "An animation filling twelve square units inside a four by three rectangle"
            }
            className="h-auto w-full"
          >
            <rect
              x="42"
              y="34"
              width="232"
              height="144"
              rx="4"
              fill="#0f172a"
            />
            {mode === "area" &&
              cells.map((cell, index) => (
                <rect
                  key={`${cell.x}-${cell.y}`}
                  x={cell.x + 2}
                  y={cell.y + 2}
                  width="54"
                  height="44"
                  rx="3"
                  fill="#818cf8"
                  opacity="0"
                >
                  <animate
                    attributeName="opacity"
                    values="0;1"
                    dur="0.22s"
                    begin={`${index * 0.08}s`}
                    fill="freeze"
                  />
                </rect>
              ))}
            <rect
              x="42"
              y="34"
              width="232"
              height="144"
              rx="4"
              fill="none"
              stroke={mode === "perimeter" ? "#fbbf24" : "#c7d2fe"}
              strokeWidth={mode === "perimeter" ? "8" : "3"}
              strokeDasharray={mode === "perimeter" ? "752" : undefined}
              strokeDashoffset={mode === "perimeter" ? "752" : undefined}
            >
              {mode === "perimeter" && (
                <animate
                  attributeName="stroke-dashoffset"
                  from="752"
                  to="0"
                  dur="1.5s"
                  fill="freeze"
                />
              )}
            </rect>
            <text
              x="158"
              y="201"
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="14"
            >
              length = 4 units
            </text>
            <text
              x="18"
              y="108"
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="14"
              transform="rotate(-90 18 108)"
            >
              width = 3 units
            </text>
          </svg>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("perimeter")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === "perimeter"
                  ? "bg-amber-400 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Perimeter
            </button>
            <button
              type="button"
              onClick={() => setMode("area")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === "area"
                  ? "bg-indigo-400 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Area
            </button>
          </div>

          {mode === "perimeter" ? (
            <div className="mt-5">
              <p className="font-semibold text-amber-300">
                Trace the outside edge.
              </p>
              <p className="mt-2 font-mono text-lg">4 + 3 + 4 + 3 = 14</p>
              <p className="mt-2 text-sm text-slate-300">
                Perimeter uses ordinary units because it measures distance.
              </p>
            </div>
          ) : (
            <div className="mt-5">
              <p className="font-semibold text-indigo-300">
                Count the inside squares.
              </p>
              <p className="mt-2 font-mono text-lg">4 columns × 3 rows = 12</p>
              <p className="mt-2 text-sm text-slate-300">
                Area uses square units. It is length × width—not length ÷ width.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
