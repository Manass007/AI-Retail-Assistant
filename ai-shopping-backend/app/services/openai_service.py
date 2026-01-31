from openai import OpenAI
from app.config import settings
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


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

    async def chat_assistant_engaged(
        self,
        user_message: str,
        catalog_summary: str,
        last_ordered_summary: str,
        frequently_ordered_summary: str,
        bundle_summary: str,
        suggested_product_names: str = "None",
        conversation_history: List[Dict] = None,
    ) -> str:
        """Chat for engaged assistant: shopping-only scope, relevant product suggestions only."""
        conversation_history = conversation_history or []
        system_prompt = f"""You are a SHOPPING assistant ONLY. You help users find products, reorder, and use offers from this store.

STRICT RULES:
1) If the user asks about something NOT related to shopping (e.g. what is Java, politics, famous places, general knowledge), reply ONLY: "I can only help with shopping and our products. What would you like to find or order?"
2) Do NOT answer programming, travel, politics, or any non-shopping questions. Do NOT suggest "Java Programming for Beginners" or similar unless we sell that product and the user asked for it.
3) When the user asks about shopping (e.g. breakfast ideas, groceries, shoes), ONLY suggest products from this list when it is relevant. If "Products matching this message" is "None" or not relevant to the question, do NOT suggest random products—say they can browse categories or name a category (e.g. Groceries, Dairy) and we can help.
4) For food/breakfast/cuisine questions, ONLY suggest from: Products matching this message. Never suggest shoes, yoga mats, or unrelated items for breakfast—only grocery/food items from the list.

Product catalog (id, name, category): {catalog_summary}
Last ordered: {last_ordered_summary}
Frequently ordered: {frequently_ordered_summary}
Bundle offers: {bundle_summary}
Products matching this message (suggest ONLY these when relevant; if None or irrelevant, do not suggest products): {suggested_product_names}

Reply in 2-4 short sentences. Use $ for prices. Do not list product IDs."""
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(conversation_history)
        messages.append({"role": "user", "content": user_message})
        response = await self.chat_completion(messages)
        return response or "I'm here to help with shopping. What would you like to find?"


# Singleton instance
openai_service = OpenAIService()