"""Generate every random number for a day's exam and practice sheet with code.

Usage: python3 random_days.py 2026-10-29 [2026-10-30 ...]

Numbers, answer-option order, and practice problems all come from Python's
random module seeded from the OS (secrets). The seed is saved in the output so
a day can be regenerated exactly. Writes apps/web/lib/daily/content/generated/<date>.json.
Never regenerate a day that already has submissions: stored answers are option indices.
"""

import json
import math
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


# ---------- ratios and unit rates ----------
def ratio_set(rng):
    unit = []
    for count in rng.sample(range(2, 10), 4):
        unit.append([count * rng.randint(2, 12), count])
    equivalent = []
    for _ in range(4):
        a, b = rng.sample(range(1, 10), 2)
        equivalent.append([a, b, a * rng.randint(2, 9)])
    share = []
    for _ in range(4):
        a, b = rng.sample(range(1, 8), 2)
        share.append([(a + b) * rng.randint(2, 12), a, b])
    return {"unit": unit, "equivalent": equivalent, "share": share}


def ratio_practice(rng):
    v = ratio_set(rng)
    problems = (
        [(f"${total} for {count}. Cost of 1?", f"${total // count}") for total, count in v["unit"]]
        + [(f"{a} : {b} = {c} : ?", str(b * c // a)) for a, b, c in v["equivalent"]]
        + [(f"Split {t} in the ratio {a} : {b}. Bigger part?", str(t // (a + b) * max(a, b))) for t, a, b in v["share"]]
    )
    (t1, n1), (a5, b5, c5) = v["unit"][0], v["equivalent"][0]
    (t9, a9, b9), (t10, a10, b10) = v["share"][0], v["share"][1]
    guided = {
        1: f"${t1} ÷ {n1} = $____",
        5: f"{c5} ÷ {a5} = __ times;  {b5} × __ = __",
        9: f"{a9} + {b9} = __ parts;  {t9} ÷ __ = __",
        10: f"{a10} + {b10} = __ parts;  {t10} ÷ __ = __",
    }
    return problems, guided


# ---------- percent increase and decrease ----------
PERCENTS = [10, 20, 25, 50]


def change_set(rng):
    def price(p):
        step = 100 // math.gcd(100, p)
        return step * rng.randint(2, 200 // step)

    up = [[price(p), p] for p in rng.sample(PERCENTS, 4)]
    down = [[price(p), p] for p in rng.sample(PERCENTS, 4)]
    find = []
    for p in rng.sample(PERCENTS, 4):
        old = price(p)
        new = old + old * p // 100 if rng.random() < 0.5 else old - old * p // 100
        find.append([old, new])
    return {"up": up, "down": down, "find": find}


def change_practice(rng):
    v = change_set(rng)
    problems = (
        [(f"${old} goes up {p}%. New price?", f"${old + old * p // 100}") for old, p in v["up"]]
        + [(f"${old}, {p}% off. Sale price?", f"${old - old * p // 100}") for old, p in v["down"]]
        + [(f"${old} → ${new}. Percent change?", f"{abs(new - old) * 100 // old}% {'up' if new > old else 'down'}")
           for old, new in v["find"]]
    )
    (o1, p1), (o5, p5) = v["up"][0], v["down"][0]
    (o9, n9), (o10, n10) = v["find"][0], v["find"][1]
    guided = {
        1: f"{p1}% of ${o1} = __;  + ${o1} = __",
        5: f"{p5}% of ${o5} = __;  ${o5} − __ = __",
        9: f"change ${abs(n9 - o9)};  {abs(n9 - o9)} ÷ {o9} = __%",
        10: f"change $__;  __ ÷ {o10} = __%",
    }
    return problems, guided


# ---------- probability ----------
def probability_set(rng):
    bag = []
    for total in rng.sample([4, 5, 10, 20, 25, 50], 4):
        red = rng.randint(1, total - 1)
        bag.append([red, total - red])
    expect = []
    for sides in rng.sample([2, 4, 5, 6, 8, 10], 4):
        expect.append([sides, sides * rng.randint(3, 12)])
    spinner = []
    for parts in rng.sample([4, 5, 8, 10], 4):
        red = rng.randint(1, parts - 1)
        spinner.append([red, parts, parts * rng.randint(2, 10)])
    return {"bag": bag, "expect": expect, "spinner": spinner}


def probability_practice(rng):
    v = probability_set(rng)
    problems = (
        [(f"{r} red, {b} blue. % chance of red?", f"{r * 100 // (r + b)}%") for r, b in v["bag"]]
        + [(f"{sides}-sided die, {n} rolls. How many 1s?", str(n // sides)) for sides, n in v["expect"]]
        + [(f"Spinner, {r} of {parts} parts red. {n} spins. Red?", str(n * r // parts))
           for r, parts, n in v["spinner"]]
    )
    (r1, b1), (s5, n5) = v["bag"][0], v["expect"][0]
    (r9, p9, n9), (r10, p10, n10) = v["spinner"][0], v["spinner"][1]
    guided = {
        1: f"{r1} out of {r1 + b1} = __ out of 100",
        5: f"{n5} ÷ {s5} = __",
        9: f"{n9} ÷ {p9} = __;  × {r9} = __",
        10: f"{n10} ÷ {p10} = __;  × {r10} = __",
    }
    return problems, guided


KINDS = {
    "2026-10-29": (scale_set, scale_practice),
    "2026-10-30": (average_set, average_practice),
    "2026-11-02": (coordinate_set, coordinate_practice),
    "2026-11-04": (ratio_set, ratio_practice),
    "2026-11-05": (change_set, change_practice),
    "2026-11-06": (probability_set, probability_practice),
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
