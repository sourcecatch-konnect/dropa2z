import React, {useCallback} from 'react';
import {BackHandler, TouchableOpacity} from 'react-native';
import {useFocusEffect, useNavigation, useTheme} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Text} from './Typography';

/** Leaving tracking returns Home; it never cancels or recreates the booking. */
export function DeliveryBackButton() {
  const navigation=useNavigation<any>(), {colors}=useTheme(), insets=useSafeAreaInsets();
  const home=useCallback(()=>navigation.navigate('MyTabs',{screen:'HomeScreen'}),[navigation]);
  useFocusEffect(useCallback(()=>{const listener=BackHandler.addEventListener('hardwareBackPress',()=>{home();return true;});return()=>listener.remove();},[home]));
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back to Home, keep delivery active" onPress={home}
    style={{position:'absolute',left:16,top:Math.max(12,insets.top+8),width:46,height:46,borderRadius:23,backgroundColor:colors.card,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center',zIndex:100,elevation:6}}>
    <Text style={{color:colors.text,fontSize:28,lineHeight:32}}>‹</Text>
  </TouchableOpacity>;
}
