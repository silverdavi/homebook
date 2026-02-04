"""Generator service configuration."""

import os

# S3 Configuration
S3_BUCKET = os.getenv("S3_BUCKET", "homebook-worksheets")
S3_REGION = os.getenv("S3_REGION", "us-east-1")
S3_URL_EXPIRY = int(os.getenv("S3_URL_EXPIRY", "3600"))  # 1 hour

# PDF settings
PDF_PAGE_SIZE = "letter"

# Generator defaults
DEFAULT_NUM_PROBLEMS = 10
MAX_PROBLEMS_PER_SHEET = 30

# Cache Configuration
CACHE_DIR = os.getenv("CACHE_DIR", "/tmp/homebook_cache")
LLM_CACHE_TTL_DAYS = int(os.getenv("LLM_CACHE_TTL_DAYS", "7"))

# Cache TTL by content type (in hours)
# Intro pages change rarely, so cache longer
CACHE_INTRO_PAGE_TTL_HOURS = int(os.getenv("CACHE_INTRO_PAGE_TTL_HOURS", "168"))  # 1 week
# Word problems can be cached shorter since context varies
CACHE_WORD_PROBLEM_TTL_HOURS = int(os.getenv("CACHE_WORD_PROBLEM_TTL_HOURS", "24"))  # 1 day

# Memory cache limits
CACHE_MAX_MEMORY_ENTRIES = int(os.getenv("CACHE_MAX_MEMORY_ENTRIES", "1000"))

# CORS origins
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://44.209.209.79",
    "https://44.209.209.79",
    "https://teacher.ninja",
    "https://www.teacher.ninja",
]
