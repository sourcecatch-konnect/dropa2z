import { TouchableOpacity } from 'react-native'
import React from 'react'
import Icons from '../../utils/icons/icons'
import { useNavigation, useTheme } from '@react-navigation/native'
import commanStyles from '../../style/commanStyles'

export function BackButton({onPress, style}: {onPress?:()=>void; style?:any} = {}) {
  const navigation = useNavigation()
  const { colors } = useTheme()
  const gotoBack = () => {
    if(onPress)onPress();
    else if(navigation.canGoBack())navigation.goBack();
    else (navigation as any).navigate('TabNav');
  }
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={gotoBack}
      style={[
        commanStyles.backButton,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
    >
      <Icons.Back color={colors.text} />
    </TouchableOpacity>
  )
}
