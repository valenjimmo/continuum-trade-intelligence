from functools import lru_cache
from typing import Optional, Union

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Trend Continuation Intelligence Platform"
    environment: str = "development"
    api_prefix: str = "/api/v1"
    cors_origins: list[Union[AnyHttpUrl, str]] = Field(default_factory=lambda: ["http://localhost:3000"])

    database_url: str = "postgresql+psycopg://tcip:tcip@postgres:5432/tcip"
    redis_url: str = "redis://redis:6379/0"

    tracked_symbols: list[str] = Field(default_factory=lambda: ["SPY", "QQQ", "IWM"])
    correlation_symbols: list[str] = Field(default_factory=lambda: ["SPY", "QQQ", "IWM", "VIX", "DXY", "TNX"])
    data_mode: str = "mock"
    discord_webhook_url: Optional[str] = None
    telegram_bot_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None


@lru_cache
def get_settings() -> Settings:
    return Settings()
