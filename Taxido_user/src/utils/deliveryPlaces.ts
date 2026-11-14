export type DeliveryPlace = {
  id?: string;
  shortAddress: string;
  detailAddress: string;
  fullAddress: string;
  lat?: number;
  lng?: number;
};

export const RECENT_DELIVERY_PLACES_KEY = 'recentDeliveryPlaces';

export function indianCoordinates(lat: unknown, lng: unknown) {
  if (lat == null || lng == null || String(lat).trim() === '' || String(lng).trim() === '') return null;
  const latitude = Number(lat), longitude = Number(lng);
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= 6 && latitude <= 38 && longitude >= 68 && longitude <= 98
    ? { lat: latitude, lng: longitude } : null;
}

export function normalizeDeliveryPlace(value: any): DeliveryPlace | null {
  const place = value?.destinationFullAddress ?? value;
  if (!place || typeof place !== 'object') return null;
  const address = place.fullAddress || place.location || [place.shortAddress, place.detailAddress].filter(Boolean).join(', ');
  if (typeof address !== 'string' || !address.trim()
    || /^(address not found|no address found|could not find address|failed to connect|configuration error)/i.test(address.trim())) return null;
  const coords = indianCoordinates(place.lat ?? place.location_coordinates?.lat, place.lng ?? place.location_coordinates?.lng);
  return {
    id: place.id,
    shortAddress: place.shortAddress || address.trim(),
    detailAddress: place.detailAddress || address.trim(),
    fullAddress: address.trim(),
    ...(coords || {}),
  };
}

// Supports both historic storage formats without overwriting other screens' data.
export function recentDeliveryPlaces(...sources: any[]): DeliveryPlace[] {
  const result: DeliveryPlace[] = [];
  const seen = new Set<string>();
  for (let source of sources) {
    if (typeof source === 'string') {
      try { source = JSON.parse(source); } catch { continue; }
    }
    for (const value of Array.isArray(source) ? source : [source]) {
      const place = normalizeDeliveryPlace(value);
      if (!place) continue;
      const key = place.id ? `id:${place.id}` : place.fullAddress.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(place);
      if (result.length === 5) return result;
    }
  }
  return result;
}
