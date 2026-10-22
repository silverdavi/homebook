"use client";

import { useState } from "react";
import { LessonShell, Slider, appear, signed } from "./LessonShell";

const G = 18;
const CX = 160;
const CY = 100;

const px = (x: number) => CX + x * G;
const py = (y: number) => CY - y * G;

function Grid() {
  const ticks = Array.from({ length: 11 }, (_, i) => i - 5);
  return (
    <g>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={px(t)} y1={py(5)} x2={px(t)} y2={py(-5)} stroke="#1e293b" />
          <line x1={px(-5)} y1={py(t)} x2={px(5)} y2={py(t)} stroke="#1e293b" />
        </g>
      ))}
      <line
        x1={px(-5.5)}
        y1={CY}
        x2={px(5.5)}
        y2={CY}
        stroke="#94a3b8"
        strokeWidth="1.5"
      />
      <line
        x1={CX}
        y1={py(5.5)}
        x2={CX}
        y2={py(-5.5)}
        stroke="#94a3b8"
        strokeWidth="1.5"
      />
      <text x={px(5.5) + 4} y={CY + 4} fill="#94a3b8" fontSize="11">
        x
      </text>
      <text x={CX + 4} y={py(5.5) + 2} fill="#94a3b8" fontSize="11">
        y
      </text>
      {[-4, -2, 2, 4].map((t) => (
        <g key={t}>
          <text
            x={px(t)}
            y={CY + 13}
            textAnchor="middle"
            fill="#64748b"
            fontSize="9"
          >
            {signed(t)}
          </text>
          <text
            x={CX - 5}
            y={py(t) + 3}
            textAnchor="end"
            fill="#64748b"
            fontSize="9"
          >
            {signed(t)}
          </text>
        </g>
      ))}
    </g>
  );
}

function Walk({
  x,
  y,
  begin,
  color,
}: {
  x: number;
  y: number;
  begin: number;
  color: string;
}) {
  return (
    <g>
      <line
        x1={CX}
        y1={CY}
        x2={px(x)}
        y2={CY}
        stroke={color}
        strokeWidth="3"
        strokeDasharray={Math.abs(x) * G}
        strokeDashoffset={Math.abs(x) * G}
      >
        <animate
          attributeName="stroke-dashoffset"
          from={Math.abs(x) * G}
          to="0"
          begin={`${begin}s`}
          dur="0.8s"
          fill="freeze"
        />
      </line>
      <line
        x1={px(x)}
        y1={CY}
        x2={px(x)}
        y2={py(y)}
        stroke={color}
        strokeWidth="3"
        strokeDasharray={Math.abs(y) * G}
        strokeDashoffset={Math.abs(y) * G}
      >
        <animate
          attributeName="stroke-dashoffset"
          from={Math.abs(y) * G}
          to="0"
          begin={`${begin + 0.9}s`}
          dur="0.8s"
          fill="freeze"
        />
      </line>
      <g style={appear(begin + 1.7)}>
        <circle cx={px(x)} cy={py(y)} r="5" fill={color} />
        <text
          x={px(x) + (x < 0 ? -8 : 8)}
          y={py(y) + (y < 0 ? 14 : -6)}
          textAnchor={x < 0 ? "end" : "start"}
          fill="#ffffff"
          fontSize="12"
          fontWeight="700"
        >
          ({signed(x)}, {signed(y)})
        </text>
      </g>
    </g>
  );
}

function WalkScene() {
  return (
    <svg
      viewBox="0 0 320 200"
      className="h-auto w-full"
      role="img"
      aria-label="From the center, walk 3 right then 2 up to (3, 2); then 4 left and 3 down to (−4, −3)"
    >
      <Grid />
      <circle cx={CX} cy={CY} r="3" fill="#f8fafc" />
      <Walk x={3} y={2} begin={0.3} color="#fbbf24" />
      <Walk x={-4} y={-3} begin={2.6} color="#38bdf8" />
    </svg>
  );
}

const QUADRANTS = [
  { name: "I", sign: "(+, +)", x: 2.5, y: 2.5, fill: "#4ade80" },
  { name: "II", sign: "(−, +)", x: -2.5, y: 2.5, fill: "#fbbf24" },
  { name: "III", sign: "(−, −)", x: -2.5, y: -2.5, fill: "#f87171" },
  { name: "IV", sign: "(+, −)", x: 2.5, y: -2.5, fill: "#38bdf8" },
];

