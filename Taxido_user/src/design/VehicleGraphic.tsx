import React from 'react';
import {Image,ImageProps,StyleSheet,View} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {goodsArtworkKind,vehicleSvg} from './vehicleArtwork';
export {goodsArtworkKind} from './vehicleArtwork';
export function VehicleGraphic({vehicle,kind,freight=false,style,...props}:ImageProps&{vehicle?:any;kind?:'bike'|'auto';freight?:boolean}){
 const selected=kind||goodsArtworkKind(vehicle);if(!selected)return <Image style={style} {...props}/>;
 const {resizeMode,tintColor,overlayColor,...frame}=StyleSheet.flatten(style)||{};
 return <View pointerEvents="none" accessible={false} style={[{width:84,height:56,alignItems:'center',justifyContent:'center'},frame]}><SvgXml xml={vehicleSvg(selected,freight)} width="100%" height="100%"/></View>;
}
