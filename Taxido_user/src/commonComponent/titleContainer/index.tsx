import {View} from 'react-native';
import {Text} from '../../design/Typography';
import React from 'react';
import { commonStyles } from '../../styles/commonStyle';
import { useValues } from '@src/utils/context/index';
import { TitleProps } from '../type';

export function TitleContainer({ title }: TitleProps) {
  const { textColorStyle, textRTLStyle } = useValues();
  return (
    <View>
      <Text
        style={[
          commonStyles.mediumText23,
          { color: textColorStyle },
          { textAlign: textRTLStyle },
        ]}>
        {title}
      </Text>
    </View>
  );
};
