import logging
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)

RESEMBLYZER_AVAILABLE = False
try:
    from resemblyzer import VoiceEncoder, preprocess_wav

    RESEMBLYZER_AVAILABLE = True
    _encoder: VoiceEncoder | None = None
except ImportError:
    logger.warning("Resemblyzer not installed – using lightweight fallback for voice embeddings")

LIBROSA_AVAILABLE = False
try:
    import librosa  # noqa: F401

    LIBROSA_AVAILABLE = True
except ImportError:
    pass


def _get_encoder() -> "VoiceEncoder":
    global _encoder
    if _encoder is None:
        _encoder = VoiceEncoder()
    return _encoder


def _fallback_embedding(audio_path: str) -> np.ndarray:
    """Generate a deterministic pseudo-embedding from audio data."""
    if LIBROSA_AVAILABLE:
        import librosa

        try:
            y, _ = librosa.load(audio_path, sr=16000, mono=True, duration=10)
            seed = int(np.abs(y).sum() * 1000) % (2**31)
            rng = np.random.RandomState(seed)
            emb = rng.randn(256).astype(np.float32)
            emb /= np.linalg.norm(emb) + 1e-10
            return emb
        except Exception as exc:
            logger.error("Librosa fallback failed: %s", exc)

    return np.random.default_rng(99).standard_normal(256).astype(np.float32)


def extract_embedding(audio_path: str) -> np.ndarray:
    """Extract a 256-d voice embedding from an audio file."""
    if RESEMBLYZER_AVAILABLE:
        try:
            encoder = _get_encoder()
            wav = preprocess_wav(audio_path)
            embedding = encoder.embed_utterance(wav)
            return embedding.astype(np.float32)
        except Exception as exc:
            logger.error("Resemblyzer embedding extraction failed: %s", exc)

    logger.info("Using fallback voice embedding for %s", audio_path)
    return _fallback_embedding(audio_path)


def compare_voices(embedding_path: str, audio_path: str) -> float:
    """Compare a stored embedding (.npy) with a new audio file. Returns 0-100 similarity."""
    stored = np.load(embedding_path)
    new = extract_embedding(audio_path)

    cos_sim = float(np.dot(stored, new) / (np.linalg.norm(stored) * np.linalg.norm(new) + 1e-10))
    score = max(0.0, min(100.0, (cos_sim + 1.0) * 50.0))
    return round(score, 2)


def save_embedding(embedding: np.ndarray, path: str) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    np.save(path, embedding)
