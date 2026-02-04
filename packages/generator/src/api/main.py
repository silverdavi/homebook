"""FastAPI server for the Homebook generator."""

import base64
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field, field_validator

logger = logging.getLogger(__name__)

from ..config import ALLOWED_ORIGINS
from ..models import (
    Difficulty,
    GeneratorConfig,
    Worksheet,
    WordProblemConfig,
)
from ..generators.registry import get_generator
from ..renderer import render_worksheet

app = FastAPI(
    title="Homebook Generator API",
    description="Generates math worksheets with exact arithmetic.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request/Response models ---

class GeneratorConfigRequest(BaseModel):
    topic: str = "fractions"
    subtopic: str = "add-unlike-denom"
    num_problems: int = Field(default=10, ge=1, le=30)
    difficulty: str = "medium"

    include_hints: bool = False
    include_worked_examples: bool = False
    include_visuals: bool = True
    include_answer_key: bool = True
    show_lcd_reference: bool = False
    include_intro_page: bool = False  # AI-generated intro page

    max_denominator: int = Field(default=12, ge=2, le=20)
    allow_improper: bool = False
    require_simplification: bool = True

    student_name: Optional[str] = None
    worksheet_title: Optional[str] = None
    teacher_name: Optional[str] = None
    date: Optional[str] = None
    grade_level: int = 5

    # Word problem settings
    include_word_problems: bool = False
    word_problem_ratio: float = Field(default=0.3, ge=0.0, le=1.0)
    word_problem_context: str = Field(default="mixed")

    @field_validator('word_problem_context')
    @classmethod
    def validate_context(cls, v):
        valid_contexts = ['cooking', 'sports', 'shopping', 'school', 'mixed']
        if v not in valid_contexts:
            raise ValueError(f'word_problem_context must be one of {valid_contexts}')
        return v


class ProblemResponse(BaseModel):
    id: str
    question_text: str
    question_html: str
    answer_text: str
    hint: Optional[str] = None
    worked_solution: Optional[str] = None
    visual_svg: Optional[str] = None
    subtopic: str
    difficulty: str


class PreviewResponse(BaseModel):
    worksheet_id: str
    problems: List[ProblemResponse]
    html_preview: str
    num_problems: int


class GenerateResponse(BaseModel):
    worksheet_id: str
    pdf_url: str
    num_problems: int


# --- Helpers ---

def _to_config(req: GeneratorConfigRequest) -> GeneratorConfig:
    """Convert API request to internal GeneratorConfig."""
    # Build word problem config if enabled
    word_problem_config = None
    if req.include_word_problems:
        word_problem_config = WordProblemConfig(
            enabled=True,
            context_type=req.word_problem_context,
            word_problem_ratio=req.word_problem_ratio,
        )

    return GeneratorConfig(
        topic=req.topic,
        subtopic=req.subtopic,
        num_problems=req.num_problems,
        difficulty=Difficulty(req.difficulty),
        include_hints=req.include_hints,
        include_worked_examples=req.include_worked_examples,
        include_visuals=req.include_visuals,
        include_answer_key=req.include_answer_key,
        show_lcd_reference=req.show_lcd_reference,
        include_intro_page=req.include_intro_page,
        word_problem_config=word_problem_config,
        max_denominator=req.max_denominator,
        allow_improper=req.allow_improper,
        require_simplification=req.require_simplification,
        student_name=req.student_name,
        worksheet_title=req.worksheet_title,
        teacher_name=req.teacher_name,
        date=req.date,
        grade_level=req.grade_level,
    )


def _generate_worksheet(config: GeneratorConfig) -> Worksheet:
    """Generate a worksheet from config."""
    generator = get_generator(config.topic)
    if generator is None:
        raise HTTPException(status_code=400, detail=f"Unknown topic: {config.topic}")

    if not generator.supports(config.subtopic):
        raise HTTPException(
            status_code=400,
            detail=f"Unknown subtopic '{config.subtopic}' for topic '{config.topic}'",
        )

    problems = generator.generate(config)
    worksheet_id = uuid.uuid4().hex[:16]

    worksheet = Worksheet(
        id=worksheet_id,
        config=config,
        problems=problems,
        html_content="",
        created_at=datetime.now(timezone.utc).isoformat(),
    )

    worksheet.html_content = render_worksheet(worksheet)
    return worksheet


# --- Routes ---

@app.get("/health")
def health():
    """Health check endpoint with LLM availability info."""
    # Check if LLM is configured (required for word problems and intro pages)
    llm_available = bool(os.environ.get("OPENAI_API_KEY"))

    return {
        "status": "ok",
        "service": "homebook-generator",
        "llm_available": llm_available,
        "features": {
            "word_problems": llm_available,
            "intro_pages": llm_available,
        }
    }


@app.post("/preview", response_model=PreviewResponse)
def preview(req: GeneratorConfigRequest):
    """Generate problems and return an HTML preview."""
    config = _to_config(req)
    worksheet = _generate_worksheet(config)

    problems = [
        ProblemResponse(
            id=p.id,
            question_text=p.question_text,
            question_html=p.question_html,
            answer_text=p.answer_text,
            hint=p.hint,
            worked_solution=p.worked_solution,
            visual_svg=p.visual_svg,
            subtopic=p.subtopic,
            difficulty=p.difficulty.value,
        )
        for p in worksheet.problems
    ]

    return PreviewResponse(
        worksheet_id=worksheet.id,
        problems=problems,
        html_preview=worksheet.html_content,
        num_problems=len(problems),
    )


@app.post("/preview/html", response_class=HTMLResponse)
def preview_html(req: GeneratorConfigRequest):
    """Generate problems and return raw HTML for iframe embedding."""
    config = _to_config(req)
    worksheet = _generate_worksheet(config)
    return HTMLResponse(content=worksheet.html_content)


@app.post("/generate", response_model=GenerateResponse)
def generate(req: GeneratorConfigRequest):
    """Generate a full PDF worksheet and upload to S3."""
    config = _to_config(req)
    worksheet = _generate_worksheet(config)

    # Lazy import to avoid requiring WeasyPrint/boto3 for preview-only usage
    from ..pdf_generator import generate_pdf

    try:
        pdf_bytes = generate_pdf(worksheet.html_content)
    except RuntimeError as e:
        logger.error("PDF generation failed for worksheet %s: %s", worksheet.id, e)
        raise HTTPException(status_code=500, detail=str(e))

    # Upload to S3 - fail if upload fails (never fall back silently)
    try:
        from ..s3_client import upload_pdf
        pdf_url = upload_pdf(pdf_bytes, worksheet.id)
    except Exception as e:
        logger.error(
            "S3 upload failed for worksheet %s: %s",
            worksheet.id,
            e,
        )
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to upload PDF to storage: {e}"
        )

    return GenerateResponse(
        worksheet_id=worksheet.id,
        pdf_url=pdf_url,
        num_problems=len(worksheet.problems),
    )


@app.get("/topics")
def list_topics():
    """List all available topics and subtopics."""
    from ..generators.registry import get_all_generators

    result = {}
    for topic, gen in get_all_generators().items():
        result[topic] = gen.subtopics
    return result


@app.get("/cache/stats")
def cache_stats():
    """Get LLM cache statistics for monitoring."""
    from ..llm_service import get_llm_cache_stats
    
    stats = get_llm_cache_stats()
    return {
        "cache": stats,
        "message": f"Cache hit rate: {stats['hit_rate']}% ({stats['hits']}/{stats['total']} requests)"
    }


@app.post("/cache/clear-expired")
def clear_expired_cache():
    """Clear expired cache entries. Admin endpoint."""
    from ..cache import clear_expired_cache as do_clear
    
    removed = do_clear()
    return {
        "removed": removed,
        "message": f"Cleared {removed} expired cache entries"
    }
