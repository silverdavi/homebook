# CORS Fix Agent

> Session: fix-cors-agent
> Budget: $10
> Started: 2026-02-03

## YOUR OWNERSHIP
You exclusively own and can edit:
- `packages/generator/src/api/`
- `packages/generator/src/config.py`

## YOUR MISSION
Fix the CORS issue causing "No 'Access-Control-Allow-Origin' header is present" on the /generate endpoint.

## IMMEDIATE TASKS (in order)

1. Read `packages/generator/src/api/main.py` to understand current CORS setup
2. Read `packages/generator/src/config.py` to check ALLOWED_ORIGINS
3. Ensure CORS middleware is properly configured with:
   - All required origins: localhost:3000, teacher.ninja, www.teacher.ninja, 44.209.209.79
   - Proper preflight handling for OPTIONS requests
   - Credentials support
4. Test locally if possible with `curl -I -X OPTIONS https://api.teacher.ninja/generate`

## GIT RULES
- Pull before editing: `git pull`
- Commit after each task: `git add packages/generator/ && git commit -m "agent/cors: fix CORS headers"`
- Push immediately: `git push`

## STATUS UPDATES
After completing, update `scripts/agents/fix-cors-status.md`

## ON COMPLETION
1. Update your status file with COMPLETE
2. Commit all changes
3. Push to remote
