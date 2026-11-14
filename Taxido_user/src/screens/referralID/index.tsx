import {ReferenceScreen} from '../../design/ReferenceChrome';
import { Header } from "@src/commonComponent";
import React from "react";
import {CardHeading} from "../../design/CardHeading";
import {DesignIcon} from "../../design/DesignIcon";
import {Image, View, TouchableOpacity, ScrollView, Share, Linking} from 'react-native';
import {Text} from '../../design/Typography';
import styles from "./style";
import { useValues } from "@src/utils/context";
import Images from "@src/utils/images";
import { appColors, appFonts, fontSizes, windowHeight } from "@src/themes";
import { Copy } from "@src/utils/icons";
import { useAppNavigation } from "@src/utils/navigation";
import { useDispatch, useSelector } from "react-redux";
import { referralData } from "@src/api/store/actions";
import Clipboard from "@react-native-clipboard/clipboard";

export function ReferralID() {
  const { viewRTLStyle, isDark, isRTL } = useValues();
  const { self } = useSelector((state: any) => state.account);
  const { taxidoSettingData, translateData } = useSelector(
    (state: any) => state.setting,
  );
  const { navigate }: any = useAppNavigation();
  const dispatch = useDispatch();

  const Workdata = [
    { data: `${translateData.referral1}` },
    {
      data: `${translateData.referralEarn} ${taxidoSettingData?.cabbooking_values?.referral?.referrer_bonus_percentage}% ${translateData.referral2}`,
    },
    { data: `${translateData.referral3}` },
  ];

  const gotoList = () => {
    dispatch(referralData());
    navigate("ReferralList");
  };

  const handleShareReferral = async () => {
    try {
      const referralCode = self?.referral_code || "Code Note Found";
      const message = `🚖 ${translateData.referralShare1} *DropA2Z*! ${translateData.referralShare2}: *${referralCode}* ${translateData.referralShare3}.\n\n${translateData.referralShare4} 🚕\n👉 https://play.google.com/store/apps/details?id=com.dropa2z.rider&hl=en_IN`;

      await Share.share({
        message,
        title: `${translateData.referralInvite}`,
      });
    } catch (error) {
      console.error("❌ Error sharing referral:", error);
    }
  };

  const handlePress = () => {
    const url = taxidoSettingData?.cabbooking_values?.setting?.rider_privacy_policy;
    Linking.openURL(url).catch(err =>
      console.error("Failed to open URL:", err),
    );
  };

  return (
    <ReferenceScreen><View
      style={[{
        backgroundColor: isDark ? appColors.primaryText : appColors.lightGray,
        flex: 1,
      }, {backgroundColor:'transparent'}]}>
      <Header value={translateData.referralCodeTitle} />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: windowHeight(60),
          paddingTop: windowHeight(10),
        }}>
        <View style={{marginHorizontal:20,padding:22,borderRadius:24,backgroundColor:'#17191C',marginBottom:20}}>
 <View style={{width:52,height:52,borderRadius:17,backgroundColor:'#3B2B19',alignItems:'center',justifyContent:'center',marginBottom:16}}><DesignIcon name="tag" color="#FFBE60" width={28} height={28}/></View>
 <Text style={{color:'#FFFFFF',fontSize:22,lineHeight:29,fontWeight:'700'}}>{translateData.earn} {taxidoSettingData?.cabbooking_values?.referral?.referral_amount} {translateData.referralDetails}</Text>
 <TouchableOpacity accessibilityRole="button" accessibilityLabel="Copy referral code" onPress={()=>Clipboard.setString(self?.referral_code || '')} style={{minHeight:52,marginTop:20,padding:14,borderRadius:14,backgroundColor:'#FFF2DF',flexDirection:viewRTLStyle,alignItems:'center',justifyContent:'space-between',gap:12}}><Text style={{fontSize:20,color:'#A64B00',fontWeight:'700',flexShrink:1}}>{self?.referral_code}</Text><DesignIcon name="file-text" color="#A64B00" width={22}/></TouchableOpacity></View>

        <View
          style={[
            styles.box,
            {
              borderColor: isDark ? appColors.darkBorder : appColors.border,
            },
            {
              backgroundColor: isDark ? appColors.bgDark : appColors.whiteColor,
            },
          ]}>
          <View
            style={[
              { flexDirection: viewRTLStyle },
              {
                justifyContent: "space-between",
                alignItems: "center",
              },
            ]}>
            <View style={{flex:1}}><CardHeading icon="circle-help" title={translateData.referralWork}/></View>
            <Text style={[styles.trems]} onPress={handlePress}>
              {/* {translateData.referralCondition} */}
            </Text>
          </View>

          <View style={{ marginTop: windowHeight(10) }}>
            {Workdata.map((item, id) => (
              <View
                key={id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginVertical: windowHeight(4),
                }}>
                <Text
                  style={{
                    fontFamily: appFonts.semiBold,
                    fontSize: fontSizes.FONT17, flexShrink:1, lineHeight:22,
                    color: isDark ? appColors.whiteColor : appColors.blackColor,
                    marginRight: isRTL ? 0 : 8,
                    marginLeft: isRTL ? 8 : 0,
                  }}>
                  {id + 1}.
                </Text>
                <Text
                  style={{
                    fontFamily: appFonts.regular,
                    fontSize: fontSizes.FONT17, flex:1, lineHeight:23,
                    color: isDark ? appColors.whiteColor : appColors.blackColor,
                  }}>
                  {item?.data}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={[styles.note,{color:isDark?"#BBC1CA":"#656C76"}]}>
          <Text style={{ fontFamily: appFonts.bold }}>
            {translateData.noteTitle}:{" "}
          </Text>
          {translateData.referralNoteData}
        </Text>
        <View style={{marginHorizontal:20,padding:20,borderRadius:22,backgroundColor:isDark?'#202422':'#FFFFFF',borderWidth:1,borderColor:isDark?'#3B403D':'#E5E7EB'}}>
 <CardHeading icon="user-round" title={translateData.referralCard1 || 'Your referrals'} subtitle={translateData.referralCard2}/>
 <TouchableOpacity accessibilityRole="button" accessibilityLabel="View all referrals" onPress={gotoList} style={{minHeight:48,borderRadius:14,backgroundColor:'#FFF2DF',alignItems:'center',justifyContent:'center',flexDirection:viewRTLStyle,gap:8}}><Text style={{color:'#A64B00',fontWeight:'700'}}>{translateData.viewAll}</Text><DesignIcon name="arrow-right" color="#A64B00" width={18}/></TouchableOpacity></View>
      </ScrollView>

      <TouchableOpacity
        onPress={handleShareReferral}
        style={{
          backgroundColor: appColors.primary,
          paddingVertical: windowHeight(13),
          alignItems: "center",
          justifyContent: "center",
          borderRadius: windowHeight(5),
          margin: windowHeight(15),
        }}>
        <Text
          style={{
            color: appColors.whiteColor,
            fontFamily: appFonts.bold,
            fontSize: fontSizes.FONT18,
          }}>
          {translateData.shareReferral}
        </Text>
      </TouchableOpacity>
    </View></ReferenceScreen>
  );
}
