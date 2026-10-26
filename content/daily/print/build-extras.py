"""Build the double-sided "Extra 20 minutes" sheet for each date given.

Usage: uv run --with reportlab python build-extras.py 2026-10-26 [2026-10-27 ...]
Reads apps/web/lib/daily/extras.json, the same source the website uses.
"""

import json
import random
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

HERE = Path(__file__).parent
ROOT = HERE.parents[2]
EXTRAS = json.loads((ROOT / "apps/web/lib/daily/extras.json").read_text())

pdfmetrics.registerFont(TTFont("Body", "/Library/Fonts/Arial Unicode.ttf"))
pdfmetrics.registerFont(TTFont("Bold", "/System/Library/Fonts/Supplemental/Arial Bold.ttf"))

ROSE = colors.HexColor("#be123c")
INK = colors.HexColor("#0f172a")
MUTED = colors.HexColor("#475569")
LINE = colors.HexColor("#cbd5e1")

kicker = ParagraphStyle("k", fontName="Bold", fontSize=8.5, textColor=ROSE, leading=11)
title = ParagraphStyle("t", fontName="Bold", fontSize=20, textColor=INK, leading=24, spaceAfter=4)
hook = ParagraphStyle("h", fontName="Body", fontSize=10.5, textColor=MUTED, leading=14, spaceAfter=8)
head = ParagraphStyle("hd", fontName="Bold", fontSize=10, textColor=ROSE, leading=13, spaceBefore=6, spaceAfter=3)
name = ParagraphStyle("n", fontName="Bold", fontSize=9.5, textColor=INK, leading=12)
note = ParagraphStyle("no", fontName="Body", fontSize=9, textColor=MUTED, leading=11.5)
body = ParagraphStyle("b", fontName="Body", fontSize=10, textColor=INK, leading=13.5)
small = ParagraphStyle("s", fontName="Body", fontSize=9, textColor=INK, leading=12)
cell = ParagraphStyle("c", fontName="Body", fontSize=9.5, textColor=INK, leading=12)


def position(number, index, count):
    return (number + index * 2) % count


def shown(options, pos):
    correct, *wrong = options
    return wrong[:pos] + [correct] + wrong[pos:]


def box(rows, widths, pad=4, grid=True):
    t = Table(rows, colWidths=widths)
    style = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), pad),
        ("RIGHTPADDING", (0, 0), (-1, -1), pad),
        ("TOPPADDING", (0, 0), (-1, -1), pad),
        ("BOTTOMPADDING", (0, 0), (-1, -1), pad),
    ]
    if grid:
        style.append(("GRID", (0, 0), (-1, -1), 0.5, LINE))
    t.setStyle(TableStyle(style))
    return t


def has_photos(extra):
    return any(i.get("image") for g in extra["groups"] for i in g["items"])


def photo_grid(group, width, cols=6):
    side = width / cols - 6
    tile = ParagraphStyle("tn", parent=note, fontSize=7, leading=8.5)
    cells = []
    for i in group["items"]:
        img = Image(str(ROOT / "apps/web/public" / i["image"].lstrip("/")), side, side)
        cells.append([img, Spacer(1, 2), Paragraph(i["name"], name), Paragraph(i["note"], tile)])
    while len(cells) % cols:
        cells.append([Spacer(1, 1)])
    rows = [cells[k : k + cols] for k in range(0, len(cells), cols)]
    return box(rows, [width / cols] * cols, pad=3, grid=False)


def front(extra, number):
    out = [
        Paragraph(f"EXTRA 20 MINUTES · {number} OF 30 · OPTIONAL · {extra['date']}", kicker),
        Paragraph(extra["title"], title),
        Paragraph(extra["hook"], hook),
    ]
    width = 7.5 * inch
    if has_photos(extra):
        for group in extra["groups"]:
            out.append(KeepTogether([Paragraph(group["heading"].upper(), head), photo_grid(group, width)]))
        if extra.get("credit"):
            out.append(Paragraph(extra["credit"], ParagraphStyle("cr", parent=note, fontSize=6.5)))
        return out
    for group in extra["groups"]:
        items = [[Paragraph(i["name"], name), Paragraph(i["note"], note)] for i in group["items"]]
        cells = [[a, b] for a, b in (([x[0], x[1]]) for x in items)]
        rows = []
        for k in range(0, len(cells), 2):
            left = cells[k]
            right = cells[k + 1] if k + 1 < len(cells) else [Spacer(1, 1)]
            rows.append([left, right])
        out.append(KeepTogether([Paragraph(group["heading"].upper(), head), box(rows, [width / 2] * 2)]))
    out.append(Paragraph("WORTH REMEMBERING", head))
    out.append(box([[Paragraph("• " + f, small)] for f in extra["facts"]], [width], pad=3, grid=False))
    return out


