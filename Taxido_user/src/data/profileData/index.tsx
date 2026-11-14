import {DesignIcon} from '../../design/DesignIcon';
import React from "react";
import { AppPages, HelpSupport, Location, PrivacyPolicIcon, ProfileSetting, PromoCode, Share } from "@utils/icons";
import { useSelector } from "react-redux";
import { View } from "react-native";
import ReferralId from "@src/assets/icons/referralID";

export const useProfileData = (staffUnread = 0) => {
  const { translateData, taxidoSettingData } = useSelector((state: any) => state.setting);

  const ChatWithStaffIcon = (
    <View>
      <HelpSupport />
      {staffUnread > 0 && (
        <View
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            width: 8,
            height: 8,
            borderRadius: 5,
            backgroundColor: "red",
          }}
        />
      )}
    </View>
  );
  return [
    {
      title: translateData?.general,
      data: [
        {
          icon: <ProfileSetting />,
          title: translateData?.profileSettings,
          screenName: "EditProfile",
        },
        {
          icon: <Location />,
          title: translateData?.savedLocation,
          screenName: "SavedLocation",
        },
        ...(taxidoSettingData?.cabbooking_values?.activation?.coupon_enable == 1
          ? [
            {
              icon: <PromoCode />,
              title: translateData?.promoCodeList,
              screenName: "PromoCodeScreen",
            },
          ]
          : []),
        ...(taxidoSettingData?.cabbooking_values?.activation?.referral_enable == 1
          ? [
            {
              icon: <ReferralId />,
              title:translateData?.erarnMoney,
              screenName: "ReferralID",
            },
          ]
          : []),
      ],
    },
    {
      title: translateData?.appDetails,
      data: [
        { icon: <DesignIcon name="file-text" color="#FC9F03"/>, title: "Terms of Service", screenName: "TermsOfService" },
        { icon: <PrivacyPolicIcon />, title: "Privacy Policy", screenName: "PrivacyPolicy" },
        {
          icon: <AppPages />,
          title: translateData?.appPages,
          screenName: "AppPageScreen",
        },
        {
          icon: <Share />,
          title: translateData?.shareApp,
          screenName: "Share",
        },
        {
          icon: ChatWithStaffIcon,
          title: translateData?.chatwithstaff,
          screenName: "ChatScreen",
        },
      ],
    },
  ];
};

export const useGuestData = () => {
  const { translateData } = useSelector((state: any) => state.setting);

  return [
    {
      title: translateData?.appDetails,
      data: [
        { icon: <DesignIcon name="file-text" color="#FC9F03"/>, title: "Terms of Service", screenName: "TermsOfService" },
        { icon: <PrivacyPolicIcon />, title: "Privacy Policy", screenName: "PrivacyPolicy" },
        {
          icon: <AppPages />,
          title: translateData?.appPages,
          screenName: "AppPageScreen",
        },
        {
          icon: <Share />,
          title: translateData?.shareApp,
          screenName: "Share",
        },
      ],
    },
  ];
};
