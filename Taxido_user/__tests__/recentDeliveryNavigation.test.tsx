import React from 'react';
import renderer,{act} from 'react-test-renderer';
import {Recentbooking} from '../src/screens/recentBooking';
import {GET_API} from '../src/api/methods';
import {notificationHelper} from '../src/commonComponent';
const mockNavigate=jest.fn(),mockDispatch=jest.fn();
jest.mock('../src/utils/navigation',()=>({useAppNavigation:()=>({navigate:mockNavigate})}));
jest.mock('react-redux',()=>({useDispatch:()=>mockDispatch,useSelector:(select:any)=>select({zone:{zoneValue:{currency_symbol:'₹'}},setting:{translateData:{BookAgainTextttt:'Book Again'}}})}));
jest.mock('../src/utils/context',()=>({useValues:()=>({isDark:false,textColorStyle:'#111111',bgFullStyle:'#FFFFFF',viewRTLStyle:'row'})}));
jest.mock('../src/api/methods',()=>({GET_API:jest.fn()}));
jest.mock('../src/api/store/actions',()=>({userRideLocation:jest.fn(),vehicleTypeDataGet:jest.fn()}));
jest.mock('../src/commonComponent',()=>({Button:(props:any)=>require('react').createElement('BookingButton',props),formatDateTime:()=>({date:'Nov 3',time:'6:15 PM'}),notificationHelper:jest.fn()}));
jest.mock('../src/design/ReferenceChrome',()=>({ReferenceIcon:()=>null,referenceSurfaces:{card:{}}}));
jest.mock('../src/design/VehicleGraphic',()=>({VehicleGraphic:()=>null}));
jest.mock('../src/utils/icons',()=>new Proxy({},{get:()=>()=>null}));
const item={id:77,ride_number:100251,total:77.38,service:{service_type:'parcel'},vehicle_type:{id:9}};
let tree:renderer.ReactTestRenderer;
beforeEach(()=>jest.clearAllMocks());
afterEach(()=>{if(tree)act(()=>tree.unmount());});
const card=()=>tree.root.findAll(n=>n.props.accessibilityLabel==='View delivery 100251')[0];
it.each([['completed','Completed'],['cancelled','Cancelled']])('opens the existing %s delivery without entering the parcel booking flow',async(status,label)=>{
  const ride={...item,ride_status:{slug:status}};
  (GET_API as jest.Mock).mockResolvedValue({status:200,data:{data:ride}});
  act(()=>{tree=renderer.create(<Recentbooking compact recentRideData={[item]}/>);});
  await act(async()=>{await card().props.onPress();});
  expect(GET_API).toHaveBeenCalledWith('ride/77',{timeout:12000});
  expect(mockNavigate).toHaveBeenCalledWith('PendingRideScreen',{item:ride,vehicleDetail:ride.vehicle_type,rideStatus:label});
  expect(mockDispatch).not.toHaveBeenCalled();
  expect(mockNavigate.mock.calls.some(call=>call[0]==='Outstation')).toBe(false);
});
it('uses fresh acceptance status rather than rebooking an old Home snapshot',async()=>{
  const ride={...item,ride_status:{slug:'accepted'}};
  (GET_API as jest.Mock).mockResolvedValue({status:200,data:ride});
  act(()=>{tree=renderer.create(<Recentbooking compact recentRideData={[item]}/>);});
  await act(async()=>{await card().props.onPress();});
  expect(mockNavigate).toHaveBeenCalledWith('RideActive',{activeRideOTP:ride});
});
it('shows a retryable error and does not start a booking when loading the record fails',async()=>{
  (GET_API as jest.Mock).mockResolvedValue({status:500,data:{message:'Please try again.'}});
  act(()=>{tree=renderer.create(<Recentbooking compact recentRideData={[item]}/>);});
  await act(async()=>{await card().props.onPress();});
  expect(mockNavigate).not.toHaveBeenCalled();expect(notificationHelper).toHaveBeenCalledWith('','Please try again.','error');
  expect(card().props.disabled).toBe(false);
});
it.each(['completed','cancelled'])('keeps a loaded %s delivery viewable when the connection drops',async status=>{
  const cached={...item,ride_status:{slug:status},locations:['Pickup','Drop'],driver:{id:3},rider:{id:4}};
  (GET_API as jest.Mock).mockResolvedValue(Object.assign(new Error('Network Error'),{code:'ERR_NETWORK'}));
  act(()=>{tree=renderer.create(<Recentbooking compact recentRideData={[cached]}/>);});
  await act(async()=>{await card().props.onPress();});
  expect(mockNavigate).toHaveBeenCalledWith('PendingRideScreen',expect.objectContaining({item:cached}));
  expect(notificationHelper).not.toHaveBeenCalled();expect(mockDispatch).not.toHaveBeenCalled();
});
it.each(['accepted','started','pending'])('does not use cached %s status after a network failure',async status=>{
  (GET_API as jest.Mock).mockRejectedValue(Object.assign(new Error('Network Error'),{code:'ERR_NETWORK'}));
  act(()=>{tree=renderer.create(<Recentbooking compact recentRideData={[{...item,ride_status:{slug:status}}]}/>);});
  await act(async()=>{await card().props.onPress();});
  expect(mockNavigate).not.toHaveBeenCalled();
  expect(notificationHelper).toHaveBeenCalledWith('',expect.stringContaining('Check your internet connection'),'error');
  expect(card().props.disabled).toBe(false);
});
it('does not bypass authorization failures with a cached delivery',async()=>{
  const cached={...item,ride_status:{slug:'completed'},locations:['Pickup','Drop'],driver:{id:3},rider:{id:4}};
  (GET_API as jest.Mock).mockResolvedValue({status:403,data:{message:'Access denied'}});
  act(()=>{tree=renderer.create(<Recentbooking compact recentRideData={[cached]}/>);});
  await act(async()=>{await card().props.onPress();});
  expect(mockNavigate).not.toHaveBeenCalled();expect(notificationHelper).toHaveBeenCalledWith('','Access denied','error');
});
