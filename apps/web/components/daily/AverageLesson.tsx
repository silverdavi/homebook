"use client";

import { useState } from "react";
import { LessonShell, appear } from "./LessonShell";

const VALUES = [2, 7, 4, 9, 3];
const MEAN = 5;
const UNIT = 12;
const BASE = 150;
const SLOT = 52;
const BAR = 36;
const LEFT = 34;
const MOVE_AT = 1;
const MOVE_SECONDS = 1.2;

const slotX = (slot: number) => LEFT + slot * SLOT;

function MeanScene() {
  return (
    <svg
      viewBox="0 0 320 195"
      className="h-auto w-full"
      role="img"
      aria-label="Five bars of 2, 7, 4, 9 and 3 even out to five bars of 5"
    >
      <line x1="20" y1={BASE} x2="300" y2={BASE} stroke="#64748b" />
      {VALUES.map((v, i) => (
        <g key={i}>
          <rect
            x={slotX(i)}
            y={BASE - v * UNIT}
            width={BAR}
            height={v * UNIT}
            rx="4"
            fill="#818cf8"
          >
            <animate
              attributeName="height"
              from={v * UNIT}
              to={MEAN * UNIT}
              begin={`${MOVE_AT}s`}
              dur={`${MOVE_SECONDS}s`}
              fill="freeze"
            />
            <animate
              attributeName="y"
              from={BASE - v * UNIT}
              to={BASE - MEAN * UNIT}
              begin={`${MOVE_AT}s`}
              dur={`${MOVE_SECONDS}s`}
              fill="freeze"
            />
          </rect>
          <text
            x={slotX(i) + BAR / 2}
            y={BASE + 18}
            textAnchor="middle"
            fill="#cbd5e1"
            fontSize="13"
          >
            {v}
          </text>
        </g>
      ))}
      <g style={appear(MOVE_AT + MOVE_SECONDS)}>
        <line
          x1="20"
          y1={BASE - MEAN * UNIT}
          x2="300"
          y2={BASE - MEAN * UNIT}
          stroke="#fbbf24"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
        <text
          x="300"
          y={BASE - MEAN * UNIT - 8}
          textAnchor="end"
          fill="#fde68a"
          fontSize="13"
          fontWeight="700"
        >
          mean = 5
        </text>
      </g>
      <text
        x="160"
        y="190"
        textAnchor="middle"
        fill="#94a3b8"
        fontSize="12"
        style={appear(MOVE_AT + MOVE_SECONDS + 0.3)}
      >
        Share it all out equally: everyone gets 5.
      </text>
    </svg>
  );
}

function MedianScene() {
  const sorted = [...VALUES].sort((a, b) => a - b);
  const used = new Set<number>();
  const target = VALUES.map((v) => {
    const slot = sorted.findIndex((s, i) => s === v && !used.has(i));
    used.add(slot);
    return slot;
  });
  return (
    <svg
      viewBox="0 0 320 195"
      className="h-auto w-full"
      role="img"
      aria-label="The bars line up from smallest to largest; the middle one, 4, is the median"
    >
      <line x1="20" y1={BASE} x2="300" y2={BASE} stroke="#64748b" />
      {VALUES.map((v, i) => {
        const middle = target[i] === 2;
        return (
          <g key={i}>
            <animateTransform
              attributeName="transform"
              type="translate"
              from="0 0"
              to={`${slotX(target[i]) - slotX(i)} 0`}
              begin={`${MOVE_AT}s`}
              dur={`${MOVE_SECONDS}s`}
              fill="freeze"
            />
            <rect
              x={slotX(i)}
              y={BASE - v * UNIT}
              width={BAR}
              height={v * UNIT}
              rx="4"
              fill="#34d399"
            />
            {middle && (
              <rect
                x={slotX(i) - 4}
                y={BASE - v * UNIT - 4}
                width={BAR + 8}
                height={v * UNIT + 8}
                rx="6"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="3"
                style={appear(MOVE_AT + MOVE_SECONDS + 0.2)}
              />
            )}
            <text
              x={slotX(i) + BAR / 2}
              y={BASE + 18}
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="13"
            >
              {v}
            </text>
          </g>
        );
      })}
      <text
        x="160"
        y="190"
        textAnchor="middle"
        fill="#fde68a"
        fontSize="13"
        fontWeight="700"
        style={appear(MOVE_AT + MOVE_SECONDS + 0.4)}
      >
        In order: 2, 3, 4, 7, 9. Middle = 4.
      </text>
    </svg>
  );
}

const WORKERS = [30, 35, 40, 45];

