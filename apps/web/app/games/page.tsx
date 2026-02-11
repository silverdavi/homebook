import Link from "next/link";
import { Lock, Sparkles, BarChart3 } from "lucide-react";
import { GamesArenaHeader } from "./GamesArenaHeader";
import { GameIcon } from "@/components/games/GameIcon";

/* ── Types ─────────────────────────────────────────────────────────── */

interface GameCardProps {
  title: string;
  description: string;
  emoji: string;
  iconId: string;          // matches /icons/games/256/{iconId}.png
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
  emoji: string;
  iconId: string;          // section icon ID
  gradient: string;       // gradient for section header text
  borderAccent: string;   // border accent for section
  games: GameCardProps[];
}

/* ── Game Data by Category ─────────────────────────────────────────── */

const SECTIONS: Section[] = [
  {
    id: "language",
    title: "Language & Reading",
    subtitle: "Build vocabulary, spelling, and reading speed",
    emoji: "📖",
    iconId: "cat-language",
    gradient: "from-amber-400 to-orange-400",
    borderAccent: "border-amber-500/20",
    games: [
      { title: "Letter Rain", description: "Catch falling letters to rebuild educational sentences.", emoji: "🌧️", iconId: "letter-rain", href: "/games/letter-rain", color: "#6366f1", available: true, grade: "K-3" },
      { title: "Word Builder", description: "Unscramble letters to build vocabulary words.", emoji: "🔤", iconId: "word-builder", href: "/games/word-builder", color: "#f59e0b", available: true, grade: "2-6" },
    ],
  },
  {
    id: "math",
    title: "Math",
    subtitle: "Arithmetic, fractions, decimals, graphing, and more",
    emoji: "🧮",
    iconId: "cat-math",
    gradient: "from-emerald-400 to-cyan-400",
    borderAccent: "border-emerald-500/20",
    games: [
      { title: "Math Blitz", description: "Solve arithmetic before the timer runs out!", emoji: "⚡", iconId: "math-blitz", href: "/games/math-blitz", color: "#10b981", available: true, grade: "1-5" },
      { title: "Fraction Fighter", description: "Compare fractions — tap the bigger one!", emoji: "⚔️", iconId: "fraction-fighter", href: "/games/fraction-fighter", color: "#ef4444", available: true, grade: "3-6" },
      { title: "Times Tables", description: "Master multiplication with sprint and survival modes.", emoji: "✖️", iconId: "times-table", href: "/games/times-table", color: "#8b5cf6", available: true, grade: "2-5" },
      { title: "Fraction Lab", description: "See, compare, add fractions with visual bars and pies.", emoji: "🥧", iconId: "fraction-lab", href: "/games/fraction-lab", color: "#f97316", available: true, grade: "3-7" },
      { title: "Decimal Dash", description: "Number lines, operations, and fraction-decimal conversions.", emoji: "🔢", iconId: "decimal-dash", href: "/games/decimal-dash", color: "#14b8a6", available: true, badge: "NEW", grade: "4-7" },
      { title: "Graph Plotter", description: "Plot points, find slopes, and draw lines on coordinate grids.", emoji: "📈", iconId: "graph-plotter", href: "/games/graph-plotter", color: "#6366f1", available: true, badge: "NEW", grade: "6-9" },
    ],
  },
  {
    id: "science",
    title: "Science",
    subtitle: "Chemistry, biology, physics, and measurement",
    emoji: "🔬",
    iconId: "cat-science",
    gradient: "from-blue-400 to-violet-400",
    borderAccent: "border-blue-500/20",
    games: [
      { title: "Science Study", description: "Learn chemistry, biology, physics & earth science with adaptive quizzes!", emoji: "🔬", iconId: "science-study", href: "/games/science-study", color: "#6366f1", available: true, badge: "NEW", grade: "4-12" },
      { title: "Element Match", description: "Match element symbols to names. Memory meets chemistry!", emoji: "🧪", iconId: "element-match", href: "/games/element-match", color: "#3b82f6", available: true, grade: "5-9" },
      { title: "Equation Balancer", description: "Balance chemical equations. Conservation of mass!", emoji: "⚖️", iconId: "equation-balancer", href: "/games/equation-balancer", color: "#8b5cf6", available: true, grade: "7-12" },
      { title: "Genetics Lab", description: "Punnett squares, offspring ratios, Mendelian genetics.", emoji: "🧬", iconId: "genetics-lab", href: "/games/genetics-lab", color: "#22c55e", available: true, grade: "7-12" },
      { title: "Unit Converter", description: "Race to convert between units of length, mass, and more.", emoji: "📏", iconId: "unit-converter", href: "/games/unit-converter", color: "#0ea5e9", available: true, grade: "4-8" },
    ],
  },
  {
    id: "history",
    title: "History & Geography",
    subtitle: "Timeline skills and historical knowledge",
    emoji: "🌍",
    iconId: "cat-history",
    gradient: "from-purple-400 to-pink-400",
    borderAccent: "border-purple-500/20",
    games: [
      { title: "Geography Challenge", description: "Learn world capitals, countries, rivers, mountains & landmarks!", emoji: "🌍", iconId: "geography", href: "/games/geography", color: "#06b6d4", available: true, badge: "NEW", grade: "3-9" },
      { title: "Timeline Dash", description: "Place historical events in the right order on a timeline.", emoji: "🕰️", iconId: "timeline-dash", href: "/games/timeline-dash", color: "#8b5cf6", available: true, grade: "4-9" },
      { title: "Fake News Detective", description: "Spot misinformation! Learn to identify clickbait, bad sources & logical fallacies.", emoji: "🔍", iconId: "fake-news-detective", href: "/games/fake-news-detective", color: "#f59e0b", available: true, badge: "NEW", grade: "3-12" },
    ],
  },
  {
    id: "touch",
    title: "Touch & Canvas",
    subtitle: "Draw, trace, and interact — works with finger, mouse, or stylus",
    emoji: "✍️",
    iconId: "cat-touch",
    gradient: "from-pink-400 to-rose-400",
    borderAccent: "border-pink-500/20",
    games: [
      { title: "Maze Runner", description: "Navigate mazes and solve questions at forks.", emoji: "🏃", iconId: "maze-runner", href: "/games/maze-runner", color: "#06b6d4", available: true, badge: "NEW", grade: "K-5" },
      { title: "Trace & Learn", description: "Trace letters, numbers, and shapes. Score by accuracy!", emoji: "✏️", iconId: "trace-learn", href: "/games/trace-learn", color: "#a855f7", available: true, badge: "NEW", grade: "Pre-K-2" },
      { title: "Color Lab", description: "Color educational diagrams — cells, maps, periodic table.", emoji: "🎨", iconId: "color-lab", href: "/games/color-lab", color: "#ec4899", available: true, badge: "NEW", grade: "3-8" },
      { title: "Connect the Dots", description: "Connect numbered dots to reveal shapes. Count by 2s, primes!", emoji: "🔵", iconId: "connect-dots", href: "/games/connect-dots", color: "#3b82f6", available: true, badge: "NEW", grade: "K-3" },
      { title: "Scratch & Reveal", description: "Scratch off cards to reveal answers across all subjects.", emoji: "🎫", iconId: "scratch-reveal", href: "/games/scratch-reveal", color: "#eab308", available: true, badge: "NEW", grade: "2-8" },
    ],
  },
  {
    id: "ereader",
    title: "E-Reader Friendly",
    subtitle: "Works on Kindle, Kobo, Boox — tap only, high contrast, no animations",
    emoji: "📱",
    iconId: "cat-ereader",
    gradient: "from-slate-300 to-slate-400",
    borderAccent: "border-slate-500/20",
    games: [
      { title: "Sudoku", description: "Classic 9x9 number puzzles. Tap-only, no dragging needed.", emoji: "🔢", iconId: "sudoku", href: "/games/sudoku", color: "#64748b", available: true, badge: "E-INK", grade: "3-12" },
      { title: "Crossword", description: "Educational crosswords with on-screen keyboard.", emoji: "📝", iconId: "crossword", href: "/games/crossword", color: "#64748b", available: true, badge: "E-INK", grade: "4-9" },
      { title: "Word Search", description: "Find hidden words — tap start and end letters.", emoji: "🔍", iconId: "word-search", href: "/games/word-search", color: "#64748b", available: true, badge: "E-INK", grade: "2-6" },
      { title: "Trivia Quiz", description: "Multiple-choice trivia with large, e-reader-friendly buttons.", emoji: "❓", iconId: "trivia-quiz", href: "/games/trivia-quiz", color: "#64748b", available: true, badge: "E-INK", grade: "3-9" },
      { title: "Nonogram", description: "Fill cells using number clues to reveal a hidden picture.", emoji: "🧩", iconId: "nonogram", href: "/games/nonogram", color: "#64748b", available: true, badge: "E-INK", grade: "3-9" },
      { title: "Number Puzzle", description: "Slide tiles into order. Classic 15-puzzle with math mode!", emoji: "🎲", iconId: "number-puzzle", href: "/games/number-puzzle", color: "#64748b", available: true, badge: "E-INK", grade: "K-5" },
    ],
  },
];

