import React,{createContext,useContext,useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Alert,AppState,DeviceEventEmitter} from 'react-native';
import {useDispatch,useSelector} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {GET_API,navigationRef} from '../api/methods';
import {userZone,vehicleTypeDataGet,notificationDataGet} from '../api/store/actions';
import getEchoInstance,{releaseScopedEcho} from './echo';
import {activeBookings,bookingItems,bookingStatus,bookingCopy,LiveBooking,terminalBookingStatuses} from './liveBooking';
import {BOOKING_CHANGED,BOOKING_ROUTE_ETA,BOOKING_NOTIFICATION_OPEN,PENDING_BOOKING_NOTIFICATION} from './bookingSignals';
import {journeyPhase,routeEtaLabel} from './journeyPresentation';
import {showBookingActivity,clearBookingActivity} from './bookingActivityNotification';
import {resumeBooking} from './bookingNavigation';

export type BookingNotice={id:string;booking:LiveBooking;at:number};
type BookingContext={bookings:LiveBooking[];notices:BookingNotice[];opening:boolean;refresh:()=>Promise<void>;openBooking:(booking:LiveBooking)=>Promise<void>;created:(request:any)=>void};
const noop=async()=>{};
const Context=createContext<BookingContext>({bookings:[],notices:[],opening:false,refresh:noop,openBooking:noop,created:()=>{}});
export const useLiveBookings=()=>useContext(Context);
const unwrap=(response:any)=>response?.data?.data??response?.data;
const validResponse=(response:any)=>response?.status>=200&&response?.status<300;

