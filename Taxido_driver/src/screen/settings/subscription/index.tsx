import React, {useMemo} from 'react';
import {View, ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import {Text} from '../../../design/Typography';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {Header} from '../../../commonComponents';
import {useValues} from '../../../utils/context';
import {ReferenceScreen, referenceSurfaces} from '../../../design/ReferenceChrome';
import {CardHeading} from '../../../design/CardHeading';

export function Subscription() {
  const {planData, translateData:t} = useSelector((state:any)=>state.setting);
  const {zoneValue} = useSelector((state:any)=>state.zoneUpdate);
  const {selfDriver} = useSelector((state:any)=>state.account);
  const {isDark,viewRtlStyle} = useValues();
  const navigation=useNavigation<any>();
  const plans=useMemo(()=>Array.isArray(planData?.data)?[...planData.data].sort((a,b)=>Number(a.price)-Number(b.price)):[],[planData]);
  const ink=isDark?'#FFFFFF':'#17191C', surface=isDark?'#25282D':'#FFFFFF', muted=isDark?'#BBC1CA':'#656C76', accent=isDark?'#FFBE60':'#A64B00';
  const exchange=Number(zoneValue?.exchange_rate)>0?Number(zoneValue.exchange_rate):1;
  return <ReferenceScreen>
    <Header title={t?.planDetails || 'Subscription plans'}/>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <CardHeading icon="wallet" title={t?.subscriptionTitle || 'Choose your plan'} subtitle={t?.subscriptionMsg}/>
      {plans.map(plan=>{
        const current=Number(selfDriver?.subscription?.is_active)===1 && String(selfDriver.subscription.plan_id)===String(plan.id);
        const validPrice=Number.isFinite(Number(plan.price)) && Number(plan.price)>=0;
        const features=Array.isArray(plan.description)?plan.description:typeof plan.description==='string'?[plan.description]:[];
        return <View key={plan.id} style={[styles.card,{backgroundColor:surface,borderColor:current?'#FC9F03':isDark?'#41464E':'#E5E7EB'}]}>
          <View style={{flexDirection:viewRtlStyle,alignItems:'center',justifyContent:'space-between',gap:12}}>
            <Text style={[styles.planName,{color:ink}]}>{plan.name}</Text>
            {current && <Text style={[styles.current,{color:accent,backgroundColor:isDark?'#3A2A14':'#FFF5E5'}]}>{t?.currentPlan || 'Current plan'}</Text>}
          </View>
          <View style={{flexDirection:viewRtlStyle,alignItems:'baseline',gap:6,marginVertical:12}}>
            <Text style={[styles.price,{color:ink}]}>{validPrice?`${zoneValue?.currency_symbol || '₹'}${(exchange*Number(plan.price)).toFixed(2)}`:'Price unavailable'}</Text>
            {validPrice && <Text style={[styles.description,{color:muted}]}>/ {t?.month || 'month'}</Text>}
          </View>
          {features.map((feature:any,index:number)=><View key={index} style={{flexDirection:viewRtlStyle,gap:10,marginBottom:10}}>
            <Text style={{color:accent}}>✓</Text><Text style={{color:ink,flex:1,lineHeight:21}}>{String(feature)}</Text>
          </View>)}
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${current?'Current plan':'Select plan'} ${plan.name}`} accessibilityState={{disabled:current||!validPrice}} disabled={current||!validPrice}
            onPress={()=>navigation.navigate('PaymentSelect',{planId:plan.id})}
            style={[styles.select,{backgroundColor:current?(isDark?'#3A2A14':'#FFF5E5'):'#FC9F03',opacity:validPrice?1:.5}]}>
            <Text style={{fontWeight:'700',color:current?accent:'#17191C'}}>{current?t?.currentPlan || 'Current plan':t?.selectPlan || 'Select plan'}</Text>
          </TouchableOpacity>
        </View>;
      })}
      {!plans.length && <View style={[styles.card,{backgroundColor:surface}]}><Text style={{color:ink}}>No subscription plans are available right now.</Text></View>}
      {!!t?.subscriptionNote && <Text style={[styles.description,{color:muted}]}>{t.subscriptionNote}</Text>}
    </ScrollView>
  </ReferenceScreen>;
}
const styles=StyleSheet.create({content:{padding:20,paddingBottom:40},heading:{fontSize:24,fontWeight:'700',marginBottom:8},description:{fontSize:13,color:'#68717A',lineHeight:20,marginBottom:12},card:{...referenceSurfaces.card,padding:20,marginTop:12},planName:{fontSize:19,fontWeight:'700',flex:1},current:{fontSize:12,color:'#00BE72',backgroundColor:'#E8FFF6',padding:8,borderRadius:8},price:{fontSize:30,fontWeight:'700',flexShrink:1},select:{minHeight:46,borderRadius:10,alignItems:'center',justifyContent:'center',marginTop:10,paddingHorizontal:12}});
