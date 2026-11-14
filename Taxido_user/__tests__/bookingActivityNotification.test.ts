import notifee from '@notifee/react-native';
import {showBookingActivity,updateBookingActivityFromPush,BOOKING_NOTIFICATION_ID} from '../src/utils/bookingActivityNotification';
jest.mock('@notifee/react-native',()=>({__esModule:true,default:{createChannel:jest.fn(async()=> 'booking-progress'),displayNotification:jest.fn(async()=>{}),cancelNotification:jest.fn(async()=>{}),getDisplayedNotifications:jest.fn(async()=>[])},AndroidImportance:{LOW:2},AndroidStyle:{BIGTEXT:1}}));
beforeEach(()=>jest.clearAllMocks());
it('uses one quiet notification with an OS countdown and booking navigation IDs',async()=>{
  const deadline=Date.now()+120000;
  await showBookingActivity({key:'request:3',kind:'request',id:3,requestId:3,status:'searching',deadline,raw:{ride_number:10003}});
  expect(notifee.displayNotification).toHaveBeenCalledWith(expect.objectContaining({id:BOOKING_NOTIFICATION_ID,data:expect.objectContaining({ride_request_id:'3'}),android:expect.objectContaining({onlyAlertOnce:true,ongoing:true,showChronometer:true,chronometerDirection:'down',timestamp:deadline,pressAction:expect.objectContaining({launchActivity:'default'})})}));
});
it('removes countdown after acceptance',async()=>{
  await showBookingActivity({key:'request:3',kind:'ride',id:8,requestId:3,status:'accepted',raw:{driver:{name:'Delivery Partner'}}});
  const message=(notifee.displayNotification as jest.Mock).mock.calls[0][0];
  expect(message.android.showChronometer).toBeUndefined();expect(message.data.ride_id).toBe('8');
});
it('only clears a matching completed delivery, not another booking notification',async()=>{
  (notifee.getDisplayedNotifications as jest.Mock).mockResolvedValue([{id:BOOKING_NOTIFICATION_ID,notification:{id:BOOKING_NOTIFICATION_ID,data:{ride_id:'8',ride_number:'10003'}}}]);
  await updateBookingActivityFromPush({data:{ride_id:'9',status:'completed'}});
  expect(notifee.cancelNotification).not.toHaveBeenCalled();
  await updateBookingActivityFromPush({data:{ride_id:'8',status:'completed'}});
  expect(notifee.cancelNotification).toHaveBeenCalledWith(BOOKING_NOTIFICATION_ID);
});
