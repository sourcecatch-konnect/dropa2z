import React,{useId} from 'react';
import {StyleProp,View,ViewStyle} from 'react-native';
import Svg,{Image as SvgImage,Defs,Rect,G,Mask,LinearGradient,Stop} from 'react-native-svg';

const source=require('./assets/approved-home.png');
/** The viewport crops illustration artwork only. Data and controls remain native. */
export function ApprovedHomeArtwork({crop,style,fade=false}:{crop:[number,number,number,number];style?:StyleProp<ViewStyle>;fade?:boolean}) {
  const [x,y,width,height]=crop;
  const id=useId().replace(/[^a-zA-Z0-9]/g,'');
  return <View pointerEvents="none" accessible={false} style={[{overflow:'hidden'},style]}>
    <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
      {fade&&<Defs>
        <LinearGradient id={`${id}-left`} x1="0%" y1="0%" x2="100%" y2="0%"><Stop offset="0" stopColor="white" stopOpacity="0"/><Stop offset=".12" stopColor="white"/><Stop offset="1" stopColor="white"/></LinearGradient>
        <LinearGradient id={`${id}-top`} x1="0%" y1="0%" x2="0%" y2="100%"><Stop offset="0" stopColor="white" stopOpacity="0"/><Stop offset=".12" stopColor="white"/><Stop offset="1" stopColor="white"/></LinearGradient>
        <Mask id={`${id}-left-mask`} x={0} y={0} width={width} height={height} maskUnits="userSpaceOnUse"><Rect width={width} height={height} fill={`url(#${id}-left)`}/></Mask>
        <Mask id={`${id}-top-mask`} x={0} y={0} width={width} height={height} maskUnits="userSpaceOnUse"><Rect width={width} height={height} fill={`url(#${id}-top)`}/></Mask>
      </Defs>}
      <G mask={fade?`url(#${id}-left-mask)`:undefined}><G mask={fade?`url(#${id}-top-mask)`:undefined}><SvgImage href={source} x={-x} y={-y} width={916} height={1717}/></G></G>
    </Svg>
  </View>;
}
