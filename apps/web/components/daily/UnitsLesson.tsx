"use client";

import { useState, type CSSProperties } from "react";
import { Check, RotateCcw, X } from "lucide-react";

type Mode = "grow" | "per" | "decide";

const S = 24;
const ISO = 0.866;
const OX = 150;
const OY = 62;
const LINE_SECONDS = 0.9;
const CUBE_SECONDS = 0.07;
const FLOOR_START = 1.3;
const LAYER = 12;
const TOP_START = FLOOR_START + LAYER * CUBE_SECONDS + 0.7;
const TRIP_SECONDS = 2.4;

function appear(delay: number): CSSProperties {
  return { opacity: 0, animation: `fadeIn 0.35s ease ${delay}s forwards` };
}

function project(x: number, y: number, z: number): [number, number] {
  return [OX + (x - y) * ISO * S, OY + (x + y) * 0.5 * S - z * S];
}

function points(corners: [number, number, number][]): string {
  return corners.map((c) => project(...c).join(",")).join(" ");
}

function Cube({ x, y, z }: { x: number; y: number; z: number }) {
  return (
    <g stroke="#1e1b4b" strokeWidth="1" strokeLinejoin="round">
      <polygon
        fill="#a5b4fc"
        points={points([
          [x, y, z + 1],
          [x + 1, y, z + 1],
          [x + 1, y + 1, z + 1],
          [x, y + 1, z + 1],
        ])}
      />
      <polygon
        fill="#6366f1"
        points={points([
          [x + 1, y, z],
          [x + 1, y + 1, z],
          [x + 1, y + 1, z + 1],
          [x + 1, y, z + 1],
        ])}
      />
      <polygon
        fill="#4338ca"
        points={points([
          [x, y + 1, z],
          [x + 1, y + 1, z],
          [x + 1, y + 1, z + 1],
          [x, y + 1, z + 1],
        ])}
      />
    </g>
  );
}

function GrowScene() {
  const cubes: { x: number; y: number; z: number; delay: number }[] = [];
  for (let z = 0; z < 2; z++) {
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 4; x++) {
        const order = y * 4 + x;
        const start = z === 0 ? FLOOR_START : TOP_START;
        cubes.push({ x, y, z, delay: start + order * CUBE_SECONDS });
      }
    }
  }
  cubes.sort((a, b) => a.x + a.y + a.z - (b.x + b.y + b.z) || a.z - b.z);

  const [lx1, ly1] = project(0, 3, 0);
  const [lx2, ly2] = project(4, 3, 0);
  const lineLength = Math.hypot(lx2 - lx1, ly2 - ly1);
  const [fourX, fourY] = project(2, 3, 0);
  const [threeX, threeY] = project(4, 1.5, 0);
  const [twoX, twoY] = project(0, 3, 1);

  return (
    <svg
      viewBox="20 0 270 165"
      className="h-auto w-full"
      role="img"
      aria-label="A 4 cm line grows into a flat floor of 12 squares, then a box of 24 cubes"
    >
      {cubes.map((c) => (
        <g key={`${c.x}-${c.y}-${c.z}`} style={appear(c.delay)}>
          <Cube x={c.x} y={c.y} z={c.z} />
        </g>
      ))}
      <line
        x1={lx1}
        y1={ly1}
        x2={lx2}
        y2={ly2}
        stroke="#fbbf24"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={lineLength}
        strokeDashoffset={lineLength}
      >
        <animate
          attributeName="stroke-dashoffset"
          from={lineLength}
          to="0"
          dur={`${LINE_SECONDS}s`}
          fill="freeze"
        />
      </line>
      <text
        x={fourX - 16}
        y={fourY + 22}
        textAnchor="middle"
        fill="#fde68a"
        fontSize="14"
        fontWeight="700"
        style={appear(LINE_SECONDS - 0.2)}
      >
        4 cm
      </text>
      <text
        x={threeX + 26}
        y={threeY + 16}
        textAnchor="middle"
        fill="#c7d2fe"
        fontSize="14"
        fontWeight="700"
        style={appear(FLOOR_START)}
      >
        3 cm
      </text>
      <text
        x={twoX - 26}
        y={twoY + 4}
        textAnchor="middle"
        fill="#e9d5ff"
        fontSize="14"
        fontWeight="700"
        style={appear(TOP_START)}
      >
        2 cm
      </text>
    </svg>
  );
}

