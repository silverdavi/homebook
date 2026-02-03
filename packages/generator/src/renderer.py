"""Jinja2 HTML renderer for worksheets."""

import logging
import os
from jinja2 import Environment, FileSystemLoader, select_autoescape

from .models import Worksheet, GeneratorConfig

logger = logging.getLogger(__name__)

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
    
    # Generate AI intro page if requested
    intro_html = ""
    if worksheet.config.include_intro_page:
        intro_html = _generate_intro_page(worksheet.config)

    try:
        template = env.get_template("worksheet.html")
    except Exception:
        # Fallback to built-in minimal template if no template file exists
        return _render_fallback(worksheet, intro_html)

    return template.render(
        worksheet=worksheet,
        config=worksheet.config,
        problems=worksheet.problems,
        intro_html=intro_html,
    )


def _generate_intro_page(config: GeneratorConfig) -> str:
    """Generate an AI-powered intro page explaining the topic."""
    try:
        from .llm_service import generate_intro_page
        
        intro_content = generate_intro_page(
            subject=config.topic,
            topic=config.topic,
            subtopic=config.subtopic,
            grade_level=config.grade_level,
            difficulty=config.difficulty.value,
        )
        
        return f'''
        <div class="intro-page page-break-after">
            <div class="intro-header">
                <h2>📚 Let's Learn!</h2>
            </div>
            <div class="intro-content">
                {intro_content}
            </div>
        </div>
        '''
    except Exception as e:
        logger.warning("Failed to generate intro page: %s", e)
        return ""  # Silent fail - worksheet still works without intro


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


def _render_fallback(worksheet: Worksheet, intro_html: str = "") -> str:
    """Minimal built-in template when no template file is available."""
    config = worksheet.config
    title = config.worksheet_title or f"{config.topic.title()} Worksheet - {config.subtopic.replace('-', ' ').title()}"

    problems_html = []
    for i, p in enumerate(worksheet.problems, 1):
        problem_block = f'<div class="problem"><span class="num">{i}.</span> {p.question_html}'
        if config.include_hints and p.hint:
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
        .page-break-after {{ page-break-after: always; }}
        .intro-page {{ padding: 20px; background: #f8fafc; border-radius: 8px; margin-bottom: 30px; }}
        .intro-header h2 {{ color: #4f46e5; margin-bottom: 15px; }}
        .intro-content {{ line-height: 1.6; }}
        .intro-content h2, .intro-content h3 {{ color: #1e293b; margin-top: 15px; }}
        .intro-content .key-concept {{ background: #e0e7ff; padding: 12px; border-radius: 6px; margin: 10px 0; }}
        .intro-content .worked-example {{ background: #fef3c7; padding: 12px; border-radius: 6px; margin: 10px 0; }}
        .punnett-square {{ border-collapse: collapse; margin: 10px 0; }}
        .punnett-square th, .punnett-square td {{ border: 1px solid #333; padding: 8px 12px; text-align: center; }}
        .punnett-square th {{ background: #e5e7eb; }}
        .chemical-equation {{ font-family: 'Times New Roman', serif; font-size: 1.2em; }}
        @media print {{ body {{ margin: 20px; }} }}
    </style>
</head>
<body>
    {intro_html}
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
