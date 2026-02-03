"""Step-by-step math explanations for students.

Generates human-readable explanations for GCF, LCD, and simplification.
"""

import math
from typing import List, Tuple


def _factors(n: int) -> List[int]:
    """Return all factors of n in sorted order."""
    result = []
    for i in range(1, n + 1):
        if n % i == 0:
            result.append(i)
    return result


def _multiples(n: int, count: int = 10) -> List[int]:
    """Return the first `count` multiples of n."""
    return [n * i for i in range(1, count + 1)]


def explain_gcf(a: int, b: int) -> str:
    """Step-by-step GCF explanation for students.

    Example output:
        Factors of 12: 1, 2, 3, 4, 6, 12
        Factors of 18: 1, 2, 3, 6, 9, 18
        Common factors: 1, 2, 3, 6
        Greatest Common Factor (GCF) = 6
    """
    factors_a = _factors(a)
    factors_b = _factors(b)
    common = sorted(set(factors_a) & set(factors_b))
    gcf = math.gcd(a, b)

    lines = [
        f"Factors of {a}: {', '.join(str(f) for f in factors_a)}",
        f"Factors of {b}: {', '.join(str(f) for f in factors_b)}",
        f"Common factors: {', '.join(str(f) for f in common)}",
        f"Greatest Common Factor (GCF) = {gcf}",
    ]
    return "\n".join(lines)


def explain_lcd(a: int, b: int) -> str:
    """Step-by-step LCD explanation for students.

    Example output:
        Multiples of 4: 4, 8, 12, 16, 20, ...
        Multiples of 6: 6, 12, 18, 24, 30, ...
        Least Common Denominator (LCD) = 12
    """
    lcd = math.lcm(a, b)

    # Show enough multiples to include the LCD
    count_a = max(10, lcd // a + 2)
    count_b = max(10, lcd // b + 2)
    mult_a = _multiples(a, count_a)
    mult_b = _multiples(b, count_b)

    # Truncate display at a reasonable length
    show_a = [m for m in mult_a if m <= lcd + a][:8]
    show_b = [m for m in mult_b if m <= lcd + b][:8]

    lines = [
        f"Multiples of {a}: {', '.join(str(m) for m in show_a)}, ...",
        f"Multiples of {b}: {', '.join(str(m) for m in show_b)}, ...",
        f"Least Common Denominator (LCD) = {lcd}",
    ]
    return "\n".join(lines)


def explain_simplify(num: int, den: int) -> str:
    """Step-by-step simplification explanation.

    Example output:
        Start with 6/8
        Find GCF of 6 and 8:
          Factors of 6: 1, 2, 3, 6
          Factors of 8: 1, 2, 4, 8
          GCF = 2
        Divide both by GCF:
          6 ÷ 2 = 3
          8 ÷ 2 = 4
        Simplified: 3/4
    """
    gcf = math.gcd(num, den)
    simplified_num = num // gcf
    simplified_den = den // gcf

    lines = [
        f"Start with {num}/{den}",
        f"Find GCF of {num} and {den}:",
    ]

    factors_num = _factors(num)
    factors_den = _factors(den)

    lines.extend([
        f"  Factors of {num}: {', '.join(str(f) for f in factors_num)}",
        f"  Factors of {den}: {', '.join(str(f) for f in factors_den)}",
        f"  GCF = {gcf}",
        f"Divide both by GCF:",
        f"  {num} ÷ {gcf} = {simplified_num}",
        f"  {den} ÷ {gcf} = {simplified_den}",
        f"Simplified: {simplified_num}/{simplified_den}",
    ])
    return "\n".join(lines)


def explain_add_unlike(num1: int, den1: int, num2: int, den2: int) -> str:
    """Step-by-step explanation for adding unlike denominators."""
    lcd = math.lcm(den1, den2)
    eq1_num = num1 * (lcd // den1)
    eq2_num = num2 * (lcd // den2)
    result_num = eq1_num + eq2_num
    gcf = math.gcd(result_num, lcd)

    lines = [
        f"Add {num1}/{den1} + {num2}/{den2}",
        f"",
        f"Step 1: Find the LCD",
        explain_lcd(den1, den2),
        f"",
        f"Step 2: Convert to equivalent fractions",
        f"  {num1}/{den1} = {num1}×{lcd // den1}/{den1}×{lcd // den1} = {eq1_num}/{lcd}",
        f"  {num2}/{den2} = {num2}×{lcd // den2}/{den2}×{lcd // den2} = {eq2_num}/{lcd}",
        f"",
        f"Step 3: Add the numerators",
        f"  {eq1_num}/{lcd} + {eq2_num}/{lcd} = {result_num}/{lcd}",
    ]

    if gcf > 1:
        lines.extend([
            f"",
            f"Step 4: Simplify",
            f"  {result_num} ÷ {gcf} = {result_num // gcf}",
            f"  {lcd} ÷ {gcf} = {lcd // gcf}",
            f"  Answer: {result_num // gcf}/{lcd // gcf}",
        ])
    else:
        lines.append(f"  Answer: {result_num}/{lcd}")

    return "\n".join(lines)