function PerScene() {
  const x0 = 30;
  const x1 = 290;
  const mid = (x0 + x1) / 2;
  const y = 92;

  return (
    <svg
      viewBox="0 0 320 220"
      className="h-auto w-full"
      role="img"
      aria-label="A car drives 120 km in 2 hours; the road splits into two equal 60 km parts, one for each hour"
    >
      <text x="160" y="34" textAnchor="middle" fill="#e2e8f0" fontSize="15">
        120 km in 2 hours
      </text>
      <rect
        x={x0}
        y={y - 9}
        width={x1 - x0}
        height="18"
        rx="9"
        fill="#334155"
      />
      <line
        x1={x0 + 6}
        y1={y}
        x2={x1 - 6}
        y2={y}
        stroke="#94a3b8"
        strokeWidth="2"
        strokeDasharray="8 8"
      />
      <circle cx={x0} cy={y} r="11" fill="#34d399">
        <animate
          attributeName="cx"
          from={x0}
          to={x1}
          dur={`${TRIP_SECONDS}s`}
          fill="freeze"
        />
      </circle>
      <g style={appear(TRIP_SECONDS + 0.2)}>
        <line
          x1={mid}
          y1={y - 26}
          x2={mid}
          y2={y + 26}
          stroke="#fbbf24"
          strokeWidth="3"
        />
        <rect
          x={x0}
          y={y + 34}
          width={mid - x0 - 6}
          height="44"
          rx="8"
          fill="#064e3b"
        />
        <rect
          x={mid + 6}
          y={y + 34}
          width={x1 - mid - 6}
          height="44"
          rx="8"
          fill="#064e3b"
        />
        <text
          x={(x0 + mid) / 2}
          y={y + 52}
          textAnchor="middle"
          fill="#a7f3d0"
          fontSize="12"
        >
          hour 1
        </text>
        <text
          x={(x0 + mid) / 2}
          y={y + 70}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="15"
          fontWeight="700"
        >
          60 km
        </text>
        <text
          x={(mid + x1) / 2}
          y={y + 52}
          textAnchor="middle"
          fill="#a7f3d0"
          fontSize="12"
        >
          hour 2
        </text>
        <text
          x={(mid + x1) / 2}
          y={y + 70}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="15"
          fontWeight="700"
        >
          60 km
        </text>
      </g>
      <text
        x="160"
        y="204"
        textAnchor="middle"
        fill="#fde68a"
        fontSize="15"
        fontWeight="700"
        style={appear(TRIP_SECONDS + 0.9)}
      >
        60 km for each 1 hour = 60 km/h
      </text>
    </svg>
  );
}

interface Choice {
  label: string;
  result: string;
  correct: boolean;
  why: string;
}

interface Puzzle {
  story: string;
  want: string;
  choices: Choice[];
}

