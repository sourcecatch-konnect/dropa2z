import React from 'react';
import {View, TouchableOpacity, StyleSheet, StatusBar, useColorScheme} from 'react-native';
import {Text} from './Typography';
import {Notifier} from 'react-native-notifier';
import {DesignIcon} from './DesignIcon';
import {notificationText} from '../utils/notificationPresentation';

export function DeliveryNotification({title,description,alertType='info',time,banner=false,dark}:{title?:any;description?:any;alertType?:string;time?:string;banner?:boolean;dark?:boolean}){
 const systemDark=useColorScheme()==='dark',isDark=dark??systemDark;
 const accent=alertType==='error'?'#D8342A':'#FC9F03';
 const icon=alertType==='error'?'circle-help':alertType==='success'?'shield-check':'package';
 const heading=notificationText(title)|| (alertType==='error'?'Please check':alertType==='success'?'Done':'Delivery update');
 const body=notificationText(description);
 return <View accessibilityRole={banner?'alert':undefined} accessibilityLiveRegion={banner?'polite':undefined} style={[styles.card,{backgroundColor:isDark?'#202422':'#FFFFFF',borderColor:isDark?'#37433B':'#E8EAE7'},banner&&{marginTop:Math.max(12,(StatusBar.currentHeight||24)+8),marginHorizontal:12,alignSelf:'center',width:'94%',maxWidth:520,elevation:6,shadowColor:'#000000',shadowOpacity:.14,shadowOffset:{width:0,height:4},shadowRadius:12}]}>
  <View style={[styles.icon,{backgroundColor:isDark?'#3B2A20':'#FFF1E8'}]}><DesignIcon name={icon as any} color={accent} width={24} height={24}/></View>
  <View style={{flex:1,minWidth:0}}><View style={styles.top}><Text style={{color:accent,fontSize:11,fontWeight:'800',letterSpacing:.6}}>DROPA2Z</Text>{!!time&&<Text style={{color:isDark?'#A9B5AE':'#758279',fontSize:11,flexShrink:1}}>{time}</Text>}</View><Text style={{color:isDark?'#FFFFFF':'#17191C',fontSize:16,fontWeight:'800',lineHeight:21,marginTop:3}}>{heading}</Text>{!!body&&<Text style={{color:isDark?'#C5CEC8':'#59685F',fontSize:14,lineHeight:20,marginTop:4}}>{body}</Text>}</View>
  {banner&&<TouchableOpacity accessibilityRole="button" accessibilityLabel="Dismiss notification" onPress={()=>Notifier.hideNotification()} hitSlop={12} style={{padding:4}}><Text style={{color:isDark?'#CBD2CD':'#656C76',fontSize:22,lineHeight:22}}>×</Text></TouchableOpacity>}
 </View>;
}
const styles=StyleSheet.create({card:{flexDirection:'row',alignItems:'flex-start',gap:12,padding:16,borderWidth:1,borderRadius:18},icon:{width:42,height:42,borderRadius:13,alignItems:'center',justifyContent:'center'},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8}});
