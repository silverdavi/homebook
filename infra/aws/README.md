# Homebook AWS Infrastructure

## Resources

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
- **CORS:** Configured for `teacher.ninja` and `localhost:3000`
- **Lifecycle:**
  - `worksheets/*` - Auto-delete after 7 days
  - `previews/*` - Auto-delete after 1 day

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

## Environment Modes

| Environment | Secret Source |
|-------------|---------------|
| Development | `.env` file |
| Production | `.env` file on EC2 (manually managed) |

## Cost Estimates

- **S3 Storage:** ~$0.023/GB/month (worksheets auto-delete after 7 days)
- **S3 Requests:** ~$0.0004 per 1000 GET requests
- **Expected monthly cost:** < $5 for moderate usage
