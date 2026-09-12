from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "LearnVult"
    secret_key: str = "change-this-to-a-long-random-string"
    access_token_expire_minutes: int = 720
    database_url: str = "sqlite:///./learnvult.db"
    upload_dir: str = "storage/uploads"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    algorithm: str = "HS256"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def origins(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

settings = Settings()
