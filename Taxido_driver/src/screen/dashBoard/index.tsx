import {CardHeading} from '../../design/CardHeading';
import {DesignIcon} from '../../design/DesignIcon';
import {ReferenceScreen, ReferenceLogo, referenceSurfaces} from '../../design/ReferenceChrome';
import React, { useCallback, useEffect } from 'react'
import {AppState, View, TouchableOpacity, Image, ScrollView, BackHandler, useWindowDimensions} from 'react-native';
import {Text} from '../../design/Typography';
import appColors from '../../theme/appColors'
import { fontSizes, windowHeight, windowWidth } from '../../theme/appConstant'
import appFonts from '../../theme/appFonts'
import Icons from '../../utils/icons/icons'
import Svg, { G, Circle } from 'react-native-svg'
import Images from '../../utils/images/images'
import { useSelector, useDispatch } from 'react-redux'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useValues } from '../../utils/context'
import { notificationHelper } from '../../commonComponents'
import styles from './styles'
import { useAppNavigation } from '../../utils/navigation'

import { dashBoardData } from '../../api/store/action'
import { AppDispatch } from '../../api/store'

export function DashBoard() {
  const dispatch = useDispatch<AppDispatch>()
  const { zoneValue } = useSelector((state: any) => state.zoneUpdate)
  useFocusEffect(useCallback(() => {
    if (!zoneValue?.id) return
    let active = true
    let pending = false
    const refresh = async () => {
      if (!active || pending || AppState.currentState !== 'active') return
      pending = true
      try { await dispatch(dashBoardData({ unit: zoneValue.distance_type, zoneId: zoneValue.id, driver_id: '' } as any)).unwrap() }
      catch (_) {} finally { pending = false }
    }
    refresh()
    const timer = setInterval(refresh, 15000)
    return () => { active = false; clearInterval(timer) }
  }, [dispatch, zoneValue?.id, zoneValue?.distance_type]))
  const { dashBoardList } = useSelector((state: any) => state.dashboard);
  const {width:screenWidth}=useWindowDimensions()
  const size = Math.min(190,screenWidth*.48)
  const strokeWidth = windowHeight(2)
  const radius = (size - strokeWidth) / 2
  const cx = size / 2
  const cy = size / 2
  const total = Number(dashBoardList?.ride?.completed_rides || 0) + Number(dashBoardList?.ride?.pending_rides || 0) + Number(dashBoardList?.ride?.cancelled_rides || 0)
  const { navigate } = useAppNavigation()
  const { isDark, rtl } = useValues()
  const { translateData } = useSelector((state: any) => state.setting)

  const data = [
    { value: Number(dashBoardList?.ride?.completed_rides || 0), color: '#FC9F03', label: translateData.completed },
    { value: Number(dashBoardList?.ride?.pending_rides || 0), color: "#C18A29", label: translateData.pendingRide },
    { value: Number(dashBoardList?.ride?.cancelled_rides || 0), color: "#D64557", label: translateData.cancelled },
  ]

  let startAngle = -90

  const gotoDetails = () => {
    if (dashBoardList?.ride?.total_earnings > 0) {
      navigate('TotalEarnings')
    } else {
      notificationHelper("", translateData.earningNotYet, "success")
    }
  }
  const navigation = useNavigation<any>()
  useEffect(() => {
    const backAction = () => {
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const ink=isDark?'#FFFFFF':'#17191C', muted=isDark?'#BBC1CA':'#656C76', line=isDark?'#41464E':'#E5E7EB', accent=isDark?'#FFBE60':'#A64B00';
  const card={padding:18,borderRadius:22,borderWidth:1,borderColor:line,backgroundColor:isDark?'#25282D':'#FFFFFF'};
  return <ReferenceScreen><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding:20,paddingBottom:32,gap:18}}>
    <View style={{flexDirection:rtl?'row-reverse':'row',alignItems:'center',justifyContent:'space-between',gap:16}}>
      <ReferenceLogo driver width={150}/>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Notifications" onPress={()=>navigate('Notification')} style={{width:44,height:44,borderRadius:14,borderWidth:1,borderColor:line,alignItems:'center',justifyContent:'center'}}><DesignIcon name="bell" color={ink}/></TouchableOpacity>
    </View>
    <View><Text accessibilityRole="header" style={{fontSize:28,lineHeight:34,fontWeight:'700',color:ink}}>{translateData.dashboard || 'Dashboard'}</Text><Text style={{fontSize:15,lineHeight:22,color:muted,marginTop:5}}>Your deliveries, earnings and performance.</Text></View>
    <View style={card}>
      <CardHeading icon="package" title="Delivery Overview"/>
      <View style={{alignItems:'center'}}><View style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}>
        <Svg width={size} height={size} style={{position:'absolute'}}><Circle cx={cx} cy={cy} r={radius} stroke={line} strokeWidth={strokeWidth} fill="none"/><G>{data.filter(item=>item.value>0).map((item,index)=>{
          const angle=total>0?item.value/total*360:0;
          const arc=<Circle key={index} cx={cx} cy={cy} r={radius} stroke={item.color} strokeWidth={strokeWidth} fill="none" strokeDasharray={[(angle/360)*2*Math.PI*radius,2*Math.PI*radius]} strokeLinecap="round" rotation={startAngle} origin={cx+','+cy}/>;
          startAngle+=angle;return arc;
        })}</G></Svg>
        <Text style={{fontSize:13,color:muted}}>Total Deliveries</Text><Text style={{fontSize:36,lineHeight:43,fontWeight:'700',color:ink}}>{total}</Text>
      </View></View>
      <View style={{flexDirection:rtl?'row-reverse':'row',marginTop:20,gap:8}}>{data.map(item=><View key={item.label} style={{flex:1,minWidth:0,alignItems:'center'}}><View style={{width:20,height:4,borderRadius:2,backgroundColor:item.color,marginBottom:8}}/><Text style={{fontSize:12,color:muted,textAlign:'center'}}>{item.label}</Text><Text style={{fontSize:19,fontWeight:'700',color:ink,marginTop:5}}>{item.value}</Text></View>)}</View>
    </View>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Total Earnings" onPress={gotoDetails} style={[card,{backgroundColor:'#17191C',borderColor:'#41464E'}]}>
      <View style={{flexDirection:rtl?'row-reverse':'row',alignItems:'center',gap:14}}><View style={{width:48,height:48,borderRadius:16,backgroundColor:'#3B2B19',alignItems:'center',justifyContent:'center'}}><DesignIcon name="wallet" color="#FFBE60"/></View><View style={{flex:1}}><Text style={{fontSize:15,color:'#BBC1CA'}}>{translateData.totalEarning || 'Total Earnings'}</Text><Text style={{fontSize:27,fontWeight:'700',color:'#FFFFFF',marginTop:5}}>{dashBoardList?.ride?.total_earnings || 0}</Text></View><DesignIcon name="arrow-right" color="#FFBE60"/></View>
    </TouchableOpacity>
    <CardHeading icon="navigation" title={translateData.drivePerformance || 'Delivery Performance'}/>
    <View style={{flexDirection:rtl?'row-reverse':'row',gap:12}}>{[
      {icon:'navigation',value:dashBoardList?.driver_performance?.average_distance || 0,unit:dashBoardList?.driver_performance?.unit || 'Km',label:translateData.averageDistances || 'Average Distance'},
      {icon:'history',value:dashBoardList?.driver_performance?.average_hours || '0 Hr',unit:'',label:translateData.averageHours || 'Average Hours'},
    ].map(item=><View key={item.label} style={[card,{padding:15,flex:1,minWidth:0}]}><DesignIcon name={item.icon as any} color={accent}/><Text style={{fontSize:23,lineHeight:29,fontWeight:'700',color:ink,marginTop:12}}>{item.value} {item.unit}</Text><Text style={{fontSize:13,lineHeight:18,color:muted,marginTop:7}}>{item.label}</Text></View>)}</View>
  </ScrollView></ReferenceScreen>;
}
