import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, BackHandler, ScrollView, TextInput, TouchableOpacity, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useFocusEffect, useRoute, useTheme} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Text} from '../../design/Typography';
import {DriverRequestCard} from '../../design/DriverRequestCard';
import {PickupCard} from '../../design/PickupCard';
import {Button} from '../../commonComponents';
import {GET_API, POST_API} from '../../api/methods';
import {requireApiSuccess, apiErrorMessage} from '../../api/responseError';
import {selfDriverData} from '../../api/store/action';
import {useValues} from '../../utils/context';
import {TrainingExampleScreenshot} from '../../design/TrainingExampleScreenshot';

const course=[
  {action:'accept_request',title:'Accept a delivery',body:'Read the pickup, drop and parcel details. Slide to accept this practice request.',button:'Accept practice delivery'},
  {action:'pickup_arrived',title:'Reach the pickup',body:'Check the pickup address and contact the sender if needed. Mark arrival only when you have reached the pickup.',button:'Practice: arrived at pickup'},
  {action:'pickup_pin_verified',title:'Verify the pickup PIN',body:'Ask the sender for the PIN before starting. For this practice only, enter 1234. There is one PIN at pickup.',button:'Verify practice PIN'},
  {action:'drop_arrived',title:'Reach each delivery stop',body:'Follow the booked route. At each drop, mark arrival before handing over the parcel.',button:'Practice: arrived at drop'},
  {action:'parcel_delivered',title:'Confirm the parcel handoff',body:'Give the parcel to the receiver, then tap Parcel delivered. Repeat at every stop. No extra delivery OTP is needed.',button:'Practice: parcel delivered'},
  {action:'payment_recorded',title:'Record payment and complete',body:'Confirm the payment method and amount. Mark cash received only after collecting it. Then complete the delivery and remain available for the next request.',button:'Finish practice delivery'},
];
const sample={id:-1,ride_status:{slug:'requested'},vehicle_type:{name:'Bike'},locations:['Practice pickup — your city','Practice destination — your city'],total:0,currency_symbol:'₹',delivery_details:{goods_type:'Packed documents'}};

