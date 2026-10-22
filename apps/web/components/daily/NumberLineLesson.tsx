"use client";

import { useState } from "react";
import { LessonShell, Slider, appear, signed } from "./LessonShell";

const X0 = 20;
const X1 = 300;
const LINE_Y = 110;
const HOP_SECONDS = 0.35;

function xOf(value: number, range = 10) {
  return X0 + ((value + range) / (2 * range)) * (X1 - X0);
}

function Axis({ range = 10, every = 2 }: { range?: number; every?: number }) {
  const ticks = Array.from({ length: 2 * range + 1 }, (_, i) => i - range);
  return (
    <g>
      <line
        x1={X0 - 8}
        y1={LINE_Y}
        x2={X1 + 8}
        y2={LINE_Y}
        stroke="#94a3b8"
        strokeWidth="2"
      />
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={xOf(t, range)}
            y1={LINE_Y - (t === 0 ? 9 : 5)}
            x2={xOf(t, range)}
            y2={LINE_Y + (t === 0 ? 9 : 5)}
            stroke={t === 0 ? "#f8fafc" : "#64748b"}
            strokeWidth={t === 0 ? 2 : 1}
          />
          {t % every === 0 && (
            <text
              x={xOf(t, range)}
              y={LINE_Y + 24}
              textAnchor="middle"
              fontSize="11"
              fill={t === 0 ? "#f8fafc" : t < 0 ? "#fca5a5" : "#86efac"}
            >
              {signed(t)}
            </text>
          )}
        </g>
      ))}
    </g>
  );
}

function DirectionScene() {
  const zero = xOf(0);
  return (
    <svg
      viewBox="0 0 320 170"
      className="h-auto w-full"
      role="img"
      aria-label="A number line from −10 to 10. Right is bigger, left is smaller."
    >
      <Axis />
      <g style={appear(0.3)}>
        <line
          x1={zero + 8}
          y1={68}
          x2={X1 - 8}
          y2={68}
          stroke="#4ade80"
          strokeWidth="3"
        />
        <path
          d={`M${X1 - 10},61 L${X1 + 2},68 L${X1 - 10},75 z`}
          fill="#4ade80"
        />
        <text
          x={(zero + X1) / 2}
          y={54}
          textAnchor="middle"
          fill="#86efac"
          fontSize="13"
          fontWeight="700"
        >
          right = bigger (+)
        </text>
      </g>
      <g style={appear(1.1)}>
        <line
          x1={zero - 8}
          y1={68}
          x2={X0 + 8}
          y2={68}
          stroke="#f87171"
          strokeWidth="3"
        />
        <path
          d={`M${X0 + 10},61 L${X0 - 2},68 L${X0 + 10},75 z`}
          fill="#f87171"
        />
        <text
          x={(zero + X0) / 2}
          y={54}
          textAnchor="middle"
          fill="#fca5a5"
          fontSize="13"
          fontWeight="700"
        >
          left = smaller (−)
        </text>
      </g>
      <g style={appear(2)}>
        <circle cx={xOf(-7)} cy={LINE_Y} r="6" fill="#f87171" />
        <circle cx={xOf(-2)} cy={LINE_Y} r="6" fill="#fbbf24" />
        <text x="160" y="160" textAnchor="middle" fill="#fde68a" fontSize="12">
          −7 is smaller than −2: it is further left
        </text>
      </g>
    </svg>
  );
}

function HopScene({ start, change }: { start: number; change: number }) {
  const step = change > 0 ? 1 : -1;
  const hops = Math.abs(change);
  const end = start + change;
  const values = Array.from({ length: hops + 1 }, (_, i) =>
    xOf(start + i * step),
  );
  const color = change > 0 ? "#4ade80" : "#f87171";
  return (
    <svg
      viewBox="0 0 320 170"
      className="h-auto w-full"
      role="img"
      aria-label={`Start at ${start}, move ${hops} ${change > 0 ? "right" : "left"}, land on ${end}`}
    >
      <Axis />
      {Array.from({ length: hops }, (_, i) => {
        const a = xOf(start + i * step);
        const b = xOf(start + (i + 1) * step);
        return (
          <path
            key={i}
            d={`M${a},${LINE_Y - 6} Q${(a + b) / 2},${LINE_Y - 34} ${b},${LINE_Y - 6}`}
            fill="none"
            stroke={color}
            strokeWidth="2"
            style={appear(0.4 + i * HOP_SECONDS)}
          />
        );
      })}
      <circle cx={values[0]} cy={LINE_Y} r="7" fill="#fbbf24">
        <animate
          attributeName="cx"
          values={values.join(";")}
          begin="0.4s"
          dur={`${hops * HOP_SECONDS}s`}
          fill="freeze"
        />
      </circle>
      <text
        x={xOf(start)}
        y={56}
        textAnchor="middle"
        fill="#fde68a"
        fontSize="12"
      >
        start {signed(start)}
      </text>
      <text
        x="160"
        y="160"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="16"
        fontWeight="700"
        style={appear(0.5 + hops * HOP_SECONDS)}
      >
        {signed(start)} {change > 0 ? "+" : "−"} {Math.abs(change)} ={" "}
        {signed(end)}
      </text>
    </svg>
  );
}

