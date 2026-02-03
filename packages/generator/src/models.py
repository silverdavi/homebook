"""Core data models for the Homebook generator."""

from dataclasses import dataclass, field
from fractions import Fraction
from typing import Optional, List, Dict, Any
from enum import Enum


class Difficulty(Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    MIXED = "mixed"


# Denominator pools by difficulty
DIFFICULTY_DENOMINATORS = {
    Difficulty.EASY: [2, 3, 4, 5, 6],
    Difficulty.MEDIUM: [2, 3, 4, 5, 6, 8, 10],
    Difficulty.HARD: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
}


@dataclass
class Problem:
    """Base problem class."""
    id: str
    question_text: str
    question_html: str
    answer: Any
    answer_text: str
    hint: Optional[str] = None
    worked_solution: Optional[str] = None
    visual_svg: Optional[str] = None
    topic: str = ""
    subtopic: str = ""
    difficulty: Difficulty = Difficulty.MEDIUM
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class FractionProblem(Problem):
    """Fraction-specific problem with LCD/GCF info."""
    lcd: Optional[int] = None
    gcf: Optional[int] = None
    equivalent_fractions: Optional[Dict[str, str]] = None


@dataclass
class GeneratorConfig:
    """Configuration for worksheet generation."""
    topic: str
    subtopic: str
    num_problems: int = 10
    difficulty: Difficulty = Difficulty.MEDIUM

    # Options
    include_hints: bool = False
    include_worked_examples: bool = False
    include_visuals: bool = True
    include_answer_key: bool = True
    show_lcd_reference: bool = False
    include_intro_page: bool = False  # AI-generated intro page

    # Constraints
    max_denominator: int = 12
    allow_improper: bool = False
    require_simplification: bool = True

    # Personalization
    student_name: Optional[str] = None
    worksheet_title: Optional[str] = None
    teacher_name: Optional[str] = None
    date: Optional[str] = None
    grade_level: int = 5


@dataclass
class Worksheet:
    """Generated worksheet."""
    id: str
    config: GeneratorConfig
    problems: List[Problem]
    html_content: str
    pdf_url: Optional[str] = None
    created_at: Optional[str] = None
