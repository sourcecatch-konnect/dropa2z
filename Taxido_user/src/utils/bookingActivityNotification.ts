import notifee,{AndroidImportance,AndroidStyle} from '@notifee/react-native';
import {LiveBooking,bookingCopy,terminalBookingStatuses} from './liveBooking';
import {notificationContent} from './notificationPresentation';
import {journeyPhase,nextDeliveryAddress,pickupStartedAt,routeEtaLabel} from './journeyPresentation';
export const BOOKING_NOTIFICATION_ID='dropa2z-active-delivery';
export async function showBookingActivity(booking:LiveBooking) {
  if(terminalBookingStatuses.has(booking.status)){await clearBookingActivity();return;}
  if(booking.status==='searching'&&booking.deadline&&booking.deadline<=Date.now()){await clearBookingActivity();return;}
  const channelId=await notifee.createChannel({id:'booking-progress',name:'Live delivery progress',importance:AndroidImportance.LOW});
  const {title,body:fallback}=bookingCopy(booking);
  const phase=journeyPhase(booking.status),raw=booking.raw;
  const address=phase==='trip'?nextDeliveryAddress(raw):raw?.locations?.[0];
  const eta=routeEtaLabel(raw,phase),since=phase==='arrived'?pickupStartedAt(raw):undefined;
  const body=[phase==='search'?'Search continues in the background':phase==='arrived'?'Meet your delivery partner at pickup':raw?.driver?.name,typeof address==='string'?address:'',eta?`Estimated arrival · ${eta}`:'','Tap to open your booking'].filter(Boolean).join('\n')||fallback;
  const searching=booking.status==='searching';
  await notifee.displayNotification({id:BOOKING_NOTIFICATION_ID,title,body,
    data:{booking_activity:'1',ride_id:booking.kind==='ride'?String(booking.id):'',ride_request_id:String(booking.requestId||''),ride_number:String(booking.raw?.ride_number||'')},
    android:{channelId,smallIcon:'dropa2z_notification',color:'#FC9F03',onlyAlertOnce:true,ongoing:true,autoCancel:false,
      ...(since?{showChronometer:true,chronometerDirection:'up' as const,timestamp:since,showTimestamp:true}:{}),
      style:{type:AndroidStyle.BIGTEXT,text:body},pressAction:{id:'booking-activity',launchActivity:'default'},
      ...(searching&&booking.deadline&&booking.deadline>Date.now()?{showChronometer:true,chronometerDirection:'down' as const,timestamp:booking.deadline,showTimestamp:true,timeoutAfter:Math.max(1000,booking.deadline-Date.now())}:{}),
    },ios:{foregroundPresentationOptions:{banner:false,list:true,sound:false,badge:false}},
  });
}
export const clearBookingActivity=()=>notifee.cancelNotification(BOOKING_NOTIFICATION_ID);
export async function updateBookingActivityFromPush(message:any){
  const data=message?.data||{},status=String(data.status||'').toLowerCase();
  if(!status)return;
  const displayed=await notifee.getDisplayedNotifications();
  const existing=displayed.find(item=>item.id===BOOKING_NOTIFICATION_ID)?.notification;
  const old=existing?.data;
  const same=old&&(data.ride_id&&old.ride_id===String(data.ride_id)||data.ride_number&&old.ride_number===String(data.ride_number));
  if(!existing||!same)return;
  if(terminalBookingStatuses.has(status)){await clearBookingActivity();return;}
  const {title,body}=notificationContent(message);
  await notifee.displayNotification({...existing,title,body,data:{...old,...data,booking_activity:'1'},android:{...existing.android,showChronometer:false,showTimestamp:false,timeoutAfter:undefined,onlyAlertOnce:true,ongoing:true,autoCancel:false,style:{type:AndroidStyle.BIGTEXT,text:body}}});
}
