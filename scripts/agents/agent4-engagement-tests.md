# Agent 4: Engagement Features + Tests (Daily Challenge, Progress Dashboard, Tests)

> Budget: $50 | Model: opus

## YOUR OWNERSHIP
You exclusively own and can edit these files:
- `apps/web/app/games/daily-challenge/page.tsx` (CREATE)
- `apps/web/app/games/progress/page.tsx` (CREATE)
- `apps/web/components/games/DailyChallengeGame.tsx` (CREATE)
- `apps/web/components/games/ProgressDashboard.tsx` (CREATE)
- `apps/web/lib/games/daily-challenge.ts` (CREATE — daily challenge logic)
- `apps/web/__tests__/` (CREATE — test directory with all test files)

## DO NOT TOUCH
- `apps/web/app/games/page.tsx` (games index)
- Any existing game components (read them for test reference, don't edit)
- `apps/web/lib/games/audio.ts`, `achievements.ts`, `use-scores.ts` (use/test, don't edit)

## PROJECT CONTEXT
Next.js 14 educational game platform (teacher.ninja). Client components, React hooks, Tailwind CSS, dark theme. TypeScript.

### Shared Infrastructure:
- `@/components/games/AudioToggles` — music/SFX toggle + `useGameMusic()` hook
- `@/components/games/AchievementToast` — toast for medals
- `@/components/games/GameErrorBoundary` — error boundary wrapper
- `@/lib/games/audio` — all SFX functions
- `@/lib/games/achievements` — `checkAchievements()`, `getAchievements()`, `MEDALS`, types
- `@/lib/games/use-scores` — `getLocalHighScore()`, `setLocalHighScore()`, `getProfile()`, `trackGamePlayed()`

### Game Pattern:
- `"use client"`, phase state machine, 3-2-1 countdown, settings, dark theme
- `useGameMusic()` + `<AudioToggles />`
- SFX + achievements + score tracking on game end

## YOUR MISSION

### 1. Create Daily Challenge System
A daily challenge that rotates across subjects:

**`apps/web/lib/games/daily-challenge.ts`:**
- Deterministic daily challenge based on date (use date as seed)
- Each day selects a different game type and generates specific parameters
- Challenge types: Math sprint (5 problems), Quick fraction compare (5 pairs), Element quiz (5 elements), Vocabulary unscramble (3 words), Timeline order (4 events)
- `getDailyChallenge(date: Date)` — returns challenge config (type, params, seed)
- `getDailyChallengeStreak()` / `setDailyChallengeCompleted(date)` — streak tracking in localStorage
- Daily streaks: track consecutive days completed

**`apps/web/components/games/DailyChallengeGame.tsx`:**
- Shows today's challenge with a themed card
- Shows current streak (🔥 3 day streak!)
- Mini-game embedded directly (not linking to another game — self-contained challenge)
- After completion: show results, whether you beat yesterday's score, streak update
- Calendar view showing completed days (last 30 days as dots)
- Share button (copies result text to clipboard, like Wordle)

**`apps/web/app/games/daily-challenge/page.tsx`:**
- Standard page wrapper

### 2. Create Progress Dashboard
Visual overview of all game progress:

**`apps/web/components/games/ProgressDashboard.tsx`:**
- Reads all localStorage data (profile, high scores, achievements)
- **Summary cards**: Total games played, total score, favorite game, average accuracy
- **Per-game stats**: Grid of cards, one per game, showing best score, times played, best streak
- **Achievement showcase**: Display all medals earned (bronze/silver/gold icons) with progress bars for unearnedones
- **Streak tracker**: Current daily challenge streak, longest streak
- **Activity heatmap**: Simple grid showing play activity (last 30 days), similar to GitHub contribution graph
- **Skills radar**: Simple visual showing relative strength across subjects (math, science, language, history)

**`apps/web/app/games/progress/page.tsx`:**
- Standard page wrapper, but no GameErrorBoundary needed (it's a dashboard, not a game)

### 3. Write Tests for ALL Games
Create comprehensive tests. The project likely has Jest or Vitest. Check `package.json` for test framework. If none exists, set up Vitest (works great with Next.js).

**Test structure** (`apps/web/__tests__/`):

**`games/achievements.test.ts`:**
- Test all 12 medals' check functions for bronze/silver/gold
- Test `getAchievements()` / `setAchievement()` localStorage persistence
- Test `checkAchievements()` returns correct new achievements

**`games/use-scores.test.ts`:**
- Test `getLocalHighScore()` / `setLocalHighScore()`
- Test `getProfile()` / `trackGamePlayed()`
- Test `getSavedName()` / `saveName()`

**`games/daily-challenge.test.ts`:**
- Test `getDailyChallenge()` is deterministic (same date = same challenge)
- Test different dates give different challenges
- Test streak tracking

**`games/audio.test.ts`:**
- Test `isMusicEnabled()` / `isSfxEnabled()` defaults
- Test toggle persistence
- Mock AudioContext for SFX function calls (don't actually play audio)

**`games/game-components.test.tsx`:**
- For EACH existing game (LetterRain, MathBlitz, FractionFighter, WordBuilder, TimesTable, FractionLab, ElementMatch, TimelineDash):
  - Test renders without crashing
  - Test menu phase renders settings
  - Test start button exists and is clickable
- Keep tests simple — verify renders, not full gameplay logic

**Setup notes:**
- If no test framework exists: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react`
- Create `vitest.config.ts` in apps/web if needed
- Mock `localStorage` in tests
- Mock `AudioContext` in audio tests

## GIT RULES
- Pull before editing: `git pull`
- Commit frequently: `git add apps/web/app/games/daily-challenge apps/web/app/games/progress apps/web/components/games/DailyChallengeGame.tsx apps/web/components/games/ProgressDashboard.tsx apps/web/lib/games/daily-challenge.ts apps/web/__tests__ && git commit -m "agent/engage: <desc>"`
- Push immediately: `git push`

## ON COMPLETION
1. Run tests: `cd apps/web && npx vitest run`
2. Verify build: `cd apps/web && npx next build`
3. Commit & push
4. Update `scripts/agents/agent4-status.md` with COMPLETE

## REMEMBER
- Daily Challenge must be FULLY FUNCTIONAL and self-contained
- Progress Dashboard must look polished (use Tailwind, dark theme, cards, gradients)
- Tests must actually pass, not just exist
- Mock localStorage and AudioContext properly
- No external dependencies beyond test libraries
- Dark theme, same aesthetic as existing games
