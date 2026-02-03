#!/usr/bin/env python3
"""
Render sample worksheets to HTML for visual testing.

Usage:
    cd packages/generator/templates
    python tests/render_samples.py

Outputs HTML files in tests/output/ that can be opened in a browser
or converted to PDF with WeasyPrint.
"""

import os
import sys
from pathlib import Path

try:
    from jinja2 import Environment, FileSystemLoader
except ImportError:
    print("ERROR: Jinja2 is required. Install with: pip install Jinja2")
    sys.exit(1)

TEMPLATE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = Path(__file__).parent / "output"


def get_env():
    return Environment(
        loader=FileSystemLoader(str(TEMPLATE_DIR)),
        autoescape=False,
    )


def fraction_html(num, den):
    """Helper to generate fraction HTML."""
    return (
        f'<span class="fraction">'
        f'<span class="fraction-numerator">{num}</span>'
        f'<span class="fraction-denominator">{den}</span>'
        f'</span>'
    )


def mixed_html(whole, num, den):
    """Helper to generate mixed number HTML."""
    return (
        f'<span class="mixed-number">'
        f'<span class="mixed-whole">{whole}</span>'
        f'{fraction_html(num, den)}'
        f'</span>'
    )


def render_simple():
    """Test 1: Simple fraction addition - 10 problems, no visuals."""
    env = get_env()
    template = env.get_template("worksheet.html")

    problems = [
        {"question_html": f"{fraction_html(1,4)} + {fraction_html(1,4)} = <span class='answer-line'></span>", "answer_text": "1/2"},
        {"question_html": f"{fraction_html(2,5)} + {fraction_html(1,5)} = <span class='answer-line'></span>", "answer_text": "3/5"},
        {"question_html": f"{fraction_html(3,8)} + {fraction_html(1,8)} = <span class='answer-line'></span>", "answer_text": "1/2"},
        {"question_html": f"{fraction_html(1,3)} + {fraction_html(1,6)} = <span class='answer-line'></span>", "answer_text": "1/2"},
        {"question_html": f"{fraction_html(2,7)} + {fraction_html(3,7)} = <span class='answer-line'></span>", "answer_text": "5/7"},
        {"question_html": f"{fraction_html(1,2)} + {fraction_html(1,4)} = <span class='answer-line'></span>", "answer_text": "3/4"},
        {"question_html": f"{fraction_html(3,10)} + {fraction_html(1,5)} = <span class='answer-line'></span>", "answer_text": "1/2"},
        {"question_html": f"{fraction_html(5,12)} + {fraction_html(1,12)} = <span class='answer-line'></span>", "answer_text": "1/2"},
        {"question_html": f"{fraction_html(2,9)} + {fraction_html(1,3)} = <span class='answer-line'></span>", "answer_text": "5/9"},
        {"question_html": f"{fraction_html(1,6)} + {fraction_html(1,3)} = <span class='answer-line'></span>", "answer_text": "1/2"},
    ]

    html = template.render(
        title="Fraction Addition",
        subtitle="Add the fractions. Simplify your answer.",
        problems=problems,
        include_answer_key=False,
    )

    return "01_simple.html", html