function TryIt() {
  const [start, setStart] = useState(-4);
  const [change, setChange] = useState(7);
  const end = Math.max(-10, Math.min(10, start + change));
  const actualChange = end - start;
  const a = xOf(start);
  const b = xOf(end);
  return (
    <div>
      <svg
        viewBox="0 0 320 150"
        className="h-auto w-full"
        role="img"
        aria-label={`${start} plus ${actualChange} equals ${end}`}
      >
        <Axis />
        {actualChange !== 0 && (
          <path
            d={`M${a},${LINE_Y - 8} Q${(a + b) / 2},${LINE_Y - 70} ${b},${LINE_Y - 8}`}
            fill="none"
            stroke={actualChange > 0 ? "#4ade80" : "#f87171"}
            strokeWidth="3"
          />
        )}
        <circle cx={a} cy={LINE_Y} r="6" fill="#fbbf24" />
        <circle cx={b} cy={LINE_Y} r="7" fill="#ffffff" />
      </svg>
      <p className="mt-1 text-center font-mono text-lg text-white">
        {signed(start)} {actualChange >= 0 ? "+" : "−"} {Math.abs(actualChange)}{" "}
        = {signed(end)}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Slider
          label="Start"
          value={start}
          min={-10}
          max={10}
          onChange={setStart}
          format={signed}
        />
        <Slider
          label="Move"
          value={actualChange}
          min={-10 - start}
          max={10 - start}
          onChange={setChange}
          format={(v) => (v >= 0 ? `+${v} (right)` : `${signed(v)} (left)`)}
        />
      </div>
    </div>
  );
}

export function NumberLineLesson() {
  return (
    <LessonShell
      minutes={5}
      title="Through zero"
      subtitle="Negative numbers live to the left of zero. Press each button in order."
      tabs={[
        {
          label: "1. Left, right",
          active: "bg-emerald-400 text-slate-950",
          scene: () => <DirectionScene />,
          side: () => (
            <>
              <p className="text-base font-semibold text-emerald-300">
                Zero is the middle, not the bottom.
              </p>
              <p className="text-slate-300">
                Like a thermometer turned sideways: below zero is cold and still
                real.
              </p>
              <p
                className="rounded-lg bg-slate-900 px-3 py-2 text-slate-300"
                style={appear(2)}
              >
                Tricky one: <strong className="text-white">−7 &lt; −2</strong>.
                Further left is always smaller.
              </p>
            </>
          ),
        },
        {
          label: "2. Hop",
          active: "bg-amber-400 text-slate-950",
          scene: () => <HopScene start={-3} change={8} />,
          side: () => (
            <>
              <p className="text-base font-semibold text-amber-300">
                Adding moves right. Subtracting moves left.
              </p>
              <p className="text-slate-300">
                Start at −3. Add 8: hop 8 times to the right. You cross zero on
                the way.
              </p>
              <p
                className="font-mono text-lg text-white"
                style={appear(0.5 + 8 * HOP_SECONDS)}
              >
                −3 + 8 = 5
              </p>
              <p
                className="rounded-lg bg-slate-900 px-3 py-2 text-slate-300"
                style={appear(1 + 8 * HOP_SECONDS)}
              >
                Check: 3 hops get you to 0, then 5 more get you to 5.
              </p>
            </>
          ),
        },
        {
          label: "3. Try it",
          active: "bg-sky-400 text-slate-950",
          interactive: true,
          scene: () => <TryIt />,
          side: () => (
            <>
              <p className="text-base font-semibold text-sky-300">Your turn.</p>
              <p className="text-slate-300">
                Set a start and a move. Green arcs go right (+), red arcs go
                left (−).
              </p>
              <p className="text-slate-300">
                Challenge: start at <strong className="text-white">5</strong>{" "}
                and land on <strong className="text-white">−7</strong>. What
                move did you need?
              </p>
              <p className="rounded-lg bg-slate-900 px-3 py-2 text-slate-400">
                Keep the minus sign. −7 and 7 are 14 apart.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
