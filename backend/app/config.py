from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    TMDB_BEARER_TOKEN: str
    DATABASE_URL: str
    FRONTEND_URL: str = "https://watch-calendar.vercel.app"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()
