import React from 'react';
import {Notifier} from 'react-native-notifier';
import {DeliveryNotification} from '../../design/DeliveryNotification';
import {notificationText} from '../../utils/notificationPresentation';
export function CustomNotification(props:any){return <DeliveryNotification {...props} banner/>;}
export function notificationHelper(title:any,message:any,type='info'){
 const safeTitle=notificationText(title),safeMessage=notificationText(message);
 if(!safeTitle&&!safeMessage)return;
 Notifier.showNotification({title:safeTitle,description:safeMessage,duration:4000,showAnimationDuration:250,hideAnimationDuration:200,hideOnPress:true,Component:CustomNotification,componentProps:{alertType:type,title:safeTitle,description:safeMessage}});
}
