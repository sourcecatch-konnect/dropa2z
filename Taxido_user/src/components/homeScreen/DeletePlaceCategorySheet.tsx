import React,{useEffect,useRef,useState} from 'react';
import {Alert,Modal,ScrollView,TouchableOpacity,View} from 'react-native';
import {Text} from '../../design/Typography';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {PlaceCategory} from '../../utils/placeCategories';
import {canDeletePlaceCategory} from '../../utils/deletePlaceCategory';
import {CategoryDeleteIcon} from './SaveCategoryIcons';
export function DeletePlaceCategorySheet({visible,categories,onDelete,onClose,dark=false}:{visible:boolean;categories:PlaceCategory[];onDelete:(name:string)=>Promise<void>;onClose:()=>void;dark?:boolean}){
  const [error,setError]=useState(''),[busy,setBusy]=useState(''),pending=useRef(false),insets=useSafeAreaInsets();
  const ink=dark?'#FFFFFF':'#17191C',removable=categories.filter(item=>canDeletePlaceCategory(item.name));
  useEffect(()=>{if(visible)setError('');},[visible]);
  const remove=async(name:string)=>{if(pending.current)return;pending.current=true;setBusy(name);setError('');try{await onDelete(name);onClose();}catch(e:any){setError(e?.message||'Could not delete this category.');}finally{pending.current=false;setBusy('');}};
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={()=>{if(!busy)onClose();}}><View style={{flex:1,justifyContent:'flex-end',backgroundColor:'#00000066'}}><View style={{padding:20,paddingBottom:20+insets.bottom,borderTopLeftRadius:24,borderTopRightRadius:24,maxHeight:'80%',backgroundColor:dark?'#25282D':'#FFFFFF'}}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close category deletion" disabled={!!busy} onPress={onClose} style={{alignSelf:'flex-end',minHeight:44,justifyContent:'center'}}><Text style={{color:ink}}>Close</Text></TouchableOpacity>
    <Text style={{color:ink,fontSize:22,fontWeight:'700'}}>Delete category</Text>
    <Text style={{color:ink,marginVertical:12}}>Saved addresses will stay under Other. Home, Shop and Godown are kept.</Text>
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>{removable.length?removable.map(item=><TouchableOpacity key={item.name.toLowerCase()} accessibilityRole="button" accessibilityLabel={`Delete category ${item.name}`} disabled={!!busy} onPress={()=>Alert.alert(`Delete ${item.name}?`,'Its saved addresses will be kept under Other.',[{text:'Cancel',style:'cancel'},{text:'Delete category',style:'destructive',onPress:()=>void remove(item.name)}])} style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',minHeight:56,borderBottomWidth:1,borderBottomColor:dark?'#51555B':'#EEEEEE',gap:12}}><Text style={{color:ink,flex:1}}>{busy===item.name?'Deleting…':item.name}</Text><CategoryDeleteIcon dark={dark}/></TouchableOpacity>):<Text style={{color:ink,paddingVertical:16}}>No custom categories to delete.</Text>}</ScrollView>
    {!!error&&<Text accessibilityRole="alert" style={{color:dark?'#FFAFAF':'#B52A35',marginTop:12}}>{error}</Text>}
  </View></View></Modal>;
}
