import {DeviceEventEmitter} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
export const BOOKING_CHANGED='dropa2z:booking-changed';
export const BOOKING_ROUTE_ETA='dropa2z:booking-route-eta';
export function reportBookingRouteEta(rideId:any,phase:'pickup'|'trip',seconds:number|null){
  if(!rideId)return;
  const measuredAt=Date.now();
  DeviceEventEmitter.emit(BOOKING_ROUTE_ETA,{rideId:Number(rideId),eta:typeof seconds==='number'&&Number.isFinite(seconds)&&seconds>=0?{phase,measuredAt,arrivalAt:measuredAt+seconds*1000}:null});
}
export const BOOKING_NOTIFICATION_OPEN='dropa2z:booking-notification-open';
export const PENDING_BOOKING_NOTIFICATION='dropa2z:pending-booking-notification';
export function bookingChanged() { DeviceEventEmitter.emit(BOOKING_CHANGED); }
export async function queueBookingNotification(data:any={}) {
  await AsyncStorage.setItem(PENDING_BOOKING_NOTIFICATION,JSON.stringify(data));
  DeviceEventEmitter.emit(BOOKING_NOTIFICATION_OPEN);
}
