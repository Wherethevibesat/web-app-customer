export const VENUE_PLACEHOLDER = "/brand/venue-placeholder.jpg";
export const EVENT_PLACEHOLDER = "/brand/event-placeholder.jpg";

/** Returns a usable venue image URL, falling back to the branded placeholder. */
export function venueImage(url?: string | null): string {
  return url?.trim() ? url : VENUE_PLACEHOLDER;
}

/** Returns a usable event image URL, falling back to the branded placeholder. */
export function eventImage(url?: string | null): string {
  return url?.trim() ? url : EVENT_PLACEHOLDER;
}
