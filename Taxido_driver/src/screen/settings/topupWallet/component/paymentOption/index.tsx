import { useTheme } from '@react-navigation/native'
import React from 'react'
import {View, Image} from 'react-native';
import {Text} from '../../../../../design/Typography';
import { CustomRadioButton } from '../../../../../commonComponents'
import { useValues } from '../../../../../utils/context'
import styles from './styles'

interface PaymentOptionProps {
  imageSource: any
  text: string
  selected: boolean
  onPress: () => void
}

export function PaymentOption({
  imageSource,
  text,
  selected,
  onPress,
}: PaymentOptionProps) {

  const { colors } = useTheme()
  const { viewRtlStyle } = useValues()

  return (
    <View style={[styles.main, { flexDirection: viewRtlStyle }]}>
      <View style={[styles.imgMaincontainer, {flexDirection: viewRtlStyle}]}>
        <View style={styles.imageContainer}>
          <Image source={imageSource} style={styles.imageView} />
        </View>
        <Text
          style={{
            color: colors.text,
          }}
        >
          {text}
        </Text>
      </View>
      <CustomRadioButton selected={selected} onPress={onPress} />
    </View>
  )
}
