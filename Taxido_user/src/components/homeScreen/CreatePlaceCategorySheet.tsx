import React,{useEffect,useState,useRef} from 'react';
import {Modal,View,TouchableOpacity,KeyboardAvoidingView,Platform} from 'react-native';
import {Text,TextInput} from '../../design/Typography';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
export function CreatePlaceCategorySheet({visible,onClose,onCreate,dark=false}:{visible:boolean;onClose:()=>void;onCreate:(name:string)=>Promise<void>;dark?:boolean}){
  const [name,setName]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),pending=useRef(false),insets=useSafeAreaInsets();
  const ink=dark?'#FFFFFF':'#17191C';
  useEffect(()=>{if(visible){setName('');setError('');}},[visible]);
  const create=async()=>{if(pending.current)return;pending.current=true;setBusy(true);setError('');try{await onCreate(name);onClose();}catch(e:any){setError(e?.message||'Could not create category.');}finally{pending.current=false;setBusy(false);}};
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={()=>{if(!busy)onClose();}}><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{flex:1,justifyContent:'flex-end',backgroundColor:'#00000066'}}><View style={{padding:20,paddingBottom:20+insets.bottom,backgroundColor:dark?'#25282D':'#FFFFFF',borderTopLeftRadius:24,borderTopRightRadius:24}}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close category creation" disabled={busy} onPress={onClose} style={{alignSelf:'flex-end',minHeight:44,justifyContent:'center'}}><Text style={{color:ink}}>Close</Text></TouchableOpacity>
    <Text style={{fontSize:22,fontWeight:'700',color:ink}}>Add category</Text>
    <TextInput accessibilityLabel="New saved-place category name" value={name} onChangeText={setName} editable={!busy} maxLength={30} placeholder="For example, Warehouse or Parents" placeholderTextColor="#777D86" style={{color:ink,borderWidth:1,borderColor:'#8E969F',borderRadius:12,minHeight:48,padding:12,marginVertical:16}}/>
    {!!error&&<Text accessibilityRole="alert" style={{color:dark?'#FFAFAF':'#B52A35',marginBottom:12}}>{error}</Text>}
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Create saved-place category" disabled={busy} onPress={()=>void create()} style={{backgroundColor:'#FC9F03',minHeight:48,borderRadius:12,alignItems:'center',justifyContent:'center'}}><Text style={{color:'#17191C',fontWeight:'700'}}>{busy?'Creating…':'Create category'}</Text></TouchableOpacity>
  </View></KeyboardAvoidingView></Modal>;
}
