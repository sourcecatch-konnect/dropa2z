const fs=require('fs'),path=require('path');
const file=path.resolve(__dirname,'../Taxido_driver/src/screen/home/homeScreen/index.tsx');
let s=fs.readFileSync(file,'utf8');
if(s.includes("import {AvailabilityConfirmation}"))throw Error('Already patched');
s="import {AvailabilityConfirmation} from '../component/AvailabilityConfirmation';\n"+s;
s=s.replace('  const current = statusColors[nextStatus]',"  const current = statusColors[isOnline ? 'online' : 'offline']");
s=s.replace('  const [isOnline, setIsOnline] = useState(false)',"  const [isOnline, setIsOnline] = useState(Number(selfDriver?.is_online) === 1)\n  const availabilityPendingRef = useRef(false)");
s=s.replace("useState<'online' | 'offline'>('online')","useState<'online' | 'offline'>(Number(selfDriver?.is_online)===1?'online':'offline')");
const start=s.indexOf('  const toggleSwitch = async () => {');
const end=s.indexOf('\n  const fetchTime = async () => {',start);
if(start<0||end<0)throw Error('Availability boundaries missing');
s=s.slice(0,start)+`
  const closeDriveroffline = () => {
    if (availabilityPendingRef.current) return
    setIsBottomSheetOfflineOpen(false)
  }

  const toggleSwitch = async () => {
    if (!driverId || availabilityPendingRef.current) return
    Vibration.vibrate(42)
    if (isOnline) {
      setIsBottomSheetOfflineOpen(true)
      return
    }
    if (!currentLatitude || !currentLongitude) {
      notificationHelper('', translateData?.locationNotAvailable || 'Location not available yet. Please wait.', 'error')
      return
    }
    availabilityPendingRef.current = true
    try {
      await dispatch(driversStatus({is_online:1,location:{lat:currentLatitude,lng:currentLongitude}})).unwrap()
      setIsOnline(true)
      setStatus('online')
      SetOn(true)
      runOnlineAnimation()
      playQuickSound()
      await dispatch(selfDriverData()).unwrap().catch(()=>null)
      await startLiveLocation(driverId,selfDriver)
      notificationHelper('', 'You are online. You can receive delivery requests now.', 'success')
    } catch (error) {
      notificationHelper('', error?.message || translateData?.failedOnline || 'Could not go online. Please try again.', 'error')
    } finally {
      availabilityPendingRef.current=false
    }
  }

  const driverOffline = async () => {
    if (!driverId || availabilityPendingRef.current) return
    availabilityPendingRef.current=true
    setOfflineLoading(true)
    try {
      const freshSelf=await dispatch(selfDriverData()).unwrap()
      if (Number(freshSelf?.is_online)!==1) {
        setIsOnline(false)
        setStatus('offline')
        stopLiveLocation()
        setIsBottomSheetOfflineOpen(false)
        return
      }
      if (Number(freshSelf?.is_on_ride)===1) {
        notificationHelper('', 'A delivery is active. Complete or cancel it before going offline.', 'error')
        setIsBottomSheetOfflineOpen(false)
        return
      }
      await dispatch(driversStatus({is_online:0,location:{lat:currentLatitude,lng:currentLongitude}})).unwrap()
      setIsOnline(false)
      setStatus('offline')
      setIsBottomSheetOfflineOpen(false)
      stopLiveLocation()
      SetOn(true)
      runOnlineAnimation()
      playQuickSound()
      await dispatch(selfDriverData()).unwrap().catch(()=>null)
      notificationHelper('', 'You are offline. Go online when ready for delivery requests.', 'success')
    } catch (error) {
      notificationHelper('', error?.message || translateData?.failedOnline || 'Could not change your status. Please try again.', 'error')
    } finally {
      availabilityPendingRef.current=false
      setOfflineLoading(false)
    }
  }
`+s.slice(end);
// Only replace the availability sheet, leaving request, cancellation and SOS sheets intact.
const sheetRef=s.indexOf('          ref={bottomSheetOfflineRef}');
const sheetStart=s.lastIndexOf('      <BottomSheetModalProvider>',sheetRef);
const sheetEnd=s.indexOf('      </BottomSheetModalProvider>',sheetRef)+'      </BottomSheetModalProvider>'.length;
if(sheetStart<0||sheetEnd<sheetStart)throw Error('Offline sheet missing');
s=s.slice(0,sheetStart)+`      <AvailabilityConfirmation visible={isBottomSheetOfflineOpen} busy={offlineloading} dark={isDark}
        title={translateData?.offlineMsg || 'Are you sure you want to go offline?'}
        cancelLabel={translateData?.cancel || 'Cancel'} confirmLabel={translateData?.confirm || 'Confirm'}
        onCancel={closeDriveroffline} onConfirm={driverOffline}/>`+s.slice(sheetEnd);
s=s.replace('                onPress={toggleSwitch}',`                accessibilityRole="button"
                accessibilityLabel={isOnline ? 'Online. Tap to go offline' : 'Offline. Tap to go online'}
                onPress={toggleSwitch}`);
s=s.replace('                {current.icon}',`                <View style={{alignItems:'center',gap:2}}>{current.icon}<Text style={{color:'#FFFFFF',fontSize:11,fontWeight:'700'}}>{isOnline?'Online':'Offline'}</Text></View>`);
fs.writeFileSync(file,s);
console.log('Availability label, server-confirmed transitions and native confirmation modal updated.');
