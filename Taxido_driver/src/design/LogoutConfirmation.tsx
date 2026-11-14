import React from 'react';
import {View} from 'react-native';
import {useTheme} from '@react-navigation/native';
import {Text} from './Typography';
import {DesignIcon} from './DesignIcon';
import {Button} from '../commonComponents/button';

export function LogoutConfirmation({busy,onCancel,onLogout}: {busy:boolean;onCancel:()=>void;onLogout:()=>void}) {
  const {colors}=useTheme();
  return <View style={{padding:20,paddingBottom:32,gap:16}}>
    <View style={{width:56,height:56,borderRadius:18,backgroundColor:'#FFF0D9',alignItems:'center',justifyContent:'center'}}><DesignIcon name="log-out" color="#A65B00" width={28} height={28}/></View>
    <Text style={{color:colors.text,fontSize:22,fontWeight:'700'}}>Log out of Dropa2z?</Text>
    <Text style={{color:colors.text,fontSize:15,lineHeight:22}}>You can sign in again to view your deliveries and earnings.</Text>
    <View style={{flexDirection:'row',gap:12}}>
      <View style={{flex:1}}><Button title="Stay signed in" onPress={()=>{if(!busy)onCancel();}} backgroundColor={colors.card} color={colors.text}/></View>
      <View style={{flex:1}}><Button title={busy?'Logging out…':'Log out'} onPress={onLogout} loading={busy} backgroundColor="#FFA000" color="#17191C"/></View>
    </View>
  </View>;
}
