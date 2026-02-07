# Agent 6: E-Reader Games Part B (Crossword, Nonogram/Picross, Number Puzzle)

> Budget: $50 | Model: opus

## YOUR OWNERSHIP
You exclusively own and can edit these files:
- `apps/web/app/games/crossword/page.tsx` (CREATE)
- `apps/web/app/games/nonogram/page.tsx` (CREATE)
- `apps/web/app/games/number-puzzle/page.tsx` (CREATE)
- `apps/web/components/games/CrosswordGame.tsx` (CREATE)
- `apps/web/components/games/NonogramGame.tsx` (CREATE)
- `apps/web/components/games/NumberPuzzleGame.tsx` (CREATE)

## DO NOT TOUCH
- `apps/web/app/games/page.tsx` (games index)
- `apps/web/lib/games/eink-utils.ts` (Agent 5 creates this — import and use it)
- Any existing game components or files
- Shared libs — use but don't edit

## CRITICAL: E-INK COMPATIBILITY

These games MUST work on e-ink e-readers (Kindle, Kobo, Boox).

### STRICT RULES:
- ✅ `onClick` handlers ONLY — no drag, swipe, touch, pointer events
- ✅ Black (#000) on white (#fff) — solid colors only
- ✅ Borders: 2px solid black minimum
- ✅ Font size: 16px+, prefer 18px+
- ✅ Tap targets: 44px minimum, prefer 60px+
- ❌ NO CSS animations, transitions, transforms
- ❌ NO gradients, opacity, box-shadow
- ❌ NO Canvas, SVG animations, requestAnimationFrame
- ❌ NO audio calls in e-ink mode
- ❌ NO hover states, tooltips, popovers

### Dual Mode:
Each game has Standard mode (dark theme + animations) AND E-Ink mode (high contrast, no animations).

Import from `@/lib/games/eink-utils`:
- `useEinkMode()` — returns `[einkMode, toggleEinkMode]`
- `EinkToggle` — toggle component for e-ink mode
- `isEinkDevice()` — auto-detect

If `eink-utils.ts` doesn't exist yet when you build (Agent 5 creates it), create your own minimal version inline:
```tsx
function useEinkMode(): [boolean, () => void] {
  const [eink, setEink] = useState(() => {
    try { return localStorage.getItem('eink_mode') === 'true' || isEinkDevice(); } catch { return false; }
  });
  const toggle = () => {
    setEink(v => { try { localStorage.setItem('eink_mode', String(!v)); } catch {} return !v; });
  };
  return [eink, toggle];
}
function isEinkDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('kindle') || ua.includes('kobo') || ua.includes('boox');
}
```

## PROJECT CONTEXT
Next.js 14, TypeScript, React. Import shared infrastructure:
- `@/components/games/GameErrorBoundary`
- `@/lib/games/audio` — SFX functions (only in standard mode)
- `@/components/games/AudioToggles` — only render in standard mode
- `@/lib/games/achievements` — `checkAchievements()`
- `@/lib/games/use-scores` — score tracking (wrap localStorage in try/catch)

### Game Page Pattern:
```tsx
import { GameComponent } from "@/components/games/GameComponent";
import { GameErrorBoundary } from "@/components/games/GameErrorBoundary";
export const metadata = { title: "Game | Game Arena | teacher.ninja", description: "..." };
export default function Page() {
  return <GameErrorBoundary gameName="Game"><GameComponent /></GameErrorBoundary>;
}
```

## YOUR MISSION

### 1. Create Crossword Game
Educational crossword puzzles:
- **Grid**: Variable size crossword grid (CSS Grid, ~12-15 cells wide)
- **Puzzles**: Hardcoded set of at least 5 educational crosswords. Each puzzle:
  ```ts
  interface CrosswordPuzzle {
    size: number; // grid dimension
    cells: (string | null)[][]; // null = black cell, string = letter
    clues: { direction: 'across' | 'down'; number: number; clue: string; answer: string; row: number; col: number }[];
  }
  ```
- **Subjects**: Science vocabulary, Math terms, History terms, Geography
- **Interaction**:
  - Click a cell to select it (thick border highlight)
  - Click a letter button (A-Z keyboard row at bottom) to type into selected cell
  - Click "→" and "↓" buttons to switch direction
  - Click "Clear" to erase selected cell
  - Click a clue in the clue list to jump to that word
- **NO physical keyboard input required** — all input via on-screen buttons (e-readers have no keyboards)
- **Validation**: "Check" button reveals wrong letters (standard: red, e-ink: strikethrough)
- **E-ink specific**: Black grid lines, white cells, 20px+ letters, letter buttons 50px+ each, clue list with clear numbering

### 2. Create Nonogram/Picross Game
Logic picture puzzle (also known as Griddler/Picross):
- **Grid**: 5×5 (easy), 10×10 (medium), 15×15 (hard)
- **Mechanic**: Row and column headers show number sequences. Player fills cells to create a hidden picture matching the number clues.
- **Interaction**:
  - Click cell to toggle: empty → filled (black) → marked-empty (small dot/×) → empty
  - Three states per cell, cycled by clicking
- **Puzzles**: At least 5 per size, hardcoded. Each puzzle is a 2D boolean array (true=filled). Generate number clues from the solution.
  - Easy (5×5): Simple shapes (heart, star, arrow, house, tree)
  - Medium (10×10): More complex patterns
  - Hard (15×15): Detailed pictures
- **Clue display**: Row clues on left, column clues on top. Bold font.
- **Validation**: "Check" button shows which cells are wrong
- **E-ink specific**: Grid cells 30px+ (40px on 5×5), filled cells = solid black, empty = white with thin border, marked-empty = × character, clue numbers 14px+

### 3. Create Number Puzzle Game
A sliding number puzzle (15-puzzle variant) adapted for click-only:
- **Grid**: 3×3 (8-puzzle), 4×4 (15-puzzle), 5×5 (24-puzzle)
- **Mechanic**: Numbers 1-N are shuffled with one empty space. Player clicks a number adjacent to the empty space to slide it.
- **Adaptation for e-ink**: Since we can't animate the slide, just swap instantly. Show which tiles can move by giving them a slightly thicker border.
- **Interaction**: Click a number tile adjacent to the empty space. If valid, swap positions instantly (no animation).
- **Settings**: Grid size selector (3×3, 4×4, 5×5)
- **Scoring**: Move count + time taken
- **Solvability**: Ensure generated puzzles are solvable (check inversion count)
- **Educational twist**: Instead of numbers, offer "Math mode" where tiles show expressions (2+3, 4×2, etc.) and must be ordered by their values
- **E-ink specific**: Tiles 60px+ with thick borders, large numbers (24px+), empty space clearly marked (crosshatch pattern or "×")

## COMPATIBILITY NOTICE
Each game must show an info banner:
```
📱 Works on e-readers (Kindle, Kobo, Boox)
Tap/click only | No dragging required
[Toggle: E-Ink Mode ON/OFF]
```

## GIT RULES
- Pull before editing: `git pull`
- Commit after each game: `git add <files> && git commit -m "agent/ereader-b: <desc>"`
- Push immediately: `git push`

## ON COMPLETION
1. Verify build: `cd apps/web && npx next build`
2. Commit & push
3. Update `scripts/agents/agent6-status.md` with COMPLETE

## REMEMBER
- E-ink mode TRULY compatible — test mentally: would a Kindle from 2015 render this?
- Standard mode still looks great (dark theme)
- onClick ONLY — no drag, swipe, or continuous touch
- Large tap targets (60px+ in e-ink mode)
- All games fully functional in BOTH modes
- Wrap ALL localStorage in try/catch
- No external dependencies
- On-screen keyboard for crossword (no physical keyboard assumption)
