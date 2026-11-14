const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
const copy=(from,to)=>fs.copyFileSync(path.join(root,from),path.join(root,to));
copy('Taxido_user/src/design/DeliveryNotification.tsx','Taxido_driver/src/design/DeliveryNotification.tsx');
copy('Taxido_user/src/utils/notificationPresentation.ts','Taxido_driver/src/utils/notificationPresentation.ts');
const userHelper=`import React from 'react';
import {Notifier} from 'react-native-notifier';
import {DeliveryNotification} from '../../design/DeliveryNotification';
import {notificationText} from '../../utils/notificationPresentation';
export function CustomNotification(props:any){return <DeliveryNotification {...props} banner/>;}
export function notificationHelper(title:any,message:any,type='info'){
 const safeTitle=notificationText(title),safeMessage=notificationText(message);
 if(!safeTitle&&!safeMessage)return;
 Notifier.showNotification({title:safeTitle,description:safeMessage,duration:4000,showAnimationDuration:250,hideAnimationDuration:200,hideOnPress:true,Component:CustomNotification,componentProps:{alertType:type,title:safeTitle,description:safeMessage}});
}
`;
for(const p of ['Taxido_user/src/commonComponent/notificationHelper/index.tsx','Taxido_driver/src/commonComponents/notificationHelper/index.tsx'])fs.writeFileSync(path.join(root,p),userHelper);
for(const app of ['Taxido_user','Taxido_driver']){
 const p=path.join(root,app,'src/utils/pushNotificationHandler.tsx');let value=fs.readFileSync(p,'utf8');
 value=value.replace('AndroidImportance','AndroidStyle, AndroidImportance');
 value="import {notificationContent} from './notificationPresentation';\n"+value;
 const start=value.indexOf('  const title =',value.indexOf('async function showLocalNotification')),end=value.indexOf('  await notifee.displayNotification',start);
 if(start<0||end<0)throw Error('Push content anchor missing '+app);
 value=value.slice(0,start)+'  const {title,body}=notificationContent(remoteMessage);\n\n'+value.slice(end);
 value=value.replace('name: "Default Channel"','name: "Dropa2z delivery updates"').replace('smallIcon: "ic_launcher"','smallIcon: "dropa2z_notification",\n      color: "#FC5E02",\n      style: {type: AndroidStyle.BIGTEXT, text:body}');
 fs.writeFileSync(p,value);
 const resource=path.join(root,app,'android/app/src/main/res');
 fs.writeFileSync(path.join(resource,'drawable/dropa2z_notification.xml'),'<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24"><path android:fillColor="#FFFFFFFF" android:pathData="M12,1L22,6.5V17.5L12,23L2,17.5V6.5L12,1ZM5,7.4L12,11.3L19,7.4L12,3.6L5,7.4ZM4,9.2V16.3L11,20.2V13.1L4,9.2ZM13,20.2L20,16.3V9.2L13,13.1V20.2Z"/></vector>');
 fs.writeFileSync(path.join(resource,'values/dropa2z_notifications.xml'),'<resources><color name="dropa2z_notification_accent">#FC5E02</color></resources>');
 const manifestPath=path.join(root,app,'android/app/src/main/AndroidManifest.xml');let manifest=fs.readFileSync(manifestPath,'utf8');
 if(!manifest.includes('xmlns:tools='))manifest=manifest.replace('<manifest ', '<manifest xmlns:tools='+String.fromCharCode(34)+'http://schemas.android.com/tools'+String.fromCharCode(34)+' ');
 if(!manifest.includes('com.google.firebase.messaging.default_notification_icon'))manifest=manifest.replace(/(<application\b[\s\S]*?>)/,'$1\n        <meta-data android:name="com.google.firebase.messaging.default_notification_icon" android:resource="@drawable/dropa2z_notification"/>\n        <meta-data android:name="com.google.firebase.messaging.default_notification_color" android:resource="@color/dropa2z_notification_accent" tools:replace="android:resource"/>');
 fs.writeFileSync(manifestPath,manifest);
}
console.log('Applied matching in-app cards, expanded Android notification text and orange parcel notification icons.');
