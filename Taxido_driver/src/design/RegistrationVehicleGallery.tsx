import React, {useState} from 'react';
import {Image, ScrollView, TouchableOpacity, View} from 'react-native';
import {useTheme} from '@react-navigation/native';
import {Text} from './Typography';
import {vehicleChoiceKind} from '../utils/vehicleChoiceKind';

const examples=[
  {key:'bike',name:'Bike',image:require('./assets/vehicle-choice/bike.webp'),family:'bike'},
  {key:'classic-auto',name:'Auto Rickshaw',image:require('./assets/vehicle-choice/classic-auto.webp'),family:'auto'},
] as const;

export function RegistrationVehicleGallery({vehicles,onSelect,onSelectFamily,readOnly=false}: {vehicles:any[];onSelect:(vehicle:any)=>void;onSelectFamily?:(family:'bike'|'auto')=>boolean;readOnly?:boolean}) {
  const {colors}=useTheme(), [selected,setSelected]=useState<string>(''),[message,setMessage]=useState('');
  const picture=examples.find(example=>example.key===selected);
  const select=(example:typeof examples[number])=>{
    setSelected(example.key);
    if(readOnly){setMessage(`${example.name} reference. Your registered vehicle is verified; Admin must review any vehicle change.`);return;}
    const exact=vehicles.find(vehicle=>vehicleChoiceKind(vehicle)===example.key);
    const match=exact||vehicles.find(vehicle=>example.family==='bike'?vehicleChoiceKind(vehicle)==='bike':vehicleChoiceKind(vehicle)?.includes('auto')||vehicleChoiceKind(vehicle)==='electric-rickshaw');
    if(match){onSelect(match);setMessage(`${example.name} uses the ${match.name} registration category. Enter your actual vehicle model and registration number below.`);}
    else if(onSelectFamily?.(example.family))setMessage(`Loading the matching registration category for ${example.name}. Enter your actual model below.`);
    else setMessage(`This is a ${example.name} reference. Select the matching delivery category above to see eligible registration types.`);
  };
  return <View style={{gap:10,marginVertical:12}}>
    <Text style={{color:colors.text,fontWeight:'700',fontSize:16}}>Match your vehicle</Text>
    <ScrollView horizontal nestedScrollEnabled keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator contentContainerStyle={{gap:10,paddingBottom:8}}>
      {examples.map(example=><TouchableOpacity key={example.key} accessibilityRole="button" accessibilityLabel={`${example.name} vehicle reference`} accessibilityState={{selected:selected===example.key}} onPress={()=>select(example)} style={{width:146,padding:8,borderRadius:14,borderWidth:2,borderColor:selected===example.key?'#FFA000':colors.border,backgroundColor:colors.card,gap:8}}>
        <View style={{width:'100%',aspectRatio:1040/720,backgroundColor:'#FFFFFF',borderRadius:8,overflow:'hidden',justifyContent:'center'}}><Image source={example.image} resizeMode="contain" style={{width:'100%',height:'100%'}}/></View>
        <Text style={{color:colors.text,fontWeight:'700'}}>{example.name}</Text>
      </TouchableOpacity>)}
    </ScrollView>
    {!!picture&&<View style={{width:'100%',aspectRatio:1040/720,backgroundColor:'#FFFFFF',borderRadius:12,overflow:'hidden',justifyContent:'center'}}><Image source={picture.image} resizeMode="contain" style={{width:'100%',height:'100%'}}/></View>}
    {!!message&&<Text accessibilityLiveRegion="polite" style={{color:colors.text,lineHeight:20}}>{message}</Text>}
    <Text style={{color:colors.text,fontSize:12,lineHeight:18}}>Photos show parcel-placement examples. Printed dimensions are illustrations, not verified vehicle capacity limits.</Text>
  </View>;
}
