import {View, TouchableOpacity} from 'react-native';
import {Text} from '../../../../design/Typography';
import React from 'react'
import Icons from '../../../../utils/icons/icons'
import styles from './styles'
import { useTheme, useNavigation } from '@react-navigation/native'
import { useValues } from '../../../../utils/context'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../../navigation/main/types'
import { useSelector } from 'react-redux'
import {ReferenceLogo} from '../../../../design/ReferenceChrome'

type navigation = NativeStackNavigationProp<RootStackParamList>

export function Header() {
  const { colors } = useTheme()
  const { viewRtlStyle } = useValues()
  const navigation = useNavigation<navigation>()
  const { translateData } = useSelector((state: any) => state.setting)

  return (
    <View style={{backgroundColor:colors.card,paddingTop:12,paddingBottom:6}}>
      <View style={{alignItems:'center'}}><ReferenceLogo driver width={130}/></View>
    <View
      style={[
        styles.main,
        {
          backgroundColor: colors.card,
          flexDirection: viewRtlStyle,
          alignItems: 'center',
          justifyContent: 'space-between',
        },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        {translateData.titleMyRide}
      </Text>
      <TouchableOpacity
        style={[styles.callIcon, { borderColor: colors.border }]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Notification')}
      >
        <Icons.Notification color={colors.text} />
      </TouchableOpacity>
    </View>
    </View>
  )
}
