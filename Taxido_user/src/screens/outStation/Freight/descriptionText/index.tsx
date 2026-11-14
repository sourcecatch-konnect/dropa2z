import {View} from 'react-native';
import {Text, TextInput} from '../../../../design/Typography';
import React, { useState } from 'react';
import {CardHeading} from '../../../../design/CardHeading';
import { commonStyles } from '../../../../styles/commonStyle';
import { appColors } from '@src/themes';
import { external } from '../../../../styles/externalStyle';
import { styles } from './styles';
import { useValues } from "@src/utils/context/index";
import { description, fiveBoxes } from '../../../../constant/index';

export function DescriptionText({ onTextChange }: { onTextChange: any }) {
  const { bgContainer, textColorStyle, textRTLStyle, isDark } = useValues();
  const [inputValue, setInputValue] = useState('');

  const handleTextChange = (text: string) => {
    setInputValue(text);
    onTextChange(text);
  };

  return (
    <View style={[external.mt_10]}>
      <CardHeading icon="file-text" title={description}/>
      <View style={[styles.container, { backgroundColor: bgContainer, borderColor: isDark ? appColors.darkBorder : appColors.border }]}>
        <TextInput
          multiline={true}
          autoFocus={false}
          placeholderTextColor={appColors.subtitle}
          style={[
            external.pv_10,
            external.ph_10,
            commonStyles.regularText,
            { textAlign: textRTLStyle, height: '100%', textAlignVertical: 'top' },
            { color: isDark ? appColors.darkText : appColors.blackColor },
          ]}
          placeholder={fiveBoxes}
          onChangeText={handleTextChange}
          value={inputValue}
        />
      </View>
    </View>
  );
};