function Billionaire() {
  const [ceo, setCeo] = useState(false);
  const last = ceo ? 2000 : 50;
  const all = [...WORKERS, last];
  const mean = all.reduce((a, b) => a + b, 0) / all.length;
  const median = [...all].sort((a, b) => a - b)[2];
  const cap = 60;
  const scale = 110 / cap;
  return (
    <div>
      <svg
        viewBox="0 0 320 175"
        className="h-auto w-full"
        role="img"
        aria-label={`Five incomes; mean ${mean} thousand dollars, median ${median} thousand dollars`}
      >
        <line x1="20" y1={BASE} x2="300" y2={BASE} stroke="#64748b" />
        {all.map((v, i) => {
          const over = v > cap;
          const h = Math.min(v, cap) * scale;
          return (
            <g key={i}>
              <rect
                x={slotX(i)}
                y={BASE - h}
                width={BAR}
                height={h}
                rx="4"
                fill={over ? "#f472b6" : "#818cf8"}
              />
              {over && (
                <text
                  x={slotX(i) + BAR / 2}
                  y={BASE - h - 6}
                  textAnchor="middle"
                  fill="#f9a8d4"
                  fontSize="11"
                >
                  ↑ off chart
                </text>
              )}
              <text
                x={slotX(i) + BAR / 2}
                y={BASE + 17}
                textAnchor="middle"
                fill="#cbd5e1"
                fontSize="11"
              >
                ${v}k
              </text>
            </g>
          );
        })}
        <line
          x1="20"
          y1={BASE - Math.min(mean, cap) * scale}
          x2="300"
          y2={BASE - Math.min(mean, cap) * scale}
          stroke="#fbbf24"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
        <line
          x1="20"
          y1={BASE - median * scale}
          x2="300"
          y2={BASE - median * scale}
          stroke="#34d399"
          strokeWidth="2"
        />
      </svg>
      <div className="mt-2 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg bg-amber-400/10 px-2 py-2 ring-1 ring-amber-400/40">
          <p className="text-xs font-bold uppercase text-amber-300">
            Mean (dashed)
          </p>
          <p className="font-mono text-lg text-white">${mean}k</p>
        </div>
        <div className="rounded-lg bg-emerald-400/10 px-2 py-2 ring-1 ring-emerald-400/40">
          <p className="text-xs font-bold uppercase text-emerald-300">
            Median (solid)
          </p>
          <p className="font-mono text-lg text-white">${median}k</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setCeo((c) => !c)}
        className="mt-3 w-full rounded-lg bg-pink-500 px-3 py-2 text-sm font-semibold text-white hover:bg-pink-400"
      >
        {ceo
          ? "Put the $50k worker back"
          : "Swap the $50k worker for a $2,000k CEO"}
      </button>
    </div>
  );
}

export function AverageLesson() {
  return (
    <LessonShell
      minutes={6}
      title="Two kinds of average"
      subtitle="The mean shares everything equally. The median is the middle. Press each button in order."
      tabs={[
        {
          label: "1. Mean",
          active: "bg-indigo-400 text-slate-950",
          scene: () => <MeanScene />,
          side: () => (
            <>
              <p className="text-base font-semibold text-indigo-300">
                Mean = add, then divide.
              </p>
              <p className="font-mono text-white">2 + 7 + 4 + 9 + 3 = 25</p>
              <p
                className="font-mono text-white"
                style={appear(MOVE_AT + MOVE_SECONDS)}
              >
                25 ÷ 5 numbers = 5
              </p>
              <p
                className="rounded-lg bg-slate-900 px-3 py-2 text-slate-300"
                style={appear(MOVE_AT + MOVE_SECONDS + 0.4)}
              >
                Like pouring 5 glasses into one jug and refilling them evenly.
              </p>
            </>
          ),
        },
        {
          label: "2. Median",
          active: "bg-emerald-400 text-slate-950",
          scene: () => <MedianScene />,
          side: () => (
            <>
              <p className="text-base font-semibold text-emerald-300">
                Median = the middle one.
              </p>
              <p className="text-slate-300">
                First line them up from smallest to largest.
              </p>
              <p
                className="font-mono text-white"
                style={appear(MOVE_AT + MOVE_SECONDS + 0.3)}
              >
                2, 3, <strong className="text-amber-300">4</strong>, 7, 9
              </p>
              <p
                className="rounded-lg bg-slate-900 px-3 py-2 text-slate-300"
                style={appear(MOVE_AT + MOVE_SECONDS + 0.7)}
              >
                With 5 numbers, the median is the 3rd one: 2 below it, 2 above
                it.
              </p>
            </>
          ),
        },
        {
          label: "3. Why both?",
          active: "bg-pink-400 text-slate-950",
          interactive: true,
          scene: () => <Billionaire />,
          side: () => (
            <>
              <p className="text-base font-semibold text-pink-300">
                One giant number.
              </p>
              <p className="text-slate-300">
                Five people&rsquo;s yearly pay. Press the pink button and watch
                both lines.
              </p>
              <p className="text-slate-300">
                The mean jumps to <strong className="text-white">$430k</strong>,
                but nobody there earns anything close. The median stays at{" "}
                <strong className="text-white">$40k</strong>.
              </p>
              <p className="rounded-lg bg-slate-900 px-3 py-2 text-slate-400">
                That is why news about pay usually reports the median.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
