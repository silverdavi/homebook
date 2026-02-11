# GitHub Secrets Configuration

Configure these secrets in: **Settings > Secrets and variables > Actions**

## Required for CI

None - CI runs without secrets.

## Required for Deployment (EC2)

| Secret | Description | How to get |
|--------|-------------|------------|
| `EC2_HOST` | EC2 IP address | EC2 console (currently `44.209.209.79`) |
| `EC2_SSH_KEY` | Private SSH key (PEM) | Your `homebook-key.pem` key pair |

## Optional (AWS — only needed if changing S3/Secrets Manager)

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key (keys are in `.env` on EC2, not needed for deploy) |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |

## How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add each secret with its value

## AWS Account Info

- **Account ID:** 302249171798
- **Region:** us-east-1
- **S3 Bucket:** homebook-worksheets
- **IAM Role:** homebook-generator-role
- **Secrets Manager:** homebook/production
