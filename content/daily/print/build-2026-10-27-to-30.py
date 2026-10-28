#!/usr/bin/env python3
"""Build Oct 28–Nov 2 duplex letter sheets: math practice and World."""

import importlib.util
import json
from pathlib import Path

from reportlab.lib.colors import HexColor, black
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

HERE = Path(__file__).resolve().parent


def load(name):
    spec = importlib.util.spec_from_file_location(name.replace("-", "_"), HERE / name)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


sheets = load("build-revised-2026-10-21-to-23.py")
world = load("build-world-2026-10-20-to-23.py")
LEFT, RIGHT, H = sheets.LEFT, sheets.RIGHT, sheets.H
INK = HexColor("#334155")


def text(c, x, y, s, size=10, bold=False, color=black):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold" if bold else "Helvetica", size)
    c.drawString(x, y, s)
    c.setFillColor(black)


def pic_integers(c):
    sheets.number_line(c)
    text(c, LEFT, 558, "Adding a positive: hop RIGHT.   Subtracting, or adding a negative: hop LEFT.", 9.5, color=INK)


def pic_scale(c):
    y, cm = 590, 28.35
    c.setStrokeColor(INK)
    for i in range(11):
        c.line(LEFT + i * cm, y, LEFT + i * cm, y + (10 if i % 5 == 0 else 6))
        if i < 10:
            c.setFillColor(HexColor("#fde68a") if i % 2 == 0 else HexColor("#ffffff"))
            c.rect(LEFT + i * cm, y - 14, cm, 14, fill=1, stroke=1)
    c.setFillColor(black)
    c.setFont("Helvetica", 8)
    for i in (0, 5, 10):
        c.drawCentredString(LEFT + i * cm, y + 13, f"{i} cm")
    tx = LEFT + 10 * cm + 24
    text(c, tx, y + 4, "Scale 1 cm = 10 km", 10, True, HexColor("#b45309"))
    text(c, tx, y - 12, "Map → real: MULTIPLY   (cm × km per cm = km)", 9.5)
    text(c, tx, y - 26, "Real → map: DIVIDE by the scale", 9.5)
    text(c, tx, y - 40, "Find the scale: km ÷ cm", 9.5)


def pic_average(c):
    c.setFillColor(HexColor("#f1f5f9"))
    c.roundRect(LEFT, 540, RIGHT - LEFT, 70, 8, fill=1, stroke=0)
    text(c, LEFT + 12, 590, "Example: 2, 7, 4, 9, 3", 11, True)
    text(c, LEFT + 12, 572, "MEAN = add, then divide:   2 + 7 + 4 + 9 + 3 = 25,   25 ÷ 5 = 5", 10, color=HexColor("#4338ca"))
    text(c, LEFT + 12, 554, "MEDIAN = put in order, take the middle:   2, 3, 4, 7, 9  →  4", 10, color=HexColor("#047857"))


def pic_coords(c):
    g, ox, oy = 12, LEFT + 70, 540
    c.setStrokeColor(HexColor("#cbd5e1"))
    c.setLineWidth(0.5)
    for i in range(-5, 6):
        c.line(ox + i * g, oy - 5 * g, ox + i * g, oy + 5 * g)
        c.line(ox - 5 * g, oy + i * g, ox + 5 * g, oy + i * g)
    c.setStrokeColor(INK)
    c.setLineWidth(1.4)
    c.line(ox - 5.5 * g, oy, ox + 5.5 * g, oy)
    c.line(ox, oy - 5.5 * g, ox, oy + 5.5 * g)
    c.setFont("Helvetica", 6.5)
    for i in (-4, -2, 2, 4):
        c.drawCentredString(ox + i * g, oy - 9, str(i).replace("-", "−"))
        c.drawRightString(ox - 3, oy + i * g - 2, str(i).replace("-", "−"))
    for name, qx, qy in (("II", -2.5, 2.5), ("I", 2.5, 2.5), ("III", -2.5, -2.5), ("IV", 2.5, -2.5)):
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(HexColor("#94a3b8"))
        c.drawCentredString(ox + qx * g, oy + qy * g - 3, name)
    tx = ox + 6 * g + 30
    text(c, tx, oy + 44, "(x, y): ACROSS first, then UP or DOWN.", 10.5, True, HexColor("#b45309"))
    text(c, tx, oy + 26, "I (+, +)    II (−, +)    III (−, −)    IV (+, −)", 10)
    text(c, tx, oy + 8, "Move left/right: only x changes. Up/down: only y.", 9.5)
    text(c, tx, oy - 10, "Plot here: (3, 2), (−4, −3), (−2, 5), (5, −1).", 9.5, color=INK)


