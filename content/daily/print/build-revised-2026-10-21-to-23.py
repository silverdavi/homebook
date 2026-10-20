#!/usr/bin/env python3
"""Build revised duplex letter worksheets for Oct 21–23."""

from dataclasses import dataclass
from pathlib import Path

from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

OUT = Path(__file__).resolve().parent
W, H = letter
LEFT = 48
RIGHT = W - 48


@dataclass
class Sheet:
    date: str
    day: int
    title: str
    slug: str
    rule: str
    rows: list[tuple[str, str]]


def header(c, sheet: Sheet, side: str):
    c.setFillColor(HexColor("#172554"))
    c.rect(0, H - 78, W, 78, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(LEFT, H - 28, f"DAY {sheet.day}  •  {side}")
    c.setFont("Helvetica-Bold", 21)
    c.drawString(LEFT, H - 56, sheet.title)
    c.setFillColor(black)


def geometry_picture(c):
    x, y, cell = LEFT, 505, 42
    c.setFillColor(HexColor("#eef2ff"))
    for row in range(3):
        for col in range(4):
            c.rect(x + col * cell, y + row * cell, cell, cell, fill=1, stroke=1)
    c.setStrokeColor(HexColor("#f59e0b"))
    c.setLineWidth(5)
    c.rect(x, y, 4 * cell, 3 * cell, fill=0, stroke=1)
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(x, y - 20, "4 columns × 3 rows = 12 square units inside")
    c.drawString(x + 205, y + 106, "Outside edge:")
    c.setFont("Helvetica", 10)
    c.drawString(x + 205, y + 88, "4 + 3 + 4 + 3 = 14 units")
    c.drawString(x + 205, y + 58, "Perimeter = around")
    c.drawString(x + 205, y + 40, "Area = inside")


def number_line(c):
    y = 600
    c.setStrokeColor(HexColor("#334155"))
    c.setLineWidth(1.5)
    c.line(LEFT, y, RIGHT, y)
    for value in range(-10, 11):
        x = LEFT + (RIGHT - LEFT) * (value + 10) / 20
        c.line(x, y - 5, x, y + 5)
        if value % 2 == 0:
            c.setFont("Helvetica", 7)
            c.drawCentredString(x, y - 17, str(value))
    c.setFont("Helvetica-Bold", 9)
    c.drawString(LEFT, y + 16, "LEFT = smaller")
    c.drawRightString(RIGHT, y + 16, "RIGHT = larger")


def practice_page(c, sheet: Sheet):
    header(c, sheet, "TEACH + PRACTICE")
    c.setFillColor(HexColor("#eef2ff"))
    c.roundRect(LEFT, H - 130, RIGHT - LEFT, 32, 6, fill=1, stroke=0)
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(LEFT + 10, H - 118, sheet.rule)

    if sheet.slug == "area-perimeter":
        geometry_picture(c)
        y = 475
    elif sheet.slug == "integers":
        number_line(c)
        y = 555
    else:
        y = H - 158

    c.setFont("Helvetica", 10)
    for index, (prompt, _answer) in enumerate(sheet.rows, start=1):
        if index == 7:
            y -= 10
            c.setStrokeColor(HexColor("#cbd5e1"))
            c.line(LEFT, y, RIGHT, y)
            y -= 23
        c.drawString(LEFT, y, f"{index}. {prompt}")
        c.setStrokeColor(HexColor("#94a3b8"))
        c.line(RIGHT - 120, y - 2, RIGHT, y - 2)
        y -= 29

    c.setFont("Helvetica-Oblique", 8.5)
    c.setFillColor(HexColor("#475569"))
    c.drawString(LEFT, 28, "Keep the answer side face down. The online exam uses only these taught forms.")


def answer_page(c, sheet: Sheet):
    header(c, sheet, "CHECK + CORRECT")
    y = H - 112
    c.setFont("Helvetica", 10)
    for index, (prompt, answer) in enumerate(sheet.rows, start=1):
        c.drawString(LEFT, y, f"{index}. {prompt}")
        c.setFont("Helvetica-Bold", 10)
        c.drawRightString(RIGHT, y, answer)
        c.setFont("Helvetica", 10)
        y -= 34
    c.setFont("Helvetica-Oblique", 9)
    c.setFillColor(HexColor("#475569"))
    c.drawString(LEFT, 28, "Circle a miss, cover this side, and redo it from the rule—not from memory.")


SHEETS = [
    Sheet(
        "2026-10-21",
        34,
        "Perimeter and area — from zero",
        "area-perimeter",
        "Perimeter: add all 4 sides.  Area: length × width.  Never divide.",
        [
            ("Perimeter of a 4 cm by 3 cm rectangle", "14 cm"),
            ("Perimeter of a 6 cm by 2 cm rectangle", "16 cm"),
            ("Perimeter of a 5 cm by 4 cm rectangle", "18 cm"),
            ("Perimeter of an 8 cm by 3 cm rectangle", "22 cm"),
            ("Perimeter of a 7 cm by 5 cm rectangle", "24 cm"),
            ("Perimeter of a 9 cm by 4 cm rectangle", "26 cm"),
            ("Area of a 4 cm by 3 cm rectangle", "12 cm²"),
            ("Area of a 6 cm by 2 cm rectangle", "12 cm²"),
            ("Area of a 5 cm by 4 cm rectangle", "20 cm²"),
            ("Area of an 8 cm by 3 cm rectangle", "24 cm²"),
            ("Area of a 7 cm by 5 cm rectangle", "35 cm²"),
            ("Area of a 9 cm by 4 cm rectangle", "36 cm²"),
        ],
    ),
    Sheet(
        "2026-10-22",
        35,
        "Density — one rule at a time",
        "density",
        "Density = mass ÷ volume.  After that is clear: mass = density × volume.",
        [
            ("Density: 24 g in 6 cm³", "4 g/cm³"),
            ("Density: 30 g in 10 cm³", "3 g/cm³"),
            ("Density: 42 g in 7 cm³", "6 g/cm³"),
            ("Density: 48 g in 12 cm³", "4 g/cm³"),
            ("Density: 35 g in 5 cm³", "7 g/cm³"),
            ("Density: 60 g in 20 cm³", "3 g/cm³"),
            ("Mass: density 4 g/cm³, volume 5 cm³", "20 g"),
            ("Mass: density 3 g/cm³, volume 8 cm³", "24 g"),
            ("Mass: density 6 g/cm³, volume 7 cm³", "42 g"),
            ("Mass: density 5 g/cm³, volume 9 cm³", "45 g"),
            ("Mass: density 2 g/cm³, volume 12 cm³", "24 g"),
            ("Mass: density 7 g/cm³, volume 6 cm³", "42 g"),
        ],
    ),
    Sheet(
        "2026-10-23",
        36,
        "Integers on a number line",
        "integers",
        "Add positive: move right.  Subtract positive: move left.  Keep the minus sign.",
        [
            ("−3 + 8", "5"),
            ("5 − 12", "−7"),
            ("−6 + 2", "−4"),
            ("−4 − 7", "−11"),
            ("9 + (−13)", "−4"),
            ("−10 + 17", "7"),
            ("2 − 9", "−7"),
            ("−12 + 5", "−7"),
            ("−8 − 6", "−14"),
            ("Start −4°F; rise 9°", "5°F"),
            ("Start 5°F; fall 7°", "−2°F"),
            ("Start −8°F; rise 3°", "−5°F"),
        ],
    ),
]


def main():
    for sheet in SHEETS:
        path = OUT / f"{sheet.date}-{sheet.slug}-revised.pdf"
        c = canvas.Canvas(str(path), pagesize=letter)
        c.setTitle(f"Day {sheet.day} — {sheet.title}")
        practice_page(c, sheet)
        c.showPage()
        answer_page(c, sheet)
        c.save()
        print(path)


if __name__ == "__main__":
    main()
