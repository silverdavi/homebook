#!/usr/bin/env python3
"""Build four color, duplex World sheets for Oct 20–23."""

from pathlib import Path

from reportlab.lib.colors import (
    HexColor,
    black,
    blue,
    green,
    red,
    white,
    yellow,
)
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

OUT = Path(__file__).resolve().parent
W, H = letter
LEFT = 48
RIGHT = W - 48


def header(c, label, title):
    c.setFillColor(HexColor("#1f2937"))
    c.rect(0, H - 74, W, 74, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(LEFT, H - 27, label)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(LEFT, H - 54, title)
    c.setFillColor(black)


def flag(c, name, x, y, w=96, h=52):
    c.setStrokeColor(black)
    c.setLineWidth(0.5)
    c.setFillColor(white)
    c.rect(x, y, w, h, fill=1, stroke=1)
    if name == "Japan":
        c.setFillColor(HexColor("#bc002d"))
        c.circle(x + w / 2, y + h / 2, h * 0.18, fill=1, stroke=0)
    elif name == "Brazil":
        c.setFillColor(HexColor("#009c3b"))
        c.rect(x, y, w, h, fill=1, stroke=0)
        c.setFillColor(HexColor("#ffdf00"))
        c.saveState()
        c.translate(x + w / 2, y + h / 2)
        c.rotate(45)
        c.rect(-h * 0.22, -h * 0.22, h * 0.44, h * 0.44, fill=1, stroke=0)
        c.restoreState()
        c.setFillColor(HexColor("#002776"))
        c.circle(x + w / 2, y + h / 2, h * 0.13, fill=1, stroke=0)
    elif name == "Canada":
        c.setFillColor(HexColor("#d80621"))
        c.rect(x, y, w * 0.25, h, fill=1, stroke=0)
        c.rect(x + w * 0.75, y, w * 0.25, h, fill=1, stroke=0)
        c.setFillColor(HexColor("#d80621"))
        points = [
            x + w * 0.50, y + h * 0.82,
            x + w * 0.44, y + h * 0.57,
            x + w * 0.36, y + h * 0.62,
            x + w * 0.41, y + h * 0.43,
            x + w * 0.36, y + h * 0.34,
            x + w * 0.47, y + h * 0.35,
            x + w * 0.50, y + h * 0.16,
            x + w * 0.53, y + h * 0.35,
            x + w * 0.64, y + h * 0.34,
            x + w * 0.59, y + h * 0.43,
            x + w * 0.64, y + h * 0.62,
            x + w * 0.56, y + h * 0.57,
        ]
        path = c.beginPath()
        path.moveTo(points[0], points[1])
        for i in range(2, len(points), 2):
            path.lineTo(points[i], points[i + 1])
        path.close()
        c.drawPath(path, fill=1, stroke=0)
    elif name == "Ukraine":
        c.setFillColor(HexColor("#0057b7"))
        c.rect(x, y + h / 2, w, h / 2, fill=1, stroke=0)
        c.setFillColor(HexColor("#ffd700"))
        c.rect(x, y, w, h / 2, fill=1, stroke=0)
    elif name == "Palestine":
        c.setFillColor(black)
        c.rect(x, y + 2 * h / 3, w, h / 3, fill=1, stroke=0)
        c.setFillColor(white)
        c.rect(x, y + h / 3, w, h / 3, fill=1, stroke=0)
        c.setFillColor(HexColor("#149954"))
        c.rect(x, y, w, h / 3, fill=1, stroke=0)
        c.setFillColor(HexColor("#e4312b"))
        path = c.beginPath()
        path.moveTo(x, y)
        path.lineTo(x, y + h)
        path.lineTo(x + w * 0.38, y + h / 2)
        path.close()
        c.drawPath(path, fill=1, stroke=0)
    elif name == "Israel":
        c.setFillColor(white)
        c.rect(x, y, w, h, fill=1, stroke=0)
        c.setFillColor(HexColor("#0038b8"))
        c.rect(x, y + h * 0.14, w, h * 0.09, fill=1, stroke=0)
        c.rect(x, y + h * 0.77, w, h * 0.09, fill=1, stroke=0)
        c.setStrokeColor(HexColor("#0038b8"))
        c.setLineWidth(1.5)
        c.line(x + w * 0.38, y + h * 0.35, x + w * 0.62, y + h * 0.35)
        c.line(x + w * 0.38, y + h * 0.35, x + w * 0.50, y + h * 0.68)
        c.line(x + w * 0.62, y + h * 0.35, x + w * 0.50, y + h * 0.68)
        c.line(x + w * 0.38, y + h * 0.65, x + w * 0.62, y + h * 0.65)
        c.line(x + w * 0.38, y + h * 0.65, x + w * 0.50, y + h * 0.32)
        c.line(x + w * 0.62, y + h * 0.65, x + w * 0.50, y + h * 0.32)
    elif name == "South Africa":
        c.setFillColor(HexColor("#de3831"))
        c.rect(x, y + h / 2, w, h / 2, fill=1, stroke=0)
        c.setFillColor(HexColor("#007a4d"))
        c.rect(x, y + h * 0.36, w, h * 0.28, fill=1, stroke=0)
        c.setFillColor(HexColor("#002395"))
        c.rect(x, y, w, h * 0.34, fill=1, stroke=0)
        c.setFillColor(black)
        path = c.beginPath()
        path.moveTo(x, y)
        path.lineTo(x + w * 0.38, y + h / 2)
        path.lineTo(x, y + h)
        path.close()
        c.drawPath(path, fill=1, stroke=0)
    c.setStrokeColor(black)
    c.rect(x, y, w, h, fill=0, stroke=1)


def questions(c, y, rows):
    c.setFont("Helvetica-Bold", 14)
    c.drawString(LEFT, y, "Practice")
    y -= 24
    for number, prompt in enumerate(rows, 1):
        c.setFont("Helvetica", 10)
        c.drawString(LEFT, y, f"{number}. {prompt}")
        c.line(RIGHT - 120, y - 2, RIGHT, y - 2)
        y -= 29
    return y


def answers(c, label, title, rows):
    header(c, label, f"{title} — answers")
    y = H - 110
    for number, (prompt, answer) in enumerate(rows, 1):
        c.setFont("Helvetica", 10)
        c.drawString(LEFT, y, f"{number}. {prompt}")
        c.setFont("Helvetica-Bold", 10)
        c.drawRightString(RIGHT, y, answer)
        y -= 31
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(LEFT, 30, "Check after completing the practice side. Correct every miss.")


def build_tuesday():
    path = OUT / "2026-10-20-world-maps-flags.pdf"
    c = canvas.Canvas(str(path), pagesize=letter)
    label = "TUESDAY  •  WORLD  •  MAPS AND FLAGS"
    title = "Where, and who drew the line?"
    header(c, label, title)
    cards = [
        ("Japan", "Asia • islands east of Korea and China"),
        ("Brazil", "South America • eastern Atlantic coast"),
        ("Canada", "North America • north of the United States"),
        ("South Africa", "Africa • southern end of the continent"),
    ]
    for i, (name, location) in enumerate(cards):
        x = LEFT + (i % 2) * 260
        y = 590 - (i // 2) * 105
        flag(c, name, x, y)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(x + 108, y + 34, name)
        c.setFont("Helvetica", 8)
        c.drawString(x + 108, y + 18, location)
    rows = [
        ("Japan's continent", "Asia"),
        ("Brazil's continent", "South America"),
        ("Symbol on Canada's flag", "Maple leaf"),
        ("Line dividing north and south hemispheres", "Equator"),
        ("Projection that enlarges places near the poles", "Mercator"),
        ("Power that drew many African borders", "European empires"),
    ]
    questions(c, 390, [prompt for prompt, _ in rows])
    c.showPage()
    answers(c, label, title, rows)
    c.save()
    return path


def build_wednesday():
    path = OUT / "2026-10-21-world-biomes.pdf"
    c = canvas.Canvas(str(path), pagesize=letter)
    label = "WEDNESDAY  •  WORLD  •  BIOMES"
    title = "Climate, life, and justice"
    header(c, label, title)
    y = 675
    biome_rows = [
        ("Tundra", "cold • treeless • short growing season • permafrost"),
        ("Desert", "very low precipitation • can be hot or cold"),
        ("Rainforest", "warm • wet • extraordinary biodiversity"),
        ("Grassland", "grasses dominate • seasonal or limited rain"),
    ]
    for biome, description in biome_rows:
        c.setFont("Helvetica-Bold", 14)
        c.drawString(LEFT, y, biome)
        c.setFont("Helvetica", 10)
        c.drawString(LEFT + 105, y, description)
        y -= 42
    c.setFillColor(HexColor("#ecfdf5"))
    c.roundRect(LEFT, y - 55, RIGHT - LEFT, 70, 8, fill=1, stroke=0)
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(LEFT + 12, y - 5, "Climate justice")
    c.setFont("Helvetica", 9)
    c.drawString(LEFT + 12, y - 23, "Ask who produced emissions, who faces harm, and who has resources to adapt.")
    c.drawString(LEFT + 12, y - 39, "Respect Indigenous ecological knowledge and land rights.")
    rows = [
        ("Cold, treeless biome with permafrost", "Tundra"),
        ("Biome defined by low precipitation", "Desert"),
        ("Warm, wet, highly biodiverse biome", "Rainforest"),
        ("Biome dominated by grasses", "Grassland"),
        ("Climate justice compares responsibility with what?", "Harm and power"),
        ("Whose stewardship should conservation respect?", "Indigenous peoples"),
    ]
    questions(c, y - 90, [prompt for prompt, _ in rows])
    c.showPage()
    answers(c, label, title, rows)
    c.save()
    return path


def build_thursday():
    path = OUT / "2026-10-22-world-borders-migration.pdf"
    c = canvas.Canvas(str(path), pagesize=letter)
    label = "THURSDAY  •  WORLD  •  BORDERS AND MIGRATION"
    title = "Flags do not tell the whole story"
    header(c, label, title)
    cards = [
        ("Ukraine", "Eastern Europe"),
        ("Israel", "Eastern Mediterranean"),
        ("Palestine", "Eastern Mediterranean"),
        ("South Africa", "Southern Africa"),
    ]
    for i, (name, location) in enumerate(cards):
        x = LEFT + (i % 2) * 260
        y = 590 - (i // 2) * 105
        flag(c, name, x, y)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(x + 108, y + 34, name)
        c.setFont("Helvetica", 8)
        c.drawString(x + 108, y + 18, location)
    rows = [
        ("Political territory with a government", "State"),
        ("Community linked by identity or history", "Nation"),
        ("Forced across a border by danger", "Refugee"),
        ("Requests legal protection", "Asylum seeker"),
        ("4 forces that have moved borders", "Empire, war, colonization, negotiation"),
        ("Why include migrants' own accounts?", "They show lived experience"),
    ]
    questions(c, 390, [prompt for prompt, _ in rows])
    c.showPage()
    answers(c, label, title, rows)
    c.save()
    return path


def build_friday():
    path = OUT / "2026-10-23-world-current-crises.pdf"
    c = canvas.Canvas(str(path), pagesize=letter)
    label = "FRIDAY  •  WORLD  •  CURRENT AS OF OCTOBER 2026"
    title = "Place, cause, civilian impact"
    header(c, label, title)
    crises = [
        ("Ukraine", "Eastern Europe", "invasion; attacks on civilians and infrastructure"),
        ("Sudan", "Northeastern Africa", "war; world's largest hunger and displacement crisis"),
        ("Gaza", "Eastern Mediterranean", "fragile aid access; shelter and food insecurity"),
        ("Myanmar", "Southeast Asia", "conflict, displacement, hunger, and climate disasters"),
    ]
    y = 675
    for place, region, impact in crises:
        c.setFont("Helvetica-Bold", 13)
        c.drawString(LEFT, y, place)
        c.setFont("Helvetica", 9)
        c.drawString(LEFT + 80, y, region)
        c.drawString(LEFT + 205, y, impact)
        y -= 39
    c.setFillColor(HexColor("#eff6ff"))
    c.roundRect(LEFT, y - 63, RIGHT - LEFT, 78, 8, fill=1, stroke=0)
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(LEFT + 12, y - 5, "Use the same principles every time")
    c.setFont("Helvetica", 9)
    c.drawString(LEFT + 12, y - 23, "Protect civilians • defend human rights and self-determination")
    c.drawString(LEFT + 12, y - 39, "oppose collective punishment • allow humanitarian aid")
    rows = [
        ("Ukraine's region", "Eastern Europe"),
        ("Sudan's region", "Northeastern Africa"),
        ("Sea beside Gaza", "Mediterranean"),
        ("Myanmar's region", "Southeast Asia"),
        ("Year Russia's full-scale invasion began", "2022"),
        ("World's largest hunger/displacement crisis", "Sudan"),
    ]
    questions(c, y - 105, [prompt for prompt, _ in rows])
    c.setFont("Helvetica", 7.5)
    c.drawString(LEFT, 48, "Current sources: UN OCHA and UN News, checked 19 Oct 2026.")
    c.showPage()
    answers(c, label, title, rows)
    c.save()
    return path


if __name__ == "__main__":
    for pdf in (build_tuesday(), build_wednesday(), build_thursday(), build_friday()):
        print(pdf)