def practice(c, sheet, picture, y, guided):
    sheets.header(c, sheet, "TEACH + PRACTICE")
    c.setFillColor(HexColor("#eef2ff"))
    c.roundRect(LEFT, H - 130, RIGHT - LEFT, 32, 6, fill=1, stroke=0)
    text(c, LEFT + 10, H - 118, sheet.rule, 11, True)
    picture(c)
    for index, (prompt, _answer) in enumerate(sheet.rows, start=1):
        if index == 7:
            y -= 6
            c.setStrokeColor(HexColor("#cbd5e1"))
            c.setLineWidth(0.8)
            c.line(LEFT, y, RIGHT, y)
            y -= 20
        text(c, LEFT, y, f"{index}. {prompt}")
        if index in guided:
            text(c, LEFT + 250, y, "GUIDED", 8, True, HexColor("#047857"))
            text(c, LEFT + 292, y, guided[index], 10, color=HexColor("#047857"))
        c.setStrokeColor(HexColor("#94a3b8"))
        c.setLineWidth(0.8)
        c.line(RIGHT - 70, y - 2, RIGHT, y - 2)
        y -= 26
    c.setFont("Helvetica-Oblique", 8.5)
    c.setFillColor(HexColor("#475569"))
    c.drawString(LEFT, 28, "Keep the answer side face down. The online exam uses only these taught forms.")


