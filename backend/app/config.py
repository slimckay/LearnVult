from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "LearnVult"
    secret_key: str = "change-this-to-a-long-random-string"
    access_token_expire_minutes: int = 720
    database_url: str = "sqlite:///./learnvult.db"
    upload_dir: str = "storage/uploads"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    algorithm: str = "HS256"
    admin_email: str = ""
    admin_password: str = ""
    admin_name: str = "LearnVult Admin"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def origins(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @property
    def sqlalchemy_url(self) -> str:
        url = (self.database_url or "").strip()
        if url.startswith("postgres://"):
            url = "postgresql+psycopg2://" + url[len("postgres://"):]
        elif url.startswith("postgresql://") and "+psycopg2" not in url:
            url = "postgresql+psycopg2://" + url[len("postgresql://"):]
        return url or "sqlite:///./learnvult.db"

    @property
    def uses_postgres(self) -> bool:
        return self.sqlalchemy_url.startswith("postgresql")

settings = Settings()
