import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;
  name: string;
  avatarColor: string;
  accessCode: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface GameProgressRow {
  gameId: string;
  highScore: number;
  gamesPlayed: number;
  totalScore: number;
  bestStreak: number;
  adaptiveLevel: number;
}

export interface FullProfile {
  profile: Profile;
  progress: GameProgressRow[];
  achievements: Array<{ medalId: string; tier: string; earnedAt: string }>;
  dailyChallenges: Array<{ date: string; score: number }>;
  preferences: Array<{ key: string; value: string }>;
}

export interface SyncData {
  playerProfile?: {
    totalGamesPlayed: number;
    gamesPlayedByGameId: Record<string, number>;
    totalScore: number;
  };
  achievements?: Record<string, string>;
  dailyChallenges?: {
    completedDates: string[];
    scores: Record<string, number>;
  };
  highScores?: Record<string, number>;
  preferences?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Access Code Word Lists
// ---------------------------------------------------------------------------

const ADJECTIVES = [
  "BLUE", "RED", "FAST", "COOL", "WILD", "BOLD", "EPIC", "MEGA", "STAR", "GOLD",
  "IRON", "JADE", "RUBY", "AQUA", "NEON", "DARK", "PINK", "MINT", "SAGE", "LIME",
];

const ANIMALS = [
  "FOX", "OWL", "CAT", "DOG", "BEAR", "WOLF", "HAWK", "LION", "DEER", "FISH",
  "FROG", "DUCK", "CRAB", "MOTH", "LYNX", "WREN", "NEWT", "HARE", "DOVE", "CROW",
];

// ---------------------------------------------------------------------------
// Database singleton
// ---------------------------------------------------------------------------

const DB_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DB_DIR, "profiles.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  // Ensure the .data directory exists
  fs.mkdirSync(DB_DIR, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");

  // Create tables
  _db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar_color TEXT NOT NULL DEFAULT '#6366f1',
      access_code TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_active_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS game_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id TEXT NOT NULL REFERENCES profiles(id),
      game_id TEXT NOT NULL,
      high_score INTEGER NOT NULL DEFAULT 0,
      games_played INTEGER NOT NULL DEFAULT 0,
      total_score INTEGER NOT NULL DEFAULT 0,
      best_streak INTEGER NOT NULL DEFAULT 0,
      adaptive_level REAL NOT NULL DEFAULT 5.0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(profile_id, game_id)
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id TEXT NOT NULL REFERENCES profiles(id),
      medal_id TEXT NOT NULL,
      tier TEXT NOT NULL CHECK(tier IN ('bronze', 'silver', 'gold')),
      earned_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(profile_id, medal_id)
    );

