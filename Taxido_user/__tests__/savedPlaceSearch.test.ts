import { searchSavedPlaceAddresses, resolveSavedPlaceAddress, matchingSavedPlaces } from '../src/utils/savedPlaceSearch';

beforeEach(() => { global.fetch = jest.fn(); });

it('restricts search to India and never treats a prediction label as a selected coordinate', async () => {
  (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ suggestions: [
    { placePrediction: { placeId: 'station', text: { text: 'Station, Jalgaon' } } },
  ] }) });
  expect(await searchSavedPlaceAddresses(' Station ', 'key')).toEqual([{ id: 'station', label: 'Station, Jalgaon' }]);
  expect(JSON.parse((fetch as jest.Mock).mock.calls[0][1].body)).toMatchObject({ input: 'Station', includedRegionCodes: ['in'] });
});

it('resolves the exact selected Place ID to its address and coordinates', async () => {
  (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ formattedAddress: 'Station, Jalgaon',
    location: { latitude: 21.01, longitude: 75.56 }, addressComponents: [{ types: ['country'], shortText: 'IN' }] }) });
  expect(await resolveSavedPlaceAddress('station', 'key')).toEqual({ lat: 21.01, lng: 75.56, fullAddress: 'Station, Jalgaon' });
});

it.each([
  { ok: false, data: { error: { status: 'REQUEST_DENIED' } } },
  { ok: true, data: { formattedAddress: 'Unknown', location: { latitude: 21, longitude: 75 } } },
  { ok: true, data: { formattedAddress: 'SF', location: { latitude: 37.7, longitude: -122 }, addressComponents: [{ types: ['country'], shortText: 'US' }] } },
])('rejects unavailable or unverified selections %#', async ({ ok, data }) => {
  (fetch as jest.Mock).mockResolvedValue({ ok, json: async () => data });
  await expect(resolveSavedPlaceAddress('id', 'key')).rejects.toThrow();
});

it('avoids API requests for short search text', async () => {
  expect(await searchSavedPlaceAddresses('a', 'key')).toEqual([]);
  expect(fetch).not.toHaveBeenCalled();
});

it('matches Home, Work and custom titles locally with the saved coordinates', () => {
  const items = [
    { id: 1, title: 'Home', type: 'home', location: '52 Ayodhya Nagar, Jalgaon', location_coordinates: { lat: 21.01, lng: 75.56 } },
    { id: 2, title: 'Warehouse', type: 'other', location: 'MIDC, Jalgaon', location_coordinates: { lat: 21.02, lng: 75.57 } },
  ];
  expect(matchingSavedPlaces('home', items)[0]).toMatchObject({ id: 'saved:1', fullAddress: '52 Ayodhya Nagar, Jalgaon', lat: 21.01 });
  expect(matchingSavedPlaces('warehouse', items)[0]).toMatchObject({ id: 'saved:2' });
  expect(fetch).not.toHaveBeenCalled();
});
