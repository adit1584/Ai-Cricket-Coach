import os
import json
import re
import httpx
from typing import Dict, Any

HF_API_URL = "https://api-inference.huggingface.co/models/google/gemma-2-2b-it"


def build_prompt(metrics: Dict[str, Any], shot_type: str) -> str:
    """Build a structured prompt for Gemma 2B to analyze cricket technique."""
    shot_label = shot_type.replace("_", " ").title()
    metrics_str = "\n".join(
        f"  - {k.replace('_', ' ').title()}: {v}" for k, v in metrics.items() if v is not None
    )

    prompt = f"""<start_of_turn>user
You are an expert cricket biomechanics coach. Analyze these measured metrics from a player's {shot_label} video:

{metrics_str}

Based on these metrics, provide feedback in this exact JSON format:
{{
  "issues": ["issue 1", "issue 2", "issue 3"],
  "strengths": ["strength 1", "strength 2"],
  "tips": ["tip 1", "tip 2", "tip 3"]
}}

Guidelines:
- head_movement < 5 is good (stable head)
- knee_angle between 130-150 degrees is ideal for batting
- balance_score > 0.7 is good
- elbow_angle between 90-120 is ideal
- hip_rotation > 15 degrees indicates good rotation
- stride_length 15-25% of frame width is ideal
- follow_through_score > 0.6 is good

Provide 2-3 specific issues, 1-2 strengths, and 2-3 actionable tips. Be specific and technical.
<end_of_turn>
<start_of_turn>model
"""
    return prompt


async def get_hf_feedback(metrics: Dict[str, Any], shot_type: str) -> Dict[str, Any]:
    """Call Hugging Face Inference API with Gemma 2B and parse the response."""
    hf_token = os.getenv("HF_TOKEN", "")
    if not hf_token or hf_token == "hf_your_token_here":
        # Return mock feedback if no token provided
        return _mock_feedback(metrics, shot_type)

    prompt = build_prompt(metrics, shot_type)

    headers = {
        "Authorization": f"Bearer {hf_token}",
        "Content-Type": "application/json",
    }

    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 400,
            "temperature": 0.3,
            "return_full_text": False,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(HF_API_URL, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()

        if isinstance(result, list) and len(result) > 0:
            generated_text = result[0].get("generated_text", "")
        else:
            generated_text = str(result)

        # Try to extract JSON from the generated text
        parsed = _parse_feedback_json(generated_text)
        return {**parsed, "raw_feedback": generated_text}
    except Exception as e:
        print(f"[WARNING] Hugging Face API failed ({e}). Falling back to mock feedback.")
        return _mock_feedback(metrics, shot_type)


def _parse_feedback_json(text: str) -> Dict[str, Any]:
    """Extract JSON from Gemma's output using regex."""
    # Try to find JSON block
    json_match = re.search(r'\{[\s\S]*?"issues"[\s\S]*?"strengths"[\s\S]*?"tips"[\s\S]*?\}', text)
    if json_match:
        try:
            data = json.loads(json_match.group(0))
            return {
                "issues": data.get("issues", [])[:5],
                "strengths": data.get("strengths", [])[:5],
                "tips": data.get("tips", [])[:5],
            }
        except json.JSONDecodeError:
            pass

    # Fallback: extract line-by-line
    return {
        "issues": ["Could not fully parse AI feedback - check raw_feedback for details"],
        "strengths": [],
        "tips": ["Retrain model or check video quality"],
    }


def _mock_feedback(metrics: Dict[str, Any], shot_type: str) -> Dict[str, Any]:
    """
    Generate rule-based feedback when HF token is not yet available.
    This is used as a stub during development.
    """
    issues = []
    strengths = []
    tips = []

    # Head movement
    hm = metrics.get("head_movement")
    if hm is not None:
        if hm > 8:
            issues.append("Excessive head movement detected — keep your eye on the ball")
        elif hm < 3:
            strengths.append("Excellent head stability throughout the shot")

    # Knee angle
    ka = metrics.get("knee_angle")
    if ka is not None:
        if ka > 160:
            issues.append("Knees are too straight — bend them more for better balance and power")
            tips.append("Flex your knees to a 130–150° angle at setup for optimal weight transfer")
        elif 130 <= ka <= 150:
            strengths.append("Good knee bend providing solid base")

    # Balance score
    bs = metrics.get("balance_score")
    if bs is not None:
        if bs < 0.5:
            issues.append("Poor weight distribution — work on staying balanced through the shot")
            tips.append("Focus on maintaining equal weight on both feet at the moment of impact")
        elif bs > 0.75:
            strengths.append("Great balance and stability throughout the movement")

    # Elbow angle
    ea = metrics.get("elbow_angle")
    if ea is not None:
        if ea < 80:
            issues.append("Elbow is too bent — may restrict power generation")
        elif ea > 140:
            issues.append("Elbow too straight — risk of incorrect bat angle at contact")
        else:
            strengths.append("Good elbow position for bat control")

    # Hip rotation
    hr = metrics.get("hip_rotation")
    if hr is not None:
        if hr < 10:
            issues.append("Limited hip rotation — power is primarily from arms, not core")
            tips.append("Drive your hips through the ball to generate full-body power")

    # Follow through
    ft = metrics.get("follow_through_score")
    if ft is not None and shot_type in ["cover_drive", "straight_drive", "pull_shot"]:
        if ft < 0.4:
            issues.append("Incomplete follow-through — shot is being cut short")
            tips.append("Continue the bat swing fully after contact to maximize power and direction control")

    # Add generic tips if we have few
    if len(tips) < 2:
        tips.append(f"Practice the {shot_type.replace('_', ' ')} against a bowling machine at consistent pace")
    if len(tips) < 2:
        tips.append("Record yourself regularly to track your technique improvements over time")

    return {
        "issues": issues[:4],
        "strengths": strengths[:3],
        "tips": tips[:4],
        "raw_feedback": "Mock feedback (HF_TOKEN not configured)",
    }
