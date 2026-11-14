import React from 'react';
import {StyleSheet,TouchableOpacity,View} from 'react-native';
import {Text} from './Typography';
import {DesignIcon} from './DesignIcon';
import {HomeLocation,WorkLocation,OtherLocation,Copy,Edit,Delete} from '../utils/icons';
import {SavedCategoryIcon} from '../components/homeScreen/SaveCategoryIcons';

export function SavedPlaceCard({item,selecting,dark,onOpen,onUse,onEdit,onDelete}:{item:any;selecting:boolean;dark:boolean;onOpen:()=>void;onUse:()=>void;onEdit:()=>void;onDelete:()=>void}){
 const ink=dark?'#FFFFFF':'#17191C';
 const category=String(item.displayCategory||item.title||item.type||'').toLowerCase();
 const categoryIcon=category==='home'?'home':category==='shop'?'shop':category==='godown'?'warehouse':'place';
 const action=(label:string,icon:React.ReactNode,onPress:()=>void,danger=false)=><TouchableOpacity accessibilityRole="button" accessibilityLabel={`${label} ${item.title}`} onPress={onPress} style={styles.action}>{icon}<Text style={{fontSize:12,color:danger?(dark?'#FF8795':'#BF2436'):ink,marginLeft:5}}>{label}</Text></TouchableOpacity>;
 return <View style={[styles.card,{backgroundColor:dark?'#25282D':'#FFFFFF',borderColor:dark?'#51555B':'#E5E7EB'}]}>
  <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${selecting?'Select':'Edit'} ${item.title}, ${item.location}`} onPress={onOpen} style={styles.body}>
   <View style={[styles.icon,{backgroundColor:dark?'#3B2B19':'#FFF5E5'}]}><SavedCategoryIcon icon={categoryIcon} color={dark?'#FFBE60':'#A64B00'}/></View>
   <View style={{flex:1,minWidth:0}}><Text style={{fontSize:11,color:dark?'#FFBE60':'#A65B00',fontWeight:'700',letterSpacing:.7,marginBottom:4}}>{item.displayCategory|| (item.type==='home'?'HOME':item.type==='work'?'WORK':'SAVED PLACE')}</Text><Text style={{fontSize:18,fontWeight:'700',color:ink}}>{item.title}</Text><Text style={{fontSize:13,lineHeight:19,color:dark?'#C5CAD0':'#656C76',marginTop:5}}>{item.location}</Text></View>
  </TouchableOpacity>
  <View style={[styles.actions,{borderTopColor:dark?'#51555B':'#EEEEEE'}]}>{action(selecting?'Select':'Copy',<Copy color={ink}/>,onUse)}{action('Edit',<Edit/>,onEdit)}{action('Delete',<Delete iconColor={dark?"#FF8795":"#BF2436"}/>,onDelete,true)}</View>
 </View>;
}
const styles=StyleSheet.create({card:{borderWidth:1,borderRadius:20,marginBottom:14,shadowColor:'#17191C',shadowOpacity:.04,shadowOffset:{width:0,height:3},shadowRadius:8,elevation:1},body:{flexDirection:'row',gap:12,padding:16},icon:{width:44,height:44,borderRadius:14,backgroundColor:'#FFF5E5',alignItems:'center',justifyContent:'center'},actions:{flexDirection:'row',justifyContent:'space-around',borderTopWidth:1,marginHorizontal:12,paddingVertical:2},action:{minHeight:44,flexDirection:'row',alignItems:'center',justifyContent:'center',paddingHorizontal:8}});
