const fs=require('fs');
function edit(p,change){const before=fs.readFileSync(p,'utf8'),after=change(before);if(before===after)throw Error('No change '+p);fs.writeFileSync(p,after);}
edit('Taxido_user/src/screens/bookRide/index.tsx',s=>"import {vehicleChoices} from '../../utils/vehicleChoices';\n"+s
 .replace('data={dataList}','data={vehicleChoices(dataList)}')
 .replace('keyExtractor={(item: any) => item?.id?.toString()}','keyExtractor={(item: any) => String(item?.choice_key??item?.id)}')
 .replace('isSelected={String(vehicleIdValue ?? selectedItemData?.id) === String(item.id)}','isSelected={String(selectedItemData?.choice_key ?? vehicleIdValue ?? selectedItemData?.id) === String(item.choice_key ?? item.id)}')
 .replace('      selectedItemData?.id,\n      isExpanding,','      selectedItemData?.id,\n      selectedItemData?.choice_key,\n      isExpanding,')
 .replace("formData.append('delivery_details[goods_type]',details.goods_type);","formData.append('delivery_details[goods_type]',details.goods_type);\n        if(selectedItemData?.vehicle_choice==='scooter')formData.append('delivery_details[vehicle_choice]','scooter');"));
edit('Taxido_driver/src/screen/auth/registration/vehicleRegistration/component/renderServiceList/index.tsx',s=>s.replace('firstItem.slug, firstItem.id','firstItem.type || firstItem.slug, firstItem.id').replace('item.slug, item.id','item.type || item.slug, item.id'));
for(const app of ['Taxido_user','Taxido_driver']){
 edit(`${app}/src/utils/bookingPeople.ts`,s=>s+`\nexport function bookingPhoto(person:any):string|undefined {
  const value=person?.profile_image_url||person?.driver_profile_image_url||person?.rider_profile_image_url||person?.profile_image?.original_url||person?.profile_image?.url;
  return typeof value==='string'&&/^https?:\\/\\//i.test(value)?value:undefined;
}\n`);
}
for(const p of ['Taxido_driver/src/screen/home/otpRide/index.tsx','Taxido_user/src/screens/rideActive/index.tsx']){
 edit(p,s=>s.replace('mergeBookingSnapshot,contactPhone,parcelReceiver','mergeBookingSnapshot,contactPhone,parcelReceiver,bookingPhoto')
 .replace('mergeBookingSnapshot, contactPhone, parcelReceiver','mergeBookingSnapshot, contactPhone, parcelReceiver, bookingPhoto')
 .replace('photo={rideData?.rider?.profile_image_url}','photo={bookingPhoto(rideData?.rider)}')
 .replace('photo={activeRideOTP?.driver?.profile_image_url}','photo={bookingPhoto(activeRideOTP?.driver)}'));
}
edit('Taxido_driver/src/commonComponents/driverProfile/index.tsx',s=>s.replace('mergeBookingSnapshot, contactPhone, parcelReceiver','mergeBookingSnapshot, contactPhone, parcelReceiver, bookingPhoto').replace('rideDetails?.rider?.profile_image_url && !imageFailed','bookingPhoto(rideDetails?.rider || userDetails) && !imageFailed').replace('uri: rideDetails?.rider?.profile_image_url','uri: bookingPhoto(rideDetails?.rider || userDetails)'));
edit('Taxido_laravel/Modules/Taxido/app/Http/Resources/RideResource.php',s=>s.replace("['goods_type' => $this->delivery_details['goods_type'] ?? null]","['goods_type' => $this->delivery_details['goods_type'] ?? null, 'vehicle_choice' => $this->delivery_details['vehicle_choice'] ?? null]"));
edit('Taxido_driver/src/screen/home/mapScreen/index.tsx',s=>s.replace('icon={fabOpen ? Icons.CloseAssist : Icons.OpenAssist}',`icon={fabOpen ? Icons.CloseAssist : Icons.OpenAssist}
              accessibilityLabel={fabOpen?'Close nearby services':'Nearby services: fuel, charging, parking and repairs'}
              label={fabOpen?'Close':'Nearby'}`));
console.log('Scooter choice, registration service switching and booking photo aliases updated.');
