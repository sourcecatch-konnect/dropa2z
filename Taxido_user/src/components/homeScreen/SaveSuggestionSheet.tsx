import React,{useEffect,useRef,useState} from 'react';
import {Modal,View,TouchableOpacity,ScrollView,KeyboardAvoidingView,Platform} from 'react-native';
import {Text,TextInput} from '../../design/Typography';
import {useValues} from '../../utils/context';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useDispatch,useSelector} from 'react-redux';
import {addSaveLocation} from '../../api/services/saveLocationService';
import {userSaveLocation} from '../../api/store/actions/saveLocationAction';
import {categoryLocationPayload,placeCategories,PlaceCategory} from '../../utils/placeCategories';

export function SaveSuggestionSheet({place,onClose,categories:providedCategories}:{place:any;onClose:()=>void;categories?:PlaceCategory[]}){
  const {isDark}=useValues(),insets=useSafeAreaInsets(),dispatch=useDispatch();
  const saved=useSelector((state:any)=>state.saveLocation?.saveLocationDataGet?.data)||[];
  const categories=providedCategories||placeCategories([],Array.isArray(saved)?saved:[]);
  const [title,setTitle]=useState('Home'),[error,setError]=useState(''),[busy,setBusy]=useState(false),[stored,setStored]=useState(false);
  const pending=useRef(false),ink=isDark?'#FFFFFF':'#17191C';
  useEffect(()=>{if(place){setTitle('Home');setError('');setStored(false);}},[place]);
  const save=async()=>{
    if(pending.current)return;
    if(!title.trim()){setError('Choose or enter a place name.');return;}
    pending.current=true;setBusy(true);setError('');
    try{
      if(!stored){
        const category=categories.find(item=>item.name.toLowerCase()===title.trim().toLowerCase())||{name:title.trim(),icon:'place' as const};
        const payload=categoryLocationPayload(category,place);
        const exists=saved.some((item:any)=>String(item.title).toLowerCase()===payload.title.toLowerCase()&&String(item.location).toLowerCase()===payload.location.toLowerCase());
        if(!exists)await addSaveLocation(payload);
        setStored(true);
      }
      await (dispatch as any)(userSaveLocation()).unwrap();
      onClose();
    }catch(e:any){setError(stored?'Address saved. Tap again to refresh the list.':e?.response?.data?.message||e?.message||'Could not save this place. Try again.');}
    finally{pending.current=false;setBusy(false);}
  };
  return <Modal visible={!!place} transparent animationType="slide" onRequestClose={()=>{if(!busy)onClose();}}>
    <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{flex:1,justifyContent:'flex-end',backgroundColor:'#00000066'}}>
      <View style={{backgroundColor:isDark?'#25282D':'#FFFFFF',borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,paddingBottom:20+insets.bottom,maxHeight:'85%'}}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close save place" disabled={busy} onPress={onClose} style={{alignSelf:'flex-end',minHeight:44,justifyContent:'center'}}><Text style={{color:ink}}>Close</Text></TouchableOpacity>
        <Text style={{color:ink,fontSize:22,fontWeight:'700'}}>Save place</Text>
        <Text numberOfLines={3} style={{color:ink,marginVertical:12}}>{place?.fullAddress}</Text>
        <ScrollView horizontal keyboardShouldPersistTaps="handled" contentContainerStyle={{gap:8,paddingVertical:8}}>{categories.map(item=><TouchableOpacity accessibilityRole="radio" accessibilityState={{selected:title===item.name}} key={item.name} disabled={busy||stored} onPress={()=>setTitle(item.name)} style={{padding:12,borderRadius:10,borderWidth:1,borderColor:title===item.name?'#E77B00':'#8E969F'}}><Text style={{color:ink}}>{item.name}</Text></TouchableOpacity>)}</ScrollView>
        <TextInput accessibilityLabel="Saved place name" value={title} onChangeText={setTitle} editable={!busy&&!stored} maxLength={30} placeholder="Home, Shop, Godown or another name" placeholderTextColor="#777D86" style={{minHeight:48,borderRadius:12,borderWidth:1,borderColor:'#8E969F',color:ink,padding:12,marginVertical:12}}/>
        {!!error&&<Text accessibilityRole="alert" style={{color:isDark?'#FFAFAF':'#B52A35',marginBottom:12}}>{error}</Text>}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Save searched place" disabled={busy} onPress={()=>void save()} style={{minHeight:50,borderRadius:12,backgroundColor:'#FC9F03',alignItems:'center',justifyContent:'center'}}><Text style={{color:'#17191C',fontWeight:'700'}}>{busy?'Saving…':stored?'Refresh saved places':'Save place'}</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
