import { indianCoordinates } from './deliveryPlaces';

export type SavedPlacePrediction = { id: string; label: string };

export function matchingSavedPlaces(query: string, items: any[]) {
  const search = query.trim().toLowerCase();
  if (search.length < 2 || !Array.isArray(items)) return [];
  return items.flatMap(item => {
    if (!`${item.title || ''} ${item.type || ''} ${item.location || ''}`.toLowerCase().includes(search)) return [];
    const coordinates = indianCoordinates(item.location_coordinates?.lat, item.location_coordinates?.lng);
    if (!coordinates || !item.location) return [];
    return [{ id: `saved:${item.id}`, shortAddress: item.location, detailAddress: item.title,
      fullAddress: item.location, ...coordinates }];
  });
}

export async function searchSavedPlaceAddresses(query: string, apiKey: string): Promise<SavedPlacePrediction[]> {
  if (query.trim().length < 3) return [];
  if (!apiKey) throw new Error('Address search is unavailable. Please contact support.');
  const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text.text' },
    body: JSON.stringify({ input: query.trim(), regionCode: 'IN', includedRegionCodes: ['in'] }),
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error('Could not search addresses. Please try again or choose on the map.');
  return (data.suggestions || []).flatMap((item: any) => {
    const prediction = item.placePrediction;
    return prediction?.placeId && prediction?.text?.text ? [{ id: prediction.placeId, label: prediction.text.text }] : [];
  });
}

export async function resolveSavedPlaceAddress(id: string, apiKey: string) {
  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`, {
    headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'location,formattedAddress,addressComponents' },
  });
  const data = await response.json();
  const coordinates = indianCoordinates(data.location?.latitude, data.location?.longitude);
  const inIndia = data.addressComponents?.some((component: any) =>
    component.types?.includes('country') && component.shortText === 'IN');
  if (!response.ok || !coordinates || !inIndia || !data.formattedAddress) {
    throw new Error('Choose a verified address in India.');
  }
  return { ...coordinates, fullAddress: data.formattedAddress as string };
}
