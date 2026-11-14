import {bookingItems,bookingStatus} from './liveBooking';
import {bookingSnapshot} from './bookingPeople';

// Websocket events announce a change; the current request/ride records decide
// which delivery (and PIN) to show. Never treat a bid ID as a delivery ID.
export async function resolveAcceptedBooking(requestId: string | number, readRequests: ()=>Promise<any>, readRide: (id:number)=>Promise<any>) {
  const requests=bookingItems(await readRequests());
  const request=requests?.find(item=>String(item.id)===String(requestId));
  const rideId=Number(request?.ride_id);
  if(!Number.isInteger(rideId)||rideId<=0)return null;
  const response=await readRide(rideId);
  if(!(response?.status>=200&&response.status<300))return null;
  const ride=bookingSnapshot(response.data);
  if(Number(ride?.id)!==rideId||!['accepted','arrived','started','in_progress','on_going'].includes(bookingStatus(ride)))return null;
  return ride;
}
