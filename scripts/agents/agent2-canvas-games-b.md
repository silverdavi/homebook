# Agent 2: More Canvas Games (Connect Dots, Scratch & Reveal, Graph Plotter)

> Budget: $50 | Model: opus

## YOUR OWNERSHIP
You exclusively own and can edit these files:
- `apps/web/app/games/connect-dots/page.tsx` (CREATE)
- `apps/web/app/games/scratch-reveal/page.tsx` (CREATE)
- `apps/web/app/games/graph-plotter/page.tsx` (CREATE)
- `apps/web/components/games/ConnectDotsGame.tsx` (CREATE)
- `apps/web/components/games/ScratchRevealGame.tsx` (CREATE)
- `apps/web/components/games/GraphPlotterGame.tsx` (CREATE)

## DO NOT TOUCH
- `apps/web/app/games/page.tsx` (games index)
- Any existing game components or pages
- `apps/web/lib/games/canvas-utils.ts` (Agent 1 creates this, but you may not be able to use it — implement your own canvas helpers inline if needed)
- `apps/web/lib/games/audio.ts`, `achievements.ts`, `use-scores.ts` (use, don't edit)

## PROJECT CONTEXT
This is a Next.js 14 educational game platform (teacher.ninja). All games are client components (`"use client"`) using React hooks, Tailwind CSS, dark theme (slate-950/indigo-950 backgrounds). TypeScript strictly.

### Existing Shared Infrastructure (import and use):
- `@/components/games/AudioToggles` — music/SFX toggle + `useGameMusic()` hook
- `@/components/games/AchievementToast` — toast for newly earned medals
- `@/components/games/ScoreSubmit` — score submission + leaderboard
- `@/components/games/RewardEffects` — streak badges, heart recovery
- `@/components/games/GameErrorBoundary` — error boundary wrapper
- `@/lib/games/audio` — `sfxCorrect()`, `sfxWrong()`, `sfxCombo()`, `sfxLevelUp()`, `sfxGameOver()`, `sfxCountdown()`, `sfxCountdownGo()`, `sfxClick()`, `sfxHeart()`, `sfxAchievement()`
- `@/lib/games/achievements` — `checkAchievements(stats, totalGamesPlayed, gamesPlayedByGameId)`
- `@/lib/games/use-scores` — `getLocalHighScore()`, `setLocalHighScore()`, `getProfile()`, `trackGamePlayed()`

### Game Page Pattern:
```tsx
import { GameComponent } from "@/components/games/GameComponent";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";
export const metadata = { title: "Game | Game Arena | teacher.ninja", description: "..." };
export default function Page() {
  return <GameErrorBoundary gameName="Game"><GameComponent /></GameErrorBoundary>;
}
```

### Game Component Pattern (MUST follow):
- `"use client"` directive
- Phase: "menu" | "countdown" | "playing" | "complete"
- 3-2-1 countdown before gameplay
- Settings with sliders + toggles in menu
- Meaningful difficulty labels
- Dark gradient background
- `useGameMusic()` + `<AudioToggles />`
- SFX calls on correct/wrong/combo/gameOver/achievement
- `trackGamePlayed(gameId, score)` and `checkAchievements()` on game end
- Educational tooltips during gameplay

## YOUR MISSION

### 1. Create Connect the Dots Game
Connect numbered dots to reveal an educational shape:
- **Mechanic**: Dots appear on a canvas with numbers/labels. Player connects them in order by tapping/clicking. When connected, the shape is revealed with a label.
- **Categories**: Math sequences (count by 2s, 3s, 5s, primes), Constellations (major ones: Orion, Big Dipper, etc.), Simple circuits (battery → wire → bulb)
- **Canvas**: Draw dots as numbered circles, draw lines between connected dots, reveal shape on completion
- **Touch**: Tap dot to connect to next, or drag between dots
- **Settings**: Category selector, dot count slider (5-20), toggle "show numbers" vs "show sequence pattern"
- **Scoring**: Speed + accuracy (tapping wrong dot = penalty)
- **Implementation**: Use HTML5 Canvas with PointerEvent. Each dot set is defined as an array of {x, y, label} coordinates.

### 2. Create Scratch & Reveal Game
A scratch card game for educational review:
- **Mechanic**: A question is shown. The answer is hidden under a scratchable overlay. Player scratches with finger/stylus to reveal. Then self-checks.
- **Subjects**: Math (arithmetic, fractions), Science (element symbols → names), History (dates → events), Vocabulary (word → definition)
- **Canvas**: Gray metallic overlay rendered on canvas. Player pointer erases the overlay (compositing: destination-out). Once >60% scratched, auto-reveal with animation.
- **Touch/Stylus**: Eraser effect follows pointer. Wider stroke = bigger eraser.
- **Settings**: Subject selector, cards per round slider (5-20), toggle "timed" (adds countdown)
- **Scoring**: Self-reported (player clicks "I got it right" or "I got it wrong") + completion
- **Question Bank**: Generate inline questions for each subject (similar to how Math Blitz generates problems)

### 3. Create Graph Plotter Game
An interactive coordinate geometry game:
- **Mechanic**: Player plots points, draws lines, and identifies features on a coordinate grid.
- **Modes**:
  1. "Plot the Point" — given coordinates like (3, -2), tap the correct location
  2. "Find the Slope" — shown two points, calculate and type the slope
  3. "Draw the Line" — given equation y=mx+b, draw the line by placing 2 points
- **Canvas**: Coordinate grid with axes, grid lines, labels. Points as colored dots. Lines connecting points.
- **Touch**: Tap to place points on grid (snap to nearest integer)
- **Settings**: Mode selector, grid range slider (-5..5 to -10..10), toggle "show grid lines"
- **Scoring**: Accuracy of placement (within 0.5 = correct), time bonus
- **Educational tips**: Rotating tips about coordinate geometry, slopes, y-intercepts

## CANVAS IMPLEMENTATION NOTES
- Use PointerEvent API (not touch events) — works with mouse, finger, and stylus
- Set canvas size with `devicePixelRatio` for crisp rendering
- Handle canvas resize on window resize
- For scratch card: use `globalCompositeOperation = 'destination-out'` for eraser effect

## GIT RULES
- Pull before editing: `git pull`
- Commit after each game: `git add apps/web/app/games/connect-dots apps/web/app/games/scratch-reveal apps/web/app/games/graph-plotter apps/web/components/games/ConnectDotsGame.tsx apps/web/components/games/ScratchRevealGame.tsx apps/web/components/games/GraphPlotterGame.tsx && git commit -m "agent/canvas-b: <desc>"`
- Push immediately: `git push`

## STATUS UPDATES
After each major task, update `scripts/agents/agent2-status.md`

## ON COMPLETION
1. Verify all games build: `cd apps/web && npx next build`
2. Commit all changes
3. Push to remote
4. Update status file with COMPLETE

## REMEMBER
- All games must be FULLY FUNCTIONAL
- Use HTML5 Canvas + PointerEvent API
- Support mouse, touch (finger), and stylus
- Every game: menu, countdown, gameplay, results
- Dark theme, Tailwind CSS, existing aesthetic
- Use shared infrastructure (audio, achievements, scores)
- No external dependencies
