import {moveDeliveryStop} from '../src/utils/deliveryStopOrder';
import {serviceLabel} from '../src/utils/serviceLabels';
const drops=[
  {address:'Market',place:{lat:21.01,lng:75.57}},
  {address:'Station',place:{lat:21.02,lng:75.58}},
  {address:'Godown',place:{lat:21.03,lng:75.59}},
];
it('moves an intermediate drop to the final destination with its coordinates',()=>{
  const reordered=moveDeliveryStop(drops,0,2);
  expect(reordered).toEqual([drops[1],drops[2],drops[0]]);
  expect(reordered[2].place).toEqual({lat:21.01,lng:75.57});
  expect(drops[0].address).toBe('Market');
});
it('moves the final destination ahead of an intermediate drop',()=>{
  expect(moveDeliveryStop(drops,2,0)).toEqual([drops[2],drops[0],drops[1]]);
});
it('ignores invalid drag indices rather than dropping a destination',()=>{
  expect(moveDeliveryStop(drops,-1,2)).toEqual(drops);
  expect(moveDeliveryStop(drops,0,9)).toEqual(drops);
});
it('changes the display name without rewriting parcel or technical slugs',()=>{
  expect(serviceLabel('Auto Freight')).toBe('Cargo Auto');
  expect(serviceLabel('Choose Auto Parcel or Auto Freight.')).toBe('Choose Auto Parcel or Cargo Auto.');
  expect(serviceLabel('Bike Parcel')).toBe('Bike Parcel');
});
