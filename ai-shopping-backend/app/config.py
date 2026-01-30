from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Shopping Assistant"
    PORT: int = 5000
    
    # MongoDB
    MONGODB_URI: str
    
    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    
    # SendGrid
    SENDGRID_API_KEY: Optional[str] = None
    SENDGRID_FROM_EMAIL: str = "noreply@yourstore.com"
    
    # JWT
    JWT_SECRET: str
    JWT_EXPIRE_MINUTES: int = 43200
    
    # CORS
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Features
    ENABLE_EMAIL: bool = False
    ENABLE_OPENAI: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings()