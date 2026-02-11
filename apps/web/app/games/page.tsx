import Link from "next/link";
import { Lock, Sparkles, BarChart3, ChevronRight } from "lucide-react";
import { GamesArenaHeader } from "./GamesArenaHeader";
import { GameIcon } from "@/components/games/GameIcon";

/* ── Types ─────────────────────────────────────────────────────────── */

interface GameCardProps {
  title: string;
  description: string;
  iconId: string;
  href: string;
  color: string;
  available: boolean;
  badge?: string;
  grade?: string;
}

interface Section {
  id: string;
  title: string;
  subtitle: string;
  iconId: string;
  accent: string;        // tailwind color for accents (e.g. "emerald")
  games: GameCardProps[];
}

/* ── Game Data by Category ─────────────────────────────────────────── */

const SECTIONS: Section[] = [
  {
    id: "math",
    title: "Math",
    subtitle: "Arithmetic, fractions, decimals, graphing, and more",
    iconId: "cat-math",
    accent: "emerald",
    games: [
      { title: "Math Blitz", description: "Solve arithmetic before the timer runs out!", iconId: "math-blitz", href: "/games/math-blitz", color: "#10b981", available: true, grade: "1-5" },
      { title: "Times Tables", description: "Master multiplication with sprint and survival modes.", iconId: "times-table", href: "/games/times-table", color: "#8b5cf6", available: true, grade: "2-5" },
      { title: "Fraction Fighter", description: "Compare fractions — tap the bigger one!", iconId: "fraction-fighter", href: "/games/fraction-fighter", color: "#ef4444", available: true, grade: "3-6" },
      { title: "Fraction Lab", description: "See, compare, add fractions with visual bars and pies.", iconId: "fraction-lab", href: "/games/fraction-lab", color: "#f97316", available: true, grade: "3-7" },
      { title: "Decimal Dash", description: "Number lines, operations, and fraction-decimal conversions.", iconId: "decimal-dash", href: "/games/decimal-dash", color: "#14b8a6", available: true, grade: "4-7" },
      { title: "Graph Plotter", description: "Plot points, find slopes, and draw lines on coordinate grids.", iconId: "graph-plotter", href: "/games/graph-plotter", color: "#6366f1", available: true, grade: "6-9" },
      { title: "Graph Reading", description: "Read charts, spot trends, and identify mathematical functions.", iconId: "graph-reading", href: "/games/graph-reading", color: "#818cf8", available: true, badge: "NEW", grade: "1-12" },
    ],
  },
  {
    id: "language",
    title: "Language & Reading",
    subtitle: "Build vocabulary, spelling, and reading speed",
    iconId: "cat-language",
    accent: "amber",
    games: [
      { title: "Letter Rain", description: "Catch falling letters to rebuild educational sentences.", iconId: "letter-rain", href: "/games/letter-rain", color: "#6366f1", available: true, grade: "K-3" },
      { title: "Word Builder", description: "Unscramble letters to build vocabulary words.", iconId: "word-builder", href: "/games/word-builder", color: "#f59e0b", available: true, grade: "2-6" },
    ],
  },
  {
    id: "science",
    title: "Science",
    subtitle: "Chemistry, biology, physics, and measurement",
    iconId: "cat-science",
    accent: "blue",
    games: [
      { title: "Science Study", description: "Adaptive quizzes across chemistry, biology, physics, and earth science.", iconId: "science-study", href: "/games/science-study", color: "#6366f1", available: true, grade: "4-12" },
      { title: "Element Match", description: "Match element symbols to names. Memory meets chemistry!", iconId: "element-match", href: "/games/element-match", color: "#3b82f6", available: true, grade: "5-9" },
      { title: "Equation Balancer", description: "Balance chemical equations. Conservation of mass!", iconId: "equation-balancer", href: "/games/equation-balancer", color: "#8b5cf6", available: true, grade: "7-12" },
      { title: "Genetics Lab", description: "Punnett squares, offspring ratios, Mendelian genetics.", iconId: "genetics-lab", href: "/games/genetics-lab", color: "#22c55e", available: true, grade: "7-12" },
      { title: "Unit Converter", description: "Race to convert between units of length, mass, and more.", iconId: "unit-converter", href: "/games/unit-converter", color: "#0ea5e9", available: true, grade: "4-8" },
    ],
  },
  {
    id: "history",
    title: "History & Geography",
    subtitle: "Timelines, world knowledge, and media literacy",
    iconId: "cat-history",
    accent: "purple",
    games: [
      { title: "Geography Challenge", description: "Learn world capitals, countries, rivers, mountains, and landmarks!", iconId: "geography", href: "/games/geography", color: "#06b6d4", available: true, grade: "3-9" },
      { title: "Timeline Dash", description: "Place historical events in the right order on a timeline.", iconId: "timeline-dash", href: "/games/timeline-dash", color: "#8b5cf6", available: true, grade: "4-9" },
      { title: "Fake News Detective", description: "Spot misinformation! Identify clickbait, bad sources, and logical fallacies.", iconId: "fake-news-detective", href: "/games/fake-news-detective", color: "#f59e0b", available: true, badge: "NEW", grade: "3-12" },
    ],
  },
  {
    id: "cs",
    title: "Computer Science",
    subtitle: "Patterns, algorithms, binary, and debugging",
    iconId: "cat-cs",
    accent: "cyan",
    games: [
      { title: "Pattern Machine", description: "Complete sequences, find loops, and master computational patterns.", iconId: "pattern-machine", href: "/games/pattern-machine", color: "#06b6d4", available: true, badge: "NEW", grade: "1-8" },
      { title: "Binary & Bits", description: "Convert binary, hex, and learn logic gates.", iconId: "binary-bits", href: "/games/binary-bits", color: "#3b82f6", available: true, badge: "NEW", grade: "4-12" },
      { title: "Debug Detective", description: "Find the bug! Spot errors in pseudocode and fix broken programs.", iconId: "debug-detective", href: "/games/debug-detective", color: "#f59e0b", available: true, badge: "NEW", grade: "5-12" },
      { title: "Algorithm Arena", description: "Sort, search, and predict — visualize how algorithms work.", iconId: "algorithm-arena", href: "/games/algorithm-arena", color: "#8b5cf6", available: true, badge: "NEW", grade: "6-12" },
    ],
  },
  {
    id: "design",
    title: "Design",
    subtitle: "Typography, layout, color harmony, and visual design",
    iconId: "cat-design",
    accent: "rose",
    games: [
      { title: "Design Eye", description: "Spot alignment errors, bad spacing, and design flaws.", iconId: "design-eye", href: "/games/design-eye", color: "#ec4899", available: true, badge: "NEW", grade: "3-12" },
      { title: "Font Explorer", description: "Serif or sans-serif? Learn to identify, pair, and choose fonts.", iconId: "font-explorer", href: "/games/font-explorer", color: "#a855f7", available: true, badge: "NEW", grade: "4-10" },
      { title: "Layout Lab", description: "Align, space, and balance elements like a professional designer.", iconId: "layout-lab", href: "/games/layout-lab", color: "#f97316", available: true, badge: "NEW", grade: "3-10" },
      { title: "Color Harmony", description: "Build palettes, check contrast, and master color theory.", iconId: "color-harmony", href: "/games/color-harmony", color: "#14b8a6", available: true, badge: "NEW", grade: "3-12" },
    ],
  },
  {
    id: "touch",
    title: "Touch & Canvas",
    subtitle: "Draw, trace, and interact with finger, mouse, or stylus",
    iconId: "cat-touch",
    accent: "pink",
    games: [
      { title: "Maze Runner", description: "Navigate mazes and solve questions at forks.", iconId: "maze-runner", href: "/games/maze-runner", color: "#06b6d4", available: true, grade: "K-5" },
      { title: "Trace & Learn", description: "Trace letters, numbers, and shapes. Score by accuracy!", iconId: "trace-learn", href: "/games/trace-learn", color: "#a855f7", available: true, grade: "Pre-K-2" },
      { title: "Color Lab", description: "Color educational diagrams — cells, maps, periodic table.", iconId: "color-lab", href: "/games/color-lab", color: "#ec4899", available: true, grade: "3-8" },
      { title: "Connect the Dots", description: "Connect numbered dots to reveal shapes. Count by 2s, primes!", iconId: "connect-dots", href: "/games/connect-dots", color: "#3b82f6", available: true, grade: "K-3" },
      { title: "Scratch & Reveal", description: "Scratch off cards to reveal answers across all subjects.", iconId: "scratch-reveal", href: "/games/scratch-reveal", color: "#eab308", available: true, grade: "2-8" },
    ],
  },
  {
    id: "ereader",
    title: "E-Reader Friendly",
    subtitle: "Tap only, high contrast, no animations — works on Kindle, Kobo, Boox",
    iconId: "cat-ereader",
    accent: "slate",
    games: [
      { title: "Sudoku", description: "Classic 9x9 number puzzles. Tap-only, no dragging needed.", iconId: "sudoku", href: "/games/sudoku", color: "#64748b", available: true, badge: "E-INK", grade: "3-12" },
      { title: "Crossword", description: "Educational crosswords with on-screen keyboard.", iconId: "crossword", href: "/games/crossword", color: "#64748b", available: true, badge: "E-INK", grade: "4-9" },
      { title: "Word Search", description: "Find hidden words — tap start and end letters.", iconId: "word-search", href: "/games/word-search", color: "#64748b", available: true, badge: "E-INK", grade: "2-6" },
      { title: "Trivia Quiz", description: "Multiple-choice trivia with large, e-reader-friendly buttons.", iconId: "trivia-quiz", href: "/games/trivia-quiz", color: "#64748b", available: true, badge: "E-INK", grade: "3-9" },
      { title: "Nonogram", description: "Fill cells using number clues to reveal a hidden picture.", iconId: "nonogram", href: "/games/nonogram", color: "#64748b", available: true, badge: "E-INK", grade: "3-9" },
      { title: "Number Puzzle", description: "Slide tiles into order. Classic 15-puzzle with math mode!", iconId: "number-puzzle", href: "/games/number-puzzle", color: "#64748b", available: true, badge: "E-INK", grade: "K-5" },
    ],
  },
];