def render_with_hints():
    """Test 2: 10 problems with hints."""
    env = get_env()
    template = env.get_template("worksheet.html")

    problems = [
        {
            "question_html": f"{fraction_html(1,3)} + {fraction_html(1,6)} = <span class='answer-line'></span>",
            "hint": "The LCD of 3 and 6 is 6. Convert 1/3 to ?/6.",
            "answer_text": "1/2",
        },
        {
            "question_html": f"{fraction_html(2,5)} + {fraction_html(1,10)} = <span class='answer-line'></span>",
            "hint": "The LCD of 5 and 10 is 10. Convert 2/5 to ?/10.",
            "answer_text": "1/2",
        },
        {
            "question_html": f"{fraction_html(1,4)} + {fraction_html(1,3)} = <span class='answer-line'></span>",
            "hint": "The LCD of 4 and 3 is 12.",
            "answer_text": "7/12",
        },
        {
            "question_html": f"{fraction_html(3,8)} + {fraction_html(1,4)} = <span class='answer-line'></span>",
            "hint": "The LCD of 8 and 4 is 8. Convert 1/4 to ?/8.",
            "answer_text": "5/8",
        },
        {
            "question_html": f"{fraction_html(2,3)} + {fraction_html(1,6)} = <span class='answer-line'></span>",
            "hint": "The LCD of 3 and 6 is 6.",
            "answer_text": "5/6",
        },
        {
            "question_html": f"{fraction_html(1,2)} + {fraction_html(1,5)} = <span class='answer-line'></span>",
            "hint": "The LCD of 2 and 5 is 10.",
            "answer_text": "7/10",
        },
        {
            "question_html": f"{fraction_html(3,4)} + {fraction_html(1,6)} = <span class='answer-line'></span>",
            "hint": "The LCD of 4 and 6 is 12.",
            "answer_text": "11/12",
        },
        {
            "question_html": f"{fraction_html(5,8)} + {fraction_html(1,4)} = <span class='answer-line'></span>",
            "hint": "The LCD of 8 and 4 is 8.",
            "answer_text": "7/8",
        },
        {
            "question_html": f"{fraction_html(1,3)} + {fraction_html(2,9)} = <span class='answer-line'></span>",
            "hint": "The LCD of 3 and 9 is 9.",
            "answer_text": "5/9",
        },
        {
            "question_html": f"{fraction_html(1,4)} + {fraction_html(5,12)} = <span class='answer-line'></span>",
            "hint": "The LCD of 4 and 12 is 12.",
            "answer_text": "2/3",
        },
    ]

    html = template.render(
        title="Fraction Addition (Unlike Denominators)",
        subtitle="Find the LCD, then add. Simplify your answer.",
        show_lcd_reference=True,
        problems=problems,
        include_answer_key=False,
    )

    return "02_with_hints.html", html


def render_with_visuals():
    """Test 3: 10 problems with fraction bar SVGs."""
    env = get_env()
    template = env.get_template("worksheet.html")
    bar_template = env.get_template("visuals/fraction_bar.html")

    def make_bar(num, den):
        return bar_template.render(numerator=num, denominator=den)

    problems = [
        {
            "question_html": f"{fraction_html(1,4)} + {fraction_html(2,4)} = <span class='answer-line'></span>",
            "visual_svg": make_bar(1, 4) + make_bar(2, 4),
            "answer_text": "3/4",
        },
        {
            "question_html": f"{fraction_html(2,6)} + {fraction_html(1,6)} = <span class='answer-line'></span>",
            "visual_svg": make_bar(2, 6) + make_bar(1, 6),
            "answer_text": "1/2",
        },
        {
            "question_html": f"{fraction_html(3,8)} + {fraction_html(2,8)} = <span class='answer-line'></span>",
            "visual_svg": make_bar(3, 8) + make_bar(2, 8),
            "answer_text": "5/8",
        },
        {
            "question_html": f"{fraction_html(1,5)} + {fraction_html(3,5)} = <span class='answer-line'></span>",
            "visual_svg": make_bar(1, 5) + make_bar(3, 5),
            "answer_text": "4/5",
        },
        {
            "question_html": f"{fraction_html(2,3)} + {fraction_html(1,3)} = <span class='answer-line'></span>",
            "visual_svg": make_bar(2, 3) + make_bar(1, 3),
            "answer_text": "1",
        },
        {
            "question_html": f"{fraction_html(1,8)} + {fraction_html(5,8)} = <span class='answer-line'></span>",
            "visual_svg": make_bar(1, 8) + make_bar(5, 8),
            "answer_text": "3/4",
        },
        {
            "question_html": f"{fraction_html(4,10)} + {fraction_html(3,10)} = <span class='answer-line'></span>",
            "visual_svg": make_bar(4, 10) + make_bar(3, 10),
            "answer_text": "7/10",
        },
        {
            "question_html": f"{fraction_html(1,6)} + {fraction_html(3,6)} = <span class='answer-line'></span>",
            "visual_svg": make_bar(1, 6) + make_bar(3, 6),
            "answer_text": "2/3",
        },
        {
            "question_html": f"{fraction_html(2,5)} + {fraction_html(2,5)} = <span class='answer-line'></span>",
            "visual_svg": make_bar(2, 5) + make_bar(2, 5),
            "answer_text": "4/5",
        },
        {
            "question_html": f"{fraction_html(3,4)} + {fraction_html(1,4)} = <span class='answer-line'></span>",
            "visual_svg": make_bar(3, 4) + make_bar(1, 4),
            "answer_text": "1",
        },
    ]

    html = template.render(
        title="Fraction Addition with Models",
        subtitle="Use the fraction bars to help you add. Simplify your answer.",
        problems=problems,
        include_answer_key=False,
    )

    return "03_with_visuals.html", html


