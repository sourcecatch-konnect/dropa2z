import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {AssignedDriverCard} from '../src/components/assignedDriverCard';
const mockNavigate = jest.fn();
jest.mock('../src/utils/context', () => ({useValues: () => ({isDark:false})}));
jest.mock('../src/utils/navigation', () => ({useAppNavigation: () => ({navigate:mockNavigate})}));
const ride = {id:10,ride_status:{slug:'accepted'},driver:{id:4,name:'Assigned Driver',phone:'9823971070'},rider:{id:2},vehicle_type:{vehicle_model:'Auto',plate_number:'MH19TEST1'}};
it.each(['requested','pending','cancelled'])('does not show an assigned-driver card in %s state', status => {
  let tree: any; act(() => {tree=renderer.create(<AssignedDriverCard ride={{...ride,ride_status:{slug:status}}}/>);});
  expect(tree.toJSON()).toBeNull(); act(() => tree.unmount());
});
it('shows the real driver and vehicle, and routes chat to that booking', () => {
  let tree: any; act(() => {tree=renderer.create(<AssignedDriverCard ride={ride}/>);});
  expect(JSON.stringify(tree.toJSON())).toContain('Assigned Driver');
  expect(JSON.stringify(tree.toJSON())).toContain('MH19TEST1');
  const message=tree.root.find((node:any) => node.props.accessibilityLabel==='Message assigned driver');
  act(() => message.props.onPress());
  expect(mockNavigate).toHaveBeenCalledWith('ChatScreen',expect.objectContaining({rideId:10,driverId:4,riderId:2}));
  act(() => tree.unmount());
});
