# Game Difficulty Tuning Tables

## Design Principles
- **Easy**: Achievable by grade 3-4 students. High success rate (~85-90%). Builds confidence.
- **Medium**: Grade 5-7. Success rate ~65-75%. Challenging but fair.
- **Hard**: Grade 8+. Success rate ~40-55%. Requires mastery.
- **Progressive**: Within a session, difficulty ramps per streak/level to maintain flow state.
- **Wrong answers cost less than right answers gain** — keep players motivated.

---

## 1. Letter Rain 🌧️

| Parameter | Easy | Medium | Hard |
|-----------|------|--------|------|
| Fall speed (px/frame) | 0.5 | 0.8 | 1.1 |
| Speed increment/level | +0.06 | +0.08 | +0.10 |
| Spawn interval (ms) | 1400 | 1000 | 700 |
| Min spawn interval | 600 | 400 | 300 |
| Sentence length (words) | 3-5 | 5-8 | 8-14 |
| Reading time | 2.5s + 25ms/char | same | same |
| Lives | 5 | 5 | 5 |
| Combo threshold for bonus | 5 | 5 | 5 |

**Simulation**: At easy, ~25 letters in a typical sentence. At 1400ms spawn + 0.5 speed,
letters take ~8s to reach ground. Player has ample time to read and click.
At hard, spawn every 700ms + 1.1 speed = ~3.5s to react. Demands fast pattern recognition.

---

## 2. Math Blitz ⚡

| Parameter | Difficulty 1-3 | Difficulty 4-7 | Difficulty 8-12 | Difficulty 13+ |
|-----------|---------------|----------------|-----------------|----------------|
| Operations | +, − | +, −, × | +, −, ×, ÷ | All |
| Add/Sub range | 1-25 | 1-35 | 1-60 | 1-100 |
| Multiply range | 2-5 | 2-7 | 2-10 | 2-12 |
| Divide range | 2-5 | 2-7 | 2-10 | 2-12 |
| Wrong choice offset | ±1-5 | ±1-7 | ±1-10 | ±1-15 |
| Time | 60s | 60s | 60s | 60s |

**Simulation**: Average student solves easy add/sub in ~3s. In 60s = ~20 problems.
At difficulty 8+, multiply/divide 2-10 takes ~5s = ~12 problems.
Scoring: 10pts base × combo multiplier. Expected scores: Easy ~150-250, Expert ~400-600.

---

## 3. Fraction Fighter ⚔️

| Parameter | Level 1-3 | Level 4-7 | Level 8-12 | Level 13+ |
|-----------|-----------|-----------|------------|-----------|
| Max denominator | 6 | 10 | 16 | 20 |
| Timer per question | 5s | 4s | 3.5s | 3s |
| Lives | 5 | 5 | 5 | 5 |
| Min difference | 0.1+ | 0.05+ | 0.02+ | Any |

**Simulation**: Comparing 1/3 vs 1/2 (easy, big difference) — instant.
Comparing 5/12 vs 3/8 (hard, need cross-multiply) — 3-5s for practiced student.
At level 13+ with 3s timer, only students with strong fraction sense survive.

---

## 4. Element Match 🧪

| Grid | Pairs | Difficulty | Expected Time | Expected Moves |
|------|-------|------------|---------------|----------------|
| 4×2 | 4 | Easy | 20-40s | 8-16 |
| 4×3 | 6 | Medium | 40-80s | 15-30 |
| 4×4 | 8 | Hard | 60-120s | 20-45 |
| 5×4 | 10 | Expert | 90-180s | 30-60 |

**Element pools by difficulty**:
- Easy: Common elements (H, O, C, N, Fe, Au, Ag, Cu)
- Hard: Include tricky symbols (Na/Sodium, K/Potassium, Fe/Iron, W/Tungsten, Hg/Mercury)

---

## 5. Word Builder 🔤

| Parameter | Word 1-5 | Word 6-10 | Word 11-15 | Word 16+ |
|-----------|----------|-----------|------------|----------|
| Word length | 3-4 chars | 4-5 chars | 5-6 chars | 6-8 chars |
| Points (no hint) | 10 | 10 | 15 | 20 |
| Points (with hint) | 5 | 5 | 8 | 10 |
| Skips available | 3 | 3 | 3 | 3 |

**Word difficulty is inherent in length + obscurity**. Short common words (ATOM, CELL)
are easy; long uncommon words (CATALYST, MOMENTUM) are hard.
