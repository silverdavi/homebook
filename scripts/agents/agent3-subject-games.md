# Agent 3: Subject-Aligned Games (Equation Balancer, Genetics Lab, Decimal Dash, Unit Converter)

> Budget: $50 | Model: opus

## YOUR OWNERSHIP
You exclusively own and can edit these files:
- `apps/web/app/games/equation-balancer/page.tsx` (CREATE)
- `apps/web/app/games/genetics-lab/page.tsx` (CREATE)
- `apps/web/app/games/decimal-dash/page.tsx` (CREATE)
- `apps/web/app/games/unit-converter/page.tsx` (CREATE)
- `apps/web/components/games/EquationBalancerGame.tsx` (CREATE)
- `apps/web/components/games/GeneticsLabGame.tsx` (CREATE)
- `apps/web/components/games/DecimalDashGame.tsx` (CREATE)
- `apps/web/components/games/UnitConverterGame.tsx` (CREATE)

## DO NOT TOUCH
- `apps/web/app/games/page.tsx` (games index)
- Any existing game components or pages
- `apps/web/lib/games/audio.ts`, `achievements.ts`, `use-scores.ts` (use, don't edit)

## PROJECT CONTEXT
Next.js 14 educational game platform (teacher.ninja). Client components with `"use client"`, React hooks, Tailwind CSS, dark theme (slate-950/indigo-950). TypeScript.

### Shared Infrastructure (import and use):
- `@/components/games/AudioToggles` — music/SFX toggle + `useGameMusic()` hook
- `@/components/games/AchievementToast` — toast for medals
- `@/components/games/ScoreSubmit` — score submission + leaderboard
- `@/components/games/RewardEffects` — streak badges, heart recovery
- `@/components/games/GameErrorBoundary` — error boundary wrapper
- `@/lib/games/audio` — `sfxCorrect()`, `sfxWrong()`, `sfxCombo()`, `sfxLevelUp()`, `sfxGameOver()`, `sfxCountdown()`, `sfxCountdownGo()`, `sfxClick()`, `sfxHeart()`, `sfxAchievement()`
- `@/lib/games/achievements` — `checkAchievements(stats, totalGamesPlayed, gamesPlayedByGameId)`
- `@/lib/games/use-scores` — `getLocalHighScore()`, `setLocalHighScore()`, `getProfile()`, `trackGamePlayed()`
- `@/lib/games/science-data` — `ELEMENTS` array with { symbol, name, atomicNumber, category }

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
- 3-2-1 countdown
- Settings with sliders + toggles in menu
- Meaningful difficulty labels
- Dark gradient background
- `useGameMusic()` + `<AudioToggles />`
- SFX calls on correct/wrong/combo/gameOver/achievement
- `trackGamePlayed()` and `checkAchievements()` on end
- Educational tooltips during gameplay

## YOUR MISSION

### 1. Create Equation Balancer Game (Chemistry)
Interactive chemical equation balancing:
- **Mechanic**: Show an unbalanced equation (e.g., H₂ + O₂ → H₂O). Player adjusts coefficients by tapping +/- buttons until atoms are balanced on both sides.
- **Equations bank** (hardcoded, at least 20 equations):
  - Simple: H₂ + O₂ → H₂O, Fe + O₂ → Fe₂O₃, N₂ + H₂ → NH₃
  - Medium: CH₄ + O₂ → CO₂ + H₂O, C₃H₈ + O₂ → CO₂ + H₂O
  - Hard: Fe₂O₃ + C → Fe + CO₂, KMnO₄ + HCl → KCl + MnCl₂ + Cl₂ + H₂O
- **UI**: Large equation display with subscript/superscript. Coefficient buttons (arrows or +/−) above each compound. Real-time atom count table on both sides.
- **Settings**: Difficulty slider (1-10, controls equation complexity), timer toggle (with sec/equation display), rounds slider (5-20)
- **Scoring**: Points per equation, time bonus, streak multiplier
- **Tips**: Chemistry tips about conservation of mass, oxidation states, etc.

### 2. Create Genetics Lab Game (Biology)
Interactive Punnett square / genetics:
- **Mechanic**: Given parent genotypes, player builds the Punnett square and predicts offspring ratios.
- **Modes**:
  1. "Fill the Square" — given parents (e.g., Aa × Aa), fill in the 4 cells of Punnett square
  2. "Predict Ratios" — given parents, predict the phenotype ratio (e.g., 3:1)
  3. "Find Parents" — given offspring ratios, determine possible parent genotypes
- **Traits**: Eye color (B/b), height (T/t), pea color (G/g), flower color (R/r) — with visual previews
- **UI**: Interactive 2×2 grid, draggable alleles, visual phenotype preview for each genotype
- **Settings**: Mode selector, rounds slider (5-15), toggle "show dominance hints"
- **Scoring**: Correct answers + speed bonus
- **Tips**: Mendelian genetics tips (dominant/recessive, heterozygous/homozygous, etc.)

### 3. Create Decimal Dash Game (Math)
Fast-paced decimal operations:
- **Mechanic**: Quick-fire decimal problems with visual number line support.
- **Modes**:
  1. "Number Line" — place a decimal on a number line (tap the correct position)
  2. "Operations" — solve decimal +, −, ×, ÷ problems
  3. "Compare" — which decimal is larger? (tap left or right)
  4. "Convert" — convert fraction ↔ decimal ↔ percentage
- **UI**: Large problem display, number line visualization (SVG or DOM), quick-tap answer buttons
- **Settings**: Mode selector (or toggle each), duration slider (30s-300s), decimal places slider (1-3)
- **Scoring**: Timed, points per correct, streak multiplier
- **Tips**: Decimal math tips (place value, moving decimal point for ×10, etc.)

### 4. Create Unit Converter Race Game (Science/Math)
Speed unit conversion game:
- **Mechanic**: Given a value in one unit, convert to another. Multiple choice or type answer.
- **Categories**: Length (mm, cm, m, km, in, ft, mi), Mass (g, kg, lb, oz), Volume (mL, L, gal, cup), Temperature (°C, °F, K), Time (sec, min, hr, day)
- **UI**: Large value display with unit, 4 answer options (one correct), timer bar
- **Settings**: Category toggles (select which unit types), speed slider (sec/question, 3-15s), rounds slider (10-30)
- **Scoring**: Correct answers + time bonus + streak
- **Tips**: Unit conversion shortcuts, mnemonic devices

## GIT RULES
- Pull before editing: `git pull`
- Commit after each game: `git add apps/web/app/games/equation-balancer apps/web/app/games/genetics-lab apps/web/app/games/decimal-dash apps/web/app/games/unit-converter apps/web/components/games/EquationBalancerGame.tsx apps/web/components/games/GeneticsLabGame.tsx apps/web/components/games/DecimalDashGame.tsx apps/web/components/games/UnitConverterGame.tsx && git commit -m "agent/subject: <desc>"`
- Push immediately: `git push`

## ON COMPLETION
1. Verify: `cd apps/web && npx next build`
2. Commit & push
3. Update `scripts/agents/agent3-status.md` with COMPLETE

## REMEMBER
- All games FULLY FUNCTIONAL
- These are DOM-based games (no canvas needed), use React + Tailwind
- Every game: menu, countdown, gameplay, results
- Dark theme, same aesthetic as existing games
- Use shared infrastructure (audio, achievements, scores)
- No external dependencies
- Ensure Punnett square is visually interactive, not just text
- Chemical equations must render subscripts properly (use <sub> tags)
