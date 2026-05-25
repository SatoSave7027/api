import logging
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

logger = logging.getLogger(__name__)


def _build_otp_html(otp: str, email: str) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SatoSave Vault - Your Login Code</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Courier New',monospace;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#111;border:1px solid #1a2e1a;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#0d1f0d;padding:30px 40px;text-align:center;">
              <h1 style="color:#39ff14;margin:0;font-size:24px;letter-spacing:4px;">
                SATOSAVE VAULT
              </h1>
              <p style="color:#4ade80;margin:8px 0 0;font-size:12px;letter-spacing:2px;">
                SECURE PERSONAL VAULT
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="color:#a0a0a0;font-size:14px;margin:0 0 24px;">
                Your one-time login code for <strong style="color:#39ff14;">{email}</strong>:
              </p>
              <div style="background:#0d1f0d;border:2px solid #39ff14;border-radius:8px;
                          padding:24px;text-align:center;margin:0 0 24px;">
                <span style="color:#39ff14;font-size:36px;font-weight:bold;letter-spacing:8px;">
                  {otp}
                </span>
              </div>
              <p style="color:#666;font-size:12px;margin:0 0 8px;">
                This code expires in <strong style="color:#a0a0a0;">
                  {settings.OTP_EXPIRE_MINUTES} minutes</strong>.
              </p>
              <p style="color:#666;font-size:12px;margin:0;">
                If you did not request this code, please ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#0a0a0a;padding:20px 40px;text-align:center;">
              <p style="color:#333;font-size:11px;margin:0;">
                SatoSave Vault &mdash; Your data, encrypted and protected.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


async def send_otp_email(to_email: str, otp: str) -> bool:
    if settings.EMAIL_PROVIDER == "resend":
        return await _send_via_resend(to_email, otp)
    return await _send_via_smtp(to_email, otp)


async def _send_via_smtp(to_email: str, otp: str) -> bool:
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = "SatoSave Vault - Your Login Code"
        message["From"] = settings.SMTP_FROM
        message["To"] = to_email

        html_content = _build_otp_html(otp, to_email)
        plain_content = (
            f"SatoSave Vault - Your Login Code\n\n"
            f"Your one-time login code: {otp}\n\n"
            f"This code expires in {settings.OTP_EXPIRE_MINUTES} minutes.\n"
            f"If you did not request this code, please ignore this email."
        )

        message.attach(MIMEText(plain_content, "plain"))
        message.attach(MIMEText(html_content, "html"))

        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=settings.SMTP_TLS,
        )
        logger.info(f"OTP email sent via SMTP to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email via SMTP to {to_email}: {e}")
        return False


async def _send_via_resend(to_email: str, otp: str) -> bool:
    try:
        import resend as resend_client

        resend_client.api_key = settings.RESEND_API_KEY
        html_content = _build_otp_html(otp, to_email)

        params = {
            "from": settings.EMAIL_FROM,
            "to": [to_email],
            "subject": "SatoSave Vault - Your Login Code",
            "html": html_content,
        }
        response = resend_client.Emails.send(params)
        logger.info(f"OTP email sent via Resend to {to_email}: {response}")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email via Resend to {to_email}: {e}")
        return False
