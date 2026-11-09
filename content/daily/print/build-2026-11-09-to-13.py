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
