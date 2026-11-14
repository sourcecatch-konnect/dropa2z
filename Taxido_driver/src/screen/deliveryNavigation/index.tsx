import React, {useEffect, useRef, useState} from 'react';
import {NativeModules, PermissionsAndroid, Platform, TurboModuleRegistry, View} from 'react-native';
import {useRoute} from '@react-navigation/native';
import {Header, Button} from '../../commonComponents';
import {ReferenceScreen} from '../../design/ReferenceChrome';
import {Text} from '../../design/Typography';
import {useValues} from '../../utils/context';

const messages: Record<string,string> = {
  notAuthorized:'Navigation is not authorized. Check Navigation SDK, billing and the Android package/signing restrictions for the Driver key.',
  termsNotAccepted:'Accept Google navigation terms to start guidance.',
  networkError:'Navigation could not connect. Check your internet connection and retry.',
  locationPermissionMissing:'Allow location access to start navigation.',
  locationDisabled:'Turn on precise location and wait for a GPS fix, then retry.',
  LOCATION_DISABLED:'Turn on precise location and wait for a GPS fix, then retry.',
  LOCATION_UNKNOWN:'GPS is not ready. Wait for a precise location and retry.',
  QUOTA_CHECK_FAILED:'Google navigation quota is unavailable. Please contact support.',
};

/** Lazy-load the native SDK so an older debug shell shows a useful message rather than crashing. */
export function DeliveryNavigation() {
  const {params} = useRoute<any>();
  const {isDark} = useValues();
  const supported = Boolean(NativeModules.NavModule || TurboModuleRegistry.get('NavModule'));
  const points = Array.isArray(params?.destinations) ? params.destinations : [];
  const valid = points.length > 0 && points.every((p:any) => Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)) && Math.abs(Number(p.lat))<=90 && Math.abs(Number(p.lng))<=180);
  if (!supported || !valid) return <ReferenceScreen><Header title="Delivery Navigation"/><Text accessibilityRole="alert" style={{padding:24,color:isDark?'#FFFFFF':'#17191C'}}>{!supported?'Install the updated Driver debug app to use integrated navigation.':'This delivery has no valid navigation destination. Return to the booking and refresh its details.'}</Text></ReferenceScreen>;
  const sdk = require('@googlemaps/react-native-navigation-sdk');
  return <sdk.NavigationProvider termsAndConditionsDialogOptions={{title:'Dropa2z Navigation',companyName:'Dropa2z',showOnlyDisclaimer:false}} taskRemovedBehavior={sdk.TaskRemovedBehavior.QUIT_SERVICE}>
    <Guidance sdk={sdk} points={points} title={params?.title || 'Delivery Navigation'}/>
  </sdk.NavigationProvider>;
}

function Guidance({sdk,points,title}:any) {
  const {isDark} = useValues();
  const {navigationController,setOnLocationChanged,setOnArrival,setOnRemainingTimeOrDistanceChanged,removeAllListeners} = sdk.useNavigation();
  const [status,setStatus] = useState('Preparing navigation…');
  const [error,setError] = useState('');
  const [ready,setReady] = useState(false);
  const [progress,setProgress] = useState('');
  const [attempt,setAttempt] = useState(0);
  const routing = useRef(false);
  const initialized = useRef(false);
  const locationSeen = useRef(false);
  useEffect(() => {
    let active=true;
    routing.current=false;initialized.current=false;locationSeen.current=false;setReady(false);setError('');setStatus('Preparing navigation…');
    const startRoute = async () => {
      if(!active || !initialized.current || routing.current)return;
      routing.current=true;
      try {
        const result = await navigationController.setDestinations(points.map((point:any,index:number)=>({title:point.title || `Drop ${index+1}`,position:{lat:Number(point.lat),lng:Number(point.lng)}})),{routingOptions:{travelMode:sdk.TravelMode.DRIVING},displayOptions:{showDestinationMarkers:true}});
        if(result!==sdk.RouteStatus.OK)throw new Error(messages[result] || `A route could not be calculated (${result}).`);
        await navigationController.setAudioGuidanceType(sdk.AudioGuidance.VOICE_ALERTS_AND_GUIDANCE);
        await navigationController.startGuidance();
        if(active){setReady(true);setStatus('Voice guidance is on');}
      }catch(e:any){routing.current=false;if(active)setError(e?.message || 'Could not start guidance.');}
    };
    setOnLocationChanged(()=>{locationSeen.current=true;void startRoute();});
    setOnRemainingTimeOrDistanceChanged((value:any)=>{if(active)setProgress(`${Math.max(1,Math.ceil(value.seconds/60))} min · ${(value.meters/1000).toFixed(1)} km`);});
    setOnArrival((event:any)=>{if(active)setStatus(event.isFinalDestination?'Destination reached. Return to the delivery to confirm the parcel handoff.':'Stop reached. Confirm its parcel handoff before continuing.');void navigationController.stopGuidance();});
    void (async()=>{
      try {
        if(Platform.OS==='android'){
          const granted=await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
          if(granted!==PermissionsAndroid.RESULTS.GRANTED)throw new Error(messages.locationPermissionMissing);
        }
        const accepted=await navigationController.showTermsAndConditionsDialog();
        if(!accepted)throw new Error(messages.termsNotAccepted);
        const result=await navigationController.init();
        if(!active)return;
        if(result!==sdk.NavigationSessionStatus.OK)throw new Error(messages[result] || `Navigation could not initialize (${result}).`);
        initialized.current=true;
        await navigationController.startUpdatingLocation();
        setStatus('Navigation authorized. Waiting for a precise GPS location…');
        console.info('[Dropa2zNavigation] SDK authorized');
        if(locationSeen.current)void startRoute();
      }catch(e:any){if(active)setError(e?.message || 'Navigation initialization failed.');}
    })();
    return ()=>{active=false;removeAllListeners();['stopUpdatingLocation','stopGuidance','cleanup'].forEach(method=>{void Promise.resolve().then(()=>navigationController[method]()).catch(()=>{});});};
  },[attempt]);
  return <ReferenceScreen>
    <Header title={title}/>
    <View style={{padding:16,gap:12}}>
      <Text accessibilityRole={error?'alert':'text'} style={{color:error?'#D64557':isDark?'#FFFFFF':'#17191C'}}>{error || status}</Text>
      {!!progress && <Text style={{fontWeight:'700',color:isDark?'#FFBE60':'#A64B00'}}>{progress}</Text>}
      {!!error && <Button title="Retry navigation" onPress={()=>setAttempt(n=>n+1)} backgroundColor="#FC9F03" color="#17191C"/>}
    </View>
    {!error && <sdk.NavigationView style={{flex:1}} androidStylingOptions={{primaryDayModeThemeColor:'#FC9F03',secondaryDayModeThemeColor:'#17191C',primaryNightModeThemeColor:'#17191C'}}/>}
  </ReferenceScreen>;
}
