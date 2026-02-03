# Homebook AWS Infrastructure

## Resources Created

### AWS Secrets Manager: `homebook/production`
- **ARN:** `arn:aws:secretsmanager:us-east-1:302249171798:secret:homebook/production-j0MxNI`
- **Contains:**
  - `OPENAI_API_KEY` - OpenAI API key for word problem generation
  - `GEMINI_API_KEY` - Google Gemini API key
  - `AWS_ACCESS_KEY_ID` - AWS credentials for S3 access
  - `AWS_SECRET_ACCESS_KEY` - AWS secret key

### S3 Bucket: `homebook-worksheets`
- **Region:** us-east-1
- **Purpose:** Store generated PDF worksheets
- **CORS:** Configured for localhost:3000 and *.vercel.app
- **Lifecycle:**
  - `worksheets/*` → Auto-delete after 7 days
  - `previews/*` → Auto-delete after 1 day

### IAM Role: `homebook-generator-role`
- **ARN:** `arn:aws:iam::302249171798:role/homebook-generator-role`
- **Can be assumed by:** Lambda, EC2
- **Permissions:**
  - S3: PutObject, GetObject, DeleteObject, ListBucket on `homebook-worksheets`
  - CloudWatch Logs: CreateLogGroup, CreateLogStream, PutLogEvents

## Usage

### Generate Pre-signed URL (Python)

```python
import boto3
from datetime import timedelta

s3 = boto3.client('s3', region_name='us-east-1')

# Upload PDF
s3.put_object(
    Bucket='homebook-worksheets',
    Key='worksheets/uuid-here.pdf',
    Body=pdf_bytes,
    ContentType='application/pdf'
)

# Generate download URL (expires in 1 hour)
url = s3.generate_presigned_url(
    'get_object',
    Params={'Bucket': 'homebook-worksheets', 'Key': 'worksheets/uuid-here.pdf'},
    ExpiresIn=3600
)
```

### From Next.js API Route (TypeScript)

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: 'us-east-1' });

// Upload
await s3.send(new PutObjectCommand({
  Bucket: 'homebook-worksheets',
  Key: `worksheets/${worksheetId}.pdf`,
  Body: pdfBuffer,
  ContentType: 'application/pdf',
}));

// Get signed URL
const url = await getSignedUrl(s3, new GetObjectCommand({
  Bucket: 'homebook-worksheets',
  Key: `worksheets/${worksheetId}.pdf`,
}), { expiresIn: 3600 });
```

## Files

| File | Purpose |
|------|---------|
| `homebook-lambda-policy.json` | IAM policy for S3 + CloudWatch access |
| `lambda-trust-policy.json` | Trust policy allowing Lambda/EC2 to assume role |
| `secrets-policy.json` | IAM policy for Secrets Manager access |
| `s3-cors.json` | CORS configuration for browser downloads |
| `s3-lifecycle.json` | Auto-delete old files to control costs |

## Secrets Manager Usage

### Python (Generator Service)

```python
from secrets import get_secrets, get_openai_key

# Get all secrets
secrets = get_secrets()
openai_key = secrets['OPENAI_API_KEY']

# Or use helper
openai_key = get_openai_key()
```

### CLI (Testing)

```bash
# Fetch secrets
aws secretsmanager get-secret-value \
  --secret-id homebook/production \
  --query 'SecretString' \
  --output text

# Update a secret
aws secretsmanager put-secret-value \
  --secret-id homebook/production \
  --secret-string '{"OPENAI_API_KEY": "new-key", ...}'
```

### Environment Modes

| Environment | Secret Source |
|-------------|---------------|
| Development (`NODE_ENV=development`) | `.env` file |
| Production | AWS Secrets Manager |

## Cost Estimates

- **S3 Storage:** ~$0.023/GB/month (worksheets auto-delete after 7 days)
- **S3 Requests:** ~$0.0004 per 1000 GET requests
- **Expected monthly cost:** < $5 for moderate usage
