"use client";

import { useState, type CSSProperties } from "react";
import { RotateCcw } from "lucide-react";

type Mode = "perimeter" | "area" | "try";

const CELL = 52;
const ORIGIN_X = 56;
const ORIGIN_Y = 30;
const LENGTH = 4;
const WIDTH = 3;
const RECT_W = LENGTH * CELL;
const RECT_H = WIDTH * CELL;
const TRACE_SECONDS = 2.8;
const SQUARE_SECONDS = 0.18;

const sideTimes = (() => {
  const total = 2 * (RECT_W + RECT_H);
  const sides = [RECT_W, RECT_H, RECT_W, RECT_H];
  let elapsed = 0;
  return sides.map((side) => {
    elapsed += side;
    return (elapsed / total) * TRACE_SECONDS;
  });
})();

function appear(delay: number): CSSProperties {
  return { opacity: 0, animation: `fadeIn 0.35s ease ${delay}s forwards` };
}

function GridLines({
  length,
  width,
  cell,
  x,
  y,
}: {
  length: number;
  width: number;
  cell: number;
  x: number;
  y: number;
}) {
  return (
    <g stroke="#334155" strokeWidth="1">
      {Array.from({ length: length - 1 }, (_, i) => (
        <line
          key={`v${i}`}
          x1={x + (i + 1) * cell}
          y1={y}
          x2={x + (i + 1) * cell}
          y2={y + width * cell}
        />
      ))}
      {Array.from({ length: width - 1 }, (_, i) => (
        <line
          key={`h${i}`}
          x1={x}
          y1={y + (i + 1) * cell}
          x2={x + length * cell}
          y2={y + (i + 1) * cell}
        />
      ))}
    </g>
  );
}

function PerimeterScene() {
  const labels = [
    { text: "4 cm", x: ORIGIN_X + RECT_W / 2, y: ORIGIN_Y - 10 },
    { text: "3 cm", x: ORIGIN_X + RECT_W + 30, y: ORIGIN_Y + RECT_H / 2 + 5 },
    { text: "4 cm", x: ORIGIN_X + RECT_W / 2, y: ORIGIN_Y + RECT_H + 24 },
    { text: "3 cm", x: ORIGIN_X - 30, y: ORIGIN_Y + RECT_H / 2 + 5 },
  ];
  const perimeter = 2 * (RECT_W + RECT_H);

  return (
    <svg
      viewBox="0 0 320 220"
      className="h-auto w-full"
      role="img"
      aria-label="A pencil traces the outside of a 4 cm by 3 cm rectangle, labeling each side"
    >
      <rect
        x={ORIGIN_X}
        y={ORIGIN_Y}
        width={RECT_W}
        height={RECT_H}
        fill="#0f172a"
      />
      <GridLines
        length={LENGTH}
        width={WIDTH}
        cell={CELL}
        x={ORIGIN_X}
        y={ORIGIN_Y}
      />
      <rect
        x={ORIGIN_X}
        y={ORIGIN_Y}
        width={RECT_W}
        height={RECT_H}
        fill="none"
        stroke="#fbbf24"
        strokeWidth="7"
        strokeLinejoin="round"
        strokeDasharray={perimeter}
        strokeDashoffset={perimeter}
      >
        <animate
          attributeName="stroke-dashoffset"
          from={perimeter}
          to="0"
          dur={`${TRACE_SECONDS}s`}
          fill="freeze"
        />
      </rect>
      {labels.map((label, i) => (
        <text
          key={i}
          x={label.x}
          y={label.y}
          textAnchor="middle"
          fill="#fde68a"
          fontSize="15"
          fontWeight="700"
          style={appear(sideTimes[i] - 0.15)}
        >
          {label.text}
        </text>
      ))}
    </svg>
  );
}

