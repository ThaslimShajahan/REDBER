"""
Email notification service using Resend API.
Requires RESEND_API_KEY env var. ADMIN_FROM_EMAIL defaults to a noreply address.
All functions are fire-and-forget safe — they log errors and return False on failure.
"""
import os
import logging
import httpx

_logger = logging.getLogger(__name__)
_RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
_FROM_EMAIL = os.environ.get("ADMIN_FROM_EMAIL", "Redber AI <notifications@redber.ai>")
_ADMIN_URL = os.environ.get("ADMIN_URL", "https://redber.in/admin")


async def _send(to: str, subject: str, html: str) -> bool:
    if not _RESEND_API_KEY:
        _logger.debug("[Email] RESEND_API_KEY not set — skipping email to %s", to)
        return False
    if not to or "@" not in to:
        return False
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            r = await c.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {_RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={"from": _FROM_EMAIL, "to": [to], "subject": subject, "html": html},
            )
            if r.status_code not in (200, 201):
                _logger.warning("[Email] Resend %d for %s: %s", r.status_code, to, r.text[:200])
            return r.status_code in (200, 201)
    except Exception as exc:
        _logger.error("[Email] send error to %s: %s", to, exc)
        return False


def _card(header_gradient: str, header_html: str, body_html: str, cta_url: str, cta_label: str, footer: str) -> str:
    return f"""
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#0d0d0d;color:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #1f2937">
  <div style="background:{header_gradient};padding:28px 32px">{header_html}</div>
  <div style="padding:28px 32px">{body_html}
    <p style="text-align:center;margin:28px 0 0">
      <a href="{cta_url}" style="background:{header_gradient};color:#fff;padding:11px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px">{cta_label}</a>
    </p>
  </div>
  <div style="border-top:1px solid #1f2937;padding:14px 32px;font-size:11px;color:#4b5563;text-align:center">{footer}</div>
</div>"""


async def notify_new_lead(admin_email: str, lead: dict, bot_name: str) -> bool:
    score = lead.get("score", 0)
    name = lead.get("name") or "Unknown"
    phone = lead.get("phone") or "—"
    email = lead.get("email") or "—"
    lead_type = (lead.get("type") or "—").replace("_", " ").title()
    raw_summary = lead.get("summary", "")
    summary = raw_summary.split("SUMMARY:")[-1].strip()[:350] if "SUMMARY:" in raw_summary else raw_summary[:350]
    heat = "🔥 Hot" if score > 80 else ("🟡 Warm" if score >= 50 else "⚪ Cold")

    rows = "".join(
        f'<tr><td style="padding:7px 0;color:#9ca3af;width:110px;font-size:13px">{lbl}</td>'
        f'<td style="color:#fff;font-weight:600;font-size:13px">{val}</td></tr>'
        for lbl, val in [("Name", name), ("Phone", phone), ("Email", email), ("Type", lead_type)]
    )
    summary_block = (
        f'<div style="background:#1a1a2e;border-left:3px solid #6d28d9;border-radius:6px;padding:12px 14px;'
        f'margin-top:18px;font-size:13px;color:#d1d5db;line-height:1.6">{summary}</div>'
        if summary else ""
    )
    body = f'<table style="width:100%;border-collapse:collapse">{rows}</table>{summary_block}'
    header = (
        f'<h2 style="margin:0;font-size:19px;font-weight:800">New Lead — {bot_name}</h2>'
        f'<p style="margin:6px 0 0;opacity:.75;font-size:13px">{heat} &nbsp;·&nbsp; Score: {score}/100</p>'
    )
    return await _send(
        admin_email,
        f"[{heat}] New Lead: {name} · {bot_name}",
        _card("linear-gradient(135deg,#6d28d9,#4f46e5)", header, body, _ADMIN_URL, "View Lead →",
              f"Redber AI · notification for {bot_name}"),
    )


async def notify_new_booking(admin_email: str, booking: dict, bot_name: str) -> bool:
    name = booking.get("name") or "Unknown"
    phone = booking.get("phone") or "—"
    date = booking.get("date") or "—"
    time_str = booking.get("time") or "—"
    guests = booking.get("guests") or "—"
    room = booking.get("room_type") or "—"

    rows = "".join(
        f'<tr><td style="padding:7px 0;color:#9ca3af;width:110px;font-size:13px">{lbl}</td>'
        f'<td style="color:#fff;font-weight:600;font-size:13px">{val}</td></tr>'
        for lbl, val in [("Guest", name), ("Phone", phone), ("Date", date),
                         ("Time", time_str), ("Guests", guests), ("Room / Type", room)]
    )
    body = f'<table style="width:100%;border-collapse:collapse">{rows}</table>'
    header = f'<h2 style="margin:0;font-size:19px;font-weight:800">✅ New Booking Confirmed — {bot_name}</h2>'
    return await _send(
        admin_email,
        f"✅ Booking: {name} on {date} · {bot_name}",
        _card("linear-gradient(135deg,#065f46,#047857)", header, body, _ADMIN_URL, "View Bookings →",
              f"Redber AI · notification for {bot_name}"),
    )


