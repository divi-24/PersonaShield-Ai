# DigitalOcean App Platform — slim image to avoid build OOM / "no space left on device".
# Uses requirements-docker.txt (no DeepFace/TensorFlow, no Resemblyzer/webrtcvad).
# For full ML locally or on a big builder, swap to requirements.txt and add build-essential + python3-dev.
FROM python:3.12-slim-bookworm

ENV PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements-docker.txt .
RUN pip install --no-cache-dir -r requirements-docker.txt

COPY . .

EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
