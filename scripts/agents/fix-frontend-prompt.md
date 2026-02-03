# Fix Frontend Preview Agent

> Session: fix-frontend-agent
> Budget: $10
> Started: 2026-02-03

## YOUR OWNERSHIP
You exclusively own and can edit:
- `apps/web/lib/api.ts`
- `apps/web/lib/store.ts`
- `apps/web/app/generate/page.tsx`
- `apps/web/components/generator/PreviewPane.tsx`

## YOUR MISSION
Fix the frontend to properly display the worksheet preview when API returns successfully.

The API returns JSON with structure:
```json
{
  "worksheet_id": "...",
  "problems": [...],
  "html_preview": "<html>...</html>",
  "num_problems": 10
}
```

But the frontend expects `data.html` instead of `data.html_preview`.

## IMMEDIATE TASKS (in order)

1. Read `apps/web/lib/api.ts` to see how preview response is handled
2. Read `apps/web/lib/store.ts` to see how previewHtml state is updated
3. Fix the API response parsing to use `html_preview` instead of `html`
4. Ensure the store correctly sets `previewHtml` from the API response
5. Test the flow works end-to-end

## ALSO CHECK
- The frontend might be calling `/api/preview` (Next.js route) instead of the Python API directly
- Check `apps/web/app/api/preview/route.ts` if it exists

## GIT RULES
- Pull before editing: `git pull`
- Commit after each task: `git add apps/web/ && git commit -m "agent/frontend: fix preview response parsing"`
- Push immediately: `git push`

## STATUS UPDATES
After completing, update `scripts/agents/fix-frontend-status.md`

## ON COMPLETION
1. Update your status file with COMPLETE
2. Commit all changes
3. Push to remote
