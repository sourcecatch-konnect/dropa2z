import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Animated,PanResponder,StyleSheet,View} from 'react-native';
import {Text} from './Typography';

type Props={offerId:number|string;disabled?:boolean;busy?:boolean;onAccept:()=>Promise<boolean>};
export function RequestAcceptSlider({offerId,disabled=false,busy=false,onAccept}:Props){
  const progress=useRef(new Animated.Value(0)).current;
  const [width,setWidth]=useState(280),[pending,setPending]=useState(false);
  const locked=useRef(false),mounted=useRef(true),current=useRef({disabled,busy,onAccept});
  current.current={disabled,busy,onAccept};
  const travel=Math.max(1,width-54);
  const travelRef=useRef(travel);travelRef.current=travel;
  const reset=()=>Animated.timing(progress,{toValue:0,duration:180,useNativeDriver:false}).start();
  useEffect(()=>{locked.current=false;setPending(false);progress.setValue(0);},[offerId,progress]);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;progress.stopAnimation();};},[progress]);
  const accept=async()=>{
    if(locked.current||current.current.disabled||current.current.busy)return;
    locked.current=true;setPending(true);progress.setValue(1);
    let success=false;
    try{success=await current.current.onAccept();}catch{/* Parent exposes the actual server error. */}
    if(!mounted.current)return;
    setPending(false);
    if(!success){locked.current=false;reset();}
  };
  const blocked=()=>locked.current||current.current.disabled||current.current.busy;
  const responder=useMemo(()=>PanResponder.create({
    onStartShouldSetPanResponder:()=>!blocked(),
    onMoveShouldSetPanResponder:(_,g)=>!blocked()&&Math.abs(g.dx)>8&&Math.abs(g.dx)>Math.abs(g.dy)*1.3,
    onPanResponderMove:(_,g)=>{if(!blocked())progress.setValue(Math.max(0,Math.min(1,g.dx/travelRef.current)));},
    onPanResponderRelease:(_,g)=>{if(blocked())return;if(g.dx/travelRef.current>=.95)void accept();else reset();},
    onPanResponderTerminate:()=>{if(!locked.current)reset();},
    onPanResponderTerminationRequest:()=>false,
  }),[progress]);
  return <View onLayout={e=>setWidth(e.nativeEvent.layout.width)} style={[s.track,{opacity:disabled ? .55 : 1}]}>
    <Animated.View pointerEvents="none" style={[s.fill,{width:progress.interpolate({inputRange:[0,1],outputRange:['0%','100%']})}]}/>
    <Text pointerEvents="none" style={s.label}>{pending||busy?'Confirming assignment…':disabled?'Offer unavailable':'Swipe to accept'}</Text>
    <Animated.View testID="request-accept-handle" accessibilityRole="adjustable" accessibilityLabel="Swipe to accept booking" accessibilityHint="Swipe right to the end. With a screen reader, activate to accept." accessibilityState={{disabled:disabled||busy||pending,busy:busy||pending}} accessibilityActions={[{name:'activate',label:'Accept booking'}]} onAccessibilityAction={e=>{if(e.nativeEvent.actionName==='activate')void accept();}} {...responder.panHandlers} style={[s.handle,{transform:[{translateX:progress.interpolate({inputRange:[0,1],outputRange:[0,travel]})}]}]}><Text style={s.arrow}>{pending||busy?'…':'›'}</Text></Animated.View>
  </View>;
}
const s=StyleSheet.create({track:{height:54,borderRadius:30,backgroundColor:'#FFF0D5',overflow:'hidden',justifyContent:'center',alignItems:'center'},fill:{position:'absolute',left:0,top:0,bottom:0,backgroundColor:'#FFCB76'},label:{fontSize:14,fontWeight:'700',color:'#38230A',paddingHorizontal:54,textAlign:'center'},handle:{position:'absolute',left:4,top:4,width:46,height:46,borderRadius:23,backgroundColor:'#FFA000',alignItems:'center',justifyContent:'center'},arrow:{fontSize:33,color:'#211B15',lineHeight:37}});
