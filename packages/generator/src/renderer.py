"""Jinja2 HTML renderer for worksheets."""

import os
from jinja2 import Environment, FileSystemLoader, select_autoescape

from .models import Worksheet, GeneratorConfig

# Template directory
TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "..", "templates")


def _get_env() -> Environment:
    """Create and return a Jinja2 environment."""
    return Environment(
        loader=FileSystemLoader(TEMPLATE_DIR),
        autoescape=select_autoescape(["html"]),
    )


def render_worksheet(worksheet: Worksheet) -> str:
    """Render a worksheet to HTML using Jinja2 templates.

    Args:
        worksheet: The Worksheet object with problems and config.

    Returns:
        Complete HTML string ready for PDF conversion.
    """
    env = _get_env()

    try:
        template = env.get_template("worksheet.html")
    except Exception:
        # Fallback to built-in minimal template if no template file exists
        return _render_fallback(worksheet)

    return template.render(
        worksheet=worksheet,
        config=worksheet.config,
        problems=worksheet.problems,
    )


def render_answer_key(worksheet: Worksheet) -> str:
    """Render the answer key for a worksheet.

    Args:
        worksheet: The Worksheet object.

    Returns:
        HTML string for the answer key.
    """
    env = _get_env()

    try:
        template = env.get_template("answer_key.html")
    except Exception:
        return _render_answer_key_fallback(worksheet)

    return template.render(
        worksheet=worksheet,
        config=worksheet.config,
        problems=worksheet.problems,
    )


def _render_fallback(worksheet: Worksheet) -> str:
    """Minimal built-in template when no template file is available."""
    config = worksheet.config
    title = config.worksheet_title or f"Fractions Worksheet - {config.subtopic}"

    problems_html = []
    for i, p in enumerate(worksheet.problems, 1):
        problem_block = f'<div class="problem"><span class="num">{i}.</span> {p.question_html}'
        if p.hint:
            problem_block += f'<div class="hint">Hint: {p.hint}</div>'
        if p.visual_svg:
            problem_block += f'<div class="visual">{p.visual_svg}</div>'
        problem_block += '<div class="answer-line"></div></div>'
        problems_html.append(problem_block)

    answer_key_html = ""
    if config.include_answer_key:
        answers = [f"<li>{i}. {p.answer_text}</li>" for i, p in enumerate(worksheet.problems, 1)]
        answer_key_html = f"""
        <div class="answer-key page-break">
            <h2>Answer Key</h2>
            <ol>{''.join(answers)}</ol>
        </div>
        """

    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{title}</title>
    <style>
        body {{ font-family: 'Helvetica Neue', Arial, sans-serif; margin: 40px; color: #333; }}
        h1 {{ text-align: center; font-size: 24px; margin-bottom: 5px; }}
        .meta {{ text-align: center; color: #666; margin-bottom: 30px; font-size: 14px; }}
        .problem {{ margin-bottom: 24px; padding: 12px 0; border-bottom: 1px dotted #ddd; }}
        .num {{ font-weight: bold; margin-right: 8px; }}
        .frac {{ display: inline-block; text-align: center; vertical-align: middle; }}
        .frac sup {{ display: block; font-size: 1em; border-bottom: 1px solid #333; padding: 0 4px; }}
        .frac sub {{ display: block; font-size: 1em; padding: 0 4px; }}
        .frac .bar {{ display: none; }}
        .hint {{ color: #888; font-style: italic; font-size: 13px; margin-top: 4px; }}
        .visual {{ margin-top: 8px; }}
        .answer-line {{ margin-top: 12px; width: 150px; border-bottom: 1px solid #333; }}
        .answer-key {{ margin-top: 40px; }}
        .page-break {{ page-break-before: always; }}
        @media print {{ body {{ margin: 20px; }} }}
    </style>
</head>
<body>
    <h1>{title}</h1>
    <div class="meta">
        {f'<span>Name: {config.student_name}</span> | ' if config.student_name else ''}
        {f'<span>{config.date}</span>' if config.date else ''}
    </div>
    {''.join(problems_html)}
    {answer_key_html}
</body>
</html>"""


def _render_answer_key_fallback(worksheet: Worksheet) -> str:
    """Minimal answer key template."""
    answers = [f"<li>{i}. {p.answer_text}</li>" for i, p in enumerate(worksheet.problems, 1)]
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Answer Key</title></head>
<body>
    <h1>Answer Key</h1>
    <ol>{''.join(answers)}</ol>
</body>
</html>"""
