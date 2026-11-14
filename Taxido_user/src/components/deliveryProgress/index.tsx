import React from 'react';
import {View} from 'react-native';
import {Text} from '../../design/Typography';
import {DesignIcon} from '../../design/DesignIcon';
import {useValues} from '../../utils/context';

export function DeliveryProgressCard({ride}: {ride:any}) {
  const {isDark} = useValues();
  const stops = ride?.parcel_delivery_progress?.stops;
  if (!Array.isArray(stops) || !stops.length) return null;
  const delivered = stops.filter((stop:any)=>stop.status==='delivered').length;
  const next = stops.findIndex((stop:any)=>stop.status!=='delivered');
  const status = next<0 ? 'All parcels delivered' : stops[next]?.arrived_at ? (next===stops.length-1?'Driver arrived at the final drop':'Driver arrived at drop '+(next+1)) : 'On the way to drop '+(next+1);
  return <View accessibilityLiveRegion="polite" style={{marginVertical:12,padding:14,borderRadius:16,backgroundColor:isDark?'#25282D':'#FFF5E5',flexDirection:'row',gap:12,alignItems:'center'}}><DesignIcon name="package" color={isDark?'#FFBE60':'#A64B00'}/><View style={{flex:1}}><Text style={{fontWeight:'700',color:isDark?'#FFFFFF':'#17191C'}}>{status}</Text><Text style={{marginTop:4,color:isDark?'#BBC1CA':'#656C76'}}>{delivered}/{stops.length} parcels handed over</Text></View></View>;
}
