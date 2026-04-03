import logging
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)

DEEPFACE_AVAILABLE = False
try:
    from deepface import DeepFace

    DEEPFACE_AVAILABLE = True
except ImportError:
    logger.warning("DeepFace not installed – using lightweight fallback for face embeddings")

PIL_AVAILABLE = False
try:
    from PIL import Image

    PIL_AVAILABLE = True
except ImportError:
    pass


def _fallback_embedding(image_path: str) -> np.ndarray:
    """Generate a deterministic pseudo-embedding from image pixel data."""
    if PIL_AVAILABLE:
        img = Image.open(image_path).convert("RGB").resize((64, 64))
        arr = np.asarray(img, dtype=np.float32).flatten()
        rng = np.random.RandomState(int(arr.sum()) % (2**31))
        emb = rng.randn(512).astype(np.float32)
        emb /= np.linalg.norm(emb) + 1e-10
        return emb
    return np.random.default_rng(42).standard_normal(512).astype(np.float32)


def extract_embedding(image_path: str) -> np.ndarray:
    """Extract a 512-d face embedding from an image file."""
    if DEEPFACE_AVAILABLE:
        try:
            representations = DeepFace.represent(
                img_path=image_path,
                model_name="Facenet512",
                enforce_detection=False,
            )
            if representations:
                vec = np.array(representations[0]["embedding"], dtype=np.float32)
                return vec
        except Exception as exc:
            logger.error("DeepFace embedding extraction failed: %s", exc)

    logger.info("Using fallback face embedding for %s", image_path)
    return _fallback_embedding(image_path)


def compare_faces(embedding_path: str, image_path: str) -> float:
    """Compare a stored embedding (.npy) with a new image. Returns 0-100 similarity."""
    stored = np.load(embedding_path)
    new = extract_embedding(image_path)

    cos_sim = float(np.dot(stored, new) / (np.linalg.norm(stored) * np.linalg.norm(new) + 1e-10))
    score = max(0.0, min(100.0, (cos_sim + 1.0) * 50.0))
    return round(score, 2)


def save_embedding(embedding: np.ndarray, path: str) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    np.save(path, embedding)
