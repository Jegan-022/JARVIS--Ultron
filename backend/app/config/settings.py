from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ultron_host: str = "127.0.0.1"
    ultron_port: int = 8000
    ultron_cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    llm_api_key: str = ""
    llm_base_url: str = "http://127.0.0.1:11434/v1"
    llm_model: str = "llama3.1"
    llm_provider: str = "ollama"

    stt_provider: str = "browser"
    tts_provider: str = "browser"
    wake_word: str = "ultron"

    home_assistant_url: str = ""
    home_assistant_token: str = ""

    mqtt_host: str = "127.0.0.1"
    mqtt_port: int = 1883
    mqtt_username: str = ""
    mqtt_password: str = ""
    mqtt_topic_prefix: str = "ultron"

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.ultron_cors_origins.split(",") if item.strip()]


settings = Settings()