const PUZZLES: Puzzle[] = [
  {
    story:
      "A block has a mass of 24 g and a volume of 6 cm³. Find its density.",
    want: "g/cm³",
    choices: [
      {
        label: "24 g × 6 cm³",
        result: "144 g·cm³",
        correct: false,
        why: "g·cm³ is not a density. Density is grams per cm³.",
      },
      {
        label: "24 g ÷ 6 cm³",
        result: "4 g/cm³",
        correct: true,
        why: "Grams per cm³ means divide, and that is exactly the unit you wanted.",
      },
      {
        label: "6 cm³ ÷ 24 g",
        result: "0.25 cm³/g",
        correct: false,
        why: "Upside down: that is cm³ per gram.",
      },
    ],
  },
  {
    story: "A bike rides at 15 km/h for 3 hours. How far does it go?",
    want: "km",
    choices: [
      {
        label: "15 km/h × 3 h",
        result: "45 km",
        correct: true,
        why: "km/h × h: the hours cancel, so only km is left. A distance!",
      },
      {
        label: "15 km/h ÷ 3 h",
        result: "5 km/h²",
        correct: false,
        why: "km per hour per hour is not a distance.",
      },
      {
        label: "3 h ÷ 15 km/h",
        result: "0.2 h²/km",
        correct: false,
        why: "A nonsense unit means the wrong operation.",
      },
    ],
  },
  {
    story: "Rice costs $3 per kg. You have $12. How many kg can you buy?",
    want: "kg",
    choices: [
      {
        label: "$12 × $3/kg",
        result: "36 $²/kg",
        correct: false,
        why: "Dollars squared? The units say no.",
      },
      {
        label: "$3/kg ÷ $12",
        result: "0.25 per kg",
        correct: false,
        why: "Upside down. You wanted kg on top.",
      },
      {
        label: "$12 ÷ $3/kg",
        result: "4 kg",
        correct: true,
        why: "kg was on the bottom, so divide by the rate. The $ cancel and kg flips to the top.",
      },
    ],
  },
  {
    story:
      "Gold is 19 g/cm³. A gold ring has a mass of 38 g. What is its volume?",
    want: "cm³",
    choices: [
      {
        label: "38 g ÷ 19 g/cm³",
        result: "2 cm³",
        correct: true,
        why: "cm³ was on the bottom of g/cm³, so divide by the density.",
      },
      {
        label: "38 g × 19 g/cm³",
        result: "722 g²/cm³",
        correct: false,
        why: "Grams squared is not a volume.",
      },
      {
        label: "19 g/cm³ ÷ 38 g",
        result: "0.5 per cm³",
        correct: false,
        why: "Upside down. You wanted cm³ on top.",
      },
    ],
  },
];

function DecideGame() {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [solved, setSolved] = useState<boolean[]>([]);
  const finished = index >= PUZZLES.length;

  if (finished) {
    return (
      <div className="space-y-3 p-2">
        <p className="text-base font-semibold text-emerald-300">
          All 4 done. The rule:
        </p>
        <ul className="space-y-2 text-sm text-slate-200">
          <li className="rounded-lg bg-slate-800 px-3 py-2">
            Want a <strong className="text-white">per</strong> answer (km/h,
            g/cm³)? <strong className="text-amber-300">Divide.</strong>
          </li>
          <li className="rounded-lg bg-slate-800 px-3 py-2">
            Have a per and its bottom unit?{" "}
            <strong className="text-amber-300">Multiply.</strong> The bottom
            cancels.
          </li>
          <li className="rounded-lg bg-slate-800 px-3 py-2">
            Want the bottom unit (h, kg, cm³)?{" "}
            <strong className="text-amber-300">Divide by the rate.</strong>
          </li>
        </ul>
        <button
          type="button"
          onClick={() => {
            setIndex(0);
            setPicked(null);
            setSolved([]);
          }}
          className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
        >
          <RotateCcw className="h-3 w-3" />
          Play again
        </button>
      </div>
    );
  }

  const puzzle = PUZZLES[index];
  const choice = picked === null ? null : puzzle.choices[picked];

  return (
    <div className="space-y-3 p-1">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Puzzle {index + 1} of {PUZZLES.length}
        </span>
        <span className="flex gap-1">
          {PUZZLES.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full ${
                solved[i]
                  ? "bg-emerald-400"
                  : i === index
                    ? "bg-slate-300"
                    : "bg-slate-700"
              }`}
            />
          ))}
        </span>
      </div>
      <p className="text-[15px] leading-6 text-white">{puzzle.story}</p>
      <p className="text-sm text-slate-300">
        You want: <strong className="text-amber-300">{puzzle.want}</strong>.
        Which calculation leaves exactly that?
      </p>
      <div className="grid gap-2">
        {puzzle.choices.map((c, i) => {
          const isPicked = picked === i;
          const tone = !isPicked
            ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
            : c.correct
              ? "bg-emerald-500/20 text-emerald-100 ring-2 ring-emerald-400"
              : "bg-rose-500/20 text-rose-100 ring-2 ring-rose-400";
          return (
            <button
              key={c.label}
              type="button"
              disabled={choice?.correct}
              onClick={() => setPicked(i)}
              className={`flex flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left font-mono text-sm transition sm:flex-row sm:items-center sm:justify-between ${tone}`}
            >
              <span>{c.label}</span>
              {isPicked && (
                <span className="flex items-center gap-1 whitespace-nowrap font-semibold sm:ml-2">
                  = {c.result}
                  {c.correct ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {choice && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            choice.correct
              ? "bg-emerald-950 text-emerald-200"
              : "bg-rose-950 text-rose-200"
          }`}
        >
          {choice.why} {!choice.correct && "Try another."}
        </p>
      )}
      {choice?.correct && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setSolved((s) => {
                const next = [...s];
                next[index] = true;
                return next;
              });
              setIndex((n) => n + 1);
              setPicked(null);
            }}
            className="rounded-full bg-emerald-400 px-4 py-1.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
          >
            {index + 1 === PUZZLES.length ? "See the rule" : "Next puzzle"}
          </button>
        </div>
      )}
    </div>
  );
}

