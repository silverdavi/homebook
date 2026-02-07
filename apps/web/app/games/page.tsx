import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

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
  {
    title: "Letter Rain",
    description:
      "Catch falling letters in the right order to rebuild educational sentences. Test your reading speed and memory!",
    emoji: "🌧️",
    href: "/games/letter-rain",
    color: "#6366f1",
    available: true,
    badge: "NEW",
  },
  {
    title: "Math Blitz",
    description:
      "Solve arithmetic problems before the timer runs out. Quick mental math under pressure!",
    emoji: "⚡",
    href: "/games/math-blitz",
    color: "#10b981",
    available: false,
  },
  {
    title: "Word Builder",
    description:
      "Form words from scrambled letters. Discover vocabulary from science, history, and more.",
    emoji: "🔤",
    href: "/games/word-builder",
    color: "#f59e0b",
    available: false,
  },
  {
    title: "Fraction Fighter",
    description:
      "Compare fractions in a fast-paced battle. Tap the bigger fraction before time expires!",
    emoji: "⚔️",
    href: "/games/fraction-fighter",
    color: "#ef4444",
    available: false,
  },
  {
    title: "Timeline Dash",
    description:
      "Place historical events on a timeline. How well do you know the order of history?",
    emoji: "🕰️",
    href: "/games/timeline-dash",
    color: "#8b5cf6",
    available: false,
  },
  {
    title: "Element Match",
    description:
      "Match chemical elements to their symbols. A memory game with a science twist!",
    emoji: "🧪",
    href: "/games/element-match",
    color: "#3b82f6",
    available: false,
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
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            teacher.ninja
          </Link>
          <Link
            href="/generate"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Worksheets
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-12 text-center">
        <div className="text-5xl mb-4">🎮</div>
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          Game Arena
        </h1>
        <p className="mt-3 text-slate-400 max-w-md mx-auto">
          Learn while you play. Educational games that make studying fun for
          students of all ages.
        </p>
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
