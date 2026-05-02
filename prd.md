PRODUCT REQUIREMENTS DOCUMENT (PRD)
1. Product Overview

Name: AI Cricket Coach
Goal: Provide automated, structured feedback on cricket technique using video uploads.

Target Users
Beginner/intermediate players (no coach access)
Small academies (1–50 students)
Core Value
Replace manual video review with semi-automated biomechanical feedback
🎯 Core Features (MVP ONLY)
Player
Upload video
Select shot type
Get:
Pose overlay (optional)
Metrics (head movement, stance width, etc.)
AI feedback
Coach
Manage players
Upload videos for them
View analytics
❌ What is NOT in MVP
Real-time feedback
Perfect accuracy
Pro-level coaching replacement
🧱 SYSTEM ARCHITECTURE
React (Frontend)
   ↓
Express API (Auth + CRUD)
   ↓
MongoDB (metadata)
   ↓
Cloud Storage (videos)
   ↓
Python FastAPI (AI service)
   ↓
Pose + Metrics + LLM feedback
🧠 AI PIPELINE DESIGN (CORE)
Step 1 — Frame Extraction
Use OpenCV
Sample: 2–5 fps (NOT full video)
Step 2 — Pose Estimation

Use:

MediaPipe BlazePose (primary)
Backup: OpenPose
Install
pip install mediapipe opencv-python numpy
Output
33 keypoints per frame:
{
  "frame": 1,
  "keypoints": {
    "left_shoulder": [x, y],
    "right_knee": [x, y]
  }
}
Step 3 — Feature Engineering

Compute:

Head Stability
head_movement = std_dev(nose_x over frames)
Stance Width
distance(left_ankle, right_ankle)
Knee Bend
angle(hip, knee, ankle)
Balance Score (custom)
Combine:
head alignment
center of mass
foot spacing
Step 4 — (Optional) Object Detection

Use:

YOLOv8

Install:

pip install ultralytics

Use for:

Bat detection → swing path
Step 5 — LLM Feedback

Use:

Gemma 4
Prompt Example
You are a cricket coach.

Metrics:
- Head movement: 7.2 cm
- Knee angle: 150°
- Balance score: 0.62

Give:
1. Issues
2. Improvements
3. Short coaching tips
🔌 HUGGING FACE USAGE (REAL STEPS)
1. Install transformers
pip install transformers accelerate
2. Load Gemma
from transformers import pipeline

pipe = pipeline("text-generation", model="google/gemma-2b")

response = pipe(prompt)

👉 Don’t run large models locally unless GPU available
👉 Otherwise use Hugging Face Inference API

3. Hugging Face API (production)
import requests

API_URL = "https://api-inference.huggingface.co/models/google/gemma-2b"
headers = {"Authorization": "Bearer YOUR_TOKEN"}

response = requests.post(API_URL, headers=headers, json={"inputs": prompt})
🔧 BACKEND DESIGN (Express)
Auth Routes
POST /api/auth/register
{
  "email": "...",
  "password": "...",
  "role": "player"
}
POST /api/auth/login
{
  "email": "...",
  "password": "..."
}
Player Routes
POST /api/videos/upload
Upload → Cloudinary
Save metadata

Response:

{
  "video_id": "123",
  "status": "processing"
}
GET /api/videos/:id
{
  "video_url": "...",
  "analysis": {...}
}
AI Trigger Route
POST /api/analysis/start
{
  "video_id": "123",
  "shot_type": "cover_drive"
}

👉 Push to queue

Queue System

Use:

BullMQ + Redis
🐍 PYTHON SERVICE (FastAPI)
POST /analyze
{
  "video_url": "...",
  "shot_type": "cover_drive"
}
Response
{
  "metrics": {
    "head_movement": 6.2,
    "knee_angle": 142,
    "balance_score": 0.78
  },
  "issues": [...],
  "tips": [...]
}
🗄️ DATABASE (Mongo)
Users
{
  "_id": "...",
  "email": "...",
  "role": "player"
}
Videos
{
  "_id": "...",
  "player_id": "...",
  "video_url": "...",
  "analysis": {...}
}
Metrics (NEW — important)
{
  "video_id": "...",
  "head_movement": 6.2,
  "knee_angle": 142
}
🎨 FRONTEND DESIGN DOC (React)
Tech
React + Tailwind
Axios
Zustand / Context
Pages
1. Landing Page
Hero section
CTA buttons
2. Dashboard (Player)

Sections:

Profile card
Upload panel
Video list
Analytics graphs
Upload Flow UI
Upload → Show "Processing..." → Poll API → Show result
Analysis View
Video player
Metrics panel
AI feedback
Comparison chart
3. Coach Dashboard
Player list
Filter controls
Batch analytics
📊 ANALYTICS UI

Show:

Head movement trend
Balance score over time
Weakness tags
⚠️ UX RULE (IMPORTANT)

If analysis takes >10s:

Show async status
NEVER block UI