import {DeliveryBackButton} from '../../../design/DeliveryBackButton';
import {useKeyboardState} from '../../../utils/useKeyboardState';
import {View, Image, Platform, PermissionsAndroid, Keyboard, TouchableOpacity, Alert, BackHandler, Linking, AppState} from 'react-native';
import {PickupCard} from '../../../design/PickupCard';
import {pickupStartedAt} from '../../../utils/journeyPresentation';
import {mergeBookingSnapshot,contactPhone,parcelReceiver,bookingPhoto} from '../../../utils/bookingPeople';
import {rideDataGet as readPickupRide} from '../../../api/services/rideService';
import {pickupRoute,startedPickup} from '../../../utils/pickupVerification';
import {Text} from '../../../design/Typography';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import appColors from '../../../theme/appColors'
import { useNavigation, useTheme, useRoute, useFocusEffect, useIsFocused } from '@react-navigation/native'
import styles from './styles'
import { BackButton, Button, notificationHelper } from '../../../commonComponents'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../../../navigation/main/types'
import { useValues } from '../../../utils/context'
import { useDispatch, useSelector } from 'react-redux'
import { cancelationDataGet, rideDataGets, rideDataPut, rideStartData } from '../../../api/store/action/index'
import GetLocation from 'react-native-get-location'
import BottomSheet, { BottomSheetBackdrop, BottomSheetModal, BottomSheetView, BottomSheetScrollView, BottomSheetTextInput, BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import appFonts from '../../../theme/appFonts'
import { fontSizes, windowHeight, windowWidth } from '../../../theme/appConstant'
import images from '../../../utils/images/images'
import { ArrivedMap } from '../../../commonComponents/maps/arrivedMap'
import Animated, { useAnimatedStyle, interpolate, Extrapolate } from 'react-native-reanimated'
import { AppDispatch } from '../../../api/store'
import getEchoInstance from '../../../utils/echo'
import NativeAdComponent from '../../../commonComponents/ads/google/NativeAdCard'


const CustomBackdrop = ({ animatedIndex, style }: BottomSheetBackdropProps) => {
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedIndex.value,
      [-1, 0],
      [0, 0.5],
      Extrapolate.CLAMP,
    ),
  }))

  const containerStyle = useMemo(
    () => [style, containerAnimatedStyle],
    [style, containerAnimatedStyle],
  )

  return <Animated.View style={containerStyle} pointerEvents="box-none" />
}

type navigation = NativeStackNavigationProp<RootStackParamList>

