import { indianCoordinates, recentDeliveryPlaces } from '../src/utils/deliveryPlaces';

const place = (name: string, lat = 21.0077, lng = 75.5626) => ({
  shortAddress: name, fullAddress: `${name}, Jalgaon`, lat, lng,
});

it('retains exact saved coordinates, including numeric strings', () => {
  expect(indianCoordinates('21.0077', '75.5626')).toEqual({ lat: 21.0077, lng: 75.5626 });
});

it.each([[null, 75], ['', 75], [21, undefined], [37.78825, -122.4324], ['wrong', 75]])(
  'does not turn missing or foreign coordinates into a valid selection (%s, %s)', (lat, lng) => {
    expect(indianCoordinates(lat, lng)).toBeNull();
  },
);

it('migrates both old history formats and ignores corrupt storage', () => {
  expect(recentDeliveryPlaces('not json', JSON.stringify({ destinationFullAddress: place('Station') }),
    JSON.stringify([{ shortAddress: 'Market', detailAddress: 'Jalgaon' }])).map(p => p.shortAddress))
    .toEqual(['Station', 'Market']);
});

it('moves a selected place to the top, removes duplicates and limits history', () => {
  const previous = ['A', 'B', 'C', 'D', 'E', 'F'].map(name => place(name));
  const result = recentDeliveryPlaces(place('C'), previous);
  expect(result.map(p => p.shortAddress)).toEqual(['C', 'A', 'B', 'D', 'E']);
  expect(result[0]).toMatchObject({ lat: 21.0077, lng: 75.5626 });
});

it('does not display old address errors as recent searches', () => {
  expect(recentDeliveryPlaces([{ shortAddress: 'Address not found' }, {}, null, place('Station')]))
    .toHaveLength(1);
});

it('uses the stored saved-location point without geocoding its label again', () => {
  expect(recentDeliveryPlaces({ location: 'Market, Jalgaon', location_coordinates: { lat: '21.01', lng: '75.56' } })[0])
    .toMatchObject({ lat: 21.01, lng: 75.56 });
});
