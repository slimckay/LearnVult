# One live site

LearnVult uses one GitHub repo and one public site.

- Test on your laptop (`localhost`)
- Host the website on Vercel
- Host the API on Render
- There is no separate demo project

## 1. Put the API online (Render)

1. Sign in at https://render.com with GitHub.
2. New Web Service → `slimckay/LearnVult`.
3. Root directory: `backend`
4. Build: `pip install -r requirements.txt`
5. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables:

```
SECRET_KEY=paste-a-long-random-string
CORS_ORIGINS=https://YOUR-VERCEL-URL.vercel.app
DATABASE_URL=sqlite:///./learnvult.db
```

7. Deploy. Open `https://YOUR-RENDER-URL.onrender.com/api/health`
   You should see `{"status":"ok","app":"LearnVult"}`.

Copy that Render URL. You need it for Vercel.

After Vercel gives you a URL, come back and set `CORS_ORIGINS` to that exact Vercel URL (no trailing slash), then redeploy the API.

## 2. Put the website online (Vercel)

1. Sign in at https://vercel.com with GitHub.
2. Add New Project → `slimckay/LearnVult`.
3. Root Directory: `frontend`
4. Framework: Vite
5. Build command: `npm run build`
6. Output directory: `dist`
7. Environment variable:

```
VITE_API_URL=https://YOUR-RENDER-URL.onrender.com
```

No trailing slash.

8. Deploy. Open the Vercel URL and log in.

If you connected auto-deploy, every push to `main` updates the live site. Turn that off in Vercel if you only want the site to change when you click Deploy.

## 3. First live login

The API still creates these accounts the first time it starts:

- teacher@learnvult.sl / Teacher123!
- student@learnvult.sl / Student123!

Change those passwords before you give the link to a school.

## Laptop vs live

Keep using VS Code as usual. Do not set `VITE_API_URL` on your PC unless you want the local website to talk to the live API.
