import { businessPortalUrl, customerPortalUrl, sendEmailSafe } from "@/lib/email/send";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function layout(title: string, body: string) {
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:0 auto;padding:24px">
<h1 style="font-size:20px;margin:0 0 16px">${title}</h1>
${body}
<p style="margin-top:32px;font-size:12px;color:#666">Where The Vibes At · wherethevibesat.com</p>
</body></html>`;
}

export function notifyPromoterNewInquiry(params: {
  promoterEmail: string;
  promoterName: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  partySize?: number | null;
  arrivalTime?: string | null;
  notes?: string | null;
  offerName: string;
  offerPriceCents: number;
  eventTitle: string;
}) {
  const lines = [
    `<p><strong>${params.guestName}</strong> requested to book <strong>${params.offerName}</strong> (${formatPrice(params.offerPriceCents)}) for <strong>${params.eventTitle}</strong>.</p>`,
    `<p>Email: <a href="mailto:${params.guestEmail}">${params.guestEmail}</a></p>`,
  ];
  if (params.guestPhone) lines.push(`<p>Phone: ${params.guestPhone}</p>`);
  if (params.partySize) lines.push(`<p>Party size: ${params.partySize}</p>`);
  if (params.arrivalTime) lines.push(`<p>Arrival: ${params.arrivalTime}</p>`);
  if (params.notes) lines.push(`<p>Notes: ${params.notes}</p>`);
  lines.push(
    `<p><a href="${businessPortalUrl("/promoter/inbox")}" style="display:inline-block;margin-top:12px;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">View inbox</a></p>`,
  );

  const text = `New booking inquiry from ${params.guestName} for ${params.offerName} (${params.eventTitle}). Contact: ${params.guestEmail}. Inbox: ${businessPortalUrl("/promoter/inbox")}`;

  sendEmailSafe({
    to: params.promoterEmail,
    subject: `New inquiry: ${params.offerName} — ${params.guestName}`,
    html: layout(`Hi ${params.promoterName || "there"},`, lines.join("\n")),
    text,
  });
}

export function notifyCustomerInquiryReceived(params: {
  guestEmail: string;
  guestName: string;
  offerName: string;
  eventTitle: string;
}) {
  const body = `<p>We received your request for <strong>${params.offerName}</strong> at <strong>${params.eventTitle}</strong>.</p>
<p>The promoter will review your inquiry and follow up by email.</p>`;

  sendEmailSafe({
    to: params.guestEmail,
    subject: `Inquiry received: ${params.offerName}`,
    html: layout(`Hi ${params.guestName},`, body),
    text: `Your inquiry for ${params.offerName} (${params.eventTitle}) was received. The promoter will contact you soon.`,
  });
}

export function notifyCustomerInquiryStatus(params: {
  guestEmail: string;
  guestName: string;
  status: string;
  offerName: string;
  eventTitle: string;
  promoterNotes?: string | null;
}) {
  const statusLabel =
    params.status === "reserved"
      ? "Reserved"
      : params.status === "booked"
        ? "Confirmed"
        : params.status === "declined"
          ? "Declined"
          : params.status === "cancelled"
            ? "Cancelled"
            : params.status;

  let body = `<p>Your request for <strong>${params.offerName}</strong> at <strong>${params.eventTitle}</strong> is now: <strong>${statusLabel}</strong>.</p>`;
  if (params.promoterNotes?.trim()) {
    body += `<p>Message from promoter: ${params.promoterNotes.trim()}</p>`;
  }
  if (params.status === "booked" || params.status === "reserved") {
    body += `<p>Check your email for next steps from the promoter.</p>`;
  }

  sendEmailSafe({
    to: params.guestEmail,
    subject: `Booking update: ${params.offerName} — ${statusLabel}`,
    html: layout(`Hi ${params.guestName},`, body),
    text: `Your inquiry for ${params.offerName} is now ${statusLabel}.${params.promoterNotes ? ` Note: ${params.promoterNotes}` : ""}`,
  });
}

export function notifyPromoterVenueLink(params: {
  promoterEmail: string;
  promoterName: string;
  venueName: string;
  approved: boolean;
}) {
  const body = params.approved
    ? `<p>You can now create offers and events for <strong>${params.venueName}</strong>.</p>
<p><a href="${businessPortalUrl("/promoter/venues")}" style="display:inline-block;margin-top:12px;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Open promoter portal</a></p>`
    : `<p>Your request to partner with <strong>${params.venueName}</strong> was not approved at this time.</p>
<p>You can request other venues from your promoter dashboard.</p>`;

  sendEmailSafe({
    to: params.promoterEmail,
    subject: params.approved
      ? `Approved: ${params.venueName}`
      : `Venue request update: ${params.venueName}`,
    html: layout(`Hi ${params.promoterName || "there"},`, body),
    text: params.approved
      ? `You're approved to promote at ${params.venueName}. Portal: ${businessPortalUrl("/promoter")}`
      : `Your venue request for ${params.venueName} was not approved.`,
  });
}

