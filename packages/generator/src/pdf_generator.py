"""PDF generation using WeasyPrint."""

import logging

logger = logging.getLogger(__name__)


def generate_pdf(html_content: str) -> bytes:
    """Convert HTML to PDF using WeasyPrint.

    Args:
        html_content: Complete HTML string to convert.

    Returns:
        PDF file contents as bytes.

    Raises:
        RuntimeError: If WeasyPrint is not installed or PDF generation fails.
    """
    try:
        from weasyprint import HTML
    except ImportError as e:
        logger.error("WeasyPrint is not installed: %s", e)
        raise RuntimeError(
            "PDF generation is unavailable: WeasyPrint is not installed. "
            "Install it with: pip install weasyprint"
        ) from e

    try:
        html = HTML(string=html_content)
        pdf_bytes = html.write_pdf()
    except Exception as e:
        logger.error("WeasyPrint PDF generation failed: %s", e)
        raise RuntimeError(f"PDF generation failed: {e}") from e

    if not pdf_bytes:
        raise RuntimeError("PDF generation returned empty content")

    logger.info("PDF generated successfully (%d bytes)", len(pdf_bytes))
    return pdf_bytes
