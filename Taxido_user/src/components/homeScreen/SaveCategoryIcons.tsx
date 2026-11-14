import React from 'react';
import {View,TouchableOpacity} from 'react-native';
import {Text} from '../../design/Typography';
import Svg,{Path} from 'react-native-svg';
import {defaultPlaceCategories,PlaceCategory} from '../../utils/placeCategories';
export type SaveCategory=string;
export function CategoryDeleteIcon({dark=false}:{dark?:boolean}){
  return <Svg width={21} height={23} viewBox="0 0 24 24" fill="none"><Path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" stroke={dark?'#FF9AA6':'#B52A35'} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}
const paths:Record<string,string>={home:'M3 11l9-8 9 8M5 10v11h5v-7h4v7h5V10',shop:'M3 10l2-6h14l2 6M3 10v3h18v-3M5 13v8h14v-8M9 21v-5h6v5',warehouse:'M3 21V8l9-5 9 5v13M7 21V11h10v10M7 15h10M7 18h10',place:'M12 22S4 14 4 9a8 8 0 1116 0c0 5-8 13-8 13zm0-17a4 4 0 100 8 4 4 0 000-8z'};
export function SavedCategoryIcon({icon,color,size=22}:{icon:string;color:string;size?:number}){
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d={paths[icon]||paths.place} stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}
export function SaveCategoryIcons({selected,onSelect,dark=false,categories=defaultPlaceCategories}:{selected:SaveCategory|null;onSelect:(category:SaveCategory)=>void;dark?:boolean;categories?:PlaceCategory[]}){
  const shortcuts=defaultPlaceCategories.map(item=>categories.find(category=>category.name.toLowerCase()===item.name.toLowerCase())||item);
  return <View accessibilityLabel="Saved-place categories" style={{flexDirection:'row',alignItems:'center',paddingHorizontal:6,paddingVertical:5,gap:4}}>
      {shortcuts.map(category=><TouchableOpacity key={category.name.toLowerCase()} accessibilityRole="radio" accessibilityLabel={`Save next selected address to ${category.name}`} accessibilityState={{selected:selected===category.name}} accessibilityHint="Select this category, then choose an address suggestion to save it automatically" onPress={()=>onSelect(category.name)} style={{flex:1,minWidth:0,minHeight:48,flexDirection:'row',gap:6,alignItems:'center',justifyContent:'center',borderRadius:12,backgroundColor:selected===category.name?(dark?'#2E4B39':'#E4F4E9'):'transparent'}}>
        <SavedCategoryIcon icon={category.icon} size={20} color={selected===category.name?(dark?'#71D8A5':'#15834F'):dark?'#FFBE60':'#A65B00'}/>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{fontSize:12,flexShrink:1,color:dark?'#FFFFFF':'#17191C'}}>{category.name}</Text>
        {selected===category.name&&<View style={{position:'absolute',right:3,top:4,width:6,height:6,borderRadius:3,backgroundColor:'#15834F'}}/>}
      </TouchableOpacity>)}
  </View>;
}
