import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
import tempfile
import os
import requests
import urllib.request
from typing import Optional

MODEL_PATH = "pose_landmarker_lite.task"
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"

def _ensure_model():
    if not os.path.exists(MODEL_PATH):
        print("Downloading MediaPipe Pose Landmarker model...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)

def download_video(video_url: str) -> str:
    """Download video from URL to a temp file, return temp file path."""
    response = requests.get(video_url, stream=True, timeout=60)
    response.raise_for_status()

    suffix = ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
        return f.name

# Mapping landmark indices to their names for the new Tasks API
LANDMARK_INDICES = {
    "NOSE": 0,
    "LEFT_SHOULDER": 11,
    "RIGHT_SHOULDER": 12,
    "LEFT_ELBOW": 13,
    "RIGHT_ELBOW": 14,
    "LEFT_WRIST": 15,
    "RIGHT_WRIST": 16,
    "LEFT_HIP": 23,
    "RIGHT_HIP": 24,
    "LEFT_KNEE": 25,
    "RIGHT_KNEE": 26,
    "LEFT_ANKLE": 27,
    "RIGHT_ANKLE": 28
}

def extract_pose_landmarks(video_path: str, max_frames: int = 15) -> list[dict]:
    """
    Extract pose landmarks from video using MediaPipe BlazePose (Tasks API).
    Returns a list of frame landmark data (sampled up to max_frames).
    """
    _ensure_model()
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video: {video_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    sample_interval = max(1, total_frames // max_frames)

    all_landmarks = []

    base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        output_segmentation_masks=False,
        running_mode=vision.RunningMode.IMAGE
    )

    with vision.PoseLandmarker.create_from_options(options) as landmarker:
        frame_idx = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % sample_interval == 0:
                image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
                
                detection_result = landmarker.detect(mp_image)

                if detection_result.pose_landmarks and len(detection_result.pose_landmarks) > 0:
                    lm = detection_result.pose_landmarks[0] # first person
                    
                    all_landmarks.append({
                        "frame": frame_idx,
                        "timestamp": frame_idx / fps,
                        "nose": _lm(lm, LANDMARK_INDICES["NOSE"]),
                        "left_shoulder": _lm(lm, LANDMARK_INDICES["LEFT_SHOULDER"]),
                        "right_shoulder": _lm(lm, LANDMARK_INDICES["RIGHT_SHOULDER"]),
                        "left_elbow": _lm(lm, LANDMARK_INDICES["LEFT_ELBOW"]),
                        "right_elbow": _lm(lm, LANDMARK_INDICES["RIGHT_ELBOW"]),
                        "left_wrist": _lm(lm, LANDMARK_INDICES["LEFT_WRIST"]),
                        "right_wrist": _lm(lm, LANDMARK_INDICES["RIGHT_WRIST"]),
                        "left_hip": _lm(lm, LANDMARK_INDICES["LEFT_HIP"]),
                        "right_hip": _lm(lm, LANDMARK_INDICES["RIGHT_HIP"]),
                        "left_knee": _lm(lm, LANDMARK_INDICES["LEFT_KNEE"]),
                        "right_knee": _lm(lm, LANDMARK_INDICES["RIGHT_KNEE"]),
                        "left_ankle": _lm(lm, LANDMARK_INDICES["LEFT_ANKLE"]),
                        "right_ankle": _lm(lm, LANDMARK_INDICES["RIGHT_ANKLE"]),
                    })

            frame_idx += 1

    cap.release()
    return all_landmarks

def _lm(landmarks_list, index) -> dict:
    """Extract x, y, z, visibility from a landmark list by index."""
    lm = landmarks_list[index]
    return {"x": lm.x, "y": lm.y, "z": lm.z, "vis": lm.visibility if hasattr(lm, 'visibility') else 1.0}
