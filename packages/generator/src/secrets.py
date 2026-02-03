"""
AWS Secrets Manager integration for Homebook.

Usage:
    from secrets import get_secrets
    
    secrets = get_secrets()
    openai_key = secrets['OPENAI_API_KEY']
"""

import json
import os
from functools import lru_cache
from typing import Dict

import boto3
from botocore.exceptions import ClientError


SECRET_NAME = "homebook/production"
REGION = "us-east-1"


@lru_cache(maxsize=1)
def get_secrets() -> Dict[str, str]:
    """
    Fetch secrets from AWS Secrets Manager.
    
    In production, uses Secrets Manager.
    In development, falls back to environment variables.
    
    Returns:
        Dict with keys: OPENAI_API_KEY, GEMINI_API_KEY, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
    """
    # Development: use environment variables
    if os.getenv("NODE_ENV") == "development" or os.getenv("USE_ENV_SECRETS"):
        return {
            "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY", ""),
            "GEMINI_API_KEY": os.getenv("GEMINI_API_KEY", ""),
            "AWS_ACCESS_KEY_ID": os.getenv("AWS_ACCESS_KEY_ID", ""),
            "AWS_SECRET_ACCESS_KEY": os.getenv("AWS_SECRET_ACCESS_KEY", ""),
        }
    
    # Production: fetch from Secrets Manager
    try:
        client = boto3.client("secretsmanager", region_name=REGION)
        response = client.get_secret_value(SecretId=SECRET_NAME)
        secret_string = response["SecretString"]
        return json.loads(secret_string)
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        if error_code == "ResourceNotFoundException":
            raise RuntimeError(f"Secret '{SECRET_NAME}' not found in Secrets Manager")
        elif error_code == "AccessDeniedException":
            raise RuntimeError(f"Access denied to secret '{SECRET_NAME}'. Check IAM permissions.")
        else:
            raise RuntimeError(f"Error fetching secret: {e}")


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
