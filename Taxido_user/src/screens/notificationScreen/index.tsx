import {ReferenceScreen,ReferenceLogo} from '../../design/ReferenceChrome';
import { View,TouchableOpacity } from 'react-native';
import {Text} from '../../design/Typography';
import {Back} from '../../utils/icons';
import {useAppNavigation} from '../../utils/navigation';
import React from 'react';
import { TopCategory } from '../../components/notificationContainer/messageContainer';
import { commonStyles } from '../../styles/commonStyle';
import { useValues } from "@src/utils/context/index";
import { appColors } from '@src/themes';
import { useSelector } from 'react-redux';

export function Notifications() {
  const { isDark } = useValues();
  const {goBack}=useAppNavigation();
  const { translateData } = useSelector((state: any) => state.setting);

  return (
    <ReferenceScreen><View
      style={[[
        commonStyles.flexContainer,
        { backgroundColor: isDark ? appColors.bgDark : appColors.notificationColor },
        { paddingTop: 8 },
      ], {backgroundColor:'transparent'}]}>
      <View style={{flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:16,paddingBottom:12,minHeight:60}}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={goBack} style={{width:44,height:44,borderRadius:14,borderWidth:1,borderColor:isDark?'#41464E':'#E5E7EB',alignItems:'center',justifyContent:'center',backgroundColor:isDark?'#25282D':'#FFFFFF'}}><Back/></TouchableOpacity>
        <Text accessibilityRole="header" style={{flex:1,minWidth:0,fontSize:20,fontWeight:'700',color:isDark?'#FFFFFF':'#17191C'}}>{translateData.header||'Notifications'}</Text>
        <ReferenceLogo width={104}/>
      </View>
      <TopCategory />
    </View></ReferenceScreen>
  );
};
