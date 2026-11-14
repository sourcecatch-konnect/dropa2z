import React, {useState} from 'react';
import {ActivityIndicator, Alert, FlatList, Modal, PermissionsAndroid, Platform, TouchableOpacity, View} from 'react-native';
import Contacts from 'react-native-contacts';
import {Text, TextInput} from '../design/Typography';
import {DesignIcon} from '../design/DesignIcon';
import {receiverContacts} from '../utils/receiverContacts';
import {useValues} from '../utils/context';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export function ReceiverContactImport({onSelect}: {onSelect: (contact: {name:string;phone:string;countryCode:string}) => void}) {
  const {isDark} = useValues(), insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<ReturnType<typeof receiverContacts>>([]);
  const ink = isDark ? '#FFF3E2' : '#211C16', surface = isDark ? '#211F1B' : '#FFFFFF';
  const load = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const permission = Platform.OS === 'android'
        ? await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS)
        : await Contacts.requestPermission();
      if (!['granted', 'authorized'].includes(permission)) {
        Alert.alert('Contacts permission', 'Allow contacts access to choose a contact, or enter their name and number manually.');
        return;
      }
      setContacts(receiverContacts(await Contacts.getAllWithoutPhotos()));
      setQuery(''); setOpen(true);
    } catch { Alert.alert('Contacts unavailable', 'Please enter the contact details manually and try choosing a contact again later.'); }
    finally { setBusy(false); }
  };
  return <>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Choose the contact" disabled={busy} onPress={load}
      style={{minHeight:44,flexDirection:'row',alignItems:'center',gap:8,alignSelf:'flex-start',paddingVertical:8}}>
      {busy ? <ActivityIndicator color="#A65B00"/> : <DesignIcon name="user-round" color="#A65B00"/>}
      <Text style={{color:isDark?'#FFBE60':'#A65B00',fontWeight:'700'}}>Choose the contact</Text>
    </TouchableOpacity>
    <Modal visible={open} animationType="slide" onRequestClose={()=>setOpen(false)}>
      <View style={{flex:1,backgroundColor:surface,paddingTop:insets.top+12,paddingBottom:insets.bottom,paddingHorizontal:18}}>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
          <Text style={{color:ink,fontSize:22,fontWeight:'700'}}>Choose the contact</Text>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close contacts" onPress={()=>setOpen(false)} style={{padding:12,minHeight:44}}><Text style={{color:ink}}>Close</Text></TouchableOpacity>
        </View>
        <TextInput accessibilityLabel="Search contacts" value={query} onChangeText={setQuery} placeholder="Search name or mobile number" placeholderTextColor="#777777"
          style={{minHeight:48,borderWidth:1,borderColor:'#9D9285',borderRadius:12,color:ink,paddingHorizontal:12,marginVertical:12}}/>
        <FlatList data={contacts.filter(contact=>(contact.name+' '+contact.phone).toLowerCase().includes(query.trim().toLowerCase()))} keyExtractor={item=>item.id} keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text style={{color:ink,padding:16}}>No matching Indian mobile contacts.</Text>}
          renderItem={({item})=><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Select ${item.name}, ${item.phone}`} onPress={()=>{onSelect(item);setOpen(false);}} style={{paddingVertical:16,borderBottomWidth:1,borderBottomColor:'#9D928544',gap:5}}><Text style={{color:ink,fontSize:17,fontWeight:'700'}}>{item.name}</Text><Text style={{color:ink}}>+91 {item.phone}</Text></TouchableOpacity>}/>
      </View>
    </Modal>
  </>;
}
