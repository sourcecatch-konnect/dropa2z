import {BrandLoader} from '../../../../design/BrandLogo';
import {VehicleGraphic} from '../../../../design/VehicleGraphic';
import {View} from 'react-native';
import {Text} from '../../../../design/Typography';
import React from "react";
import { useValues } from '@src/utils/context/index';
import styles from "../../styles";
import { appColors, windowHeight, windowWidth } from "@src/themes";
import { useSelector } from "react-redux";

export function TexiDetail({ otp, vehicleData, compact=false }: { otp: number|string, vehicleData: any, compact?:boolean }) {
  const { viewRTLStyle, textRTLStyle, isDark } = useValues();
  const { translateData } = useSelector((state) => state.setting);
  if(compact) return <View style={{gap:12,marginTop:10}}>
    <View style={{padding:12,borderRadius:12,backgroundColor:isDark?'#392C18':'#FFF3DF',gap:8}}>
      <Text style={{fontWeight:'700',color:isDark?'#FFF3E2':'#211C16'}}>Pickup PIN</Text>
      <Text style={{fontSize:25,letterSpacing:8,fontWeight:'700',color:isDark?'#FFF3E2':'#211C16'}}>{otp!=null&&String(otp).length?String(otp).padStart(4,'0'):'Not available'}</Text>
      <Text style={{fontSize:12,lineHeight:18,color:isDark?'#C8BCAB':'#6D6255'}}>Share this PIN with your delivery partner at pickup to start the delivery.</Text>
    </View>
  </View>;
  return (
    <>
      {otp ? (
        <View style={[styles.texiDetail]}>
          <View style={[styles.pinView, { alignItems: 'center' }]}>
            <View style={{ flexDirection: viewRTLStyle }}>
              {otp
                ? otp
                  .toString()
                  .split("")
                  ?.map((digit, index) => (
                    <Text key={index} style={styles.pin}>
                      {digit}
                    </Text>
                  ))
                : null}
            </View>

            <Text
              style={[
                styles.pinTitle,
                { color: appColors.regularText, textAlign: textRTLStyle },
              ]}
            >
              {translateData.pin}
            </Text>
          </View>
          <View style={styles.detailView}>
            <View style={{ height: windowHeight(40), width: windowWidth(100), backgroundColor: isDark ? appColors.darkHeader : appColors.lightGray, borderRadius: windowHeight(5), alignItems: 'center', justifyContent: 'center' }}>
              <VehicleGraphic source={{
  uri: vehicleData?.vehicle_type?.vehicle_image_url
}} style={{
  height: windowHeight(40),
  width: windowWidth(80),
  resizeMode: 'contain'
}} vehicle={vehicleData?.vehicle_type} />
            </View>
            <View style={{ marginHorizontal: windowWidth(10), height: windowHeight(40), justifyContent: 'center' }}>
              <Text
                style={[
                  styles.texiNo,
                  { color: isDark ? appColors.whiteColor : appColors.primaryText, textAlign: textRTLStyle },
                ]}
              >{vehicleData?.plate_number}
              </Text>
              <View style={{ flexDirection: 'row' }}>
                <Text style={[
                  styles.textName,
                  { color: appColors.regularText, textAlign: textRTLStyle },
                  { marginRight: windowWidth(4) }
                ]}>
                  {vehicleData?.vehicle_type?.color}
                </Text>
                <Text
                  style={[
                    styles.textName,
                    { color: appColors.regularText, textAlign: textRTLStyle },
                  ]}
                >
                  {vehicleData?.vehicle_model}
                </Text>
              </View>
            </View>
          </View>

        </View >
      ) : (
        <View style={[styles.loader, { flexDirection: viewRTLStyle }]}>
          <BrandLoader size="large" color={appColors.primary} />
        </View>
      )
      }
    </>
  );
}
