import {VehicleGraphic} from '../../../../design/VehicleGraphic';
import React,{useCallback,useState} from "react";
import {TouchableOpacity,View,useWindowDimensions} from 'react-native';
import {GET_API} from '../../../../api/methods';
import {DesignIcon} from '../../../../design/DesignIcon';
import {Text} from '../../../../design/Typography';
import { useDispatch, useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { serviceDataGet } from "@src/api/store/actions";
import { AppDispatch } from "@src/api/store";
import { useAppNavigation } from "@src/utils/navigation";
import { useValues } from "@src/utils/context";
import Images from "@src/utils/images";
import { appColors, windowHeight } from "@src/themes";
import { getGoodsServiceOptions, GoodsServiceType } from "@src/utils/goodsServiceOptions";
import {referenceSurfaces} from '../../../../design/ReferenceChrome';

const sections: Array<{ type: GoodsServiceType; title: string; subtitle: string }> = [
  { type: "parcel", title: "Parcel", subtitle: "Send a package to someone" },
];

export function CategoryDetail() {
  const dispatch = useDispatch<AppDispatch>();
  useFocusEffect(useCallback(() => { dispatch(serviceDataGet()); }, [dispatch]));
  const { navigate } = useAppNavigation();
  const { serviceData } = useSelector((state: any) => state.service);
  const { bgFullStyle, isDark } = useValues();
  const {width,fontScale}=useWindowDimensions();
  const zoneId=useSelector((state:any)=>state.zone.zoneValue?.data?.[0]?.id ?? state.zone.zoneValue?.id);
  const [cards,setCards]=useState<any>({});
  useFocusEffect(useCallback(()=>{
    let alive=true;
    void GET_API('delivery/service-cards',{params:zoneId?{zone_id:zoneId}:undefined}).then(response=>{
      if(alive&&response?.status===200)setCards(response.data?.data||{});
    }).catch(()=>{if(alive)setCards({});});
    return()=>{alive=false;};
  },[zoneId]));
  const columns=fontScale>=1.5?1:2;
  const size=Math.min(260,(width-32-(columns-1)*12)/columns);
  const ink=isDark?'#FFFFFF':'#17191C',muted=isDark?'#C3C8D0':'#616873';
  const options = getGoodsServiceOptions(serviceData?.data);

  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
      {sections.map(section => (
        <View key={section.type} style={{ marginBottom: 24 }}>
          <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:4}}><View style={{width:4,height:24,borderRadius:2,backgroundColor:appColors.primary}}/><Text accessibilityRole="header" style={{flex:1, color: isDark ? appColors.whiteColor : appColors.primaryText, fontSize: 22, fontWeight: "700" }}>
            {section.title}
          </Text><View style={{paddingHorizontal:10,paddingVertical:4,borderRadius:12,backgroundColor:isDark?'#3B2B19':'#FFF5E5'}}><Text style={{color:isDark?'#FFBE60':'#A65B00',fontSize:12}}>{options.filter(option=>option.serviceType===section.type).length} options</Text></View></View>
          <Text style={{ color: isDark ? "#BBC1CA" : appColors.regularText, marginBottom: 10 }}>
            {section.subtitle}
          </Text>
          <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:12}}>
          {options.filter(option=>option.serviceType===section.type).map(option=>{
            const profile=cards[option.vehicleKind],rate=Number(profile?.per_km);
            const weight=profile?.max_weight_kg||(option.vehicleKind==='bike'?20:90);
            return <TouchableOpacity key={option.key} accessibilityRole="button" accessibilityLabel={`${option.title}, ${Number.isFinite(rate)&&rate>0?'\u20B9'+rate+' per km':'fare shown before booking'}, up to ${weight} kilograms`}
              activeOpacity={0.85} onPress={()=>navigate('Delivery',{
                service_ID:option.serviceId,service_name:option.serviceType,service_category_ID:option.categoryId,
                service_category_slug:option.categorySlug,preferredVehicleKind:option.vehicleKind,
              })}
              style={[referenceSurfaces.card,{width:size,aspectRatio:fontScale>1.1||width<360?undefined:1,minHeight:size,
                borderWidth:2,borderRadius:20,padding:12,backgroundColor:isDark?'#25282D':option.vehicleKind==='bike'?'#FFF6E6':'#F4F6F8',borderColor:isDark?'#737B86':'#B7BEC6',justifyContent:'space-between',gap:4}]}>
              <VehicleGraphic source={option.vehicleKind==='bike'?Images.bike:Images.autoRickshaw} kind={option.vehicleKind} style={{width:'100%',height:48,alignSelf:'center'}} resizeMode="contain"/>
              <View style={{gap:4}}>
                <Text style={{fontSize:16,lineHeight:19,fontWeight:'700',color:ink}}>{option.title}</Text>
                <Text style={{fontSize:Number.isFinite(rate)&&rate>0?23:13,lineHeight:27,fontWeight:'700',color:isDark?'#FFBE60':'#D76800'}}>{Number.isFinite(rate)&&rate>0?`\u20B9${rate}/km`:'See fare before booking'}</Text>
                <View style={{flexDirection:'row',alignItems:'center',gap:4}}><DesignIcon name="package" color={muted} width={14} height={14}/><Text style={{color:ink,fontSize:12,lineHeight:15,fontWeight:'700'}}>Up to {weight} kg</Text></View>
                <View style={{flexDirection:'row',alignItems:'center',gap:4}}><DesignIcon name="history" color={muted} width={12} height={12}/><Text style={{flex:1,color:muted,fontSize:10,lineHeight:13}}>ETA after route selection</Text></View>
              </View>
            </TouchableOpacity>;
          })}
          </View>
          {!!options.some(option=>option.serviceType===section.type)&&<Text style={{color:muted,fontSize:11,lineHeight:16,marginTop:12}}>Distance rates shown. Base fare and other charges may apply.</Text>}
          {!options.some(option => option.serviceType === section.type) && (
            <Text style={{ color: appColors.regularText, paddingVertical: 10 }}>
              This service is not available in your area yet.
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}
