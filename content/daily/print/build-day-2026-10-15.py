#!/usr/bin/env python3
"""Build Day 30's duplex letter worksheet."""

from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

OUT = Path(__file__).with_name("2026-10-15-estimate-and-mass.pdf")
W, H = letter
LEFT = 48
RIGHT = W - 48


def header(c, eyebrow, title):
    c.setFillColorRGB(0.12, 0.16, 0.22)
    c.rect(0, H - 74, W, 74, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(LEFT, H - 28, eyebrow)
    c.setFont("Helvetica-Bold", 23)
    c.drawString(LEFT, H - 55, title)
    c.setFillColorRGB(0.1, 0.1, 0.1)


def line(c, y):
    c.setStrokeColorRGB(0.78, 0.78, 0.78)
    c.line(LEFT, y, RIGHT, y)


def build():
    c = canvas.Canvas(str(OUT), pagesize=letter)
    c.setTitle("Thursday Day 30 — Estimate and Mass")

    header(c, "THURSDAY  •  DAY 30  •  PRACTICE SIDE", "Estimate first. Exact second.")
    y = H - 102
    c.setFont("Helvetica", 11)
    c.drawString(LEFT, y, "Round the first number to the nearest 10. Then calculate exactly.")
    y -= 28
    c.setFont("Helvetica-Bold", 10)
    c.drawString(LEFT, y, "Problem")
    c.drawString(LEFT + 100, y, "Estimate")
    c.drawString(LEFT + 235, y, "Exact work and answer")
    c.drawString(RIGHT - 65, y, "Makes sense?")
    y -= 10
    line(c, y)
    problems = [(47, 6), (32, 9), (19, 14), (26, 15), (43, 7), (28, 13), (54, 6), (39, 8)]
    for a, b in problems:
        y -= 34
        c.setFont("Helvetica-Bold", 13)
        c.drawString(LEFT, y, f"{a} × {b}")
        c.setFont("Helvetica", 10)
        c.drawString(LEFT + 100, y, "________")
        c.drawString(LEFT + 235, y, "________________________")
        c.drawString(RIGHT - 45, y, "Y / N")
        line(c, y - 9)

    y -= 42
    c.setFont("Helvetica-Bold", 17)
    c.drawString(LEFT, y, "Mass number = protons + neutrons")
    y -= 24
    c.setFont("Helvetica", 10)
    c.drawString(LEFT, y, "Use the lesson page first. Complete every box before turning the sheet over.")
    y -= 25
    c.setFont("Helvetica-Bold", 10)
    c.drawString(LEFT, y, "Atom")
    c.drawString(LEFT + 120, y, "Protons")
    c.drawString(LEFT + 240, y, "Neutrons")
    c.drawString(LEFT + 365, y, "Mass number")
    y -= 9
    line(c, y)
    for symbol, name in [("C", "Carbon"), ("F", "Fluorine"), ("Na", "Sodium"), ("Ar", "Argon"), ("Mg", "Magnesium"), ("Cl", "Chlorine")]:
        y -= 28
        c.setFont("Helvetica-Bold", 11)
        c.drawString(LEFT, y, f"{symbol}  {name}")
        c.setFont("Helvetica", 10)
        c.drawString(LEFT + 120, y, "________")
        c.drawString(LEFT + 240, y, "________")
        c.drawString(LEFT + 365, y, "________")
        line(c, y - 8)
    c.setFont("Helvetica-Oblique", 9)
    c.setFillColorRGB(0.35, 0.35, 0.35)
    c.drawString(LEFT, 28, "Put this sheet away before the online exam.")
    c.showPage()

    header(c, "THURSDAY  •  DAY 30  •  ANSWER SIDE", "Check, correct, understand.")
    y = H - 110
    c.setFont("Helvetica-Bold", 15)
    c.drawString(LEFT, y, "Multiplication")
    y -= 28
    answers = [
        ("47 × 6", "about 300", "282"),
        ("32 × 9", "about 270", "288"),
        ("19 × 14", "about 280", "266"),
        ("26 × 15", "about 450", "390"),
        ("43 × 7", "about 280", "301"),
        ("28 × 13", "about 390", "364"),
        ("54 × 6", "about 300", "324"),
        ("39 × 8", "about 320", "312"),
    ]
    for problem, estimate, exact in answers:
        c.setFont("Helvetica", 12)
        c.drawString(LEFT, y, problem)
        c.drawString(LEFT + 120, y, estimate)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(LEFT + 270, y, exact)
        y -= 26

    y -= 18
    c.setFont("Helvetica-Bold", 15)
    c.drawString(LEFT, y, "Atoms")
    y -= 28
    atoms = [
        ("C  Carbon", 6, 6, 12),
        ("F  Fluorine", 9, 10, 19),
        ("Na  Sodium", 11, 12, 23),
        ("Ar  Argon", 18, 22, 40),
        ("Mg  Magnesium", 12, 12, 24),
        ("Cl  Chlorine", 17, 18, 35),
    ]
    c.setFont("Helvetica-Bold", 10)
    c.drawString(LEFT, y, "Atom")
    c.drawString(LEFT + 165, y, "P")
    c.drawString(LEFT + 235, y, "N")
    c.drawString(LEFT + 305, y, "P + N")
    y -= 22
    for name, protons, neutrons, mass in atoms:
        c.setFont("Helvetica", 12)
        c.drawString(LEFT, y, name)
        c.drawString(LEFT + 165, y, str(protons))
        c.drawString(LEFT + 235, y, str(neutrons))
        c.setFont("Helvetica-Bold", 12)
        c.drawString(LEFT + 305, y, str(mass))
        y -= 27

    y -= 12
    c.setFont("Helvetica-Bold", 12)
    c.drawString(LEFT, y, "Rule: estimate → exact answer → reasonableness check.")
    c.setFont("Helvetica-Oblique", 9)
    c.setFillColorRGB(0.35, 0.35, 0.35)
    c.drawString(LEFT, 28, "Answers stay face down until a section is finished.")
    c.save()


if __name__ == "__main__":
    build()
    print(OUT)
