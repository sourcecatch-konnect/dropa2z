import React, {useState} from 'react';
import {View, Image, TouchableOpacity, Linking, Alert} from 'react-native';
import {Text} from '../../design/Typography';
import {useValues} from '../../utils/context';
import {useAppNavigation} from '../../utils/navigation';
import {bookingStatus, contactPhone} from '../../utils/bookingPeople';

export function AssignedDriverCard({ride}: {ride: any}) {
  const {isDark} = useValues();
  const {navigate} = useAppNavigation();
  const [imageFailed, setImageFailed] = useState(false);
  const status = bookingStatus(ride);
  const driver = ride?.driver;
  if (!driver?.id || !['accepted','arrived','started','ongoing','completed'].includes(status)) return null;
  const ink = isDark ? '#FFFFFF' : '#17191C';
  const phone = contactPhone(driver);
  const active = ['accepted','arrived','started','ongoing'].includes(status);
  const model = ride.vehicle_type?.vehicle_model || ride.vehicle_model || driver.vehicle_info?.model;
  const plate = ride.vehicle_type?.plate_number || ride.plate_number || driver.vehicle_info?.plate_number;
  const photo = driver.profile_image_url || driver.profile_image?.original_url;
  return <View style={{padding:16,marginBottom:12,borderRadius:18,backgroundColor:isDark?'#25282D':'#FFFFFF',borderWidth:.5,borderColor:'#E5E7EB'}}>
    <View style={{flexDirection:'row',alignItems:'center'}}>
      {photo && !imageFailed ? <Image source={{uri:photo}} onError={() => setImageFailed(true)} style={{width:48,height:48,borderRadius:24}}/> :
        <View style={{width:48,height:48,borderRadius:24,backgroundColor:'#FC9F03',alignItems:'center',justifyContent:'center'}}><Text style={{color:'white',fontSize:22,fontWeight:'700'}}>{driver.name?.charAt(0)?.toUpperCase() || 'D'}</Text></View>}
      <View style={{flex:1,marginLeft:12}}><Text style={{fontSize:12,color:ink,opacity:.65}}>Your delivery driver</Text><Text style={{fontSize:18,fontWeight:'700',color:ink}}>{driver.name || 'Driver assigned'}</Text>
        {Number(driver.rating_count) > 0 && <Text style={{color:ink}}>★ {Number(driver.rating_count).toFixed(1)}</Text>}
      </View>
    </View>
    {!!(model || plate) && <Text style={{color:ink,marginTop:10,fontWeight:'600'}}>{[model,plate].filter(Boolean).join(' · ')}</Text>}
    {active && <View style={{flexDirection:'row',marginTop:12,gap:8}}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Message assigned driver" onPress={() => navigate('ChatScreen',{driverId:driver.id,riderId:ride.rider?.id,rideId:ride.id,driverName:driver.name,driverImage:photo})} style={{flex:1,minHeight:44,borderRadius:12,backgroundColor:'#FFF5E5',alignItems:'center',justifyContent:'center'}}><Text style={{color:'#A65B00',fontWeight:'600'}}>Message driver</Text></TouchableOpacity>
      {!!phone && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Call assigned driver" onPress={() => Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Unable to call','Please use your phone dialler to contact the driver.'))} style={{flex:1,minHeight:44,borderRadius:12,backgroundColor:'#FC9F03',alignItems:'center',justifyContent:'center'}}><Text style={{color:'white',fontWeight:'600'}}>Call driver</Text></TouchableOpacity>}
    </View>}
  </View>;
}
