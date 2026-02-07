# Homebook (teacher.ninja) — Project Status

> Last updated: February 6, 2026  
> Current commit: `79ec0e0` — fix: route API calls through Next.js proxy to avoid CORS

---

## What This Project Is

**teacher.ninja** is a worksheet generator for K-12 teachers. Teachers select a subject, topic, and options, then get a print-ready PDF worksheet with problems, answer keys, hints, and worked examples.

The key architectural insight: **problems are generated deterministically** (pure math, no LLM needed), while only creative content (intro pages, word problem contexts) uses LLMs. This means each generation is cheap and fast, with optional LLM enhancement.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     EC2: 44.209.209.79                       │
│                                                               │
│  nginx (80/443)                                               │
│  ├── teacher.ninja ──────────► Next.js :3000 (frontend)       │
│  └── api.teacher.ninja ──────► uvicorn :8000 (Python API)     │
│                                                               │
│  Frontend calls /api/preview, /api/generate (same-origin)     │
│  Next.js API routes proxy server-side to localhost:8000       │
└─────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
   S3: homebook-worksheets        OpenAI GPT (optional)
   (PDF storage)                  (intro pages, word problems)
```

### Frontend: `apps/web/` — Next.js 16 + TypeScript + Tailwind

| Component | File | Purpose |
|-----------|------|---------|
| Main page | `app/generate/page.tsx` | Orchestrates all UI, auto-preview |
| API proxy | `app/api/preview/route.ts` | Server-side proxy to Python API |
| API proxy | `app/api/generate/route.ts` | Server-side proxy for PDF generation |
| State | `lib/store.ts` | Zustand store for all generator state |
| API client | `lib/api.ts` | Calls `/api/*` routes (no direct backend calls) |
| Subjects | `lib/subjects.ts` | Subject/topic/subtopic definitions + option filtering |
| Standards | `lib/standards.ts` | Common Core standards data |
| Preview | `components/generator/PreviewPane.tsx` | Sandboxed iframe preview |
| Options | `components/generator/OptionsPanel.tsx` | Subject/topic-aware options |
| Download | `components/generator/DownloadButton.tsx` | PDF generation + download |
| Help | `components/generator/HelpModal.tsx` | Usage guide modal |
| Version | `components/VersionFooter.tsx` | Build version display |

### Backend: `packages/generator/` — Python 3.11 + FastAPI

| Module | File | Purpose |
|--------|------|---------|
| API | `src/api/main.py` | FastAPI endpoints: `/preview`, `/generate`, `/health` |
| Config | `src/config.py` | Loads `.env`, S3/cache/CORS settings |
| Models | `src/models.py` | Dataclasses: Problem, Worksheet, WordProblemConfig |
| Renderer | `src/renderer.py` | Jinja2 HTML rendering |
| PDF | `src/pdf_generator.py` | WeasyPrint HTML→PDF |
| S3 | `src/s3_client.py` | Upload PDFs, generate presigned URLs |
| LLM | `src/llm_service.py` | OpenAI calls for intro pages + word problems |
| Cache | `src/cache.py` | Two-tier (memory + file) LLM response cache |
| Standards | `src/standards.py` | Common Core standards mapping |

### Generators (deterministic, no LLM)

| Generator | File | Subtopics |
|-----------|------|-----------|
| Fractions | `src/generators/fractions.py` | Add/subtract (same/diff denom), multiply, divide, mixed, simplify, compare |
| Arithmetic | `src/generators/arithmetic.py` | Addition, subtraction, multiplication, division, mixed, order of operations |
| Decimals | `src/generators/decimals.py` | 12 subtopics: add/sub/mul/div, rounding, comparing, fractions↔decimals↔percentages |
| Chemistry | `src/generators/chemistry.py` | Balancing equations |
| Biology | `src/generators/biology.py` | Mendelian genetics |

---

## Infrastructure

| Resource | Details |
|----------|---------|
| **EC2** | `i-0a4133b9e0bda5c58`, `44.209.209.79`, Ubuntu 22.04, 2GB RAM |
| **S3** | `homebook-worksheets` bucket (us-east-1) |
| **Domain** | `teacher.ninja` + `api.teacher.ninja` |
| **SSL** | Let's Encrypt via Certbot |
| **Nginx** | Reverse proxy for both frontend and API |
| **Process mgmt** | `nohup` (no systemd/pm2 yet) |
| **SSH key** | `~/.ssh/homebook-key.pem` (key name: `homebook-key`) |

### Server Health (as of Feb 6, 2026)

- Disk: 3.9G / 20G used (21%)
- Memory: 406Mi used / 1.9Gi total (1.3Gi available)
- API: healthy, LLM available, word problems + intro pages enabled
- Frontend: healthy, serving on port 3000

---

## CI/CD Status

### Workflows

| Workflow | Trigger | Status | Notes |
|----------|---------|--------|-------|
| **CI** | Push to main | **Passing** | Tests Python + builds frontend + builds Docker |
| **Deploy Frontend** | Push to `apps/web/**` | **Failing** | SSH to EC2 — needs `GENERATOR_API_URL` env on server |
| **Deploy Generator** | Push to `packages/generator/**` | **Failing** | SSH to EC2 — race condition with concurrent deploys |
| **Deploy Simple** | Manual only | N/A | Not triggered automatically |

### GitHub Secrets Configured

| Secret | Set |
|--------|-----|
| `EC2_HOST` | Yes (44.209.209.79) |
| `EC2_SSH_KEY` | Yes (homebook-key.pem) |
| `AWS_ACCESS_KEY_ID` | **No** — not needed for deploy (keys are in .env on EC2) |
| `AWS_SECRET_ACCESS_KEY` | **No** — same |
| `VERCEL_TOKEN` | **No** — not using Vercel |

### Deploy Workflow Issue

The deploy workflows fail intermittently because:
1. `nohup` background processes get killed when the SSH session ends (SIGHUP/SIGTERM)
2. The `set -e` + health check runs before the server fully starts
3. When both frontend and generator deploys trigger simultaneously, `git reset --hard` causes race conditions

**Recommended fix**: Switch to `systemd` services or `pm2` for process management. This would survive SSH disconnects and handle restarts properly.

---

## What Works (Production)

- [x] Subject selection (Math, Chemistry, Biology)
- [x] Topic/subtopic selection with subject-specific filtering
- [x] Fractions generator (7 subtopics)
- [x] Arithmetic generator (6 subtopics)
- [x] Decimals & Percentages generator (12 subtopics)
- [x] Chemistry: balancing equations
- [x] Biology: Mendelian genetics
- [x] Difficulty levels (easy, medium, hard, mixed)
- [x] Configurable problem count (5-30)
- [x] Answer key generation
- [x] Hints
- [x] Worked examples
- [x] Real-time preview (auto-updates on config change, debounced 800ms)
- [x] Sandboxed iframe preview (no style leakage)
- [x] PDF generation via WeasyPrint
- [x] PDF upload to S3 with presigned download URLs
- [x] Descriptive download filenames (e.g., `math-fractions-worksheet.pdf`)
- [x] Personalization (student name, teacher name, date, title)
- [x] Options filtering by subject AND topic (no LCD/GCF for chemistry)
- [x] Word problems support (LLM-powered contexts)
- [x] Intro page generation (LLM-powered)
- [x] Two-tier LLM response caching (memory + file)
- [x] Common Core standards alignment
- [x] Version footer for deployment tracking
- [x] Help modal with usage guide
- [x] API proxied through Next.js routes (no CORS issues)
- [x] SSL on both domains
- [x] CI pipeline passing (Python tests + frontend build + Docker build)

---

## Known Issues & Technical Debt

### High Priority

| # | Issue | Impact |
|---|-------|--------|
| 1 | **Deploy workflows fail** — `nohup` processes killed on SSH disconnect | Auto-deploy broken; manual SSH deploy works |
| 2 | **No process manager** — services don't restart on crash or reboot | Server downtime risk |
| 3 | **No frontend tests** — only backend has test coverage | Regressions possible |

### Medium Priority

| # | Issue | Impact |
|---|-------|--------|
| 4 | Lint warnings in `HelpModal.tsx` (eslint quote escaping) | CI annotations, no functional impact |
| 5 | `node_modules` corruption on EC2 during deploys | Occasional build failures; clean install fixes |
| 6 | No error monitoring (Sentry, etc.) | Errors only visible in `/tmp/*.log` |
| 7 | No rate limiting on frontend API routes | Potential abuse |
| 8 | `.env` file on EC2 is manually managed | Not version controlled, easy to forget updates |

### Low Priority / Enhancements

| # | Item |
|---|------|
| 9 | Only first subtopic is sent to API (`subtopicIds[0]`) — should support multi-subtopic worksheets |
| 10 | No reading/science subjects yet (feature flags exist but disabled) |
| 11 | No user accounts or saved worksheets |
| 12 | No analytics or usage tracking |
| 13 | Docker compose exists but isn't used in production (venv instead) |
| 14 | `RE` empty file in project root (leftover) |

---

## Recommended Next Steps

1. **Fix process management** — Install `pm2` or create `systemd` services so processes survive SSH disconnect and auto-restart on crash/reboot
2. **Fix deploy workflows** — Use `pm2 restart` or `systemctl restart` instead of `nohup`
3. **Multi-subtopic worksheets** — Send all selected subtopics to the API, not just the first
4. **Add frontend tests** — At minimum, test API route handlers
5. **Error monitoring** — Add Sentry or similar
6. **Expand subjects** — Reading, Science (flags already exist)

---

## File Quick Reference

```
.env                              # Local dev env (DO NOT COMMIT — in .gitignore)
~/homebook/.env (on EC2)          # Production env (manually managed)
apps/web/                         # Frontend (Next.js)
packages/generator/               # Backend (Python/FastAPI)
infra/scripts/deploy-generator.sh # Manual deploy script
.github/workflows/ci.yml          # CI: tests + build
.github/workflows/deploy-*.yml    # Auto-deploy (currently broken)
```

---

## Recent Commit History

```
79ec0e0 fix: route API calls through Next.js proxy to avoid CORS
505ac0b feat: real-time preview and UI improvements
3816c1e fix: load .env file with dotenv in generator config
0529a70 fix: make deploy workflows more robust
39bb498 fix: update deploy workflows for EC2 with venv setup
ffb5763 fix: revert frontend deployment back to Vercel
868525d fix: change frontend deployment from Vercel to EC2
6dabc94 fix: escape quotes in HelpModal JSX and update CI package name
e94d994 fix: update libgdk-pixbuf package name for Debian Trixie
a0df566 fix: add pytest-asyncio to requirements.txt
9e8db35 feat: make Help button functional with modal
b475fc8 feat: add version footer to all pages
f028456 fix: use iframe for preview to isolate styles
56d227d fix: filter options by topic, not just subject
fd3ad7e test: add comprehensive tests for generators, cache, and standards
```