function AreaScene() {
  return (
    <svg
      viewBox="0 0 320 220"
      className="h-auto w-full"
      role="img"
      aria-label="Twelve 1 cm squares fill a 4 cm by 3 cm rectangle one at a time, numbered 1 to 12"
    >
      <rect
        x={ORIGIN_X}
        y={ORIGIN_Y}
        width={RECT_W}
        height={RECT_H}
        fill="#0f172a"
      />
      <GridLines
        length={LENGTH}
        width={WIDTH}
        cell={CELL}
        x={ORIGIN_X}
        y={ORIGIN_Y}
      />
      {Array.from({ length: LENGTH * WIDTH }, (_, i) => {
        const x = ORIGIN_X + (i % LENGTH) * CELL;
        const y = ORIGIN_Y + Math.floor(i / LENGTH) * CELL;
        return (
          <g key={i} style={appear(i * SQUARE_SECONDS)}>
            <rect
              x={x + 3}
              y={y + 3}
              width={CELL - 6}
              height={CELL - 6}
              rx="5"
              fill="#818cf8"
            />
            <text
              x={x + CELL / 2}
              y={y + CELL / 2 + 6}
              textAnchor="middle"
              fill="#1e1b4b"
              fontSize="17"
              fontWeight="700"
            >
              {i + 1}
            </text>
          </g>
        );
      })}
      <rect
        x={ORIGIN_X}
        y={ORIGIN_Y}
        width={RECT_W}
        height={RECT_H}
        fill="none"
        stroke="#c7d2fe"
        strokeWidth="2"
      />
      <text
        x={ORIGIN_X + RECT_W / 2}
        y={ORIGIN_Y + RECT_H + 24}
        textAnchor="middle"
        fill="#cbd5e1"
        fontSize="14"
      >
        4 cm
      </text>
      <text
        x={ORIGIN_X - 26}
        y={ORIGIN_Y + RECT_H / 2 + 5}
        textAnchor="middle"
        fill="#cbd5e1"
        fontSize="14"
      >
        3 cm
      </text>
    </svg>
  );
}

function TryIt() {
  const [length, setLength] = useState(5);
  const [width, setWidth] = useState(2);
  const cell = Math.min(36, 240 / length, 150 / width);
  const x = (320 - length * cell) / 2;
  const y = 14 + (150 - width * cell) / 2;

  return (
    <div>
      <svg
        viewBox="0 0 320 190"
        className="h-auto w-full"
        role="img"
        aria-label={`A ${length} cm by ${width} cm rectangle`}
      >
        <rect
          x={x}
          y={y}
          width={length * cell}
          height={width * cell}
          fill="#312e81"
        />
        <GridLines length={length} width={width} cell={cell} x={x} y={y} />
        <rect
          x={x}
          y={y}
          width={length * cell}
          height={width * cell}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <text x="160" y="184" textAnchor="middle" fill="#cbd5e1" fontSize="13">
          {length} cm long · {width} cm wide
        </text>
      </svg>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-300">
          Length: <span className="font-semibold text-white">{length} cm</span>
          <input
            type="range"
            min={1}
            max={8}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="mt-2 w-full"
          />
        </label>
        <label className="text-sm text-slate-300">
          Width: <span className="font-semibold text-white">{width} cm</span>
          <input
            type="range"
            min={1}
            max={5}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="mt-2 w-full"
          />
        </label>
      </div>
      <div className="mt-4 grid gap-2">
        <div className="rounded-lg bg-amber-400/10 px-3 py-2 ring-1 ring-amber-400/40">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-300">
            Perimeter
          </p>
          <p className="font-mono text-sm text-amber-100">
            {length} + {width} + {length} + {width} = {2 * (length + width)} cm
          </p>
        </div>
        <div className="rounded-lg bg-indigo-400/10 px-3 py-2 ring-1 ring-indigo-400/40">
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-300">
            Area
          </p>
          <p className="font-mono text-sm text-indigo-100">
            {length} × {width} = {length * width} cm²
          </p>
        </div>
      </div>
    </div>
  );
}

