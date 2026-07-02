from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "NovBank"
    app_version: str = "1.0.0"
    cors_origins: list[str] = ["http://localhost:3000"]
    debug: bool = False

    database_url: str = "sqlite:///./banking.db"

    secret_key: str = "novbank-secret-key-change-in-production-minimum-32-chars"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    demo_otp: str = "123456"
    otp_expire_minutes: int = 5

    anthropic_api_key: str = ""
    ai_model: str = "claude-haiku-4-5-20251001"


settings = Settings()
