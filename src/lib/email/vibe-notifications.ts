import { businessPortalUrl, sendEmailSafe } from "@/lib/email/send";

function layout(title: string, body: string) {
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:0 auto;padding:24px">
<h1 style="font-size:20px;margin:0 0 16px">${title}</h1>
${body}
<p style="margin-top:32px;font-size:12px;color:#666">Where The Vibes At · wherethevibesat.com</p>
</body></html>`;
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function notifyGuestVibeSplitInvite(params: {
  toEmail: string;
  hostName: string;
  packageTitle: string;
  amountCents: number;
  expiresAt: string;
  payUrl: string;
}) {
  const amount = formatPrice(params.amountCents);
  const when = new Date(params.expiresAt).toLocaleString();
  const host = escapeHtml(params.hostName || "A friend");
  const title = escapeHtml(params.packageTitle);
  const body = `<p><strong>${host}</strong> invited you to split <strong>${title}</strong>.</p>
<p>Your share: <strong>${amount}</strong></p>
<p>Pay by <strong>${escapeHtml(when)}</strong> so the vibe can be booked. Unpaid shares expire after that — paid shares are not auto-refunded.</p>
<p><a href="${params.payUrl}" style="display:inline-block;margin-top:12px;padding:12px 18px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:999px;font-weight:700">Pay my share</a></p>
<p style="font-size:13px;color:#555">Or open this link: ${escapeHtml(params.payUrl)}</p>`;

  sendEmailSafe({
    to: params.toEmail,
    subject: `Pay your share: ${params.packageTitle} (${amount})`,
    html: layout("You're invited to split a vibe", body),
    text: `${params.hostName} invited you to split ${params.packageTitle}. Your share is ${amount}. Pay by ${when}: ${params.payUrl}`,
  });
}

export function notifyVenueNewVibeBooking(params: {
  venueOwnerEmail: string;
  venueOwnerName: string;
  venueName: string;
  packageTitle: string;
  offerTitle: string;
  startsOnLabel: string | null;
  partySize: number;
  redemptionCode: string;
  payoutCents: number;
}) {
  const body = `<p>You have a new curated vibe booking for <strong>${params.venueName}</strong>.</p>
<ul>
<li>Vibe: ${params.packageTitle}</li>
<li>Experience: ${params.offerTitle}</li>
${params.startsOnLabel ? `<li>Start date: ${params.startsOnLabel}</li>` : ""}
<li>Party size: ${params.partySize}</li>
<li>Redemption code: <strong>${params.redemptionCode}</strong></li>
<li>Your payout: ${formatPrice(params.payoutCents)}</li>
</ul>
<p>Payout is sent to your connected Stripe account after payment clears.</p>
<p><a href="${businessPortalUrl("/vibe-bookings")}" style="display:inline-block;margin-top:12px;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">View vibe bookings</a></p>`;

  sendEmailSafe({
    to: params.venueOwnerEmail,
    subject: `New vibe booking: ${params.offerTitle}`,
    html: layout(`Hi ${params.venueOwnerName || "there"},`, body),
    text: `New vibe booking at ${params.venueName}: ${params.offerTitle}. Code ${params.redemptionCode}. Payout ${formatPrice(params.payoutCents)}.`,
  });
}
