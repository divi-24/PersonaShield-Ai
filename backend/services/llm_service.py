import logging
from typing import Optional

logger = logging.getLogger(__name__)

HTTPX_AVAILABLE = False
try:
    import httpx

    HTTPX_AVAILABLE = True
except ImportError:
    pass

HF_MODEL = "Qwen/Qwen2.5-7B-Instruct"
HF_API_URL = "https://router.huggingface.co/v1/chat/completions"


def _build_prompt(
    deepfake_score: float,
    face_match: Optional[float],
    voice_match: Optional[float],
    details: str,
) -> str:
    return (
        f"Deepfake detection confidence: {deepfake_score}%\n"
        f"Face match score: {face_match if face_match is not None else 'N/A'}%\n"
        f"Voice match score: {voice_match if voice_match is not None else 'N/A'}%\n"
        f"Detection details: {details}\n\n"
        "Provide a professional summary explaining these results, their implications, "
        "and recommended next steps. Use a formal, legal-report tone."
    )


def _template_fallback(
    deepfake_score: float,
    face_match: Optional[float],
    voice_match: Optional[float],
    details: str,
) -> str:
    """Generate a templated explanation without an LLM API."""
    parts: list[str] = []
    parts.append("=== PersonaShield AI — Analysis Report ===\n")

    # Deepfake assessment
    if deepfake_score > 70:
        level = "HIGH"
        desc = (
            "The submitted media exhibits strong indicators of artificial generation or manipulation. "
            "The deepfake detection system assigned a high confidence score, suggesting the content "
            "may have been synthetically produced or altered."
        )
    elif deepfake_score > 40:
        level = "MODERATE"
        desc = (
            "The submitted media shows some characteristics that may indicate manipulation, though "
            "the evidence is not conclusive. Further manual review is recommended."
        )
    else:
        level = "LOW"
        desc = (
            "The submitted media does not exhibit significant indicators of artificial generation. "
            "The content appears to be authentic based on automated analysis."
        )
    parts.append(
        f"1. DEEPFAKE RISK LEVEL: {level} (confidence: {deepfake_score:.1f}%)\n   {desc}\n"
    )

    # Face match
    if face_match is not None:
        if face_match > 80:
            face_desc = "The face in the media closely matches the registered identity."
        elif face_match > 50:
            face_desc = "The face shows partial similarity to the registered identity. Manual verification advised."
        else:
            face_desc = "The face does not match the registered identity. Possible impersonation detected."
        parts.append(f"2. FACE VERIFICATION: {face_match:.1f}% match\n   {face_desc}\n")

    # Voice match
    if voice_match is not None:
        if voice_match > 80:
            voice_desc = "The voice profile closely matches the registered identity."
        elif voice_match > 50:
            voice_desc = "The voice shows partial similarity. Additional voice samples may be needed."
        else:
            voice_desc = "The voice does not match the registered identity."
        parts.append(f"3. VOICE VERIFICATION: {voice_match:.1f}% match\n   {voice_desc}\n")

    # Authenticity
    scores = [100 - deepfake_score]
    if face_match is not None:
        scores.append(face_match)
    if voice_match is not None:
        scores.append(voice_match)
    authenticity = sum(scores) / len(scores)

    if authenticity > 75:
        conclusion = "The media is assessed as LIKELY AUTHENTIC."
    elif authenticity > 40:
        conclusion = "The media authenticity is INCONCLUSIVE. Further review is strongly recommended."
    else:
        conclusion = "The media is assessed as LIKELY MANIPULATED OR FRAUDULENT."

    parts.append(f"4. OVERALL AUTHENTICITY SCORE: {authenticity:.1f}%\n   {conclusion}\n")
    parts.append(
        "5. RECOMMENDED ACTIONS:\n"
        "   - Retain this report for compliance records.\n"
        "   - If risk is moderate or high, escalate for manual expert review.\n"
        "   - Cross-reference with additional identity documents where possible.\n"
    )
    if details:
        parts.append(f"6. TECHNICAL DETAILS:\n   {details}\n")

    return "\n".join(parts)


async def generate_explanation(
    deepfake_score: float,
    face_match: Optional[float],
    voice_match: Optional[float],
    details: str,
    api_token: str = "",
) -> str:
    """Generate an LLM-powered explanation or fall back to a template."""
    if HTTPX_AVAILABLE and api_token:
        try:
            prompt = _build_prompt(deepfake_score, face_match, voice_match, details)
            headers = {"Authorization": f"Bearer {api_token}"}
            payload = {
                "model": HF_MODEL,
                "messages": [
                    {"role": "system", "content": "You are PersonaShield AI, a digital identity verification expert. Write a professional, concise analysis report paragraph."},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 400,
                "temperature": 0.4,
            }
            async with httpx.AsyncClient(timeout=90.0) as client:
                resp = await client.post(HF_API_URL, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                if text:
                    return text
            logger.warning("LLM API returned status %d, using template fallback", resp.status_code)
        except Exception as exc:
            logger.error("LLM API call failed: %s", exc)

    return _template_fallback(deepfake_score, face_match, voice_match, details)
