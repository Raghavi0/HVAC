from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "sqlite:///./backend/smarthvac.db"
    jwt_secret: str = "development-secret-change-me"
    access_token_expire_minutes: int = 60
    cors_origins: str = "http://localhost:5173,http://localhost:4173"
    demo_mode: bool = True
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    mqtt_broker: str = "localhost"
    mqtt_port: int = 1883
    mqtt_username: str | None = None
    mqtt_password: str | None = None
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
