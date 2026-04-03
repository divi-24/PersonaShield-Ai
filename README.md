# PersonaShield AI

> AI-powered identity protection platform that detects deepfake content and verifies identity using face recognition, voice matching, and AI reasoning.

![PersonaShield AI](https://img.shields.io/badge/AI-Deepfake%20Detection-purple) ![Stack](https://img.shields.io/badge/Stack-React%20%2B%20FastAPI-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## 🛡️ Problem

Deepfake technology is advancing rapidly, making it easier to create convincing fake videos, images, and audio. This poses serious threats to identity verification, legal proceedings, and personal privacy. Organizations and individuals need tools to detect manipulated media and verify authentic identities.

## 💡 Solution

PersonaShield AI provides a multi-modal identity verification and deepfake detection platform that:

- **Detects deepfakes** using AI image classification models
- **Verifies identity** through face embedding matching and voice print analysis
- **Generates professional reports** with confidence scores and AI-powered explanations
- **Provides actionable insights** with risk levels and recommended actions

## ✨ Features

### Core
- 🧑 **Identity Registration** — Upload face photo + voice sample to create identity profile
- 🔍 **Deepfake Detection** — AI-powered analysis of images/video for synthetic content
- 👤 **Face Matching** — Compare media against registered identity using deep learning embeddings
- 🎤 **Voice Matching** — Speaker verification using voice embeddings
- 🧠 **AI Reasoning** — LLM-powered explanations of analysis results
- 📄 **PDF Reports** — Professional legal-style forensic reports

### Advanced
- 📊 **Authenticity Score** — Combined weighted score from all detection modules
- 📈 **Detection History** — Track and review past analyses
- 🎨 **Premium UI** — Dark theme with glassmorphism, animations, and data visualizations

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), Tailwind CSS, Framer Motion |
| Backend | FastAPI (Python) |
| Face Recognition | DeepFace (Facenet512) |
| Voice Matching | Resemblyzer |
| Deepfake Detection | HuggingFace Inference API |
| LLM Reasoning | HuggingFace Inference API (Zephyr-7B) |
| Database | SQLite (local) / Supabase (production) |
| Reports | FPDF2 |
| Deployment | Vercel (frontend) + Render (backend) |

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- (Optional) HuggingFace API token for full AI features

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # Add your HuggingFace token (optional)
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Environment Variables

Create `backend/.env`:
```
HUGGINGFACE_API_TOKEN=hf_your_token_here  # Optional - enables AI models
```

> The app works without a HuggingFace token using built-in fallback analysis.

## 📖 How to Use

1. **Register Identity** — Go to Register, enter name/email, upload a face photo and voice recording
2. **Analyze Media** — Go to Analyze, upload suspicious image/video/audio
3. **View Results** — See deepfake confidence, face/voice match scores, AI explanation
4. **Download Report** — Get a professional PDF report with all findings

## 🏗️ Architecture

```
Frontend (React) → Backend (FastAPI)
                     ├── HuggingFace API (deepfake detection + LLM)
                     ├── DeepFace (face embeddings)
                     ├── Resemblyzer (voice embeddings)
                     ├── SQLite (data storage)
                     └── FPDF2 (report generation)
```

## 📁 Project Structure

```
persona/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Settings & configuration
│   ├── database.py          # SQLite database
│   ├── models.py            # Pydantic models
│   ├── routers/
│   │   ├── register.py      # Identity registration API
│   │   ├── analyze.py       # Deepfake analysis API
│   │   └── report.py        # Report management API
│   └── services/
│       ├── face_service.py      # Face embedding & matching
│       ├── voice_service.py     # Voice embedding & matching
│       ├── deepfake_service.py  # Deepfake detection
│       ├── llm_service.py       # AI explanation generation
│       └── report_service.py    # PDF report generation
├── frontend/
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Route pages
│       ├── api/             # API client
│       └── utils/           # Helpers
└── README.md
```

## 🌐 Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Deploy dist/ to Vercel
```

### Backend → Render
- Create a new Web Service on Render
- Set build command: `pip install -r requirements.txt`
- Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

## 📄 License

MIT
