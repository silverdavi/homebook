# GitHub Secrets Configuration

Configure these secrets in: **Settings → Secrets and variables → Actions**

## Required for CI

None - CI runs without secrets.

## Required for Frontend Deployment (Vercel)

| Secret | Description | How to get |
|--------|-------------|------------|
| `VERCEL_TOKEN` | Vercel API token | [Vercel Tokens](https://vercel.com/account/tokens) |

## Required for Generator Deployment (EC2)

| Secret | Description | How to get |
|--------|-------------|------------|
| `AWS_ACCESS_KEY_ID` | AWS access key | AWS IAM console |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | AWS IAM console |
| `EC2_HOST` | EC2 IP or hostname | `api.teacher.ninja` or EC2 console |
| `EC2_SSH_KEY` | Private SSH key | Your `~/.ssh/id_rsa` or EC2 key pair |

## Optional (for ECR approach)

| Secret | Description |
|--------|-------------|
| `ECR_REGISTRY` | ECR registry URL (e.g., `302249171798.dkr.ecr.us-east-1.amazonaws.com`) |

## How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its value

## Current AWS Account Info

- **Account ID:** 302249171798
- **Region:** us-east-1
- **S3 Bucket:** homebook-worksheets
- **IAM Role:** homebook-generator-role
- **Secrets Manager:** homebook/production
