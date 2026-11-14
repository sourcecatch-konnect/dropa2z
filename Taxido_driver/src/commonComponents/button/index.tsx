import {BrandLoader} from '../../design/BrandLogo';
import React from 'react'
import {TouchableOpacity, View, ActivityIndicator} from 'react-native';
import {Text} from '../../design/Typography';
import styles from './styles'
import CustomButtonProps from './types'
import appColors from '../../theme/appColors'
import {useReferenceTheme} from '../../design/ReferenceChrome'

export function Button({
  onPress,
  title,
  backgroundColor,
  borderWidth,
  borderColor,
  color,
  margin,
  loading,
  activeOpacity,
  textDecorationLine,
  textStyle,
}: CustomButtonProps) {
  const visual = useReferenceTheme()
  const actionColor = visual.active && (!backgroundColor || backgroundColor === appColors.primary) ? visual.accent : backgroundColor || appColors.primary
  return (
    <View style={{ marginHorizontal: margin !== undefined ? margin : 15 }}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{disabled:!!loading,busy:!!loading}}
        activeOpacity={activeOpacity ? activeOpacity : 0.9}
        style={[
          styles.button,
          { backgroundColor: actionColor },
          { borderColor },
          { borderWidth },
          visual.active&&{height:undefined,minHeight:46,paddingVertical:10},
        ]}
        onPress={onPress}
        disabled={loading}
      >
        {loading ? (
          <BrandLoader size="large" color={appColors.white} />
        ) : (
          <Text style={[styles.buttonText, { color:actionColor===appColors.primary||actionColor===visual.accent?'#17191C':color||appColors.white,textDecorationLine}, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}
