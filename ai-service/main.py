import os
import asyncio
import tempfile
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

import httpx
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from pose_analyzer import download_video, extract_pose_landmarks
from metrics_extractor import compute_metrics
from hf_feedback import get_hf_feedback


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[INFO] AI Cricket Coach Service starting...")
    yield
    print("[INFO] AI Cricket Coach Service shutting down.")


app = FastAPI(
    title="AI Cricket Coach — Analysis Service",
    description="MediaPipe + Hugging Face powered cricket technique analyzer",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    video_url: str
    shot_type: str
    video_id: str
    callback_url: str


VALID_SHOT_TYPES = [
    "cover_drive", "pull_shot", "straight_drive",
    "cut_shot", "bowling_action", "footwork"
]


async def run_analysis(request: AnalyzeRequest):
    """Background task: full analysis pipeline."""
    tmp_path = None
    try:
        print(f"[INFO] Starting analysis for video_id={request.video_id} shot={request.shot_type}")

        # Step 1: Download video
        tmp_path = download_video(request.video_url)
        print(f"  [SUCCESS] Video downloaded: {tmp_path}")

        # Step 2: Extract pose landmarks
        landmarks = extract_pose_landmarks(tmp_path)
        print(f"  [SUCCESS] Pose extracted: {len(landmarks)} frames")

        if not landmarks:
            raise ValueError("No pose landmarks detected — video may be too short or blurry")

        # Step 3: Compute cricket metrics
        metrics = compute_metrics(landmarks, request.shot_type)
        print(f"  [SUCCESS] Metrics computed: {metrics}")

        # Step 4: Get HF feedback
        feedback = await get_hf_feedback(metrics, request.shot_type)
        print(f"  [SUCCESS] HF feedback received")

        # Step 5: Callback to Express
        payload = {
            "video_id": request.video_id,
            "metrics": metrics,
            "issues": feedback.get("issues", []),
            "strengths": feedback.get("strengths", []),
            "tips": feedback.get("tips", []),
            "raw_feedback": feedback.get("raw_feedback", ""),
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(request.callback_url, json=payload)
            resp.raise_for_status()
            print(f"  [SUCCESS] Callback sent to Express: {resp.status_code}")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"  [FAILED] Analysis failed: {e}", flush=True)
        # Send error callback
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(request.callback_url, json={
                    "video_id": request.video_id,
                    "error": str(e),
                })
        except Exception as cb_err:
            print(f"  [FAILED] Callback also failed: {cb_err}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
            print(f"  [INFO] Temp file cleaned up")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "AI Cricket Coach Analyzer"}


@app.post("/analyze")
async def analyze(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    """Trigger video analysis asynchronously."""
    if request.shot_type not in VALID_SHOT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid shot_type. Valid: {', '.join(VALID_SHOT_TYPES)}"
        )

    if not request.video_url or not request.video_id or not request.callback_url:
        raise HTTPException(status_code=400, detail="video_url, video_id, and callback_url are required")

    background_tasks.add_task(run_analysis, request)

    return {
        "message": "Analysis queued",
        "video_id": request.video_id,
        "status": "processing",
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
