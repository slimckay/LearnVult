# Getting started in VS Code

```bash
git clone https://github.com/slimckay/LearnVult.git
cd LearnVult
code .
```

Install Python 3.11+, Node.js LTS, Git, and VS Code.

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Frontend (new terminal):

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173
API docs: http://localhost:8000/docs