export function DriverTraining() {
  const {colors}=useTheme(),{isDark}=useValues(),insets=useSafeAreaInsets(),dispatch=useDispatch<any>();
  const route=useRoute<any>();
  const preview=__DEV__&&Number.isInteger(route.params?.trainingPreviewStep)?Math.max(0,Math.min(5,route.params.trainingPreviewStep)):null;
  const driver=useSelector((state:any)=>state.account.selfDriver);
  const [progress,setProgress]=useState<any>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[pin,setPin]=useState('');
  const pinInputs=useRef<Array<TextInput|null>>([]);
  const required=Boolean(driver?.training?.required), verified=Number(driver?.is_verified)===1;
  const reload=useCallback(async()=>{setBusy(true);setError('');try{const response=requireApiSuccess(await GET_API('driver/training'),'Could not load training.');setProgress(response.data);}catch(error){setError(apiErrorMessage(error,'Could not load training.'));}finally{setBusy(false);}},[]);
  useEffect(()=>{if(preview!==null){setProgress({completed_steps:preview});return;}void reload();},[reload,preview]);
  useFocusEffect(useCallback(()=>{if(!required)return;const listener=BackHandler.addEventListener('hardwareBackPress',()=>true);return()=>listener.remove();},[required]));
  const index=Math.min(Number(progress?.completed_steps||0),5),step=course[index],complete=Boolean(progress?.completed_at);
  const updatePracticePin=useCallback((value:string,position:number)=>{
    const digits=value.replace(/\D/g,'').slice(0,4-position);
    setPin(previous=>{
      // Rebuild the remaining digits so a pasted PIN never leaves stale
      // characters in the following boxes.
      const next=Array.from({length:4},(_,digit)=>digit<position?(previous[digit]||''):'');
      digits.split('').forEach((digit,offset)=>{next[position+offset]=digit;});
      return next.join('');
    });
    if(digits.length){
      const nextPosition=Math.min(position+digits.length,3);
      requestAnimationFrame(()=>pinInputs.current[nextPosition]?.focus());
    }else if(position>0){
      requestAnimationFrame(()=>pinInputs.current[position-1]?.focus());
    }
  },[]);
  const handlePracticePinKeyPress=useCallback((key:string,position:number)=>{
    if(key==='Backspace'&&!pin[position]&&position>0)pinInputs.current[position-1]?.focus();
  },[pin]);
  const advance=async()=>{
    if(preview!==null){Alert.alert('Screenshot preview','This preview does not submit training progress.');return false;}
    if(busy||!progress||!verified)return false;
    if(index===2&&pin!=='1234'){setError('For this practice, enter the four digits 1234.');return false;}
    setBusy(true);setError('');
    try{
      const response=requireApiSuccess(await POST_API({step:index+1,action:step.action},'driver/training/step'),'Could not save training progress.');
      setProgress(response.data);setPin('');
      if(response.data?.completed_at)await dispatch(selfDriverData()).unwrap();
      return true;
    }catch(error){setError(apiErrorMessage(error,'Could not save training progress.'));return false;}
    finally{setBusy(false);}
  };
  const practiceContact=()=>Alert.alert('Practice only','Live call and chat controls connect you to the sender on a real accepted delivery.');
  return <View style={{flex:1,backgroundColor:colors.background,paddingTop:Math.max(insets.top,12)}}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:18,paddingBottom:Math.max(insets.bottom,16)+24,gap:16}}>
      <Text style={{fontSize:24,fontWeight:'700',color:colors.text}}>Dropa2z driver training</Text>
      <View style={{padding:14,borderRadius:14,backgroundColor:isDark?'#3A2B19':'#FFF1D9',gap:6}}><Text style={{fontWeight:'700',color:isDark?'#FFD28C':'#854500'}}>PRACTICE ONLY — no real booking or payment</Text><Text style={{color:colors.text,lineHeight:21}}>Complete this walkthrough after Admin approves your KYC to become a Dropa2z Pro Driver.</Text></View>
      {!verified?<Text style={{color:colors.text}}>Your documents are awaiting Admin verification. Training unlocks after approval.</Text>:null}
      {!!progress&&!complete&&<>
        <Text style={{color:colors.text}}>Step {index+1} of {course.length}</Text>
        <Text style={{fontSize:21,fontWeight:'700',color:colors.text}}>{step.title}</Text>
        <Text style={{fontSize:16,lineHeight:23,color:colors.text}}>{step.body}</Text>
        {index===0?<DriverRequestCard offer={sample} dark={isDark} onAccept={advance} onDecline={async()=>{Alert.alert('Practice request declined','A real declined request goes back for matching. Accept this sample to continue training.');return false;}} onExpired={()=>undefined} onDetails={()=>Alert.alert('Practice delivery','Packed documents. One pickup and one destination. This is a sample, not a live quote.')}/>:index<=2?
          <PickupCard role="driver" dark={isDark} name="Practice sender" pickup="Practice pickup — your city" onCall={practiceContact} onMessage={practiceContact}>
            {index===2&&<View style={{flexDirection:'row',gap:10}}>{[0,1,2,3].map(position=><TextInput key={position} ref={node=>{pinInputs.current[position]=node;}} accessibilityLabel={`Practice pickup PIN digit ${position+1}`} value={pin[position]||''} onChangeText={value=>updatePracticePin(value,position)} onKeyPress={({nativeEvent})=>handlePracticePinKeyPress(nativeEvent.key,position)} keyboardType="number-pad" autoComplete={position===0?'one-time-code':'off'} maxLength={4-position} selectTextOnFocus textAlign="center" selectionColor="#F58220" style={{flex:1,height:54,borderRadius:10,borderWidth:1,borderColor:colors.border,color:colors.text,fontSize:24,fontWeight:'700',padding:0}}/>)}</View>}
          </PickupCard>:
          <View style={{borderWidth:1,borderColor:colors.border,borderRadius:16,padding:18,backgroundColor:colors.card,gap:12}}><Text style={{color:'#A65B00',fontWeight:'700'}}>PRACTICE DESTINATION</Text><Text style={{color:colors.text,fontSize:18,fontWeight:'700'}}>Packed documents · 1 parcel</Text><Text style={{color:colors.text}}>Practice receiver — your city</Text><Text style={{color:colors.text}}>{index===3?'Travelling to drop':index===4?'Arrived at drop':'Parcel delivered · confirm payment'}</Text></View>}
        {index!==0&&<Button title={busy?'Saving…':step.button} loading={busy} onPress={advance}/>}
        {preview===null&&<TrainingExampleScreenshot key={index} step={index}/>}
      </>}
      {complete&&<View style={{padding:20,borderRadius:18,borderWidth:1,borderColor:colors.border,backgroundColor:colors.card,gap:10}}><Text style={{fontSize:24,fontWeight:'700',color:colors.text}}>Dropa2z Pro Driver</Text><Text style={{color:colors.text}}>Practice complete. You are ready to go online and receive delivery requests.</Text></View>}
      {!!error&&<Text accessibilityRole="alert" style={{color:'#C52F2F'}}>{error}</Text>}
      {!progress&&<Button title={busy?'Loading…':'Retry training'} loading={busy} onPress={reload}/>} 
    </ScrollView>
  </View>;
}
