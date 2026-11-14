import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {DriverProfile} from '../src/commonComponents/driverProfile';
const mockGet = jest.fn();
const mockNavigate = jest.fn();
jest.mock('../src/api/services/rideService', () => ({rideDataGet:(...args:any[])=>mockGet(...args)}));
jest.mock('../src/utils/context', () => ({useValues:()=>({viewRtlStyle:'row',isDark:false,rtl:false})}));
jest.mock('../src/utils/navigation', () => ({useAppNavigation:()=>({navigate:mockNavigate})}));
jest.mock('@react-navigation/native', () => ({useTheme:()=>({colors:{card:'#fff',text:'#111',border:'#ddd'}})}));
jest.mock('react-redux', () => ({useSelector:()=>({translateData:{sendaMsg:'Message customer'}})}));
jest.mock('../src/utils/icons/icons', () => ({__esModule:true,default:new Proxy({}, {get:()=>()=>null})}));

it('hydrates a partial accepted-booking response and shows customer and receiver', async () => {
  mockGet.mockResolvedValue({data:{id:10,ride_status:{slug:'accepted'},rider:{id:2,name:'Customer',profile_image_url:'https://example.com/photo.png'},driver:{id:4},parcel_receiver:{name:'Receiver',phone:'9823971070',country_code:'91'}}});
  let tree:any; await act(async()=>{tree=renderer.create(<DriverProfile rideDetails={{id:10}}/>);});
  expect(mockGet).toHaveBeenCalledWith(10);
  expect(JSON.stringify(tree.toJSON())).toContain('Customer');
  expect(JSON.stringify(tree.toJSON())).toContain('Receiver');
  expect(JSON.stringify(tree.toJSON())).toContain('https://example.com/photo.png');
  expect(tree.root.find((node:any)=>node.props.accessibilityLabel==='Call parcel receiver')).toBeTruthy();
  act(()=>tree.unmount());
});
