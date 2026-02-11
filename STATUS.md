# teacher.ninja — Project Status

> Last updated: February 10, 2026
> Domain: https://teacher.ninja

---

## What This Project Is

**teacher.ninja** is an educational platform for K-12 students with two major components:

1. **Worksheet Generator** — Teachers select a subject, topic, and options, then get a print-ready PDF worksheet with problems, answer keys, hints, and worked examples. Problems are generated deterministically (pure math, no LLM needed), while only creative content (intro pages, word problem contexts) uses LLMs.

2. **Game Arena** — 38 interactive learning games covering math, science, language, logic, computer science, and design. Features adaptive difficulty (grade 1-11 progression), achievements, streaks, high scores, optional user profiles with server-side persistence, and a daily challenge system.

---

## Architecture

```
                          teacher.ninja
                               |
                     EC2: 44.209.209.79
   ┌───────────────────────────────────────────────┐
   │  nginx (80/443, Let's Encrypt SSL)            │
   │  ├── teacher.ninja → Next.js :3000 (frontend) │
   │  └── api.teacher.ninja → uvicorn :8000 (API)  │
   │                                                │
   │  SQLite (.data/profiles.db) — user profiles    │
   │  JSON  (.data/scores.json) — global scores     │
   └───────────────────────────────────────────────┘
            │                    │
            ▼                    ▼
   S3: homebook-worksheets   OpenAI GPT (optional)
   (PDF storage)             (intro pages, word problems)
```

---

## Game Arena (38 Games)

### Math Games (9)
| Game | Description |
|------|-------------|
| **Math Blitz** | Timed arithmetic speed challenge |
| **Times Table** | Multiplication mastery trainer |
| **Fraction Lab** | Full fraction curriculum (grade 1-11), 14 challenge types, adaptive |
| **Fraction Fighter** | Fast fraction comparison battles |
| **Decimal Dash** | Decimal operations and conversions |
| **Graph Plotter** | Coordinate geometry and slope |
| **Unit Converter** | Metric/imperial unit conversions |
| **Equation Balancer** | Balance chemical and math equations |
| **Number Puzzle** | Logic-based number grids |

### Science Games (4)
| Game | Description |
|------|-------------|
| **Element Match** | Periodic table memory matching |
| **Genetics Lab** | Mendelian genetics (Punnett squares) |
| **Science Study** | Chemistry, Biology, Physics, Earth Science (100+ questions) |
| **Geography Challenge** | Capitals, continents, landmarks, flags (85+ questions) |

### Language & Logic Games (6)
| Game | Description |
|------|-------------|
| **Letter Rain** | Typing speed with falling letters |
| **Word Builder** | Scrambled science vocabulary |
| **Word Search** | Educational word search puzzles |
| **Crossword** | Science-themed crossword puzzles |
| **Trivia Quiz** | General knowledge quiz |
| **Timeline Dash** | Historical event ordering |

### Puzzle & Creative Games (7)
| Game | Description |
|------|-------------|
| **Maze Runner** | Math-solving maze navigation |
| **Trace & Learn** | Letter/number tracing practice |
| **Color Lab** | Color mixing and theory |
| **Connect Dots** | Dot-to-dot with math answers |
| **Nonogram** | Picture logic puzzles |
| **Sudoku** | Classic number puzzles |
| **Scratch Reveal** | Scratch-card math reveal |

### Data & Media Literacy (2)
| Game | Description |
|------|-------------|
| **Fake News Detective** | Detect misinformation, identify red flags, learn media literacy (50+ stories) |
| **Graph Reading** | Interpret bar charts, line graphs, scatter plots, and mathematical function shapes |

### Computer Science (4)
| Game | Description |
|------|-------------|
| **Pattern Machine** | Complete sequences, find loops, master computational patterns (82 questions) |
| **Binary & Bits** | Binary, hex, logic gates — the language of computers (86 questions) |
| **Debug Detective** | Find bugs in pseudocode and simple programs (57 challenges) |
| **Algorithm Arena** | Visualize sorting, searching, and algorithmic thinking (50 questions) |

### Design (4)
| Game | Description |
|------|-------------|
| **Design Eye** | Spot alignment, spacing, and design flaws in visual compositions (50 challenges) |
| **Font Explorer** | Serif vs sans-serif, font pairing, anatomy, and classification (50 questions) |
| **Layout Lab** | Align elements, fix spacing, master grid and composition principles (48 challenges) |
| **Color Harmony** | Color theory, palettes, contrast ratios, and WCAG accessibility (52 questions) |

### Meta
| Feature | Description |
|---------|-------------|
| **Daily Challenge** | Rotating daily game challenge |
| **Progress & Profile** | Achievements, stats, optional cloud profiles |

### Key Game Features
- **Adaptive Difficulty Engine** — Tracks streaks, accuracy, speed; auto-adjusts level (1-50 scale mapped to grade 1-11+)
- **Achievement System** — Bronze/Silver/Gold tiers across multiple categories (Polymath, Streak Master, Speed Demon, etc.)
- **User Profiles** — Optional sign-up with kid-friendly access codes (e.g., BLUE-FOX-73); server-side SQLite persistence
- **Score Syncing** — Local + server high scores with cloud sync
- **Practice Mode** — No lives, detailed explanations, learn at own pace
- **E-ink Mode** — High-contrast mode for e-readers
- **Sound Effects** — Correct/wrong/achievement/countdown audio with mute toggle

