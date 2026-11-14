import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { TouchableOpacity } from 'react-native';
import { LocationSelect } from '../src/screens/locationSelect';
import { setValue } from '../src/utils/localstorage';

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
let mockParams: any;
let mockGps: any;
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, replace: mockReplace, goBack: jest.fn() }),
  useRoute: () => ({ params: mockParams }),
}));
jest.mock('react-redux', () => ({ useSelector: () => ({ translateData: {}, taxidoSettingData: {} }) }));
jest.mock('../src/utils/context', () => ({ useValues: () => ({ isDark: false, viewRTLStyle: 'row', Google_Map_Key: 'test-key' }) }));
jest.mock('../src/components/helper/locationHelper', () => ({ __esModule: true, default: () => mockGps }));
jest.mock('../src/utils/localstorage', () => ({ setValue: jest.fn() }));
jest.mock('../src/utils/icons', () => ({ Back: () => null, AddressMarker: () => null }));
jest.mock('../src/utils/images', () => ({ __esModule: true, default: { pin: 1 } }));
jest.mock('../src/screens/locationSelect/styles', () => ({ __esModule: true, default: {} }));
jest.mock('react-native-webview', () => ({ WebView: 'WebView' }));

let tree: renderer.ReactTestRenderer;
const result = (address: string) => ({ status: 'OK', results: [{ formatted_address: address,
  address_components: [{ types: ['country'], short_name: 'IN' }] }] });
const confirm = () => tree.root.findAllByType(TouchableOpacity).find(node => node.props.disabled !== undefined)!;
const move = (lat: number, lng: number) => tree.root.findByType('WebView' as any).props.onMessage({
  nativeEvent: { data: JSON.stringify({ type: 'mapMove', payload: { lat, lng } }) },
});
async function tick() {
  await act(async () => { jest.advanceTimersByTime(801); });
}
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockParams = { screenValue: 'HomeScreen', field: 'destination', service_ID: 7 };
  mockGps = { currentLatitude: 21.0077, currentLongitude: 75.5626 };
  global.fetch = jest.fn().mockResolvedValue({ json: async () => result('Station, Jalgaon') });
});
afterEach(() => {
  if (tree) act(() => tree.unmount());
  jest.useRealTimers();
});

it('returns the selected destination to the existing homepage without replacing it or changing stored pickup', async () => {
  await act(async () => { tree = renderer.create(<LocationSelect />); });
  await tick();
  expect(confirm().props.disabled).toBe(false);
  await act(async () => { await confirm().props.onPress(); });
  expect(mockNavigate).toHaveBeenCalledWith('MyTabs', expect.objectContaining({ params: expect.objectContaining({
    fieldValue: 'destination', selectedAddress: 'Station, Jalgaon', service_ID: 7,
  }) }));
  expect(mockReplace).not.toHaveBeenCalled();
  expect(setValue).not.toHaveBeenCalled();
});

it('does not allow an address-service error to become a confirmed address', async () => {
  (fetch as jest.Mock).mockResolvedValue({ json: async () => ({ status: 'REQUEST_DENIED' }) });
  await act(async () => { tree = renderer.create(<LocationSelect />); });
  await tick();
  expect(confirm().props.disabled).toBe(true);
});

it('ignores an old geocode response after the map moves, including during debounce', async () => {
  let resolveOld: any;
  (fetch as jest.Mock).mockReturnValueOnce(new Promise(resolve => { resolveOld = resolve; }))
    .mockResolvedValue({ json: async () => result('Market, Jalgaon') });
  await act(async () => { tree = renderer.create(<LocationSelect />); });
  await tick();
  act(() => move(21.02, 75.58));
  await act(async () => { resolveOld({ json: async () => result('Old address') }); });
  expect(confirm().props.disabled).toBe(true);
  await tick();
  await act(async () => { await confirm().props.onPress(); });
  expect(mockNavigate.mock.calls[0][1].params).toMatchObject({ selectedAddress: 'Market, Jalgaon', pinLatitude: 21.02 });
});

it('keeps map initialization stable when GPS changes', async () => {
  await act(async () => { tree = renderer.create(<LocationSelect />); });
  const original = tree.root.findByType('WebView' as any).props.source;
  mockGps = { currentLatitude: 21.1, currentLongitude: 75.7 };
  act(() => tree.update(<LocationSelect />));
  expect(tree.root.findByType('WebView' as any).props.source).toBe(original);
});

it('stores the chosen pickup only when selecting pickup, preserving service parameters', async () => {
  mockParams = { ...mockParams, field: 'pickupLocation', preferredVehicleKind: 'auto', service_category_ID: 102 };
  await act(async () => { tree = renderer.create(<LocationSelect />); });
  await tick();
  await act(async () => { await confirm().props.onPress(); });
  expect(setValue).toHaveBeenCalledWith('user_latitude_Selected', '21.0077');
  expect(mockNavigate.mock.calls[0][1].params).toMatchObject({ preferredVehicleKind: 'auto', service_category_ID: 102 });
});

it('initializes the map at the selected endpoint instead of always using GPS', async () => {
  mockParams = { ...mockParams, initialLatitude: 21.02, initialLongitude: 75.58 };
  await act(async () => { tree = renderer.create(<LocationSelect />); });
  await tick();
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining('latlng=21.02,75.58'));
});
