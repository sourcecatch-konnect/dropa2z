const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
const rider=`import React from 'react';
import {DeliveryNotification} from '../../../design/DeliveryNotification';
import {useValues} from '../../../utils/context';
export function MessageItem({item}:any){
 const {isDark}=useValues();
 const date=new Date(item?.created_at),seconds=Math.max(0,Math.floor((Date.now()-date.getTime())/1000));
 const time=!Number.isFinite(seconds)?'':seconds<60?'Just now':seconds<3600?Math.floor(seconds/60)+' min ago':seconds<86400?Math.floor(seconds/3600)+' hr ago':date.toLocaleDateString('en-GB');
 return <DeliveryNotification title={item?.data?.title} description={item?.data?.message||item?.data?.body} time={time} dark={isDark}/>;
}
`;
fs.writeFileSync(path.join(root,'Taxido_user/src/components/notificationContainer/messageItem/index.tsx'),rider);
const file=path.join(root,'Taxido_driver/src/screen/notification/index.tsx');let source=fs.readFileSync(file,'utf8');
source="import {DeliveryNotification} from '../../design/DeliveryNotification';\n"+source;
const start=source.indexOf('  const renderItem ='),end=source.indexOf('\n  return (',start);
if(start<0||end<0)throw Error('Notification list anchor missing');
source=source.slice(0,start)+"  const renderItem = ({item}:any) => <View style={{marginHorizontal:16,marginBottom:12}}><DeliveryNotification title={item?.data?.title} description={item?.data?.message||item?.data?.body} time={getTimeAgo(item?.created_at)} dark={isDark}/></View>;\n"+source.slice(end);
source=source.replace('keyExtractor={item => item.id}','keyExtractor={item => String(item.id)}');fs.writeFileSync(file,source);
const parser=require(path.join(root,'Taxido_user/node_modules/@babel/parser'));
for(const p of ['Taxido_user/src/design/DeliveryNotification.tsx','Taxido_driver/src/design/DeliveryNotification.tsx','Taxido_user/src/utils/pushNotificationHandler.tsx','Taxido_driver/src/utils/pushNotificationHandler.tsx','Taxido_user/src/commonComponent/notificationHelper/index.tsx','Taxido_driver/src/commonComponents/notificationHelper/index.tsx','Taxido_user/src/screens/bookRide/mapBooking/index.tsx','Taxido_user/src/screens/bookRide/index.tsx','Taxido_driver/src/screen/notification/index.tsx'])parser.parse(fs.readFileSync(path.join(root,p),'utf8'),{sourceType:'module',plugins:['typescript','jsx']});
console.log('Notification cards and changed map/UI sources parsed.');