export function OtpRide() {
  const navigation = useNavigation<navigation>()
  const { colors } = useTheme()
  const { viewRtlStyle, isDark } = useValues()
  const route = useRoute()
  const {ride: routeRide,id: ride_Id} = pickupRoute(route.params)
  const [pickupSnapshot,setPickupSnapshot]=useState<any>(null)
  const rideData=mergeBookingSnapshot(routeRide||{id:ride_Id},pickupSnapshot)
  const focused=useIsFocused()
  const verifyInFlight=useRef(false)
  const arrival=useRef<{id:any;since?:number}>({id:ride_Id})
  if(arrival.current.id!==ride_Id)arrival.current={id:ride_Id}
  if(!arrival.current.since)arrival.current.since=pickupStartedAt(rideData)
  const receiver=parcelReceiver(rideData),receiverPhone=contactPhone(receiver)
  const senderPhone=contactPhone(rideData?.rider)
  const goods=rideData?.delivery_details?.goods_type||rideData?.description
  const [enteredOtp, setEnteredOtp] = useState('')
  const dispatch = useDispatch<AppDispatch>()
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const markerRef = useRef<any>(null)
  const previousLocation = useRef<any>(null)
  const { selfDriver } = useSelector((state: any) => state.account)
  const Driver_Id = selfDriver?.id
  const [driverTrack, setDriverTrack] = useState<any>()
  const updatedLocation = rideData?.location_coordinates?.map((coord: any) => ({
    latitude: parseFloat(coord.lat),
    longitude: parseFloat(coord.lng),
  }))
  const { translateData, taxidoSettingData } = useSelector((state: any) => state.setting)
  const [verifyLoader, setVerifyLoader] = useState(false)
  const [cancelLoader, setCancelloader] = useState(false)
  const { canceldata } = useSelector((state: any) => state.cancelationReason)
  const snapCancelReason = useMemo(() => ['40%'], [])
  const cancelReasonRef = useRef<BottomSheetModal>(null)
  const otpInputs = useRef<Array<any>>([])
  const pickupScrollRef=useRef<any>(null)
  const pickupContentRef=useRef<View>(null)
  const pickupPinRef=useRef<View>(null)
  const revealPickupPin=useCallback(()=>{
    requestAnimationFrame(()=>{
      const parent=pickupContentRef.current;
      if(parent)pickupPinRef.current?.measureLayout(parent,(_x,y)=>pickupScrollRef.current?.scrollTo({y:Math.max(0,y-12),animated:true}),()=>{});
    });
  },[])
  const [selectedReason, setSelectedReason] = useState<any>(null)
  const [cancelLoaders, setCancelLoaders] = useState<boolean>(false)
  const {visible:sheetExpend}=useKeyboardState();


  const otpSnapPoints = useMemo(() => ['50%', '82%'], []);

  useEffect(()=>{
    if(!ride_Id||!focused)return;
    let alive=true,busy=false;
    const refresh=async()=>{if(busy||AppState.currentState!=='active')return;busy=true;try{const response=await readPickupRide(Number(ride_Id));if(alive)setPickupSnapshot(previous=>mergeBookingSnapshot(Number(previous?.id)===ride_Id?previous:{id:ride_Id},response));}catch{/* Keep the last confirmed pickup on connection failure. */}finally{busy=false;}};
    void refresh();const timer=setInterval(refresh,15000);const listener=AppState.addEventListener('change',state=>{if(state==='active')void refresh();});
    return()=>{alive=false;clearInterval(timer);listener.remove();};
  },[ride_Id,focused]);

  useEffect(()=>{setEnteredOtp('');setPickupSnapshot(null);},[ride_Id]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('TabNav')
        return true
      }

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      )

      return () => subscription.remove()
    }, [navigation]),
  )

  useEffect(()=>{if(sheetExpend)revealPickupPin();},[sheetExpend,revealPickupPin]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => <CustomBackdrop {...props} />,
    [],
  )

  const updatePickupPin = useCallback((value: string, position: number) => {
    // Android pastes the whole PIN into the focused field. Split it across
    // the four visible boxes so a copied PIN stays readable and usable.
    const digits = value.replace(/\D/g, '').slice(0, 4 - position)
    setEnteredOtp(previous => {
      const next = Array.from({ length: 4 }, (_item, index) =>
        index < position ? previous[index] || '' : '',
      )
      digits.split('').forEach((digit, offset) => {
        next[position + offset] = digit
      })
      return next.join('')
    })
    if (digits.length) {
      const nextPosition = Math.min(position + digits.length, 3)
      requestAnimationFrame(() => otpInputs.current[nextPosition]?.focus?.())
    } else if (position > 0) {
      requestAnimationFrame(() => otpInputs.current[position - 1]?.focus?.())
    }
  }, [])

  const handlePickupPinKeyPress = useCallback((key: string, position: number) => {
    if (key === 'Backspace' && !enteredOtp[position] && position > 0) {
      otpInputs.current[position - 1]?.focus?.()
    }
  }, [enteredOtp])

  useEffect(() => {
    const ride_start = 'before'
    dispatch(cancelationDataGet({ ride_start }))
  }, [])


  useEffect(() => {
    if (!ride_Id) return;

    let echoInstance: any = null;

    const setupEcho = async () => {
      try {
        echoInstance = await getEchoInstance();
        if (!echoInstance) return;

        echoInstance.private(`ride-status.${ride_Id}`)
          .listen('.ride.status', (data: any) => {
            const statusData = data?.ride || data?.data?.data || data?.data || data;
            if(String(statusData?.id)!==String(ride_Id))return;
            setPickupSnapshot(previous=>mergeBookingSnapshot(previous||routeRide,statusData));

            if (statusData?.ride_status?.slug === 'cancelled' || statusData?.status === 'cancelled') {
              navigation.navigate('TabNav');
              dispatch(rideDataGets());
              notificationHelper('', translateData.rideCancelled || 'Delivery Cancelled', 'error');
            }
          });
      } catch (err) {
        console.error('[OtpRide] Echo error:', err);
      }
    };

    setupEcho();

    return () => {
      if (echoInstance) {
        echoInstance.leave(`ride-status.${ride_Id}`);
      }
    };
  }, [ride_Id]);

  const calculateBearing = (startLat: number, startLng: number, endLat: number, endLng: number) => {
    const toRadians = (degree: any) => degree * (Math.PI / 180)
    const toDegrees = (radian: any) => radian * (180 / Math.PI)
    const lat1 = toRadians(startLat)
    const lat2 = toRadians(endLat)
    const dLng = toRadians(endLng - startLng)
    const y = Math.sin(dLng) * Math.cos(lat2)
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
    const bearing = toDegrees(Math.atan2(y, x))
    return (bearing + 360) % 360
  }

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        )
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          startTrackingLocation()
        }
      } catch (err) {
      }
    } else {
      startTrackingLocation()
    }
  }

  const startTrackingLocation: any = () => {
    getCurrentLocation()
    const locationInterval = setInterval(() => {
      getCurrentLocation()
    }, 1000)
    return () => clearInterval(locationInterval)
  }

  const getCurrentLocation = () => {
    GetLocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
    })
      .then(loc => {
        const newLocation = {
          latitude: loc.latitude,
          longitude: loc.longitude,
        }
        if (previousLocation.current) {
          const newHeading = calculateBearing(
            previousLocation.current.latitude,
            previousLocation.current.longitude,
            newLocation.latitude,
            newLocation.longitude,
          )
        }
        animateMarker(newLocation)
        previousLocation.current = newLocation
      })
      .catch(error => {
        const { code, message } = error
      })
  }

  const animateMarker = (newLocation: any) => {
    if (markerRef.current) {
      markerRef.current.animateMarkerToCoordinate(newLocation, 500)
    }
  }

  useEffect(() => {
    requestLocationPermission()
    return () => clearInterval(startTrackingLocation)
  }, [])

  useEffect(() => {
    if (enteredOtp.length === 4) Keyboard.dismiss()
  }, [enteredOtp])

  useEffect(() => {
    if (isRunning && startTime) {
      const timerInterval = setInterval(() => {
        const now = new Date()
        const secondsGap = Math.floor(
          (now.getTime() - startTime.getTime()) / 1000,
        )
        setElapsedSeconds(secondsGap)
      }, 1000)
      return () => clearInterval(timerInterval)
    }
  }, [isRunning, startTime])

  const formatTime = (date: Date) => {
    return date.toTimeString().slice(0, 8)
  }

  const startTimer = () => {
    const now = new Date()
    setStartTime(now)
    setElapsedSeconds(0)
    setIsRunning(true)
    return now
  }

  const otpSheetRef = useRef<BottomSheet>(null)
  const successSheetRef = useRef<BottomSheet>(null)
  const successSnapPoints = useMemo(() => ['42%'], [])

  const closeOtpSheet = () => {
    otpSheetRef.current?.close()
  }

  const openSuccessSheet = () => {
    successSheetRef.current?.expand()
  }

  const closeSuccessSheet = () => {
    successSheetRef.current?.close()
  }

  const gotocomplete = () => {
    if (rideData?.service?.service_type === 'finddriver') {
      closeSuccessSheet()
      navigation.navigate('TabNav')
      dispatch(rideDataGets())
      notificationHelper('', 'Trip started.Have a safe driving!', 'success')
      return;
    }
    if (rideData?.service_category?.service_category_type == 'rental') {
      navigation.navigate('TabNav')
      dispatch(rideDataGets())
      notificationHelper('', translateData.vehicleAssign, 'success')
    } else {
      closeSuccessSheet()
      navigation.navigate('RideComplete', { rideData })
      dispatch(rideDataGets())
    }
  }

  const verifyOTP = async (otp: string) => {
    if(verifyInFlight.current)return;
    if(!ride_Id){notificationHelper('','Could not identify this delivery. Open it again from Active deliveries.','error');return;}
    if(!/^\d{4}$/.test(otp||'')){notificationHelper('',translateData.otpInvalid||'Enter the 4-digit pickup PIN.','error');return;}
    verifyInFlight.current=true
    setVerifyLoader(true)

    const now = startTimer()

    if (!startTime) {
      setStartTime(now)
    }

    let driverLocation = null

    const payload: any = {
      ride_id: ride_Id,
      otp: otp,
      start_time: formatTime(startTime || now),
      start_ride_locations: ["Start Delivery"],
      start_ride_coordinates: [driverLocation],
    }

    dispatch(rideStartData(payload))
      .unwrap()
      .then(async res => {

        if (startedPickup(res,ride_Id)) {
          setPickupSnapshot(previous=>mergeBookingSnapshot(previous||{id:ride_Id},res?.data||res))
          setVerifyLoader(false)
          closeOtpSheet()
          if (rideData?.service?.service_type == 'finddriver') {
            dispatch(rideDataGets())
            navigation.navigate('TabNav')
            notificationHelper('', 'Trip started.Have a safe driving!', 'success')
          } else {
            openSuccessSheet()
          }
        } else {
          setVerifyLoader(false)
          notificationHelper('', 'The server did not confirm that this delivery started. Please refresh the delivery and try again.', 'error')
        }
      })
      .catch(error => {
        setVerifyLoader(false)
        notificationHelper('',error?.message||translateData.otpInvalid||'Could not verify the pickup PIN. Please try again.','error')
      })
      .finally(()=>{verifyInFlight.current=false;setVerifyLoader(false)})
  }

  const cancelOpen = () => {
    setCancelloader(true)
    successSheetRef.current?.close()
    otpSheetRef.current?.close()
    cancelReasonRef.current?.snapToIndex(1)
  }

  const cancelRide = (item: any) => {
    setCancelLoaders(true)
    dispatch(
      rideDataPut({
        status: 'cancelled',
        cancellation_reason: item?.title,
        ride_id: ride_Id,
      }),
    ).then(async (res: any) => {
      navigation.navigate('TabNav')
      setCancelloader(false)
      setCancelLoaders(false)
    })
    setCancelloader(false)
    setCancelLoaders(false)
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapSection}>
        <ArrivedMap
          Pickuplocation={rideData?.location_coordinates?.[0]}
          driverId={Driver_Id}
        />
      </View>
      <View style={styles.extraSection}></View>
      <DeliveryBackButton/>
      {/* <View style={styles.greenSection}> */}
      <BottomSheet
        ref={otpSheetRef}
        index={1}
        snapPoints={otpSnapPoints}
        enableDynamicSizing={false}
        keyboardBehavior="fillParent"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        enablePanDownToClose={false}
        enableHandlePanningGesture={true}
        enableContentPanningGesture={true}
        handleIndicatorStyle={{
          backgroundColor: appColors.primary,
          width: '13%',
        }}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: isDark ? appColors.bgDark : appColors.white,
        }}
      >
        <BottomSheetScrollView
          ref={pickupScrollRef}
          style={{flex:1}}
          contentContainerStyle={styles.additionalSection}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          <View ref={pickupContentRef} collapsable={false}>
          <PickupCard role="driver" dark={isDark} name={rideData?.rider?.name} photo={bookingPhoto(rideData?.rider)} pickup={rideData?.locations?.[0]} since={arrival.current.since} onCall={senderPhone?()=>Linking.openURL('tel:'+senderPhone).catch(()=>undefined):undefined} onMessage={rideData?.rider?.id?()=>navigation.navigate('Chat',{driverId:rideData?.driver?.id||Driver_Id,riderId:rideData?.rider?.id,rideId:rideData?.id,riderName:rideData?.rider?.name,riderImage:rideData?.rider?.profile_image_url}):undefined}>
            {!!goods&&<Text style={{fontSize:13,lineHeight:20,color:colors.text}}>Goods: {goods}</Text>}
            {!!receiver&&<View style={{gap:5,marginTop:8}}><Text style={{fontSize:13,color:colors.text}}>Receiver: {receiver.name||receiver.receiver_name||'Not provided'}</Text>{!!receiverPhone&&<TouchableOpacity accessibilityRole="button" accessibilityLabel="Call parcel receiver" onPress={()=>Linking.openURL('tel:'+receiverPhone).catch(()=>undefined)} style={{minHeight:40,justifyContent:'center'}}><Text style={{color:appColors.primary}}>Call receiver ? {receiverPhone}</Text></TouchableOpacity>}</View>}
          <View ref={pickupPinRef} collapsable={false} style={{padding:16,borderWidth:1,borderColor:colors.border,borderRadius:20,gap:12,backgroundColor:colors.card}}>
            <Text style={[styles.timing,{color:colors.text,fontFamily:appFonts.bold,fontSize:18}]}>{translateData.otpVerification}</Text>
            <View style={{flexDirection:'row',gap:10,width:'100%'}}>
              {[0,1,2,3].map(position=><BottomSheetTextInput
                key={position}
                ref={node=>{otpInputs.current[position]=node}}
                accessibilityLabel={`Pickup PIN digit ${position+1}`}
                value={enteredOtp[position]||''}
                onChangeText={value=>updatePickupPin(value,position)}
                onKeyPress={({nativeEvent})=>handlePickupPinKeyPress(nativeEvent.key,position)}
                onFocus={()=>{otpSheetRef.current?.expand();revealPickupPin()}}
                keyboardType="number-pad"
                maxLength={4-position}
                textAlign="center"
                selectionColor={appColors.primary}
                placeholderTextColor={isDark?'#C8BCAB':'#6D6255'}
                autoCorrect={false}
                textContentType={position===0?'oneTimeCode':'none'}
                autoComplete={position===0?'one-time-code':'off'}
                returnKeyType="done"
                onSubmitEditing={()=>Keyboard.dismiss()}
                style={{flex:1,minHeight:54,borderWidth:enteredOtp.length===position?2:1,borderColor:enteredOtp.length===position?appColors.primary:colors.border,borderRadius:12,color:colors.text,fontFamily:appFonts.bold,fontSize:25,backgroundColor:colors.card,padding:0}}
              />)}
            </View>
          </View>
          <Button backgroundColor={appColors.primary} color="#17191C" title={verifyLoader?'Verifying?':'Verify PIN & start delivery'} onPress={() => verifyOTP(enteredOtp)} loading={verifyLoader}/>

          </PickupCard>
          </View>
          {taxidoSettingData?.cabbooking_values?.ads?.native_enable == 1 && <NativeAdComponent adsHeight={windowHeight(10)} heights={windowHeight(28)}/>}
          <Button backgroundColor={isDark?appColors.darkThemeSub:appColors.lightGray} color={isDark?appColors.white:appColors.iconColor} title={translateData.cancelTextT} onPress={cancelOpen} loading={cancelLoader}/>
        </BottomSheetScrollView>
      </BottomSheet>

      <BottomSheet
        ref={successSheetRef}
        index={-1}
        snapPoints={successSnapPoints}
        enablePanDownToClose={false}
        enableContentPanningGesture={false}
        enableHandlePanningGesture={false}
        handleIndicatorStyle={{
          backgroundColor: appColors.primary,
          width: '13%',
        }}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: isDark ? appColors.bgDark : appColors.white,
        }}
       android_keyboardInputMode="adjustResize" >
        <BottomSheetView style={{ alignItems: 'center' }}>
          <View style={[styles.model, { marginTop: windowHeight(8) }]}>
            <View style={styles.imageView}>
              <Image
                source={isDark ? images.darkOtp : images.otpRide}
                style={styles.image}
                resizeMode={'contain'}
              />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {translateData.otpSuccessfully}
            </Text>
            <Text
              style={{
                color: appColors.darkBorderBlack,
                textAlign: 'center',
                fontFamily: appFonts.regular,
                fontSize: fontSizes.FONT4,
                bottom: windowHeight(4),
              }}
            >
              {translateData.verificationDone}
            </Text>
            <View style={{ width: '100%', bottom: windowHeight(0.2) }}>
              <Button
                title={translateData.done}
                color={appColors.white}
                backgroundColor={appColors.primary}
                onPress={gotocomplete}
              />
            </View>
          </View>
        </BottomSheetView>
      </BottomSheet>

      <BottomSheet
        ref={cancelReasonRef}
        index={-1}
        snapPoints={snapCancelReason}
        enablePanDownToClose={true}
        onChange={index => {
          if (index === -1) {
            otpSheetRef.current?.snapToIndex(1)
          }
        }}
        handleIndicatorStyle={{
          backgroundColor: appColors.primary,
          width: '13%',
        }}
        backdropComponent={props => (
          <BottomSheetBackdrop
            {...props}
            pressBehavior="close"
            disappearsOnIndex={-1}
            appearsOnIndex={0}
          />
        )}
        backgroundStyle={{
          backgroundColor: isDark ? appColors.bgDark : appColors.white,
        }}
       android_keyboardInputMode="adjustResize" >
        <BottomSheetView style={{ padding: windowHeight(2) }}>
          <Text
            style={{
              fontSize: fontSizes.FONT4,
              fontWeight: '600',
              marginBottom: windowHeight(2),
            }}
          >
            {translateData.whyyouWanttoCancel}
          </Text>

          {canceldata?.data
            ?.filter((item: any) => item?.status === 1)
            .map((item: any, index: number) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedReason(item)}
                style={{
                  paddingVertical: windowHeight(1.5),
                  paddingHorizontal: windowWidth(1.5),
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderBottomWidth: 0.5,
                  borderBottomColor: appColors.border,
                  backgroundColor:
                    selectedReason?.id === item?.id
                      ? appColors.categoryTitle
                      : appColors?.graybackground,
                  borderRadius: windowHeight(0.8),
                  marginBottom: windowHeight(2),
                }}
              >
                <Image
                  source={{ uri: item?.icon_image_url }}
                  style={{
                    height: windowHeight(3),
                    width: windowHeight(3),
                    resizeMode: 'contain',
                  }}
                />
                <View style={{ marginHorizontal: 10 }} />
                <Text style={{ color: colors.text }}>{item?.title}</Text>
              </TouchableOpacity>
            ))}

          <View style={{ marginHorizontal: windowWidth(-4) }}>
            <Button
              title={translateData.confirmCancel}
              onPress={() => {
                if (selectedReason) {
                  cancelRide(selectedReason)
                } else {
                  Alert.alert(
                    translateData.selectareason,
                    translateData.cancelreason,
                  )
                }
              }}
              backgroundColor={appColors.alertRed}
              color={appColors.white}
              loading={cancelLoaders}
            />
          </View>
        </BottomSheetView>
      </BottomSheet>
      {/* </View> */}
    </View >
  )
}
