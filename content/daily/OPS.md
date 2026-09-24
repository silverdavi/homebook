# Homeschool ops — teacher.ninja/daily

Read this before building a day, deploying, or sending a morning email.
The family folder only points here. The product lives in this repo.

**Student:** Yerachmiel (Adam), `yersilver@gmail.com`
**From:** `Dad <dad@dichotomies.me>`
**Cc:** `silverdavi@gmail.com`, `enny412@gmail.com`
**Page:** `https://teacher.ninja/daily/<YYYY-MM-DD>`
**Site:** teacher.ninja, Next.js on EC2 `ubuntu@44.209.209.79`, app dir `/home/ubuntu/homebook`
**SSH:** `ssh -i ~/.ssh/homebook-key.pem ubuntu@44.209.209.79`

He opens the page, studies alone, picks exam A or B. One attempt per version. The site grades it and stores it in `apps/web/.data/profiles.db` on the server. Parents do not coach during the block. A note on a question is how he talks back.

## Where the two folders fit

| | Path | Use it for |
|---|---|---|
| Product | `/Users/davidsilver/dev/commercial/homebook` | Days, exams, emails, deploy |
| Family record | `/Users/davidsilver/dev/family/adam/08-homeschool-loi-2026-09-18/` | LOI, IHIP, quarterly logs. Not the daily page. |

Either chat can do the work. The files that matter are in homebook.

## A day is four files

1. `content/daily/day-YYYY-MM-DD.md` — the brief he reads.
2. `apps/web/lib/daily/content/day-YYYY-MM-DD.ts` — version A and version B, built from the banks in `content/banks/`. Register it in `apps/web/lib/daily/week.ts`.
3. `apps/web/__tests__/smoke/send-dayN-kickoff.mjs` — the morning email. The ISO date must appear in the file (the page URL is enough). Dry-run with no flag. Send with `--send`.
4. Style: `.cursor/rules/email-style.mdc`. Short, one card, one link, no emoji.

`npx vitest run __tests__/daily/all-days.test.ts` from `apps/web` grades every question. Do that before pushing.

## Deploy

Push to `main`. `.github/workflows/deploy-frontend.yml` runs when the commit touches `apps/web/**`, `content/daily/**`, or the workflow file. The job SSHs in, `git reset --hard origin/main`, `npm ci`, `npm run build`, `sudo systemctl restart homebook-web`.

Check it:

```bash
gh run list --repo silverdavi/homebook --workflow "Deploy Frontend" --limit 3
curl -sf -o /dev/null -w "%{http_code}\n" https://teacher.ninja/daily/YYYY-MM-DD
```

A markdown-only edit still deploys, because `content/daily/**` is in the path filter. Secrets (`RESEND_API_KEY` and the rest) are rewritten on the server from GitHub secrets on every deploy. Do not hand-edit `.env` on the box and expect it to stick.

## Morning email — one standing job

`scripts/daily-morning.sh` looks up today's New York date, finds the kickoff script that mentions it, and sends it. A stamp in `~/.daily-kickoff/<date>` stops a second send. No script for that date (weekend, holiday, day not written) exits quietly.

**Arm it in one place.** Two armed jobs send two emails.

### On the server (this is the one that is armed)

```bash
sudo cp /home/ubuntu/homebook/infra/systemd/daily-kickoff.service /etc/systemd/system/
sudo cp /home/ubuntu/homebook/infra/systemd/daily-kickoff.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now daily-kickoff.timer
systemctl list-timers daily-kickoff.timer
```

Weekdays 8:50 AM America/New_York. `Persistent=true` runs it after a reboot if 8:50 was missed. Log: `/home/ubuntu/daily-kickoff.log`.

### On this Mac (only if the server timer is off)

```bash
cp /Users/davidsilver/dev/commercial/homebook/infra/launchd/me.dichotomies.daily-kickoff.plist ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/me.dichotomies.daily-kickoff.plist
```

Same clock, weekdays 8:50. Log: `~/Library/Logs/daily-kickoff.log`. Unload with `launchctl bootout gui/$(id -u)/me.dichotomies.daily-kickoff`.

Cron does the same job if launchd is unwanted. Only one of the three.

```cron
50 8 * * 1-5 /bin/bash /Users/davidsilver/dev/commercial/homebook/scripts/daily-morning.sh >> "$HOME/Library/Logs/daily-kickoff.log" 2>&1
```

Send by hand, from `apps/web`:

```bash
node __tests__/smoke/send-dayN-kickoff.mjs          # dry run
node __tests__/smoke/send-dayN-kickoff.mjs --send   # dispatch
```

Last spring each day was a one-shot `systemd-run --on-calendar=...` unit (`day7-kickoff`, `day10-kickoff`, …). Those units do not survive as a system. The standing timer replaced them. Do not add another `dayN-kickoff` timer.

## Clock he is on (from 24 Sep 2026)

2 hours 30 minutes of work. A 20-minute break, no phone, after every 40 minutes. Exam 12:30–1:00. Phones off until 1:30.

## What the May–June trial was

Twenty days, 12 May–12 Jun 2026. GCF, LCM, four fraction operations, inverses, times tables through 15×15, periodic table H–Ar, valence, 15 wars, peace dates, evolution timeline. The leaks he was still missing in June: valence off by one or two, the last addition on a two-digit multiply, Westphalia **1648**, Versailles **1919**. Days 21–22 (24–25 Sep 2026) review that. They do not add a subject.
