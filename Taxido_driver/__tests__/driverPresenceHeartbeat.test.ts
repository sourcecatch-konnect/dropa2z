jest.mock('@react-native-community/geolocation',()=>({getCurrentPosition:jest.fn((success)=>success({coords:{latitude:21.0015,longitude:75.5804}})),watchPosition:jest.fn(()=>7),clearWatch:jest.fn()}));
jest.mock('../src/commonComponents/helper/permissionHelper',()=>({requestLocationPermission:jest.fn(async()=>true)}));
jest.mock('../src/api/services/zoneService',()=>({driversStatus:jest.fn(async()=>({data:{success:true}}))}));
import {startLiveLocation,stopLiveLocation} from '../src/commonComponents/helper/liveLocationHelper';
import {driversStatus} from '../src/api/services/zoneService';

beforeEach(()=>{jest.useFakeTimers();jest.clearAllMocks();});
afterEach(()=>{stopLiveLocation();jest.useRealTimers();});
it('refreshes a stationary driver and never changes availability in its heartbeat',async()=>{
  await startLiveLocation(258,{});
  expect(driversStatus).toHaveBeenCalledTimes(1);
  await jest.advanceTimersByTimeAsync(60000);
  expect(driversStatus).toHaveBeenCalledTimes(2);
  expect((driversStatus as jest.Mock).mock.calls[1][0]).toEqual({location:{lat:21.0015,lng:75.5804}});
  stopLiveLocation();
  await jest.advanceTimersByTimeAsync(660000);
  expect(driversStatus).toHaveBeenCalledTimes(2);
});
it('restarting tracking keeps one heartbeat timer',async()=>{
  await startLiveLocation(258,{});
  await startLiveLocation(258,{});
  await jest.advanceTimersByTimeAsync(60000);
  expect(driversStatus).toHaveBeenCalledTimes(3);
});
