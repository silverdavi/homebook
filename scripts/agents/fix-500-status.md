# Fix 500 Error Agent - Status

> Status: COMPLETE
> Completed: 2026-02-03

## Changes Made

### 1. `packages/generator/src/api/main.py` — /generate endpoint
- Added try/catch around PDF generation with proper HTTP 500 response
- Added try/catch around S3 upload with **base64 data URL fallback** — if S3 fails, the PDF is returned inline as a `data:application/pdf;base64,...` URL so the user still gets their worksheet
- Added logging throughout

### 2. `packages/generator/src/pdf_generator.py`
- Made WeasyPrint import lazy with a clear error message if not installed
- Wrapped `write_pdf()` in try/catch with descriptive `RuntimeError`
- Added validation that PDF bytes are non-empty

### 3. `packages/generator/src/s3_client.py`
- Changed `_get_client()` to try explicit credentials first, then fall back to **default AWS credential chain** (EC2 IAM role / env vars)
- Previously: always passed explicit keys from Secrets Manager (which could be `None`, breaking boto3)
- Now: if secrets fail or keys are empty, uses `boto3.client("s3")` which picks up IAM role automatically
- Added detailed error handling for `put_object`, `generate_presigned_url`, and credential errors

### 4. `packages/generator/src/secrets.py`
- Changed Secrets Manager failures from **hard crashes** (`raise RuntimeError`) to **graceful fallbacks** to environment variables
- This was the likely root cause: on EC2, if the IAM role didn't have Secrets Manager access, the entire `/generate` call would crash with no useful error
- Now logs a warning and returns env vars instead

## Root Cause Analysis
The 500 error was caused by a cascading failure:
1. `secrets.py` tried to access AWS Secrets Manager
2. The EC2 IAM role either didn't have `secretsmanager:GetSecretValue` permission, or the secret `homebook/production` didn't exist
3. `secrets.py` raised a `RuntimeError` which was uncaught
4. The `/generate` endpoint had no try/catch, so FastAPI returned a raw 500

## Commit
`1478dd5` — `agent/generator: fix 500 error on /generate endpoint`