function QuadrantScene() {
  return (
    <svg
      viewBox="0 0 320 200"
      className="h-auto w-full"
      role="img"
      aria-label="The four quadrants, numbered I to IV counterclockwise from top right"
    >
      <Grid />
      {QUADRANTS.map((q, i) => (
        <g key={q.name} style={appear(0.3 + i * 0.7)}>
          <rect
            x={q.x > 0 ? CX : px(-5)}
            y={q.y > 0 ? py(5) : CY}
            width={5 * G}
            height={5 * G}
            fill={q.fill}
            opacity="0.15"
          />
          <text
            x={px(q.x)}
            y={py(q.y)}
            textAnchor="middle"
            fill={q.fill}
            fontSize="20"
            fontWeight="800"
          >
            {q.name}
          </text>
          <text
            x={px(q.x)}
            y={py(q.y) + 16}
            textAnchor="middle"
            fill="#e2e8f0"
            fontSize="11"
          >
            {q.sign}
          </text>
        </g>
      ))}
    </svg>
  );
}

function quadrantOf(x: number, y: number) {
  if (x === 0 && y === 0) return "the origin (center)";
  if (x === 0) return "on the y-axis";
  if (y === 0) return "on the x-axis";
  if (x > 0 && y > 0) return "quadrant I";
  if (x < 0 && y > 0) return "quadrant II";
  if (x < 0) return "quadrant III";
  return "quadrant IV";
}

function TryIt() {
  const [x, setX] = useState(-3);
  const [y, setY] = useState(4);
  return (
    <div>
      <svg
        viewBox="0 0 320 200"
        className="h-auto w-full"
        role="img"
        aria-label={`Point at (${x}, ${y})`}
      >
        <Grid />
        <line
          x1={CX}
          y1={CY}
          x2={px(x)}
          y2={CY}
          stroke="#fbbf24"
          strokeWidth="3"
        />
        <line
          x1={px(x)}
          y1={CY}
          x2={px(x)}
          y2={py(y)}
          stroke="#38bdf8"
          strokeWidth="3"
        />
        <circle cx={px(x)} cy={py(y)} r="6" fill="#ffffff" />
      </svg>
      <p className="text-center font-mono text-lg text-white">
        ({signed(x)}, {signed(y)}) is in {quadrantOf(x, y)}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Slider
          label="x (right/left)"
          value={x}
          min={-5}
          max={5}
          onChange={setX}
          format={signed}
        />
        <Slider
          label="y (up/down)"
          value={y}
          min={-5}
          max={5}
          onChange={setY}
          format={signed}
        />
      </div>
    </div>
  );
}

export function CoordinateLesson() {
  return (
    <LessonShell
      minutes={5}
      title="Find any point"
      subtitle="Two numbers find any spot: across first, then up or down. Press each button in order."
      tabs={[
        {
          label: "1. Walk",
          active: "bg-amber-400 text-slate-950",
          scene: () => <WalkScene />,
          side: () => (
            <>
              <p className="text-base font-semibold text-amber-300">
                (x, y): across, then up.
              </p>
              <p className="text-slate-300">
                Start at the center (0, 0). The first number walks right (+) or
                left (−). The second goes up (+) or down (−).
              </p>
              <p className="font-mono text-amber-200" style={appear(2)}>
                (3, 2): 3 right, 2 up
              </p>
              <p className="font-mono text-sky-200" style={appear(4.3)}>
                (−4, −3): 4 left, 3 down
              </p>
              <p className="rounded-lg bg-slate-900 px-3 py-2 text-slate-300">
                Memory trick: walk down the hall before you take the elevator.
              </p>
            </>
          ),
        },
        {
          label: "2. Quadrants",
          active: "bg-emerald-400 text-slate-950",
          scene: () => <QuadrantScene />,
          side: () => (
            <>
              <p className="text-base font-semibold text-emerald-300">
                The axes cut the plane into 4.
              </p>
              <p className="text-slate-300">
                They are numbered I, II, III, IV, going counterclockwise from
                the top right.
              </p>
              <p
                className="rounded-lg bg-slate-900 px-3 py-2 text-slate-300"
                style={appear(3)}
              >
                The signs tell you the quadrant: (−, +) is always II.
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
              <p className="text-slate-300">Move the point with the sliders.</p>
              <p className="text-slate-300">
                Challenge: visit all four quadrants, then put the point exactly
                on the x-axis.
              </p>
              <p className="rounded-lg bg-slate-900 px-3 py-2 text-slate-400">
                Latitude and longitude, in today&rsquo;s World block, are this
                same idea on a globe.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