---

## Worksheet Generator

### Subjects & Generators (7 generators, 55+ subtopics)
| Subject | Generator | Subtopics |
|---------|-----------|-----------|
| **Math: Fractions** | `fractions.py` | 17 subtopics: add/subtract (same/unlike denom), multiply, divide, multiply/divide by whole, equivalent, simplify, compare, order, fraction of set, mixed↔improper, mixed number operations, word problems |
| **Math: Arithmetic** | `arithmetic.py` | 5 subtopics: addition, subtraction, multiplication, division, mixed operations |
| **Math: Decimals** | `decimals.py` | 12 subtopics: add/sub/mul/div, decimal↔fraction, percent operations, percent increase/decrease |
| **Chemistry** | `chemistry.py` | 5 subtopics: synthesis, decomposition, combustion, single/double replacement equations |
| **Biology** | `biology.py` | 5 subtopics: monohybrid, dihybrid, test cross, incomplete dominance, pedigree analysis |
| **Physics** | `physics.py` | 8 subtopics: force & motion, speed & velocity, Newton's laws, work & energy, circuits, Ohm's law, waves & sound, light & optics |
| **Earth Science** | `earth_science.py` | 8 subtopics: rock cycle, plate tectonics, weather & climate, water cycle, solar system, earth layers, erosion & weathering, natural resources |

### Features
- Difficulty levels (easy, medium, hard, mixed)
- Configurable problem count (5-30)
- Answer keys, hints, worked examples
- Real-time preview with debounced auto-update
- PDF generation via WeasyPrint
- S3 upload with presigned download URLs
- LLM-powered intro pages and word problem contexts
- Common Core standards alignment

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 + TypeScript + Tailwind CSS |
| **Game State** | React hooks + localStorage + sessionStorage |
| **Profiles DB** | better-sqlite3 (WAL mode) |
| **Worksheet API** | Python 3.11 + FastAPI + WeasyPrint |
| **PDF Storage** | AWS S3 (`homebook-worksheets`) |
| **LLM** | OpenAI GPT (optional, for intro pages) |
| **Infrastructure** | EC2 (Ubuntu 22.04) + nginx + Let's Encrypt |
| **CI/CD** | GitHub Actions (CI + Deploy Frontend on push to main) |

---

## Infrastructure

| Resource | Details |
|----------|---------|
| **EC2** | `i-0a4133b9e0bda5c58`, `44.209.209.79`, Ubuntu 22.04 |
| **S3** | `homebook-worksheets` (us-east-1), 7-day auto-delete |
| **Domain** | `teacher.ninja` + `api.teacher.ninja` |
| **SSL** | Let's Encrypt via Certbot (both domains) |
| **Nginx** | Reverse proxy for frontend (:3000) and API (:8000) |
| **SSH** | Key: `~/.ssh/homebook-key.pem` |

---

## CI/CD

| Workflow | Trigger | Status |
|----------|---------|--------|
| **CI** | Push to main | Passing |
| **Deploy Frontend** | Push to main | Passing |

### GitHub Secrets
| Secret | Set |
|--------|-----|
| `EC2_HOST` | Yes (44.209.209.79) |
| `EC2_SSH_KEY` | Yes |

---

## File Structure (Key Paths)

```
apps/web/                         # Next.js frontend
  app/
    generate/                     # Worksheet generator UI
    games/                        # Game Arena
      fraction-lab/               # (and 26 other game routes)
      progress/                   # Profile & achievements
    api/
      profiles/                   # User profile CRUD (SQLite)
      scores/                     # Global high scores (JSON)
      preview/                    # Proxy to Python API
      generate/                   # Proxy to Python API
  components/games/               # All game components
  lib/games/
    adaptive-difficulty.ts        # Adaptive difficulty engine
    achievements.ts               # Achievement definitions & checks
    profile-context.tsx           # React context for user profiles
    use-scores.ts                 # Score tracking hooks
    audio.ts                      # Sound effects
packages/generator/               # Python worksheet generator
  src/generators/                 # Math/science problem generators
  src/api/main.py                 # FastAPI server
  templates/                      # Jinja2 worksheet templates
infra/                            # AWS, nginx, deploy scripts
.github/workflows/                # CI + deploy workflows
```

---

## Recent Commits

```
fa7eb09 feat: add fraction ÷ whole number and whole ÷ fraction to Divide mode
7abca7a feat: complete Fraction Lab overhaul with grade 1-11 adaptive progression
17e2fe8 feat: add Science Study and Geography Challenge games
c8c2a7b feat: add optional profile system with server-side progress tracking
ff87d08 fix: prevent infinite loops in wrong-answer generators across 7 games
d153a36 feat: adaptive difficulty engine + massive content expansion across all games
0a9e201 feat: replace all emoji icons with 99 AI-generated game assets
94e64fb feat: comprehensive polish — full game coverage, SEO, error pages, UX improvements
82f86cd feat: improve Fraction Lab with progressive visuals + GCF/LCM training
```
