import React, {useEffect, useState} from 'react';
import {ScrollView, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useTheme} from '@react-navigation/native';
import {ReferenceScreen} from '../../../design/ReferenceChrome';
import {Text} from '../../../design/Typography';
import {Header, Input, Button, notificationHelper} from '../../../commonComponents';
import {RenderServiceList} from '../../auth/registration/vehicleRegistration/component/renderServiceList';
import {RenderCategoryReg} from '../../auth/registration/vehicleRegistration/component/rendercategoryReg';
import {RenderVehicleList} from '../../auth/registration/vehicleRegistration/component/renderVehicleList';
import {validateVehicleNumber} from '../../../utils/validation';
import {updateVehicleRegis} from '../../../api/services/accountService';
import {requireApiSuccess, apiErrorMessage} from '../../../api/responseError';
import {selfDriverData} from '../../../api/store/action';
import {RegistrationVehicleGallery} from '../../../design/RegistrationVehicleGallery';

export function VehicleDetail() {
  const {colors}=useTheme(), dispatch=useDispatch<any>();
  const driver=useSelector((state:any)=>state.account.selfDriver);
  const services=useSelector((state:any)=>state.service.serviceData?.data)||[];
  const types=useSelector((state:any)=>state.vehicleType.vehicleTypedata?.data)||[];
  const locked=Number(driver?.is_verified)===1;
  const [service,setService]=useState<any>(null), [category,setCategory]=useState<any>(null), [vehicle,setVehicle]=useState<any>(null);
  const [categoryName,setCategoryName]=useState(''), [vehicleName,setVehicleName]=useState('');
  const [model,setModel]=useState(''),[plate,setPlate]=useState(''),[color,setColor]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [showGuide,setShowGuide]=useState(false);
  useEffect(()=>{
    if(!driver)return;
    const info=driver.vehicle_info;
    setService(driver.service_id);setCategory(driver.service_category_id);setVehicle(info?.vehicle_type_id);
    setModel(info?.model||info?.name||'');setPlate(info?.plate_number||'');setColor(info?.color||'');
    setCategoryName(driver.service_category?.name||'');setVehicleName(info?.vehicle_type?.name||info?.vehicle_type_name||info?.name||'');
  },[driver]);
  const slug=services.find((item:any)=>String(item.id)===String(service))?.type||services.find((item:any)=>String(item.id)===String(service))?.slug;
  const save=async()=>{
    if(busy||locked)return;
    const problem=validateVehicleNumber(plate)||(!model.trim()?'Enter your vehicle model.':'')||(!color.trim()?'Enter the vehicle colour.':'')||(!service||!category||!vehicle?'Select a service, category and vehicle type.':'');
    setError(problem);if(problem)return;
    setBusy(true);
    try {
      const selected=types.find((item:any)=>String(item.id)===String(vehicle));
      requireApiSuccess(await updateVehicleRegis({service,service_category:category,vehicle_type_id:vehicle,vehicle_name:model.trim(),model:model.trim(),plate_number:plate.trim().toUpperCase(),color:color.trim(),seat:Number(selected?.seat||driver?.vehicle_info?.seat||1)} as any),'Could not save vehicle registration.');
      await dispatch(selfDriverData()).unwrap();
      notificationHelper('','Vehicle registration saved.','success');
    } catch(error) {setError(apiErrorMessage(error,'Could not save vehicle registration.'));}
    finally {setBusy(false);}
  };
  return <ReferenceScreen><View style={{flex:1}}><Header title="Vehicle Registration"/>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:16,paddingBottom:40,gap:14}}>
      <View style={{padding:18,borderRadius:18,borderWidth:1,borderColor:colors.border,backgroundColor:colors.card,gap:14}}>
        <Text style={{fontSize:22,fontWeight:'700',color:colors.text}}>Your delivery vehicle</Text>
        {locked ? <>
          <Text style={{color:colors.text,lineHeight:21}}>This vehicle is verified. Contact Admin to request a vehicle change and document review.</Text>
          {[['Model',model],['Registration number',plate],['Colour',color],['Vehicle type',vehicleName||driver?.vehicle_info?.vehicle_type?.name||'Registered vehicle'],['Status','Verified']].map(([label,value])=><View key={label} style={{paddingVertical:8,gap:5}}><Text style={{color:colors.text,fontSize:12}}>{label}</Text><Text style={{color:colors.text,fontSize:17,fontWeight:'700'}}>{value||'Not provided'}</Text></View>)}
          <Button title={showGuide?'Hide vehicle photo guide':'View vehicle photo guide'} onPress={()=>setShowGuide(value=>!value)}/>
          {showGuide&&<RegistrationVehicleGallery vehicles={[]} readOnly onSelect={()=>undefined}/>}
        </> : <>
          <Text style={{color:colors.text}}>Service</Text>
          <RenderServiceList serviceId={service} selectedItemIndex={null} handleItemPress={(_i:number,_slug:string,id:number)=>{setService(id);setCategory(null);setVehicle(null);setCategoryName('');setVehicleName('');}}/>
          <Text style={{color:colors.text}}>Delivery category</Text>
          <RenderCategoryReg selectedService={slug} selectedCategory={categoryName} handleItemPress={(_i:number,name:string,id:number)=>{setCategory(id);setCategoryName(name);setVehicle(null);setVehicleName('');}}/>
          <Text style={{color:colors.text}}>Vehicle type</Text>
          <RenderVehicleList onSelectCategory={(_i:number,name:string,id:number)=>{setCategory(id);setCategoryName(name);setVehicle(null);setVehicleName('');}} serviceId={service} categoryId={category} selectedVehicle={vehicleName} handleItemPress={(_i:number,name:string,id:number)=>{setVehicle(id);setVehicleName(name);}}/>
          <Input titleShow title="Vehicle model" value={model} onChangeText={setModel} placeholder="Enter vehicle model" backgroundColor={colors.card}/>
          <Input titleShow title="Registration number" value={plate} onChangeText={(value:string)=>setPlate(value.toUpperCase())} placeholder="MH19AB1234" backgroundColor={colors.card}/>
          <Input titleShow title="Colour" value={color} onChangeText={setColor} placeholder="Vehicle colour" backgroundColor={colors.card}/>
          {!!error&&<Text accessibilityRole="alert" style={{color:'#C42E2E'}}>{error}</Text>}
          <Button title="Save vehicle registration" loading={busy} onPress={save}/>
        </>}
      </View>
    </ScrollView>
  </View></ReferenceScreen>;
}
