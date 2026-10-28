"""Generate every random number for a day's exam and practice sheet with code.

Usage: python3 random_days.py 2026-10-29 [2026-10-30 ...]

Numbers, answer-option order, and practice problems all come from Python's
random module seeded from the OS (secrets). The seed is saved in the output so
a day can be regenerated exactly. Writes apps/web/lib/daily/content/generated/<date>.json.
Never regenerate a day that already has submissions: stored answers are option indices.
"""

import json
import re
import secrets
import sys
from pathlib import Path
from random import Random

ROOT = Path(__file__).resolve().parents[3]
CONTENT = ROOT / "apps/web/lib/daily/content"
OUT = CONTENT / "generated"

MINUS = "−"


def signed(n):
    return f"{MINUS}{abs(n)}" if n < 0 else str(n)


def point(x, y):
    return f"({signed(x)}, {signed(y)})"


# ---------- map scale ----------
SCALES = [2, 3, 4, 5, 10, 20, 25, 50, 100]


def scale_set(rng):
    scales = rng.sample(SCALES, 4) + rng.sample(SCALES, 4) + rng.sample(SCALES, 4)
    cms = [rng.randint(2, 12) for _ in range(12)]
    pairs = list(zip(cms, scales))
    return {
        "toReal": [[cm, s] for cm, s in pairs[0:4]],
        "toMap": [[cm * s, s] for cm, s in pairs[4:8]],
        "findScale": [[cm, cm * s] for cm, s in pairs[8:12]],
    }


def scale_practice(rng):
    v = scale_set(rng)
    problems = (
        [(f"1 cm = {s} km. {cm} cm on the map. Real?", f"{cm * s} km") for cm, s in v["toReal"]]
        + [(f"1 cm = {s} km. Real {km} km. Map?", f"{km // s} cm") for km, s in v["toMap"]]
        + [(f"{cm} cm stands for {km} km. 1 cm = ?", f"{km // cm} km per cm") for cm, km in v["findScale"]]
    )
    (cm1, s1), (km5, s5) = v["toReal"][0], v["toMap"][0]
    (c9, k9), (c10, k10) = v["findScale"][0], v["findScale"][1]
    guided = {
        1: f"{cm1} cm × {s1} km per cm = ____ km",
        5: f"{km5} km ÷ {s5} km per cm = ____ cm",
        9: f"{k9} km ÷ {c9} cm = ____ km per cm",
        10: f"{k10} km ÷ {c10} cm = ____ km per cm",
    }
    return problems, guided


# ---------- mean and median ----------
def mean_list(rng):
    n = rng.choice([3, 4, 5])
    values = [rng.randint(1, 60) for _ in range(n)]
    r = sum(values) % n
    if r:
        values[-1] += (n - r) if values[-1] - r < 1 else -r
    return values


def median_list(rng):
    n = rng.choice([3, 5, 7])
    while True:
        values = rng.sample(range(1, 100), n)
        if values != sorted(values):
            return values


def average_set(rng):
    return {
        "mean": [mean_list(rng) for _ in range(6)],
        "median": [median_list(rng) for _ in range(6)],
    }


