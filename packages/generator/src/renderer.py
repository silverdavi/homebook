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

    Raises:
        jinja2.TemplateNotFound: If worksheet.html template is missing.
        jinja2.TemplateError: If the template has syntax errors.
    """
    env = _get_env()

    # Generate AI intro page if requested
    intro_html = ""
    if worksheet.config.include_intro_page:
        intro_html = _generate_intro_page(worksheet.config)

    template = env.get_template("worksheet.html")

    return template.render(
        worksheet=worksheet,
        config=worksheet.config,
        problems=worksheet.problems,
        intro_html=intro_html,
    )


def _generate_intro_page(config: GeneratorConfig) -> str:
    """Generate an AI-powered intro page explaining the topic.

    Raises RuntimeError if the LLM service fails.
    """
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
            <h2>Let's Learn!</h2>
        </div>
        <div class="intro-content">
            {intro_content}
        </div>
    </div>
    '''


def render_answer_key(worksheet: Worksheet) -> str:
    """Render the answer key for a worksheet.

    Args:
        worksheet: The Worksheet object.

    Returns:
        HTML string for the answer key.

    Raises:
        jinja2.TemplateNotFound: If answer_key.html template is missing.
    """
    env = _get_env()
    template = env.get_template("answer_key.html")

    return template.render(
        worksheet=worksheet,
        config=worksheet.config,
        problems=worksheet.problems,
    )
