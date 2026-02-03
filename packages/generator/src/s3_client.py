"""S3 client for uploading and serving worksheet PDFs."""

import boto3
from botocore.exceptions import ClientError

from .config import S3_BUCKET, S3_REGION, S3_URL_EXPIRY
from .secrets import get_secrets


def _get_client():
    """Create an S3 client using stored credentials."""
    secrets = get_secrets()
    return boto3.client(
        "s3",
        region_name=S3_REGION,
        aws_access_key_id=secrets.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=secrets.get("AWS_SECRET_ACCESS_KEY"),
    )


def upload_pdf(pdf_bytes: bytes, worksheet_id: str) -> str:
    """Upload a PDF to S3 and return a pre-signed download URL.

    Args:
        pdf_bytes: The PDF file contents.
        worksheet_id: Unique worksheet identifier for the S3 key.

    Returns:
        Pre-signed URL for downloading the PDF.
    """
    s3 = _get_client()
    key = f"worksheets/{worksheet_id}.pdf"

    s3.put_object(
        Bucket=S3_BUCKET,
        Key=key,
        Body=pdf_bytes,
        ContentType="application/pdf",
    )

    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": S3_BUCKET, "Key": key},
        ExpiresIn=S3_URL_EXPIRY,
    )
    return url


def delete_pdf(worksheet_id: str) -> None:
    """Delete a PDF from S3.

    Args:
        worksheet_id: The worksheet identifier.
    """
    s3 = _get_client()
    key = f"worksheets/{worksheet_id}.pdf"
    s3.delete_object(Bucket=S3_BUCKET, Key=key)