def average_practice(rng):
    v = average_set(rng)
    join = ", ".join
    problems = [(f"Mean of {join(map(str, m))}", str(sum(m) // len(m))) for m in v["mean"]] + [
        (f"Median of {join(map(str, m))}", str(sorted(m)[len(m) // 2])) for m in v["median"]
    ]
    m1, m2 = v["mean"][0], v["mean"][1]
    d1, d2 = v["median"][0], v["median"][1]
    guided = {
        1: f"{' + '.join(map(str, m1))} = ____;  ÷ {len(m1)} = ____",
        2: f"sum = ____;  ÷ {len(m2)} = ____",
        7: "in order: " + ", ".join(["__"] * len(d1)),
        8: "in order: " + ", ".join(["__"] * len(d2)),
    }
    return problems, guided


# ---------- coordinates ----------
def nonzero(rng):
    return rng.choice([i for i in range(-9, 10) if i])


def coordinate_set(rng):
    quadrant = [[nonzero(rng), nonzero(rng)] for _ in range(4)]
    move = [
        [rng.randint(-9, 9), rng.randint(-9, 9), rng.randint(1, 12), rng.choice(["left", "right", "up", "down"])]
        for _ in range(4)
    ]
    distance = []
    for _ in range(4):
        shared = rng.randint(-9, 9)
        a, b = rng.sample(range(-9, 10), 2)
        distance.append([[a, shared], [b, shared]] if rng.random() < 0.5 else [[shared, a], [shared, b]])
    return {"quadrant": quadrant, "move": move, "distance": distance}


def quadrant_of(x, y):
    return 1 if x > 0 and y > 0 else 2 if x < 0 < y else 3 if x < 0 and y < 0 else 4


def coordinate_practice(rng):
    v = coordinate_set(rng)
    problems = [(f"Quadrant of {point(x, y)}", str(quadrant_of(x, y))) for x, y in v["quadrant"]]
    for x, y, steps, d in v["move"]:
        axis = "x" if d in ("left", "right") else "y"
        start = x if axis == "x" else y
        new = start + (steps if d in ("right", "up") else -steps)
        problems.append((f"Start {point(x, y)}, move {steps} {d}. New {axis}?", signed(new)))
    for a, b in v["distance"]:
        problems.append((f"Distance {point(*a)} to {point(*b)}", f"{abs(a[0] - b[0]) + abs(a[1] - b[1])} units"))
    qx, qy = v["quadrant"][0]
    mx, my, ms, md = v["move"][0]
    mstart = mx if md in ("left", "right") else my
    sign = "+" if md in ("right", "up") else MINUS
    (a1, b1), (a2, b2) = v["distance"][0], v["distance"][1]

    def gap(a, b):
        i = 0 if a[1] == b[1] else 1
        return f"count from {signed(a[i])} to {signed(b[i])}: ____"

    guided = {
        1: f"signs ({'+' if qx > 0 else MINUS}, {'+' if qy > 0 else MINUS}) → quadrant ____",
        5: f"{signed(mstart)} {sign} {ms} = ____",
        9: gap(a1, b1),
        10: gap(a2, b2),
    }
    return problems, guided


KINDS = {
    "2026-10-29": (scale_set, scale_practice),
    "2026-10-30": (average_set, average_practice),
    "2026-11-02": (coordinate_set, coordinate_practice),
}


def choice_ids(date):
    source = (CONTENT / f"day-{date}.ts").read_text()
    return re.findall(r'choiceQ\(\s*"([ab]-[a-z0-9]+)"', source)


def fair_order(rng, ids):
    """Shuffle options until no letter is correct more than 3 times per version
    and no letter is correct 3 times in a row, so true randomness can't look rigged."""
    while True:
        order = {qid: rng.sample(range(4), 4) for qid in ids}
        ok = True
        for version in ("a-", "b-"):
            letters = [order[q].index(0) for q in ids if q.startswith(version)]
            if any(letters.count(k) > 3 for k in range(4)):
                ok = False
            if any(letters[i] == letters[i + 1] == letters[i + 2] for i in range(len(letters) - 2)):
                ok = False
        if ok:
            return order


def generate(date):
    seed = secrets.randbits(64)
    rng = Random(seed)
    exam_set, practice = KINDS[date]
    problems, guided = practice(rng)
    data = {
        "date": date,
        "generator": "content/daily/generate/random_days.py",
        "seed": seed,
        "a": exam_set(rng),
        "b": exam_set(rng),
        "order": fair_order(rng, choice_ids(date)),
        "practice": {"problems": problems, "guided": guided},
    }
    OUT.mkdir(exist_ok=True)
    path = OUT / f"{date}.json"
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print(path.relative_to(ROOT), "seed", seed)


if __name__ == "__main__":
    for d in sys.argv[1:]:
        generate(d)
