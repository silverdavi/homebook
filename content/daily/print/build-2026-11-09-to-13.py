#!/usr/bin/env python3
"""Build Nov 9–13 duplex letter sheets: math practice and World.

Usage: build-2026-11-09-to-13.py [date ...]   (default: every date below)
Practice problems come from the generated JSON (random_days.py), never by hand.
"""

import importlib.util
import json
import sys
from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

HERE = Path(__file__).resolve().parent
GENERATED = Path(__file__).resolve().parents[3] / "apps/web/lib/daily/content/generated"


def load(name):
    spec = importlib.util.spec_from_file_location(name.replace("-", "_"), HERE / name)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


last = load("build-2026-10-27-to-30.py")
sheets, text, LEFT, RIGHT = last.sheets, last.text, last.LEFT, last.RIGHT


def examples(*lines):
    def draw(c):
        c.setFillColor(HexColor("#f1f5f9"))
        c.roundRect(LEFT, 520, RIGHT - LEFT, 90, 8, fill=1, stroke=0)
        colors = ["#4338ca", "#b45309", "#047857", "#000000"]
        for i, line in enumerate(lines):
            text(c, LEFT + 12, 592 - 20 * i, line, 10 if i < 3 else 9.5, color=HexColor(colors[i]))
    return draw


MATH = {
    "2026-11-09": (
        sheets.Sheet("2026-11-09", 44, "Volume — how much a box holds", "volume",
                     "Volume = length × width × height.  Missing height = volume ÷ base.", []),
        examples("Box 4 × 3 × 2  →  base 4 × 3 = 12  →  12 × 2 = 24 cm³",
                 "Cube with 5 cm sides  →  5 × 5 × 5 = 125 cm³",
                 "60 cm³, base 5 × 3  →  base 15  →  60 ÷ 15 = 4 cm tall",
                 "cm³ = cubes 1 cm on each side.  1 cm³ of water = 1 mL."),
        495,
    ),
    "2026-11-10": (
        sheets.Sheet("2026-11-10", 45, "One-step equations — undo it", "equations",
                     "Do the opposite to BOTH sides:  + ↔ −   × ↔ ÷.  Check by putting x back in.", []),
        examples("x + 4 = 10  →  subtract 4 from both sides  →  x = 6",
                 "x − 3 = 8  →  add 3  →  x = 11          5x = 35  →  divide by 5  →  x = 7",
                 "x ÷ 2 = 9  →  multiply by 2  →  x = 18       6x = 42 tickets  →  x = 7",
                 "Check: 6 + 4 = 10 ✓   Put your answer back in every time."),
        495,
    ),
    "2026-11-12": (
        sheets.Sheet("2026-11-12", 46, "Order of operations", "order-of-operations",
                     "1. Brackets   2. × and ÷, left to right   3. + and −, left to right", []),
        examples("5 + 2 × 3  →  2 × 3 = 6 first  →  5 + 6 = 11   (not 21)",
                 "(5 + 2) × 3  →  brackets first: 7  →  7 × 3 = 21",
                 "4 × 6 − 12 ÷ 3  →  24 and 4  →  24 − 4 = 20",
                 "Tip: underline every × and ÷ part first."),
        495,
    ),
    "2026-11-13": (
        sheets.Sheet("2026-11-13", 47, "Speed, distance, and time", "speed",
                     "Distance = speed × time.   Speed = distance ÷ time.   Time = distance ÷ speed.", []),
        examples("Bus: 50 km/h for 3 h  →  50 × 3 = 150 km",
                 "Train: 240 km in 4 h  →  240 ÷ 4 = 60 km/h",
                 "Car: 180 km at 60 km/h  →  180 ÷ 60 = 3 h",
                 "Triangle: D on top, S and T below. Cover the one you want."),
        495,
    ),
    "2026-11-16": (
        sheets.Sheet("2026-11-16", 48, "Review — the whole week", "review",
                     "Volume: l × w × h.  Equations: undo.  Order: ( ) × ÷ + −.  Speed: D = S × T.", []),
        examples("Volume: 4 × 3 × 2 = 24 cm³     Missing height: 60 ÷ (5 × 3) = 4 cm",
                 "Equation: x − 3 = 8  →  add 3 to both sides  →  x = 11",
                 "Order: 5 + 2 × 3 = 11     Speed: 240 km in 4 h = 60 km/h",
                 "Problems 1–3 volume, 4–6 equations, 7–9 order, 10–12 speed."),
        495,
    ),
}

