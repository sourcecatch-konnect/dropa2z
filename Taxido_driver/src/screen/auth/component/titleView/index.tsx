import {CardHeading} from '../../../../design/CardHeading';
import React from 'react'
import {View} from 'react-native';
import {Text} from '../../../../design/Typography';
import { useValues } from '../../../../utils/context'
import styles from './styles'
import appColors from '../../../../theme/appColors'
import { CustomRadioButton } from '../../../../commonComponents'
import {
  fontSizes,
  windowHeight,
  windowWidth,
} from '../../../../theme/appConstant'
import { useSelector } from 'react-redux'

interface TitleViewProps {
  title: string
  subTitle?: string
  primary?: any
  onPress?: any
  selected?: any
}

export function TitleView({
  title,
  subTitle,
  primary,
  onPress,
  selected,
}: TitleViewProps) {
  const { textRtlStyle, isDark, viewRtlStyle, rtl } = useValues()
  const { translateData } = useSelector((state: any) => state.setting)

  return <View style={{marginTop:16,marginBottom:8}}>
    <View style={{flexDirection:viewRtlStyle,gap:12,alignItems:'center',flexWrap:'wrap'}}>
      <View style={{flex:1,minWidth:160}}><CardHeading icon={primary?'wallet':'user-round'} title={title} subtitle={subTitle}/></View>
      {primary && <View style={{flexDirection:viewRtlStyle,alignItems:'center',gap:8,minHeight:44}}><CustomRadioButton onPress={onPress} selected={selected}/><Text style={{fontSize:13,color:isDark?'#FFBE60':'#A64B00'}}>{translateData?.setAsPrimary}</Text></View>}
    </View>
  </View>;
}
