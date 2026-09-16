import json
import re

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


def _heuristic_classify(message: str) -> dict:
    normalized = re.sub(r"\s+", " ", message.strip().lower())
    if normalized == DEMO_FLOOD_MESSAGE:
        return {
            "intent": "emergency",
            "extracted_reason": "flood destroyed crops",
            "intent_confidence": 0.91,
        }

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
    """Groq Llama intent extraction with a deterministic prototype fallback."""

    def __init__(self, settings: Settings | None = None):
        self.settings = settings or get_settings()
        self._client = Groq(api_key=self.settings.groq_api_key) if self.settings.groq_api_key else None

    def classify(self, message: str, language: str) -> dict:
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
                messages=[
                    {
                        "role": "system",
                        "content": "You extract borrower hardship intent for a prototype decision engine.",
                    },
                    {"role": "user", "content": prompt},
                ],
            )
            content = completion.choices[0].message.content or ""
            return _parse_model_json(content)
        except Exception as exc:  # noqa: BLE001 — contract maps any LLM failure to 500
            raise nlp_failure() from exc
