import {bookingResumeState,resumeBooking} from '../src/utils/bookingNavigation';
import {resolveAcceptedBooking} from '../src/utils/acceptedBooking';

it('resumes Home -> search -> pickup as Home -> one current delivery',()=>{
  const home={key:'home',name:'MyTabs',state:{index:0,routes:[{name:'HomeScreen'}]}};
  const state={index:3,routes:[home,{name:'BookRide',params:{countinueRideId:30}},
    {key:'old-pickup',name:'RideActive',params:{activeRideOTP:{id:12}}},{name:'MyTabs'}]};
  const next=bookingResumeState(state,'RideActive',{activeRideOTP:{id:44}});
  expect(next.index).toBe(1);expect(next.routes).toHaveLength(2);
  expect(next.routes[0]).toBe(home);expect(next.routes[1]).not.toHaveProperty('key');
  expect(next.routes[1].params.activeRideOTP.id).toBe(44);
});
it('reuses the same booking screen key and clears intervening screens on repeated opening',()=>{
  const state={routes:[{name:'MyTabs'},{key:'pickup',name:'RideActive',params:{activeRideOTP:{id:44,otp:1111}}},{name:'DriverInfos'}]};
  const nav={getRootState:()=>state,resetRoot:jest.fn()};
  resumeBooking(nav,'RideActive',{activeRideOTP:{id:44,otp:2222}});
  expect(nav.resetRoot).toHaveBeenCalledWith({index:1,routes:[{name:'MyTabs'},{key:'pickup',name:'RideActive',params:{activeRideOTP:{id:44,otp:2222}}}]});
});
it('reads the actual ride linked to the selected request instead of using a request/bid ID',async()=>{
  const readRequests=jest.fn().mockResolvedValue({data:[{id:40,ride_id:600},{id:41,ride_id:700}]});
  const ride={id:700,otp:9876,ride_status:{slug:'arrived'}};
  const readRide=jest.fn().mockResolvedValue({status:200,data:{data:ride}});
  expect(await resolveAcceptedBooking(41,readRequests,readRide)).toBe(ride);
  expect(readRide).toHaveBeenCalledTimes(1);expect(readRide).toHaveBeenCalledWith(700);
});
it('does not open another delivery, a failed response, or a closed delivery',async()=>{
  const requests=async()=>({data:[{id:41,ride_id:700}]});
  for(const response of [
    {status:200,data:{id:701,otp:1111,ride_status:{slug:'arrived'}}},
    {status:403,data:{message:'Not authorized'}},
    {status:200,data:{id:700,ride_status:{slug:'cancelled'}}},
  ])expect(await resolveAcceptedBooking(41,requests,async()=>response)).toBeNull();
  const readRide=jest.fn();
  expect(await resolveAcceptedBooking(41,async()=>({data:[{id:41}]}),readRide)).toBeNull();
  expect(readRide).not.toHaveBeenCalled();
});
