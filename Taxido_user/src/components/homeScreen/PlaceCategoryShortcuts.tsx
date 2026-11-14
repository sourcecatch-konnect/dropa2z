import React,{useCallback,useRef,useState} from 'react';
import {Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {Text, TextInput} from '../../design/Typography';
import {useFocusEffect} from '@react-navigation/native';
import {useDispatch,useSelector} from 'react-redux';
import {useAppNavigation} from '../../utils/navigation';
import {getValue,setValue} from '../../utils/localstorage';
import {addSaveLocation} from '../../api/services/saveLocationService';
import {userSaveLocation,deleteSaveLocation} from '../../api/store/actions/saveLocationAction';
import {PlaceCategory,categoryKey,categoryLocationPayload,placeCategories,placesInCategory} from '../../utils/placeCategories';
import {HomeLocation,WorkLocation,OtherLocation,Delete} from '../../utils/icons';
import {useValues} from '../../utils/context';
import Svg,{Path} from 'react-native-svg';

function CategoryIcon({icon,color='#A65B00'}:{icon:PlaceCategory['icon'];color?:string}){
  if(icon==='shop')return <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"><Path d="M3 10l2-6h14l2 6M3 10v3h18v-3M5 13v8h14v-8M9 21v-5h6v5M2 21h20" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
  if(icon==='warehouse')return <Svg width={22} height={22} viewBox="0 0 24 24" fill="none"><Path d="M3 21V8l9-5 9 5v13M7 21V11h10v10M7 15h10M7 18h10M2 21h20" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
  if(icon==='office')return <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M5 21V3h14v18M3 21h18M9 7h1m4 0h1M9 11h1m4 0h1M10 21v-6h4v6" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
  return icon==='home'?<HomeLocation/>:icon==='work'?<WorkLocation/>:<OtherLocation/>;
}

/** Explicit, account-scoped labels; a searched address is never guessed to be someone's home. */
export function PlaceCategoryShortcuts({recent,onSelect}:{recent:any[];onSelect:(place:any)=>Promise<void>}){
  const {navigate}=useAppNavigation(),dispatch=useDispatch();
  const {isDark}=useValues();
  const self=useSelector((state:any)=>state.account?.self);
  const saved=useSelector((state:any)=>state.saveLocation?.saveLocationDataGet?.data)||[];
  const [custom,setCustom]=useState<PlaceCategory[]>([]),[selected,setSelected]=useState('Home');
  const [editor,setEditor]=useState(false),[picker,setPicker]=useState(false),[name,setName]=useState('');
  const [icon,setIcon]=useState<PlaceCategory['icon']>('place'),[error,setError]=useState(''),[saving,setSaving]=useState(false);
  const pending=useRef(false);
  const scope=self?.id?`placeCategories:${self.id}`:null;
  const categories=placeCategories(custom,Array.isArray(saved)?saved:[]);
  const category=categories.find(item=>categoryKey(item.name)===categoryKey(selected))||categories[0];
  const places=placesInCategory(category,Array.isArray(saved)?saved:[]);
  const ink=isDark?'#FFFFFF':'#17191C',surface=isDark?'#25282D':'#FFFFFF';
  useFocusEffect(useCallback(()=>{
    let mounted=true;
    setCustom([]);setSelected('Home');setEditor(false);setPicker(false);
    if(scope){
      getValue(scope).then(value=>{if(!mounted)return;try{const parsed=JSON.parse(value||'[]');setCustom(Array.isArray(parsed)?parsed:[]);}catch{setCustom([]);}});
      (dispatch as any)(userSaveLocation());
    }
    return()=>{mounted=false;};
  },[scope,dispatch]));

  const requireAccount=()=>{
    if(scope)return true;
    Alert.alert('Sign in to save places','Your saved addresses are linked to your account.',[{text:'Cancel',style:'cancel'},{text:'Sign in',onPress:()=>navigate('SignIn')}]);
    return false;
  };
  const create=async()=>{
    if(pending.current||!scope)return;
    const title=name.trim();
    if(!title){setError('Enter a category name.');return;}
    if(categories.some(item=>categoryKey(item.name)===categoryKey(title))){setError('That category already exists.');return;}
    pending.current=true;setSaving(true);setError('');
    try{
      const next=[...custom,{name:title,icon}];
      await setValue(scope,JSON.stringify(next));setCustom(next);setSelected(title);setEditor(false);setPicker(true);
    }catch{setError('Could not save your category. Please try again.');}
    finally{pending.current=false;setSaving(false);}
  };
  const saveAddress=async(place:any)=>{
    if(pending.current||!requireAccount())return;
    pending.current=true;setSaving(true);setError('');
    try{
      const payload=categoryLocationPayload(category,place);
      if(!places.some(item=>item.fullAddress.toLowerCase()===payload.location.toLowerCase()))await addSaveLocation(payload);
      try{await (dispatch as any)(userSaveLocation()).unwrap();setPicker(false);}
      catch{setError('Address saved. The list could not refresh; reopen Saved Location to see it.');}
    }catch(e:any){setError(e?.response?.data?.message||e.message||'Could not save this address. Try again.');}
    finally{pending.current=false;setSaving(false);}
  };
  const addOnMap=()=>{
    setPicker(false);Keyboard.dismiss();
    navigate('LocationSave',{categoryTitle:category.name,categoryType:categoryKey(category.name)==='home'?'home':categoryKey(category.name)==='work'?'work':'other'});
  };
  const deleteAddress=(place:any)=>{
    if(pending.current)return;
    const id=Number(String(place.id).replace(/^saved:/,''));
    if(!Number.isSafeInteger(id)||id<=0)return;
    Alert.alert('Delete saved address?',`Remove this address from ${category.name}?\n\n${place.fullAddress}`,[
      {text:'Cancel',style:'cancel'},
      {text:'Delete',style:'destructive',onPress:async()=>{
        if(pending.current)return;
        pending.current=true;setSaving(true);setError('');
        try{
          await (dispatch as any)(deleteSaveLocation(id)).unwrap();
          try{await (dispatch as any)(userSaveLocation()).unwrap();}
          catch{setError('Address deleted. Reopen Your Places if the list has not refreshed.');}
        }catch{setError('Could not delete this address. Please try again.');}
        finally{pending.current=false;setSaving(false);}
      }},
    ]);
  };
  const modal=(visible:boolean,close:()=>void,children:React.ReactNode)=><Modal transparent animationType="slide" visible={visible} onRequestClose={()=>{if(!saving)close();}}>
    <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={styles.overlay}>
      <View style={[styles.sheet,{backgroundColor:surface}]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close places dialog" disabled={saving} onPress={close} style={styles.close}><Text style={{color:ink,fontSize:16}}>Close</Text></TouchableOpacity>
        {children}
      </View>
    </KeyboardAvoidingView>
  </Modal>;
  return <View style={styles.section}>
    <Text accessibilityRole="header" style={[styles.heading,{color:ink}]}>Your places</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:10,paddingVertical:10}}>
      {categories.map(item=><TouchableOpacity key={categoryKey(item.name)} accessibilityRole="button" accessibilityLabel={`${item.name} places`} accessibilityState={{selected:item.name===category.name}}
        onPress={()=>setSelected(item.name)} style={[styles.chip,{backgroundColor:surface,borderColor:item.name===category.name?'#FC9F03':isDark?'#41464E':'#E5E7EB'}]}>
        <CategoryIcon icon={item.icon} color={isDark?"#FFBE60":"#A65B00"}/><Text numberOfLines={1} style={{color:ink,fontWeight:'700',marginTop:5}}>{item.name}</Text>
      </TouchableOpacity>)}
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Create place category" style={[styles.chip,{backgroundColor:surface,borderColor:isDark?"#41464E":"#E5E7EB"}]} onPress={()=>{if(requireAccount()){setName('');setIcon('place');setError('');setEditor(true);}}}>
        <Text style={{color:isDark?'#FFBE60':'#A65B00',fontSize:24}}>+</Text><Text style={{color:ink,fontWeight:'700'}}>Add new</Text>
      </TouchableOpacity>
    </ScrollView>
    {places.map(item=><View key={item.id} style={[styles.address,{backgroundColor:surface,borderColor:isDark?"#41464E":"#E5E7EB"}]}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Use ${category.name}: ${item.fullAddress}`} disabled={saving} onPress={()=>{Keyboard.dismiss();void onSelect(item);}} style={{flex:1,minHeight:44,justifyContent:'center'}}><Text numberOfLines={2} style={{color:ink}}>{item.fullAddress}</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Delete ${category.name} address: ${item.fullAddress}`} disabled={saving} onPress={()=>deleteAddress(item)} style={{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'}}><Delete iconColor="#BF2436"/></TouchableOpacity>
    </View>)}
    {!!error&&!editor&&!picker&&<Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Add address to ${category.name}`} onPress={()=>{if(requireAccount()){setError('');setPicker(true);}}} style={styles.add}>
      <Text style={{color:isDark?'#FC9F03':'#A65B00',fontWeight:'700'}}>+ Add address to {category.name}</Text>
    </TouchableOpacity>
    {modal(editor,()=>setEditor(false),<>
      <Text style={[styles.heading,{color:ink}]}>Create a category</Text>
      <TextInput accessibilityLabel="Category name" placeholder="For example, Shop or Parents" placeholderTextColor="#777D86" maxLength={30} value={name} onChangeText={setName} editable={!saving} style={[styles.input,{color:ink,borderColor:isDark?"#41464E":"#D3D7DC"}]} autoCapitalize="words"/>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{gap:10}}>{(['home','work','office','place'] as const).map(value=><TouchableOpacity key={value} accessibilityRole="button" accessibilityLabel={`${value} category icon`} accessibilityState={{selected:icon===value}} disabled={saving} onPress={()=>setIcon(value)} style={[styles.chip,{borderColor:icon===value?'#FC9F03':isDark?'#41464E':'#E5E7EB'}]}><CategoryIcon icon={value} color={isDark?"#FFBE60":"#A65B00"}/><Text style={{color:ink}}>{value}</Text></TouchableOpacity>)}</ScrollView>
      {!!error&&<Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Save new place category" disabled={saving} onPress={create} style={styles.primary}><Text style={styles.primaryText}>{saving?'Saving…':'Create category'}</Text></TouchableOpacity>
    </>)}
    {modal(picker,()=>setPicker(false),<>
      <Text style={[styles.heading,{color:ink}]}>Add address to {category.name}</Text>
      <Text style={{color:ink,marginVertical:10}}>Choose a previously used address, or search for another place.</Text>
      <ScrollView keyboardShouldPersistTaps="handled" style={{maxHeight:260}}>
        {recent.map((place,index)=><TouchableOpacity key={place.id||`${index}:${place.fullAddress}`} accessibilityRole="button" accessibilityLabel={`Save ${place.fullAddress} to ${category.name}`} disabled={saving} onPress={()=>void saveAddress(place)} style={[styles.address,{borderColor:isDark?"#41464E":"#E5E7EB"}]}><Text style={{color:ink}}>{place.fullAddress}</Text></TouchableOpacity>)}
      </ScrollView>
      {!!error&&<Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Search category address on map" disabled={saving} onPress={addOnMap} style={styles.primary}><Text style={styles.primaryText}>{saving?'Saving address…':'Search or choose on map'}</Text></TouchableOpacity>
    </>)}
  </View>;
}
const styles=StyleSheet.create({section:{paddingHorizontal:16,paddingTop:8,paddingBottom:12},heading:{fontSize:18,fontWeight:'800'},chip:{minWidth:76,maxWidth:110,minHeight:76,borderRadius:16,borderWidth:1,borderColor:'#E5E7EB',alignItems:'center',justifyContent:'center',padding:8},address:{flexDirection:'row',alignItems:'center',gap:12,borderWidth:1,borderColor:'#E5E7EB',borderRadius:12,minHeight:48,padding:12,marginBottom:8},add:{minHeight:44,justifyContent:'center'},overlay:{flex:1,backgroundColor:'#00000066',justifyContent:'flex-end'},sheet:{borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,paddingBottom:34,maxHeight:'88%'},close:{minHeight:44,alignSelf:'flex-end',justifyContent:'center'},input:{minHeight:48,borderWidth:1,borderColor:'#D3D7DC',borderRadius:12,paddingHorizontal:12,marginVertical:12},primary:{minHeight:48,borderRadius:12,backgroundColor:'#FC9F03',alignItems:'center',justifyContent:'center',marginTop:12},primaryText:{color:'#17191C',fontWeight:'700'},error:{color:'#BF2436',marginTop:10}});
