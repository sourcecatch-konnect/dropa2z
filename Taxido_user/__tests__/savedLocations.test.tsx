import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { SavedLocation } from '../src/screens/bottomTab/profileTab/savedLocation';
import reducer from '../src/api/store/reducers/saveLocationReducer';
import { addSaveLocation, updateSaveLocation, deleteSaveLocation } from '../src/api/store/actions/saveLocationAction';
jest.mock('immer', () => jest.requireActual('../node_modules/immer/dist/cjs/index.js'));
jest.mock('redux', () => jest.requireActual('../node_modules/redux/dist/cjs/redux.cjs'));
jest.mock('reselect', () => jest.requireActual('../node_modules/reselect/dist/cjs/index.js'));

const mockNavigate = jest.fn();
const mockDispatch = jest.fn(() => Promise.resolve());
let mockParams: any;
const mockPlace = { id: 11, title: 'Home', type: 'home', location: '52 Ayodhya Nagar, Jalgaon', location_coordinates: { lat: 21.01, lng: 75.56 } };
const mockState = { setting: { translateData: {} }, saveLocation: { loading: false, saveLocationDataGet: { data: [mockPlace] } } };
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
  useRoute: () => ({ params: mockParams }),
  useFocusEffect: (callback: any) => require('react').useEffect(callback, [callback]),
}));
jest.mock('react-redux', () => ({ useDispatch: () => mockDispatch, useSelector: (selector: any) => selector(mockState) }));
jest.mock('../src/utils/context', () => ({ useValues: () => ({ isDark: false, viewRTLStyle: 'row', Google_Map_Key: 'key' }) }));
jest.mock('../src/utils/localstorage', () => ({ deleteValue: jest.fn() }));
jest.mock('../src/utils/icons', () => new Proxy({}, { get: () => () => null }));
jest.mock('../src/commonComponent', () => ({ Button: () => null, notificationHelper: jest.fn(), VerticalLine: () => null }));
jest.mock('../src/components', () => ({ NoInternet: () => null }));
jest.mock('../src/api/services', () => ({ saveLocationService: {} }));
jest.mock('../src/screens/bottomTab/profileTab/savedLocation/locationLoader', () => ({ LocationLoader: () => null }));
jest.mock('lottie-react-native', () => 'LottieView');
jest.mock('@react-native-clipboard/clipboard', () => ({ setString: jest.fn() }));
jest.mock('@gorhom/bottom-sheet', () => ({ __esModule: true, default: () => null, BottomSheetBackdrop: () => null, BottomSheetView: () => null }));

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { selectedLocation: 'homeScreen', savefield: 'destination', service_ID: 7, preferredVehicleKind: 'auto' };
  global.fetch = jest.fn();
});

it.each(['destination', 'pickupLocation', 'stop-1'])('uses the exact saved pin for %s without another geocoding request', async field => {
  mockParams.savefield = field;
  let tree: renderer.ReactTestRenderer;
  await act(async () => { tree = renderer.create(<SavedLocation />); });
  const card = tree!.root.find(node => node.props.accessibilityLabel === `Select Home, ${mockPlace.location}`);
  await act(async () => { await card.props.onPress(); });
  expect(fetch).not.toHaveBeenCalled();
  expect(mockNavigate).toHaveBeenCalledWith('MyTabs', expect.objectContaining({ params: expect.objectContaining({
    fieldValue: field, selectedAddress: mockPlace.location, pinLatitude: 21.01, pinLongitude: 75.56, preferredVehicleKind: 'auto',
  }) }));
  act(() => tree!.unmount());
});

it('opens editing when a favourite is tapped from Settings', async () => {
  mockParams = {};
  let tree: renderer.ReactTestRenderer;
  await act(async () => { tree = renderer.create(<SavedLocation />); });
  const card = tree!.root.find(node => node.props.accessibilityLabel === `Edit Home, ${mockPlace.location}`);
  act(() => card.props.onPress());
  expect(mockNavigate).toHaveBeenCalledWith('LocationSave', { mode: 'edit', locationID: 11, locationDetails: mockPlace });
  act(() => tree!.unmount());
});

it('updates the saved list after successful add, edit and delete without requiring a reload', () => {
  let state: any = reducer(undefined, { type: 'init' });
  state = reducer(state, addSaveLocation.fulfilled({ id: 11 }, 'add', mockPlace));
  expect(state.saveLocationDataGet.data[0]).toMatchObject(mockPlace);
  state = reducer(state, updateSaveLocation.pending('edit', { locationID: 11, data: { title: 'New Home' } }));
  state = reducer(state, updateSaveLocation.fulfilled({ id: 11 }, 'edit', { locationID: 11, data: { title: 'New Home' } }));
  expect(state.loading).toBe(false);
  expect(state.saveLocationDataGet.data[0].title).toBe('New Home');
  state = reducer(state, deleteSaveLocation.pending('delete', 11));
  state = reducer(state, deleteSaveLocation.fulfilled({ status: 200, data: 1 }, 'delete', 11));
  expect(state.loading).toBe(false);
  expect(state.saveLocationDataGet.data).toEqual([]);
});
