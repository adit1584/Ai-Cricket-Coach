# AI Cricket Coach

AI-powered cricket technique analysis platform with video upload, MediaPipe pose detection, Hugging Face Gemma 2B feedback, and real-time WebSocket updates.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vite + React + Tailwind CSS |
| Backend | Express.js + MongoDB Atlas + Socket.IO |
| AI Service | Python FastAPI + MediaPipe + Hugging Face |
| Storage | Cloudinary |
| Auth | JWT (role-based: player / coach) |

## Project Structure

```
GDG/
├── frontend/      # Vite + React + Tailwind
├── backend/       # Express.js API
├── ai-service/    # Python FastAPI + MediaPipe
└── prd.md
```

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env   # Fill in MongoDB, Cloudinary, JWT secret
npm install
npm run dev            # http://localhost:5000
```

### 2. AI Service

```bash
cd ai-service
cp .env.example .env   # Add HF_TOKEN when ready
pip install -r requirements.txt
python main.py         # http://localhost:8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

## Environment Variables

### Backend `.env`
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
PYTHON_SERVICE_URL=http://localhost:8000
CLIENT_URL=http://localhost:5173
```

### AI Service `.env`
```
HF_TOKEN=hf_...     # Add your Hugging Face token
```

> **Note:** Until `HF_TOKEN` is provided, the AI service uses rule-based mock feedback that works correctly end-to-end.

## Key Features

- **Player**: Upload video → Select shot type → Upload → Processing → AI results
- **Coach**: Manage academy (add players by email, assign batches) → Upload for players → Batch analytics
- **Real-time**: Socket.IO `analysis_complete` event updates UI without polling
- **Analytics**: Progress charts, weakness/strength trackers, batch comparison

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register player or coach |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Current user + profile |
| POST | `/api/videos/upload` | Upload video to Cloudinary |
| GET | `/api/videos/:id` | Get video + analysis |
| GET | `/api/videos/player/:id` | All videos for player |
| POST | `/api/analysis/callback` | Called by Python AI service |
| GET | `/api/analytics/player/:id` | Player analytics |
| GET | `/api/analytics/coach/:id` | Coach batch analytics |
| POST | `/api/academy/add-player` | Add player by email |
| GET | `/api/academy/players` | List academy players |
| PATCH | `/api/academy/players/:id/batch` | Update batch name |
| DELETE | `/api/academy/players/:id` | Remove player |

## Shot Types

`cover_drive` · `pull_shot` · `straight_drive` · `cut_shot` · `bowling_action` · `footwork`