async def notify_new_contact(admin_email: str, contact: dict, bot_name: str) -> bool:
    name = contact.get("name") or "Unknown"
    email = contact.get("email") or "—"
    subject = contact.get("subject") or "(no subject)"
    message = (contact.get("message") or "")[:400]

    rows = "".join(
        f'<tr><td style="padding:7px 0;color:#9ca3af;width:90px;font-size:13px">{lbl}</td>'
        f'<td style="color:#fff;font-weight:600;font-size:13px">{val}</td></tr>'
        for lbl, val in [("From", name), ("Email", email), ("Subject", subject)]
    )
    msg_block = (
        f'<div style="background:#1a1a2e;border-radius:8px;padding:14px;margin-top:18px;'
        f'font-size:13px;color:#d1d5db;white-space:pre-wrap;line-height:1.6">{message}</div>'
    )
    body = f'<table style="width:100%;border-collapse:collapse">{rows}</table>{msg_block}'
    header = f'<h2 style="margin:0;font-size:19px;font-weight:800">📩 New Contact — {bot_name}</h2>'
    return await _send(
        admin_email,
        f"📩 Contact: {subject} from {name}",
        _card("linear-gradient(135deg,#1e40af,#2563eb)", header, body, _ADMIN_URL, "Reply in Admin →",
              f"Redber AI · notification for {bot_name}"),
    )


async def confirm_booking_to_customer(customer_email: str, booking: dict, bot_name: str, booking_link: str = "") -> bool:
    """Send a booking confirmation directly to the customer."""
    name = booking.get("name") or "Valued Guest"
    date = booking.get("date") or "—"
    time_str = booking.get("time") or "—"
    guests = booking.get("guests") or "—"
    room = booking.get("room_type") or "—"
    check_out = booking.get("check_out") or "—"

    detail_rows = [(lbl, val) for lbl, val in [
        ("Name", name), ("Date / Check-In", date), ("Check-Out", check_out),
        ("Time", time_str), ("Guests", guests), ("Room / Type", room),
    ] if val and val != "—"]

    rows_html = "".join(
        f'<tr>'
        f'<td style="padding:9px 12px 9px 0;color:#6b7280;font-size:14px;white-space:nowrap;vertical-align:top">{lbl}</td>'
        f'<td style="padding:9px 0;color:#111827;font-weight:600;font-size:14px">{val}</td>'
        f'</tr>'
        for lbl, val in detail_rows
    )

    booking_btn = (
        f'<p style="text-align:center;margin:28px 0 0">'
        f'<a href="{booking_link}" style="background:linear-gradient(135deg,#065f46,#047857);color:#fff;'
        f'padding:13px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">'
        f'Complete Your Booking →</a></p>'
        if booking_link else ""
    )

    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:560px;width:100%">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#065f46,#047857);padding:36px 40px;text-align:center">
          <div style="font-size:48px;margin-bottom:12px">✅</div>
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px">Booking Confirmed!</h1>
          <p style="margin:8px 0 0;color:#a7f3d0;font-size:15px">Your reservation is secured with {bot_name}</p>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:32px 40px 0">
          <p style="margin:0;font-size:16px;color:#374151;line-height:1.6">
            Hi <strong>{name}</strong>,<br><br>
            Great news — your booking has been successfully confirmed. Here's a summary of your reservation:
          </p>
        </td></tr>

        <!-- Details card -->
        <tr><td style="padding:24px 40px">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px 24px">
            <tr><td>
              <p style="margin:0 0 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#9ca3af">Reservation Details</p>
              <table width="100%" cellpadding="0" cellspacing="0">{rows_html}</table>
            </td></tr>
          </table>
        </td></tr>

        <!-- CTA (booking link if set) -->
        {f'<tr><td style="padding:0 40px 32px">{booking_btn}</td></tr>' if booking_link else ''}

        <!-- What's next -->
        <tr><td style="padding:0 40px 32px">
          <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:18px 22px">
            <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#92400e">What happens next?</p>
            <p style="margin:0;font-size:13px;color:#78350f;line-height:1.6">
              Our team will be in touch shortly to confirm the final details.
              If you need to make any changes, please contact us as soon as possible.
            </p>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center">
          <p style="margin:0;font-size:12px;color:#9ca3af">
            This confirmation was sent by <strong style="color:#374151">{bot_name}</strong> via Redber AI.<br>
            If you didn't make this booking, please contact us immediately.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""

    return await _send(
        customer_email,
        f"✅ Booking Confirmed — {bot_name}",
        html,
    )
