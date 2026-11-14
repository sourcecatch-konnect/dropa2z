import React,{useState} from 'react';
import {View,TouchableOpacity} from 'react-native';
import {Text} from '../../../design/Typography';
import {DesignIcon} from '../../../design/DesignIcon';
import {Coupons} from '../../../screens/bottomTab/profileTab/promoCode/component/coupons';
import {useValues} from '../../../utils/context';
import {useAppNavigation} from '../../../utils/navigation';
import {useDispatch,useSelector} from 'react-redux';
import {couponListData} from '../../../api/store/actions';
import {notificationHelper} from '../../../commonComponent';

export function TodayOfferContainer({couponsData,title,serviceId}:any){
  const {isDark}=useValues();
  const {translateData}=useSelector((state:any)=>state.setting);
  const navigation=useAppNavigation(),dispatch=useDispatch<any>();
  const [opening,setOpening]=useState(false);
  const items=Array.isArray(couponsData)?couponsData:Array.isArray(couponsData?.data)?couponsData.data:[];
  const ink=isDark?'#FFFFFF':'#17191C',muted=isDark?'#BCC2CA':'#646B75';
  const viewAll=async()=>{
    if(opening)return;setOpening(true);
    try{
      await dispatch(couponListData(serviceId?{service_id:serviceId}:undefined)).unwrap();
      navigation.navigate('PromoCodeScreen' as never);
    }catch(error:any){notificationHelper('',error?.message||'Could not load offers. Please try again.','error');}
    finally{setOpening(false);}
  };
  return <View style={{paddingHorizontal:16,paddingTop:18,paddingBottom:16}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:12}}>
      <View style={{flexDirection:'row',alignItems:'center',gap:8,flex:1}}><DesignIcon name="tag" width={22} height={22} color="#D17C00"/><Text style={{fontSize:20,fontWeight:'700',color:ink,flexShrink:1}}>{title||translateData?.trendingOffer||'Promos & coupons'}</Text></View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="View all promos and coupons" disabled={opening} onPress={viewAll} style={{minHeight:44,justifyContent:'center',paddingHorizontal:4}}><Text style={{color:isDark?'#FFBE60':'#A64B00',fontWeight:'700',fontSize:12}}>{opening?'Loading?':'View all'}</Text></TouchableOpacity>
    </View>
    {items.length>0?<Coupons couponsList={{data:items.slice(0,3)}}/>:<View style={{borderWidth:2,borderColor:isDark?'#737B86':'#B7BEC6',borderRadius:18,padding:18,flexDirection:'row',alignItems:'center',gap:12,backgroundColor:isDark?'#25282D':'#FFFFFF'}}><DesignIcon name="tag" width={26} height={26} color="#D17C00"/><View style={{flex:1}}><Text style={{color:ink,fontWeight:'700',fontSize:15}}>No offers available right now</Text><Text style={{color:muted,fontSize:12,lineHeight:18,marginTop:4}}>Available promotions and coupon codes will appear here.</Text></View></View>}
  </View>;
}
