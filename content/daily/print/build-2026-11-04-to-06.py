#!/usr/bin/env python3
"""Build Nov 4–6 duplex letter sheets: math practice and World.

Usage: build-2026-11-04-to-06.py [date ...]   (default: every date below)
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


def pic_ratio(c):
    c.setFillColor(HexColor("#f1f5f9"))
    c.roundRect(LEFT, 520, RIGHT - LEFT, 90, 8, fill=1, stroke=0)
    text(c, LEFT + 12, 592, "Cost of 1:  $12 for 4 notebooks  →  $12 ÷ 4 = $3 each", 10, color=HexColor("#4338ca"))
    text(c, LEFT + 12, 572, "Recipe 2 : 3, with 10 cups of flour  →  10 ÷ 2 = 5 times  →  3 × 5 = 15 cups of water", 10,
         color=HexColor("#b45309"))
    text(c, LEFT + 12, 552, "Split $40 in 3 : 5  →  3 + 5 = 8 parts  →  $40 ÷ 8 = $5  →  $15 and $25", 10,
         color=HexColor("#047857"))
    text(c, LEFT + 12, 532, "Check a split: the two shares add up to the total.", 9.5)


def pic_change(c):
    c.setFillColor(HexColor("#f1f5f9"))
    c.roundRect(LEFT, 520, RIGHT - LEFT, 90, 8, fill=1, stroke=0)
    text(c, LEFT + 12, 592, "Up 25%:  $60  →  25% of $60 = $15  →  $60 + $15 = $75", 10, color=HexColor("#4338ca"))
    text(c, LEFT + 12, 572, "10% off:  $80  →  10% of $80 = $8  →  $80 − $8 = $72", 10, color=HexColor("#b45309"))
    text(c, LEFT + 12, 552, "What percent?  $40 → $50  →  change $10  →  $10 ÷ $40 = 25%", 10, color=HexColor("#047857"))
    text(c, LEFT + 12, 532, "Anchors: 10% = ÷ 10    20% = ÷ 5    25% = ÷ 4    50% = ÷ 2.  Divide by the OLD price.", 9.5)


def pic_chance(c):
    c.setFillColor(HexColor("#f1f5f9"))
    c.roundRect(LEFT, 520, RIGHT - LEFT, 90, 8, fill=1, stroke=0)
    text(c, LEFT + 12, 592, "Bag: 3 red, 7 blue  →  3 out of 10  →  30 out of 100  →  30%", 10, color=HexColor("#4338ca"))
    text(c, LEFT + 12, 572, "Die: 6 sides, 60 rolls  →  60 ÷ 6 = about 10 of each number", 10, color=HexColor("#b45309"))
    text(c, LEFT + 12, 552, "Spinner: 2 of 5 parts red, 50 spins  →  50 ÷ 5 = 10  →  2 × 10 = 20 red", 10,
         color=HexColor("#047857"))
    text(c, LEFT + 12, 532, "Count ALL the outcomes first. \"Expect\" means about.", 9.5)


MATH = {
    "2026-11-04": (
        sheets.Sheet("2026-11-04", 41, "Ratios and unit rates", "ratios",
                     "Cost of 1: divide.  Scale a recipe: how many times, then multiply.  Split: add the parts.", []),
        pic_ratio, 495,
    ),
    "2026-11-05": (
        sheets.Sheet("2026-11-05", 42, "Percent increase and decrease", "percent-change",
                     "Find the change first. Up: add it. Off: subtract it. What percent: change ÷ old.", []),
        pic_change, 495,
    ),
    "2026-11-06": (
        sheets.Sheet("2026-11-06", 43, "Probability — what to expect", "probability",
                     "Chance = wins ÷ total.  Die: rolls ÷ sides.  Spinner: spins ÷ parts × red parts.", []),
        pic_chance, 495,
    ),
}

WORLD = {
    "2026-11-04": (
        "2026-11-04-world-elections.pdf", "WEDNESDAY  •  WORLD  •  ELECTIONS", "Who gets to vote?",
        [("House", "435 seats", "2-year terms; seats shared by population"),
         ("Senate", "100 seats", "2 per state: Wyoming = California"),
         ("President", "538 electoral votes", "270 to win; swing states get the attention"),
         ("Selma", "Alabama, 1965", "marches led to the Voting Rights Act")],
        "Every expansion was fought for",
        ["15th (1870): race  •  19th (1920): women  •  24th (1964): no poll tax  •  26th (1971): age 18",
         "Secret ballot: no boss or landlord can punish you for your vote"],
        [("Electoral votes needed to win", "270"), ("Seats in the House", "435"),
         ("Amendment for women's vote (1920)", "19th"), ("Voting age since 1971", "18"),
         ("A fee to vote was called a", "Poll tax"), ("Length of a House term", "2 years")],
    ),
    "2026-11-05": (
        "2026-11-05-world-climate.pdf", "THURSDAY  •  WORLD  •  CLIMATE", "Who caused it, who pays",
        [("China", "East Asia", "emits the most each year now"),
         ("United States", "North America", "emitted the most in total since 1850"),
         ("Tuvalu", "Pacific islands", "mostly less than 3 m above the sea"),
         ("Pakistan", "South Asia", "2022 floods covered about a third of it")],
        "Climate justice",
        ["Paris 2015: well below 2°C, aim for 1.5°C  •  COP27 2022: loss-and-damage fund",
         "Greta Thunberg's school strike, 2018  •  Solar and wind: cheapest new power"],
        [("Main warming gas", "Carbon dioxide"), ("Most emissions in total", "United States"),
         ("Paris Agreement goal", "Well below 2°C"), ("Year Greta's strike began", "2018"),
         ("Weather is one day; climate is", "The long-term average"), ("Power made without burning fuel", "Solar or wind")],
    ),
    "2026-11-06": (
        "2026-11-06-world-native-nations.pdf", "FRIDAY  •  WORLD  •  NATIVE NATIONS", "Nations, not just history",
        [("Navajo Nation", "AZ, NM, UT", "largest by land; bigger than 10 states"),
         ("Cherokee", "Trail of Tears", "forced west in the 1830s; thousands died"),
         ("Standing Rock", "ND and SD", "2016 pipeline protest: water is life"),
         ("Muscogee", "Oklahoma", "McGirt, 2020: the treaty still holds")],
        "Sovereign: their own governments, laws, and courts",
        ["574 recognized nations  •  about 370 treaties, many broken",
         "Indian Removal Act 1830  •  citizenship for all Native Americans 1924"],
        [("Recognized Native nations", "574"), ("Largest Native nation by land", "Navajo"),
         ("Law behind the Trail of Tears", "Indian Removal Act"), ("Year of the citizenship act", "1924"),
         ("Standing Rock protested a", "Oil pipeline"), ("A written deal between nations", "Treaty")],
    ),
}


def build(date):
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
        print(path)
    if date in WORLD:
        print(last.build_world(*WORLD[date]))


if __name__ == "__main__":
    for d in sys.argv[1:] or sorted(set(MATH) | set(WORLD)):
        build(d)