    CREATE TABLE IF NOT EXISTS daily_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id TEXT NOT NULL REFERENCES profiles(id),
      date TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      UNIQUE(profile_id, date)
    );

    CREATE TABLE IF NOT EXISTS preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id TEXT NOT NULL REFERENCES profiles(id),
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      UNIQUE(profile_id, key)
    );
  `);

  return _db;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateAccessCode(db: Database.Database): string {
  const maxAttempts = 100;
  const checkStmt = db.prepare("SELECT 1 FROM profiles WHERE access_code = ?");

  for (let i = 0; i < maxAttempts; i++) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const num = Math.floor(Math.random() * 90) + 10; // 10-99
    const code = `${adj}-${animal}-${num}`;

    if (!checkStmt.get(code)) {
      return code;
    }
  }

  throw new Error("Failed to generate a unique access code after many attempts");
}

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    name: row.name as string,
    avatarColor: row.avatar_color as string,
    accessCode: row.access_code as string,
    createdAt: row.created_at as string,
    lastActiveAt: row.last_active_at as string,
  };
}

function loadFullProfile(db: Database.Database, profile: Profile): FullProfile {
  const progress = db
    .prepare(
      `SELECT game_id, high_score, games_played, total_score, best_streak, adaptive_level
       FROM game_progress WHERE profile_id = ?`
    )
    .all(profile.id) as Array<Record<string, unknown>>;

  const achievements = db
    .prepare(
      `SELECT medal_id, tier, earned_at FROM achievements WHERE profile_id = ?`
    )
    .all(profile.id) as Array<Record<string, unknown>>;

  const dailyChallenges = db
    .prepare(
      `SELECT date, score FROM daily_challenges WHERE profile_id = ?`
    )
    .all(profile.id) as Array<Record<string, unknown>>;

  const preferences = db
    .prepare(
      `SELECT key, value FROM preferences WHERE profile_id = ?`
    )
    .all(profile.id) as Array<Record<string, unknown>>;

  return {
    profile,
    progress: progress.map((r) => ({
      gameId: r.game_id as string,
      highScore: r.high_score as number,
      gamesPlayed: r.games_played as number,
      totalScore: r.total_score as number,
      bestStreak: r.best_streak as number,
      adaptiveLevel: r.adaptive_level as number,
    })),
    achievements: achievements.map((r) => ({
      medalId: r.medal_id as string,
      tier: r.tier as string,
      earnedAt: r.earned_at as string,
    })),
    dailyChallenges: dailyChallenges.map((r) => ({
      date: r.date as string,
      score: r.score as number,
    })),
    preferences: preferences.map((r) => ({
      key: r.key as string,
      value: r.value as string,
    })),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function createProfile(name: string, avatarColor?: string): Profile {
  const db = getDb();
  const id = randomUUID();
  const code = generateAccessCode(db);
  const color = avatarColor || "#6366f1";

  db.prepare(
    `INSERT INTO profiles (id, name, avatar_color, access_code) VALUES (?, ?, ?, ?)`
  ).run(id, name, color, code);

  const row = db.prepare("SELECT * FROM profiles WHERE id = ?").get(id) as Record<string, unknown>;
  return rowToProfile(row);
}

export function loginWithCode(accessCode: string): FullProfile | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM profiles WHERE access_code = ?")
    .get(accessCode) as Record<string, unknown> | undefined;

  if (!row) return null;

  // Update last_active_at
  db.prepare("UPDATE profiles SET last_active_at = datetime('now') WHERE id = ?").run(
    row.id as string
  );
  row.last_active_at = new Date().toISOString().replace("T", " ").slice(0, 19);

  const profile = rowToProfile(row);
  return loadFullProfile(db, profile);
}

export function getProfileById(id: string): FullProfile | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM profiles WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;

  if (!row) return null;

  // Update last_active_at
  db.prepare("UPDATE profiles SET last_active_at = datetime('now') WHERE id = ?").run(id);
  row.last_active_at = new Date().toISOString().replace("T", " ").slice(0, 19);

  const profile = rowToProfile(row);
  return loadFullProfile(db, profile);
}

export function updateProfile(
  id: string,
  updates: { name?: string; avatarColor?: string }
): Profile | null {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM profiles WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;

  if (!existing) return null;

  const newName = updates.name ?? (existing.name as string);
  const newColor = updates.avatarColor ?? (existing.avatar_color as string);

  db.prepare(
    "UPDATE profiles SET name = ?, avatar_color = ?, last_active_at = datetime('now') WHERE id = ?"
  ).run(newName, newColor, id);

  const row = db.prepare("SELECT * FROM profiles WHERE id = ?").get(id) as Record<string, unknown>;
  return rowToProfile(row);
}

export function saveGameProgress(
  profileId: string,
  gameId: string,
  score: number,
  stats?: { bestStreak?: number; adaptiveLevel?: number }
): GameProgressRow {
  const db = getDb();

  // Upsert: insert or update depending on existing data
  const existing = db
    .prepare("SELECT * FROM game_progress WHERE profile_id = ? AND game_id = ?")
    .get(profileId, gameId) as Record<string, unknown> | undefined;

  if (existing) {
    const newHighScore = Math.max(existing.high_score as number, score);
    const newGamesPlayed = (existing.games_played as number) + 1;
    const newTotalScore = (existing.total_score as number) + score;
    const newBestStreak = Math.max(
      existing.best_streak as number,
      stats?.bestStreak ?? 0
    );
    const newAdaptiveLevel = stats?.adaptiveLevel ?? (existing.adaptive_level as number);

    db.prepare(
      `UPDATE game_progress
       SET high_score = ?, games_played = ?, total_score = ?, best_streak = ?,
           adaptive_level = ?, updated_at = datetime('now')
       WHERE profile_id = ? AND game_id = ?`
    ).run(newHighScore, newGamesPlayed, newTotalScore, newBestStreak, newAdaptiveLevel, profileId, gameId);

    return {
      gameId,
      highScore: newHighScore,
      gamesPlayed: newGamesPlayed,
      totalScore: newTotalScore,
      bestStreak: newBestStreak,
      adaptiveLevel: newAdaptiveLevel,
    };
  } else {
    const bestStreak = stats?.bestStreak ?? 0;
    const adaptiveLevel = stats?.adaptiveLevel ?? 5.0;

    db.prepare(
      `INSERT INTO game_progress (profile_id, game_id, high_score, games_played, total_score, best_streak, adaptive_level)
       VALUES (?, ?, ?, 1, ?, ?, ?)`
    ).run(profileId, gameId, score, score, bestStreak, adaptiveLevel);

    return {
      gameId,
      highScore: score,
      gamesPlayed: 1,
      totalScore: score,
      bestStreak,
      adaptiveLevel,
    };
  }
}

export function saveAchievement(
  profileId: string,
  medalId: string,
  tier: "bronze" | "silver" | "gold"
): void {
  const db = getDb();
  db.prepare(
    `INSERT OR REPLACE INTO achievements (profile_id, medal_id, tier, earned_at)
     VALUES (?, ?, ?, datetime('now'))`
  ).run(profileId, medalId, tier);
}

export function saveDailyChallenge(
  profileId: string,
  date: string,
  score: number
): void {
  const db = getDb();
  db.prepare(
    `INSERT OR REPLACE INTO daily_challenges (profile_id, date, score)
     VALUES (?, ?, ?)`
  ).run(profileId, date, score);
}

export function savePreference(
  profileId: string,
  key: string,
  value: string
): void {
  const db = getDb();
  db.prepare(
    `INSERT OR REPLACE INTO preferences (profile_id, key, value)
     VALUES (?, ?, ?)`
  ).run(profileId, key, value);
}

export function syncFromLocalStorage(profileId: string, data: SyncData): void {
  const db = getDb();

  const runSync = db.transaction(() => {
    // Import game progress from playerProfile + highScores
    if (data.playerProfile?.gamesPlayedByGameId) {
      for (const [gameId, gamesPlayed] of Object.entries(
        data.playerProfile.gamesPlayedByGameId
      )) {
        const highScore = data.highScores?.[gameId] ?? 0;
        db.prepare(
          `INSERT OR REPLACE INTO game_progress
             (profile_id, game_id, high_score, games_played, total_score, best_streak, adaptive_level, updated_at)
           VALUES (?, ?, ?, ?, ?, 0, 5.0, datetime('now'))`
        ).run(profileId, gameId, highScore, gamesPlayed, highScore);
      }
    }

    // Import any highScores for games not already covered
    if (data.highScores) {
      for (const [gameId, highScore] of Object.entries(data.highScores)) {
        const existing = db
          .prepare("SELECT 1 FROM game_progress WHERE profile_id = ? AND game_id = ?")
          .get(profileId, gameId);
        if (!existing) {
          db.prepare(
            `INSERT INTO game_progress
               (profile_id, game_id, high_score, games_played, total_score, best_streak, adaptive_level, updated_at)
             VALUES (?, ?, ?, 0, ?, 0, 5.0, datetime('now'))`
          ).run(profileId, gameId, highScore, highScore);
        }
      }
    }

    // Import achievements
    if (data.achievements) {
      for (const [medalId, tier] of Object.entries(data.achievements)) {
        if (["bronze", "silver", "gold"].includes(tier)) {
          db.prepare(
            `INSERT OR REPLACE INTO achievements (profile_id, medal_id, tier, earned_at)
             VALUES (?, ?, ?, datetime('now'))`
          ).run(profileId, medalId, tier);
        }
      }
    }

    // Import daily challenge data
    if (data.dailyChallenges) {
      const { completedDates, scores } = data.dailyChallenges;
      if (completedDates) {
        for (const date of completedDates) {
          const score = scores?.[date] ?? 0;
          db.prepare(
            `INSERT OR REPLACE INTO daily_challenges (profile_id, date, score)
             VALUES (?, ?, ?)`
          ).run(profileId, date, score);
        }
      }
    }

    // Import preferences
    if (data.preferences) {
      for (const [key, value] of Object.entries(data.preferences)) {
        db.prepare(
          `INSERT OR REPLACE INTO preferences (profile_id, key, value)
           VALUES (?, ?, ?)`
        ).run(profileId, key, value);
      }
    }
  });

  runSync();
}