export function LiveBookingProvider({children}:{children:React.ReactNode}) {
  const dispatch=useDispatch<any>();
  const userId=useSelector((s:any)=>s.account.self?.id);
  const minutes=Number(useSelector((s:any)=>s.setting.taxidoSettingData?.cabbooking_values?.ride?.find_driver_time_limit));
  const [bookings,setBookings]=useState<LiveBooking[]>([]),[notices,setNotices]=useState<BookingNotice[]>([]),[opening,setOpening]=useState(false),[connectionReady,setConnectionReady]=useState(0);
  const current=useRef<LiveBooking[]>([]),history=useRef<BookingNotice[]>([]),requests=useRef<any[]>([]),rides=useRef<any[]>([]);
  const owner=useRef<any>(null),inflight=useRef<Promise<void>|null>(null),openLock=useRef(false),revision=useRef(0),refreshAgain=useRef(false);
  const echoRef=useRef<any>(null),channels=useRef(new Set<string>()),lastNotification=useRef('');
  const refreshRef=useRef<()=>Promise<void>>(noop);
  const routeEtas=useRef(new Map<number,any>());
  const saveHistory=useCallback((next:BookingNotice[])=>{
    history.current=next.slice(0,50);setNotices(history.current);
    if(owner.current?.id)void AsyncStorage.setItem(`booking-notices:${owner.current.id}`,JSON.stringify(history.current)).catch(()=>{});
  },[]);
  const reconcile=useCallback(()=>{
    const next=activeBookings(requests.current,rides.current,minutes).map(booking=>{
      const eta=booking.kind==='ride'?routeEtas.current.get(booking.id):null;
      return eta?{...booking,raw:{...booking.raw,_routeEta:eta}}:booking;
    });
    for(const id of routeEtas.current.keys())if(!next.some(b=>b.kind==='ride'&&b.id===id))routeEtas.current.delete(id);
    let nextHistory=history.current;
    const record=(booking:LiveBooking)=>{
      const id=`${booking.key}:${booking.status}`;
      if(nextHistory.some(n=>n.id===id))return;
      nextHistory=[{id,booking,at:Date.now()},...nextHistory];
    };
    next.forEach(record);
    for(const old of current.current){
      if(next.some(b=>b.key===old.key))continue;
      const request=requests.current.find(r=>String(r.id)===String(old.requestId));
      const ride=rides.current.find(r=>String(r.id)===String(request?.ride_id??(old.kind==='ride'?old.id:'')));
      const raw=ride??request,status=bookingStatus(raw);
      if(raw&&terminalBookingStatuses.has(status))record({...old,kind:ride?'ride':old.kind,id:Number(raw.id),status,raw});
    }
    if(nextHistory!==history.current)saveHistory(nextHistory);
    current.current=next;setBookings(previous=>JSON.stringify(previous)===JSON.stringify(next)?previous:next);
    const first=next[0],signature=first?`${first.key}:${first.status}:${first.deadline||''}:${first.raw?.driver?.name||''}:${JSON.stringify(first.raw?.locations)}:${routeEtaLabel(first.raw,journeyPhase(first.status))||''}`:'';
    if(signature!==lastNotification.current){
      lastNotification.current=signature;
      void (first?showBookingActivity(first):clearBookingActivity()).catch(()=>{});
    }
  },[minutes,saveHistory]);
  const refresh=useCallback(async()=>{
    if(inflight.current){refreshAgain.current=true;return inflight.current;}
    const session=owner.current;
    if(!session||AppState.currentState==='background')return;
    const startRevision=revision.current;
    const task=(async()=>{
      if(await AsyncStorage.getItem('token')!==session.token)return;
      const results=await Promise.all([GET_API('rideRequest',{timeout:12000}),GET_API('ride',{timeout:12000})]);
      if(owner.current!==session||await AsyncStorage.getItem('token')!==session.token||startRevision!==revision.current)return;
      const requestList=validResponse(results[0])?bookingItems(results[0].data):null;
      const rideList=validResponse(results[1])?bookingItems(results[1].data):null;
      // Keep the last confirmed state on network/429/server errors.
      if(requestList===null||rideList===null)return;
      requests.current=requestList;rides.current=rideList;reconcile();
    })();
    inflight.current=task;
    try{await task;}catch{/* Read-only recovery retries on reconnect/foreground. */}
    finally{if(inflight.current===task){inflight.current=null;if(refreshAgain.current){refreshAgain.current=false;setTimeout(()=>void refreshRef.current(),0);}}}
  },[reconcile]);
  refreshRef.current=refresh;
  useEffect(()=>{const listener=DeviceEventEmitter.addListener(BOOKING_ROUTE_ETA,event=>{
    if(!owner.current||!current.current.some(b=>b.kind==='ride'&&b.id===event?.rideId))return;
    if(event.eta)routeEtas.current.set(event.rideId,event.eta);else routeEtas.current.delete(event.rideId);
    reconcile();
  });return()=>listener.remove();},[reconcile]);
  const created=useCallback((request:any)=>{
    if(!owner.current||!request?.id)return;
    revision.current++;
    requests.current=[request,...requests.current.filter(r=>String(r.id)!==String(request.id))];
    reconcile();void refreshRef.current();
  },[reconcile]);
  useEffect(()=>{
    let disposed=false;
    owner.current=null;inflight.current=null;revision.current++;refreshAgain.current=false;requests.current=[];rides.current=[];current.current=[];history.current=[];
    setBookings([]);setNotices([]);lastNotification.current='';routeEtas.current.clear();
    void clearBookingActivity().catch(()=>{});
    if(!userId)return;
    let connecting=false;
    const connect=async()=>{
      if(disposed||connecting||!owner.current||AppState.currentState==='background')return;
      connecting=true;
      try{
      const echo=await getEchoInstance('booking-summary');
      if(disposed||echo===echoRef.current)return;
      echoRef.current?.disconnect();channels.current.clear();
      echoRef.current=echo;
      setConnectionReady(value=>value+1);
      const changed=()=>{void refreshRef.current();void dispatch(notificationDataGet());};
      const personal=echo.private(`rider.${userId}`);
      ['.ride.accepted','.ride.request.cancelled','.ride.no_driver_found'].forEach(event=>personal.listen(event,changed));
      personal.notification?.(changed);
      echo.private(`user.notifications.${userId}`).listen('.notification.created',changed);
      echo.connector?.pusher?.connection?.bind('connected',changed);
      // Subscribe active channels after the async connection has been created.
      DeviceEventEmitter.emit(BOOKING_CHANGED);
      }catch{/* Recheck public configuration on the next foreground/recovery tick. */}
      finally{connecting=false;}
    };
    void (async()=>{
      const token=await AsyncStorage.getItem('token');if(disposed||!token)return;
      owner.current={id:userId,token};
      try{const stored=JSON.parse(await AsyncStorage.getItem(`booking-notices:${userId}`)||'[]');if(!disposed&&Array.isArray(stored)){history.current=stored.slice(0,50);setNotices(history.current);}}catch{}
      if(disposed)return;
      await Promise.all([refreshRef.current(),connect()]);
      if(!disposed)void consumeRef.current();
    })();
    const tick=setInterval(()=>{void refreshRef.current();if(echoRef.current?.connector?.pusher?.connection?.state!=='connected')void connect();},15000);
    const changed=DeviceEventEmitter.addListener(BOOKING_CHANGED,()=>{void refreshRef.current();void dispatch(notificationDataGet());});
    const appState=AppState.addEventListener('change',state=>{if(state==='active'){void refreshRef.current();void connect();void consumeRef.current();}});
    return()=>{disposed=true;clearInterval(tick);changed.remove();appState.remove();owner.current=null;releaseScopedEcho('booking-summary',echoRef.current);echoRef.current=null;channels.current.clear();};
  },[userId,dispatch]);
  // This observer has its own Echo instance; screen subscriptions are untouched.
  useEffect(()=>{
    const echo=echoRef.current;if(!echo)return;
    const wanted=new Set(bookings.map(b=>b.kind==='request'?`ride-request.${b.id}`:`ride-status.${b.id}`));
    for(const channel of channels.current)if(!wanted.has(channel))echo.leave(channel);
    for(const channel of wanted)if(!channels.current.has(channel)){
      const active=echo.private(channel);
      ['.ride.status','.ride.status_update','.bid.accepted'].forEach(event=>active.listen(event,()=>{void refreshRef.current();void dispatch(notificationDataGet());}));
    }
    channels.current=wanted;
  },[bookings,dispatch,connectionReady]);
  const openBooking=useCallback(async(booking:LiveBooking)=>{
    if(openLock.current||!owner.current||!navigationRef.isReady())return;
    openLock.current=true;setOpening(true);
    const session=owner.current;
    try{
      await refreshRef.current();
      if(owner.current!==session)return;
      const currentBooking=current.current.find(b=>b.key===booking.key)??booking;
      const request=requests.current.find(r=>String(r.id)===String(currentBooking.requestId??currentBooking.id));
      const rideId=currentBooking.kind==='ride'?currentBooking.id:request?.ride_id;
      const navigate=(name:string,params:any)=>{if(owner.current===session)resumeBooking(navigationRef,name,params);};
      if(rideId){
        const result=await GET_API(`ride/${rideId}`,{timeout:12000});
        if(!validResponse(result))throw Error('Could not open this delivery. Please try again.');
        const raw=unwrap(result),status=bookingStatus(raw);
        if(Number(raw?.id)!==Number(rideId))throw Error('The delivery details did not match this booking. Please try again.');
        if(['accepted','arrived'].includes(status))navigate('RideActive',{activeRideOTP:raw});
        else if(['started','in_progress','on_going'].includes(status))navigate('Payment',{rideId:Number(rideId)});
        else navigate('PendingRideScreen',{item:raw,vehicleDetail:raw?.vehicle_type,rideStatus:status==='completed'?'Completed':'Cancelled'});
        return;
      }
      if(!request||!['requested','pending','searching'].includes(bookingStatus(request))){Alert.alert('Booking update',bookingCopy({...currentBooking,status:bookingStatus(request)||currentBooking.status}).title);return;}
      const coords=(request.location_coordinates||[]).map((c:any)=>({lat:Number(c.lat??c.latitude),lng:Number(c.lng??c.longitude)}));
      if(coords.length<2||coords.some((c:any)=>!Number.isFinite(c.lat)||!Number.isFinite(c.lng)))throw Error('The booking location could not be loaded. Please open it from Active deliveries.');
      const zone=await dispatch(userZone(coords[0])).unwrap();
      await dispatch(vehicleTypeDataGet({locations:coords,service_id:request.service_id,service_category_id:request.service_category_id,weight:request.weight})).unwrap();
      const locations=request.locations||[];
      navigate('BookRide',{pickupLocation:locations[0],destination:locations[locations.length-1],stops:locations.slice(1,-1),
        pickupCoords:coords[0],destinationCoords:coords[coords.length-1],stopsCoords:coords.slice(1,-1),filteredLocations:coords,
        service_ID:request.service_id,service_category_ID:request.service_category_id,zoneValue:zone,
        vehicleIdValue:request.vehicle_type?.id,countinueRide:true,countinueRideId:request.id,
        parcelWeight:request.weight,receiverName:request.parcel_receiver?.name,phoneNumber:request.parcel_receiver?.phone,countryCode:request.parcel_receiver?.country_code,
        searchExpiresAt:currentBooking.deadline,searchStartedAt:request.created_at,
      });
    }catch(error:any){Alert.alert('Delivery details',error?.message||'Please try again.');}
    finally{openLock.current=false;setOpening(false);}
  },[dispatch]);
  const consumeRef=useRef<()=>Promise<void>>(noop),consumeLock=useRef(false);
  consumeRef.current=async()=>{
    if(!owner.current||!navigationRef.isReady()||consumeLock.current)return;
    consumeLock.current=true;
    try{
    const pending=await AsyncStorage.getItem(PENDING_BOOKING_NOTIFICATION);if(!pending)return;
    await AsyncStorage.removeItem(PENDING_BOOKING_NOTIFICATION);
    try{
      const data=JSON.parse(pending);await refreshRef.current();
      const booking=current.current.find(b=>data.ride_id&&b.kind==='ride'&&String(b.id)===String(data.ride_id)||data.ride_request_id&&String(b.requestId)===String(data.ride_request_id));
      if(booking)await openBooking(booking);
      else if(Number(data.ride_id))await openBooking({key:`ride:${data.ride_id}`,id:Number(data.ride_id),kind:'ride',status:'',raw:{}});
      else (navigationRef as any).navigate('Notifications');
    }catch{}
    }finally{consumeLock.current=false;}
  };
  useEffect(()=>{
    const listener=DeviceEventEmitter.addListener(BOOKING_NOTIFICATION_OPEN,()=>{void consumeRef.current();});
    const unsubscribe=navigationRef.addListener('state',()=>{void consumeRef.current();});
    void consumeRef.current();
    return()=>{listener.remove();unsubscribe();};
  },[userId]);
  return <Context.Provider value={useMemo(()=>({bookings,notices,opening,refresh,openBooking,created}),[bookings,notices,opening,refresh,openBooking,created])}>{children}</Context.Provider>;
}
