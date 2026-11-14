import {useKeyboardState} from '../../utils/useKeyboardState';
﻿import React,{useEffect,useState} from 'react';
import {Keyboard,TouchableOpacity,View,StyleSheet} from 'react-native';
import {Text} from '../../design/Typography';
import {BrandMark,BrandLoader} from '../../design/BrandLogo';
import {JourneyMotion} from '../../design/JourneyMotion';
import {useLiveBookings} from '../../utils/LiveBookingProvider';
import {bookingClock,bookingCopy,LiveBooking} from '../../utils/liveBooking';
import {journeyPhase,nextDeliveryAddress,routeEtaLabel} from '../../utils/journeyPresentation';
import {useValues} from '../../utils/context';

export function BookingActivityItem({booking,onPress,disabled=false,dock=false}:{booking:LiveBooking;onPress:()=>void;disabled?:boolean;dock?:boolean}){
 const {isDark}=useValues();const [now,setNow]=useState(Date.now());
 useEffect(()=>{setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),booking.status==='searching'?1000:15000);return()=>clearInterval(timer);},[booking.status,booking.deadline]);
 const phase=journeyPhase(booking.status),{title}=bookingCopy(booking),raw=booking.raw;
 const pickup=Array.isArray(raw?.locations)?raw.locations[0]:'',next=nextDeliveryAddress(raw),eta=routeEtaLabel(raw,phase,now);
 const detail=phase==='search'?bookingClock(booking.deadline,now):phase==='pickup'||phase==='arrived'?pickup:next;
 const ink=isDark?'#FFF3E2':'#211C16',muted=isDark?'#C8BCAB':'#6D6255';
 return <TouchableOpacity testID="booking-motion-card" accessibilityRole="button" accessibilityLabel={'Open delivery '+(raw?.ride_number||booking.id)+': '+title} disabled={disabled} onPress={onPress} activeOpacity={.85} style={[styles.card,{backgroundColor:isDark?'#211F1B':'#FFFFFF',borderColor:isDark?'#504333':'#E9DFD2'}]}>
  <View style={styles.top}><BrandMark size={20}/><Text style={[styles.brand,{color:ink}]}>DROP<Text style={{color:'#D17C00'}}>A2Z</Text></Text><Text style={[styles.live,{color:muted}]}>● LIVE · #{raw?.ride_number||booking.id}</Text></View>
  <View style={styles.heading}><Text style={[styles.title,{color:ink}]}>{title}</Text>{!!eta&&<Text style={[styles.eta,{color:ink}]}>{eta}</Text>}</View>
  {!dock&&<Text numberOfLines={1} style={[styles.body,{color:muted,paddingHorizontal:14}]}>{phase==='search'?'Your booking stays active':raw?.driver?.name||'Delivery in progress'}</Text>}
  <JourneyMotion phase={phase} vehicle={raw?.vehicle_type} dark={isDark}/>
  <View style={[styles.footer,{borderColor:isDark?'#504333':'#E9DFD2'}]}><View style={{flex:1,minWidth:0}}><Text style={[styles.label,{color:muted}]}>{phase==='search'?'SEARCHING NEARBY':phase==='pickup'?'MEET AT PICKUP':phase==='arrived'?'READY FOR PICKUP':'NEXT DROP'}</Text><Text numberOfLines={1} style={[styles.body,{color:ink}]}>{detail||'Open for delivery details'}</Text></View>{disabled?<BrandLoader color="#FFA000"/>:<Text style={[styles.open,{color:ink,backgroundColor:isDark?'#392C18':'#FFF3DF'}]}>View booking ↗</Text>}</View>
 </TouchableOpacity>;
}
export function BookingActivityCard({dock=false}:{dock?:boolean}){
 const {bookings,openBooking,opening}=useLiveBookings();const {visible:keyboard}=useKeyboardState();
 
 if(!bookings.length||(dock&&keyboard))return null;
 return <View style={{paddingHorizontal:12,paddingBottom:dock?6:12,paddingTop:6}} testID="home-live-bookings">{(dock?bookings.slice(0,1):bookings).map(booking=><BookingActivityItem key={booking.key} booking={booking} dock={dock} disabled={opening} onPress={()=>void openBooking(booking)}/>)}</View>;
}
const styles=StyleSheet.create({card:{borderWidth:1,borderRadius:21,overflow:'hidden'},top:{paddingTop:10,paddingHorizontal:14,flexDirection:'row',gap:6,alignItems:'center'},brand:{fontSize:11,fontWeight:'700'},live:{marginLeft:'auto',fontSize:9,letterSpacing:.5},heading:{paddingHorizontal:14,marginTop:8,flexDirection:'row',gap:10,alignItems:'center'},title:{fontSize:17,fontWeight:'700',flex:1},eta:{fontSize:19,fontWeight:'700'},body:{fontSize:12,marginTop:3},label:{fontSize:9,letterSpacing:.6},footer:{borderTopWidth:1,padding:12,flexDirection:'row',gap:8,alignItems:'center'},open:{fontSize:11,fontWeight:'700',paddingVertical:10,paddingHorizontal:11,borderRadius:18}});
