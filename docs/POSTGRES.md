# Keep LearnVult data after Render restarts

Your laptop still uses SQLite. Live Render must use PostgreSQL so accounts and files do not vanish when the free server sleeps.

## 1. Create a Postgres database on Render

1. Open https://dashboard.render.com
2. New + → PostgreSQL
3. Name: `learnvult-db`
4. Region: same region as the API (`learnvult`)
5. Plan: Free if you still have it, otherwise the cheapest Starter plan
6. Create Database
7. Wait until it says **Available**
8. Open the database → **Connections**
9. Copy **Internal Database URL**

It looks like:
`postgres://learnvult:...@dpg-xxxx-a/learnvult`

## 2. Point the API at that database

1. Open the web service `learnvult` (the API)
2. Environment
3. Find `DATABASE_URL`
4. Replace `sqlite:///./learnvult.db` with the Internal Database URL you copied
5. Save Changes
6. Manual Deploy → Deploy latest commit

Keep `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Those recreate the admin user in the new database.

## 3. Check it worked

Open:

https://learnvult.onrender.com/api/health

You want:

```json
{"status":"ok","app":"LearnVult","database":"postgres","files":"postgres"}
```

If it still says `sqlite`, the env var was not saved or the service was not redeployed.

## 4. What this changes

- New accounts stay after sleep/redeploy
- New uploads are stored inside Postgres, not on the throwaway disk
- Old files uploaded before this change may still be missing. Re-upload those once.
- Your PC is unchanged. Local `DATABASE_URL` can stay SQLite.

## 5. If Render free Postgres is gone

Use Neon (free): https://console.neon.tech

1. Create a project
2. Copy the connection string
3. Paste it as `DATABASE_URL` on the Render web service
4. Redeploy

Same health check as above.
