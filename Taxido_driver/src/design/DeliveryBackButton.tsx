import React from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {BackButton} from '../commonComponents/backButton';

export function DeliveryBackButton() {
  const navigation=useNavigation<any>();
  return <View style={{position:'absolute',left:8,top:8,zIndex:100,elevation:6}}>
    <BackButton
      onPress={()=>navigation.navigate('TabNav')}
      style={{position:'relative',left:undefined,top:undefined,marginHorizontal:0,marginVertical:0,width:46,height:46,borderRadius:23,borderWidth:2,borderColor:'#4A4038'}}
    />
  </View>;
}
