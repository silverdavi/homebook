"""S3 client for uploading and serving worksheet PDFs."""

import logging

import boto3
from botocore.exceptions import ClientError, NoCredentialsError, BotoCoreError

from .config import S3_BUCKET, S3_REGION, S3_URL_EXPIRY

logger = logging.getLogger(__name__)


def _get_client():
    """Create an S3 client.

    Tries explicit credentials from secrets first, then falls back
    to instance credentials (EC2 IAM role / environment variables).
    """
    try:
        from .secrets import get_secrets
        secrets = get_secrets()
        access_key = secrets.get("AWS_ACCESS_KEY_ID")
        secret_key = secrets.get("AWS_SECRET_ACCESS_KEY")

        if access_key and secret_key:
            logger.info("Using explicit AWS credentials from secrets")
            return boto3.client(
                "s3",
                region_name=S3_REGION,
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
            )
    except Exception as e:
        logger.warning("Could not load secrets for S3 credentials: %s", e)

    # Fall back to instance credentials (IAM role) or env vars
    logger.info("Using default AWS credential chain (IAM role / env vars)")
    return boto3.client("s3", region_name=S3_REGION)


def upload_pdf(pdf_bytes: bytes, worksheet_id: str) -> str:
    """Upload a PDF to S3 and return a pre-signed download URL.

    Args:
        pdf_bytes: The PDF file contents.
        worksheet_id: Unique worksheet identifier for the S3 key.

    Returns:
        Pre-signed URL for downloading the PDF.

    Raises:
        RuntimeError: If the upload or URL generation fails.
    """
    key = f"worksheets/{worksheet_id}.pdf"

    try:
        s3 = _get_client()
    except (NoCredentialsError, BotoCoreError) as e:
        logger.error("Failed to create S3 client: %s", e)
        raise RuntimeError(f"S3 client initialization failed: {e}") from e

    try:
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=pdf_bytes,
            ContentType="application/pdf",
        )
        logger.info("Uploaded PDF to s3://%s/%s", S3_BUCKET, key)
    except ClientError as e:
        logger.error("S3 upload failed: %s", e)
        raise RuntimeError(
            f"Failed to upload PDF to S3 bucket '{S3_BUCKET}': {e}"
        ) from e
    except NoCredentialsError as e:
        logger.error("No AWS credentials available for S3 upload: %s", e)
        raise RuntimeError(
            "No AWS credentials available. Ensure the EC2 instance has an "
            "IAM role with S3 access, or set AWS_ACCESS_KEY_ID and "
            "AWS_SECRET_ACCESS_KEY environment variables."
        ) from e

    try:
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET, "Key": key},
            ExpiresIn=S3_URL_EXPIRY,
        )
    except ClientError as e:
        logger.error("Failed to generate presigned URL: %s", e)
        raise RuntimeError(f"Failed to generate download URL: {e}") from e

    return url


def delete_pdf(worksheet_id: str) -> None:
    """Delete a PDF from S3.

    Args:
        worksheet_id: The worksheet identifier.
    """
    s3 = _get_client()
    key = f"worksheets/{worksheet_id}.pdf"
    s3.delete_object(Bucket=S3_BUCKET, Key=key)
