import { useTheme } from '@react-navigation/native'
import React from 'react'
import {View} from 'react-native';
import {Text} from '../../design/Typography';
import { BackButton } from '../backButtonHeader'
import { useValues } from '../../utils/context'
import styles from './styles'
import {ReferenceLogo} from '../../design/ReferenceChrome'

interface HeaderProps {
  title?: string
  backgroundColor?: string
  rightAction?: React.ReactNode
}

export function Header({
  title,
  backgroundColor,
  rightAction,
}: HeaderProps): React.ReactElement {
  const { colors } = useTheme()
  const { viewRtlStyle, isDark } = useValues()

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: backgroundColor ? backgroundColor : colors.card,
          borderBottomColor: isDark ? "#41464E" : "#E5E7EB",
        },
      ]}
    >
      <View style={{flexDirection:viewRtlStyle,alignItems:'center',justifyContent:'space-between',minHeight:44}}>
        <BackButton />
        <ReferenceLogo driver width={130}/>
        <View style={{width:44,alignItems:'center'}}>{rightAction}</View>
      </View>
      <Text style={[styles.activeRide,{color:colors.text,marginTop:12,marginBottom:4}]}>{title}</Text>
    </View>
  )
}
