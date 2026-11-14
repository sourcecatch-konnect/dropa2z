import React,{useEffect,useRef} from 'react';
import {AccessibilityInfo, Animated, AppState, Image, StyleSheet, View} from 'react-native';
import {Text} from './Typography';
import {useValues} from '../utils/context';
import vehicleFrames from './assets/brand-20261110/vehicle-frames.json';
const tail=require('./assets/brand-20261110/tail-exact.png');
const orangeText=require('./assets/brand-20261110/orange-text-exact.png');
const marks=[require('./assets/brand-20261110/mark-0-exact.png'),require('./assets/brand-20261110/mark-1-exact.png'),require('./assets/brand-20261110/mark-2-exact.png')];
const vehicles=[require('./assets/brand-20261110/vehicle-0.png'),require('./assets/brand-20261110/vehicle-1.png'),require('./assets/brand-20261110/vehicle-2.png')];
/** Native transforms/opacity only. Stops off-screen, in background and for reduced motion. */
export function BrandSymbol({size=36,animated=false,color,width,light}:{size?:number;animated?:boolean;color?:string;width?:number;light?:boolean}){
 const {isDark}=useValues(),useLight=light??isDark,frameWidth=width??size,scale=size/247,markWidth=186*scale;
 const progress=useRef(new Animated.Value(0)).current;
 useEffect(()=>{let alive=true,reduced=true,loop:Animated.CompositeAnimation|undefined;
  const stop=()=>{loop?.stop();progress.stopAnimation();progress.setValue(0);};
  const run=()=>{stop();if(alive&&animated&&!reduced&&AppState.currentState==='active'){loop=Animated.loop(Animated.timing(progress,{toValue:3,duration:6100,useNativeDriver:true}));loop.start();}};
  AccessibilityInfo.isReduceMotionEnabled().then(v=>{reduced=v;run();}).catch(()=>{});
  const motion=AccessibilityInfo.addEventListener('reduceMotionChanged',v=>{reduced=v;run();});
  const state=AppState.addEventListener('change',run);
  return()=>{alive=false;stop();motion.remove();state.remove();};
 },[animated,progress]);
 return <View pointerEvents="none" style={{width:frameWidth,height:size,overflow:'hidden'}}>{marks.map((source,index)=>{const [x,y,w,h]=vehicleFrames[index];return <Animated.View key={index} style={{position:'absolute',left:(frameWidth-markWidth)/2,top:0,width:markWidth,height:size,opacity:!animated?(index===1?1:0):progress.interpolate({inputRange:[0,.15,.85,1.15,1.85,2.15,2.85,3],outputRange:index===0?[1,1,1,0,0,0,0,1]:index===1?[0,0,0,1,1,0,0,0]:[0,0,0,0,0,1,1,0]})}}><Image source={source} resizeMode="stretch" style={{width:markWidth,height:size,tintColor:color||(useLight?'#FFFFFF':undefined)}}/>{useLight&&!color&&<Image source={vehicles[index]} resizeMode="stretch" style={{position:'absolute',left:x*scale,top:y*scale,width:w*scale,height:h*scale}}/>}</Animated.View>;})}</View>;
}
export function BrandMark({size=36}:{size?:number}){return <BrandSymbol size={size}/>;}
export function BrandLogo({light=false,size=36,width,driver=false,animated=false}:{light?:boolean;size?:number;width?:number;driver?:boolean;animated?:boolean}){
 const {isDark}=useValues(),useLight=light||isDark;
 const w=width??Math.min(size*4.6,300),scale=w/1270,h=247*scale,markWidth=186*scale;
 return <View pointerEvents="none" accessible accessibilityLabel={driver?'Dropa2z Driver':'Dropa2z'} style={{alignItems:'center',flexShrink:1}}>
  <View style={{width:w,height:h,flexDirection:'row',overflow:'hidden'}}><BrandSymbol size={h} width={markWidth} animated={animated} light={useLight}/><View style={{width:1084*scale,height:h}}><Image source={tail} resizeMode="stretch" style={{width:1084*scale,height:h,tintColor:useLight?'#FFFFFF':undefined}}/>{useLight&&<Image source={orangeText} resizeMode="stretch" style={{position:'absolute',left:516*scale,top:0,width:568*scale,height:h}}/>}</View></View>
  {driver&&<Text style={{fontSize:10,fontWeight:'700',letterSpacing:1.2,color:useLight?'#FFFFFF':'#525965',marginTop:6}}>DRIVER PARTNER</Text>}
 </View>;
}
export function BrandLoader({size='small',color,style,...props}:any){const width=typeof size==='number'?size:size==='large'?32:22;return <View accessibilityRole="progressbar" accessibilityLabel="Loading" {...props} style={[{alignItems:'center',justifyContent:'center'},style]}><BrandSymbol size={width} animated color={color}/></View>;}
export function BrandEntrance({children}:{children:React.ReactNode}){return <View>{children}</View>;}
