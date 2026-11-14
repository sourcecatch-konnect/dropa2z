import {POST_API} from '../methods';
import {requireApiSuccess} from '../responseError';

export async function saveProfileUpdate(fields:any,photo:any,removePhoto=false) {
  const body=new FormData();
  body.append('name',fields.username??'');
  body.append('email',fields.email??'');
  body.append('country_code',fields.countryCode??'91');
  body.append('phone',fields.phoneNumber??'');
  body.append('_method','PUT');
  if(removePhoto)body.append('profile_image_id','');
  else if(photo?.uri)body.append('profile_image',{
    uri:photo.uri,type:photo.type||'image/jpeg',name:photo.fileName||'profile.jpg',
  } as any);
  // The shared client supplies auth and lets React Native generate the multipart boundary.
  return requireApiSuccess(await POST_API(body,'updateProfile'),'Could not save your profile. Please try again.');
}
