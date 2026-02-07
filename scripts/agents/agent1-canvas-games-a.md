# Agent 1: Canvas Touch Games (Maze Runner, Trace & Learn, Color Lab)

> Budget: $50 | Model: opus

## YOUR OWNERSHIP
You exclusively own and can edit these files:
- `apps/web/app/games/maze-runner/page.tsx` (CREATE)
- `apps/web/app/games/trace-learn/page.tsx` (CREATE)
- `apps/web/app/games/color-lab/page.tsx` (CREATE)
- `apps/web/components/games/MazeRunnerGame.tsx` (CREATE)
- `apps/web/components/games/TraceLearnGame.tsx` (CREATE)
- `apps/web/components/games/ColorLabGame.tsx` (CREATE)
- `apps/web/lib/games/canvas-utils.ts` (CREATE — shared canvas/pointer utility)

## DO NOT TOUCH
- `apps/web/app/games/page.tsx` (games index — will be updated separately)
- Any existing game components or pages
- `apps/web/lib/games/audio.ts` (use it, don't edit it)
- `apps/web/lib/games/achievements.ts` (use it, don't edit it)
- `apps/web/lib/games/use-scores.ts` (use it, don't edit it)

## PROJECT CONTEXT
This is a Next.js 14 educational game platform (teacher.ninja). All games are client components (`"use client"`) using React hooks, Tailwind CSS, and dark theme (slate-950/indigo-950 backgrounds, white text). The project uses TypeScript strictly.

### Existing Shared Infrastructure (import and use):
- `@/components/games/AudioToggles` — music/SFX toggle component + `useGameMusic()` hook
- `@/components/games/AchievementToast` — toast for newly earned medals
- `@/components/games/ScoreSubmit` — score submission + leaderboard
- `@/components/games/RewardEffects` — streak badges, heart recovery
- `@/components/games/GameErrorBoundary` — error boundary wrapper
- `@/lib/games/audio` — `sfxCorrect()`, `sfxWrong()`, `sfxCombo()`, `sfxLevelUp()`, `sfxGameOver()`, `sfxCountdown()`, `sfxCountdownGo()`, `sfxClick()`, `sfxHeart()`, `sfxAchievement()`
- `@/lib/games/achievements` — `checkAchievements(stats, totalGamesPlayed, gamesPlayedByGameId)`
- `@/lib/games/use-scores` — `getLocalHighScore()`, `setLocalHighScore()`, `getProfile()`, `trackGamePlayed()`

### Game Page Pattern:
```tsx
// apps/web/app/games/<name>/page.tsx
import { GameComponent } from "@/components/games/GameComponent";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";
export const metadata = { title: "Game Name | Game Arena | teacher.ninja", description: "..." };
export default function Page() {
  return <GameErrorBoundary gameName="Game Name"><GameComponent /></GameErrorBoundary>;
}
```

### Game Component Pattern (follow EXACTLY):
- `"use client"` at top
- Phase state: "menu" | "countdown" | "playing" | "complete"
- 3-2-1 countdown before gameplay starts
- Settings with sliders (type="range") and toggles in the menu phase
- Show meaningful difficulty labels (e.g., "3.2s per question", "Level 5")
- Dark gradient background matching existing games
- Use `useGameMusic()` hook and render `<AudioToggles />` in the header
- Call SFX on correct/wrong/combo/levelUp/gameOver/achievement
- Track game completion with `trackGamePlayed(gameId, score)` and `checkAchievements()`
- Educational tooltips rotating during gameplay (subject-relevant tips, not hints)

## YOUR MISSION

### 1. Create `apps/web/lib/games/canvas-utils.ts`
A shared utility for canvas-based games with:
- `useCanvas(ref)` hook that sets up a canvas with proper DPI scaling (window.devicePixelRatio)
- Unified pointer event handling (works with mouse, finger, and Apple Pencil/stylus)
- `getPointerPos(canvas, event)` — returns {x, y, pressure} from PointerEvent
- Flood fill algorithm for Color Lab
- Line drawing with smoothing/interpolation for Trace & Learn
- Keep it simple, no external deps

### 2. Create Maze Runner Game
An educational maze game with touch/pointer support:
- **Mechanic**: Player navigates a maze by dragging finger/stylus/mouse. At forks, they must answer a question correctly to proceed on the right path.
- **Subjects**: Math (arithmetic at forks), Science (true/false at forks), mixed
- **Generation**: Procedurally generate mazes using recursive backtracking (simple, works well)
- **Canvas rendering**: Draw maze walls, player position, path trail, goal
- **Touch**: Drag to move through corridors (snap to grid)
- **Settings**: Maze size slider (small 7x7 to large 15x15), subject selector
- **Scoring**: Time to complete + questions correct
- **Visual style**: Neon walls on dark background, glowing player dot, trail effect

### 3. Create Trace & Learn Game
A tracing game for learning letters, numbers, and shapes:
- **Mechanic**: Show a faint guide shape (letter, number, math symbol, chemical formula). Player traces over it with finger/pencil. Score based on accuracy.
- **Categories**: Letters (A-Z), Numbers (0-9), Math symbols (+, -, ×, ÷, =, π), Simple shapes (circle, triangle, square, star)
- **Canvas rendering**: Guide path in light gray, player trace in colored stroke, accuracy overlay
- **Touch/Stylus**: Use pressure sensitivity for stroke width when available (PointerEvent.pressure)
- **Settings**: Category selector, difficulty (how strict the accuracy matching is, 1-10 slider)
- **Scoring**: Accuracy percentage, smoothness bonus
- **Educational**: Show the name/description of what they're tracing

### 4. Create Color Lab Game
An educational coloring game:
- **Mechanic**: Color regions of educational diagrams. Each region is labeled and the player selects a color and taps/drags to fill.
- **Diagrams**: Plant cell (cell wall, nucleus, chloroplast, etc.), Animal cell, Simple map (continents), Periodic table groups (metals, nonmetals, noble gases)
- **Implementation**: Use SVG paths rendered on canvas, with flood-fill on tap
- **Settings**: Diagram selector, toggle "show labels", toggle "color guide" (shows which colors to use)
- **Scoring**: Correctness (did they use the right colors for the right regions) + completion percentage
- **Touch**: Tap to fill, pinch to zoom (optional), color palette at bottom

## GIT RULES
- Pull before editing: `git pull`
- Commit after each game: `git add apps/web/app/games/maze-runner apps/web/app/games/trace-learn apps/web/app/games/color-lab apps/web/components/games/MazeRunnerGame.tsx apps/web/components/games/TraceLearnGame.tsx apps/web/components/games/ColorLabGame.tsx apps/web/lib/games/canvas-utils.ts && git commit -m "agent/canvas-a: <desc>"`
- Push immediately: `git push`

## STATUS UPDATES
After each major task, update `scripts/agents/agent1-status.md`

## ON COMPLETION
1. Verify each game builds without errors: `cd apps/web && npx next build`
2. Commit all changes
3. Push to remote
4. Update status file with COMPLETE

## REMEMBER
- All games must be FULLY FUNCTIONAL, not stubs
- Use HTML5 Canvas with PointerEvent API (not touch events)
- Support mouse, touch (finger), and stylus (Apple Pencil)
- Every game needs: menu phase, countdown, gameplay, results screen
- Dark theme, Tailwind CSS, same aesthetic as existing games
- Import and use existing shared infrastructure (audio, achievements, scores)
- No external dependencies — use Web APIs only
