"""Email delivery for OTP codes. Supports SMTP and Resend."""

from __future__ import annotations

import logging
import smtplib
import ssl
from email.message import EmailMessage
from typing import Protocol

import httpx

from app.config import settings


logger = logging.getLogger(__name__)


class EmailProvider(Protocol):
    def send(self, *, to: str, subject: str, text: str, html: str) -> None: ...


class SmtpProvider:
    def send(self, *, to: str, subject: str, text: str, html: str) -> None:
        message = EmailMessage()
        message["From"] = settings.email_from
        message["To"] = to
        message["Subject"] = subject
        message.set_content(text)
        message.add_alternative(html, subtype="html")

        context = ssl.create_default_context()
        if settings.smtp_port == 465:
            with smtplib.SMTP_SSL(
                settings.smtp_host, settings.smtp_port, context=context, timeout=20
            ) as server:
                if settings.smtp_username:
                    server.login(settings.smtp_username, settings.smtp_password)
                server.send_message(message)
        else:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as server:
                server.ehlo()
                if settings.smtp_use_tls:
                    server.starttls(context=context)
                    server.ehlo()
                if settings.smtp_username:
                    server.login(settings.smtp_username, settings.smtp_password)
                server.send_message(message)


class ResendProvider:
    API_URL = "https://api.resend.com/emails"

    def send(self, *, to: str, subject: str, text: str, html: str) -> None:
        if not settings.resend_api_key:
            raise RuntimeError("RESEND_API_KEY is not configured.")
        payload = {
            "from": settings.email_from,
            "to": [to],
            "subject": subject,
            "text": text,
            "html": html,
        }
        headers = {
            "Authorization": f"Bearer {settings.resend_api_key}",
            "Content-Type": "application/json",
        }
        with httpx.Client(timeout=20.0) as client:
            response = client.post(self.API_URL, json=payload, headers=headers)
            response.raise_for_status()


class ConsoleProvider:
    """Emergency fallback that logs the email. Not for production use."""

    def send(self, *, to: str, subject: str, text: str, html: str) -> None:
        logger.warning(
            "[ConsoleEmailProvider] Email not delivered. "
            "Configure EMAIL_PROVIDER=smtp or resend. "
            "to=%s subject=%s body=%s",
            to,
            subject,
            text,
        )


def _select_provider() -> EmailProvider:
    provider = settings.email_provider.lower()
    if provider == "smtp":
        return SmtpProvider()
    if provider == "resend":
        return ResendProvider()
    if provider == "console":
        return ConsoleProvider()
    raise RuntimeError(f"Unknown EMAIL_PROVIDER: {settings.email_provider!r}")


def send_otp_email(email: str, code: str, ttl_minutes: int) -> None:
    subject = f"Your {settings.app_name} verification code"
    text = (
        f"Your {settings.app_name} verification code is: {code}\n"
        f"It will expire in {ttl_minutes} minutes.\n"
        "If you did not request this code, you can safely ignore this email."
    )
    html = f"""\
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,Arial,sans-serif;color:#e6fff7;">
    <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
      <h1 style="color:#39ff88;margin:0 0 8px;font-size:22px;">{settings.app_name}</h1>
      <p style="opacity:.75;margin:0 0 24px;">Your secure vault verification code</p>
      <div style="background:#11171a;border:1px solid #1f2a30;border-radius:14px;padding:24px;text-align:center;">
        <div style="font-size:36px;letter-spacing:8px;color:#39ff88;font-weight:700;">{code}</div>
        <div style="opacity:.65;margin-top:8px;font-size:13px;">
          Expires in {ttl_minutes} minutes
        </div>
      </div>
      <p style="opacity:.55;font-size:12px;margin-top:24px;">
        If you did not request this code, you can safely ignore this email.
      </p>
    </div>
  </body>
</html>
"""
    provider = _select_provider()
    provider.send(to=email, subject=subject, text=text, html=html)
