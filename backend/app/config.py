from datetime import date
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    groq_whisper_model: str = "whisper-large-v3"

    demo_date: date = date(2026, 9, 16)
    history_window_months: int = 12
    seasonality_minimum_history_months: int = 12
    seasonality_lookahead_months: int = 3
    intent_confidence_threshold: float = 0.85
    repayment_consistency_threshold: float = 0.85
    persistent_decline_duration_months: int = 4
    income_drop_threshold_pct: float = -10.0
    seasonality_deviation_pct: float = 15.0


@lru_cache
def get_settings() -> Settings:
    return Settings()
