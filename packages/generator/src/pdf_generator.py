"""PDF generation using WeasyPrint."""

from weasyprint import HTML


def generate_pdf(html_content: str) -> bytes:
    """Convert HTML to PDF using WeasyPrint.

    Args:
        html_content: Complete HTML string to convert.

    Returns:
        PDF file contents as bytes.
    """
    html = HTML(string=html_content)
    return html.write_pdf()