def render_full_featured():
    """Test 4: Full featured - hints, visuals, worked examples, answer key."""
    env = get_env()
    template = env.get_template("worksheet.html")
    bar_template = env.get_template("visuals/fraction_bar.html")

    def make_bar(num, den):
        return bar_template.render(numerator=num, denominator=den)

    problems = [
        {
            "question_html": f"{fraction_html(1,3)} + {fraction_html(1,6)} = <span class='answer-line'></span>",
            "hint": "The LCD of 3 and 6 is 6.",
            "visual_svg": make_bar(2, 6) + make_bar(1, 6),
            "worked_solution": "Step 1: Find LCD of 3 and 6 → LCD = 6\nStep 2: Convert 1/3 = 2/6\nStep 3: Add 2/6 + 1/6 = 3/6\nStep 4: Simplify 3/6 = 1/2",
            "answer_text": "1/2",
        },
        {
            "question_html": f"{fraction_html(2,5)} + {fraction_html(1,10)} = <span class='answer-line'></span>",
            "hint": "The LCD of 5 and 10 is 10.",
            "answer_text": "1/2",
        },
        {
            "question_html": f"{fraction_html(1,4)} + {fraction_html(1,3)} = <span class='answer-line'></span>",
            "hint": "The LCD of 4 and 3 is 12.",
            "worked_solution": "Step 1: Find LCD of 4 and 3 → LCD = 12\nStep 2: Convert 1/4 = 3/12 and 1/3 = 4/12\nStep 3: Add 3/12 + 4/12 = 7/12\nStep 4: 7/12 is already simplified",
            "answer_text": "7/12",
        },
        {
            "question_html": f"{fraction_html(3,8)} + {fraction_html(1,4)} = <span class='answer-line'></span>",
            "hint": "The LCD of 8 and 4 is 8.",
            "visual_svg": make_bar(3, 8) + make_bar(2, 8),
            "answer_text": "5/8",
        },
        {
            "question_html": f"{fraction_html(2,3)} + {fraction_html(1,6)} = <span class='answer-line'></span>",
            "answer_text": "5/6",
        },
        {
            "question_html": f"{mixed_html(1, 1, 2)} + {fraction_html(3,4)} = <span class='answer-line'></span>",
            "hint": "Convert the mixed number to an improper fraction first: 1 1/2 = 3/2.",
            "answer_text": "2 1/4",
        },
        {
            "question_html": f"{fraction_html(3,4)} + {fraction_html(1,6)} = <span class='answer-line'></span>",
            "hint": "The LCD of 4 and 6 is 12.",
            "answer_text": "11/12",
        },
        {
            "question_html": f"{fraction_html(5,8)} + {fraction_html(1,4)} = <span class='answer-line'></span>",
            "visual_svg": make_bar(5, 8) + make_bar(2, 8),
            "answer_text": "7/8",
        },
        {
            "question_html": f"{fraction_html(1,3)} + {fraction_html(2,9)} = <span class='answer-line'></span>",
            "answer_text": "5/9",
        },
        {
            "question_html": f"{fraction_html(1,4)} + {fraction_html(5,12)} = <span class='answer-line'></span>",
            "hint": "The LCD of 4 and 12 is 12.",
            "worked_solution": "Step 1: Find LCD of 4 and 12 → LCD = 12\nStep 2: Convert 1/4 = 3/12\nStep 3: Add 3/12 + 5/12 = 8/12\nStep 4: Simplify 8/12 = 2/3 (GCF is 4)",
            "answer_text": "2/3",
        },
    ]

    html = template.render(
        title="Fraction Addition Practice",
        subtitle="Unlike denominators - Find the LCD, convert, add, simplify.",
        date="2026-02-03",
        show_lcd_reference=True,
        problems=problems,
        include_answer_key=True,
    )

    return "04_full_featured.html", html


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    tests = [render_simple, render_with_hints, render_with_visuals, render_full_featured]

    for test_fn in tests:
        filename, html = test_fn()
        output_path = OUTPUT_DIR / filename
        output_path.write_text(html, encoding="utf-8")
        print(f"  Rendered: {output_path}")

    print(f"\nAll {len(tests)} samples rendered to {OUTPUT_DIR}/")
    print("Open in a browser to preview, or use WeasyPrint to convert to PDF.")


if __name__ == "__main__":
    main()
