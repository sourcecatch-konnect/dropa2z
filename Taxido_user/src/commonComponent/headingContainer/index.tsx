import {View, TouchableOpacity, SafeAreaView} from 'react-native';
import {Text} from '../../design/Typography';
import React from "react";
import { Back } from "@utils/icons";
import { styles } from "./style";
import { appColors } from "@src/themes";
import { useAppNavigation } from "@src/utils/navigation";
import { useValues } from "@src/utils/context/index";
import { HeaderPropType } from "../type";
import {ReferenceLogo} from '../../design/ReferenceChrome';

export function HeaderContainer({
  value,
  show,
  icon,
  onPressIcon,
}: HeaderPropType) {
  const { textColorStyle, bgContainer, imageRTLStyle, viewRTLStyle, isDark } =
    useValues();
  const { goBack } = useAppNavigation();
  return (
    <SafeAreaView style={{marginHorizontal:16, paddingVertical:10, justifyContent:'center'}}>
      <View style={{alignItems:'center',paddingBottom:10}}><ReferenceLogo width={130}/></View>
      <View style={{flexDirection:viewRTLStyle,alignItems:'center',minHeight:40}}>
      <TouchableOpacity
        onPress={() => goBack()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={{
          flexDirection: viewRTLStyle,
          minWidth:44,minHeight:44,justifyContent:'center',
        }}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor: bgContainer,
              borderColor: isDark ? appColors.darkBorder : appColors.border,
            },
            { transform: [{ scale: imageRTLStyle }] },
          ]}
        >
          <Back />
        </View>
      </TouchableOpacity>
      <Text accessibilityRole="header" style={[styles.textContainer, { color: textColorStyle,flex:1,fontSize:22,fontWeight:'700',textAlign:'left',marginHorizontal:10 }]}>
        {value}
      </Text>
      {show && (
        <TouchableOpacity onPress={onPressIcon} activeOpacity={0.7} style={{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'}}>
          {icon}
        </TouchableOpacity>
      )}
      </View>
    </SafeAreaView>
  );
}
