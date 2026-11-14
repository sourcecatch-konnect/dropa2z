import React, {useState} from 'react';
import {Image, TouchableOpacity, View} from 'react-native';
import {useTheme} from '@react-navigation/native';
import {Text} from './Typography';
const screenshots=[require('./assets/training/training-step-1.png'),require('./assets/training/training-step-2.png'),require('./assets/training/training-step-3.png'),require('./assets/training/training-step-4.png'),require('./assets/training/training-step-5.png'),require('./assets/training/training-step-6.png')];

/** Captured from actual on-device practice screens, using no customer account data. */
export function TrainingExampleScreenshot({step}:{step:number}){
  const [open,setOpen]=useState(false),{colors}=useTheme();
  return <View style={{gap:10}}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Show example app screenshot" accessibilityState={{expanded:open}} onPress={()=>setOpen(value=>!value)} style={{minHeight:46,justifyContent:'center'}}><Text style={{fontWeight:'700',color:colors.text}}>{open?'Hide example screen':'View example app screen'}</Text></TouchableOpacity>{open&&<Image accessibilityLabel={`Practice step ${step+1} screenshot`} source={screenshots[step]} resizeMode="contain" style={{width:'100%',aspectRatio:1080/2344,borderRadius:14}}/>}</View>;
}
