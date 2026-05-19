"use client";

/**
 * Simple SVG pie that shades n out of d equal slices.
 *
 * Used as the "pizza" visualisation throughout Fractions Lab. Slice
 * boundaries are drawn for any d ≤ 24; for larger d we still render the
 * shaded arc but skip the gridlines to avoid clutter.
 */

import type { Fraction } from "@/lib/fractions/types";

const TONES = {
  violet: { fill: "#a78bfa", stroke: "#7c3aed", text: "#5b21b6" },
  amber: { fill: "#fbbf24", stroke: "#d97706", text: "#92400e" },
  emerald: { fill: "#34d399", stroke: "#059669", text: "#065f46" },
  stone: { fill: "#a8a29e", stroke: "#57534e", text: "#1c1917" },
} as const;

interface Props {
  fraction: Fraction;
  size?: number;
  tone?: keyof typeof TONES;
  label?: string;
  faded?: boolean;
}

/**
 * Render an improper fraction as a row of pies: one full pie per whole,
 * plus a partial pie for the remainder. For proper fractions (n < d)
 * this falls back to a single `PieView`. Pies share the same tone and
 * sit under one shared label.
 */
export function PieRow({
  fraction,
  size = 96,
  tone = "violet",
  label,
  faded = false,
}: Props) {
  const { n, d } = fraction;
  if (n < d || d <= 0) {
    return (
      <PieView
        fraction={fraction}
        size={size}
        tone={tone}
        label={label}
        faded={faded}
      />
    );
  }
  const wholes = Math.floor(n / d);
  const remainder = n - wholes * d;
  const items: Fraction[] = [];
  for (let i = 0; i < wholes; i++) items.push({ n: d, d });
  if (remainder > 0) items.push({ n: remainder, d });

  const T = TONES[tone];
  const opacity = faded ? 0.25 : 1;

  return (
    <div
      className="flex flex-col items-center"
      style={{ opacity, transition: "opacity 220ms ease" }}
    >
      <div className="flex items-center gap-1.5">
        {items.map((f, i) => (
          <PieView
            key={i}
            fraction={f}
            size={size}
            tone={tone}
            // Inner labels suppressed; we draw a single label below.
          />
        ))}
      </div>
      {label && (
        <div
          className="text-sm font-semibold tabular-nums mt-1.5"
          style={{
            color: T.text,
            fontFamily: "var(--font-outfit), system-ui, sans-serif",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

export function PieView({
  fraction,
  size = 110,
  tone = "violet",
  label,
  faded = false,
}: Props) {
  const { n, d } = fraction;
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  const T = TONES[tone];

  // Build wedges. For improper fractions (n > d) we wrap and over-shade
  // to convey "more than a whole".
  const totalSlices = Math.max(d, 1);
  const filledSlices = Math.min(n, totalSlices);
  const wholes = Math.max(0, Math.floor((n - 1) / d));
  void wholes;

  const wedges: string[] = [];
  for (let i = 0; i < filledSlices; i++) {
    const a0 = (i / totalSlices) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / totalSlices) * Math.PI * 2 - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    wedges.push(
      `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`,
    );
  }

  // Slice gridlines (only when readable).
  const showLines = totalSlices <= 24;
  const lines: string[] = [];
  if (showLines) {
    for (let i = 0; i < totalSlices; i++) {
      const a = (i / totalSlices) * Math.PI * 2 - Math.PI / 2;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      lines.push(`M ${cx} ${cy} L ${x} ${y}`);
    }
  }

  const opacity = faded ? 0.25 : 1;

  return (
    <div
      className="flex flex-col items-center"
      style={{ opacity, transition: "opacity 220ms ease" }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={label ?? `${n} of ${d}`}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="#fafaf7"
          stroke={T.stroke}
          strokeWidth={1.5}
        />
        {wedges.map((p, i) => (
          <path key={i} d={p} fill={T.fill} fillOpacity={0.6} />
        ))}
        {lines.map((p, i) => (
          <path
            key={`l${i}`}
            d={p}
            stroke="#ffffff"
            strokeWidth={1}
            opacity={0.85}
          />
        ))}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={T.stroke}
          strokeWidth={1.5}
        />
      </svg>
      {label && (
        <div
          className="text-sm font-semibold tabular-nums mt-1.5"
          style={{
            color: T.text,
            fontFamily: "var(--font-outfit), system-ui, sans-serif",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
