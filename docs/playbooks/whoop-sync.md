# When the fitness dashboard stops updating

The dashboard at `/apps/fitness-dashboard` reads WHOOP data from Postgres. One job
puts it there: `.github/workflows/cron-daily-data-fetch.yml` calls
`/api/cron/daily-data-fetch` every day at 19:17 UTC.

## How the fetch decides what to read and store

The rules live in `src/lib/services/whoop-daily-sync.ts`.

- A run reads from midnight (UTC) two days ago. If the newest stored recovery is
  older than that, a run was missed, and it reads from a day before that recovery.
  The first run after an outage therefore refills all of it.
- Recoveries are stored oldest first, and a run stops at the first one it cannot
  store. Nothing newer is stored after it, so the next run reads it again.
- It stores finished days only. The cycle a person is in has no end yet, so its
  recovery waits for a later run (`waiting` in the answer).
- A user whose data could not be stored makes the endpoint answer 500, and the
  scheduled run fails. GitHub emails the owner of a failed scheduled run.

## Check

```bash
# Did the schedule fire, and did the runs pass?
gh run list --workflow cron-daily-data-fetch.yml --limit 10

# What did the newest run store? (the log prints counts and errors, no names)
gh run view <run id> --log

# Is the site up and can it reach the database?
curl -s https://www.camilomartinez.co/api/health
```

## Fix

| What you see | What to do |
|---|---|
| No scheduled runs for days, workflow still "active" | GitHub stopped firing the schedule. `gh workflow disable cron-daily-data-fetch.yml`, then `gh workflow enable cron-daily-data-fetch.yml`. If it still does not fire at the next 19:17 UTC, change the minute of the `cron:` line in a commit to `main`: a commit that changes the schedule reactivates it. |
| Workflow state `disabled_inactivity` | GitHub disables schedules in a public repository after 60 days without a commit. `gh workflow enable cron-daily-data-fetch.yml`. |
| Runs fail with a WHOOP 400 or 401 | The WHOOP refresh token expired. Sign in with WHOOP again on the site. |
| Runs pass but days are missing behind newer data | Refill from the first missing day: `gh workflow run cron-daily-data-fetch.yml -f since=2026-08-07`. Storing is an upsert, so a refill can be repeated. |

After any fix, start a run by hand with `gh workflow run cron-daily-data-fetch.yml`,
read its log, and reload the dashboard: the newest square in the strain calendar
should be yesterday or the day before.

## What happened in 2026

Every scheduled workflow of this account stopped firing on 8 August 2026, in this
repository and in others, while each still showed as "active". Nothing ran, so
nothing failed and nothing was reported. Another repository resumed five days later,
after a commit to its workflow files. This one had no such commit, and the dashboard
stood still until 27 November. The cause on GitHub's side was not found.
