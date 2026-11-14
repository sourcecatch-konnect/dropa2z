export function bookingSnapshot(value: any): any {
  let item = value;
  for (let i = 0; i < 4 && item && typeof item === 'object' && item.id == null; i++) {
    const next = item.ride ?? item.data;
    if (!next || next === item) break;
    item = next;
  }
  return item && typeof item === 'object' && !Array.isArray(item) ? item : null;
}

export function mergeBookingSnapshot(base: any, response: any) {
  const incoming = bookingSnapshot(response);
  if (!incoming?.id || String(incoming.id) !== String(base?.id)) return base || {};
  const oldTime = Date.parse(base?.updated_at || '');
  const newTime = Date.parse(incoming?.updated_at || '');
  if (Number.isFinite(oldTime) && Number.isFinite(newTime) && newTime < oldTime) return base;
  const merged = {...base, ...incoming};
  for (const key of ['driver', 'rider', 'vehicle_type']) {
    if (incoming[key] && typeof incoming[key] === 'object') {
      const changedPerson = key !== 'vehicle_type' && incoming[key].id != null && base?.[key]?.id != null
        && String(incoming[key].id) !== String(base[key].id);
      merged[key] = changedPerson ? incoming[key] : {...base?.[key], ...incoming[key]};
    }
  }
  return merged;
}

export function bookingStatus(ride: any) {
  return String(ride?.ride_status?.slug ?? ride?.ride_status?.name ?? ride?.ride_status ?? '').toLowerCase();
}

export function contactPhone(person: any) {
  const raw = String(person?.phone ?? person?.phone_number ?? '').trim();
  if (!raw || !/^\+?[\d\s()-]+$/.test(raw)) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) return '';
  if (raw.startsWith('+')) return '+' + digits;
  const code = String(person?.country_code ?? '91').replace(/\D/g, '') || '91';
  return digits.length === 10 ? '+' + code + digits : '+' + digits;
}

export function parcelReceiver(ride: any) {
  let value = ride?.parcel_receiver;
  if (typeof value === 'string') {try {value = JSON.parse(value);} catch {return null;}}
  return value && typeof value === 'object' ? value : null;
}


export function bookingPhoto(person:any):string|undefined {
  const value=person?.profile_image_url||person?.driver_profile_image_url||person?.rider_profile_image_url||person?.profile_image?.original_url||person?.profile_image?.url;
  return typeof value==='string'&&/^https?:\/\//i.test(value)?value:undefined;
}
