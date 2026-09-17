import json
import re
from io import BytesIO

from groq import Groq

from app.config import Settings, get_settings
from app.errors import nlp_failure


DEMO_FLOOD_MESSAGE = "baadh ne meri fasal barbaad kar di"

EMERGENCY_HINTS = [
    "baadh",
    "badh",
    "flood",
    "barbaad",
    "fasal",
    "crop",
    "hospital",
    "accident",
    "drought",
    "sukha",
    "fire",
    "aag",
    "lost job",
    "naukri",
    "medical",
    "bimari",
    "illness",
    "cyclone",
    "toofan",
]


def normalize_message(message: str) -> str:
    return re.sub(r"\s+", " ", message.strip().lower())


def is_demo_flood_message(message: str) -> bool:
    return normalize_message(message) == DEMO_FLOOD_MESSAGE


def demo_flood_classification() -> dict:
    return {
        "intent": "emergency",
        "extracted_reason": "flood destroyed crops",
        "intent_confidence": 0.91,
    }


def _heuristic_classify(message: str) -> dict:
    if is_demo_flood_message(message):
        return demo_flood_classification()

    normalized = normalize_message(message)
    hits = [hint for hint in EMERGENCY_HINTS if hint in normalized]
    if hits:
        reason = message.strip()
        if "baadh" in normalized or "flood" in normalized:
            reason = "flood related agricultural loss"
        elif "fasal" in normalized or "crop" in normalized:
            reason = "crop loss"
        elif "hospital" in normalized or "medical" in normalized or "bimari" in normalized:
            reason = "medical emergency"
        return {
            "intent": "emergency",
            "extracted_reason": reason,
            "intent_confidence": 0.86 if len(hits) > 1 else 0.72,
        }

    return {
        "intent": "no_emergency",
        "extracted_reason": "no hardship event identified in the message",
        "intent_confidence": 0.8,
    }


def _parse_model_json(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
        cleaned = cleaned.removesuffix("```").strip()
    payload = json.loads(cleaned)
    intent = payload.get("intent")
    if intent not in {"emergency", "no_emergency"}:
        raise ValueError("invalid intent")
    confidence = float(payload.get("intent_confidence"))
    confidence = min(max(confidence, 0.0), 1.0)
    reason = str(payload.get("extracted_reason") or "").strip()
    if not reason:
        raise ValueError("missing reason")
    return {
        "intent": intent,
        "extracted_reason": reason,
        "intent_confidence": round(confidence, 2),
    }


class NlpService:
    """Groq Whisper transcription + Llama intent extraction, with a prototype fallback."""

    def __init__(self, settings: Settings | None = None):
        self.settings = settings or get_settings()
        self._client = Groq(api_key=self.settings.groq_api_key) if self.settings.groq_api_key else None

    def transcribe(self, audio_bytes: bytes, filename: str, language: str) -> str:
        if self._client is None:
            raise nlp_failure()
        try:
            buffer = BytesIO(audio_bytes)
            buffer.name = filename or "audio.webm"
            result = self._client.audio.transcriptions.create(
                file=buffer,
                model=self.settings.groq_whisper_model,
                language=language if language in {"hi", "en"} else None,
            )
            text = getattr(result, "text", None) or str(result)
            if not str(text).strip():
                raise ValueError("empty transcription")
            return str(text).strip()
        except Exception as exc:  # noqa: BLE001 — contract maps STT failure to 500
            raise nlp_failure() from exc

    def classify(self, message: str, language: str) -> dict:
        if is_demo_flood_message(message):
            return demo_flood_classification()
        if self._client is None:
            return _heuristic_classify(message)

        prompt = (
            "Classify a microfinance borrower message. "
            "Return JSON only with keys intent, extracted_reason, intent_confidence. "
            "intent must be emergency or no_emergency. "
            "extracted_reason must be a short English phrase. "
            "intent_confidence is a number between 0 and 1. "
            f"Language hint: {language}. Message: {message}"
        )
        try:
            completion = self._client.chat.completions.create(
                model=self.settings.groq_model,
                temperature=0,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You extract borrower hardship intent for a prototype decision engine. "
                            "Respond with JSON only."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
            )
            content = completion.choices[0].message.content or ""
            return _parse_model_json(content)
        except Exception as exc:  # noqa: BLE001 — contract maps any LLM failure to 500
            raise nlp_failure() from exc
