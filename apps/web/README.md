# teacher.ninja — Frontend

The Next.js frontend for [teacher.ninja](https://teacher.ninja), an educational platform with a worksheet generator and 27 interactive learning games.

## Getting Started

```bash
# From the repo root
cd apps/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

```
app/
  page.tsx              # Landing page
  generate/             # Worksheet generator
  games/                # Game Arena (27 games)
    fraction-lab/       # Fraction curriculum (grade 1-11)
    math-blitz/         # Arithmetic speed challenge
    times-table/        # Multiplication trainer
    science-study/      # Science quiz (4 subjects)
    geography/          # Geography challenge
    ...                 # 22 more game routes
    progress/           # Player profile & achievements
  api/
    profiles/           # User profile CRUD (SQLite)
    scores/             # Global high scores
    preview/            # Proxy to Python worksheet API
    generate/           # Proxy to Python worksheet API
components/
  games/                # Game components (one per game)
  generator/            # Worksheet generator UI components
lib/
  games/
    adaptive-difficulty.ts  # Adaptive difficulty engine
    achievements.ts         # Achievement system
    profile-context.tsx     # React context for profiles
    use-scores.ts           # Score tracking
    audio.ts                # Sound effects
  subjects.ts           # Worksheet subject/topic definitions
  api.ts                # API client for worksheet generator
```

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript** + **Tailwind CSS**
- **better-sqlite3** for user profile persistence
- **localStorage/sessionStorage** for client-side game state

## Deployment

Deployed to EC2 via GitHub Actions on push to `main`. The workflow SSHes into the server, pulls, builds, and restarts the Next.js process.

## Environment Variables

See `.env.example` or the root `.env` file. Key variables:

- `GENERATOR_API_URL` — Python worksheet API URL (default: `http://localhost:8000`)
