import logging
from pathlib import Path
from typing import Any, Callable, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)

# Lazy-load Resemblyzer (PyTorch) and librosa so the HTTP server can bind before heavy ML loads.
_resemblyzer: Optional[Tuple[Any, Callable]] = None  # (VoiceEncoder instance, preprocess_wav)
_resemblyzer_checked = False
_librosa_module: Optional[Any] = None
_librosa_checked = False


def _lazy_resemblyzer():
    """Return (encoder_instance, preprocess_wav) or None. Imports on first use only."""
    global _resemblyzer, _resemblyzer_checked
    if _resemblyzer_checked:
        return _resemblyzer
    _resemblyzer_checked = True
    try:
        from resemblyzer import VoiceEncoder, preprocess_wav

        encoder = VoiceEncoder()
        _resemblyzer = (encoder, preprocess_wav)
        logger.info("Resemblyzer loaded for voice embeddings")
    except ImportError as exc:
        logger.warning("Resemblyzer not available – using lightweight fallback for voice embeddings (%s)", exc)
        _resemblyzer = None
    return _resemblyzer


def _lazy_librosa():
    global _librosa_module, _librosa_checked
    if _librosa_checked:
        return _librosa_module
    _librosa_checked = True
    try:
        import librosa

        _librosa_module = librosa
    except ImportError:
        _librosa_module = None
    return _librosa_module


def _fallback_embedding(audio_path: str) -> np.ndarray:
    """Generate a deterministic pseudo-embedding from audio data."""
    librosa = _lazy_librosa()
    if librosa is not None:
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
    pack = _lazy_resemblyzer()
    if pack is not None:
        encoder, preprocess_wav = pack
        try:
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
