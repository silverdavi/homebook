"""SVG fraction visualizations.

Generates inline SVG fraction bars for worksheets.
All SVGs are self-contained strings with no external dependencies.
"""

from fractions import Fraction


# Color palette for fraction bars
COLORS = {
    "filled": "#4A90D9",
    "empty": "#E8E8E8",
    "border": "#333333",
    "filled_alt": "#E67E22",
    "result": "#27AE60",
    "text": "#333333",
}


def _format_label(frac: Fraction) -> str:
    """Format a Fraction as a display label.

    Returns '1' instead of '1/1', '3' instead of '3/1', etc.
    """
    if frac.denominator == 1:
        return str(frac.numerator)
    return f"{frac.numerator}/{frac.denominator}"


def create_fraction_bar(
    fraction: Fraction,
    width: int = 200,
    height: int = 30,
    color: str = COLORS["filled"],
) -> str:
    """Create an SVG of a fraction bar.

    The bar is divided into `denominator` equal segments,
    with `numerator` segments filled.

    Args:
        fraction: The fraction to visualize.
        width: Total width of the bar in pixels.
        height: Height of the bar in pixels.
        color: Fill color for shaded segments.

    Returns:
        SVG string.
    """
    num = fraction.numerator
    den = fraction.denominator

    # Handle whole numbers — show as a fully filled bar
    if den == 1:
        den = max(num, 1)
        num = den  # fully filled

    segment_width = width / den
    padding = 2
    total_height = height + 20  # extra space for label

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'width="{width + padding * 2}" height="{total_height}" '
        f'viewBox="0 0 {width + padding * 2} {total_height}">'
    ]

    # Draw segments
    for i in range(den):
        x = padding + i * segment_width
        fill = color if i < num else COLORS["empty"]
        parts.append(
            f'<rect x="{x:.1f}" y="0" '
            f'width="{segment_width:.1f}" height="{height}" '
            f'fill="{fill}" stroke="{COLORS["border"]}" stroke-width="1"/>'
        )

    # Label below
    label = _format_label(fraction)
    parts.append(
        f'<text x="{width / 2 + padding}" y="{height + 15}" '
        f'text-anchor="middle" font-size="12" '
        f'font-family="sans-serif" fill="{COLORS["text"]}">'
        f'{label}</text>'
    )

    parts.append("</svg>")
    return "\n".join(parts)