const TOTAL_GAMES = SECTIONS.reduce((sum, s) => sum + s.games.length, 0) + 1; // +1 for Daily

/* ── Accent color maps (Tailwind needs static classes) ────────────── */

const ACCENT_BG: Record<string, string> = {
  emerald: "bg-emerald-500/10",
  amber: "bg-amber-500/10",
  blue: "bg-blue-500/10",
  purple: "bg-purple-500/10",
  cyan: "bg-cyan-500/10",
  rose: "bg-rose-500/10",
  pink: "bg-pink-500/10",
  slate: "bg-slate-500/10",
};

const ACCENT_BORDER: Record<string, string> = {
  emerald: "border-emerald-500/20",
  amber: "border-amber-500/20",
  blue: "border-blue-500/20",
  purple: "border-purple-500/20",
  cyan: "border-cyan-500/20",
  rose: "border-rose-500/20",
  pink: "border-pink-500/20",
  slate: "border-slate-500/20",
};

const ACCENT_TEXT: Record<string, string> = {
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  blue: "text-blue-400",
  purple: "text-purple-400",
  cyan: "text-cyan-400",
  rose: "text-rose-400",
  pink: "text-pink-400",
  slate: "text-slate-400",
};

const ACCENT_GRADIENT: Record<string, string> = {
  emerald: "from-emerald-400 to-teal-400",
  amber: "from-amber-400 to-orange-400",
  blue: "from-blue-400 to-indigo-400",
  purple: "from-purple-400 to-fuchsia-400",
  cyan: "from-cyan-400 to-sky-400",
  rose: "from-rose-400 to-pink-400",
  pink: "from-pink-400 to-fuchsia-400",
  slate: "from-slate-400 to-zinc-400",
};