const TABS: { mode: Mode; label: string; active: string }[] = [
  {
    mode: "perimeter",
    label: "1. Around",
    active: "bg-amber-400 text-slate-950",
  },
  { mode: "area", label: "2. Inside", active: "bg-indigo-400 text-slate-950" },
  { mode: "try", label: "3. Try it", active: "bg-emerald-400 text-slate-950" },
];

export function GeometryLesson() {
  const [mode, setMode] = useState<Mode>("perimeter");
  const [replay, setReplay] = useState(0);
  const sceneKey = `${mode}-${replay}`;
  const doneAt =
    mode === "perimeter" ? TRACE_SECONDS : LENGTH * WIDTH * SQUARE_SECONDS;

  return (
    <section
      id="lesson"
      className="my-8 overflow-hidden rounded-2xl bg-slate-950 text-slate-100 shadow-paper-lg ring-1 ring-slate-800"
    >
      <div className="px-5 pt-5 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">
          Start here · about 5 minutes
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold">
          Around vs. inside
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          One rectangle, two different questions. Press each button in order.
        </p>
      </div>

      <div className="mt-4 flex gap-2 px-5 sm:px-6" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.mode}
            type="button"
            role="tab"
            aria-selected={mode === tab.mode}
            onClick={() => {
              setMode(tab.mode);
              setReplay((n) => n + 1);
            }}
            className={`flex-1 whitespace-nowrap rounded-lg px-2 py-2 text-sm font-semibold transition sm:px-3 ${
              mode === tab.mode
                ? tab.active
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_250px] sm:p-6">
        <div className="rounded-xl bg-slate-900 p-3">
          {mode === "try" ? (
            <TryIt />
          ) : (
            <>
              <div key={sceneKey}>
                {mode === "perimeter" ? <PerimeterScene /> : <AreaScene />}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setReplay((n) => n + 1)}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700"
                >
                  <RotateCcw className="h-3 w-3" />
                  Replay
                </button>
              </div>
            </>
          )}
        </div>

        <div key={sceneKey} className="space-y-3 text-sm leading-6">
          {mode === "perimeter" && (
            <>
              <p className="text-base font-semibold text-amber-300">
                Perimeter = the distance <em>around</em>.
              </p>
              <p className="text-slate-300">
                Add the 4 sides as you go around:
              </p>
              <p
                className="font-mono text-lg text-white"
                style={appear(doneAt)}
              >
                4 + 3 + 4 + 3 = 14 cm
              </p>
              <p className="rounded-lg bg-slate-900 px-3 py-2 text-slate-300">
                Real life: a <strong className="text-amber-200">fence</strong>{" "}
                around a yard.
              </p>
            </>
          )}
          {mode === "area" && (
            <>
              <p className="text-base font-semibold text-indigo-300">
                Area = the space <em>inside</em>.
              </p>
              <p className="text-slate-300">
                Each square is 1 cm². Count them:
              </p>
              <p
                className="font-mono text-lg text-white"
                style={appear(doneAt)}
              >
                12 squares = 12 cm²
              </p>
              <p className="text-slate-300" style={appear(doneAt + 0.6)}>
                Shortcut: <strong className="text-white">4 × 3 = 12</strong>.
                Length times width.
              </p>
              <p className="rounded-lg bg-slate-900 px-3 py-2 text-slate-300">
                Real life: <strong className="text-indigo-200">carpet</strong>{" "}
                covering a floor.
              </p>
            </>
          )}
          {mode === "try" && (
            <>
              <p className="text-base font-semibold text-emerald-300">
                Your turn.
              </p>
              <p className="text-slate-300">
                Drag the sliders. Watch both numbers change.
              </p>
              <p className="text-slate-300">
                Find a rectangle where the perimeter and area are the{" "}
                <strong className="text-white">same number</strong>.
              </p>
              <p className="rounded-lg bg-slate-900 px-3 py-2 text-slate-400">
                Around uses <span className="text-amber-200">cm</span>. Inside
                uses <span className="text-indigo-200">cm²</span>.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