WORLD = {
    "2026-11-09": (
        "2026-11-09-world-berlin-wall.pdf", "MONDAY  •  WORLD  •  THE BERLIN WALL", "A city cut in two",
        [("Berlin", "Germany", "split by the Wall, 1961–1989"),
         ("East Germany", "Soviet side", "built the Wall to stop people leaving"),
         ("Leipzig", "East Germany", "Monday protests, 1989"),
         ("Soviet Union", "1922–1991", "broke into 15 countries in 1991")],
        "November 9, 1989: the Wall falls",
        ["Cold War (about 1947–1991): US vs. Soviet Union, nuclear and space races",
         "Peaceful protests + a border opened by mistake  •  Germany reunited 1990"],
        [("Year the Wall went up", "1961"), ("Date the Wall fell", "November 9, 1989"),
         ("Years the Wall stood", "28"), ("The Wall was built to stop", "East Germans leaving"),
         ("Countries the Soviet Union split into", "15"), ("Capital of Germany today", "Berlin")],
    ),
    "2026-11-10": (
        "2026-11-10-world-fair-wages.pdf", "TUESDAY  •  WORLD  •  FAIR WAGES", "What is fair pay?",
        [("$7.25", "US federal", "minimum wage, unchanged since 2009"),
         ("New York", "2012", "fast-food workers start the Fight for $15"),
         ("Bangladesh", "Rana Plaza, 2013", "factory collapse: 1,134 workers died"),
         ("Fair Trade", "label", "farmers paid a fair price; no child labor")],
        "Workers together",
        ["Union: workers who bargain together with their employer",
         "Living wage: enough for rent, food, and basics where you live"],
        [("US federal minimum wage", "$7.25"), ("Year it was last raised", "2009"),
         ("Where Rana Plaza collapsed", "Bangladesh"), ("Workers bargaining together", "A union"),
         ("Fight for $15 began in (city)", "New York"), ("Why a fixed wage loses value", "Prices rise (inflation)")],
    ),
    "2026-11-12": (
        "2026-11-12-world-wwi.pdf", "THURSDAY  •  WORLD  •  WORLD WAR I", "The eleventh hour",
        [("Sarajevo", "1914", "the shooting that started the war"),
         ("Western Front", "Belgium, France", "trench warfare for years"),
         ("India", "British colony", "over a million soldiers fought"),
         ("Flanders", "Belgium", "poppies and the poem, 1915")],
        "11 a.m., November 11, 1918: the fighting stops",
        ["About 20 million died  •  Ottoman, Austro-Hungarian, Russian, German empires fell",
         "Veterans Day (1954) honors everyone who served  •  League of Nations formed"],
        [("Years of World War I", "1914–1918"), ("City where it started", "Sarajevo"),
         ("Time the fighting stopped", "11 a.m., Nov 11, 1918"), ("Veterans Day honors", "Everyone who served"),
         ("Flower worn to remember", "Poppy"), ("Group formed to prevent war", "League of Nations")],
    ),
    "2026-11-13": (
        "2026-11-13-world-refugees.pdf", "FRIDAY  •  WORLD  •  REFUGEES", "Why people flee",
        [("Syria", "since 2011", "civil war; Turkey hosts the most Syrians"),
         ("Ukraine", "2022", "invaded; millions fled to Poland and Germany"),
         ("Sudan", "since 2023", "the world's largest displacement crisis"),
         ("Einstein", "1933", "a refugee from Nazi Germany")],
        "Refugee: fled danger and can't safely go back",
        ["1951 Refugee Convention: don't send refugees back to danger",
         "About 123 million forced from home (2024)  •  70% live in countries next door"],
        [("Year of the Refugee Convention", "1951"), ("Protection for someone fleeing", "Asylum"),
         ("Country hosting the most Syrians", "Turkey"), ("Where most refugees live", "Countries next door"),
         ("Famous scientist who was a refugee", "Albert Einstein"), ("People forced from home, 2024", "About 123 million")],
    ),
    "2026-11-16": (
        "2026-11-16-world-review.pdf", "MONDAY  •  WORLD  •  REVIEW", "The week in one page",
        [("Berlin Wall", "1961–1989", "fell to peaceful protests, Nov 9, 1989"),
         ("Fair wages", "$7.25 since 2009", "unions; Fight for $15; Rana Plaza"),
         ("World War I", "1914–1918", "ended 11 a.m., Nov 11, 1918"),
         ("Refugees", "1951 Convention", "no sending people back to danger")],
        "One sentence a day",
        ["Monday: Cold War  •  Tuesday: workers  •  Thursday: Veterans Day  •  Friday: refugees",
         "Say each one out loud before you start the questions"],
        [("Year the Wall fell", "1989"), ("Workers bargaining together", "A union"),
         ("City where WWI started", "Sarajevo"), ("Veterans Day date", "November 11"),
         ("Refugee Convention year", "1951"), ("Where most refugees live", "Countries next door")],
    ),
}


def build(date):
    out = []
    if date in MATH:
        sheet, picture, y = MATH[date]
        drill = json.loads((GENERATED / f"{date}.json").read_text())["practice"]
        sheet.rows = [tuple(p) for p in drill["problems"]]
        guided = {int(n): hint for n, hint in drill["guided"].items()}
        path = HERE / f"{date}-{sheet.slug}.pdf"
        c = canvas.Canvas(str(path), pagesize=letter)
        c.setTitle(f"Day {sheet.day} — {sheet.title}")
        last.practice(c, sheet, picture, y, guided)
        c.showPage()
        sheets.answer_page(c, sheet)
        c.save()
        out.append(path)
    if date in WORLD:
        out.append(last.build_world(*WORLD[date]))
    return out


if __name__ == "__main__":
    for d in sys.argv[1:] or sorted(set(MATH) | set(WORLD)):
        for p in build(d):
            print(p)
