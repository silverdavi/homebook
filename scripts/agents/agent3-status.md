# Agent 3: Subject-Aligned Games — COMPLETE

## Status: COMPLETE

## Games Created

### 1. Equation Balancer (Chemistry) ⚖️
- **File**: `apps/web/components/games/EquationBalancerGame.tsx`
- **Page**: `apps/web/app/games/equation-balancer/page.tsx`
- **Features**:
  - 23 hardcoded chemical equations across easy/medium/hard difficulty
  - Interactive +/- coefficient buttons per compound
  - Real-time atom count table showing balance status (green=balanced, red=unbalanced)
  - Chemical formulas rendered with proper subscripts
  - Settings: difficulty 1-10, rounds 5-20, timer toggle with sec/equation control
  - Scoring: base points + time bonus + difficulty bonus × streak multiplier
  - 8 chemistry tips shown during gameplay

### 2. Genetics Lab (Biology) 🧬
- **File**: `apps/web/components/games/GeneticsLabGame.tsx`
- **Page**: `apps/web/app/games/genetics-lab/page.tsx`
- **Features**:
  - 3 game modes: Fill Square, Predict Ratio, Find Parents
  - Interactive 2×2 Punnett square grid with click-to-select cells
  - 5 traits with visual phenotype previews (emoji + color)
  - Dominance hints toggle
  - Settings: mode selector, rounds 5-15, show hints toggle
  - Scoring: correct answers + speed bonus × streak multiplier
  - 8 Mendelian genetics tips

### 3. Decimal Dash (Math) 🔢
- **File**: `apps/web/components/games/DecimalDashGame.tsx`
- **Page**: `apps/web/app/games/decimal-dash/page.tsx`
- **Features**:
  - 4 modes: Number Line, Operations (+−×), Compare, Convert (frac↔dec↔pct)
  - SVG number line visualization with tick marks and marker
  - Mode toggles (can enable/disable each independently)
  - Settings: duration 30s-300s, decimal places 1-3, mode toggles
  - Timed gameplay with streak multiplier scoring
  - 8 decimal math tips

### 4. Unit Converter Race (Science/Math) 📐
- **File**: `apps/web/components/games/UnitConverterGame.tsx`
- **Page**: `apps/web/app/games/unit-converter/page.tsx`
- **Features**:
  - 5 categories: Length, Mass, Volume, Temperature, Time
  - 37 total unit conversions including metric, imperial, and cross-system
  - Per-question countdown timer with visual bar
  - Category toggles and colored category badges
  - Settings: category toggles, sec/question 3-15, rounds 10-30
  - Smart rounding for display values
  - 8 unit conversion tips

## Shared Infrastructure Used
All games integrate:
- `useGameMusic()` + `<AudioToggles />`
- SFX: correct, wrong, combo, gameOver, achievement, countdown, click
- `trackGamePlayed()` + `checkAchievements()` on game end
- `getLocalHighScore()` / `setLocalHighScore()` for persistence
- `<ScoreSubmit />` for leaderboard
- `<StreakBadge />` for streak multiplier display
- `<AchievementToast />` for medal notifications
- `<GameErrorBoundary />` wrapper on each page

## Build Status
- All 4 game components compile with zero TypeScript errors
- Pre-existing error in TraceLearnGame.tsx (not owned by this agent)

## Commit
- `fec45a3` — agent/subject: add Equation Balancer, Genetics Lab, Decimal Dash, Unit Converter games
