import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {Text} from './Typography';
import {VehicleGraphic} from './VehicleGraphic';
import {referenceSurfaces} from './ReferenceChrome';
import type {GoodsOption} from '../utils/goodsServiceOptions';

export function HomeServiceChoices({options,selectedKey,onSelect,disabled=false,dark=false}:{options:GoodsOption[];selectedKey?:string;onSelect:(key:string)=>void;disabled?:boolean;dark?:boolean}) {
  return <View style={[styles.section,{backgroundColor:dark?'#202422':'#FFFFFF'}]}>
    <Text accessibilityRole="header" style={[styles.title,{color:dark?'#FFFFFF':'#17191C'}]}>Choose Service</Text>
    <View style={styles.row}>{options.map(option=>{
      const selected=option.key===selectedKey;
      return <TouchableOpacity key={option.key} accessibilityRole="radio" accessibilityLabel={option.title} accessibilityState={{checked:selected,disabled}} disabled={disabled}
        onPress={()=>onSelect(option.key)} style={[styles.card,{backgroundColor:selected?(dark?'#46351F':'#FFF3DC'):dark?'#25282D':option.vehicleKind==='bike'?'#FFF7EC':option.serviceType==='freight'?'#F0F5F8':'#EFF8E8',borderColor:selected?'#FC9F03':dark?'#737B86':'#B7BEC6'}]}>
        <VehicleGraphic kind={option.vehicleKind} freight={option.serviceType==='freight'} style={styles.art}/>
        <Text style={[styles.label,{color:dark?'#FFFFFF':'#111111'}]}>{option.serviceType==='freight'?'Cargo\nAuto':`${option.vehicleKind==='bike'?'Bike':'Auto'}\nParcel`}</Text>
        {selected && <View style={styles.check}><Text style={{color:'#FFFFFF',fontWeight:'800',fontSize:15}}>✓</Text></View>}
      </TouchableOpacity>;
    })}</View>
  </View>;
}
const styles=StyleSheet.create({section:{borderTopLeftRadius:20,borderTopRightRadius:20,paddingTop:10,paddingHorizontal:16,marginTop:0},title:{fontSize:16,fontWeight:'800',marginBottom:8},row:{flexDirection:'row',gap:8},card:{...referenceSurfaces.card,flex:1,minWidth:0,paddingVertical:5,paddingHorizontal:2,alignItems:'center',borderWidth:2,borderRadius:14},art:{width:86,height:42,overflow:'hidden'},label:{fontSize:11,fontWeight:'700',lineHeight:13,textAlign:'center',marginTop:2},check:{position:'absolute',right:-1,top:-4,width:18,height:18,borderRadius:10,backgroundColor:'#17191C',alignItems:'center',justifyContent:'center'}});
