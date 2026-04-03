"""Utilities to extract a single frame and audio track from a video file."""

import logging
import subprocess
from pathlib import Path

logger = logging.getLogger(__name__)

CV2_AVAILABLE = False
try:
    import cv2

    CV2_AVAILABLE = True
except ImportError:
    pass


def extract_frame(video_path: str) -> str | None:
    """Extract a single frame (middle of video) as a JPEG. Returns path or None."""
    if not CV2_AVAILABLE:
        return None
    try:
        cap = cv2.VideoCapture(video_path)
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total <= 0:
            cap.release()
            return None
        cap.set(cv2.CAP_PROP_POS_FRAMES, total // 2)
        ret, frame = cap.read()
        cap.release()
        if not ret:
            return None
        out = str(Path(video_path).with_suffix(".frame.jpg"))
        cv2.imwrite(out, frame)
        return out
    except Exception as exc:
        logger.error("Frame extraction failed: %s", exc)
        return None


def extract_audio(video_path: str) -> str | None:
    """Extract audio track as WAV using ffmpeg. Returns path or None."""
    out = str(Path(video_path).with_suffix(".audio.wav"))
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", video_path, "-vn", "-acodec", "pcm_s16le",
             "-ar", "16000", "-ac", "1", out],
            capture_output=True,
            timeout=30,
        )
        if Path(out).exists() and Path(out).stat().st_size > 0:
            return out
    except Exception as exc:
        logger.error("Audio extraction failed: %s", exc)
    return None