def sheet(extra):
    s = extra.get("sheet") or {}
    width = 7.5 * inch
    kind = s.get("kind")
    if kind == "table":
        cols = s["columns"]
        rows = [[Paragraph(c, name) for c in cols]]
        for r in s["rows"]:
            rows.append([Paragraph(v, cell) for v in r] + [""] * (len(cols) - len(r)))
        t = Table(rows, colWidths=[width / len(cols)] * len(cols), rowHeights=[18] + [26] * len(s["rows"]))
        t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.6, LINE), ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fff1f2")), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
        return [t]
    if kind == "prompts":
        out = []
        for i, p in enumerate(s["items"], 1):
            out += [Paragraph(f"{i}. {p}", body), Spacer(1, 30)]
        return out
    if kind == "sort":
        words = list(s["words"])
        random.Random(extra["date"]).shuffle(words)
        out = [Paragraph("Write each subject in its box:  " + "  ·  ".join(words), small), Spacer(1, 6)]
        bins = s["bins"]
        cells = [[Paragraph(b, name)] for b in bins]
        rows = [cells[k : k + 2] + ([[Spacer(1, 1)]] if k + 1 >= len(cells) else []) for k in range(0, len(cells), 2)]
        t = Table(rows, colWidths=[width / 2] * 2, rowHeights=[68] * len(rows))
        t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.6, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
        return out + [t]
    if kind == "match":
        right = [p[1] for p in s["pairs"]]
        random.Random(extra["date"]).shuffle(right)
        letters = "ABCDEFGHIJKLMNOP"
        rows = [
            [Paragraph(f"____  {p[0]}", cell), Paragraph(f"{letters[i]}. {right[i]}", cell)]
            for i, p in enumerate(s["pairs"])
        ]
        return [Paragraph("Write the letter of the story next to each book.", small), Spacer(1, 4), box(rows, [width * 0.42, width * 0.58], pad=5, grid=False)]
    return [Spacer(1, 120)]


def back(extra, number):
    out = []
    if has_photos(extra):
        out += [Paragraph("WORTH REMEMBERING", head), box([[Paragraph("• " + f, small)] for f in extra["facts"]], [7.5 * inch], pad=2, grid=False)]
    out += [Paragraph("DO IT", head), Paragraph(extra["doIt"], body), Spacer(1, 8)]
    out += sheet(extra)
    out += [Spacer(1, 10), Paragraph("CHECK YOURSELF — CIRCLE ONE", head)]
    for i, q in enumerate(extra["quiz"]):
        opts = shown(q["options"], position(number, i, len(q["options"])))
        letters = "ABCD"
        line = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;".join(f"{letters[k]}) {o}" for k, o in enumerate(opts))
        out += [Paragraph(f"{i + 1}. {q['q']}", body), Paragraph(line, small), Spacer(1, 5)]
    out += [Spacer(1, 6), Paragraph("Answers are on the website — tap them there to check.", note)]
    return out


def build(date):
    number = next(i for i, e in enumerate(EXTRAS, 1) if e["date"] == date)
    extra = EXTRAS[number - 1]
    slug = extra["title"].lower().replace(",", "").replace(" ", "-")
    path = HERE / f"{date}-extra-{slug}.pdf"
    doc = SimpleDocTemplate(str(path), pagesize=letter, leftMargin=0.5 * inch, rightMargin=0.5 * inch, topMargin=0.45 * inch, bottomMargin=0.45 * inch)
    doc.build(front(extra, number) + [PageBreak()] + back(extra, number))
    print(path)


for d in sys.argv[1:]:
    build(d)
