FINAL PRD (COMPLETE — PRODUCTION-READY)
1. PRODUCT OVERVIEW
Name

AI Cricket Coach

Objective

Deliver structured, data-backed cricket technique feedback using video analysis.

Not replacing human coaches
Not perfect biomechanics
But consistent and measurable improvement tracking
2. CORE FEATURES
Player
Upload video
Select shot type
Receive:
Metrics (numerical)
Issues / strengths / tips
Track progress over time
Compare improvements
View weakness & strength trends
Coach
Manage academy players
Assign players to batches/squads
Upload videos for players
View batch analytics
Compare players and groups
3. TECH STACK
Frontend: React + Tailwind
Backend: Express.js
AI Service: Python + FastAPI
Database: MongoDB Atlas
Storage: S3 / Cloudinary
AI: Gemma 2B Instruct via Hugging Face
CV: MediaPipe BlazePose (+ optional YOLOv8)
4. SYSTEM ARCHITECTURE
React
 ↓
Express API
 ↓
MongoDB (metadata + analytics)
 ↓
Cloud Storage (videos)
 ↓
Python FastAPI
 ↓
Pose → Metrics → HF → Feedback
5. DATA MODEL (FINAL)
Users
{
  "_id": "...",
  "email": "...",
  "password_hash": "...",
  "role": "player | coach",
  "name": "...",
  "created_at": "..."
}
Players
{
  "_id": "...",
  "user_id": "...",
  "age": 18,
  "experience_level": "beginner",
  "preferred_role": "batter"
}
Coaches
{
  "_id": "...",
  "user_id": "...",
  "academy_name": "...",
  "certification": "..."
}
Academy_Players (WITH BATCH SUPPORT — NEW)
{
  "_id": "...",
  "coach_id": "...",
  "player_id": "...",
  "batch_name": "U-19 Squad",
  "joined_date": "..."
}
Videos
{
  "_id": "...",
  "player_id": "...",
  "uploaded_by": "...",
  "video_url": "...",
  "shot_type": "cover_drive",
  "status": "processing | done",
  "created_at": "..."
}
Analysis (UNIFIED)
{
  "_id": "...",
  "video_id": "...",
  "metrics": {
    "head_movement": 6.2,
    "knee_angle": 142,
    "balance_score": 0.78
  },
  "issues": [],
  "strengths": [],
  "tips": [],
  "created_at": "..."
}
6. SHOT TYPE SCHEMA (STRICT VALIDATION)
const SHOT_TYPES = [
  "cover_drive",
  "pull_shot",
  "straight_drive",
  "cut_shot",
  "bowling_action",
  "footwork"
];

👉 Backend rejects invalid values

7. AI PIPELINE
Upload → Cloud storage
Queue job
Python:
Extract frames (OpenCV)
Pose detection (MediaPipe)
Compute metrics
Send metrics → Hugging Face (Gemma)
Store structured output
8. TIME-SERIES METRICS (FIXED)

Each video = one time-stamped record:

{
  "player_id": "...",
  "shot_type": "cover_drive",
  "metrics": {...},
  "created_at": "timestamp"
}
9. ANALYTICS ENGINE (FULLY IMPLEMENTED)
9.1 Progress Over Time
Group by player_id + shot_type
Sort by timestamp
Plot trends
9.2 Compare Improvements
improvement = latest_value - avg(previous_N)
9.3 Weakness Tracker

Count issue frequency:

{
  "head_falling": 6,
  "late_footwork": 3
}
9.4 Strength Tracker

Same logic for strengths

9.5 Batch Analytics (Coach)

Group by:

coach_id
batch_name

Compute:

avg metrics per batch
compare players
rank players
9.6 Player Comparison
compare(balance_score across players)
9.7 Total Videos Analyzed (NEW)

Computed:

video_count = count(videos where player_id)
10. BACKEND API
Auth

POST /api/auth/register
POST /api/auth/login

Upload

POST /api/videos/upload

Trigger Analysis

POST /api/analysis/start

Get Video + Analysis

GET /api/videos/:id

Player Analytics

GET /api/analytics/player/:id

{
  "video_count": 12,
  "progress": [...],
  "weaknesses": {...},
  "strengths": {...}
}
Coach Analytics

GET /api/analytics/coach/:id

{
  "batches": [...],
  "players": [...],
  "comparisons": [...],
  "avg_metrics": {...}
}
11. AUTHORIZATION (STRICT)
Player
Only own videos
Coach
Only players in Academy_Players
12. ASYNC PROCESSING (FINAL)
Upload → Queue → Python → Store → Frontend polls
13. FRONTEND DESIGN
Landing Page
Hero: “AI Cricket Coach for Everyone”
CTA:
Sign Up as Player
Sign Up as Coach
Player Dashboard
Profile
Name
Role
Experience
✅ Total videos analyzed
Upload
Select video
Select shot type
Show:
Uploading → Processing → Result
Analytics
Video history
Progress graphs
Compare improvements
Weakness tracker
Strength tracker
Coach Dashboard
Manage Academy
Add players
Assign to batches
Upload
Upload for selected player
Analytics
Filter:
by player
by batch
by shot type
Compare players
Batch insights
14. DATA ISOLATION
Player
Only own data
Coach
Only academy players
Enforced in backend (NOT UI)
🚨 UX CORRECTION (FINAL)

❌ Remove:

“Instant AI analysis”

✔ Use:

Upload → Processing → Result