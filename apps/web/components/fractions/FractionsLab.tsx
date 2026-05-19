"use client";

/**
 * FractionsLab — Interactive fractions teacher.
 *
 * Same paper-y theme as Carry Lab. Operation-agnostic: each operation
 * module exports a self-describing FractionProblem and the lab renders
 * its equation, fields and visual aid in a unified shell.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Lightbulb,
  Sparkles,
  RotateCw,
  Keyboard as KeyboardIcon,
  Check,
  Plus,
  Minus,
  X as XIcon,
  Divide as DivideIcon,
  Layers,
  Hash,
  ArrowDown,
  ArrowLeftRight,
} from "lucide-react";
import {
  FRACTION_OPS,
  FRACTION_OP_ORDER,
} from "@/lib/fractions/registry";
import { factorsOf, multiplesOf } from "@/lib/fractions/shared";
import type {
  EquationPart,
  Field,
  FractionOp,
  FractionProblem,
  IntegerPart,
  FractionPart,
  MixedPart,
  FactorVisual,
  MultiplesVisual,
  PieVisual,
} from "@/lib/fractions/types";
import { PieView, PieRow } from "./PieView";

const TONE_COLORS = {
  violet: { ink: "#5b21b6", soft: "#ede9fe", border: "#a78bfa" },
  amber: { ink: "#92400e", soft: "#fef3c7", border: "#fbbf24" },
  emerald: { ink: "#065f46", soft: "#d1fae5", border: "#34d399" },
  stone: { ink: "#1c1917", soft: "#f5f5f4", border: "#a8a29e" },
} as const;

const OP_ICONS: Record<FractionOp, React.ComponentType<{ className?: string }>> = {
  gcf: Hash,
  lcm: Layers,
  simplify: ArrowDown,
  mixed: ArrowLeftRight,
  add: Plus,
  subtract: Minus,
  multiply: XIcon,
  divide: DivideIcon,
};

interface CarryLabProps {
  initialOperation?: FractionOp;
  initialLevel?: number;
}

/* ─── Cell view ──────────────────────────────────────────────────── */

interface AnswerCellProps {
  field: Field;
  value: number | null;
  isFocused: boolean;
  wrongFlash: boolean;
  correctFlash: boolean;
  onActivate: () => void;
  size?: number;
  tone?: keyof typeof TONE_COLORS;
}

function AnswerCell({
  field,
  value,
  isFocused,
  wrongFlash,
  correctFlash,
  onActivate,
  size = 56,
  tone = "emerald",
}: AnswerCellProps) {
  const filled = value !== null;
  const correct = filled && value === field.expected;
  const T = TONE_COLORS[tone];

  let bg = "#fafaf7";
  let border = "1px solid #e7e5e4";
  let color = "#1f2937";
  let boxShadow: string | undefined =
    "inset 0 0 0 1px rgba(255,255,255,0.6), 0 1px 2px rgba(15,23,42,0.04)";

  if (filled && correct) {
    bg = T.soft;
    border = `1px solid ${T.border}`;
    color = T.ink;
    boxShadow = `0 1px 3px rgba(15,23,42,0.06)`;
  }

  if (isFocused) {
    border = `1px solid ${T.border}`;
    boxShadow = `0 0 0 3px ${T.border}33, 0 2px 10px ${T.border}44`;
    if (!filled) {
      bg = "#ffffff";
      color = T.ink;
    }
  }

  if (wrongFlash) {
    bg = "#fef2f2";
    border = "1px solid #ef4444";
    color = "#b91c1c";
    boxShadow = "0 0 0 3px #fecaca";
  }

  if (correctFlash) {
    boxShadow = `0 0 0 6px ${T.border}33`;
  }

  return (
    <button
      type="button"
      onClick={onActivate}
      data-field-id={field.id}
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: bg,
        border,
        color,
        boxShadow,
        fontFamily: "var(--font-outfit), system-ui, sans-serif",
        fontSize: size >= 60 ? 28 : 22,
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition:
          "background-color 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease",
        cursor: "pointer",
      }}
      aria-label={
        filled
          ? `${field.label ?? "Answer"} ${value}`
          : `Empty ${field.label ?? "answer"} cell`
      }
    >
      {filled ? value : ""}
    </button>
  );
}

/* ─── Equation renderer ──────────────────────────────────────────── */

