import {ReferenceScreen} from '../../../../design/ReferenceChrome';
import { ScrollView, View } from "react-native";
import React from "react";
import { HeaderContainer } from "@src/commonComponent";
import {RiderEmptyState} from '../../../../design/RiderEmptyState';
import { styles } from "./style";
import { useValues } from '@src/utils/context/index';
import { useSelector } from "react-redux";

import { Coupons } from "./component/coupons";
import { external } from "@src/styles/externalStyle";
import { CouponLoader } from "./couponLoader";

export function PromoCodeScreen({ route }) {
  const { bgFullStyle, linearColorStyle } = useValues();
  const { couponsList, loading } = useSelector((state: any) => state.coupon);
  const { translateData } = useSelector((state: any) => state.setting);

  return (
    <ReferenceScreen><View style={[[styles.container, { backgroundColor: linearColorStyle }], {backgroundColor:'transparent'}]}>
      <View style={[styles.headerContainer, { backgroundColor: bgFullStyle }]}>
        <HeaderContainer value={translateData.promoCodes} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{flexGrow: 1}}>
        <View style={[external.mh_10, external.mt_10]}>
          {loading ? (
            Array.from({ length: 2 }).map((_, index) => (
              <View key={index} style={styles.couponLoader}>
                <CouponLoader />
              </View>
            ))
          ) : (
            <Coupons couponsList={couponsList} route={route} />
          )}

        </View>
        {!loading && couponsList?.data?.length === 0 && <RiderEmptyState icon="tag" title={translateData.noCoupons || "No offers yet"} description={translateData.noCouponDes}/>}
      </ScrollView>
    </View></ReferenceScreen>
  );
}
