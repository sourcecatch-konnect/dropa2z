import React from 'react';
import {Pressable, ScrollView, TouchableOpacity, View} from 'react-native';
import {Text} from '../../design/Typography';
import {AddressMarker} from '../../utils/icons';
import {useValues} from '../../utils/context';
import {appFonts} from '../../themes/appFonts';
import Svg,{Path} from 'react-native-svg';

export type SuggestionFrame={left:number;top:number;width:number;maxHeight:number;cardTop?:number};
/** Dismiss outside the card, leaving its inputs and the higher dropdown interactive. */
export function AddressSuggestionDismissArea({frame,onDismiss}:{frame:SuggestionFrame|null;onDismiss:()=>void}){
  if(!frame)return null;
  const cardTop=Math.max(0,frame.cardTop??frame.top);
  const area=(key:string,style:any)=><Pressable key={key} testID={`dismiss-address-suggestions-${key}`} accessibilityRole="button" accessibilityLabel="Close address suggestions" onPressIn={onDismiss} onPress={onDismiss} style={[{position:'absolute',zIndex:90,elevation:8,backgroundColor:'transparent'},style]}/>;
  return <>{area('above',{left:0,right:0,top:0,height:cardTop})}{area('below',{left:0,right:0,top:frame.top,bottom:0})}{area('left',{left:0,top:cardTop,width:Math.max(0,frame.left),height:Math.max(0,frame.top-cardTop)})}{area('right',{left:frame.left+frame.width,right:0,top:cardTop,height:Math.max(0,frame.top-cardTop)})}</>;
}
export function AddressSuggestionOverlay({suggestions,onSelect,onSave,isSaved,frame,header}:{suggestions:any[];onSelect:(place:any)=>Promise<void>;onSave?:(place:any)=>void;isSaved?:(place:any)=>boolean;frame?:SuggestionFrame|null;header?:React.ReactNode}){
  const {isDark}=useValues();
  if(!suggestions.length&&!header)return null;
  return <View testID="address-suggestion-overlay" style={{position:'absolute',top:frame?.top??'100%',left:frame?.left??0,...(frame?{width:frame.width}:{right:0}),zIndex:100,elevation:16,backgroundColor:isDark?'#25282D':'#FFFFFF',borderRadius:14,borderWidth:2,borderColor:isDark?'#737B86':'#B7BEC6',shadowColor:'#000000',shadowOffset:{width:0,height:4},shadowOpacity:.16,shadowRadius:12}}>
    <ScrollView testID="address-suggestion-scroll" accessibilityLabel="Address suggestions" accessibilityHint="Scroll vertically for more addresses" keyboardShouldPersistTaps="always" nestedScrollEnabled showsVerticalScrollIndicator persistentScrollbar bounces={false} overScrollMode="never" indicatorStyle={isDark?'white':'black'} style={{maxHeight:frame?.maxHeight??210}} contentContainerStyle={{paddingRight:8}}>
      {header}
      {suggestions.map((item,index)=><View key={`${item.id||item.fullAddress||item.shortAddress}:${index}`} style={{minHeight:58,flexDirection:'row',alignItems:'center',paddingHorizontal:8,borderBottomWidth:index<suggestions.length-1?1:0,borderBottomColor:isDark?'#51555B':'#EEEEEE'}}><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Select address: ${item.fullAddress||[item.shortAddress,item.detailAddress].filter(Boolean).join(', ')}`} onPress={()=>void onSelect(item)} style={{flex:1,minHeight:58,flexDirection:'row',alignItems:'center',gap:10,padding:8}}>
        <AddressMarker/>
        <View style={{flex:1,minWidth:0}}><Text numberOfLines={1} style={{fontFamily:appFonts.medium,color:isDark?'#FFFFFF':'#17191C',fontSize:14}}>{item.shortAddress||item.fullAddress}</Text>
          {!!item.detailAddress&&<Text numberOfLines={2} style={{fontFamily:appFonts.regular,color:isDark?'#C5CAD0':'#656C76',fontSize:12,marginTop:3}}>{item.detailAddress}</Text>}
        </View>
      </TouchableOpacity>{onSave&&<TouchableOpacity accessibilityRole="button" accessibilityLabel={`${isSaved?.(item)?'Saved place':'Save address'}: ${item.fullAddress||item.shortAddress}`} accessibilityState={{disabled:!!isSaved?.(item)}} disabled={!!isSaved?.(item)} onPress={()=>onSave(item)} style={{width:44,minHeight:48,alignItems:'center',justifyContent:'center'}}><Svg width={22} height={24} viewBox="0 0 24 24"><Path d="M6 3h12v18l-6-4-6 4V3z" fill={isSaved?.(item)?'#E77B00':'none'} stroke={isDark?'#FFBE60':'#B15D00'} strokeWidth={1.7}/></Svg></TouchableOpacity>}</View>)}
    </ScrollView>
  </View>;
}
