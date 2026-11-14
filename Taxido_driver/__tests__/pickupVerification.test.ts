import {pickupRoute,startedPickup} from '../src/utils/pickupVerification';
import {userstartRide} from '../src/api/services/rideService';
import {POST_API} from '../src/api/methods';
jest.mock('../src/api/methods',()=>({POST_API:jest.fn(),GET_API:jest.fn(),PUT_API:jest.fn()}));
it('normalizes both notification and screen pickup links without mixing delivery snapshots',()=>{
  expect(pickupRoute({ride:{id:72}})).toMatchObject({id:72,ride:{id:72}});
  expect(pickupRoute({ride_Id:72,rideData:{data:{id:72}}})).toMatchObject({id:72,ride:{id:72}});
  expect(pickupRoute({ride_Id:72,rideData:{id:73}})).toEqual({id:72,ride:null});
  expect(pickupRoute({bid_id:9})).toMatchObject({id:undefined});
});
it('only treats a confirmed start of this delivery as a successful PIN verification',()=>{
  expect(startedPickup({id:72,data:{id:72},ride_status:{slug:'started'}},72)).toBe(true);
  expect(startedPickup({data:{id:72,ride_status:{slug:'started'}}},72)).toBe(true);
  expect(startedPickup({id:73,ride_status:{slug:'started'}},72)).toBe(false);
  expect(startedPickup({id:72,ride_status:{slug:'arrived'}},72)).toBe(false);
});
it.each([
  [409,{message:'Mark arrival at pickup before verifying the pickup OTP.'},'Mark arrival at pickup before verifying the pickup OTP.'],
  [422,{errors:{ride_id:['The selected delivery is invalid.']}},'The selected delivery is invalid.'],
  [400,{message:'Invalid OTP'},'Invalid OTP'],
  [500,{message:'Server unavailable'},'Server unavailable'],
])('preserves the real HTTP %i error instead of reporting every failure as incorrect OTP',async(status,data,message)=>{
  (POST_API as jest.Mock).mockResolvedValue({status,data});
  await expect(userstartRide({ride_id:72,otp:'9876'} as any)).rejects.toThrow(message);
});
it('returns the server confirmation without changing or generating a PIN',async()=>{
  const payload={ride_id:72,otp:'9876'};
  const response={status:200,data:{id:72,ride_status:{slug:'started'}}};
  (POST_API as jest.Mock).mockResolvedValue(response);
  expect(await userstartRide(payload as any)).toBe(response);
  expect(POST_API).toHaveBeenLastCalledWith(payload,expect.stringContaining('start'));
});