def create_addition_visual(
    frac1: Fraction,
    frac2: Fraction,
    width: int = 200,
    bar_height: int = 30,
) -> str:
    """Create SVG showing fraction addition with bars.

    Shows three bars stacked vertically:
    1. First fraction
    2. Second fraction (different color)
    3. Result on common denominator

    Args:
        frac1: First fraction.
        frac2: Second fraction.
        width: Width of each bar.
        bar_height: Height of each bar.

    Returns:
        SVG string.
    """
    import math

    result = frac1 + frac2
    lcd = math.lcm(frac1.denominator, frac2.denominator)

    # Convert to LCD for display
    eq1 = Fraction(frac1.numerator * (lcd // frac1.denominator), lcd)
    eq2 = Fraction(frac2.numerator * (lcd // frac2.denominator), lcd)

    spacing = 15
    label_height = 20
    row_height = bar_height + label_height + spacing
    total_height = row_height * 3 + 30  # 3 rows + operator labels
    padding = 2
    label_x = width + padding + 10

    total_width = width + padding * 2 + 60  # extra for labels

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'width="{total_width}" height="{total_height}" '
        f'viewBox="0 0 {total_width} {total_height}">'
    ]

    # --- Row 1: frac1 ---
    y_offset = 0
    segment_w = width / frac1.denominator
    for i in range(frac1.denominator):
        x = padding + i * segment_w
        fill = COLORS["filled"] if i < frac1.numerator else COLORS["empty"]
        parts.append(
            f'<rect x="{x:.1f}" y="{y_offset}" '
            f'width="{segment_w:.1f}" height="{bar_height}" '
            f'fill="{fill}" stroke="{COLORS["border"]}" stroke-width="1"/>'
        )
    parts.append(
        f'<text x="{label_x}" y="{y_offset + bar_height / 2 + 5}" '
        f'font-size="14" font-family="sans-serif" fill="{COLORS["text"]}">'
        f'{_format_label(frac1)}</text>'
    )

    # Plus sign
    plus_y = y_offset + bar_height + spacing / 2 + 5
    parts.append(
        f'<text x="{padding}" y="{plus_y}" '
        f'font-size="16" font-weight="bold" font-family="sans-serif" '
        f'fill="{COLORS["text"]}">+</text>'
    )

    # --- Row 2: frac2 ---
    y_offset = row_height
    segment_w = width / frac2.denominator
    for i in range(frac2.denominator):
        x = padding + i * segment_w
        fill = COLORS["filled_alt"] if i < frac2.numerator else COLORS["empty"]
        parts.append(
            f'<rect x="{x:.1f}" y="{y_offset}" '
            f'width="{segment_w:.1f}" height="{bar_height}" '
            f'fill="{fill}" stroke="{COLORS["border"]}" stroke-width="1"/>'
        )
    parts.append(
        f'<text x="{label_x}" y="{y_offset + bar_height / 2 + 5}" '
        f'font-size="14" font-family="sans-serif" fill="{COLORS["text"]}">'
        f'{_format_label(frac2)}</text>'
    )

    # Equals line
    eq_y = y_offset + bar_height + spacing / 2 + 5
    parts.append(
        f'<text x="{padding}" y="{eq_y}" '
        f'font-size="16" font-weight="bold" font-family="sans-serif" '
        f'fill="{COLORS["text"]}">=</text>'
    )

    # --- Row 3: Result on LCD ---
    y_offset = row_height * 2
    result_num = eq1.numerator + eq2.numerator

    # If result is a whole number, show it as a fully filled bar
    if result.denominator == 1:
        # Whole number result — show as N segments all filled
        display_den = max(lcd, result.numerator)
        segment_w = width / display_den
        for i in range(display_den):
            x = padding + i * segment_w
            if i < eq1.numerator:
                fill = COLORS["filled"]
            elif i < result_num:
                fill = COLORS["filled_alt"]
            else:
                fill = COLORS["empty"]
            parts.append(
                f'<rect x="{x:.1f}" y="{y_offset}" '
                f'width="{segment_w:.1f}" height="{bar_height}" '
                f'fill="{fill}" stroke="{COLORS["border"]}" stroke-width="1"/>'
            )
    else:
        segment_w = width / lcd
        for i in range(lcd):
            x = padding + i * segment_w
            if i < eq1.numerator:
                fill = COLORS["filled"]
            elif i < result_num:
                fill = COLORS["filled_alt"]
            else:
                fill = COLORS["empty"]
            parts.append(
                f'<rect x="{x:.1f}" y="{y_offset}" '
                f'width="{segment_w:.1f}" height="{bar_height}" '
                f'fill="{fill}" stroke="{COLORS["border"]}" stroke-width="1"/>'
            )

    result_label = _format_label(result)
    parts.append(
        f'<text x="{label_x}" y="{y_offset + bar_height / 2 + 5}" '
        f'font-size="14" font-weight="bold" font-family="sans-serif" '
        f'fill="{COLORS["result"]}">'
        f'{result_label}</text>'
    )

    parts.append("</svg>")
    return "\n".join(parts)


def create_comparison_visual(
    frac1: Fraction,
    frac2: Fraction,
    width: int = 200,
    bar_height: int = 30,
) -> str:
    """Create SVG showing two fraction bars side by side for comparison.

    Args:
        frac1: First fraction.
        frac2: Second fraction.
        width: Width of each bar.
        bar_height: Height of each bar.

    Returns:
        SVG string.
    """
    spacing = 10
    padding = 2
    total_height = bar_height * 2 + spacing + 40
    total_width = width + padding * 2 + 60

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'width="{total_width}" height="{total_height}" '
        f'viewBox="0 0 {total_width} {total_height}">'
    ]

    label_x = width + padding + 10

    # Bar 1
    segment_w = width / frac1.denominator
    for i in range(frac1.denominator):
        x = padding + i * segment_w
        fill = COLORS["filled"] if i < frac1.numerator else COLORS["empty"]
        parts.append(
            f'<rect x="{x:.1f}" y="0" '
            f'width="{segment_w:.1f}" height="{bar_height}" '
            f'fill="{fill}" stroke="{COLORS["border"]}" stroke-width="1"/>'
        )
    parts.append(
        f'<text x="{label_x}" y="{bar_height / 2 + 5}" '
        f'font-size="14" font-family="sans-serif" fill="{COLORS["text"]}">'
        f'{_format_label(frac1)}</text>'
    )

    # Bar 2
    y2 = bar_height + spacing
    segment_w = width / frac2.denominator
    for i in range(frac2.denominator):
        x = padding + i * segment_w
        fill = COLORS["filled_alt"] if i < frac2.numerator else COLORS["empty"]
        parts.append(
            f'<rect x="{x:.1f}" y="{y2}" '
            f'width="{segment_w:.1f}" height="{bar_height}" '
            f'fill="{fill}" stroke="{COLORS["border"]}" stroke-width="1"/>'
        )
    parts.append(
        f'<text x="{label_x}" y="{y2 + bar_height / 2 + 5}" '
        f'font-size="14" font-family="sans-serif" fill="{COLORS["text"]}">'
        f'{_format_label(frac2)}</text>'
    )

    parts.append("</svg>")
    return "\n".join(parts)
