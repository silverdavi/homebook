# Fix 500 Error Agent

> Session: fix-500-agent
> Budget: $15
> Started: 2026-02-03

## YOUR OWNERSHIP
You exclusively own and can edit:
- `packages/generator/src/pdf_generator.py`
- `packages/generator/src/s3_client.py`
- `packages/generator/src/secrets.py`
- `packages/generator/src/api/main.py` (only the /generate endpoint)

## YOUR MISSION
Fix the 500 Internal Server Error on POST /generate endpoint. The error likely comes from:
1. WeasyPrint PDF generation failing
2. S3 upload failing (missing credentials or bucket)
3. Secrets Manager access failing

## IMMEDIATE TASKS (in order)

1. Read `packages/generator/src/api/main.py` to understand the /generate route
2. Read `packages/generator/src/pdf_generator.py` to check WeasyPrint usage
3. Read `packages/generator/src/s3_client.py` to check S3 upload
4. Read `packages/generator/src/secrets.py` to check credentials handling
5. Add proper error handling and fallbacks:
   - If S3 fails, return a local file URL or base64 PDF
   - If PDF generation fails, return a helpful error message
   - Add try/catch with detailed logging
6. Make the /generate endpoint more robust by:
   - Catching exceptions and returning 400/500 with error details
   - Adding environment variable fallbacks for AWS credentials
   - Using instance credentials if available (EC2 IAM role)

## TECHNICAL NOTES
- EC2 instance may have IAM role attached - try using instance credentials
- S3 bucket exists: `homebook-worksheets` in us-east-1
- WeasyPrint requires system fonts and libraries to be installed

## GIT RULES
- Pull before editing: `git pull`
- Commit after each task: `git add packages/generator/ && git commit -m "agent/generator: fix 500 error on generate"`
- Push immediately: `git push`

## STATUS UPDATES
After completing, update `scripts/agents/fix-500-status.md`

## ON COMPLETION
1. Update your status file with COMPLETE
2. Commit all changes
3. Push to remote
