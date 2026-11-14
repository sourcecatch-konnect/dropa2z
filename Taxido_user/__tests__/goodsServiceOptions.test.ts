import { getGoodsServiceOptions, matchesGoodsVehicle, goodsWeightLimit } from '../src/utils/goodsServiceOptions';
import {deliveryFormErrors} from '../src/utils/deliveryForm';

it('accepts each approved vehicle capacity and rejects weights beyond it',()=>{
 const form={receiverName:'Test recipient',phoneNumber:'9823971070',countryCode:'+91',parcelWeight:'20'};
 expect(deliveryFormErrors(form,goodsWeightLimit('bike')).parcelWeight).toBeUndefined();
 expect(deliveryFormErrors({...form,parcelWeight:'21'},goodsWeightLimit({slug:'bike'})).parcelWeight).toBeTruthy();
 expect(deliveryFormErrors({...form,parcelWeight:'90'},goodsWeightLimit('auto')).parcelWeight).toBeUndefined();
 expect(deliveryFormErrors({...form,parcelWeight:'91'},goodsWeightLimit({slug:'auto-rickshaw'})).parcelWeight).toBeTruthy();
});

const services = [
  { id: 7, type: 'parcel', status: 1, service_categories: [
    { id: 101, slug: 'ride-parcel-bike', status: 1 },
    { id: 102, slug: 'ride-parcel-auto', status: 1 },
    { id: 40, slug: 'test-parcel-bike', status: 1 },
  ] },
  { id: 8, type: 'freight', status: 1, service_categories: [
    { id: 103, slug: 'ride-freight-bike', status: 1 },
    { id: 104, slug: 'ride-freight-auto', status: 1 },
  ] },
];

it('routes each delivery choice to its own backend service and category', () => {
  expect(getGoodsServiceOptions(services).map(option =>
    [option.title, option.serviceId, option.categoryId, option.vehicleKind],
  )).toEqual([
    ['Bike Parcel', 7, 101, 'bike'],
    ['Auto Parcel', 7, 102, 'auto'],
  ]);
});

it('does not expose any Freight choice even if the backend still publishes those categories',()=>{
  expect(getGoodsServiceOptions([services[1]])).toEqual([]);
});

it('does not expose an unconfigured or disabled backend offering', () => {
  expect(getGoodsServiceOptions([{ id: 7, type: 'parcel', status: 1 }])).toEqual([]);
  expect(getGoodsServiceOptions([{ ...services[0], status: 0 }])).toEqual([]);
  expect(getGoodsServiceOptions([{ ...services[0], service_categories: [
    { id: 101, slug: 'ride-parcel-bike', status: 0 },
  ] }])).toEqual([]);
});

it('keeps the chosen vehicle kind and rejects an unrelated vehicle', () => {
  expect(matchesGoodsVehicle({ slug: 'auto-rickshaw' }, 'auto')).toBe(true);
  expect(matchesGoodsVehicle({ slug: 'bike' }, 'bike')).toBe(true);
  expect(matchesGoodsVehicle({ name: 'Motorcycle' }, 'bike')).toBe(true);
  expect(matchesGoodsVehicle({ slug: 'bike' }, 'auto')).toBe(false);
});
