import hmac
import hashlib
import resend
from app.config import settings


def _unsubscribe_url(uid: str) -> str:
    token = hmac.new(
        settings.UNSUBSCRIBE_SECRET.encode(),
        uid.encode(),
        hashlib.sha256,
    ).hexdigest()
    return f"{settings.FRONTEND_URL}/unsubscribe?uid={uid}&token={token}"


def _unsubscribe_footer(uid: str) -> str:
    url = _unsubscribe_url(uid)
    return (
        f'<p style="color:#888;font-size:12px;margin-top:24px;">'
        f'You\'re receiving this because you have email notifications enabled.<br>'
        f'<a href="{url}" style="display:inline-block;margin-top:8px;padding:6px 14px;'
        f'background:#374151;color:#d1d5db;font-size:12px;text-decoration:none;'
        f'border-radius:6px;border:1px solid #4b5563;">Unsubscribe</a>'
        f'</p>'
    )


def send_email(to_email: str, subject: str, html_body: str):
    if not settings.RESEND_API_KEY:
        print(f"[email_service] RESEND_API_KEY not configured, skipping email to {to_email}")
        return

    resend.api_key = settings.RESEND_API_KEY
    try:
        resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": to_email,
            "subject": subject,
            "html": html_body,
        })
    except Exception as e:
        print(f"[email_service] Failed to send email to {to_email}: {e}")


_TZ_ABBR = {
    "America/New_York": "ET",
    "America/Chicago": "CT",
    "America/Denver": "MT",
    "America/Los_Angeles": "PT",
    "America/Phoenix": "MT",
    "Europe/London": "GMT",
    "Europe/Paris": "CET",
    "Europe/Berlin": "CET",
    "Australia/Sydney": "AEST",
    "Australia/Melbourne": "AEST",
    "Asia/Tokyo": "JST",
}


def format_air_time(air_time: str | None, air_timezone: str | None) -> str | None:
    if not air_time:
        return None
    try:
        hour, minute = map(int, air_time.split(":"))
        period = "PM" if hour >= 12 else "AM"
        h12 = hour % 12 or 12
        time_str = f"{h12}:{minute:02d} {period}" if minute else f"{h12} {period}"
        tz_abbr = _TZ_ABBR.get(air_timezone) if air_timezone else None
        return f"{time_str} {tz_abbr}" if tz_abbr else time_str
    except Exception:
        return None


def send_notification_email(to_email: str, username: str, upcoming_items: list, uid: str = ""):
    """Send a digest email of upcoming episodes/releases."""
    if not upcoming_items:
        return

    def _item_html(item: dict) -> str:
        time_str = item.get("air_time")
        time_part = f' <span style="color:#888;font-size:13px;">· {time_str}</span>' if time_str else ""
        return (
            f'<li style="margin-bottom:6px">'
            f'<strong>{item["title"]}</strong>'
            f' — {item["date"]}'
            f'{time_part}'
            f'</li>'
        )

    items_html = "".join(_item_html(item) for item in upcoming_items)

    html_body = f"""
    <html><body style="font-family:sans-serif;color:#222;max-width:600px;margin:0 auto">
    <h2 style="color:#1e3a8a">Hi {username or 'there'},</h2>
    <p>Here's what's releasing on your Watch Calendar:</p>
    <ul style="line-height:1.8">{items_html}</ul>
    <p><a href="{settings.FRONTEND_URL}" style="color:#2563eb">View your calendar</a></p>
    {_unsubscribe_footer(uid)}
    </body></html>
    """
    send_email(to_email, "Your Watch Calendar — Releasing Today", html_body)


def send_season_premiere_email(to_email: str, username: str, alerts: list, uid: str = ""):
    """
    Send an alert email for upcoming season premieres.
    Each alert dict has: show_name, season_number, season_name, air_date, days_away (7 or 30).
    """
    if not alerts:
        return

    # Group by days_away so we can write distinct subject lines
    thirty_day = [a for a in alerts if a["days_away"] == 30]
    seven_day = [a for a in alerts if a["days_away"] == 7]

    def _alert_html(a: dict) -> str:
        season_label = a.get("season_name") or f"Season {a['season_number']}"
        return (
            f'<li style="margin-bottom:10px">'
            f'<strong>{a["show_name"]}</strong> — {season_label}'
            f'<br><span style="color:#888;font-size:13px;">Premieres {a["air_date"]}</span>'
            f'</li>'
        )

    sections = ""
    if thirty_day:
        items_html = "".join(_alert_html(a) for a in thirty_day)
        sections += f"""
        <h3 style="color:#1e40af;margin-top:20px">Coming in one month</h3>
        <ul style="line-height:2">{items_html}</ul>
        """
    if seven_day:
        items_html = "".join(_alert_html(a) for a in seven_day)
        sections += f"""
        <h3 style="color:#1e40af;margin-top:20px">Coming in one week</h3>
        <ul style="line-height:2">{items_html}</ul>
        """

    count = len(alerts)
    subject = (
        f"New season{'s' if count > 1 else ''} coming soon — Watch Calendar"
    )

    html_body = f"""
    <html><body style="font-family:sans-serif;color:#222;max-width:600px;margin:0 auto">
    <h2 style="color:#1e3a8a">Hi {username or 'there'},</h2>
    <p>Heads up! The following show{'s' if count > 1 else ''} you're tracking ha{'ve' if count > 1 else 's'} a new season coming up:</p>
    {sections}
    <p><a href="{settings.FRONTEND_URL}" style="color:#2563eb">View your Watch Calendar</a></p>
    {_unsubscribe_footer(uid)}
    </body></html>
    """
    send_email(to_email, subject, html_body)


def send_recommendation_email(
    to_email: str,
    to_username: str,
    from_username: str,
    content_type: str,
    content_title: str,
    content_id: int,
    message: str | None,
    uid: str = "",
):
    content_path = f"{'movie' if content_type == 'movie' else 'tv'}/{content_id}"
    content_url = f"{settings.FRONTEND_URL}/{content_path}"
    kind = "movie" if content_type == "movie" else "TV show"

    message_block = (
        f'<blockquote style="border-left:3px solid #3b82f6;margin:12px 0;padding:8px 12px;color:#555;font-style:italic;">'
        f'{message}'
        f'</blockquote>'
    ) if message else ""

    html_body = f"""
    <html><body style="font-family:sans-serif;color:#222;max-width:600px;margin:0 auto">
    <h2 style="color:#1e3a8a">Hi {to_username or 'there'},</h2>
    <p>
      <strong>{from_username}</strong> recommended a {kind} for you:
    </p>
    <p style="font-size:18px;font-weight:bold;">
      <a href="{content_url}" style="color:#2563eb;text-decoration:none;">{content_title}</a>
    </p>
    {message_block}
    <p>
      <a href="{content_url}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">
        View {content_title}
      </a>
    </p>
    {_unsubscribe_footer(uid)}
    </body></html>
    """
    send_email(to_email, f"{from_username} recommended \"{content_title}\" to you", html_body)
