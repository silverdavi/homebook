# Adaptive Difficulty System

## Core Engine (`adaptive-difficulty.ts`)

All games use a centralized adaptive difficulty engine that dynamically adjusts difficulty based on player performance.

### How It Works

| Signal | Effect |
|--------|--------|
| **Correct streak (5+)** | Level increases ~10% per streak |
| **Fast correct answer** | Extra level boost |
| **Wrong answer** | Level decreases (less penalty than correct gains) |
| **Consecutive wrong (3+)** | Faster level decrease |

### Level Scale

The engine tracks a floating-point level (1-50) that maps to educational grade levels:

| Level Range | Grade | Description |
|-------------|-------|-------------|
| 1-5 | Grade 1-2 | Foundational concepts, small numbers |
| 6-10 | Grade 3 | Basic operations, simple fractions |
| 11-14 | Grade 4 | Multi-digit, mixed numbers |
| 15-18 | Grade 5 | Different denominators, decimals |
| 19-25 | Grade 6 | Complex operations, ratios |
| 26-32 | Grade 7-8 | Advanced fractions, algebra prep |
| 33-40 | Grade 9-10 | Multi-step, combined operations |
| 41-50 | Grade 11+ | Expert-level challenges |

### Design Principles

- **Wrong answers cost less than right answers gain** — keeps players motivated
- **Speed matters** — fast correct answers earn more, encouraging fluency
- **Recovery is quick** — a few correct answers recover from mistakes
- **Grade level display** — players see their current grade level for context

---

## Per-Game Difficulty Tuning

### Math Blitz

| Parameter | Level 1-3 | Level 4-7 | Level 8-12 | Level 13+ |
|-----------|-----------|-----------|------------|-----------|
| Operations | +, - | +, -, x | +, -, x, / | All |
| Add/Sub range | 1-25 | 1-35 | 1-60 | 1-100 |
| Multiply range | 2-5 | 2-7 | 2-10 | 2-12 |
| Timer | 60s | 60s | 60s | 60s |

### Times Table

| Parameter | Beginner | Intermediate | Advanced | Expert |
|-----------|----------|--------------|----------|--------|
| Table range | 1-5 | 1-7 | 1-10 | 1-12 |
| Timer | None | 8s | 5s | 3s |
| Adaptive | Level up on 5-streak, down on 3 wrong |

### Fraction Lab (Comprehensive)

Uses `getLevelConfig(level)` for all 14 challenge types:

| Parameter | Grade 1-2 | Grade 3 | Grade 5 | Grade 7+ | Grade 11+ |
|-----------|-----------|---------|---------|----------|-----------|
| Denominator pool | 2,3,4 | 2-6 | 2-10 | 2-12,15,16,20 | 2-25,32,64 |
| Different denom prob | 0% | 0% | 60% | 80% | 95% |
| Max whole number | 5 | 12 | 30 | 50 | 100 |
| GCF/LCM range | 4-12 | 6-20 | 10-50 | 20-120 | 50-500 |

**Challenge types:** Identify, Compare, Add, Subtract, Multiply, Divide, Equivalent, Simplify, Mixed-to-Improper, Improper-to-Mixed, Fraction of Number, LCD Practice, GCF, LCM

**Division progression:**
- Grade 5: Fraction / whole number only
- Grade 6: Adds whole / fraction
- Grade 7+: All three variants (fraction/whole, whole/fraction, fraction/fraction)

### Fraction Fighter

| Parameter | Level 1-3 | Level 4-7 | Level 8-12 | Level 13+ |
|-----------|-----------|-----------|------------|-----------|
| Max denominator | 6 | 10 | 16 | 20 |
| Timer per question | 5s | 4s | 3.5s | 3s |
| Lives | 5 | 5 | 5 | 5 |
| Min difference | 0.1+ | 0.05+ | 0.02+ | Any |

### Decimal Dash

| Parameter | Beginner | Intermediate | Advanced |
|-----------|----------|--------------|----------|
| Operations | +, - | +, -, x | All |
| Decimal places | 1 | 1-2 | 1-3 |
| Range | 0.1-9.9 | 0.01-99.99 | 0.001-999 |
| Adaptive | Level adjusts per streak/accuracy |

### Element Match

| Grid | Pairs | Difficulty |
|------|-------|------------|
| 4x2 | 4 | Easy (common elements: H, O, C, N) |
| 4x3 | 6 | Medium |
| 4x4 | 8 | Hard (includes tricky: Na, K, Fe, W, Hg) |
| 5x4 | 10 | Expert |

### Letter Rain

| Parameter | Easy | Medium | Hard |
|-----------|------|--------|------|
| Fall speed (px/frame) | 0.5 | 0.8 | 1.1 |
| Spawn interval (ms) | 1400 | 1000 | 700 |
| Sentence length | 3-5 words | 5-8 words | 8-14 words |
| Lives | 5 | 5 | 5 |

### Word Builder

| Parameter | Word 1-5 | Word 6-10 | Word 11-15 | Word 16+ |
|-----------|----------|-----------|------------|----------|
| Word length | 3-4 | 4-5 | 5-6 | 6-8 |
| Points (no hint) | 10 | 10 | 15 | 20 |
| Skips | 3 | 3 | 3 | 3 |

### Graph Plotter

| Parameter | Easy | Medium | Hard |
|-----------|------|--------|------|
| Grid range | -5 to 5 | -10 to 10 | -20 to 20 |
| Challenge type | Plot points | Find slope | Linear equations |

### Unit Converter

| Parameter | Easy | Medium | Hard |
|-----------|------|--------|------|
| Unit types | Length only | Length + weight | All (length, weight, volume, temp) |
| Conversion complexity | Same system | Cross-system | Multi-step |

### Science Study

| Parameter | Description |
|-----------|-------------|
| Categories | Chemistry, Biology, Physics, Earth Science |
| Questions | 100+ per category |
| Adaptive | Tracks per-category performance |
| Mode | Multiple choice with explanations |

### Geography Challenge

| Parameter | Description |
|-----------|-------------|
| Categories | Capitals, Continents, Landmarks, Flags |
| Questions | 85+ total |
| Adaptive | Tracks per-category performance |
| Mode | Multiple choice with map context |

### Maze Runner

| Parameter | Easy | Medium | Hard |
|-----------|------|--------|------|
| Grid size | 7x7 | 11x11 | 15x15 |
| Math gates | Addition | Add + Multiply | All operations |
| Timer | None | 120s | 90s |

### Puzzle Games (Sudoku, Nonogram, Crossword, Word Search)

These games use standard difficulty scaling:
- **Sudoku:** Fewer/more given numbers
- **Nonogram:** Grid size (5x5 to 15x15)
- **Crossword:** Word length and obscurity
- **Word Search:** Grid size and word count

---

## Achievement System

| Achievement | Bronze | Silver | Gold |
|-------------|--------|--------|------|
| **Score Master** | 1000 pts | 5000 pts | 10000 pts |
| **Streak Master** | 5 streak | 10 streak | 25 streak |
| **Speed Demon** | 10 fast | 25 fast | 50 fast |
| **Polymath** | Play 10 games | Play 20 games | Play all 27 games |
| **Daily Player** | 3 day streak | 7 day streak | 30 day streak |
| **Perfectionist** | 90% accuracy | 95% accuracy | 100% in a session |

Additional tiers: Unstoppable, Immortal, Legendary (for extreme streaks and scores).
