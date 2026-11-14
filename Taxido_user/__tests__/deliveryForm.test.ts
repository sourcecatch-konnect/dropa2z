import {deliveryFormErrors} from '../src/utils/deliveryForm';
const valid={receiverName:'Test contact',phoneNumber:'9876543210',countryCode:'+91',parcelWeight:'20'};
it('requires contact details and positive numeric weight before booking',()=>{
 expect(deliveryFormErrors({...valid,receiverName:' ',phoneNumber:'123',parcelWeight:'0'})).toEqual(expect.objectContaining({receiverName:expect.any(String),phoneNumber:expect.any(String),parcelWeight:expect.any(String)}));
 for(const parcelWeight of ['NaN','-2','Infinity'])expect(deliveryFormErrors({...valid,parcelWeight}).parcelWeight).toBeTruthy();
});
it('accepts maximum weight and rejects excess',()=>{
 expect(deliveryFormErrors(valid,20)).toEqual({});
 expect(deliveryFormErrors({...valid,parcelWeight:'20.01'},20).parcelWeight).toBeTruthy();
 expect(deliveryFormErrors({...valid,phoneNumber:'98765 43210'},20)).toEqual({});
});
