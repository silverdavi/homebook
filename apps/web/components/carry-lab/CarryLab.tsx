"use client";

/**
 * CarryLab — Interactive arithmetic teacher (add / subtract / multiply / divide).
 *
 * Clean, muted, paper-inspired theme. The tableau aligns on a strict CSS grid
 * so columns line up perfectly; every transition is colour-only so the layout
 * never shifts or jitters.
 *
 * The component is operation-agnostic: it reads everything (levels, problem
 * generator, tableau builder, coach narration, hints) from the registry.
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
  Divide,
} from "lucide-react";
import { fromDigits, placeName } from "@/lib/carry-lab/shared";
import type { Cell, Operation, TableauState } from "@/lib/carry-lab/types";
import { OPERATIONS, OPERATION_ORDER } from "@/lib/carry-lab/registry";

/* ─────────────────────────────────────────────────────────────
 * Constants — palette, sizes.
 * ───────────────────────────────────────────────────────────── */

// Muted-but-saturated place-value palette (one hue per decimal place).
const PV_COLORS = [
  "#7c3aed", // ones — violet-600
  "#0891b2", // tens — cyan-600
  "#d97706", // hundreds — amber-600
  "#db2777", // thousands — pink-600
  "#059669", // ten-thousands — emerald-600
  "#ea580c", // hundred-thousands — orange-600
  "#4f46e5", // millions — indigo-600
];
const pvColor = (col: number) => PV_COLORS[col % PV_COLORS.length];

const CELL_PX = 64;
const CARRY_PX = 34;
const GAP_PX = 10;

const OPERATION_ICONS: Record<Operation, React.ComponentType<{ className?: string }>> = {
  add: Plus,
  subtract: Minus,
  multiply: XIcon,
  divide: Divide,
};

/* ─────────────────────────────────────────────────────────────
 * Cell view — one button per cell, fully styled inline so we can
 * compose colour from the active state without layout shifts.
 * ───────────────────────────────────────────────────────────── */

interface CellViewProps {
  cell: Cell;
  isFocused: boolean;
  wrongFlash: boolean;
  correctFlash: boolean;
  onActivate: (id: string) => void;
  onHoverCol: (col: number | null, e?: React.MouseEvent) => void;
}

