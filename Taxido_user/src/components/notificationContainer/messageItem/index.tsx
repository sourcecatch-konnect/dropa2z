import React from 'react';
import {DeliveryNotification} from '../../../design/DeliveryNotification';
import {useValues} from '../../../utils/context';
import {TouchableOpacity} from 'react-native';
import {queueBookingNotification} from '../../../utils/bookingSignals';
export function MessageItem({item}:any){
 const {isDark}=useValues();
 const date=new Date(item?.created_at),seconds=Math.max(0,Math.floor((Date.now()-date.getTime())/1000));
 const time=!Number.isFinite(seconds)?'':seconds<60?'Just now':seconds<3600?Math.floor(seconds/60)+' min ago':seconds<86400?Math.floor(seconds/3600)+' hr ago':date.toLocaleDateString('en-GB');
 const card=<DeliveryNotification compact title={item?.data?.title} description={item?.data?.message||item?.data?.body} time={time} dark={isDark}/>;
 return item?.data?.ride_id||item?.data?.ride_request_id?<TouchableOpacity accessibilityRole="button" accessibilityLabel="View delivery notification" onPress={()=>void queueBookingNotification(item.data)}>{card}</TouchableOpacity>:card;
}
