# Agent 2: Canvas Games B — Status

## Status: COMPLETE

## Games Created

### 1. Connect the Dots (`/games/connect-dots`)
- **Component**: `apps/web/components/games/ConnectDotsGame.tsx`
- **Page**: `apps/web/app/games/connect-dots/page.tsx`
- **Features**:
  - 3 categories: Math Sequences (count by 2s/3s/4s/5s, primes), Constellations (Big Dipper, Orion, Cassiopeia, Leo, Cygnus), Simple Circuits (series, LED, buzzer)
  - Canvas rendering with numbered dots, connection lines, shape reveal animation
  - PointerEvent API for touch/mouse/stylus
  - Settings: category selector, round count slider (3-10), toggle show sequence labels
  - Scoring: dots × 15 + time bonus, streak multipliers
  - Color: indigo theme

### 2. Scratch & Reveal (`/games/scratch-reveal`)
- **Component**: `apps/web/components/games/ScratchRevealGame.tsx`
- **Page**: `apps/web/app/games/scratch-reveal/page.tsx`
- **Features**:
  - 4 subjects: Math (arithmetic, fractions), Science (element symbols → names), History (dates → events), Vocabulary (word → definition)
  - Canvas scratch overlay with metallic gradient + sparkle effect
  - `globalCompositeOperation = 'destination-out'` for eraser
  - Auto-reveal at 60% scratched, with grid-based coverage tracking
  - Self-check: player clicks "I got it right" or "I missed it"
  - Settings: subject selector, card count slider (5-20), timed mode toggle (15s/card)
  - Color: violet theme

### 3. Graph Plotter (`/games/graph-plotter`)
- **Component**: `apps/web/components/games/GraphPlotterGame.tsx`
- **Page**: `apps/web/app/games/graph-plotter/page.tsx`
- **Features**:
  - 3 modes: Plot the Point, Find the Slope, Draw the Line
  - Full coordinate grid with axes, labels, grid lines
  - Snap-to-integer for point placement
  - Slope input accepts fractions, decimals, "undefined"
  - Line mode validates both points lie on y=mx+b
  - Settings: mode selector, grid range slider (3-10), duration slider (30s-3m), grid lines toggle
  - Color: teal theme

## Shared Infrastructure Used
- AudioToggles + useGameMusic()
- SFX: correct, wrong, combo, gameOver, achievement, countdown, countdownGo, levelUp
- ScoreSubmit, AchievementToast, StreakBadge
- trackGamePlayed, checkAchievements, getLocalHighScore, setLocalHighScore, getProfile

## Build Status
- All 3 games compile without TypeScript errors
- Pre-existing build error in EquationBalancerGame.tsx (another agent's file) — not related to this work

## Commit
- `20a2196` — pushed to main