const TOTAL_GAMES = SECTIONS.reduce((sum, s) => sum + s.games.length, 0) + 1; // +1 for Daily

/* ── Badge Component ───────────────────────────────────────────────── */

function Badge({ text, color }: { text: string; color: string }) {
  const bgMap: Record<string, string> = {
    NEW: "bg-emerald-500/90 text-white",
    DAILY: "bg-orange-500/90 text-white",
    "E-INK": "bg-slate-600/90 text-slate-100",
  };
  return (
    <span
      className={`absolute -top-2 -right-2 text-[10px] font-extrabold tracking-wider px-2.5 py-0.5 rounded-full shadow-lg ${bgMap[text] ?? ""}`}
      style={bgMap[text] ? undefined : { backgroundColor: color }}
    >
      {text}
    </span>
  );
}

/* ── Game Card ─────────────────────────────────────────────────────── */

function GameCard({
  title,
  description,
  emoji,
  iconId,
  href,
  color,
  available,
  badge,
  grade,
}: GameCardProps) {
  const card = (
    <div
      className={`relative group rounded-2xl border p-5 transition-all duration-300 ${
        available
          ? "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 cursor-pointer"
          : "border-white/5 bg-white/[0.01] opacity-40 cursor-not-allowed"
      }`}
    >
      {badge && <Badge text={badge} color={color} />}
      {grade && (
        <span className="absolute -top-2 left-2 text-[9px] font-bold tracking-wide px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
          Gr {grade}
        </span>
      )}

      {/* Game icon with color glow */}
      <div className="relative w-14 h-14 mb-3 flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-xl opacity-20 group-hover:opacity-35 transition-opacity blur-sm"
          style={{ backgroundColor: color }}
        />
        <GameIcon id={iconId} size={48} fallback={emoji} className="relative z-10" />
      </div>

      <h3 className="text-[15px] font-bold text-white mb-1 tracking-tight flex items-center gap-2">
        {title}
        {!available && <Lock className="w-3 h-3 text-slate-600" />}
      </h3>
      <p className="text-[13px] text-slate-400 leading-relaxed line-clamp-2">
        {description}
      </p>
      {available && (
        <div
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[13px] font-bold tracking-wide transition-all group-hover:brightness-110 group-hover:scale-105"
          style={{ backgroundColor: `${color}20`, color }}
        >
          Play Now
          <span className="group-hover:translate-x-1 transition-transform duration-200">
            →
          </span>
        </div>
      )}
      {!available && (
        <div className="mt-3 text-xs text-slate-600 font-medium">
          Coming soon
        </div>
      )}
    </div>
  );

  if (!available) return card;
  return <Link href={href}>{card}</Link>;
}

