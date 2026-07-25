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