function CellView({
  cell,
  isFocused,
  wrongFlash,
  correctFlash,
  onActivate,
  onHoverCol,
}: CellViewProps) {
  const isCarry = cell.kind === "carry";
  const isBorrow = cell.kind === "borrow";
  const isGhost = cell.kind === "ghost";
  const isQuotient = cell.kind === "quotient";
  const isReadOnly = !cell.editable;
  const filled = cell.value !== null && cell.value !== undefined;
  const isCorrect = filled && cell.value === cell.correct;

  // Borrow uses the same compact size as carry cells.
  const compact = isCarry || isBorrow;
  const size = compact ? CARRY_PX : CELL_PX;

  if (cell.hidden) {
    return <div style={{ width: size, height: size }} />;
  }

  // Content
  let content: React.ReactNode = "";
  if (compact) {
    content = cell.value ?? "";
  } else if (isGhost) {
    content = "0";
  } else if (filled) {
    content = cell.value;
  }

  const base: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: compact ? 8 : 12,
    fontFamily: "var(--font-outfit), system-ui, sans-serif",
    fontSize: compact ? 16 : 28,
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition:
      "background-color 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease",
    userSelect: "none",
    position: "relative",
    cursor: cell.editable ? "pointer" : "default",
  };

  // Default — empty editable cell.
  let bg = "#fafaf7";
  let border = "1px solid #e7e5e4";
  let color = "#1f2937";
  let boxShadow: string | undefined =
    "inset 0 0 0 1px rgba(255,255,255,0.6), 0 1px 2px rgba(15,23,42,0.04)";

  if (isReadOnly && !isGhost && !compact) {
    bg = "transparent";
    border = "1px solid transparent";
    boxShadow = undefined;
    color = "#0f172a";
  }

  if (isGhost) {
    bg = "transparent";
    border = "1px dashed #d6d3d1";
    boxShadow = undefined;
    color = "#a8a29e";
  }

  if (compact) {
    // Carries (amber) and borrows (rose) both use the small cell with dashed border.
    const tone = isBorrow
      ? { fillBg: "#fef2f2", fillBorder: "#f87171", fillText: "#b91c1c", emptyBg: "#fff7f7", emptyBorder: "#fecaca", emptyText: "#fca5a5" }
      : { fillBg: "#fef3c7", fillBorder: "#f59e0b", fillText: "#b45309", emptyBg: "#fffbeb", emptyBorder: "#fcd34d", emptyText: "#fcd34d" };
    bg = filled ? tone.fillBg : tone.emptyBg;
    border = filled ? `1px solid ${tone.fillBorder}` : `1px dashed ${tone.emptyBorder}`;
    color = filled ? tone.fillText : tone.emptyText;
    boxShadow = undefined;
  }

  if (filled && !compact && !isReadOnly) {
    if (isCorrect) {
      bg = "#ecfdf5";
      border = "1px solid #10b981";
      color = "#047857";
      boxShadow = "0 1px 3px rgba(16, 185, 129, 0.2)";
    }
  }

  // Quotient cells get a subtle top-edge accent in the place-value hue,
  // since visually they sit above the dividend row.
  if (isQuotient && !filled && !isFocused) {
    border = `1px solid #e7e5e4`;
    bg = "#ffffff";
  }

  // Focus and flashes — colour and shadow only, no size change.
  if (isFocused) {
    border = `1px solid ${pvColor(cell.col)}`;
    boxShadow = `0 0 0 3px ${pvColor(cell.col)}22, 0 2px 10px ${pvColor(cell.col)}35`;
    if (!filled) {
      bg = "#ffffff";
      color = pvColor(cell.col);
    }
  }

  if (wrongFlash) {
    bg = "#fef2f2";
    border = "1px solid #ef4444";
    color = "#b91c1c";
    boxShadow = "0 0 0 3px #fecaca";
  }

  if (correctFlash) {
    boxShadow = `0 0 0 6px ${pvColor(cell.col)}22`;
  }

  return (
    <button
      type="button"
      data-col={cell.col}
      data-cell-id={cell.id}
      onClick={() => cell.editable && onActivate(cell.id)}
      onMouseEnter={(e) => onHoverCol(cell.col, e)}
      onMouseLeave={() => onHoverCol(null)}
      onFocus={() => onHoverCol(cell.col)}
      tabIndex={cell.editable ? 0 : -1}
      disabled={!cell.editable}
      style={{ ...base, background: bg, border, color, boxShadow }}
      aria-label={
        isCarry
          ? `Carry cell, ${placeName(cell.col).name} column${filled ? `, value ${cell.value}` : ""}`
          : isBorrow
            ? `Borrow indicator, ${placeName(cell.col).name} column${filled ? `, value ${cell.value}` : ""}`
            : isGhost
              ? `Place shift placeholder, ${placeName(cell.col).name}`
              : isReadOnly
                ? `Digit ${cell.value}, ${placeName(cell.col).name}`
                : filled
                  ? `Your answer ${cell.value}, ${placeName(cell.col).name} column`
                  : `Empty cell, ${placeName(cell.col).name} column`
      }
    >
      {content}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Main component.
 * ───────────────────────────────────────────────────────────── */

interface CarryLabProps {
  initialOperation?: Operation;
  initialLevel?: number;
}

export function CarryLab({
  initialOperation = "multiply",
  initialLevel = 1,
}: CarryLabProps) {
  const [operation, setOperation] = useState<Operation>(initialOperation);
  const [level, setLevel] = useState(initialLevel);

  // Per-operation default levels (so switching operations resets to lvl 1).
  const opMod = OPERATIONS[operation];

  // Fixed seed initial state (so SSR/hydration match); replaced on mount.
  const seedState = useMemo(() => opMod.buildTableau({ a: 12, b: 3 }), [opMod]);
  const [state, setState] = useState<TableauState>(seedState);
  const [activeId, setActiveId] = useState<string | null>(() =>
    opMod.firstEditableId(seedState),
  );

  const [wrongFlashId, setWrongFlashId] = useState<string | null>(null);
  const [correctFlashId, setCorrectFlashId] = useState<string | null>(null);
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);
  const [completed, setCompleted] = useState(false);
  const [counts, setCounts] = useState({ correct: 0, wrong: 0 });
  const [hintText, setHintText] = useState<string | null>(null);

  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const correctTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ─── Lifecycle ─────────────────────────────────────────── */

  const newProblem = useCallback(
    (opId: Operation = operation, lvl: number = level) => {
      const mod = OPERATIONS[opId];
      const { a, b } = mod.genProblem(lvl);
      const next = mod.buildTableau({ a, b });
      setState(next);
      setActiveId(mod.firstEditableId(next));
      setCompleted(false);
      setCounts({ correct: 0, wrong: 0 });
      setHintText(null);
      setWrongFlashId(null);
      setCorrectFlashId(null);
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
    (opId: Operation) => {
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

  /* ─── Coach narration ────────────────────────────────────── */

  const coach = useMemo(() => {
    if (completed) return null;
    if (!activeId) return null;
    return opMod.coachFor(state, activeId);
  }, [activeId, state, completed, opMod]);

  /* ─── Natural-order navigation ───────────────────────────── */

  const order = useMemo(() => opMod.naturalOrderIds(state), [state, opMod]);

  const advanceNatural = useCallback(
    (from: string | null = activeId) => {
      if (!from) return;
      const i = order.indexOf(from);
      for (let j = i + 1; j < order.length; j++) {
        const c = state.cells[order[j]];
        if (c && c.value !== c.correct) {
          setActiveId(c.id);
          return;
        }
      }
      for (const id of order) {
        const c = state.cells[id];
        if (c && c.value !== c.correct) {
          setActiveId(c.id);
          return;
        }
      }
    },
    [activeId, order, state.cells],
  );

  const moveActive = useCallback(
    (dRow: number, dCol: number) => {
      if (!activeId) return;
      const current = state.cells[activeId];
      if (!current) return;

      const editableRows = state.rows
        .filter((r) => r.kind !== "separator")
        .filter((r) =>
          Object.values(state.cells).some(
            (c) => c.row === r.id && c.editable && !c.hidden,
          ),
        )
        .map((r) => r.id);

      const rIdx = editableRows.indexOf(current.row);
      const targetRowIdx = Math.max(
        0,
        Math.min(editableRows.length - 1, rIdx + dRow),
      );
      const targetRow = editableRows[targetRowIdx] ?? current.row;
      const targetCol = Math.max(0, Math.min(state.cols - 1, current.col + dCol));

      const candidates = Object.values(state.cells)
        .filter((c) => c.row === targetRow && c.editable && !c.hidden)
        .sort(
          (a, b) =>
            Math.abs(a.col - targetCol) - Math.abs(b.col - targetCol) ||
            Math.abs(a.col - current.col) - Math.abs(b.col - current.col),
        );
      if (candidates.length > 0) setActiveId(candidates[0].id);
    },
    [activeId, state],
  );

  /* ─── Fill / clear / reveal ──────────────────────────────── */

  const showContextualHint = useCallback(
    (cell: Cell) => {
      const txt = opMod.hintFor(state, cell);
      setHintText(txt || null);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      hintTimerRef.current = setTimeout(() => setHintText(null), 6000);
    },
    [state, opMod],
  );

  const checkCompletion = useCallback((nextState: TableauState) => {
    const unfinished = Object.values(nextState.cells).some(
      (c) => c.editable && !c.hidden && c.value !== c.correct,
    );
    return !unfinished;
  }, []);

  const fillActive = useCallback(
    (digit: number) => {
      if (!activeId) return;
      const cell = state.cells[activeId];
      if (!cell || !cell.editable) return;
      if (cell.value === digit) return;

      if (digit === cell.correct) {
        setState((prev) => {
          const next = { ...prev, cells: { ...prev.cells } };
          next.cells[cell.id] = { ...next.cells[cell.id], value: digit };
          if (checkCompletion(next)) setTimeout(() => setCompleted(true), 50);
          return next;
        });
        setCounts((c) => ({ ...c, correct: c.correct + 1 }));
        setCorrectFlashId(cell.id);
        if (correctTimerRef.current) clearTimeout(correctTimerRef.current);
        correctTimerRef.current = setTimeout(() => setCorrectFlashId(null), 420);
        setTimeout(() => advanceNatural(cell.id), 0);
      } else {
        setCounts((c) => ({ ...c, wrong: c.wrong + 1 }));
        setWrongFlashId(cell.id);
        if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
        wrongTimerRef.current = setTimeout(() => setWrongFlashId(null), 500);
        showContextualHint(cell);
      }
    },
    [activeId, state, advanceNatural, checkCompletion, showContextualHint],
  );

  const clearActive = useCallback(() => {
    if (!activeId) return;
    setState((prev) => {
      const next = { ...prev, cells: { ...prev.cells } };
      next.cells[activeId] = { ...next.cells[activeId], value: null };
      return next;
    });
  }, [activeId]);

  const revealActive = useCallback(() => {
    if (!activeId) return;
    const cell = state.cells[activeId];
    if (!cell || !cell.editable) return;
    setState((prev) => {
      const next = { ...prev, cells: { ...prev.cells } };
      next.cells[cell.id] = { ...next.cells[cell.id], value: cell.correct };
      if (checkCompletion(next)) setTimeout(() => setCompleted(true), 50);
      return next;
    });
    setCorrectFlashId(cell.id);
    if (correctTimerRef.current) clearTimeout(correctTimerRef.current);
    correctTimerRef.current = setTimeout(() => setCorrectFlashId(null), 420);
    setTimeout(() => advanceNatural(cell.id), 0);
  }, [activeId, state, advanceNatural, checkCompletion]);

  /* ─── Keyboard ───────────────────────────────────────────── */

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
      if (k === "Backspace" || k === "Delete") { clearActive(); e.preventDefault(); return; }
      if (k === "Enter") { advanceNatural(); e.preventDefault(); return; }
      if (k === "ArrowLeft")  { moveActive(0, +1); e.preventDefault(); return; }
      if (k === "ArrowRight") { moveActive(0, -1); e.preventDefault(); return; }
      if (k === "ArrowUp")    { moveActive(-1, 0); e.preventDefault(); return; }
      if (k === "ArrowDown")  { moveActive(+1, 0); e.preventDefault(); return; }
      if (k === "h" || k === "H") {
        if (activeId) showContextualHint(state.cells[activeId]);
        e.preventDefault();
        return;
      }
      if (k === "r" || k === "R") { revealActive(); e.preventDefault(); return; }
      if (k === "n" || k === "N") { newProblem(); e.preventDefault(); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    activeId, state, fillActive, clearActive, advanceNatural,
    moveActive, showContextualHint, revealActive, newProblem,
  ]);

  /* ─── Column hover tooltip ───────────────────────────────── */

  const onHoverCol = useCallback(
    (col: number | null, e?: React.MouseEvent) => {
      setHoverCol(col);
      if (col !== null && e) setTooltip({ x: e.clientX, y: e.clientY });
      if (col === null) setTooltip(null);
    },
    [],
  );

  useEffect(() => {
    if (!tooltip) return;
    const handler = (e: MouseEvent) => {
      setTooltip({ x: e.clientX, y: e.clientY });
      const under = document.elementFromPoint(e.clientX, e.clientY);
      if (under && !under.closest("[data-col]") && !under.closest("[data-pv-label]")) {
        setHoverCol(null);
        setTooltip(null);
      }
    };
    document.addEventListener("mousemove", handler);
    return () => document.removeEventListener("mousemove", handler);
  }, [tooltip]);

  /* ─── Confetti ───────────────────────────────────────────── */

  useEffect(() => {
    if (!completed) return;
    const canvas = document.getElementById("carry-confetti") as HTMLCanvasElement | null;
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
        x: cx, y: cy,
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

  /* ─── Render helpers ─────────────────────────────────────── */

  const rowKindFor = useCallback(
    (rowId: string) => state.rows.find((r) => r.id === rowId)?.kind,
    [state.rows],
  );

  const rowIsVisible = useCallback(
    (rowId: string) => {
      const k = rowKindFor(rowId);
      // Hide carry/borrow rows when no cell in them is visible.
      if (k === "carry-mult" || k === "carry-add" || k === "borrow") {
        return Object.values(state.cells).some(
          (c) => c.row === rowId && !c.hidden,
        );
      }
      // Hide quotient row's separator if it's right after a separator-less row, etc.
      return true;
    },
    [rowKindFor, state.cells],
  );

  const gridVars: React.CSSProperties = {
    // @ts-expect-error css custom property
    "--cols": state.cols,
    "--cell": `${CELL_PX}px`,
    "--carry": `${CARRY_PX}px`,
    "--gap": `${GAP_PX}px`,
  };

  const completionEquation = useMemo(() => {
    const a = fromDigits(state.operandA);
    const b = fromDigits(state.operandB);
    if (state.operation === "add") return `${a} + ${b} = ${a + b}`;
    if (state.operation === "subtract") return `${a} − ${b} = ${a - b}`;
    if (state.operation === "multiply") return `${a} × ${b} = ${a * b}`;
    if (state.operation === "divide") {
      const q = Math.floor(a / b);
      const r = a % b;
      return r > 0 ? `${a} ÷ ${b} = ${q} remainder ${r}` : `${a} ÷ ${b} = ${q}`;
    }
    return "";
  }, [state]);

  /* ─── Presentational ─────────────────────────────────────── */

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center px-4 pb-10 pt-6 md:pt-10"
      style={{
        background:
          "linear-gradient(180deg, #f6f3ed 0%, #f1ede4 40%, #efe9df 100%)",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        color: "#1f2937",
        ...gridVars,
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
            Carry Lab
          </div>
          <div className="text-xs text-stone-500 mt-0.5">
            Arithmetic the way your brain wants to learn it.
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-white border border-stone-200 text-xs text-stone-600 shadow-sm">
          Level <span className="font-semibold text-stone-900">{level}</span>
          <span className="mx-1.5 text-stone-300">·</span>
          <span className="text-stone-700">{opMod.levels[level - 1]?.label}</span>
        </div>
      </header>

      {/* Operation tabs — large, clear */}
      <div
        className="w-full max-w-5xl mb-5 grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl border border-stone-200 bg-white"
        style={{ boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
      >
        {OPERATION_ORDER.map((opId) => {
          const m = OPERATIONS[opId];
          const Icon = OPERATION_ICONS[opId];
          const active = operation === opId;
          return (
            <button
              key={opId}
              type="button"
              onClick={() => switchOperation(opId)}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                active
                  ? "bg-stone-900 text-white shadow-md"
                  : "bg-transparent text-stone-500 hover:bg-stone-50 hover:text-stone-900"
              }`}
              style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
              aria-pressed={active}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-semibold">{m.label}</span>
              <span
                className={`text-xs ${active ? "text-white/60" : "text-stone-400"}`}
              >
                {m.symbol}
              </span>
            </button>
          );
        })}
      </div>

      <main className="w-full max-w-5xl grid md:grid-cols-[1fr_320px] gap-6">
        {/* ── Tableau card ── */}
        <section>
          <div
            className="relative bg-white rounded-3xl border border-stone-200/70 p-6 md:p-10"
            style={{
              boxShadow:
                "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.05)",
            }}
          >
            <div className="flex flex-col items-center relative z-10" style={{ gap: 4 }}>
              {state.rows.map((row) => {
                if (row.kind === "separator") {
                  return (
                    <div
                      key={row.id}
                      className="my-2"
                      style={{
                        width: `calc((var(--cell) + var(--gap)) * var(--cols))`,
                        height: 2,
                        background:
                          "linear-gradient(90deg, transparent, #d6d3d1 10%, #d6d3d1 90%, transparent)",
                      }}
                    />
                  );
                }
                if (!rowIsVisible(row.id)) return null;

                const isCompactRow =
                  row.kind === "carry-mult" ||
                  row.kind === "carry-add" ||
                  row.kind === "borrow";
                const prefix = row.prefix ?? "";

                return (
                  <div
                    key={row.id}
                    className="grid relative"
                    style={{
                      gridAutoFlow: "column",
                      gridAutoColumns: "var(--cell)",
                      columnGap: "var(--gap)",
                      justifyItems: "center",
                      alignItems: "center",
                    }}
                  >
                    {prefix && (
                      <span
                        className="absolute text-stone-500 text-xl select-none whitespace-nowrap"
                        style={{
                          right: "calc(100% + 12px)",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontWeight: 500,
                          fontFamily: "var(--font-outfit), system-ui, sans-serif",
                        }}
                      >
                        {prefix}
                      </span>
                    )}
                    {Array.from({ length: state.cols }).map((_, i) => {
                      const c = state.cols - 1 - i;
                      const cell = state.cells[`${row.id}-${c}`];
                      if (!cell) {
                        return (
                          <div
                            key={c}
                            style={{
                              width: isCompactRow ? CARRY_PX : CELL_PX,
                              height: isCompactRow ? CARRY_PX : CELL_PX,
                            }}
                          />
                        );
                      }
                      return (
                        <CellView
                          key={cell.id}
                          cell={cell}
                          isFocused={activeId === cell.id}
                          wrongFlash={wrongFlashId === cell.id}
                          correctFlash={correctFlashId === cell.id}
                          onActivate={setActiveId}
                          onHoverCol={onHoverCol}
                        />
                      );
                    })}
                  </div>
                );
              })}

              {/* Place-value labels */}
              <div
                className="grid mt-5"
                style={{
                  gridAutoFlow: "column",
                  gridAutoColumns: "var(--cell)",
                  columnGap: "var(--gap)",
                  justifyItems: "center",
                  justifyContent: "center",
                }}
              >
                {Array.from({ length: state.cols }).map((_, i) => {
                  const c = state.cols - 1 - i;
                  const p = placeName(c);
                  const isActive = hoverCol === c;
                  return (
                    <div
                      key={c}
                      data-pv-label
                      data-col={c}
                      onMouseEnter={(e) => onHoverCol(c, e)}
                      onMouseLeave={() => onHoverCol(null)}
                      className="w-full text-center pt-2 transition-colors duration-150 cursor-help"
                      style={{
                        borderTop: `1px solid ${isActive ? pvColor(c) : "#e7e5e4"}`,
                        color: isActive ? pvColor(c) : "#78716c",
                      }}
                    >
                      <div
                        className="text-[11px] font-semibold tracking-[0.1em] uppercase"
                        style={{
                          fontFamily: "var(--font-outfit), system-ui, sans-serif",
                        }}
                      >
                        {p.short}
                      </div>
                      <div className="text-[10px] opacity-70 mt-0.5 tabular-nums">
                        {p.power}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2 justify-center mt-5">
            <ControlButton
              onClick={() => activeId && showContextualHint(state.cells[activeId])}
              icon={<Lightbulb className="w-4 h-4" />}
              label="Hint"
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
          <Panel title="Coach">
            {coach ? (
              <>
                <div
                  className="text-xs font-semibold uppercase tracking-[0.08em] mb-2"
                  style={{ color: pvColor(state.cells[activeId!]?.col ?? 0) }}
                >
                  {coach.title}
                </div>
                <div className="text-sm leading-relaxed text-stone-700 space-y-1.5">
                  {coach.lines.map((line, i) => (
                    <p key={i} dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
                  ))}
                </div>
              </>
            ) : completed ? (
              <div className="text-sm text-stone-700 space-y-2">
                <div className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600" /> Solved!
                </div>
                <div className="inline-block px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 font-mono tabular-nums text-sm">
                  {completionEquation}
                </div>
                <p className="text-stone-500">
                  Press <Kbd>N</Kbd> for another problem, or try a harder level.
                </p>
              </div>
            ) : (
              <p className="text-sm text-stone-500">
                Click a cell, or hover a column to see its place value.
              </p>
            )}

            {hintText && (
              <div
                className="mt-3 px-3 py-2.5 rounded-xl text-[12.5px] leading-relaxed"
                style={{
                  background:
                    "linear-gradient(135deg, #fffbeb, #fef3c7 60%, #fde68a)",
                  border: "1px solid #fcd34d",
                  color: "#92400e",
                }}
                dangerouslySetInnerHTML={{ __html: renderInline(hintText) }}
              />
            )}
          </Panel>

          <Panel title="Progress">
            <div className="grid grid-cols-2 gap-2.5">
              <Stat label="Correct" value={counts.correct} tone="ok" />
              <Stat label="Wrong" value={counts.wrong} tone="warn" />
            </div>
          </Panel>

          <Panel title="Keyboard" icon={<KeyboardIcon className="w-3.5 h-3.5" />}>
            <div className="flex flex-wrap gap-1.5">
              <KeyHint keys="← → ↑ ↓" action="move" />
              <KeyHint keys="0–9" action="fill" />
              <KeyHint keys="⌫" action="clear" />
              <KeyHint keys="Enter" action="next" />
              <KeyHint keys="H" action="hint" />
              <KeyHint keys="R" action="reveal" />
              <KeyHint keys="N" action="new" />
            </div>
          </Panel>
        </aside>
      </main>

      {/* Floating tooltip */}
      {tooltip && hoverCol !== null && (
        <div
          className="fixed pointer-events-none z-50 px-3 py-2 rounded-lg text-xs shadow-lg"
          style={{
            left: tooltip.x,
            top: tooltip.y - 18,
            transform: "translate(-50%, -100%)",
            background: "#ffffff",
            border: `1px solid ${pvColor(hoverCol)}40`,
            boxShadow: "0 4px 20px rgba(15,23,42,0.10)",
            fontFamily: "var(--font-outfit), system-ui, sans-serif",
          }}
        >
          <div
            className="text-[13px] font-semibold leading-tight"
            style={{ color: pvColor(hoverCol) }}
          >
            {placeName(hoverCol).name}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5 tabular-nums">
            place · {placeName(hoverCol).power}
          </div>
        </div>
      )}

      <canvas id="carry-confetti" className="fixed inset-0 pointer-events-none z-40" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Sub-components
 * ───────────────────────────────────────────────────────────── */

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

/** Minimal Markdown-ish inline: **bold**, _italic_. */
function renderInline(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-stone-900">$1</strong>')
    .replace(/_(.+?)_/g, '<em class="text-stone-500">$1</em>');
}
