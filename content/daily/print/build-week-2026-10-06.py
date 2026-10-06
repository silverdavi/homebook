#!/usr/bin/env python3
"""One letter sheet per day, Oct 6–9 2026. Lesson on the front, practice on the back."""

from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

OUT = Path(__file__).resolve().parent
W, H = letter
LEFT = 54
RIGHT = W - 54


def header(c, when, title):
    c.setFillColorRGB(0.12, 0.16, 0.22)
    c.rect(0, H - 78, W, 78, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Times-Bold", 13)
    c.drawString(LEFT, H - 32, when)
    c.setFont("Times-Bold", 26)
    c.drawString(LEFT, H - 60, title)
    c.setFillColorRGB(0.1, 0.1, 0.1)


def footer(c, line):
    c.setFillColorRGB(0.35, 0.35, 0.35)
    c.setFont("Times-Italic", 11)
    c.drawString(LEFT, 36, line)
    c.setFillColorRGB(0.1, 0.1, 0.1)


def rule(c, y):
    c.setStrokeColorRGB(0.75, 0.75, 0.75)
    c.setLineWidth(0.6)
    c.line(LEFT, y, RIGHT, y)
    c.setStrokeColorRGB(0, 0, 0)


def valence():
    path = OUT / "2026-10-06-valence.pdf"
    c = canvas.Canvas(str(path), pagesize=letter)
    c.setTitle("Tuesday — valence")
    header(c, "TUESDAY  ·  DAY 26", "Valence")
    y = H - 110
    c.setFont("Times-Roman", 16)
    c.drawString(LEFT, y, "Same column, same number. It is not the proton count.")
    y -= 36
    rows = [
        ("1", "Lithium, sodium", "1"),
        ("2", "Beryllium, magnesium", "2"),
        ("3", "Boron, aluminum", "3"),
        ("4", "Carbon, silicon", "4"),
        ("5", "Nitrogen, phosphorus", "5"),
        ("6", "Oxygen, sulfur", "6"),
        ("7", "Fluorine, chlorine", "7"),
        ("8", "Neon, argon", "8"),
    ]
    c.setFont("Times-Bold", 13)
    c.drawString(LEFT, y, "Column")
    c.drawString(LEFT + 90, y, "Examples")
    c.drawString(LEFT + 340, y, "Valence")
    y -= 8
    rule(c, y)
    y -= 26
    for col, names, val in rows:
        c.setFont("Times-Roman", 16)
        c.drawString(LEFT + 16, y, col)
        c.drawString(LEFT + 90, y, names)
        c.setFont("Times-Bold", 18)
        c.drawString(LEFT + 360, y, val)
        y -= 28
    y -= 8
    c.setFont("Times-Bold", 16)
    c.drawString(LEFT, y, "Helium is 2, not 8.    Hydrogen is 1.")
    footer(c, "Filled side. Keep this side down while you try the other side. Away before the exam.")
    c.showPage()

    header(c, "TUESDAY  ·  OTHER SIDE", "Say the number")
    y = H - 120
    c.setFont("Times-Roman", 15)
    c.drawString(LEFT, y, "Valence electrons. The table stays face down.")
    y -= 40
    items = [
        "Magnesium",
        "Boron",
        "Silicon",
        "Oxygen",
        "Chlorine",
        "Helium",
        "Sodium",
        "Argon",
    ]
    for name in items:
        c.setFont("Times-Roman", 18)
        c.drawString(LEFT, y, name)
        c.setStrokeColorRGB(0.65, 0.65, 0.65)
        c.setLineWidth(0.8)
        c.line(LEFT + 180, y - 2, LEFT + 280, y - 2)
        y -= 42
    footer(c, "Check by turning back to the table.")
    c.save()
    return path


def multiply():
    path = OUT / "2026-10-07-multiply.pdf"
    c = canvas.Canvas(str(path), pagesize=letter)
    c.setTitle("Wednesday — the last addition")
    header(c, "WEDNESDAY  ·  DAY 27", "The last addition")
    y = H - 115
    c.setFont("Times-Roman", 16)
    c.drawString(LEFT, y, "Split. Multiply both pieces. Then add. Do not stop early.")
    y -= 48
    c.setFont("Times-Bold", 22)
    c.drawString(LEFT, y, "24  ×  13")
    y -= 36
    c.setFont("Times-Roman", 18)
    for line in ("13 is 10 + 3", "24 × 10  =  240", "24 × 3  =  72", "240 + 72  =  312"):
        c.drawString(LEFT + 12, y, line)
        y -= 30
    y -= 16
    rule(c, y)
    y -= 32
    c.setFont("Times-Bold", 14)
    c.drawString(LEFT, y, "Other side")
    y -= 26
    c.setFont("Times-Roman", 15)
    answers = [
        "19 × 14 = 266",
        "28 × 13 = 364",
        "23 × 14 = 322",
        "33 × 12 = 396",
        "17 × 16 = 272",
        "26 × 15 = 390",
        "35 × 12 = 420",
        "42 × 11 = 462",
    ]
    col_x = [LEFT, LEFT + 250]
    for i, text in enumerate(answers):
        c.drawString(col_x[i % 2], y, text)
        if i % 2 == 1:
            y -= 24
    footer(c, "Filled side. Keep this side down while you try the other side. Away before the exam.")
    c.showPage()

    header(c, "WEDNESDAY  ·  OTHER SIDE", "Write both pieces, then add")
    y = H - 120
    problems = ["19 × 14", "28 × 13", "23 × 14", "33 × 12", "17 × 16", "26 × 15", "35 × 12", "42 × 11"]
    for p in problems:
        c.setFont("Times-Bold", 16)
        c.drawString(LEFT, y, p)
        c.setFont("Times-Roman", 13)
        c.setFillColorRGB(0.35, 0.35, 0.35)
        c.drawString(LEFT + 120, y, "tens ______      ones ______      add ______")
        c.setFillColorRGB(0.1, 0.1, 0.1)
        y -= 58
    footer(c, "Turn back only to check.")
    c.save()
    return path


def timeline():
    path = OUT / "2026-10-08-line.pdf"
    c = canvas.Canvas(str(path), pagesize=letter)
    c.setTitle("Thursday — the long line")
    header(c, "THURSDAY  ·  DAY 28", "The long line")
    y = H - 110
    c.setFont("Times-Roman", 16)
    c.drawString(LEFT, y, "Millions of years ago. Oldest at the top. Us at the bottom.")
    y -= 34
    rows = [
        ("Big Bang", "13800"),
        ("Earth forms", "4540"),
        ("First life", "3700"),
        ("Cambrian explosion", "540"),
        ("First fish", "520"),
        ("First land plants", "470"),
        ("First dinosaurs", "230"),
        ("First mammals", "210"),
        ("Asteroid, dinosaurs gone", "66"),
        ("First hominids", "7"),
        ("Homo sapiens", "0.3"),
    ]
    for name, num in rows:
        c.setFont("Times-Roman", 15)
        c.drawString(LEFT, y, name)
        c.setFont("Times-Bold", 16)
        c.drawRightString(RIGHT, y, num)
        y -= 28
        c.setStrokeColorRGB(0.88, 0.88, 0.88)
        c.setLineWidth(0.4)
        c.line(LEFT, y + 12, RIGHT, y + 12)
    y -= 8
    c.setFillColorRGB(0.1, 0.1, 0.1)
    c.setFont("Times-Italic", 13)
    c.drawString(LEFT, y, "Close is enough. Fish just after 540. Humans last.")
    footer(c, "Filled side. Keep this side down while you try the other side. Away before the exam.")
    c.showPage()

    header(c, "THURSDAY  ·  OTHER SIDE", "Write the number")
    y = H - 120
    c.setFont("Times-Roman", 15)
    c.drawString(LEFT, y, "Millions of years ago. The line stays face down.")
    y -= 42
    blanks = [
        "First dinosaurs",
        "Earth forms",
        "Asteroid",
        "First fish",
        "Big Bang",
        "Homo sapiens",
        "First life",
        "First mammals",
    ]
    for name in blanks:
        c.setFont("Times-Roman", 18)
        c.drawString(LEFT, y, name)
        c.setStrokeColorRGB(0.65, 0.65, 0.65)
        c.setLineWidth(0.8)
        c.line(LEFT + 220, y - 2, RIGHT, y - 2)
        y -= 48
    footer(c, "Check by turning back to the line.")
    c.save()
    return path


def lcm():
    path = OUT / "2026-10-09-lcm.pdf"
    c = canvas.Canvas(str(path), pagesize=letter)
    c.setTitle("Friday — the first shared number")
    header(c, "FRIDAY  ·  DAY 29", "The first number they share")
    y = H - 112
    c.setFont("Times-Roman", 16)
    c.drawString(LEFT, y, "List the multiples. Take the first number in both lists.")
    y -= 40
    blocks = [
        ("4 and 6", "4, 8, 12, 16…", "6, 12, 18…", "12"),
        ("5 and 7", "5, 10, 15, 20, 25, 30, 35…", "7, 14, 21, 28, 35…", "35"),
        ("5 and 15", "5 is already inside 15.", "They meet at 15.", "15"),
    ]
    for title, a, b, ans in blocks:
        c.setFont("Times-Bold", 16)
        c.drawString(LEFT, y, title)
        c.setFont("Times-Roman", 14)
        c.drawString(LEFT + 110, y, a)
        y -= 20
        c.drawString(LEFT + 110, y, b)
        c.setFont("Times-Bold", 16)
        c.drawRightString(RIGHT, y + 10, ans)
        y -= 28
    y -= 6
    rule(c, y)
    y -= 28
    c.setFont("Times-Bold", 14)
    c.drawString(LEFT, y, "Other side")
    y -= 24
    c.setFont("Times-Roman", 15)
    answers = ["6 and 7 → 42", "4 and 8 → 8", "9 and 4 → 36", "8 and 20 → 40", "10 and 16 → 80", "14 and 6 → 42"]
    for text in answers:
        c.drawString(LEFT, y, text)
        y -= 22
    footer(c, "Filled side. Keep this side down while you try the other side. Away before the exam.")
    c.showPage()

    header(c, "FRIDAY  ·  OTHER SIDE", "Where do they meet?")
    y = H - 120
    c.setFont("Times-Roman", 15)
    c.drawString(LEFT, y, "Write the multiples, then the first shared number.")
    y -= 48
    problems = ["6 and 7", "4 and 8", "9 and 4", "8 and 20", "10 and 16", "14 and 6"]
    for p in problems:
        c.setFont("Times-Bold", 18)
        c.drawString(LEFT, y, p)
        c.setStrokeColorRGB(0.65, 0.65, 0.65)
        c.setLineWidth(0.8)
        c.line(LEFT, y - 28, RIGHT, y - 28)
        y -= 78
    footer(c, "Turn back only to check.")
    c.save()
    return path


if __name__ == "__main__":
    for pdf in (valence(), multiply(), timeline(), lcm()):
        print(pdf)
