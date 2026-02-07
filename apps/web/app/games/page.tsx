import Link from "next/link";
import { Lock } from "lucide-react";
import { GamesArenaHeader } from "./GamesArenaHeader";

interface GameCardProps {
  title: string;
  description: string;
  emoji: string;
  href: string;
  color: string;
  available: boolean;
  badge?: string;
}

const GAMES: GameCardProps[] = [
  // ── Featured ──
  {
    title: "Daily Challenge",
    description:
      "A new challenge every day across all subjects. Build your streak!",
    emoji: "🔥",
    href: "/games/daily-challenge",
    color: "#f97316",
    available: true,
    badge: "DAILY",
  },
  // ── Language & Reading ──
  {
    title: "Letter Rain",
    description:
      "Catch falling letters in the right order to rebuild educational sentences.",
    emoji: "🌧️",
    href: "/games/letter-rain",
    color: "#6366f1",
    available: true,
  },
  {
    title: "Word Builder",
    description:
      "Unscramble letters to build vocabulary words from science, math, and more.",
    emoji: "🔤",
    href: "/games/word-builder",
    color: "#f59e0b",
    available: true,
  },
  // ── Math ──
  {
    title: "Math Blitz",
    description:
      "Solve arithmetic problems before the timer runs out. Quick mental math!",
    emoji: "⚡",
    href: "/games/math-blitz",
    color: "#10b981",
    available: true,
  },
  {
    title: "Fraction Fighter",
    description:
      "Compare fractions in a fast-paced battle. Tap the bigger fraction!",
    emoji: "⚔️",
    href: "/games/fraction-fighter",
    color: "#ef4444",
    available: true,
  },
  {
    title: "Times Tables",
    description:
      "Master multiplication with visual grids! Sprint, survival, and target modes.",
    emoji: "✖️",
    href: "/games/times-table",
    color: "#8b5cf6",
    available: true,
  },
  {
    title: "Fraction Lab",
    description:
      "See, compare, add, and find equivalent fractions with bars and pie charts.",
    emoji: "🥧",
    href: "/games/fraction-lab",
    color: "#f97316",
    available: true,
  },
  {
    title: "Decimal Dash",
    description:
      "Number line placement, operations, comparisons, and fraction-decimal conversions.",
    emoji: "🔢",
    href: "/games/decimal-dash",
    color: "#14b8a6",
    available: true,
    badge: "NEW",
  },
  {
    title: "Graph Plotter",
    description:
      "Plot points, find slopes, and draw lines on coordinate grids. Touch-enabled!",
    emoji: "📈",
    href: "/games/graph-plotter",
    color: "#6366f1",
    available: true,
    badge: "NEW",
  },
  // ── Science ──
  {
    title: "Element Match",
    description:
      "Match chemical element symbols to their names. Memory meets chemistry!",
    emoji: "🧪",
    href: "/games/element-match",
    color: "#3b82f6",
    available: true,
  },
  {
    title: "Equation Balancer",
    description:
      "Balance chemical equations by adjusting coefficients. Conservation of mass!",
    emoji: "⚖️",
    href: "/games/equation-balancer",
    color: "#8b5cf6",
    available: true,
    badge: "NEW",
  },
  {
    title: "Genetics Lab",
    description:
      "Build Punnett squares, predict offspring ratios, and explore Mendelian genetics.",
    emoji: "🧬",
    href: "/games/genetics-lab",
    color: "#22c55e",
    available: true,
    badge: "NEW",
  },
  {
    title: "Unit Converter",
    description:
      "Race to convert between units of length, mass, volume, temperature, and time.",
    emoji: "📏",
    href: "/games/unit-converter",
    color: "#0ea5e9",
    available: true,
    badge: "NEW",
  },
  // ── History ──
  {
    title: "Timeline Dash",
    description:
      "Place historical events on a timeline. How well do you know the order of history?",
    emoji: "🕰️",
    href: "/games/timeline-dash",
    color: "#8b5cf6",
    available: true,
  },
  // ── Touch / Canvas Games ──
  {
    title: "Maze Runner",
    description:
      "Navigate mazes by touch or mouse. Solve questions at forks to find the right path!",
    emoji: "🏃",
    href: "/games/maze-runner",
    color: "#06b6d4",
    available: true,
    badge: "NEW",
  },
  {
    title: "Trace & Learn",
    description:
      "Trace letters, numbers, and shapes with finger or stylus. Score by accuracy!",
    emoji: "✏️",
    href: "/games/trace-learn",
    color: "#a855f7",
    available: true,
    badge: "NEW",
  },
  {
    title: "Color Lab",
    description:
      "Color educational diagrams — cells, maps, periodic table groups. Learn by coloring!",
    emoji: "🎨",
    href: "/games/color-lab",
    color: "#ec4899",
    available: true,
    badge: "NEW",
  },
  {
    title: "Connect the Dots",
    description:
      "Connect numbered dots in sequence to reveal shapes. Count by 2s, 3s, primes!",
    emoji: "🔵",
    href: "/games/connect-dots",
    color: "#3b82f6",
    available: true,
    badge: "NEW",
  },
  {
    title: "Scratch & Reveal",
    description:
      "Scratch off cards to reveal answers. Test your knowledge across all subjects!",
    emoji: "🎫",
    href: "/games/scratch-reveal",
    color: "#eab308",
    available: true,
    badge: "NEW",
  },
];

function GameCard({
  title,
  description,
  emoji,
  href,
  color,
  available,
  badge,
}: GameCardProps) {
  const content = (
    <div
      className={`relative group rounded-2xl border p-6 transition-all duration-200 ${
        available
          ? "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] cursor-pointer"
          : "border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed"
      }`}
    >
      {badge && (
        <span
          className="absolute -top-2 -right-2 text-[10px] font-bold text-white px-2 py-0.5 rounded-full"
          style={{ backgroundColor: color }}
        >
          {badge}
        </span>
      )}
      <div className="text-4xl mb-4">{emoji}</div>
      <h3 className="text-lg font-bold text-white mb-1.5 flex items-center gap-2">
        {title}
        {!available && <Lock className="w-3.5 h-3.5 text-slate-500" />}
      </h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
      {available && (
        <div
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color }}
        >
          Play now
          <span className="group-hover:translate-x-0.5 transition-transform">
            &rarr;
          </span>
        </div>
      )}
      {!available && (
        <div className="mt-4 text-xs text-slate-600">Coming soon</div>
      )}
    </div>
  );

  if (!available) return content;
  return <Link href={href}>{content}</Link>;
}

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950">
      <GamesArenaHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-12 text-center">
        <div className="text-5xl mb-4">🎮</div>
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          Game Arena
        </h1>
        <p className="mt-3 text-slate-400 max-w-md mx-auto">
          Learn while you play. {GAMES.length} educational games that make studying fun for
          students of all ages.
        </p>
        <Link
          href="/games/progress"
          className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          📊 View Progress Dashboard &rarr;
        </Link>
      </section>

      {/* Games grid */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {GAMES.map((game) => (
            <GameCard key={game.title} {...game} />
          ))}
        </div>
      </section>
    </div>
  );
}
