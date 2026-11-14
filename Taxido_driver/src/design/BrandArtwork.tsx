import React,{useId} from 'react';
import {View,StyleProp,ViewStyle} from 'react-native';
import Svg,{Image as SvgImage} from 'react-native-svg';
const source=require('./assets/brand-20261105/home-reference.png');
/** Illustration viewport only; controls and delivery data are always native. */
export function BrandArtwork({crop,style,cover=false}:{crop:[number,number,number,number];style?:StyleProp<ViewStyle>;cover?:boolean}){
 const [x,y,w,h]=crop;
 return <View pointerEvents="none" accessible={false} style={[{overflow:'hidden'},style]}><Svg width="100%" height="100%" preserveAspectRatio={cover?'xMidYMid slice':'xMidYMid meet'} viewBox={`0 0 ${w} ${h}`}><SvgImage href={source} x={-x} y={-y} width={916} height={1717}/></Svg></View>;
}
