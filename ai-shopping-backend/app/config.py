from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Shopping Assistant"
    PORT: int = 5000
    
    # MongoDB
    MONGODB_URI: str
    
    # OpenAI
    OPENAI_API_KEY: str
    
    # SMTP (Gmail)
    EMAIL_HOST: str = "smtp.gmail.com"
    EMAIL_PORT: int = 587
    EMAIL_USER: Optional[str] = None
    EMAIL_PASSWORD: Optional[str] = None
    
    # JWT
    JWT_SECRET: str
    JWT_EXPIRE_MINUTES: int = 43200
    
    # CORS
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Features
    ENABLE_EMAIL: bool = False
    ENABLE_OPENAI: bool = True
    
    # Razorpay (demo/trial)
    RAZORPAY_KEY_ID: Optional[str] = None
    RAZORPAY_KEY_SECRET: Optional[str] = None
    
    class Config:
        env_file = ".env"

settings = Settings()