# LearnVult

Offline educational resource sharing for secondary schools in low-connectivity areas in Sierra Leone.

Teachers upload and organise notes, past papers, and other materials. Students browse, download, and keep using those files when the internet drops. When a connection returns, the app syncs in the background.

Open the **LearnVult** folder in VS Code and follow [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md).

There is **one live site**. Test on your laptop, then host the website on Vercel and the API on Render. See [docs/GO_LIVE.md](docs/GO_LIVE.md).

## Project layout

```
LearnVult/
├── backend/          FastAPI API, database, file storage, sync queue
├── frontend/         React (Vite) app
├── docs/             Architecture and setup notes
└── .vscode/          Recommended VS Code settings
```

## Quick start

Two terminals in VS Code.

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Demo accounts (created on first backend start):

- Teacher: `teacher@learnvult.sl` / `Teacher123!`
- Student: `student@learnvult.sl` / `Student123!`

## Live hosting

One GitHub repo. One public website.

1. Deploy `backend/` to Render.
2. Deploy `frontend/` to Vercel.
3. Set `VITE_API_URL` on Vercel to the Render URL.
4. Set `CORS_ORIGINS` on Render to the Vercel URL.

Full clicks: [docs/GO_LIVE.md](docs/GO_LIVE.md).
