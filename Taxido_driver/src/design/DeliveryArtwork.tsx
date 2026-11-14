import React from 'react';
import {View,Image} from 'react-native';
export function DeliveryArtwork({height=200}:{height?:number}){return <View pointerEvents="none" accessible={false} style={{height,width:'100%',alignItems:'center',justifyContent:'center',overflow:'hidden'}}><View style={{position:'absolute',width:height*.94,height:height*.94,borderRadius:height,backgroundColor:'#FFF2DA'}}/><Image source={require('./assets/brand-20261105/delivery-partner.png')} resizeMode="contain" style={{width:'100%',height}}/></View>;}
