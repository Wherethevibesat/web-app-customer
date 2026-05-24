import { businessPortalUrl, customerPortalUrl, sendEmailSafe } from "@/lib/email/send";

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

export function notifyCustomerBookingConfirmed(params: {
  customerEmail: string;
  customerName: string;
  companyName: string;
  packageLabel: string;
  vehicleName: string;
  pickupAddress: string;
  dropoffAddress?: string | null;
  scheduledAt: string;
  priceCents: number;
}) {
  const body = `<p>Payment received — your ride request is sent to <strong>${params.companyName}</strong>.</p>
<ul>
<li>Package: ${params.packageLabel} · ${params.vehicleName}</li>
<li>Pickup: ${params.pickupAddress}</li>
${params.dropoffAddress ? `<li>Drop-off: ${params.dropoffAddress}</li>` : ""}
<li>Scheduled: ${params.scheduledAt}</li>
<li>Total paid: ${formatPrice(params.priceCents)}</li>
</ul>
<p>The driver will accept or decline your request. We'll email you when they respond.</p>
<p><a href="${customerPortalUrl("/account")}" style="display:inline-block;margin-top:12px;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">View account</a></p>`;

  sendEmailSafe({
    to: params.customerEmail,
    subject: `Booking request sent: ${params.companyName}`,
    html: layout(`Hi ${params.customerName || "there"},`, body),
    text: `Your ride with ${params.companyName} on ${params.scheduledAt} was paid (${formatPrice(params.priceCents)}). The driver will respond soon.`,
  });
}

export function notifyDriverNewBooking(params: {
  driverEmail: string;
  driverName: string;
  companyName: string;
  customerName: string;
  customerEmail: string;
  packageLabel: string;
  vehicleName: string;
  pickupAddress: string;
  dropoffAddress?: string | null;
  scheduledAt: string;
  priceCents: number;
}) {
  const body = `<p>You have a new paid booking request for <strong>${params.companyName}</strong>.</p>
<ul>
<li>Customer: ${params.customerName} (<a href="mailto:${params.customerEmail}">${params.customerEmail}</a>)</li>
<li>Package: ${params.packageLabel} · ${params.vehicleName}</li>
<li>Pickup: ${params.pickupAddress}</li>
${params.dropoffAddress ? `<li>Drop-off: ${params.dropoffAddress}</li>` : ""}
<li>Scheduled: ${params.scheduledAt}</li>
<li>Total: ${formatPrice(params.priceCents)}</li>
</ul>
<p>Accept or decline in your driver portal.</p>
<p><a href="${businessPortalUrl("/driver/bookings")}" style="display:inline-block;margin-top:12px;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">View bookings</a></p>`;

  sendEmailSafe({
    to: params.driverEmail,
    subject: `New booking request: ${params.customerName}`,
    html: layout(`Hi ${params.driverName || "there"},`, body),
    text: `New booking from ${params.customerName} for ${params.packageLabel} on ${params.scheduledAt}. Accept/decline: ${businessPortalUrl("/driver/bookings")}`,
  });
}
