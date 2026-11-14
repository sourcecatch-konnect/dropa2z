import React,{useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Animated,AppState,StyleSheet,View} from 'react-native';
import {BrandMark} from './BrandLogo';
import {VehicleGraphic} from './VehicleGraphic';
import type {JourneyPhase} from '../utils/journeyPresentation';

/** Decorative status illustration. Never represents simulated GPS or dispatch progress. */
export function JourneyMotion({phase,vehicle,dark=false,active=true}:{phase:JourneyPhase;vehicle?:any;dark?:boolean;active?:boolean}){
  const progress=useRef(new Animated.Value(0)).current;
  const [width,setWidth]=useState(280);
  useEffect(()=>{let alive=true,reduced=true,loop:Animated.CompositeAnimation|undefined;
    const stop=()=>{loop?.stop();progress.stopAnimation();progress.setValue(0);};
    const run=()=>{stop();if(!alive||reduced||!active||phase==='arrived'||phase==='inactive'||AppState.currentState!=='active')return;loop=Animated.loop(Animated.timing(progress,{toValue:1,duration:phase==='search'?2800:6000,useNativeDriver:true}));loop.start();};
    AccessibilityInfo.isReduceMotionEnabled().then(v=>{reduced=v;run();}).catch(()=>{});
    const motion=AccessibilityInfo.addEventListener('reduceMotionChanged',v=>{reduced=v;run();});const app=AppState.addEventListener('change',run);
    return()=>{alive=false;stop();motion.remove();app.remove();};
  },[phase,active,progress]);
  const trip=phase==='trip',search=phase==='search';
  return <View testID={`journey-motion-${phase}`} accessible={false} pointerEvents="none" onLayout={e=>setWidth(e.nativeEvent.layout.width)} style={[s.scene,{backgroundColor:trip?'#252019':dark?'#2B261D':'#FFF8EC'}]}>
    {search?<View style={s.beacon}>{[0,.33,.66].map(offset=>{const wave=Animated.modulo(Animated.add(progress,offset),1);return <Animated.View key={offset} style={[s.wave,{opacity:wave.interpolate({inputRange:[0,1],outputRange:[.65,0]}),transform:[{scale:wave.interpolate({inputRange:[0,1],outputRange:[.6,2.2]})}]}]}/>;})}<BrandMark size={31}/></View>:<>
      <Animated.View style={[s.skyline,{transform:[{translateX:trip?progress.interpolate({inputRange:[0,1],outputRange:[0,-60]}):0}]}]}>{Array.from({length:12},(_,i)=><View key={i} style={{height:20+(i%4)*10,width:20+(i%3)*7,backgroundColor:trip?'#5B482D':dark?'#504333':'#E5DDCB',marginRight:8,borderTopLeftRadius:3,borderTopRightRadius:3}}/>)}</Animated.View>
      <View style={[s.road,{backgroundColor:trip?'#C88727':'#D9CEBA'}]}/>
      {!trip&&<View style={[s.target,{left:width*.76}]}><View style={s.targetDot}/></View>}
      <Animated.View style={[s.vehicle,{transform:[{translateX:trip?width*.45:phase==='arrived'?width*.60:progress.interpolate({inputRange:[0,1],outputRange:[20,width*.60]})}]}]}><VehicleGraphic vehicle={vehicle} kind={undefined} source={vehicle?.vehicle_image_url?{uri:vehicle.vehicle_image_url}:undefined} style={{width:65,height:43}}/></Animated.View>
    </>}
  </View>;
}
const s=StyleSheet.create({scene:{height:76,overflow:'hidden',marginTop:12},beacon:{height:76,alignItems:'center',justifyContent:'center'},wave:{position:'absolute',width:44,height:44,borderRadius:22,borderColor:'#FFA000',borderWidth:1},skyline:{position:'absolute',left:0,top:4,height:38,flexDirection:'row',alignItems:'flex-end'},road:{position:'absolute',left:0,right:0,height:3,top:55},vehicle:{position:'absolute',top:15,left:0},target:{position:'absolute',top:30,width:40,height:40,borderRadius:20,backgroundColor:'#FFA00030',alignItems:'center',justifyContent:'center'},targetDot:{width:12,height:12,borderRadius:6,backgroundColor:'#FFA000'}});
