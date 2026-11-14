import {View, ScrollView} from 'react-native';
import {Text} from '../../../../design/Typography';
import React from "react";
import {DesignIcon} from '../../../../design/DesignIcon';
import styles from "./styles";
import { Receipt, PlusAmount, MinusAmount } from "@utils/icons";
import { appColors, windowHeight } from "@src/themes";
import { useValues } from '@src/utils/context/index';
import { useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";

interface DataItem {
  detail: string;
  type: "debit" | "credit";
  amount: number;
}

interface ListProps {
  dataList: DataItem[];
}

export function List({ dataList }: ListProps) {
  const { colors } = useTheme();
  const { viewRTLStyle, textRTLStyle, bgFullLayout, isDark } = useValues();
  const { zoneValue } = useSelector((state: any) => state.zone);

  return (
    <View
      style={[
        styles.dataView,
        { backgroundColor: bgFullLayout, borderColor: colors.border },
        { borderColor: isDark ? appColors.darkBorder : appColors.border }
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: windowHeight(1) }}>
        {dataList?.map((data, index) => (
          <View key={index}>
            <View style={[styles.list, { flexDirection: viewRTLStyle }]}>
              <View style={{ flexDirection: viewRTLStyle, flex: 1, minWidth: 0, alignItems: 'center' }}>
                <View
                  style={[
                    styles.receiptView,
                    styles.bgStyle,
                    {backgroundColor: isDark ? '#3B2B19' : '#FFF2DF'},
                  ]}
                >
                  <DesignIcon name="file-text" color={isDark ? '#FFBE60' : '#A64B00'} width={22} height={22}/>
                </View>
                <View style={styles.detailView}>
                  <Text
                    style={[styles.description, { textAlign: textRTLStyle }, { color: isDark ? appColors.lightGray : appColors.primaryText }]}
                  >
                    {data.detail}
                  </Text>
                </View>
              </View>

              <View style={[styles.amountView, { flexDirection: viewRTLStyle }]}>
                <View style={styles.icons}>
                  {data.type === "debit" ? <PlusAmount /> : <MinusAmount />}
                </View>
                <Text
                  style={[
                    styles.amount,
                    {
                      color:
                        data.type === "debit"
                          ? appColors.alertRed
                          : appColors.price,
                    },
                  ]}
                >
                  {zoneValue.currency_symbol}
                  {(zoneValue.exchange_rate * data.amount).toFixed(2)}
                </Text>
              </View>
            </View>

            {index !== dataList?.length - 1 && (
              <View
                style={[
                  styles.dash,
                  { borderColor: isDark ? appColors.darkBorder : appColors.border },
                ]}
              />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
