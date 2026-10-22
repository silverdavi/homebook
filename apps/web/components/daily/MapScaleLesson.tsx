"use client";

import { useState } from "react";
import { LessonShell, Slider, appear } from "./LessonShell";

const CM = 52;
const RX = 30;
const RY = 70;
const SEG_SECONDS = 0.5;

function Ruler({
  cms,
  scale,
  colors,
}: {
  cms: number;
  scale: number;
  colors: string;
}) {
  return (
    <g>
      {Array.from({ length: cms }, (_, i) => (
        <g key={i} style={appear(0.3 + i * SEG_SECONDS)}>
          <rect
            x={RX + i * CM + 1}
            y={RY}
            width={CM - 2}
            height="26"
            rx="3"
            fill={i % 2 === 0 ? colors : "#1e293b"}
            stroke={colors}
            strokeWidth="1.5"
          />
          <text
            x={RX + i * CM + CM / 2}
            y={RY + 18}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill={i % 2 === 0 ? "#0f172a" : "#e2e8f0"}
          >
            1 cm
          </text>
          <text
            x={RX + i * CM + CM / 2}
            y={RY + 48}
            textAnchor="middle"
            fontSize="12"
            fill="#cbd5e1"
          >
            {scale} km
          </text>
          <text
            x={RX + (i + 1) * CM}
            y={RY - 10}
            textAnchor="middle"
            fontSize="11"
            fill="#94a3b8"
          >
            {(i + 1) * scale}
          </text>
        </g>
      ))}
    </g>
  );
}

function ForwardScene() {
  return (
    <svg
      viewBox="0 0 320 170"
      className="h-auto w-full"
      role="img"
      aria-label="A 5 cm line on a map, each centimeter worth 10 km, adds up to 50 km"
    >
      <text x="160" y="28" textAnchor="middle" fill="#e2e8f0" fontSize="14">
        Map scale: 1 cm = 10 km
      </text>
      <Ruler cms={5} scale={10} colors="#fbbf24" />
      <text
        x="160"
        y="160"
        textAnchor="middle"
        fill="#fde68a"
        fontSize="16"
        fontWeight="700"
        style={appear(0.4 + 5 * SEG_SECONDS)}
      >
        5 cm on the map = 50 km for real
      </text>
    </svg>
  );
}

function BackwardScene() {
  return (
    <svg
      viewBox="0 0 320 170"
      className="h-auto w-full"
      role="img"
      aria-label="A real distance of 30 km at 10 km per centimeter becomes 3 cm on the map"
    >
      <text x="160" y="28" textAnchor="middle" fill="#e2e8f0" fontSize="14">
        Real trip: 30 km. Scale: 1 cm = 10 km
      </text>
      <Ruler cms={3} scale={10} colors="#38bdf8" />
      <text
        x="160"
        y="160"
        textAnchor="middle"
        fill="#bae6fd"
        fontSize="16"
        fontWeight="700"
        style={appear(0.4 + 3 * SEG_SECONDS)}
      >
        30 km fits in 3 chunks of 10 → 3 cm
      </text>
    </svg>
  );
}

const SCALES = [5, 10, 25, 50];

function TryIt() {
  const [cm, setCm] = useState(4);
  const [scaleIndex, setScaleIndex] = useState(1);
  const scale = SCALES[scaleIndex];
  const width = 260;
  const cmPx = width / 10;
  return (
    <div>
      <svg
        viewBox="0 0 320 90"
        className="h-auto w-full"
        role="img"
        aria-label={`${cm} cm at ${scale} km per cm is ${cm * scale} km`}
      >
        <rect x="30" y="30" width={width} height="20" rx="3" fill="#1e293b" />
        <rect
          x="30"
          y="30"
          width={cm * cmPx}
          height="20"
          rx="3"
          fill="#34d399"
        />
        {Array.from({ length: 11 }, (_, i) => (
          <line
            key={i}
            x1={30 + i * cmPx}
            y1="50"
            x2={30 + i * cmPx}
            y2="58"
            stroke="#64748b"
          />
        ))}
        <text x="30" y="76" fill="#94a3b8" fontSize="11">
          0 cm
        </text>
        <text x="290" y="76" textAnchor="end" fill="#94a3b8" fontSize="11">
          10 cm
        </text>
      </svg>
      <p className="text-center font-mono text-lg text-white">
        {cm} cm × {scale} km per cm = {cm * scale} km
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Slider
          label="On the map"
          value={cm}
          min={1}
          max={10}
          onChange={setCm}
          format={(v) => `${v} cm`}
        />
        <Slider
          label="Scale"
          value={scaleIndex}
          min={0}
          max={SCALES.length - 1}
          onChange={setScaleIndex}
          format={(i) => `1 cm = ${SCALES[i]} km`}
        />
      </div>
    </div>
  );
}

export function MapScaleLesson() {
  return (
    <LessonShell
      minutes={5}
      title="Map scale"
      subtitle="A map is the real world shrunk by one number. Press each button in order."
      tabs={[
        {
          label: "1. To real",
          active: "bg-amber-400 text-slate-950",
          scene: () => <ForwardScene />,
          side: () => (
            <>
              <p className="text-base font-semibold text-amber-300">
                Every 1 cm on the map stands for 10 km.
              </p>
              <p className="text-slate-300">Count the chunks, or multiply:</p>
              <p className="font-mono text-white" style={appear(0.4 + 5 * 0.5)}>
                5 cm × 10 km per cm = 50 km
              </p>
              <p
                className="rounded-lg bg-slate-900 px-3 py-2 text-slate-300"
                style={appear(1 + 5 * 0.5)}
              >
                Units check from Monday: cm × km/cm. The cm cancel, km is left.
              </p>
            </>
          ),
        },
        {
          label: "2. To map",
          active: "bg-sky-400 text-slate-950",
          scene: () => <BackwardScene />,
          side: () => (
            <>
              <p className="text-base font-semibold text-sky-300">
                Going backwards? Divide by the scale.
              </p>
              <p className="text-slate-300">
                How many 10 km chunks fit in 30 km? Each chunk is 1 cm.
              </p>
              <p className="font-mono text-white" style={appear(0.4 + 3 * 0.5)}>
                30 km ÷ 10 km per cm = 3 cm
              </p>
              <p
                className="rounded-lg bg-slate-900 px-3 py-2 text-slate-300"
                style={appear(1 + 3 * 0.5)}
              >
                You wanted cm, the bottom of km/cm, so you divided by the rate.
                Same rule as Monday.
              </p>
            </>
          ),
        },
        {
          label: "3. Try it",
          active: "bg-emerald-400 text-slate-950",
          interactive: true,
          scene: () => <TryIt />,
          side: () => (
            <>
              <p className="text-base font-semibold text-emerald-300">
                Your turn.
              </p>
              <p className="text-slate-300">
                Change the map length and the scale. Watch the real distance.
              </p>
              <p className="text-slate-300">
                Challenge: find two different settings that both give{" "}
                <strong className="text-white">100 km</strong>.
              </p>
              <p className="rounded-lg bg-slate-900 px-3 py-2 text-slate-400">
                A bigger number in the scale means the map shows more land in
                each cm.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
