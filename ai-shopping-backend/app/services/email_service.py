from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class EmailService:
    """Email service using SendGrid (like your nodemailer service)"""
    
    def __init__(self):
        self.enabled = settings.ENABLE_EMAIL
        if self.enabled and settings.SENDGRID_API_KEY:
            self.client = SendGridAPIClient(settings.SENDGRID_API_KEY)
        else:
            self.client = None
            logger.warning("Email service disabled")
    
    async def send_email(self, to: str, subject: str, html_content: str):
        """Send email"""
        if not self.enabled or not self.client:
            logger.info(f"[MOCK EMAIL] To: {to}, Subject: {subject}")
            return {"success": True, "message": "Email service disabled"}
        
        try:
            message = Mail(
                from_email=settings.SENDGRID_FROM_EMAIL,
                to_emails=to,
                subject=subject,
                html_content=html_content
            )
            
            response = self.client.send(message)
            logger.info(f"Email sent to {to}: Status {response.status_code}")
            return {"success": True, "messageId": response.headers.get('X-Message-Id')}
        
        except Exception as e:
            logger.error(f"Failed to send email to {to}: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def send_otp_email(self, email: str, otp: str, is_new_user: bool = False):
        """Send OTP email (exactly like your sendOTPEmail)"""
        
        subject = "Welcome! Your OTP for Registration" if is_new_user else "Your OTP for Login"
        message = f"Your OTP is: {otp}. Valid for 10 minutes." if not is_new_user else f"Welcome! Your registration OTP is: {otp}. Valid for 10 minutes."
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #000; color: white; padding: 20px; text-align: center; }}
            .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }}
            .otp {{ font-size: 32px; font-weight: bold; color: #000; text-align: center; padding: 20px; background-color: white; border-radius: 5px; letter-spacing: 5px; }}
            .footer {{ text-align: center; margin-top: 20px; color: #777; font-size: 12px; }}
            .warning {{ color: #d32f2f; font-size: 14px; margin-top: 15px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>{"Welcome!" if is_new_user else "Login Verification"}</h1>
            </div>
            <div class="content">
              <p>{"Thank you for signing up!" if is_new_user else "Hello!"}</p>
              <p>{message}</p>
              <div class="otp">{otp}</div>
              <p class="warning">⚠️ Never share this OTP with anyone.</p>
              <p>If you didn't request this OTP, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2024 AI Shopping Assistant. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
        """
        
        return await self.send_email(email, subject, html_content)
    
    async def send_welcome_email(self, email: str, name: str):
        """Send welcome email (like your sendWelcomeEmail)"""
        
        subject = "Welcome to AI Shopping Assistant! 🎉"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #000; color: white; padding: 20px; text-align: center; }}
            .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }}
            .footer {{ text-align: center; margin-top: 20px; color: #777; font-size: 12px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome, {name}! 🎉</h1>
            </div>
            <div class="content">
              <p>Thank you for joining AI Shopping Assistant!</p>
              <p>Your personalized shopping experience starts now.</p>
              <p><strong>What you can do:</strong></p>
              <ul>
                <li>Get AI-powered product recommendations</li>
                <li>Save items to your wishlist</li>
                <li>Receive personalized offers</li>
                <li>Track your shopping history</li>
              </ul>
              <p>Happy shopping!</p>
            </div>
            <div class="footer">
              <p>© 2024 AI Shopping Assistant. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
        """
        
        return await self.send_email(email, subject, html_content)
    
    async def send_cart_recovery_email(self, email: str, name: str, product_name: str):
        """Send cart recovery email"""
        
        subject = "You left something behind... 🛒"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #3b82f6; color: white; padding: 20px; text-align: center; }}
            .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }}
            .button {{ display: inline-block; padding: 12px 30px; background-color: #000; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Still thinking about it? 🤔</h1>
            </div>
            <div class="content">
              <p>Hi {name},</p>
              <p>Your cart has <strong>{product_name}</strong> waiting for you.</p>
              <p>Complete your purchase now!</p>
              <a href="{settings.FRONTEND_URL}/cart" class="button">View Cart</a>
            </div>
          </div>
        </body>
        </html>
        """
        
        return await self.send_email(email, subject, html_content)
    
    async def send_stock_alert(self, email: str, name: str, product_name: str):
        """Send stock alert email"""
        
        subject = f"{product_name} is back in stock! 🎉"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Good news, {name}! 🎉</h2>
            <p><strong>{product_name}</strong> is now available.</p>
            <p>Get it before it's gone again!</p>
            <a href="{settings.FRONTEND_URL}/products" 
               style="display: inline-block; padding: 12px 30px; background-color: #000; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
              Shop Now
            </a>
          </div>
        </body>
        </html>
        """
        
        return await self.send_email(email, subject, html_content)

# Singleton instance
email_service = EmailService()