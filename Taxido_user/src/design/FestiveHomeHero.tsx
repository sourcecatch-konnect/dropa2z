import React from 'react';
import {View, TouchableOpacity, StyleSheet, Image, useWindowDimensions} from 'react-native';
import {Text} from './Typography';
import {useIsFocused} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {useAppNavigation} from '../utils/navigation';
import {getValue,setValue} from '../utils/localstorage';
import {ProfileContainer} from '../components/homeScreen/headerContainer/profileContainer';
import {ReferenceIcon} from './ReferenceChrome';
import {BrandLogo} from './BrandLogo';
import {brand} from './tokens';
import {HomeBannerCarousel} from './HomeBannerCarousel';
import {useValues} from '../utils/context';
export function FestiveHomeHero({paused=false}:{paused?:boolean}){
 const {width}=useWindowDimensions(),focused=useIsFocused();
 const {isDark}=useValues(),ink=isDark?"#FFFFFF":brand.ink;
 const {navigate,replace}=useAppNavigation();const {self}=useSelector((s:any)=>s.account);
 const wallet=async()=>{if(await getValue('token'))navigate('Wallet');else{await setValue('CountinueScreen','Wallet');replace('SignIn');}};
 const profile=async()=>{if(await getValue('token'))navigate('EditProfile');else replace('SignIn');};
 const bannerHeight=width*(600/1320)+28;
 return <View style={[styles.hero,{backgroundColor:isDark?"#17191C":"#FFFFFF"}]}>
  <View style={styles.top}><BrandLogo width={Math.min(158,width*.4)} animated={focused}/><View style={styles.actions}>
   <TouchableOpacity accessibilityRole="button" accessibilityLabel="Notifications" onPress={()=>navigate('Notifications')} hitSlop={4} style={[styles.action,{backgroundColor:isDark?"#25282D":"#F5F5F4"}]}><ReferenceIcon name="bell" color={ink} size={23}/></TouchableOpacity>
   <TouchableOpacity accessibilityRole="button" accessibilityLabel="Wallet" onPress={wallet} hitSlop={4} style={[styles.action,{backgroundColor:isDark?"#25282D":"#F5F5F4"}]}><ReferenceIcon name="wallet" color={ink} size={23}/></TouchableOpacity>
   <TouchableOpacity accessibilityRole="button" accessibilityLabel="My profile" onPress={profile} style={styles.avatar}>{self?.profile_image_url?<Image source={{uri:self.profile_image_url}} style={styles.avatarImage}/>:<Text style={styles.initial}>{self?.name?.charAt(0)?.toUpperCase()||'G'}</Text>}</TouchableOpacity>
  </View></View>
  <View style={{marginTop:8,marginBottom:12,marginHorizontal:18}}><ProfileContainer compact darkText={!isDark}/></View>
  <View pointerEvents={paused?'none':'auto'} style={{height:paused?0:bannerHeight,overflow:'hidden',opacity:paused?0:1}}><HomeBannerCarousel width={width} height={bannerHeight} focused={focused&&!paused} dark={isDark}/></View>
 </View>;
}
const styles=StyleSheet.create({hero:{width:'100%',paddingHorizontal:0,paddingTop:12,overflow:'hidden',backgroundColor:'#FFFFFF'},top:{marginHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},actions:{flexDirection:'row',gap:8,alignItems:'center'},action:{height:38,width:38,borderRadius:12,backgroundColor:'#F5F5F4',alignItems:'center',justifyContent:'center'},avatar:{height:38,width:38,borderRadius:22,backgroundColor:'#EAF5ED',alignItems:'center',justifyContent:'center'},avatarImage:{height:38,width:38,borderRadius:22},initial:{color:'#157A52',fontSize:19,fontWeight:'700'}});
