/** Presentation only: booking status and timestamps always come from confirmed data. */
export type JourneyPhase = 'search' | 'pickup' | 'arrived' | 'trip' | 'inactive';
export function journeyPhase(status: string): JourneyPhase {
  if (['searching','requested','pending'].includes(status)) return 'search';
  if (status === 'accepted') return 'pickup';
  if (status === 'arrived') return 'arrived';
  if (['started','in_progress','on_going','ongoing'].includes(status)) return 'trip';
  return 'inactive';
}
export function pickupStartedAt(ride: any): number | undefined {
  const activities = ride?.ride_status_activities || ride?.status_activities;
  const activity = Array.isArray(activities) ? activities.find((a: any) => String(a.status?.slug ?? a.status ?? a.ride_status?.slug).toLowerCase() === 'arrived') : null;
  const explicit = Date.parse(ride?.arrived_at || ride?.driver_arrived_at || activity?.created_at || '');
  if (Number.isFinite(explicit)) return explicit;
  const status = String(ride?.ride_status?.slug ?? ride?.ride_status ?? '').toLowerCase();
  const updated = Date.parse(ride?.updated_at || '');
  return status === 'arrived' && Number.isFinite(updated) ? updated : undefined;
}
export function waitClock(since: number | undefined, now = Date.now()): string {
  if (!since || !Number.isFinite(since)) return '—';
  const seconds = Math.max(0, Math.floor((now-since)/1000));
  return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
}
export function nextDeliveryAddress(ride: any): string {
  const locations = Array.isArray(ride?.locations) ? ride.locations : [];
  const stops = ride?.parcel_delivery_progress?.stops || [];
  const next = locations.slice(1).find((_: any, index: number) => !stops[index]?.delivered_at);
  return typeof next === 'string' ? next : typeof locations[locations.length-1] === 'string' ? locations[locations.length-1] : '';
}
export function routeEtaLabel(raw: any, phase: JourneyPhase, now = Date.now()): string | undefined {
  const eta = raw?._routeEta;
  if (!eta || eta.phase !== phase || now-eta.measuredAt > 120000 || now < eta.measuredAt || !Number.isFinite(eta.arrivalAt)) return undefined;
  return `${Math.max(1,Math.ceil((eta.arrivalAt-now)/60000))} min`;
}
