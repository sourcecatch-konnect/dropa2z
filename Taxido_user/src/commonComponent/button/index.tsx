import {BrandLoader} from '../../design/BrandLogo';
import {ActivityIndicator, TouchableOpacity} from 'react-native';
import {Text} from '../../design/Typography';
import React from "react";
import { commonStyles } from "../../styles/commonStyle";
import { styles } from "./styles";
import { appColors, fontSizes, windowHeight } from "@src/themes";
import { ButtonInterface } from "../type";
import {useReferenceTheme} from '../../design/ReferenceChrome';

export function Button({
  title,
  onPress,
  width,
  height,
  backgroundColor,
  textColor,
  loading,
  disabled,
}: ButtonInterface) {
  const visual = useReferenceTheme();
  const actionColor = visual.active && (!backgroundColor || backgroundColor === appColors.primary) ? visual.accent : backgroundColor || appColors.primary;
  const widthNumber = width || "100%";
  const heightNumber = height || 40;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{disabled:!!(disabled||loading),busy:!!loading}}
      activeOpacity={0.9}
      style={[
        styles.container,
        {
          width: widthNumber,
          height: visual.active ? height ? windowHeight(height) : undefined : windowHeight(heightNumber),
          minHeight:visual.active?46:undefined,
          paddingVertical:visual.active?10:undefined,
          backgroundColor:
            disabled || loading
              ? actionColor + "80"
              : actionColor,
        },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <BrandLoader
          size="large"
          color={textColor || (actionColor===appColors.primary||actionColor==='#FC9F03'?'#17191C':appColors.whiteColor)}
          style={{ alignSelf: "center" }}
        />
      ) : (
        <Text
          style={[
            commonStyles.extraBold,
            {
              color: textColor || (actionColor===appColors.primary||actionColor==='#FC9F03'?'#17191C':appColors.whiteColor),
              fontSize: fontSizes.FONT20,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
