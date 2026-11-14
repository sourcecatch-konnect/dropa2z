import React from "react";
import {View} from 'react-native';
import {Text} from '../../design/Typography';
import { commonStyles } from "../../styles/commonStyle";
import { external } from "../../styles/externalStyle";
import { IconBackground } from "../iconBackground/index";
import { Notification, Wallet } from "@utils/icons";
import { useValues } from '@src/utils/context/index';
import { getValue, setValue } from "@src/utils/localstorage";
import { useSelector } from "react-redux";
import { useAppNavigation } from "@src/utils/navigation";
import { appColors, windowHeight } from "@src/themes";
import { HeaderTabProps } from "../type";
import {ReferenceLogo} from '../../design/ReferenceChrome';

export function HeaderTab({ tabName }: HeaderTabProps) {
  const { textColorStyle, linearColorStyleTwo, iconColorStyle, viewRTLStyle, textRTLStyle, isDark } = useValues();
  const { navigate, replace } = useAppNavigation();

  const gotoWallet = async () => {
    let token: string | null = null;
    await getValue("token").then(function (value) {
      token = value;
    });
    if (token) {
      navigate("Wallet");
    } else {
      let screenName = "Wallet";
      await setValue("CountinueScreen", screenName);
      replace("SignIn");
    }
  };

  const gotoNotification = () => {
    navigate("Notifications")
  }

  return (
    <View style={{paddingTop:12,paddingBottom:12,backgroundColor:isDark?'#17191C':'#FFFFFF',borderBottomLeftRadius:24,borderBottomRightRadius:24}}>
    <View style={{alignItems:'center',paddingBottom:8}}><ReferenceLogo width={130}/></View>
    <View
      style={[
        external.fd_row,
        external.ai_center,
        external.ph_20,
        {
          flexDirection: viewRTLStyle, minHeight:52,
        },
      ]}
    >
      <Text
        accessibilityRole="header"
        style={[
          commonStyles.mediumText23,
          external.fg_1,
          { color: textColorStyle, fontSize:24,fontWeight:'700' },
          { textAlign: textRTLStyle },
        ]}
      >
        {tabName}
      </Text>
      <View style={[external.mh_10]}>
        <IconBackground
          icon={<Notification colors={iconColorStyle} />}
          backgroundColor={linearColorStyleTwo}
          borderColor={isDark ? appColors.darkBorder : appColors.border}
          onPress={gotoNotification}
        />
      </View>
      <IconBackground
        icon={<Wallet colors={iconColorStyle} />}
        backgroundColor={linearColorStyleTwo}
        borderColor={isDark ? appColors.darkBorder : appColors.border}
        onPress={gotoWallet}
      />
    </View>
    </View>
  );
}
