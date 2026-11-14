import {View, Image, TouchableOpacity, Platform, Alert} from 'react-native';
import {Text} from '../../../../design/Typography';
import React, { useState } from "react";
import Images from "@utils/images";
import styles from "./styles";
import { useAppNavigation } from "@src/utils/navigation";
import { useSelector } from "react-redux";
import { appColors, appFonts, fontSizes, windowHeight, windowWidth } from "@src/themes";
import { WalletEye } from "@src/assets/icons/walletEye";
import { Gift, TopUp } from "@src/utils/icons";
import { WalletEyeClose } from "@src/assets/icons/walletEyeClose";
import {BrandSymbol} from '../../../../design/BrandLogo';
import {useValues} from '../../../../utils/context';

interface BalanceTopupProps {
  balance: number | any;
}

export function BalanceTopup({ balance }: BalanceTopupProps) {
  const {isDark} = useValues();
  const { navigate } = useAppNavigation();
  const { translateData } = useSelector((state: any) => state.setting);
  const { zoneValue } = useSelector((state: any) => state.zone);
  const [isVisible, setIsVisible] = useState(true);
  const rawAmount = `${zoneValue.currency_symbol}${((balance ?? 0)).toFixed(2)}`;

  const maskNumber = (amount: string): string => {
    const numericPart = amount.replace(/[^0-9.]/g, "");
    const masked = numericPart.replace(/[0-9]/g, "*");
    return `${zoneValue.currency_symbol}${masked}`;
  };

  const maskedAmount = maskNumber(rawAmount);
  const gotoTopUp = () => {
    navigate("TopUpWallet");
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <View style={[styles.mainBalance, {borderColor: isDark ? '#41464E' : '#E5E7EB'}]}>
      <View pointerEvents="none" style={{position:'absolute',right:-35,top:-50,width:210,height:210,borderRadius:105,borderWidth:28,borderColor:'#FC9F0324'}}/>
      <View pointerEvents="none" style={{position:'absolute',right:20,top:20,opacity:.2}}><BrandSymbol size={56} color="#FC9F03"/></View>
      <View style={[styles.subBalance]}>
        <View style={{ marginHorizontal: windowWidth(18) }}>
          <View style={styles.balanceView}>
            <Text style={styles.balanceTitle}>Available Balance</Text>
          </View>
          <View
            style={{
              borderBottomWidth: 1,
              borderStyle: Platform.OS === 'ios' ? 'solid' : "dashed",
              width: "100%",
              borderColor: "#BF9881",
            }}
          />
          <View
            style={{
              flexDirection: "row",
              marginVertical: windowHeight(15),
              alignItems: "center",
            }}>
            <Text
              style={[
                styles.totalBalance,
                {
                  fontVariant: ["tabular-nums"],
                  textAlign: "center",
                },
              ]}>
              {isVisible ? rawAmount : maskedAmount}
            </Text>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={isVisible?'Hide wallet balance':'Show wallet balance'}
              onPress={() => setIsVisible(prev => !prev)}
              style={{
                marginHorizontal: windowWidth(10),
                alignItems: "center",
                justifyContent: "center",
                minWidth:44,minHeight:44,
              }}>
              {isVisible ? <WalletEye /> : <WalletEyeClose />}
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={gotoTopUp}
              style={{
                backgroundColor: isDark ? '#3B2B19' : appColors.whiteColor,
                minHeight:44,
                width: "47.5%",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: windowHeight(5),
              }}>
              <TopUp />
              <Text
                style={{
                  color: isDark ? '#FFBE60' : '#A64B00',
                  marginHorizontal: windowWidth(8),
                  fontFamily: appFonts.medium,
                }}>
                {translateData.topUp}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Gift cards, coming soon"
              onPress={() => Alert.alert('Gift cards', 'Gift cards are not available yet. You can use Top Up to add money to your wallet.')}
              style={{
                backgroundColor: isDark ? '#3B2B19' : appColors.whiteColor,
                minHeight:44,
                width: "47.5%",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: windowHeight(5),
                position: "relative",
              }}>
              <Image
                source={Images.soon}
                style={{
                  position: "absolute",
                  top: windowHeight(-3),
                  right: windowWidth(-4),
                  width: windowHeight(30),
                  height: windowHeight(32),
                  resizeMode: "contain",
                }}
              />

              <Gift />
              <Text
                style={{
                  color: isDark ? '#FFBE60' : '#A64B00',
                  marginHorizontal: windowWidth(8),
                  fontFamily: appFonts.medium,
                }}>
                {translateData.giftCard}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Text
        style={{
          color: "#FFE6BC",
          fontFamily: appFonts.regular,
          fontSize: fontSizes.FONT19,
          textAlign: "center",
          marginTop: windowHeight(6.5),
        }}>
        {translateData.balanceasof} {formattedDate}{" "}
      </Text>
    </View>
  );
}
