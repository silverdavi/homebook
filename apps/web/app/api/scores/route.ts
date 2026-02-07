import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

/**
 * Global high scores API.
 * Stores scores in a JSON file on disk (simple, no DB needed).
 * 
 * GET /api/scores?game=letter-rain&limit=10
 * POST /api/scores { game, name, score, level, stats }
 */

interface ScoreEntry {
  game: string;
  name: string;
  score: number;
  level: number;
  stats?: Record<string, number | string>;
  timestamp: string;
}

const SCORES_DIR = path.join(process.cwd(), ".data");
const SCORES_FILE = path.join(SCORES_DIR, "scores.json");
const MAX_SCORES_PER_GAME = 50;
const VALID_GAMES = ["letter-rain", "math-blitz", "fraction-fighter", "element-match", "word-builder", "times-table", "fraction-lab"];

async function readScores(): Promise<ScoreEntry[]> {
  try {
    await fs.mkdir(SCORES_DIR, { recursive: true });
    const data = await fs.readFile(SCORES_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeScores(scores: ScoreEntry[]): Promise<void> {
  await fs.mkdir(SCORES_DIR, { recursive: true });
  await fs.writeFile(SCORES_FILE, JSON.stringify(scores, null, 2));
}

function sanitizeName(name: string): string {
  return name.trim().slice(0, 20).replace(/[<>&"']/g, "").trim() || "Anonymous";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get("game");
  const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);

  const allScores = await readScores();

  const filtered = game
    ? allScores.filter((s) => s.game === game)
    : allScores;

  // Sort by score descending
  const sorted = filtered.sort((a, b) => b.score - a.score).slice(0, limit);

  return NextResponse.json({ scores: sorted });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { game, name, score, level, stats } = body;

    // Validate
    if (!game || !VALID_GAMES.includes(game)) {
      return NextResponse.json({ error: "Invalid game" }, { status: 400 });
    }
    if (typeof score !== "number" || score < 0 || score > 999999) {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    }
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    const entry: ScoreEntry = {
      game,
      name: sanitizeName(name),
      score,
      level: typeof level === "number" ? level : 1,
      stats: stats || {},
      timestamp: new Date().toISOString(),
    };

    const allScores = await readScores();
    allScores.push(entry);

    // Keep only top N per game
    const grouped: Record<string, ScoreEntry[]> = {};
    for (const s of allScores) {
      if (!grouped[s.game]) grouped[s.game] = [];
      grouped[s.game].push(s);
    }
    const pruned: ScoreEntry[] = [];
    for (const scores of Object.values(grouped)) {
      scores.sort((a, b) => b.score - a.score);
      pruned.push(...scores.slice(0, MAX_SCORES_PER_GAME));
    }

    await writeScores(pruned);

    // Return rank
    const gameScores = pruned.filter((s) => s.game === game).sort((a, b) => b.score - a.score);
    const rank = gameScores.findIndex((s) => s.timestamp === entry.timestamp) + 1;

    return NextResponse.json({ rank, total: gameScores.length });
  } catch {
    return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
  }
}
