import {confirmPickupVehicle} from '../src/api/services/allRideService';
import {POST_API} from '../src/api/methods';

jest.mock('../src/api/methods',()=>({GET_API:jest.fn(),PUT_API:jest.fn(),POST_API:jest.fn()}));
const post=POST_API as jest.Mock;
beforeEach(()=>jest.resetAllMocks());

it('requires a persisted confirmation instead of treating any HTTP 200 as success',async()=>{
  post.mockResolvedValue({status:200,data:{id:42}});
  await expect(confirmPickupVehicle(42)).rejects.toThrow('not confirmed');
});

it('uses the booking-specific server route and returns its confirmed snapshot',async()=>{
  const ride={id:42,parcel_delivery_progress:{pickup_vehicle_confirmed_at:'2026-11-06T10:00:00Z'}};
  post.mockResolvedValue({status:200,data:ride});
  await expect(confirmPickupVehicle(42)).resolves.toEqual(ride);
  expect(post).toHaveBeenCalledWith({},'ride/42/confirm-pickup-vehicle');
});

it('keeps a server authorization or state rejection visible',async()=>{
  post.mockResolvedValue({status:403,data:{message:'Only the booking customer can confirm.'}});
  await expect(confirmPickupVehicle(42)).rejects.toThrow('Only the booking customer');
});