MATH = [
    (
        sheets.Sheet("2026-10-28", 37, "Integers — moving through zero", "integers",
            "Right is bigger, left is smaller. Keep the minus sign with its number.",
            [("−2 + 7", "5"), ("4 − 9", "−5"), ("−5 + 3", "−2"), ("−3 − 6", "−9"),
             ("7 + (−10)", "−3"), ("−9 + 15", "6"), ("1 − 8", "−7"), ("−11 + 4", "−7"),
             ("−6 − 7", "−13"), ("Start −5°F; rise 8°", "3°F"), ("Start 6°F; fall 9°", "−3°F"),
             ("Start −7°F; rise 2°", "−5°F")]),
        pic_integers, 535,
        {1: "start −2, hop 7 right: ____", 2: "start 4, hop 9 left: ____",
         10: "−5 + 8 = ____ °F", 11: "6 − 9 = ____ °F"},
    ),
    (
        sheets.Sheet("2026-10-29", 38, "Map scale — shrinking the world", "map-scale",
            "Map → real: multiply.  Real → map: divide by the scale.  Scale: km ÷ cm.",
            [("1 cm = 10 km. 4 cm on the map. Real?", "40 km"), ("1 cm = 5 km. 9 cm on the map. Real?", "45 km"),
             ("1 cm = 25 km. 2 cm on the map. Real?", "50 km"), ("1 cm = 50 km. 3 cm on the map. Real?", "150 km"),
             ("1 cm = 10 km. Real 60 km. Map?", "6 cm"), ("1 cm = 5 km. Real 45 km. Map?", "9 cm"),
             ("1 cm = 25 km. Real 125 km. Map?", "5 cm"), ("1 cm = 50 km. Real 400 km. Map?", "8 cm"),
             ("3 cm stands for 30 km. 1 cm = ?", "10 km per cm"), ("5 cm stands for 100 km. 1 cm = ?", "20 km per cm"),
             ("6 cm stands for 150 km. 1 cm = ?", "25 km per cm"), ("4 cm stands for 200 km. 1 cm = ?", "50 km per cm")]),
        pic_scale, 520,
        {1: "4 cm × 10 km per cm = ____ km", 5: "60 km ÷ 10 km per cm = ____ cm",
         9: "30 km ÷ 3 cm = ____ km per cm", 10: "100 km ÷ 5 cm = ____ km per cm"},
    ),
    (
        sheets.Sheet("2026-10-30", 39, "Mean and median — two averages", "mean-median",
            "Mean: add, then divide by how many.  Median: put in order, take the middle.",
            [("Mean of 2, 4, 6", "4"), ("Mean of 5, 10, 15, 30", "15"), ("Mean of 1, 3, 5, 7, 9", "5"),
             ("Mean of 8, 12, 10", "10"), ("Mean of 6, 9, 3, 6", "6"), ("Mean of 10, 20, 30, 40, 50", "30"),
             ("Median of 7, 3, 5", "5"), ("Median of 9, 1, 7, 3, 5", "5"), ("Median of 12, 18, 15", "15"),
             ("Median of 4, 20, 6, 8, 10", "8"), ("Median of 30, 10, 25, 15, 20", "20"),
             ("Median of 2, 100, 3, 5, 4", "4")]),
        pic_average, 510,
        {1: "2 + 4 + 6 = ____;  ÷ 3 = ____", 2: "sum = ____;  ÷ 4 = ____",
         7: "in order: ___, ___, ___", 8: "in order: __, __, __, __, __"},
    ),
    (
        sheets.Sheet("2026-11-02", 40, "Coordinates — find any point", "coordinates",
            "(x, y): across first, then up or down. Signs tell the quadrant.",
            [("Quadrant of (2, 5)", "1"), ("Quadrant of (−3, 4)", "2"), ("Quadrant of (−1, −6)", "3"),
             ("Quadrant of (4, −2)", "4"), ("Start (1, 2), move 4 left. New x?", "−3"),
             ("Start (−2, −1), move 5 up. New y?", "4"), ("Start (3, 2), move 6 down. New y?", "−4"),
             ("Start (−5, 3), move 7 right. New x?", "2"), ("Distance (−3, 1) to (4, 1)", "7 units"),
             ("Distance (−5, −2) to (−1, −2)", "4 units"), ("Distance (2, −3) to (2, 4)", "7 units"),
             ("Distance (−4, 3) to (2, 3)", "6 units")]),
        pic_coords, 455,
        {1: "signs (+, +) → quadrant ____", 5: "1 − 4 = ____",
         9: "−3 to 0 is 3; 0 to 4 is 4: ____", 10: "count −5 to −1: ____"},
    ),
]

GENERATED = Path(__file__).resolve().parents[3] / "apps/web/lib/daily/content/generated"
for k, (sheet, pic, top, guided) in enumerate(MATH):
    gen = GENERATED / f"{sheet.date}.json"
    if gen.exists():
        drill = json.loads(gen.read_text())["practice"]
        sheet.rows = [tuple(p) for p in drill["problems"]]
        MATH[k] = (sheet, pic, top, {int(n): hint for n, hint in drill["guided"].items()})


