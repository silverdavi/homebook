#!/usr/bin/env python3
"""Build six labeled duplex letter worksheets for Oct 16 and Oct 19–23."""

from dataclasses import dataclass
from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

OUT = Path(__file__).resolve().parent
W, H = letter
LEFT = 48
RIGHT = W - 48


@dataclass
class Section:
    title: str
    instruction: str
    rows: list[tuple[str, str]]


@dataclass
class Sheet:
    date: str
    day: int
    weekday: str
    title: str
    slug: str
    sections: list[Section]


def header(c, sheet: Sheet, side: str):
    c.setFillColorRGB(0.12, 0.16, 0.22)
    c.rect(0, H - 74, W, 74, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(LEFT, H - 27, f"{sheet.weekday.upper()}  •  DAY {sheet.day}  •  {side}")
    c.setFont("Helvetica-Bold", 22)
    c.drawString(LEFT, H - 54, sheet.title)
    c.setFillColorRGB(0.1, 0.1, 0.1)


def rule(c, y):
    c.setStrokeColorRGB(0.82, 0.82, 0.82)
    c.setLineWidth(0.5)
    c.line(LEFT, y, RIGHT, y)


def draw_practice(c, sheet: Sheet):
    header(c, sheet, "PRACTICE SIDE")
    y = H - 102
    for section in sheet.sections:
        c.setFont("Helvetica-Bold", 15)
        c.drawString(LEFT, y, section.title)
        y -= 18
        c.setFont("Helvetica", 9)
        c.setFillColorRGB(0.32, 0.32, 0.32)
        c.drawString(LEFT, y, section.instruction)
        c.setFillColorRGB(0.1, 0.1, 0.1)
        y -= 12
        rule(c, y)
        for prompt, _answer in section.rows:
            y -= 27
            c.setFont("Helvetica", 10)
            c.drawString(LEFT, y, prompt)
            c.setStrokeColorRGB(0.55, 0.55, 0.55)
            c.line(RIGHT - 115, y - 2, RIGHT, y - 2)
            rule(c, y - 9)
        y -= 24
    if sheet.slug == "data":
        c.setFont("Helvetica-Bold", 10)
        c.drawString(LEFT, y, "7-day bar graph")
        graph_top = y - 15
        graph_bottom = 80
        graph_left = LEFT + 30
        graph_right = RIGHT
        c.setStrokeColorRGB(0.82, 0.82, 0.82)
        for value in range(0, 11, 2):
            gy = graph_bottom + (graph_top - graph_bottom) * value / 10
            c.line(graph_left, gy, graph_right, gy)
            c.setFont("Helvetica", 7)
            c.drawRightString(graph_left - 5, gy - 2, str(value))
        for day_index in range(7):
            gx = graph_left + (graph_right - graph_left) * (day_index + 0.5) / 7
            c.drawCentredString(gx, graph_bottom - 12, str(day_index + 1))
    c.setFont("Helvetica-Oblique", 9)
    c.setFillColorRGB(0.35, 0.35, 0.35)
    c.drawString(LEFT, 28, "Keep the answer side face down. Put this sheet away before the online exam.")


def draw_answers(c, sheet: Sheet):
    header(c, sheet, "ANSWER SIDE")
    y = H - 104
    for section in sheet.sections:
        c.setFont("Helvetica-Bold", 15)
        c.drawString(LEFT, y, section.title)
        y -= 18
        for prompt, answer in section.rows:
            c.setFont("Helvetica", 9.5)
            c.drawString(LEFT, y, prompt)
            c.setFont("Helvetica-Bold", 10)
            c.drawRightString(RIGHT, y, answer)
            y -= 23
        y -= 20
    c.setFont("Helvetica-Oblique", 9)
    c.setFillColorRGB(0.35, 0.35, 0.35)
    c.drawString(LEFT, 28, "Check only after completing a section. Correct every miss without copying.")


SHEETS = [
    Sheet(
        "2026-10-16", 31, "Friday", "Percent means out of 100", "percentages",
        [
            Section("Anchors", "Show the shortcut or calculation.", [
                ("1. 10% of 80", "8"), ("2. 25% of 60", "15"),
                ("3. 50% of 46", "23"), ("4. 5% of 140", "7"),
                ("5. 15% of 60", "9"), ("6. 20% of 45", "9"),
            ]),
            Section("Money", "For discounts, write discount and final price.", [
                ("7. 75% of 40", "30"), ("8. $40 item, 25% off: final price", "$30"),
                ("9. $75 item, 20% off: final price", "$60"),
                ("10. 20% tip on $35", "$7"),
            ]),
        ],
    ),
    Sheet(
        "2026-10-19", 32, "Monday", "Make it per 1", "unit-rates",
        [
            Section("Unit rates", "Divide total by count. Write the unit.", [
                ("1. 180 miles in 3 hours", "60 mph"),
                ("2. 4 notebooks cost $12", "$3 each"),
                ("3. 6 cans cost $9", "$1.50 each"),
                ("4. 240 words in 4 minutes", "60 words/min"),
                ("5. 72 pages in 6 days", "12 pages/day"),
                ("6. 350 miles on 10 gallons", "35 mpg"),
                ("7. 8 apples cost $6", "$0.75 each"),
                ("8. 45 points in 5 games", "9 points/game"),
            ]),
            Section("Better buy", "Find both unit prices and circle the cheaper one.", [
                ("9. 6 for $9 OR 4 for $7", "$1.50 vs $1.75; 6 for $9"),
                ("10. 8 for $12 OR 5 for $8", "$1.50 vs $1.60; 8 for $12"),
                ("11. 10 for $15 OR 6 for $9.60", "$1.50 vs $1.60; 10 for $15"),
                ("12. 12 for $18 OR 8 for $13", "$1.50 vs $1.625; 12 for $18"),
            ]),
        ],
    ),
    Sheet(
        "2026-10-20", 33, "Tuesday", "Around, across, and inside", "geometry",
        [
            Section("Choose the measurement", "Write work and cm, cm², or cm³.", [
                ("1. Area: rectangle 9 × 4", "36 cm²"),
                ("2. Perimeter: rectangle 9 × 4", "26 cm"),
                ("3. Area: rectangle 12 × 7", "84 cm²"),
                ("4. Perimeter: rectangle 12 × 7", "38 cm"),
                ("5. Triangle area: base 10, height 6", "30 cm²"),
                ("6. Triangle area: base 14, height 8", "56 cm²"),
                ("7. Box volume: 5 × 4 × 3", "60 cm³"),
                ("8. Box volume: 8 × 3 × 2", "48 cm³"),
                ("9. Area: rectangle 15 × 6", "90 cm²"),
                ("10. Perimeter: rectangle 15 × 6", "42 cm"),
            ]),
        ],
    ),
    Sheet(
        "2026-10-21", 34, "Wednesday", "Density packs matter", "density",
        [
            Section("Find the missing quantity", "Write the rule and unit.", [
                ("1. density: mass 60 g, volume 20 cm³", "3 g/cm³"),
                ("2. density: mass 48 g, volume 12 cm³", "4 g/cm³"),
                ("3. density: mass 35 g, volume 5 cm³", "7 g/cm³"),
                ("4. mass: density 4 g/cm³, volume 6 cm³", "24 g"),
                ("5. mass: density 3 g/cm³, volume 15 cm³", "45 g"),
                ("6. mass: density 2.5 g/cm³, volume 8 cm³", "20 g"),
                ("7. volume: mass 45 g, density 5 g/cm³", "9 cm³"),
                ("8. volume: mass 72 g, density 8 g/cm³", "9 cm³"),
                ("9. volume: mass 30 g, density 2.5 g/cm³", "12 cm³"),
                ("10. density: mass 22 g, volume 4 cm³", "5.5 g/cm³"),
            ]),
        ],
    ),
    Sheet(
        "2026-10-22", 35, "Thursday", "Left and right of zero", "integers",
        [
            Section("Integers", "Use the number line. Keep every minus sign.", [
                ("1. −3 + 8", "5"), ("2. 5 − 12", "−7"),
                ("3. −6 + 2", "−4"), ("4. −4 − 7", "−11"),
                ("5. 9 + (−13)", "−4"), ("6. −10 + 17", "7"),
                ("7. 2 − 9", "−7"), ("8. −12 + 5", "−7"),
                ("9. −8 − 6", "−14"), ("10. 14 + (−9)", "5"),
                ("11. −15 + 20", "5"), ("12. 7 − 18", "−11"),
            ]),
            Section("Temperature", "New temperature = start + change.", [
                ("13. Start −4°F, rise 9°", "5°F"),
                ("14. Start 5°F, fall 7°", "−2°F"),
                ("15. Start −8°F, rise 3°", "−5°F"),
                ("16. Start 2°F, fall 11°", "−9°F"),
                ("17. Start −12°F, rise 15°", "3°F"),
                ("18. Start 6°F, fall 14°", "−8°F"),
            ]),
        ],
    ),
    Sheet(
        "2026-10-23", 36, "Friday", "Center and spread", "data",
        [
            Section("Mean, median, range", "Find all 3 for each ordered or unordered set.", [
                ("1. 3, 5, 5, 7, 10", "mean 6; median 5; range 7"),
                ("2. 4, 6, 8, 10", "mean 7; median 7; range 6"),
                ("3. 12, 15, 18", "mean 15; median 15; range 6"),
                ("4. 2, 3, 7, 8", "mean 5; median 5; range 6"),
                ("5. 9, 2, 7, 4, 6", "mean 5.6; median 6; range 7"),
                ("6. 20, 25, 30, 35, 40", "mean 30; median 30; range 20"),
            ]),
            Section("Seven days", "Calculate all 3, then draw a 7-bar graph below.", [
                ("7. 4, 6, 5, 8, 7, 9, 3", "mean 6; median 6; range 6"),
            ]),
        ],
    ),
]


def main():
    for sheet in SHEETS:
        path = OUT / f"{sheet.date}-{sheet.slug}.pdf"
        c = canvas.Canvas(str(path), pagesize=letter)
        c.setTitle(f"{sheet.weekday} Day {sheet.day} — {sheet.title}")
        draw_practice(c, sheet)
        c.showPage()
        draw_answers(c, sheet)
        c.save()
        print(path)


if __name__ == "__main__":
    main()
