export type DeliveryForm = {receiverName:string;phoneNumber:string;countryCode:string;parcelWeight:string};
export function deliveryFormErrors(value:DeliveryForm, maxWeight?:number){
  const errors:Partial<Record<keyof DeliveryForm,string>>={};
  if(!value.receiverName.trim()) errors.receiverName='Enter contact name';
  const phone=value.phoneNumber.replace(/\s/g,'');
  if(!phone || (value.countryCode==='+91' ? !/^[6-9]\d{9}$/.test(phone) : !/^\d{6,15}$/.test(phone))) errors.phoneNumber='Enter a valid mobile number';
  const weight=Number(value.parcelWeight);
  if(!Number.isFinite(weight)||weight<=0) errors.parcelWeight='Enter a weight greater than zero';
  else if(maxWeight && weight>maxWeight) errors.parcelWeight='Maximum '+maxWeight+' kg allowed';
  return errors;
}
