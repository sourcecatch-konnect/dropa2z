import React from 'react'
import { View, Image, ScrollView } from 'react-native'
import { style } from '../otpverify/style'
import Icons from '../../../../utils/icons/icons'
import appColors from '../../../../theme/appColors'
import { useTheme } from '@react-navigation/native'
import { useValues } from '../../../../utils/context'
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export function AuthTemplate({ children, image, keyboardVisible = false }: any) {
  const { colors } = useTheme()
  const { isDark } = useValues()
  const insets=useSafeAreaInsets();

  return (
    <View
      style={[
        style.container,
        {
          backgroundColor: isDark ? appColors.bgDark : appColors.graybackground,
        },
      ]}
    >
      {!keyboardVisible && (
        <View style={style.topContainer}>
          <View style={[style.backBtn, { borderColor: colors.card }]}>
            <Icons.Back color={colors.text} />
          </View>
          <View style={style.imgContainer}>
            <Image source={image} style={style.img} />
          </View>
        </View>
      )}
      <View
        style={[
          style.bottomContainer,
          keyboardVisible && style.bottomContainerKeyboard,
          {
            backgroundColor: isDark ? appColors.darkThemeSub : appColors.white,
          },
        ]}
      >
        <ScrollView style={{flex:1}} contentContainerStyle={{flexGrow:1,paddingBottom:Math.max(24,insets.bottom)}} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={keyboardVisible}>
          {children}
        </ScrollView>
      </View>
    </View>
  )
}