/* ── Section Header ────────────────────────────────────────────────── */

function SectionHeader({
  section,
}: {
  section: Section;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <GameIcon id={section.iconId} size={32} fallback={section.emoji} />
      <div>
        <h2
          className={`text-lg font-bold bg-gradient-to-r ${section.gradient} bg-clip-text text-transparent`}
        >
          {section.title}
        </h2>
        <p className="text-xs text-slate-500">{section.subtitle}</p>
      </div>
      <div className="flex-1 border-t border-white/[0.06] ml-3" />
      <span className="text-xs text-slate-600 font-medium tabular-nums">
        {section.games.length} {section.games.length === 1 ? "game" : "games"}
      </span>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0c0e24] to-slate-950">
      <GamesArenaHeader />

      {/* ── Hero ── */}
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Game{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Arena
          </span>
        </h1>
        <p className="mt-3 text-slate-400 max-w-lg mx-auto leading-relaxed">
          {TOTAL_GAMES} educational games that make studying fun.
          Track your progress, earn medals, and compete with yourself.
        </p>
      </section>

      {/* ── Daily Challenge (Featured Banner) ── */}
      <section className="mx-auto max-w-6xl px-6 mb-10">
        <Link href="/games/daily-challenge">
          <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/[0.08] via-amber-500/[0.05] to-red-500/[0.08] p-6 sm:p-8 group hover:border-orange-500/40 transition-all duration-300">
            {/* Decorative glow */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/15 transition-colors" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />

            <div className="relative flex items-center gap-5">
              <GameIcon id="daily-challenge" size={64} fallback="🔥" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-extrabold tracking-widest text-orange-400 bg-orange-500/15 px-2.5 py-0.5 rounded-full">
                    DAILY
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  Daily Challenge
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  A new challenge every day across all subjects. Build your streak!
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-orange-400 font-bold text-sm group-hover:text-orange-300 transition-colors">
                Play today&apos;s challenge
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* ── Quick Nav (sticky category pills) ── */}
      <section className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-white/[0.04] py-3 mb-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <span className="text-xs text-slate-600 font-medium shrink-0 mr-1">Jump to:</span>
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all inline-flex items-center gap-1.5"
            >
              <GameIcon id={s.iconId} size={16} fallback={s.emoji} className="rounded-sm" />
              {s.title}
            </a>
          ))}
          </div>
        </div>
      </section>

      {/* ── Categorized Game Sections ── */}
      <div className="mx-auto max-w-6xl px-6 pb-10 space-y-12">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id}>
            <SectionHeader section={section} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.games.map((game) => (
                <GameCard key={game.title} {...game} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ── Progress Dashboard CTA ── */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <Link href="/games/progress">
          <div className="rounded-2xl border border-indigo-500/15 bg-gradient-to-r from-indigo-500/[0.06] to-purple-500/[0.06] p-6 flex items-center gap-4 group hover:border-indigo-500/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center group-hover:bg-indigo-500/25 transition-colors">
              <BarChart3 className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white">
                Progress Dashboard
              </h3>
              <p className="text-xs text-slate-500">
                View your stats, achievements, streaks, and activity heatmap
              </p>
            </div>
            <span className="text-indigo-400 text-sm font-semibold group-hover:translate-x-0.5 transition-transform">
              View →
            </span>
          </div>
        </Link>
      </section>
    </div>
  );
}
