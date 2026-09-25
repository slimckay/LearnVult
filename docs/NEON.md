# Neon backup for LearnVult

Render will delete the free Postgres database on 25 October 2026.
Neon keeps a second copy so accounts and files are not lost.

## 1. Create the Neon project

1. Open https://console.neon.tech and sign in (GitHub is fine).
2. New project.
3. Name: `LearnVult`
4. Region: one close to you, or the default.
5. Create project.
6. On the dashboard, open **Connection details**.
7. Copy the connection string. Prefer the **direct** host (not `-pooler`) if both are shown.

It looks like:
`postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require`

Do not paste that password into chat.

## 2. Copy Render → Neon from your PC

Use Render **External Database URL** as the source. Neon cannot reach the Internal URL.

In VS Code, backend folder, venv on:

```powershell
cd C:\xampp\htdocs\learnvult\LearnVult\backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:SOURCE_DATABASE_URL="PASTE_RENDER_EXTERNAL_URL"
$env:DEST_DATABASE_URL="PASTE_NEON_URL"
python -m scripts.copy_db
```

You should see row counts for users, file_blobs, resources.

## 3. Point the live API at Neon

After the copy looks right:

1. Render → web service `learnvult` → Environment
2. Set `DATABASE_URL` to the Neon connection string
3. Save → Manual Deploy
4. Check https://learnvult.onrender.com/api/health
   It should still say `"database":"postgres"`.
5. Sign in on https://learn-vult.vercel.app and open a file you uploaded earlier.

The Render Postgres can then expire in October. Neon is the live database.

## 4. Refresh the backup later

If you ever move back to Render, run the same script with the URLs swapped.
