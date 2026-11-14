import {URL} from '../api/config';
import {apiErrorMessage} from '../api/responseError';
import {validateDocumentFile} from './documentUpload';

/** The final KYC step submits one registration containing all previous steps. */
export async function registerDriver(account:any, vehicle:any, documents:any, fcmToken='') {
  if(!vehicle?.serviceName||!vehicle?.vehicleType)throw new Error('Complete vehicle registration before uploading KYC documents.');
  const form=new FormData();
  const fields:Record<string,any>={name:account?.name,email:account?.email,country_code:account?.countryCode?.callingCode?.[0]||'91',phone:account?.phoneNumber,
    verification_type:account?.verifiedChannel||'phone',verification_token:account?.verificationToken,google_id_token:account?.googleIdToken,
    password:account?.password,password_confirmation:account?.confirmPassword,referral_code:account?.referral,country_name:account?.countryName,
    service_id:vehicle.serviceName,service_category_id:vehicle.serviceCategory,'vehicle[vehicle_type_id]':vehicle.vehicleType,
    'vehicle[model]':vehicle.vehicleName,'vehicle[plate_number]':vehicle.vehicleNumber,'vehicle[color]':vehicle.vehicleColor,'vehicle[seat]':vehicle.maximumSeats||'1',fcm_token:fcmToken};
  Object.entries(fields).forEach(([key,value])=>{if(value!==undefined&&value!==null&&value!=='')form.append(key,String(value));});
  (vehicle.preferences||[]).forEach((value:any,index:number)=>form.append(`preferences[${index}]`,value));
  Object.entries(documents||{}).forEach(([slug,value]:[string,any],index)=>{
    if(!value?.file)return;
    validateDocumentFile(value.file);
    form.append(`documents[${index}][slug]`,slug);
    form.append(`documents[${index}][file]`,value.file);
    if(value.expiryDate)form.append(`documents[${index}][expired_at]`,value.expiryDate instanceof Date?value.expiryDate.toISOString().slice(0,10):String(value.expiryDate));
  });
  const response=await fetch(`${URL}/api/driver/register`,{method:'POST',headers:{Accept:'application/json'},body:form});
  const data=await response.json();
  if(!response.ok||data?.success!==true||!data?.access_token)throw new Error(apiErrorMessage(data,'Could not submit driver registration.'));
  return data;
}
