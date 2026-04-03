import logging
import mimetypes
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)

CV2_AVAILABLE = False
try:
    import cv2

    CV2_AVAILABLE = True
except ImportError:
    logger.warning("OpenCV not installed – video frame extraction unavailable")

PIL_AVAILABLE = False
try:
    from PIL import Image

    PIL_AVAILABLE = True
except ImportError:
    pass

HTTPX_AVAILABLE = False
try:
    import httpx

    HTTPX_AVAILABLE = True
except ImportError:
    pass

HF_API_URL = "https://router.huggingface.co/hf-inference/models/dima806/deepfake_vs_real_image_detection"


def _file_type(file_path: str) -> str:
    mime, _ = mimetypes.guess_type(file_path)
    if mime:
        if mime.startswith("image"):
            return "image"
        if mime.startswith("video"):
            return "video"
        if mime.startswith("audio"):
            return "audio"
    ext = Path(file_path).suffix.lower()
    if ext in {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff"}:
        return "image"
    if ext in {".mp4", ".avi", ".mov", ".mkv", ".webm"}:
        return "video"
    if ext in {".wav", ".mp3", ".flac", ".ogg", ".m4a"}:
        return "audio"
    return "image"


def _extract_keyframes(video_path: str, max_frames: int = 5) -> list[str]:
    """Extract key frames from a video file and save as temp images."""
    if not CV2_AVAILABLE:
        return []
    frames_dir = Path(video_path).parent / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)
    cap = cv2.VideoCapture(video_path)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total <= 0:
        cap.release()
        return []
    step = max(1, total // max_frames)
    paths: list[str] = []
    for i in range(0, total, step):
        if len(paths) >= max_frames:
            break
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ret, frame = cap.read()
        if not ret:
            continue
        p = str(frames_dir / f"frame_{i}.jpg")
        cv2.imwrite(p, frame)
        paths.append(p)
    cap.release()
    return paths


def _fallback_analysis(file_path: str) -> dict:
    """Simple heuristic fallback when HuggingFace API is unavailable."""
    if PIL_AVAILABLE:
        try:
            img = Image.open(file_path).convert("RGB")
            arr = np.asarray(img, dtype=np.float32)
            std = float(np.std(arr))
            mean = float(np.mean(arr))
            noise_ratio = std / (mean + 1e-10)
            if noise_ratio > 0.8:
                score = 0.3
            elif noise_ratio > 0.5:
                score = 0.2
            else:
                score = 0.15
            return {
                "is_deepfake": score > 0.5,
                "confidence": round(score * 100, 2),
                "details": (
                    f"Fallback analysis (no API key): noise_ratio={noise_ratio:.3f}, "
                    f"std={std:.1f}, mean={mean:.1f}. "
                    "For accurate results, provide a HuggingFace API token."
                ),
            }
        except Exception:
            pass
    return {
        "is_deepfake": False,
        "confidence": 10.0,
        "details": "Fallback analysis: unable to perform deep analysis without API key or ML libraries.",
    }


async def _analyze_image_hf(image_path: str, api_token: str) -> dict:
    """Call HuggingFace AI-image-detector model."""
    mime_type = mimetypes.guess_type(image_path)[0] or "image/jpeg"
    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": mime_type,
    }
    with open(image_path, "rb") as f:
        data = f.read()
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(HF_API_URL, headers=headers, content=data)
    if resp.status_code != 200:
        logger.error("HF API error %d: %s", resp.status_code, resp.text)
        return _fallback_analysis(image_path)
    results = resp.json()
    if isinstance(results, list) and len(results) > 0:
        ai_score = 0.0
        human_score = 0.0
        for item in results:
            label = item.get("label", "").lower()
            score = item.get("score", 0.0)
            if "artificial" in label or "ai" in label or "fake" in label:
                ai_score = score
            elif "human" in label or "real" in label:
                human_score = score
        if ai_score == 0.0 and human_score == 0.0 and results:
            ai_score = results[0].get("score", 0.5)
        confidence = round(ai_score * 100, 2)
        return {
            "is_deepfake": ai_score > 0.5,
            "confidence": confidence,
            "details": (
                f"AI-generated probability: {ai_score:.2%}, "
                f"Human/real probability: {human_score:.2%}"
            ),
        }
    return _fallback_analysis(image_path)


async def detect_deepfake(file_path: str, api_token: str = "") -> dict:
    """Detect whether a file is a deepfake. Returns dict with is_deepfake, confidence, details."""
    ft = _file_type(file_path)

    if ft == "audio":
        return {
            "is_deepfake": False,
            "confidence": 0.0,
            "details": "Audio-only deepfake detection is performed via voice matching, not image analysis.",
        }

    if ft == "video":
        frames = _extract_keyframes(file_path)
        if not frames:
            return {
                "is_deepfake": False,
                "confidence": 0.0,
                "details": "Could not extract frames from video for analysis.",
            }
        scores: list[float] = []
        all_details: list[str] = []
        for frame_path in frames:
            result = await detect_deepfake(frame_path, api_token)
            scores.append(result["confidence"])
            all_details.append(result["details"])
        avg = round(sum(scores) / len(scores), 2) if scores else 0.0
        return {
            "is_deepfake": avg > 50.0,
            "confidence": avg,
            "details": f"Analyzed {len(frames)} frames. Average confidence: {avg}%. " + all_details[0],
        }

    # Image analysis
    if HTTPX_AVAILABLE and api_token:
        try:
            return await _analyze_image_hf(file_path, api_token)
        except Exception as exc:
            logger.error("HuggingFace API call failed: %s", exc)

    return _fallback_analysis(file_path)
