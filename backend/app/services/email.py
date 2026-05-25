import smtplib
from email.message import EmailMessage

from fastapi import HTTPException, status

from app.config import get_settings


class EmailService:
    def send_otp(self, recipient: str, code: str) -> None:
        settings = get_settings()
        if not settings.smtp_host or not settings.smtp_from_email:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="SMTP is not configured for OTP delivery")

        message = EmailMessage()
        message["Subject"] = "Your SatoSave Vault login code"
        message["From"] = settings.smtp_from_email
        message["To"] = recipient
        message.set_content(
            "Use this one-time code to sign in to SatoSave Vault: "
            f"{code}\n\nThe code expires in {settings.otp_ttl_minutes} minutes."
        )

        try:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
                if settings.smtp_use_tls:
                    smtp.starttls()
                if settings.smtp_username and settings.smtp_password:
                    smtp.login(settings.smtp_username, settings.smtp_password)
                smtp.send_message(message)
        except smtplib.SMTPException as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unable to deliver OTP email") from exc


email_service = EmailService()
