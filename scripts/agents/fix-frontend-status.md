# Fix Frontend Preview Agent - Status

**Status:** COMPLETE
**Date:** 2026-02-03

## What was fixed

**File:** `apps/web/lib/api.ts` (line 17)
**Change:** `data.html` → `data.html_preview`

The Python API returns the worksheet HTML in `html_preview`, but the frontend was reading `data.html` (which is `undefined`). This caused the PreviewPane to always show the placeholder instead of the generated worksheet.

## Files changed
- `apps/web/lib/api.ts` — fixed response field name

## Verification
- `store.ts` — no changes needed, `setPreviewHtml` works correctly once it receives the actual HTML string
- `PreviewPane.tsx` — no changes needed, renders correctly when `html` prop is truthy
- `app/api/preview/route.ts` — passes through the Python API response unchanged, no changes needed
- `app/generate/page.tsx` — calls `generatePreview()` and stores result via `setPreviewHtml()`, no changes needed
