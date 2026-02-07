import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// ── Mock all shared dependencies that game components use ──

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock audio — prevent actual AudioContext usage
vi.mock("@/lib/games/audio", () => ({
  isMusicEnabled: () => true,
  isSfxEnabled: () => true,
  setMusicEnabled: vi.fn(),
  setSfxEnabled: vi.fn(),
  sfxCorrect: vi.fn(),
  sfxWrong: vi.fn(),
  sfxClick: vi.fn(),
  sfxCombo: vi.fn(),
  sfxLevelUp: vi.fn(),
  sfxGameOver: vi.fn(),
  sfxHeart: vi.fn(),
  sfxAchievement: vi.fn(),
  sfxCountdown: vi.fn(),
  sfxCountdownGo: vi.fn(),
  startMusic: vi.fn(),
  stopMusic: vi.fn(),
  isMusicPlaying: () => false,
}));

// Mock AudioToggles
vi.mock("@/components/games/AudioToggles", () => ({
  AudioToggles: () => <div data-testid="audio-toggles" />,
  useGameMusic: vi.fn(),
}));

// Mock ScoreSubmit
vi.mock("@/components/games/ScoreSubmit", () => ({
  ScoreSubmit: () => <div data-testid="score-submit" />,
}));

// Mock Leaderboard
vi.mock("@/components/games/Leaderboard", () => ({
  Leaderboard: () => <div data-testid="leaderboard" />,
}));

// Mock RewardEffects
vi.mock("@/components/games/RewardEffects", () => ({
  StreakBadge: () => <span data-testid="streak-badge" />,
  getMultiplierFromStreak: (s: number) => ({ mult: 1, label: "1x" }),
  HeartRecovery: () => null,
  HeartRecoveryToast: () => null,
  BonusToast: () => null,
}));

// Mock AchievementToast
vi.mock("@/components/games/AchievementToast", () => ({
  AchievementToast: () => <div data-testid="achievement-toast" />,
}));

// Mock localStorage
const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  });

  // Mock requestAnimationFrame/cancelAnimationFrame
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0) as unknown as number);
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));

  // Mock AudioContext (constructable)
  vi.stubGlobal("AudioContext", function MockAudioContext(this: Record<string, unknown>) {
    this.state = "running";
    this.resume = vi.fn();
    this.currentTime = 0;
    this.destination = {};
    this.createOscillator = vi.fn().mockReturnValue({
      type: "sine",
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    });
    this.createGain = vi.fn().mockReturnValue({
      gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    });
  });
});

afterEach(() => {
  cleanup();
});

// ── MathBlitzGame ──

describe("MathBlitzGame", () => {
  it("renders without crashing and shows title", async () => {
    const { MathBlitzGame } = await import("@/components/games/MathBlitzGame");
    const { container } = render(<MathBlitzGame />);
    expect(container.querySelector("h1")?.textContent).toBe("Math Blitz");
  });

  it("shows menu phase with start button and settings", async () => {
    const { MathBlitzGame } = await import("@/components/games/MathBlitzGame");
    render(<MathBlitzGame />);
    const buttons = screen.getAllByRole("button");
    const startBtn = buttons.find((b) => b.textContent === "Start");
    expect(startBtn).toBeTruthy();
    expect(screen.getByText("Duration")).toBeTruthy();
  });
});

// ── LetterRainGame ──

describe("LetterRainGame", () => {
  it("renders without crashing and shows title", async () => {
    const { LetterRainGame } = await import("@/components/games/LetterRainGame");
    const { container } = render(<LetterRainGame />);
    expect(container.querySelector("h1")?.textContent).toBe("Letter Rain");
  });

  it("has a play button", async () => {
    const { LetterRainGame } = await import("@/components/games/LetterRainGame");
    render(<LetterRainGame />);
    const buttons = screen.getAllByRole("button");
    const playBtn = buttons.find((b) => b.textContent?.includes("Play"));
    expect(playBtn).toBeTruthy();
  });
});

// ── FractionFighterGame ──

describe("FractionFighterGame", () => {
  it("renders without crashing and shows title", async () => {
    const { FractionFighterGame } = await import("@/components/games/FractionFighterGame");
    const { container } = render(<FractionFighterGame />);
    expect(container.querySelector("h1")?.textContent).toBe("Fraction Fighter");
  });

  it("has a Fight button", async () => {
    const { FractionFighterGame } = await import("@/components/games/FractionFighterGame");
    render(<FractionFighterGame />);
    const buttons = screen.getAllByRole("button");
    const fightBtn = buttons.find((b) => b.textContent?.includes("Fight"));
    expect(fightBtn).toBeTruthy();
  });
});

// ── WordBuilderGame ──

describe("WordBuilderGame", () => {
  it("renders without crashing and shows title", async () => {
    const { WordBuilderGame } = await import("@/components/games/WordBuilderGame");
    const { container } = render(<WordBuilderGame />);
    expect(container.querySelector("h1")?.textContent).toBe("Word Builder");
  });

  it("has a start button", async () => {
    const { WordBuilderGame } = await import("@/components/games/WordBuilderGame");
    render(<WordBuilderGame />);
    const buttons = screen.getAllByRole("button");
    const startBtn = buttons.find((b) => b.textContent === "Start");
    expect(startBtn).toBeTruthy();
  });
});

// ── TimesTableGame ──

describe("TimesTableGame", () => {
  it("renders without crashing and shows title", async () => {
    const { TimesTableGame } = await import("@/components/games/TimesTableGame");
    const { container } = render(<TimesTableGame />);
    expect(container.querySelector("h1")?.textContent).toBe("Times Tables");
  });

  it("has game mode buttons in menu", async () => {
    const { TimesTableGame } = await import("@/components/games/TimesTableGame");
    render(<TimesTableGame />);
    const buttons = screen.getAllByRole("button");
    // TimesTable has mode selection buttons (sprint, survival, target)
    expect(buttons.length).toBeGreaterThan(0);
  });
});

// ── FractionLabGame ──

describe("FractionLabGame", () => {
  it("renders without crashing and shows title", async () => {
    const { FractionLabGame } = await import("@/components/games/FractionLabGame");
    const { container } = render(<FractionLabGame />);
    expect(container.querySelector("h1")?.textContent).toBe("Fraction Lab");
  });

  it("has challenge set buttons in menu", async () => {
    const { FractionLabGame } = await import("@/components/games/FractionLabGame");
    render(<FractionLabGame />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});

// ── ElementMatchGame ──

describe("ElementMatchGame", () => {
  it("renders without crashing and shows title", async () => {
    const { ElementMatchGame } = await import("@/components/games/ElementMatchGame");
    const { container } = render(<ElementMatchGame />);
    expect(container.querySelector("h1")?.textContent).toBe("Element Match");
  });

  it("has difficulty selection buttons in menu", async () => {
    const { ElementMatchGame } = await import("@/components/games/ElementMatchGame");
    render(<ElementMatchGame />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});

// ── TimelineDashGame ──

describe("TimelineDashGame", () => {
  it("renders without crashing and shows title", async () => {
    const { TimelineDashGame } = await import("@/components/games/TimelineDashGame");
    const { container } = render(<TimelineDashGame />);
    expect(container.querySelector("h1")?.textContent).toBe("Timeline Dash");
  });

  it("has a start button", async () => {
    const { TimelineDashGame } = await import("@/components/games/TimelineDashGame");
    render(<TimelineDashGame />);
    const buttons = screen.getAllByRole("button");
    const startBtn = buttons.find((b) => b.textContent === "Start");
    expect(startBtn).toBeTruthy();
  });
});
