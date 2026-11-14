import React, {useEffect,useState} from 'react';
import {Image,StyleSheet,TouchableOpacity,View} from 'react-native';
import {Text} from './Typography';
import {BrandMark} from './BrandLogo';

type Props={role:'rider'|'driver';name?:string;photo?:string;rating?:number;vehicle?:string;plate?:string;pickup?:string;dark?:boolean;since?:number;onPerson?:()=>void;onCall?:()=>void;onMessage?:()=>void;children:React.ReactNode};
/** Native controls keep call/chat/PIN connected to the existing app handlers. */
export function PickupCard({role,name,photo,rating,vehicle,plate,pickup,dark=false,since,onPerson,onCall,onMessage,children}:Props){
  const [failed,setFailed]=useState(false),[now,setNow]=useState(Date.now());
  useEffect(()=>setFailed(false),[photo]);
  useEffect(()=>{if(!since)return;setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[since]);
  const seconds=since?Math.max(0,Math.floor((now-since)/1000)):undefined;
  const ink=dark?'#FFF3E2':'#211C16',muted=dark?'#C8BCAB':'#6D6255',line=dark?'#504333':'#E9DFD2',soft=dark?'#392C18':'#FFF3DF';
  return <View testID={`${role}-pickup-card`} style={[s.card,{backgroundColor:dark?'#211F1B':'#FFFFFF',borderColor:line}]}>
    <View style={s.row}><BrandMark size={23}/><Text style={[s.brand,{color:ink}]}>DROP<Text style={{color:'#D17C00'}}>A2Z</Text></Text><View style={[s.badge,{backgroundColor:soft}]}><View style={s.dot}/><Text style={[s.badgeText,{color:ink}]}>{role==='rider'?'DRIVER ARRIVED':'AT PICKUP'}</Text></View></View>
    <Text style={[s.title,{color:ink}]}>{role==='rider'?'Your delivery partner is here':'Ready to collect the parcel'}</Text>
    <Text numberOfLines={2} style={[s.address,{color:muted}]}>{pickup || 'Pickup address unavailable'}</Text>
    <View style={[s.identity,{borderColor:line}]}>
      <TouchableOpacity accessibilityRole={onPerson?'button':undefined} accessibilityLabel={onPerson?'View driver details':undefined} disabled={!onPerson} onPress={onPerson} style={[s.row,{flex:1,minWidth:0}]}>
        {photo&&!failed?<Image source={{uri:photo}} onError={()=>setFailed(true)} style={s.avatar}/>:<View style={[s.avatar,{backgroundColor:soft,alignItems:'center',justifyContent:'center'}]}><Text style={{color:ink,fontWeight:'700'}}>{name?.trim()?.[0]?.toUpperCase()||'D'}</Text></View>}
        <View style={{flex:1,minWidth:0}}><Text style={[s.name,{color:ink}]}>{name|| (role==='rider'?'Delivery partner':'Customer')}</Text><Text style={[s.caption,{color:muted}]}>{role==='driver'?'Sender':`${Number.isFinite(rating)?`★ ${Number(rating).toFixed(1)} · `:''}${vehicle||'Delivery partner'}`}</Text></View>
      </TouchableOpacity>
      {role==='rider'&&!!plate&&<Text style={[s.plate,{borderColor:line,color:ink}]}>{plate}</Text>}
      {role==='driver'&&<View style={{alignItems:'flex-end'}}><Text accessibilityLiveRegion="none" style={[s.name,{color:ink}]}>{seconds===undefined?'—':`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`}</Text><Text style={[s.caption,{color:muted}]}>At pickup</Text></View>}
    </View>
    <View style={[s.row,{marginTop:8,marginBottom:10}]}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={role==='rider'?'Call driver':'Call sender'} disabled={!onCall} onPress={onCall} style={[s.action,{borderColor:line,opacity:onCall?1:.45}]}><Text style={[s.actionText,{color:ink}]}>☎  {role==='rider'?'Call driver':'Call sender'}</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Message" disabled={!onMessage} onPress={onMessage} style={[s.action,{borderColor:line,opacity:onMessage?1:.45}]}><Text style={[s.actionText,{color:ink}]}>◌  Message</Text></TouchableOpacity>
    </View>
    {children}
  </View>;
}
const s=StyleSheet.create({card:{borderWidth:1,borderRadius:16,padding:12},row:{flexDirection:'row',alignItems:'center',gap:8},brand:{fontSize:13,fontWeight:'700',letterSpacing:.4},badge:{marginLeft:'auto',borderRadius:20,paddingHorizontal:8,paddingVertical:7,flexDirection:'row',alignItems:'center',gap:5},badgeText:{fontSize:9,fontWeight:'700'},dot:{width:6,height:6,borderRadius:3,backgroundColor:'#FFA000'},title:{fontSize:18,fontWeight:'700',marginTop:10,marginBottom:4},address:{fontSize:13,lineHeight:19},identity:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:10,marginVertical:4,borderBottomWidth:1},avatar:{height:38,width:38,borderRadius:19},name:{fontSize:15,fontWeight:'700'},caption:{fontSize:12,marginTop:3},plate:{fontSize:11,fontWeight:'700',borderWidth:1,borderRadius:6,padding:6,maxWidth:'42%'},action:{flex:1,minHeight:46,borderWidth:1,borderRadius:10,justifyContent:'center',alignItems:'center',padding:8},actionText:{fontSize:13,fontWeight:'700'}});
