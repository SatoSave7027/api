import smtplib
from email.message import EmailMessage

from app.config import get_settings

settings = get_settings()


def send_otp_email(email: str, code: str) -> None:
    message = EmailMessage()
    message["Subject"] = "Your SatoSave Vault verification code"
    message["From"] = settings.smtp_from_email
    message["To"] = email
    message.set_content(
        (
            "SatoSave Vault OTP login code\n\n"
            f"Your verification code is: {code}\n"
            f"This code expires in {settings.otp_expiration_minutes} minutes.\n\n"
            "If you did not request this code, ignore this email."
        )
    )

    if settings.smtp_use_ssl:
        with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(message)
        return

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls()
        smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(message)