interface EquationProps {
  parts: EquationPart[];
  values: Record<string, number | null>;
  expected: Record<string, number>;
  fields: Field[];
  activeFieldId: string | null;
  wrongFlash: string | null;
  correctFlash: string | null;
  setActive: (id: string) => void;
}

function Equation({
  parts,
  values,
  fields,
  activeFieldId,
  wrongFlash,
  correctFlash,
  setActive,
}: EquationProps) {
  const fieldById = useMemo(
    () => Object.fromEntries(fields.map((f) => [f.id, f])),
    [fields],
  );

  return (
    <div
      className="flex items-center justify-center gap-3 flex-wrap"
      style={{
        fontFamily: "var(--font-outfit), system-ui, sans-serif",
        color: "#1f2937",
      }}
    >
      {parts.map((part) => {
        if (part.kind === "operator") {
          return (
            <span
              key={part.id}
              className="text-3xl md:text-4xl text-stone-500 font-medium select-none"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {part.text}
            </span>
          );
        }
        if (part.kind === "integer") {
          return (
            <IntegerView
              key={part.id}
              part={part}
              field={part.field ? fieldById[part.field] : undefined}
              value={part.field ? values[part.field] ?? null : null}
              activeFieldId={activeFieldId}
              wrongFlash={wrongFlash}
              correctFlash={correctFlash}
              setActive={setActive}
            />
          );
        }
        if (part.kind === "mixed") {
          return (
            <MixedView
              key={part.id}
              part={part}
              wholeField={part.wholeField ? fieldById[part.wholeField] : undefined}
              nField={part.nField ? fieldById[part.nField] : undefined}
              dField={part.dField ? fieldById[part.dField] : undefined}
              wholeValue={part.wholeField ? values[part.wholeField] ?? null : null}
              nValue={part.nField ? values[part.nField] ?? null : null}
              dValue={part.dField ? values[part.dField] ?? null : null}
              activeFieldId={activeFieldId}
              wrongFlash={wrongFlash}
              correctFlash={correctFlash}
              setActive={setActive}
            />
          );
        }
        return (
          <FractionView
            key={part.id}
            part={part}
            nField={part.nField ? fieldById[part.nField] : undefined}
            dField={part.dField ? fieldById[part.dField] : undefined}
            nValue={part.nField ? values[part.nField] ?? null : null}
            dValue={part.dField ? values[part.dField] ?? null : null}
            activeFieldId={activeFieldId}
            wrongFlash={wrongFlash}
            correctFlash={correctFlash}
            setActive={setActive}
          />
        );
      })}
    </div>
  );
}

interface IntegerViewProps {
  part: IntegerPart;
  field?: Field;
  value: number | null;
  activeFieldId: string | null;
  wrongFlash: string | null;
  correctFlash: string | null;
  setActive: (id: string) => void;
}

function IntegerView({
  part,
  field,
  value,
  activeFieldId,
  wrongFlash,
  correctFlash,
  setActive,
}: IntegerViewProps) {
  const tone = part.tone ?? "stone";
  if (field) {
    return (
      <AnswerCell
        field={field}
        value={value}
        isFocused={activeFieldId === field.id}
        wrongFlash={wrongFlash === field.id}
        correctFlash={correctFlash === field.id}
        onActivate={() => setActive(field.id)}
        size={72}
        tone={tone}
      />
    );
  }
  const T = TONE_COLORS[tone];
  return (
    <span
      className="text-4xl md:text-5xl font-bold tabular-nums select-none"
      style={{ color: T.ink }}
    >
      {part.value}
    </span>
  );
}

interface FractionViewProps {
  part: FractionPart;
  nField?: Field;
  dField?: Field;
  nValue: number | null;
  dValue: number | null;
  activeFieldId: string | null;
  wrongFlash: string | null;
  correctFlash: string | null;
  setActive: (id: string) => void;
}

