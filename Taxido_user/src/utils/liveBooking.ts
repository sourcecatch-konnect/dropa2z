export type LiveBooking = {
  key: string; kind: 'request' | 'ride'; id: number; requestId?: number;
  status: string; deadline?: number; raw: any;
};
export const terminalBookingStatuses = new Set(['completed','cancelled','canceled','expired','rejected','no_driver_found']);
export function bookingStatus(item: any): string {
  return String(item?.ride_status?.slug ?? item?.ride_status?.name ?? item?.ride_status ?? item?.status ?? '').toLowerCase().replace(/ /g,'_');
}
export function bookingDeadline(item: any, minutes: number): number | undefined {
  const explicit = Date.parse(item?.find_driver_expires_at ?? item?.search_expires_at ?? '');
  if (Number.isFinite(explicit)) return explicit;
  const created = Date.parse(item?.created_at ?? '');
  return Number.isFinite(created) && Number.isFinite(minutes) && minutes > 0 ? created + minutes * 60000 : undefined;
}
export function bookingItems(payload: any): any[] | null {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return null; // A failed response must never be treated as an empty active list.
}
export function activeBookings(requests: any[], rides: any[], minutes: number): LiveBooking[] {
  const linked = new Map(requests.filter(r=>r.ride_id).map(r=>[String(r.ride_id),Number(r.id)]));
  const result: LiveBooking[] = [];
  for (const raw of requests) {
    if (!raw?.id || raw.ride_id || !['requested','pending','searching'].includes(bookingStatus(raw))) continue;
    if (raw?.service_category?.service_category_type === 'schedule') continue;
    result.push({key:`request:${raw.id}`,kind:'request',id:Number(raw.id),requestId:Number(raw.id),status:'searching',deadline:bookingDeadline(raw,minutes),raw});
  }
  for (const raw of rides) {
    const status=bookingStatus(raw);
    if (!raw?.id || !['accepted','arrived','started','pending','in_progress','on_going'].includes(status)) continue;
    const requestId=Number(raw.ride_request_id)||linked.get(String(raw.id));
    result.push({key:requestId?`request:${requestId}`:`ride:${raw.id}`,kind:'ride',id:Number(raw.id),requestId,status,raw});
  }
  return result.sort((a,b)=>Date.parse(b.raw.created_at||'')-Date.parse(a.raw.created_at||''));
}
export function bookingCopy(booking: LiveBooking) {
  const name=booking.raw?.driver?.name;
  const titles:Record<string,string>={searching:'Finding your delivery partner',accepted:'Delivery partner assigned',arrived:'Your delivery partner has arrived',started:'Your parcel is on the way',in_progress:'Your parcel is on the way',on_going:'Your parcel is on the way',completed:'Delivery completed',cancelled:'Booking cancelled',canceled:'Booking cancelled',expired:'No delivery partner found',no_driver_found:'No delivery partner found',rejected:'Booking declined'};
  return {title:titles[booking.status]||'Delivery in progress',body:booking.status==='searching'?'We’re looking for a nearby partner. Tap to view your booking.':name?`${name} · Tap to view delivery details.`:'Tap to view delivery details.'};
}
export function bookingClock(deadline: number | undefined, now=Date.now()): string {
  if (!deadline) return 'Searching nearby';
  const seconds=Math.max(0,Math.ceil((deadline-now)/1000));
  return seconds===0?'Checking availability…':`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} remaining`;
}
export function recentSearchesToShow<T>(items:T[],expanded:boolean):T[] { return expanded?items:items.slice(0,2); }
