# CORS Fix Agent - Status: COMPLETE

> Agent: fix-cors-agent
> Date: 2026-02-03
> Commit: adab6c7

## Root Cause Analysis

The CORS error ("No 'Access-Control-Allow-Origin' header is present") had **two contributing causes**:

### 1. Duplicate CORS headers (Nginx + FastAPI)
- **Nginx** (`infra/nginx/api.conf`) hardcoded `Access-Control-Allow-Origin: "https://teacher.ninja"` on all responses
- **FastAPI** (`packages/generator/src/api/main.py`) also added CORS headers via `CORSMiddleware`
- Browsers reject responses with multiple `Access-Control-Allow-Origin` headers

### 2. Nginx intercepted OPTIONS preflight
- Nginx returned `204` for all OPTIONS requests with only `https://teacher.ninja` as the allowed origin
- FastAPI's CORSMiddleware never got to handle preflight requests
- Requests from `https://www.teacher.ninja` or `http://44.209.209.79` were rejected at the Nginx level

## Changes Made

### `infra/nginx/api.conf`
- Removed all CORS headers (`Access-Control-Allow-Origin`, `Allow-Methods`, `Allow-Headers`, `Max-Age`)
- Removed the `if ($request_method = 'OPTIONS')` block that short-circuited preflight
- Added comment explaining CORS is handled by FastAPI CORSMiddleware
- Nginx now purely proxies to FastAPI without modifying CORS headers

### `packages/generator/src/config.py`
- Added `https://44.209.209.79` to `ALLOWED_ORIGINS` (was only `http://`)

## How It Works Now
- FastAPI `CORSMiddleware` handles all CORS negotiation (preflight + actual requests)
- Supports multiple origins dynamically (responds with the matching origin)
- Supports credentials (`Access-Control-Allow-Credentials: true`)
- No duplicate headers since Nginx no longer adds CORS headers

## Deployment Note
After deploying, the Nginx config on the EC2 instance must be updated:
```bash
sudo cp infra/nginx/api.conf /etc/nginx/sites-available/api.teacher.ninja
sudo nginx -t && sudo systemctl reload nginx
```
