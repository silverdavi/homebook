"""
AWS Secrets Manager integration for Homebook.

Usage:
    from secrets import get_secrets

    secrets = get_secrets()
    openai_key = secrets['OPENAI_API_KEY']
"""

import json
import logging
import os
from functools import lru_cache
from typing import Dict

import boto3
from botocore.exceptions import ClientError


SECRET_NAME = "homebook/production"
REGION = "us-east-1"

logger = logging.getLogger(__name__)


def _env_fallback() -> Dict[str, str]:
    """Return secrets from environment variables."""
    return {
        "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY", ""),
        "GEMINI_API_KEY": os.getenv("GEMINI_API_KEY", ""),
        "AWS_ACCESS_KEY_ID": os.getenv("AWS_ACCESS_KEY_ID", ""),
        "AWS_SECRET_ACCESS_KEY": os.getenv("AWS_SECRET_ACCESS_KEY", ""),
    }


@lru_cache(maxsize=1)
def get_secrets() -> Dict[str, str]:
    """
    Fetch secrets from AWS Secrets Manager.

    In production, uses Secrets Manager with a fallback to environment
    variables if Secrets Manager is unavailable.
    In development, uses environment variables directly.

    Returns:
        Dict with keys: OPENAI_API_KEY, GEMINI_API_KEY, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
    """
    # Development: use environment variables
    if os.getenv("NODE_ENV") == "development" or os.getenv("USE_ENV_SECRETS"):
        logger.info("Using environment variables for secrets (dev mode)")
        return _env_fallback()

    # Production: fetch from Secrets Manager, fall back to env vars
    try:
        client = boto3.client("secretsmanager", region_name=REGION)
        response = client.get_secret_value(SecretId=SECRET_NAME)
        secret_string = response["SecretString"]
        logger.info("Loaded secrets from Secrets Manager")
        return json.loads(secret_string)
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        if error_code == "ResourceNotFoundException":
            logger.warning(
                "Secret '%s' not found in Secrets Manager, falling back to env vars",
                SECRET_NAME,
            )
        elif error_code == "AccessDeniedException":
            logger.warning(
                "Access denied to secret '%s', falling back to env vars",
                SECRET_NAME,
            )
        else:
            logger.warning("Secrets Manager error: %s, falling back to env vars", e)
        return _env_fallback()
    except Exception as e:
        logger.warning(
            "Unexpected error fetching secrets: %s, falling back to env vars", e
        )
        return _env_fallback()


def get_openai_key() -> str:
    """Get OpenAI API key."""
    return get_secrets()["OPENAI_API_KEY"]


def get_gemini_key() -> str:
    """Get Google Gemini API key."""
    return get_secrets()["GEMINI_API_KEY"]


# For testing
if __name__ == "__main__":
    secrets = get_secrets()
    print("Secrets loaded successfully!")
    print(f"  OPENAI_API_KEY: {'*' * 20}...{secrets['OPENAI_API_KEY'][-8:]}")
    print(f"  GEMINI_API_KEY: {'*' * 20}...{secrets['GEMINI_API_KEY'][-8:]}")
