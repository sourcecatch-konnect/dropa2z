import {DesignIcon} from '../../design/DesignIcon';
import React, { useCallback } from 'react'
import {Image, View} from 'react-native';
import {Text} from '../../design/Typography';
import styles from './styles'
import { useValues } from '../../utils/context'
import appColors from '../../theme/appColors'
import Images from '../../utils/images/images'
import { Button } from '../button'
import { windowHeight } from '../../theme/appConstant'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import { paymentsData } from '../../api/store/action'
import { AppDispatch } from '../../api/store'
import appFonts from '../../theme/appFonts'

export function LowBalance({ setLowBalance, low }: any) {
  const { translateData } = useSelector((state: any) => state.setting)
  const { isDark, viewRtlStyle } = useValues()
  const navigation = useNavigation<any>()
  const { zoneValue } = useSelector((state: any) => state.zoneUpdate)
  const { taxidoSettingData } = useSelector((state: any) => state.setting)
  const dispatch = useDispatch<AppDispatch>()
  useFocusEffect(
    useCallback(() => {
      dispatch(paymentsData())
    }, [dispatch]),
  )

  const colse = () => {
    setLowBalance(false)
  }

  const handeleTopUp = () => {
    setLowBalance(false)
    navigation.navigate('TopUp')
  }

  return (
    <View style={[styles.flex]}>
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? appColors.primaryFont : appColors.white },
        ]}
      >
        <View style={{width:72,height:72,borderRadius:24,backgroundColor:isDark?"#3B2B19":"#FFF2DF",alignItems:"center",justifyContent:"center",marginBottom:16}}><DesignIcon name="wallet" color={isDark?"#FFBE60":"#A64B00"} width={34} height={34}/></View>
        <Text
          style={[
            styles.title,
            {
              color: isDark ? appColors.white : appColors.black,
              fontFamily: appFonts.medium,
            },
          ]}
        >
          {low
            ? translateData?.lowBalance
            : translateData?.insufficientWalletBalance}
        </Text>
        <Text style={[styles.subText,{color:isDark?"#BBC1CA":"#656C76",lineHeight:22,textAlign:"center"}]}>
          {low
            ? translateData?.balanceNote
            : `A minimum account balance of ${zoneValue?.currency_symbol || '?'} ${taxidoSettingData?.cabbooking_values?.wallet?.driver_min_wallet_balance ?? 10} is required.`}
        </Text>

        <View
          style={{
            flexDirection: viewRtlStyle,
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginTop: windowHeight(2),
          }}
        >
          <View style={{ flex: 1 }}>
            <Button
              title={translateData?.cancel}
              backgroundColor={isDark ? appColors.bgDark : appColors.lightGray}
              onPress={colse}
              color={isDark ? appColors.white : appColors.black}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title={translateData?.topUp}
              backgroundColor={appColors.primary}
              color={appColors.white}
              onPress={handeleTopUp}
            />
          </View>
        </View>
      </View>
    </View>
  )
}