export function notifyPromoterEventReview(params: {
  promoterEmail: string;
  promoterName: string;
  eventTitle: string;
  venueName: string;
  approved: boolean;
}) {
  const body = params.approved
    ? `<p>Your event <strong>${params.eventTitle}</strong> at <strong>${params.venueName}</strong> was approved and is live on WTVA.</p>
<p><a href="${customerPortalUrl("/events")}" style="display:inline-block;margin-top:12px;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Browse events</a></p>`
    : `<p>Your event <strong>${params.eventTitle}</strong> at <strong>${params.venueName}</strong> was not approved by the venue.</p>
<p>Contact the venue owner or edit the event in your promoter portal.</p>`;

  sendEmailSafe({
    to: params.promoterEmail,
    subject: params.approved
      ? `Event approved: ${params.eventTitle}`
      : `Event not approved: ${params.eventTitle}`,
    html: layout(`Hi ${params.promoterName || "there"},`, body),
    text: params.approved
      ? `Event "${params.eventTitle}" at ${params.venueName} is approved.`
      : `Event "${params.eventTitle}" at ${params.venueName} was not approved.`,
  });
}

export function notifyPromoterWelcome(params: {
  email: string;
  name: string;
  venueName?: string;
}) {
  const body = `<p>Your WTVA promoter account is ready.</p>
${params.venueName ? `<p>You've been linked to <strong>${params.venueName}</strong>.</p>` : ""}
<p><a href="${businessPortalUrl("/auth/login?role=promoter")}" style="display:inline-block;margin-top:12px;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Sign in to promoter portal</a></p>
<p style="font-size:13px;color:#666">Use "Forgot password" on first sign-in if you don't have a password yet.</p>`;

  sendEmailSafe({
    to: params.email,
    subject: "Welcome to WTVA Promoters",
    html: layout(`Hi ${params.name || "there"},`, body),
    text: `Your WTVA promoter account is ready. Sign in: ${businessPortalUrl("/auth/login?role=promoter")}`,
  });
}

export function notifyPromoterProfileInquiry(params: {
  promoterEmail: string;
  promoterName: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  partySize?: number | null;
  preferredEvent?: string | null;
  notes?: string | null;
}) {
  const lines = [
    `<p><strong>${params.guestName}</strong> sent a message from your public WTVA profile.</p>`,
    `<p>Email: <a href="mailto:${params.guestEmail}">${params.guestEmail}</a></p>`,
  ];
  if (params.guestPhone) lines.push(`<p>Phone: ${params.guestPhone}</p>`);
  if (params.partySize) lines.push(`<p>Party size: ${params.partySize}</p>`);
  if (params.preferredEvent?.trim()) {
    lines.push(`<p>Interested in: ${params.preferredEvent.trim()}</p>`);
  }
  if (params.notes?.trim()) lines.push(`<p>Notes: ${params.notes.trim()}</p>`);
  lines.push(
    `<p><a href="${businessPortalUrl("/promoter/inbox")}" style="display:inline-block;margin-top:12px;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">View inbox</a></p>`,
  );

  sendEmailSafe({
    to: params.promoterEmail,
    subject: `Profile inquiry: ${params.guestName}`,
    html: layout(`Hi ${params.promoterName || "there"},`, lines.join("\n")),
    text: `New profile inquiry from ${params.guestName} (${params.guestEmail}). Inbox: ${businessPortalUrl("/promoter/inbox")}`,
  });
}

export function notifyCustomerProfileInquiryReceived(params: {
  guestEmail: string;
  guestName: string;
  promoterName: string;
}) {
  const body = `<p>We sent your message to <strong>${params.promoterName}</strong>.</p>
<p>They will follow up by email.</p>`;

  sendEmailSafe({
    to: params.guestEmail,
    subject: `Message sent to ${params.promoterName}`,
    html: layout(`Hi ${params.guestName},`, body),
    text: `Your message to ${params.promoterName} was sent. They will contact you soon.`,
  });
}