function FractionView({
  part,
  nField,
  dField,
  nValue,
  dValue,
  activeFieldId,
  wrongFlash,
  correctFlash,
  setActive,
}: FractionViewProps) {
  const tone = part.tone ?? "stone";
  const T = TONE_COLORS[tone];
  const cellSize = 56;
  const numStyle: React.CSSProperties = {
    color: T.ink,
    fontSize: 36,
    fontWeight: 700,
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
  };
  return (
    <div className="flex flex-col items-center gap-1.5" style={{ minWidth: 72 }}>
      {nField ? (
        <AnswerCell
          field={nField}
          value={nValue}
          isFocused={activeFieldId === nField.id}
          wrongFlash={wrongFlash === nField.id}
          correctFlash={correctFlash === nField.id}
          onActivate={() => setActive(nField.id)}
          size={cellSize}
          tone={tone}
        />
      ) : (
        <span style={numStyle} className="select-none tabular-nums">
          {part.n}
        </span>
      )}
      <div
        style={{
          width: Math.max(cellSize, 56) + 6,
          height: 2,
          background: T.border,
          borderRadius: 2,
        }}
      />
      {dField ? (
        <AnswerCell
          field={dField}
          value={dValue}
          isFocused={activeFieldId === dField.id}
          wrongFlash={wrongFlash === dField.id}
          correctFlash={correctFlash === dField.id}
          onActivate={() => setActive(dField.id)}
          size={cellSize}
          tone={tone}
        />
      ) : (
        <span style={numStyle} className="select-none tabular-nums">
          {part.d}
        </span>
      )}
    </div>
  );
}

interface MixedViewProps {
  part: MixedPart;
  wholeField?: Field;
  nField?: Field;
  dField?: Field;
  wholeValue: number | null;
  nValue: number | null;
  dValue: number | null;
  activeFieldId: string | null;
  wrongFlash: string | null;
  correctFlash: string | null;
  setActive: (id: string) => void;
}

function MixedView({
  part,
  wholeField,
  nField,
  dField,
  wholeValue,
  nValue,
  dValue,
  activeFieldId,
  wrongFlash,
  correctFlash,
  setActive,
}: MixedViewProps) {
  const tone = part.tone ?? "stone";
  const T = TONE_COLORS[tone];
  const wholeStyle: React.CSSProperties = {
    color: T.ink,
    fontSize: 48,
    fontWeight: 800,
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
  };
  return (
    <div className="flex items-center gap-2">
      {wholeField ? (
        <AnswerCell
          field={wholeField}
          value={wholeValue}
          isFocused={activeFieldId === wholeField.id}
          wrongFlash={wrongFlash === wholeField.id}
          correctFlash={correctFlash === wholeField.id}
          onActivate={() => setActive(wholeField.id)}
          size={72}
          tone={tone}
        />
      ) : (
        <span style={wholeStyle} className="select-none tabular-nums">
          {part.whole}
        </span>
      )}
      <FractionView
        part={{
          kind: "fraction",
          id: `${part.id}-frac`,
          n: part.n,
          d: part.d,
          nField: part.nField,
          dField: part.dField,
          tone,
        }}
        nField={nField}
        dField={dField}
        nValue={nValue}
        dValue={dValue}
        activeFieldId={activeFieldId}
        wrongFlash={wrongFlash}
        correctFlash={correctFlash}
        setActive={setActive}
      />
    </div>
  );
}

/* ─── Visualisations ─────────────────────────────────────────────── */

function PiesVisual({
  visual,
  values,
  expected,
}: {
  visual: PieVisual;
  values: Record<string, number | null>;
  expected: Record<string, number>;
}) {
  const fieldDone = (id: string | undefined) =>
    !id || values[id] === expected[id];
  return (
    <div className="flex items-center justify-center gap-6 flex-wrap">
      {visual.items.map((item, i) => {
        const revealed = fieldDone(item.revealAfterField);
        const Pie = item.expand ? PieRow : PieView;
        return (
          <Pie
            key={i}
            fraction={item.fraction}
            label={revealed ? item.label : "?"}
            tone={item.tone}
            faded={!revealed}
            size={item.expand ? 84 : 108}
          />
        );
      })}
    </div>
  );
}

function FactorsVisual({
  visual,
  values,
  expected,
}: {
  visual: FactorVisual;
  values: Record<string, number | null>;
  expected: Record<string, number>;
}) {
  const a = factorsOf(visual.a);
  const b = factorsOf(visual.b);
  const revealed =
    !visual.revealAfterField ||
    values[visual.revealAfterField] === expected[visual.revealAfterField];
  return (
    <div className="flex flex-col gap-2 max-w-md mx-auto">
      <FactorRow
        label={`Factors of ${visual.a}`}
        items={a}
        highlight={visual.highlight}
        revealed={revealed}
        tone="violet"
      />
      <FactorRow
        label={`Factors of ${visual.b}`}
        items={b}
        highlight={visual.highlight}
        revealed={revealed}
        tone="amber"
      />
    </div>
  );
}

