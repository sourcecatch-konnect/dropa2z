import {BrandLogo} from '../../../design/BrandLogo';
import {DeliveryArtwork} from '../../../design/DeliveryArtwork';
import { Image, SafeAreaView, View } from "react-native";
import React from "react";
import styles from "./style";
import { external } from "../../../styles/externalStyle";
import Images from "@utils/images";
import { windowHeight } from "@src/themes";
import { appColors } from "@src/themes";
import { useValues } from "@src/utils/context/index";
import { AuthContainerProps } from "../type";
import {useKeyboardState} from '../../../utils/useKeyboardState';

export function AuthContainer({ container, imageShow, keyboardVisible: suppliedKeyboardVisible }: AuthContainerProps) {
  const {visible}=useKeyboardState();
  const keyboardVisible=suppliedKeyboardVisible??visible;
  const { isDark, linearColorStyle, bgContainer } = useValues();
  const imageDark = isDark ? Images.authBgDark : Images.authBg;

  return (
    <SafeAreaView style={[external.fx_1, { backgroundColor: appColors.whiteColor }]}>
      <View style={{ height: keyboardVisible ? 0 : windowHeight(50), backgroundColor: isDark ? linearColorStyle : appColors.lightGray }}>
        {imageShow && !keyboardVisible && (
          <View style={[styles.img, {alignItems: "center", justifyContent: "center"}]}><BrandLogo light={isDark} size={34}/></View>
        )}
      </View>
      <View style={[styles.imageMainView, keyboardVisible && styles.imageMainViewKeyboard, { backgroundColor: isDark ? linearColorStyle : appColors.lightGray }]}>
        {!keyboardVisible && (
          <View style={styles.imageView}>
            <DeliveryArtwork height={180}/>
          </View>
        )}

        <View style={[styles.contentContainer, keyboardVisible && styles.contentContainerKeyboard]}>
          <View
            style={[styles.container, { backgroundColor: bgContainer }]}
          >
            <View>{container}</View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
