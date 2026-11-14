import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {DriverInfo} from '../src/screens/bottomTab/category/driverDetails/components/driverInfo';

let mockParams: any;
jest.mock('@react-navigation/native', () => ({useRoute: () => ({params: mockParams})}));
jest.mock('../src/utils/context/index', () => ({useValues: () => ({textRTLStyle: 'left', viewRTLStyle: 'row', textColorStyle: '#17191C', linearColorStyle: '#FFF', bgContainer: '#FFF'})}));
jest.mock('../src/utils/icons', () => ({Car: () => null}));
jest.mock('../src/utils/images', () => ({__esModule: true, default: {profileUser: 1, alto: 2}}));

it.each([undefined, {}, {driverInfo: {id: 195, name: 'Driver', vehicle_info: null}}])('renders safely when route or nested vehicle data is absent: %p', params => {
  mockParams = params;
  let tree: renderer.ReactTestRenderer;
  act(() => {tree = renderer.create(<DriverInfo />);});
  expect(JSON.stringify(tree!.toJSON())).toContain('Vehicle details unavailable');
  act(() => tree!.unmount());
});

it('shows the vehicle snapshot from the booking when the driver profile has no vehicle_info', () => {
  mockParams = {driverInfo: {name: 'Driver', vehicle_info: null}, rideInfo: {vehicle_model: 'Auto', plate_number: 'MH19AB1234'}};
  let tree: renderer.ReactTestRenderer;
  act(() => {tree = renderer.create(<DriverInfo />);});
  const content = JSON.stringify(tree!.toJSON());
  expect(content).toContain('Auto');
  expect(content).toContain('MH19AB1234');
  act(() => tree!.unmount());
});
