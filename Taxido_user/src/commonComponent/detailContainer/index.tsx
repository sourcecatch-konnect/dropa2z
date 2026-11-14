import {View} from 'react-native';
import {Text} from '../../design/Typography';
import React from 'react';
import { external } from '../../styles/externalStyle';
import { commonStyles } from '../../styles/commonStyle';
import { useValues } from '@src/utils/context/index';
import { DetailContainerProps } from '../type';

export function DetailContainer({ title, value }: DetailContainerProps) {
  const { textColorStyle, viewRTLStyle, textRTLStyle, isDark } = useValues();

  return (
    <View style={[, external.js_space, external.ai_center, { flexDirection: viewRTLStyle, gap:12,paddingVertical:3,alignItems:"flex-start" }]}>
      <Text style={[commonStyles.regularText, { textAlign: textRTLStyle,color:isDark?"#BBC1CA":"#656C76",flex:1,minWidth:0,lineHeight:21 }]}>{title}</Text>
      <Text style={[commonStyles.regularText, { color: textColorStyle, textAlign: textRTLStyle,flexShrink:1,maxWidth:"55%",lineHeight:21 }]}>
        {value}
      </Text>
    </View>
  );
};
