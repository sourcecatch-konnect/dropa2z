import {deliveryCopy} from './deliveryCopy';
export function notificationText(value:any):string{
 if(typeof value==='string')return deliveryCopy(value).trim();
 if(value&&typeof value.message==='string')return deliveryCopy(value.message).trim();
 return '';
}
export function notificationContent(message:any){
 return {title:notificationText(message?.notification?.title||message?.data?.title)||'Delivery update',body:notificationText(message?.notification?.body||message?.data?.body||message?.data?.message)};
}