/* ── Badge Component ───────────────────────────────────────────────── */

function Badge({ text }: { text: string }) {
  const styles: Record<string, string> = {
    NEW: "bg-emerald-500/90 text-white",
    "E-INK": "bg-slate-600/90 text-slate-100",
  };
  return (
    <span
      className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md ${styles[text] ?? "bg-white/10 text-white"}`}
    >
      {text}
    </span>
  );
}

/* ── Grade Pill ────────────────────────────────────────────────────── */

function GradePill({ grade }: { grade: string }) {
  return (
    <span className="text-[10px] font-medium text-slate-500 tabular-nums">
      Gr {grade}
    </span>
  );
}

/* ── Game Card ─────────────────────────────────────────────────────── */

function GameCard({
  title,
  description,
  iconId,
  href,
  color,
  available,
  badge,
  grade,
}: GameCardProps) {
  const inner = (
    <div
      className={`relative group rounded-2xl border transition-all duration-200 ${
        available
          ? "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] cursor-pointer"
          : "border-white/[0.04] bg-white/[0.01] opacity-35 cursor-not-allowed"
      }`}
    >
      <div className="flex items-start gap-4 p-4">
        {/* Icon */}
        <div className="relative shrink-0 w-12 h-12 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-xl opacity-15 group-hover:opacity-25 transition-opacity"
            style={{ backgroundColor: color }}
          />
          <GameIcon id={iconId} size={40} className="relative z-10" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-white truncate">{title}</h3>
            {!available && <Lock className="w-3 h-3 text-slate-600 shrink-0" />}
            {badge && <Badge text={badge} />}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{description}</p>
          <div className="flex items-center gap-3 mt-2">
            {grade && <GradePill grade={grade} />}
            {available && (
              <span
                className="text-[11px] font-semibold transition-colors group-hover:brightness-125"
                style={{ color }}
              >
                Play <ChevronRight className="inline w-3 h-3 -mt-px group-hover:translate-x-0.5 transition-transform" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (!available) return inner;
  return <Link href={href}>{inner}</Link>;
}

/* ── Section ──────────────────────────────────────────────────────── */

function SectionBlock({ section }: { section: Section }) {
  const a = section.accent;
  return (
    <section id={section.id} className="scroll-mt-16">
      {/* Section header */}
      <div className={`rounded-xl border ${ACCENT_BORDER[a]} ${ACCENT_BG[a]} px-5 py-4 mb-4`}>
        <div className="flex items-center gap-3">
          <GameIcon id={section.iconId} size={28} className="rounded-md shrink-0" />
          <div className="flex-1 min-w-0">
            <h2
              className={`text-base font-bold bg-gradient-to-r ${ACCENT_GRADIENT[a]} bg-clip-text text-transparent`}
            >
              {section.title}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">{section.subtitle}</p>
          </div>
          <span className="text-[11px] text-slate-600 font-medium tabular-nums shrink-0">
            {section.games.length} {section.games.length === 1 ? "game" : "games"}
          </span>
        </div>
      </div>

      {/* Game grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {section.games.map((game) => (
          <GameCard key={game.title} {...game} />
        ))}
      </div>
    </section>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0c0e24] to-slate-950">
      <GamesArenaHeader />

      {/* ── Hero ── */}
      <section className="mx-auto max-w-5xl px-6 pt-14 pb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Game{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Arena
          </span>
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
          {TOTAL_GAMES} educational games with adaptive difficulty.
          Track progress, earn medals, compete with yourself.
        </p>
      </section>

      {/* ── Daily Challenge (Featured Banner) ── */}
      <section className="mx-auto max-w-5xl px-6 mb-8">
        <Link href="/games/daily-challenge">
          <div className="relative overflow-hidden rounded-2xl border border-orange-500/15 bg-gradient-to-r from-orange-500/[0.06] via-amber-500/[0.03] to-red-500/[0.06] p-5 group hover:border-orange-500/30 transition-all duration-200">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-orange-500/8 rounded-full blur-3xl" />
            <div className="relative flex items-center gap-4">
              <GameIcon id="daily-challenge" size={48} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[9px] font-bold tracking-widest uppercase text-orange-400 bg-orange-500/12 px-2 py-0.5 rounded-md">
                    Daily
                  </span>
                  <Sparkles className="w-3 h-3 text-amber-400/60" />
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Daily Challenge
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  A new challenge every day across all subjects. Build your streak!
                </p>
              </div>
              <span className="hidden sm:flex items-center gap-1 text-orange-400/80 font-medium text-xs group-hover:text-orange-300 transition-colors shrink-0">
                Play today&apos;s
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* ── Quick Nav ── */}
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-lg border-b border-white/[0.03] py-2.5 mb-6">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            <span className="text-[10px] text-slate-600 font-medium shrink-0 mr-1">Sections</span>
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`shrink-0 text-[11px] px-2.5 py-1 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all inline-flex items-center gap-1.5 ${ACCENT_TEXT[s.accent]} hover:text-white`}
              >
                <GameIcon id={s.iconId} size={14} className="rounded-[3px]" />
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Game Sections ── */}
      <div className="mx-auto max-w-5xl px-6 pb-8 space-y-8">
        {SECTIONS.map((section) => (
          <SectionBlock key={section.id} section={section} />
        ))}
      </div>

      {/* ── Progress Dashboard CTA ── */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <Link href="/games/progress">
          <div className="rounded-xl border border-indigo-500/10 bg-indigo-500/[0.04] p-4 flex items-center gap-3 group hover:border-indigo-500/20 transition-all duration-200">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/12 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 transition-colors">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white">Progress Dashboard</h3>
              <p className="text-[11px] text-slate-500">Stats, achievements, streaks, and activity heatmap</p>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-400/60 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </div>
        </Link>
      </section>
    </div>
  );
}