function FactorRow({
  label,
  items,
  highlight,
  revealed,
  tone,
}: {
  label: string;
  items: number[];
  highlight: number;
  revealed: boolean;
  tone: keyof typeof TONE_COLORS;
}) {
  const T = TONE_COLORS[tone];
  return (
    <div className="flex items-center gap-2">
      <div
        className="text-[11px] uppercase tracking-[0.1em] font-semibold w-32 shrink-0 text-right"
        style={{ color: T.ink }}
      >
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((n) => {
          const isMatch = n === highlight;
          return (
            <span
              key={n}
              className="px-2 py-1 rounded-md text-sm font-semibold tabular-nums transition-colors"
              style={{
                background: isMatch && revealed ? T.soft : "#fafaf7",
                border: `1px solid ${
                  isMatch && revealed ? T.border : "#e7e5e4"
                }`,
                color: isMatch && revealed ? T.ink : "#78716c",
                fontFamily: "var(--font-outfit), system-ui, sans-serif",
              }}
            >
              {n}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function MultiplesVisual({
  visual,
  values,
  expected,
}: {
  visual: MultiplesVisual;
  values: Record<string, number | null>;
  expected: Record<string, number>;
}) {
  const a = multiplesOf(visual.a, visual.count);
  const b = multiplesOf(visual.b, visual.count);
  const revealed =
    !visual.revealAfterField ||
    values[visual.revealAfterField] === expected[visual.revealAfterField];
  return (
    <div className="flex flex-col gap-2 max-w-md mx-auto">
      <FactorRow
        label={`× ${visual.a}`}
        items={a}
        highlight={visual.highlight}
        revealed={revealed}
        tone="violet"
      />
      <FactorRow
        label={`× ${visual.b}`}
        items={b}
        highlight={visual.highlight}
        revealed={revealed}
        tone="amber"
      />
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */

export function FractionsLab({
  initialOperation = "gcf",
  initialLevel = 1,
}: CarryLabProps) {
  const [operation, setOperation] = useState<FractionOp>(initialOperation);
  const [level, setLevel] = useState(initialLevel);

  const opMod = FRACTION_OPS[operation];

  // Stable seed problem so SSR matches the first client render.
  const seedProblem: FractionProblem = useMemo(() => opMod.genProblem(1), [opMod]);

  const [problem, setProblem] = useState<FractionProblem>(seedProblem);
  const [values, setValues] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(seedProblem.fields.map((f) => [f.id, null])),
  );
  const [activeFieldId, setActiveFieldId] = useState<string | null>(
    seedProblem.fields[0]?.id ?? null,
  );

  const [wrongFlash, setWrongFlash] = useState<string | null>(null);
  const [correctFlash, setCorrectFlash] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [counts, setCounts] = useState({ correct: 0, wrong: 0 });
  // Per-field wrong-attempt counter and an explicit unlock map for the
  // step-by-step coach. The coach is opt-in: students are nudged to try
  // a few times before peeking at the worked solution.
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [coachUnlocked, setCoachUnlocked] = useState<Record<string, boolean>>(
    {},
  );

  const wrongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const correctTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const expected = useMemo(
    () => Object.fromEntries(problem.fields.map((f) => [f.id, f.expected])),
    [problem],
  );

  /* ─── Lifecycle ───────────────────────────────────────────────── */

  const newProblem = useCallback(
    (opId: FractionOp = operation, lvl: number = level) => {
      const mod = FRACTION_OPS[opId];
      const next = mod.genProblem(lvl);
      setProblem(next);
      setValues(Object.fromEntries(next.fields.map((f) => [f.id, null])));
      setActiveFieldId(next.fields[0]?.id ?? null);
      setCompleted(false);
      setCounts({ correct: 0, wrong: 0 });
      setWrongFlash(null);
      setCorrectFlash(null);
      setAttempts({});
      setCoachUnlocked({});
    },
    [operation, level],
  );

  // Initial random problem, guarded against StrictMode double-invocation.
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    newProblem(initialOperation, initialLevel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchOperation = useCallback(
    (opId: FractionOp) => {
      setOperation(opId);
      setLevel(1);
      newProblem(opId, 1);
    },
    [newProblem],
  );

  const changeLevel = useCallback(
    (lvl: number) => {
      setLevel(lvl);
      newProblem(operation, lvl);
    },
    [newProblem, operation],
  );

  /* ─── Coach narration ─────────────────────────────────────────── */

  const coach = useMemo(() => {
    if (completed) return null;
    if (!activeFieldId) return null;
    return problem.steps.find((s) => s.fieldId === activeFieldId) ?? null;
  }, [activeFieldId, problem, completed]);

  /* ─── Navigation ──────────────────────────────────────────────── */

  const advance = useCallback(
    (from: string | null = activeFieldId) => {
      if (!from) return;
      const i = problem.fields.findIndex((f) => f.id === from);
      for (let j = i + 1; j < problem.fields.length; j++) {
        const f = problem.fields[j];
        if (values[f.id] !== f.expected) {
          setActiveFieldId(f.id);
          return;
        }
      }
      for (const f of problem.fields) {
        if (values[f.id] !== f.expected) {
          setActiveFieldId(f.id);
          return;
        }
      }
    },
    [activeFieldId, problem, values],
  );

  const moveActive = useCallback(
    (delta: number) => {
      if (!activeFieldId) return;
      const i = problem.fields.findIndex((f) => f.id === activeFieldId);
      const next = problem.fields[Math.max(0, Math.min(problem.fields.length - 1, i + delta))];
      if (next) setActiveFieldId(next.id);
    },
    [activeFieldId, problem.fields],
  );

  /* ─── Fill / clear / reveal ───────────────────────────────────── */

  // Single user action that exposes the worked solution: unlocks the
  // coach panel for the currently active field. Mapped to the Hint
  // button and the H keyboard shortcut so there is exactly one path
  // to the answer's narration.
  const unlockCoach = useCallback(
    (fieldId: string | null = activeFieldId) => {
      if (!fieldId) return;
      setCoachUnlocked((prev) => ({ ...prev, [fieldId]: true }));
    },
    [activeFieldId],
  );

  const checkCompletion = useCallback(
    (next: Record<string, number | null>) =>
      problem.fields.every((f) => next[f.id] === f.expected),
    [problem.fields],
  );

  const fillActive = useCallback(
    (digit: number, append = true) => {
      if (!activeFieldId) return;
      const field = problem.fields.find((f) => f.id === activeFieldId);
      if (!field) return;
      // Multi-digit support: build up the number left-to-right.
      const current = values[activeFieldId];
      const candidate =
        append && current !== null && current !== 0
          ? Number(`${current}${digit}`)
          : digit;
      if (candidate === field.expected) {
        setValues((prev) => {
          const next = { ...prev, [activeFieldId]: candidate };
          if (checkCompletion(next))
            setTimeout(() => setCompleted(true), 50);
          return next;
        });
        setCounts((c) => ({ ...c, correct: c.correct + 1 }));
        setCorrectFlash(activeFieldId);
        if (correctTimerRef.current) clearTimeout(correctTimerRef.current);
        correctTimerRef.current = setTimeout(
          () => setCorrectFlash(null),
          420,
        );
        setTimeout(() => advance(activeFieldId), 0);
      } else if (
        // Could be a partial step — keep going if any expected value starts
        // with this candidate.
        String(field.expected).startsWith(String(candidate)) &&
        candidate !== 0
      ) {
        setValues((prev) => ({ ...prev, [activeFieldId]: candidate }));
      } else {
        setCounts((c) => ({ ...c, wrong: c.wrong + 1 }));
        setAttempts((prev) => ({
          ...prev,
          [activeFieldId]: (prev[activeFieldId] ?? 0) + 1,
        }));
        setWrongFlash(activeFieldId);
        if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
        wrongTimerRef.current = setTimeout(() => setWrongFlash(null), 500);
        // No auto-hint: the coach is opt-in, the student chooses when to
        // peek at a walkthrough. Just reset the partial value.
        setValues((prev) => ({ ...prev, [activeFieldId]: null }));
      }
    },
    [activeFieldId, problem.fields, values, advance, checkCompletion],
  );

  const clearActive = useCallback(() => {
    if (!activeFieldId) return;
    setValues((prev) => ({ ...prev, [activeFieldId]: null }));
  }, [activeFieldId]);

  const revealActive = useCallback(() => {
    if (!activeFieldId) return;
    const field = problem.fields.find((f) => f.id === activeFieldId);
    if (!field) return;
    setValues((prev) => {
      const next = { ...prev, [activeFieldId]: field.expected };
      if (checkCompletion(next)) setTimeout(() => setCompleted(true), 50);
      return next;
    });
    setCorrectFlash(activeFieldId);
    if (correctTimerRef.current) clearTimeout(correctTimerRef.current);
    correctTimerRef.current = setTimeout(() => setCorrectFlash(null), 420);
    setTimeout(() => advance(activeFieldId), 0);
  }, [activeFieldId, problem.fields, advance, checkCompletion]);

  /* ─── Keyboard ────────────────────────────────────────────────── */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const k = e.key;
      if (/^[0-9]$/.test(k)) {
        fillActive(Number(k));
        e.preventDefault();
        return;
      }
      if (k === "Backspace" || k === "Delete") {
        clearActive();
        e.preventDefault();
        return;
      }
      if (k === "Enter") {
        advance();
        e.preventDefault();
        return;
      }
      if (k === "ArrowLeft" || k === "ArrowUp") {
        moveActive(-1);
        e.preventDefault();
        return;
      }
      if (k === "ArrowRight" || k === "ArrowDown") {
        moveActive(+1);
        e.preventDefault();
        return;
      }
      if (k === "h" || k === "H") {
        if (activeFieldId) unlockCoach(activeFieldId);
        e.preventDefault();
        return;
      }
      if (k === "r" || k === "R") {
        revealActive();
        e.preventDefault();
        return;
      }
      if (k === "n" || k === "N") {
        newProblem();
        e.preventDefault();
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    activeFieldId,
    fillActive,
    clearActive,
    advance,
    moveActive,
    unlockCoach,
    revealActive,
    newProblem,
  ]);

  /* ─── Confetti ────────────────────────────────────────────────── */

  useEffect(() => {
    if (!completed) return;
    const canvas = document.getElementById("frac-confetti") as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    type P = { x: number; y: number; vx: number; vy: number; s: number; c: string; r: number; vr: number };
    const pieces: P[] = [];
    const colors = ["#7c3aed", "#db2777", "#059669", "#d97706", "#0891b2"];
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2.4;
    for (let i = 0; i < 140; i++) {
      pieces.push({
        x: cx,
        y: cy,
        vx: (Math.random() - 0.5) * 14,
        vy: -Math.random() * 14 - 4,
        s: Math.random() * 6 + 3,
        c: colors[Math.floor(Math.random() * colors.length)],
        r: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.35,
      });
    }
    let frame = 0;
    let raf = 0;
    const step = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pieces) {
        p.vy += 0.4;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 1.5);
        ctx.restore();
      }
      frame++;
      if (frame < 180) raf = requestAnimationFrame(step);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    step();
    return () => cancelAnimationFrame(raf);
  }, [completed]);

  /* ─── Render ──────────────────────────────────────────────────── */

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center px-4 pb-10 pt-6 md:pt-10"
      style={{
        background: "linear-gradient(180deg, #f6f3ed 0%, #f1ede4 40%, #efe9df 100%)",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        color: "#1f2937",
      }}
    >
      {/* Top bar */}
      <header className="w-full max-w-5xl flex items-center justify-between mb-5 md:mb-7">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <div
          className="text-center"
          style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
        >
          <div className="text-lg md:text-xl font-semibold tracking-tight text-stone-900">
            Fractions Lab
          </div>
          <div className="text-xs text-stone-500 mt-0.5">
            Pizzas, factors and equivalent fractions, the way they should make sense.
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs text-stone-600 shadow-sm">
          Level <span className="font-semibold text-stone-900">{level}</span>
          <span className="mx-1.5 text-stone-300">·</span>
          <span className="text-stone-700">{opMod.levels[level - 1]?.label}</span>
        </div>
      </header>

      {/* Operation tabs */}
      <div
        className="w-full max-w-5xl mb-5 grid grid-cols-4 sm:grid-cols-8 gap-1.5 p-1.5 rounded-2xl border border-stone-200 bg-white"
        style={{ boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
      >
        {FRACTION_OP_ORDER.map((opId) => {
          const m = FRACTION_OPS[opId];
          const Icon = OP_ICONS[opId];
          const active = operation === opId;
          return (
            <button
              key={opId}
              type="button"
              onClick={() => switchOperation(opId)}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all ${
                active
                  ? "bg-stone-900 text-white shadow-md"
                  : "bg-transparent text-stone-500 hover:bg-stone-50 hover:text-stone-900"
              }`}
              style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
              aria-pressed={active}
              title={m.blurb}
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs sm:text-sm font-semibold">{m.label}</span>
            </button>
          );
        })}
      </div>

      <main className="w-full max-w-5xl grid md:grid-cols-[1fr_320px] gap-6">
        {/* ── Problem card ── */}
        <section>
          <div
            className="relative bg-white rounded-3xl border border-stone-200/70 p-6 md:p-10"
            style={{
              boxShadow:
                "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.05)",
            }}
          >
            <div className="flex flex-col items-center gap-7">
              <Equation
                parts={problem.equation}
                values={values}
                expected={expected}
                fields={problem.fields}
                activeFieldId={activeFieldId}
                wrongFlash={wrongFlash}
                correctFlash={correctFlash}
                setActive={setActiveFieldId}
              />
              {problem.visual && (
                <div className="w-full pt-2 border-t border-stone-100">
                  {problem.visual.kind === "pies" && (
                    <PiesVisual
                      visual={problem.visual}
                      values={values}
                      expected={expected}
                    />
                  )}
                  {problem.visual.kind === "factors" && (
                    <FactorsVisual
                      visual={problem.visual}
                      values={values}
                      expected={expected}
                    />
                  )}
                  {problem.visual.kind === "multiples" && (
                    <MultiplesVisual
                      visual={problem.visual}
                      values={values}
                      expected={expected}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2 justify-center mt-5">
            <ControlButton
              onClick={() => unlockCoach()}
              icon={<Lightbulb className="w-4 h-4" />}
              label="Show steps"
              kbd="H"
            />
            <ControlButton
              onClick={revealActive}
              icon={<Sparkles className="w-4 h-4" />}
              label="Reveal step"
              kbd="R"
            />
            <ControlButton
              onClick={() => newProblem()}
              icon={<RotateCw className="w-4 h-4" />}
              label="New problem"
              kbd="N"
              primary
            />
          </div>

          {/* Level picker */}
          <div className="mt-5">
            <div
              className="text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400 mb-2"
              style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
            >
              Pick a level
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {opMod.levels.map((lvl) => {
                const active = lvl.id === level;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => changeLevel(lvl.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${
                      active
                        ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                        : "bg-white text-stone-600 border-stone-200 hover:text-stone-900 hover:border-stone-400"
                    }`}
                    style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
                  >
                    <span className="opacity-50 mr-1">Lvl {lvl.id}</span>
                    {lvl.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Side panel ── */}
        <aside className="flex flex-col gap-4">
          <Panel title="Why this matters">
            <p className="text-sm text-stone-700 leading-relaxed">{problem.why}</p>
          </Panel>

          <Panel title="Coach">
            <CoachPanelBody
              completed={completed}
              activeFieldId={activeFieldId}
              coach={coach}
              unlocked={
                activeFieldId ? !!coachUnlocked[activeFieldId] : false
              }
              attempts={
                activeFieldId ? attempts[activeFieldId] ?? 0 : 0
              }
              onUnlock={() => unlockCoach()}
            />
          </Panel>

          <Panel title="Progress">
            <div className="grid grid-cols-2 gap-2.5">
              <Stat label="Correct" value={counts.correct} tone="ok" />
              <Stat label="Wrong" value={counts.wrong} tone="warn" />
            </div>
          </Panel>

          <Panel title="Keyboard" icon={<KeyboardIcon className="w-3.5 h-3.5" />}>
            <div className="flex flex-wrap gap-1.5">
              <KeyHint keys="← →" action="move" />
              <KeyHint keys="0–9" action="fill" />
              <KeyHint keys="⌫" action="clear" />
              <KeyHint keys="Enter" action="next" />
              <KeyHint keys="H" action="show steps" />
              <KeyHint keys="R" action="reveal" />
              <KeyHint keys="N" action="new" />
            </div>
          </Panel>
        </aside>
      </main>

      <canvas id="frac-confetti" className="fixed inset-0 pointer-events-none z-40" />
    </div>
  );
}

/* ─── Coach panel body ───────────────────────────────────────────── */

interface CoachPanelBodyProps {
  completed: boolean;
  activeFieldId: string | null;
  coach: { title: string; lines: string[]; hint: string } | null;
  unlocked: boolean;
  attempts: number;
  onUnlock: () => void;
}

function CoachPanelBody({
  completed,
  activeFieldId,
  coach,
  unlocked,
  attempts,
  onUnlock,
}: CoachPanelBodyProps) {
  if (completed) {
    return (
      <div className="text-sm text-stone-700 space-y-2">
        <div className="text-lg font-semibold text-stone-900 flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-600" /> Solved!
        </div>
        <p className="text-stone-500">
          Press <Kbd>N</Kbd> for another problem, or try a harder level.
        </p>
      </div>
    );
  }

  if (!activeFieldId) {
    return (
      <p className="text-sm text-stone-500">
        Click a cell to start filling in the answer.
      </p>
    );
  }

  if (unlocked && coach) {
    return (
      <>
        <div className="text-xs font-semibold uppercase tracking-[0.08em] mb-2 text-violet-700">
          {coach.title}
        </div>
        <div className="text-sm leading-relaxed text-stone-700 space-y-1.5">
          {coach.lines.map((line, i) => (
            <p
              key={i}
              dangerouslySetInnerHTML={{ __html: renderInline(line) }}
            />
          ))}
        </div>
      </>
    );
  }

  // Locked: encourage independent attempts before peeking at the worked
  // solution. Messaging softens with each wrong attempt.
  const headline =
    attempts === 0
      ? "Try it yourself first."
      : attempts === 1
        ? "Give it another go."
        : "Want a walkthrough?";
  const sub =
    attempts === 0
      ? "When you're stuck, tap to see the steps."
      : attempts === 1
        ? "One try in. Tap below if you'd like to see how it's done."
        : `${attempts} tries so far. No shame in peeking — that's how you learn.`;

  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-semibold text-stone-900">{headline}</div>
        <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{sub}</p>
      </div>
      <button
        type="button"
        onClick={onUnlock}
        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border"
        style={{
          fontFamily: "var(--font-outfit), system-ui, sans-serif",
          background: attempts >= 2 ? "#fffbeb" : "#fafaf7",
          borderColor: attempts >= 2 ? "#fcd34d" : "#e7e5e4",
          color: attempts >= 2 ? "#92400e" : "#57534e",
        }}
      >
        <Lightbulb className="w-4 h-4" />
        <span>Show step-by-step</span>
        <Kbd>H</Kbd>
      </button>
    </div>
  );
}

/* ─── Sub-components (panels, controls) ──────────────────────────── */

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-white border border-stone-200 rounded-2xl p-4 md:p-5"
      style={{ boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
    >
      <div
        className="text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-400 mb-3 flex items-center gap-1.5"
        style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
      >
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "warn";
}) {
  const color = tone === "ok" ? "#047857" : "#b45309";
  const bg = tone === "ok" ? "#ecfdf5" : "#fffbeb";
  const border = tone === "ok" ? "#a7f3d0" : "#fde68a";
  return (
    <div
      className="rounded-xl p-3 text-center"
      style={{ background: bg, borderColor: border, borderWidth: 1 }}
    >
      <div
        className="text-[22px] font-semibold tabular-nums leading-none"
        style={{ color, fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
      >
        {value}
      </div>
      <div className="text-[10px] mt-1.5 uppercase tracking-[0.08em] text-stone-500">
        {label}
      </div>
    </div>
  );
}

function ControlButton({
  onClick,
  icon,
  label,
  kbd,
  primary,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  kbd: string;
  primary?: boolean;
}) {
  const base =
    "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border shadow-sm";
  const style = primary
    ? "bg-stone-900 text-white border-stone-900 hover:bg-stone-800"
    : "bg-white text-stone-700 border-stone-200 hover:border-stone-400 hover:text-stone-900";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${style}`}
      style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
    >
      {icon}
      <span>{label}</span>
      <Kbd inverted={primary}>{kbd}</Kbd>
    </button>
  );
}

function KeyHint({ keys, action }: { keys: string; action: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-stone-500">
      <span
        className="px-1.5 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-stone-700 font-mono"
        style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
      >
        {keys}
      </span>
      <span>{action}</span>
    </span>
  );
}

function Kbd({
  children,
  inverted,
}: {
  children: React.ReactNode;
  inverted?: boolean;
}) {
  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded-md border font-mono ${
        inverted
          ? "bg-white/20 border-white/20 text-white"
          : "bg-stone-50 border-stone-200 text-stone-500"
      }`}
    >
      {children}
    </span>
  );
}

function renderInline(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-stone-900">$1</strong>')
    .replace(/_(.+?)_/g, '<em class="text-stone-500">$1</em>');
}
