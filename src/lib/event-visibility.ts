export function eventIsActive(
  event: { starts_at: string; ends_at?: string | null },
  now = new Date(),
): boolean {
  const nowMs = now.getTime();
  if (event.ends_at) {
    return new Date(event.ends_at).getTime() >= nowMs;
  }
  return new Date(event.starts_at).getTime() >= nowMs;
}

export function activeEventsOrFilter(now = new Date().toISOString()) {
  return `ends_at.gte.${now},and(ends_at.is.null,starts_at.gte.${now})`;
}

export function pastEventsOrFilter(now = new Date().toISOString()) {
  return `ends_at.lt.${now},and(ends_at.is.null,starts_at.lt.${now})`;
}
