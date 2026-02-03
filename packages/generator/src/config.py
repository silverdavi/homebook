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

# CORS origins
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://44.209.209.79",
    "https://teacher.ninja",
    "https://www.teacher.ninja",
]
