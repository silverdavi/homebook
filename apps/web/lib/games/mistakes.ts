/**
 * Mistake tracking system for game-over review.
 * Stores wrong answers in sessionStorage so they persist until the tab is closed.
 * Each game can log mistakes during play, then display them on the game-over screen.
 */

export interface Mistake {
  question: string;
  yourAnswer: string;
  correctAnswer: string;
  timestamp: number;
}

const SESSION_KEY = "gameMistakes";

/** Get all mistakes for the current session */
export function getMistakes(gameId: string): Mistake[] {
  try {
    const raw = sessionStorage.getItem(`${SESSION_KEY}_${gameId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Add a mistake */
export function addMistake(gameId: string, mistake: Omit<Mistake, "timestamp">): void {
  try {
    const existing = getMistakes(gameId);
    existing.push({ ...mistake, timestamp: Date.now() });
    // Keep last 50 mistakes max
    const trimmed = existing.slice(-50);
    sessionStorage.setItem(`${SESSION_KEY}_${gameId}`, JSON.stringify(trimmed));
  } catch {
    // Ignore
  }
}

/** Clear mistakes for a game (call on game start) */
export function clearMistakes(gameId: string): void {
  try {
    sessionStorage.removeItem(`${SESSION_KEY}_${gameId}`);
  } catch {
    // Ignore
  }
}
