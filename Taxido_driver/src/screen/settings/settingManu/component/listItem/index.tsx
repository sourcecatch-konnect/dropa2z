import {View, TouchableOpacity} from 'react-native';
import {Text} from '../../../../../design/Typography';
import React from 'react'
import Icons from '../../../../../utils/icons/icons'
import styles from './styles'
import ListItemProps from './type'
import { useTheme } from '@react-navigation/native'
import { useValues } from '../../../../../utils/context'
import appColors from '../../../../../theme/appColors'

export function ListItem({
  icon,
  text,
  onPress,
  backgroundColor,
  color,
  showNextIcon,
  dot
}: ListItemProps) {
  const { colors } = useTheme()
  const { viewRtlStyle, isDark } = useValues()

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={text}
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.main, { flexDirection: viewRtlStyle }]}
    >
      <View style={[styles.alignment, { flexDirection: viewRtlStyle, flex: 1, minWidth: 0 }]}>

        <View
          style={[
            styles.iconContain,
            { backgroundColor: backgroundColor || (isDark ? '#3B2B19' : '#FFF2DF') },
          ]}
        >
          {dot && <View
            style={{
              position: "absolute",
              bottom: 20,
              right: 10,
              width: 8,
              height: 8,
              borderRadius: 5,
              backgroundColor: "red",
              zIndex: 3
            }}
          />}
          {icon}
        </View>
        <Text style={[styles.title, { color: color || colors.text }]}>
          {text}
        </Text>
      </View>
      {showNextIcon && (
        <View>
          <Icons.NextLarge color={appColors.iconColor} />
        </View>
      )}
    </TouchableOpacity>
  )
}