const TABS: { mode: Mode; label: string; active: string }[] = [
  {
    mode: "grow",
    label: "1. Grow",
    active: "bg-indigo-400 text-slate-950",
  },
  { mode: "per", label: "2. Per = ÷", active: "bg-emerald-400 text-slate-950" },
  {
    mode: "decide",
    label: "3. Decide",
    active: "bg-amber-400 text-slate-950",
  },
];

export function UnitsLesson() {
  const [mode, setMode] = useState<Mode>("grow");
  const [replay, setReplay] = useState(0);
  const sceneKey = `${mode}-${replay}`;
  const floorDone = FLOOR_START + LAYER * CUBE_SECONDS;
  const boxDone = TOP_START + LAYER * CUBE_SECONDS;

  return (
    <section
      id="lesson"
      className="my-8 overflow-hidden rounded-2xl bg-slate-950 text-slate-100 shadow-paper-lg ring-1 ring-slate-800"
    >
      <div className="px-5 pt-5 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">
          Start here · about 6 minutes
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold">
          Let the units decide
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Units are part of the number. They tell you when to multiply and when
          to divide. Press each button in order.
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

      {mode === "decide" ? (
        <div className="p-5 sm:p-6">
          <div className="rounded-xl bg-slate-900 p-3 sm:p-4">
            <DecideGame />
          </div>
        </div>
      ) : (
        <div className="grid gap-5 p-5 sm:grid-cols-[1fr_250px] sm:p-6">
          <div className="rounded-xl bg-slate-900 p-3">
            <div key={sceneKey}>
              {mode === "grow" ? <GrowScene /> : <PerScene />}
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
          </div>

          <div key={sceneKey} className="space-y-3 text-sm leading-6">
            {mode === "grow" && (
              <>
                <p className="text-base font-semibold text-indigo-300">
                  Multiply lengths, and the units multiply too.
                </p>
                <p className="font-mono text-amber-200">
                  4 cm
                  <span className="block font-sans text-xs text-slate-400">
                    a length
                  </span>
                </p>
                <p
                  className="font-mono text-indigo-200"
                  style={appear(floorDone)}
                >
                  4 cm × 3 cm = 12 cm²
                  <span className="block font-sans text-xs text-slate-400">
                    a flat floor
                  </span>
                </p>
                <p
                  className="font-mono text-purple-200"
                  style={appear(boxDone)}
                >
                  12 cm² × 2 cm = 24 cm³
                  <span className="block font-sans text-xs text-slate-400">
                    a box
                  </span>
                </p>
                <p
                  className="rounded-lg bg-slate-900 px-3 py-2 text-slate-300"
                  style={appear(boxDone + 0.5)}
                >
                  cm³ means &ldquo;little 1 cm cubes.&rdquo; This box holds 2
                  layers of 12.
                </p>
              </>
            )}
            {mode === "per" && (
              <>
                <p className="text-base font-semibold text-emerald-300">
                  &ldquo;Per&rdquo; means &ldquo;for each one.&rdquo; It means
                  divide.
                </p>
                <p className="text-slate-300">
                  Split the trip into equal hours. How much fits in one?
                </p>
                <p
                  className="font-mono text-lg text-white"
                  style={appear(TRIP_SECONDS + 0.9)}
                >
                  120 km ÷ 2 h = 60 km/h
                </p>
                <p
                  className="rounded-lg bg-slate-900 px-3 py-2 text-slate-300"
                  style={appear(TRIP_SECONDS + 1.4)}
                >
                  The slash in <strong className="text-white">km/h</strong> is a
                  ÷ sign. Same for $/kg and g/cm³.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