WORLD = [
    ("2026-10-28-world-water.pdf", "WEDNESDAY  •  WORLD  •  WATER", "Who controls the water?",
     [("Nile", "Africa", "longest river in Africa; Ethiopia → Sudan → Egypt"),
      ("Amazon", "South America", "carries the most water of any river"),
      ("Mekong", "Southeast Asia", "6 countries depend on it"),
      ("Aral Sea", "Central Asia", "shrank to about 1/10 after cotton farming")],
     "Water is life (Mni Wiconi)",
     ["Clean water is a human right (UN, 2010)  •  Flint, Michigan, 2014: lead in the water",
      "Upstream countries can hold back water that downstream countries need"],
     [("Longest river in Africa", "Nile"), ("River carrying the most water", "Amazon"),
      ("Share of Earth's water that is fresh", "About 3%"), ("Land that drains into one river", "Watershed"),
      ("US city with lead in its water, 2014", "Flint, Michigan"), ("What the UN called water in 2010", "A human right")]),
    ("2026-10-29-world-maps.pdf", "THURSDAY  •  WORLD  •  MAPS", "Every flat map distorts",
     [("Greenland", "North Atlantic", "looks as big as Africa on Mercator"),
      ("Africa", "2nd-largest continent", "14× Greenland; fits US + China + India"),
      ("Pacific", "Ocean", "the largest ocean, bigger than all land"),
      ("Asia", "Continent", "the largest continent")],
     "You can't flatten an orange peel",
     ["Mercator (1569): true compass directions for sailors, wrong sizes",
      "Equal-area (Gall–Peters, 1970s): true sizes, stretched shapes"],
     [("Year of Mercator's map", "1569"), ("Mercator's map was made for", "Sailors"),
      ("How many times bigger Africa is than Greenland", "About 14"), ("Equal-area maps keep correct", "Relative sizes"),
      ("Largest ocean", "Pacific"), ("Number of continents usually counted", "7")]),
    ("2026-10-30-world-cities.pdf", "FRIDAY  •  WORLD  •  CITIES", "Cities and fair work",
     [("India", "South Asia", "most people since 2023 (over 1.4 billion)"),
      ("China", "East Asia", "over 1.4 billion; largest until 2023"),
      ("Lagos", "Nigeria", "Afrobeats, Nollywood, fast-growing"),
      ("Kinshasa", "DR Congo", "largest French-speaking city")],
     "What workers won",
     ["The 8-hour day  •  the weekend  •  limits on child labor",
      "Triangle Shirtwaist fire, New York, 1911: 146 died → new safety laws"],
     [("Most populous country", "India"), ("Where the Industrial Revolution began", "Britain"),
      ("Year world population reached 8 billion", "2022"), ("Share of people living in cities", "More than half"),
      ("What the Triangle fire led to", "Safety laws"), ("Better for typical income: mean or median?", "Median")]),
    ("2026-11-02-world-latitude.pdf", "MONDAY  •  WORLD  •  LATITUDE AND TIME", "A grid on a globe",
     [("Equator", "0° latitude", "halfway between the poles"),
      ("Prime Meridian", "0° longitude", "Greenwich, London, chosen 1884"),
      ("Date Line", "about 180°", "where the calendar date changes"),
      ("China", "East Asia", "1 official time zone across about 5")],
     "Time-zone math",
     ["Earth turns 360° in 24 hours:  360 ÷ 24 = 15° per hour",
      "Railroads pushed standard time zones (United States, 1883)"],
     [("0° latitude", "Equator"), ("City on the Prime Meridian", "London (Greenwich)"),
      ("Width of one time zone", "15°"), ("Latitude measures", "North or south of equator"),
      ("Australia's hemisphere", "Southern"), ("China's official time zones", "1")]),
]


def build_world(name, label, title, cards, box_title, box_lines, rows):
    path = HERE / name
    c = canvas.Canvas(str(path), pagesize=letter)
    world.header(c, label, title)
    y = 675
    for place, region, fact in cards:
        text(c, LEFT, y, place, 13, True)
        text(c, LEFT + 110, y, region, 9)
        text(c, LEFT + 235, y, fact, 9)
        y -= 39
    c.setFillColor(HexColor("#eff6ff"))
    c.roundRect(LEFT, y - 63, RIGHT - LEFT, 78, 8, fill=1, stroke=0)
    text(c, LEFT + 12, y - 5, box_title, 10, True)
    for i, line in enumerate(box_lines):
        text(c, LEFT + 12, y - 23 - 16 * i, line, 9)
    world.questions(c, y - 105, [p for p, _ in rows])
    c.showPage()
    world.answers(c, label, title, rows)
    c.save()
    return path


def main():
    for sheet, picture, y, guided in MATH:
        path = HERE / f"{sheet.date}-{sheet.slug}.pdf"
        c = canvas.Canvas(str(path), pagesize=letter)
        c.setTitle(f"Day {sheet.day} — {sheet.title}")
        practice(c, sheet, picture, y, guided)
        c.showPage()
        sheets.answer_page(c, sheet)
        c.save()
        print(path)
    for spec in WORLD:
        print(build_world(*spec))


if __name__ == "__main__":
    main()
