import React from 'react';
import {View} from 'react-native';
import {appFonts} from '@src/themes';
import {BottomSheetTextInput} from '@gorhom/bottom-sheet';
import {Text} from '../../../design/Typography';
import {CardHeading} from '../../../design/CardHeading';
import {PictureCargo} from '../../outStation/Freight/pictureCargo';
import {DeliveryForm} from '../../../utils/deliveryForm';
import {WeightPresets} from '../../../components/weightPresets';
export function DeliveryDetailsFields({value,onChange,image,onImage,dark,errors,disabled}:{value:DeliveryForm;onChange:(key:keyof DeliveryForm,value:string)=>void;image:any;onImage:(image:any)=>void;dark:boolean;errors:Partial<Record<keyof DeliveryForm,string>>;disabled:boolean}){
 const ink=dark?'#FFFFFF':'#202329';
 return <View style={{margin:16,padding:16,borderRadius:18,borderWidth:1,borderColor:dark?'#444950':'#DFE3E8',backgroundColor:dark?'#25282D':'#FFFFFF'}}>
  <CardHeading icon="package" title="Delivery details"/>
  {([['receiverName','Contact name','default'],['phoneNumber','Contact number','phone-pad'],['parcelWeight','Weight (kg)','decimal-pad']] as const).map(([key,label,keyboard])=><View key={key} style={{marginTop:12}}>
   <Text style={{color:ink,marginBottom:6}}>{label}</Text>
   {key==='parcelWeight'&&<WeightPresets value={value.parcelWeight} onChange={weight=>onChange('parcelWeight',weight)} dark={dark} disabled={disabled}/>}
   {key!=='parcelWeight'&&<View style={{flexDirection:'row',alignItems:'center',gap:8}}>
    {key==='phoneNumber'&&<BottomSheetTextInput accessibilityLabel="Country dialling code" value={value.countryCode} editable={!disabled} onChangeText={text=>onChange('countryCode',text)} keyboardType="phone-pad" style={{fontFamily:appFonts.regular,width:62,minHeight:48,borderWidth:1,borderColor:'#9DA4AE',borderRadius:10,color:ink,padding:8}}/>}
    <BottomSheetTextInput accessibilityLabel={label} placeholder={label} placeholderTextColor={dark?'#B9C0C9':'#737B85'} value={value[key]} editable={!disabled} onChangeText={text=>onChange(key,text)} keyboardType={keyboard} style={{fontFamily:appFonts.regular,flex:1,minWidth:0,minHeight:48,borderWidth:1,borderColor:errors[key]?'#C83832':'#9DA4AE',borderRadius:10,color:ink,paddingHorizontal:12}}/>
   </View>}
   {!!errors[key]&&<Text accessibilityRole="alert" style={{color:dark?'#FFAAA4':'#B42318',marginTop:4}}>{errors[key]}</Text>}
  </View>)}
  {!disabled&&<PictureCargo onImageSelect={onImage} service_name="parcel" imageUri={image?.[0]?.uri}/>}
 </View>;
}
