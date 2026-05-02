import numpy as np
from typing import List, Dict, Any


def _angle_between(a: dict, b: dict, c: dict) -> float:
    """Compute angle at point B, between vectors BA and BC."""
    ba = np.array([a["x"] - b["x"], a["y"] - b["y"]])
    bc = np.array([c["x"] - b["x"], c["y"] - b["y"]])
    cosine = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
    cosine = np.clip(cosine, -1.0, 1.0)
    return float(np.degrees(np.arccos(cosine)))


def _avg(vals: list) -> float | None:
    filtered = [v for v in vals if v is not None]
    return round(sum(filtered) / len(filtered), 2) if filtered else None


def compute_metrics(landmarks: List[Dict[str, Any]], shot_type: str) -> Dict[str, Any]:
    """
    Compute cricket-specific biomechanical metrics from landmark sequence.
    All values are averaged across sampled frames.
    """
    if not landmarks:
        return {}

    # --- Head Movement (nose lateral drift) ---
    nose_x_vals = [f["nose"]["x"] for f in landmarks if f["nose"]["vis"] > 0.3]
    head_movement = None
    if len(nose_x_vals) >= 2:
        head_movement = round(float(np.std(nose_x_vals)) * 1000, 2)  # in pixels relative to image width

    # --- Knee Angle (average of both knees) ---
    knee_angles = []
    for f in landmarks:
        # Left knee angle (hip–knee–ankle)
        if f["left_hip"]["vis"] > 0.3 and f["left_knee"]["vis"] > 0.3 and f["left_ankle"]["vis"] > 0.3:
            angle = _angle_between(f["left_hip"], f["left_knee"], f["left_ankle"])
            knee_angles.append(angle)
        # Right knee angle
        if f["right_hip"]["vis"] > 0.3 and f["right_knee"]["vis"] > 0.3 and f["right_ankle"]["vis"] > 0.3:
            angle = _angle_between(f["right_hip"], f["right_knee"], f["right_ankle"])
            knee_angles.append(angle)
    knee_angle = _avg(knee_angles)

    # --- Balance Score (hip stability: low vertical variance = good balance) ---
    left_hip_y = [f["left_hip"]["y"] for f in landmarks if f["left_hip"]["vis"] > 0.3]
    right_hip_y = [f["right_hip"]["y"] for f in landmarks if f["right_hip"]["vis"] > 0.3]
    balance_score = None
    if left_hip_y and right_hip_y:
        hip_variance = np.std(left_hip_y + right_hip_y)
        balance_score = round(float(max(0, 1 - hip_variance * 10)), 3)  # 0–1, higher is better

    # --- Elbow Angle (batting arm) ---
    elbow_angles = []
    for f in landmarks:
        if f["right_shoulder"]["vis"] > 0.3 and f["right_elbow"]["vis"] > 0.3 and f["right_wrist"]["vis"] > 0.3:
            angle = _angle_between(f["right_shoulder"], f["right_elbow"], f["right_wrist"])
            elbow_angles.append(angle)
    elbow_angle = _avg(elbow_angles)

    # --- Hip Rotation (shoulder–hip alignment angle change) ---
    hip_rotations = []
    for f in landmarks:
        if (f["left_shoulder"]["vis"] > 0.3 and f["right_shoulder"]["vis"] > 0.3
                and f["left_hip"]["vis"] > 0.3 and f["right_hip"]["vis"] > 0.3):
            shoulder_vec = np.array([
                f["right_shoulder"]["x"] - f["left_shoulder"]["x"],
                f["right_shoulder"]["y"] - f["left_shoulder"]["y"],
            ])
            hip_vec = np.array([
                f["right_hip"]["x"] - f["left_hip"]["x"],
                f["right_hip"]["y"] - f["left_hip"]["y"],
            ])
            cos_angle = np.dot(shoulder_vec, hip_vec) / (np.linalg.norm(shoulder_vec) * np.linalg.norm(hip_vec) + 1e-6)
            hip_rotations.append(float(np.degrees(np.arccos(np.clip(cos_angle, -1, 1)))))
    hip_rotation = _avg(hip_rotations)

    # --- Stride Length (ankle horizontal spread, normalized) ---
    stride_lengths = []
    for f in landmarks:
        if f["left_ankle"]["vis"] > 0.3 and f["right_ankle"]["vis"] > 0.3:
            stride_lengths.append(abs(f["right_ankle"]["x"] - f["left_ankle"]["x"]))
    stride_length = _avg(stride_lengths)
    if stride_length:
        stride_length = round(stride_length * 100, 2)  # as % of frame width

    # --- Follow Through Score (shot-type specific: wrist height at end of sequence) ---
    follow_through_score = None
    if shot_type in ["cover_drive", "straight_drive", "pull_shot"]:
        end_frames = landmarks[-min(5, len(landmarks)):]
        wrist_y_end = [f["right_wrist"]["y"] for f in end_frames if f["right_wrist"]["vis"] > 0.3]
        shoulder_y_end = [f["right_shoulder"]["y"] for f in end_frames if f["right_shoulder"]["vis"] > 0.3]
        if wrist_y_end and shoulder_y_end:
            # Follow-through: wrist should be above shoulder at completion (lower y = higher)
            avg_wrist_y = np.mean(wrist_y_end)
            avg_shoulder_y = np.mean(shoulder_y_end)
            follow_through_score = round(float(max(0, min(1, (avg_shoulder_y - avg_wrist_y) * 5 + 0.5))), 3)

    return {
        "head_movement": head_movement,
        "knee_angle": knee_angle,
        "balance_score": balance_score,
        "elbow_angle": elbow_angle,
        "hip_rotation": hip_rotation,
        "stride_length": stride_length,
        "follow_through_score": follow_through_score,
    }
