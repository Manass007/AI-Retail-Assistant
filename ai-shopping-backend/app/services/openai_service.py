from openai import OpenAI
from app.config import settings
from typing import List, Dict, Optional
import logging
import json

logger = logging.getLogger(__name__)

# #region agent log
try:
    import httpx
    _log = {"sessionId": "debug-session", "runId": "run1", "hypothesisId": "H1", "location": "openai_service.py:init", "message": "openai and httpx versions", "data": {"openai_version": getattr(__import__("openai"), "__version__", "?"), "httpx_version": getattr(httpx, "__version__", "?")}, "timestamp": __import__("time").time()}
    with open("c:\\Users\\ManasKumarGupta(G10X\\Downloads\\Hackathon\\.cursor\\debug.log", "a") as _f:
        _f.write(json.dumps(_log) + "\n")
except Exception as _e:
    with open("c:\\Users\\ManasKumarGupta(G10X\\Downloads\\Hackathon\\.cursor\\debug.log", "a") as _f:
        _f.write(json.dumps({"message": "version log failed", "data": {"err": str(_e)}}) + "\n")
# #endregion

class OpenAIService:
    """OpenAI service for AI-powered features"""
    
    def __init__(self):
        self.enabled = settings.ENABLE_OPENAI
        if self.enabled and settings.OPENAI_API_KEY:
            self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        else:
            self.client = None
            logger.warning("OpenAI service disabled")
    
    async def chat_completion(self, messages: List[Dict[str, str]], model: str = "gpt-3.5-turbo") -> Optional[str]:
        """Get chat completion"""
        if not self.enabled or not self.client:
            return "AI service is currently unavailable."
        
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            return None
    
    async def get_recommendation_reason(
        self,
        user_preferences: Dict,
        user_history: List[str],
        recommended_products: List[Dict]
    ) -> str:
        """Generate reason for recommendations using AI"""
        
        system_prompt = "You are a helpful shopping assistant. Explain in 1-2 sentences why these products match the user's preferences."
        
        user_prompt = f"""
        User preferences: {user_preferences}
        Recently viewed: {', '.join(user_history[:5])}
        
        Recommended products: {', '.join([p['name'] for p in recommended_products[:3]])}
        
        Why are these good matches?
        """
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        
        response = await self.chat_completion(messages)
        return response or "These products match your interests and browsing history."
    
    async def chat_with_assistant(
        self,
        user_message: str,
        user_context: Dict,
        conversation_history: List[Dict] = []
    ) -> str:
        """Chat with shopping assistant"""
        
        system_prompt = f"""You are a friendly shopping assistant.

User Context:
- Recent products: {user_context.get('recent_products', [])}
- Preferences: {user_context.get('preferences', {})}
- Budget: {user_context.get('budget', 'Not specified')}

Help users find products, answer questions, and provide recommendations.
Keep responses under 3 sentences unless asked for details.
"""
        
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(conversation_history)
        messages.append({"role": "user", "content": user_message})
        
        response = await self.chat_completion(messages)
        return response or "I'm here to help! What are you looking for?"

# Singleton instance
openai_service = OpenAIService()