import {DeliveryBackButton} from '../../../design/DeliveryBackButton';
import {View, Platform, PermissionsAndroid, BackHandler, Alert, TouchableOpacity, ScrollView} from 'react-native';
import {Text, TextInput} from '../../../design/Typography';
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme, useRoute, useFocusEffect } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import {
  rideDataGets,
  rideDataPut,
  rideParcelStopUpdate,
  selfDriverData,
  allpayment,
} from '../../../api/store/action'
import styles from './styles'
import commanStyles from '../../../style/commanStyles'
import {
  BackButton,
  Button,
  notificationHelper,
} from '../../../commonComponents'
import appColors from '../../../theme/appColors'
import { DriverProfile } from '../../../commonComponents'
import { Map } from '../../mapView'
import { useValues } from '../../../utils/context'
import Geolocation from 'react-native-geolocation-service'
import {
  fontSizes,
  windowHeight,
  windowWidth,
} from '../../../theme/appConstant'
import appFonts from '../../../theme/appFonts'
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet'
import Icons from '../../../utils/icons/icons'
import getEchoInstance from '../../../utils/echo'
import { rideDataGet } from '../../../api/store/action'
import { useAppNavigation } from '../../../utils/navigation'
import { AppDispatch } from '../../../api/store'


export function RideComplete() {
  const { viewRtlStyle } = useValues()
  const navigation = useAppNavigation()
  const { colors } = useTheme()
  const route = useRoute<any>()
  const dispatch = useDispatch<AppDispatch>()
  const { rideData }: any = route.params
  const [rideDataState, setRideDataState] = useState<any>(null)
  const [rideDetailsLoading, setRideDetailsLoading] = useState<boolean>(true)
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00')
  const [totalDistance, setTotalDistance] = useState<number>(0)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [isRunning, setIsRunning] = useState<boolean>(true)
  const [endTime, setEndTime] = useState<string | null>(null)
  const [locations, setLocations] = useState<any>(null)
  const { translateData } = useSelector((state: any) => state.setting)
  const [completeLoading, setCompleteLoading] = useState<boolean>(false)
  const [cashPaymentLoading, setCashPaymentLoading] = useState<boolean>(false)
  const cashFarePreparedRef = useRef(false)
  const completionInFlight=useRef(false)
  const cashInFlight=useRef(false)
  const [parcelStepLoading, setParcelStepLoading] = useState<boolean>(false)
  const { isDark } = useValues()
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const [showExtraFareSheet, setShowExtraFareSheet] = useState<boolean>(false)

  const [extraFareCharges, setExtraFareCharges] = useState<
    Array<{ id: string; title: string; amount: string }>
  >([])
  const extraFareSheetRef = useRef<BottomSheetModal>(null)
  const inputTextColor = isDark ? appColors.white : appColors.black
  const placeholderColor = isDark ? appColors.darkText : appColors.primaryFont
  const totalAmount = extraFareCharges?.reduce((sum, item) => {
    return sum + Number(item?.amount || 0)
  }, 0)
  const { zoneValue } = useSelector((state: any) => state.zoneUpdate)

  useEffect(() => {
    if (!rideData?.id) return;

    let isMounted = true;
    let echoInstance: any = null;

    const applyRideUpdate = (incoming: any) => {
      const details = incoming?.data?.data ?? incoming?.data ?? incoming?.ride ?? incoming;
      if (!details || typeof details !== 'object') return;
      setRideDataState((previous: any) => ({
        ...rideData,
        ...(previous ?? {}),
        ...details,
      }));
    };

    // Stop controls need the full persisted itinerary; realtime is optional.
    const fetchRideDetails = async () => {
      setRideDetailsLoading(true);
      try {
        const details = await dispatch(rideDataGet(Number(rideData.id))).unwrap();
        if (isMounted) applyRideUpdate(details);
      } catch (err) {
        console.warn('[RideComplete] Could not load full ride details:', err);
      } finally {
        if (isMounted) setRideDetailsLoading(false);
      }
    };
    fetchRideDetails();

    const setupEcho = async () => {
      try {
        echoInstance = await getEchoInstance();
        if (!echoInstance || !isMounted) return;

        echoInstance.private(`ride-status.${rideData.id}`)
          .listen('.ride.status', (data: any) => {
            applyRideUpdate(data?.ride || data);
          });
      } catch (err) {
        console.error('[RideComplete] Echo error:', err);
      }
    };

    setupEcho();

    return () => {
      isMounted = false;
      if (echoInstance) {
        echoInstance.leave(`ride-status.${rideData.id}`);
      }
    };
  }, [rideData?.id, dispatch]);

  useEffect(() => {
    bottomSheetModalRef.current?.present()
  }, [])

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

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      )
      return granted === PermissionsAndroid.RESULTS.GRANTED
    }
    return true
  }

  useEffect(() => {
    const startLocationTracking = async () => {
      const hasPermission = await requestLocationPermission()
      if (!hasPermission) {
        return
      }
      const watchId = Geolocation.watchPosition(
        position => {
          const { latitude, longitude } = position?.coords
          setLocations({ latitude, longitude })
        },
        error => { },
        { enableHighAccuracy: true, distanceFilter: 100, interval: 5000 },
      )
      return () => Geolocation.clearWatch(watchId)
    }
    startLocationTracking()
    return () => {
      Geolocation.stopObserving()
    }
  }, [])

  const getCurrentTime = () => new Date().toTimeString().slice(0, 8)

  useEffect(() => {
    if (isRunning && rideDataState?.start_time) {
      const timerInterval = setInterval(() => {
        const now = new Date()

        const startTimeDate = rideDataState.start_time.toDate
          ? rideDataState.start_time.toDate() // Firestore Timestamp object
          : new Date(rideDataState.start_time.seconds * 1000) // fallback if plain object

        const hours = startTimeDate.getHours()
        const minutes = startTimeDate.getMinutes()
        const seconds = startTimeDate.getSeconds()

        const startTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          hours,
          minutes,
          seconds,
        )

        if (!isNaN(startTime.getTime())) {
          const secondsGap = Math.floor(
            (now.getTime() - startTime.getTime()) / 1000,
          )
          setElapsedSeconds(secondsGap)

          // Format HH:MM:SS
          const hrs = Math.floor(secondsGap / 3600)
            .toString()
            .padStart(2, '0')
          const mins = Math.floor((secondsGap % 3600) / 60)
            .toString()
            .padStart(2, '0')
          const secs = (secondsGap % 60).toString().padStart(2, '0')

          setElapsedTime(`${hrs}:${mins}:${secs}`)
        }
      }, 1000)

      return () => clearInterval(timerInterval)
    }
  }, [isRunning, rideDataState?.start_time])

  const gotoComplete = async () => {
    if (rideDetailsLoading) {
      notificationHelper('', 'Loading the booked trip details. Please try again in a moment.', 'error')
      return
    }
    if (isParcelTrip && deliveredStopCount < parcelStopCount) {
      notificationHelper('', 'Mark the parcel delivered at each stop before completing this trip.', 'error')
      return
    }
    const cashDue =
      String(activeRide?.payment_method ?? '').toLowerCase() === 'cash' &&
      String(activeRide?.payment_status ?? '').toUpperCase() !== 'COMPLETED'

    if (cashDue) {
      Alert.alert(
        'Confirm cash received',
        'Only continue after collecting the final fare, including any extra or waiting charges.',
        [
          { text: 'Not received', style: 'cancel' },
          { text: 'Cash received', onPress: () => void collectCashAndComplete() },
        ],
      )
      return
    }

    void handleConfirm()
  }

  const handleConfirm = async () => {
    if(completionInFlight.current)return;
    completionInFlight.current=true;
    setCompleteLoading(true)
    const end = getCurrentTime()
    setEndTime(end)

    // Create a copy of the location coordinates array
    let updatedLocationCoordinates = [...asArray(activeRide?.location_coordinates)]

    // If there are location coordinates, update the last one (destination) with current GPS location
    if (updatedLocationCoordinates?.length > 0 && locations) {
      updatedLocationCoordinates[updatedLocationCoordinates?.length - 1] = {
        lat: locations.latitude.toString(),
        lng: locations.longitude.toString(),
      }
    }
    // If no location coordinates exist, create a new array with current location
    else if (locations) {
      updatedLocationCoordinates = [
        {
          lat: locations.latitude.toString(),
          lng: locations.longitude.toString(),
        },
      ]
    }

    const payloadData: any = {
      status: 'completed',
      end_time: end,
      distance: totalDistance.toFixed(2),
      distance_unit: 'km',
      location_coordinates: updatedLocationCoordinates,
      extra_charges: cashFarePreparedRef.current
        ? []
        : extraFareCharges?.map((item: any) => ({
            title: item?.title,
            amount: Number(item?.amount),
          })) || [],
    }

    // Add extra fare charges to payload if any exist
    if (!cashFarePreparedRef.current && extraFareCharges?.length > 0) {
      payloadData.extra_fare_charges = extraFareCharges.map(charge => ({
        title: charge.title,
        amount: parseFloat(charge.amount),
      }))
    }

    try {
      const response = await dispatch(
        rideDataPut({ data: payloadData, ride_id: activeRide?.id }),
      ).unwrap()
      if (!(response?.id ?? response?.data?.id)) {
        throw new Error(response?.message || translateData.failedComplet)
      }
      dispatch(selfDriverData())
      dispatch(rideDataGets())
      navigation.navigate('RideDetails', { ride_Id: activeRide?.id })
    } catch (error: any) {
      try {
        const result=await dispatch(rideDataGet(Number(activeRide?.id))).unwrap();
        const fresh=result?.data??result;
        if(fresh?.ride_status?.slug==='completed'){
          dispatch(selfDriverData());dispatch(rideDataGets());
          navigation.navigate('RideDetails',{ride_Id:activeRide.id});return;
        }
      }catch{/* No automatic payment retry on uncertain connection. */}
      notificationHelper(
        '',
        error?.message || translateData.failedComplet,
        'error',
      )
    } finally {
      completionInFlight.current=false;
      setCompleteLoading(false)
    }
  }

  const collectCashAndComplete = async () => {
    if (cashInFlight.current) return
    cashInFlight.current=true
    setCashPaymentLoading(true)
    try {
      const paymentResponse = await dispatch(
        allpayment({
          ride_id: Number(activeRide?.id),
          payment_method: 'cash',
          extra_charges: extraFareCharges.map((charge: any) => ({
            title: charge.title,
            amount: Number(charge.amount),
          })),
        } as any),
      ).unwrap()
      if (!(paymentResponse?.id ?? paymentResponse?.data?.id)) {
        throw new Error(paymentResponse?.message || 'Cash payment was not confirmed by the server.')
      }

      const refreshedResponse = await dispatch(
        rideDataGet(Number(activeRide?.id)),
      ).unwrap()
      const refreshedRide = refreshedResponse?.data?.data ?? refreshedResponse?.data ?? refreshedResponse
      if (String(refreshedRide?.payment_status ?? '').toUpperCase() !== 'COMPLETED') {
        throw new Error('The server has not confirmed payment yet. Please refresh and try again.')
      }
      setRideDataState((previous: any) => ({
        ...rideData,
        ...(previous ?? {}),
        ...refreshedRide,
      }))
      cashFarePreparedRef.current = true
      await handleConfirm()
    } catch (error: any) {
      try{
        const result=await dispatch(rideDataGet(Number(activeRide?.id))).unwrap();
        const fresh=result?.data?.data??result?.data??result;
        if(String(fresh?.payment_status).toUpperCase()==='COMPLETED'){
          setRideDataState((previous:any)=>({...rideData,...previous,...fresh}));
          cashFarePreparedRef.current=true;
          await handleConfirm();return;
        }
      }catch{/* Only read status after an uncertain payment response. */}
      notificationHelper(
        '',
        error?.message || 'Could not confirm cash payment. Please try again.',
        'error',
      )
    } finally {
      cashInFlight.current=false;
      setCashPaymentLoading(false)
    }
  }

  const asArray = (value: any): any[] => {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : []
      } catch (_error) {
        return []
      }
    }
    return []
  }
  const activeRide = { ...rideData, ...(rideDataState ?? {}) }
  const serviceType = String(
    activeRide?.service?.service_type ??
      activeRide?.service?.type ??
      activeRide?.service_type ??
      '',
  ).toLowerCase()
  const itinerary = asArray(activeRide?.locations)
  const itineraryCoordinates = asArray(activeRide?.location_coordinates)
  const bookedIntermediateStopCount = Math.max(
    Math.max(itineraryCoordinates.length, itinerary.length, 2) - 2,
    0,
  )
  // Some existing bookings expose a generic service type even though the
  // persisted itinerary clearly contains parcel handoff stops. Treat every
  // multi-stop itinerary as a parcel workflow so the controls cannot vanish.
  const isParcelTrip =
    serviceType === 'parcel' ||
    serviceType === 'freight' ||
    activeRide?.service?.slug === 'parcel' ||
    activeRide?.service?.slug === 'freight' ||
    bookedIntermediateStopCount > 0
  const isGoodsDelivery = ['parcel', 'freight'].includes(serviceType) ||
    ['parcel', 'freight'].includes(activeRide?.service?.slug)
  const parcelStopCount = isParcelTrip
    ? isGoodsDelivery
      ? Math.max(Math.max(itineraryCoordinates.length, itinerary.length) - 1, 0)
      : bookedIntermediateStopCount
    : 0
  const parcelStops = Array.from({ length: parcelStopCount }, (_item, index) =>
    activeRide?.parcel_delivery_progress?.stops?.[index] || {
      stop_index: index + 1,
      status: 'pending',
    },
  )
  const deliveredStopCount = parcelStops.filter((stop: any) => stop?.status === 'delivered').length
  const nextStopIndex = parcelStops.findIndex((stop: any) => stop?.status !== 'delivered') + 1

  const itineraryLabel = (index: number) => {
    const item = itinerary[index]
    if (typeof item === 'string') return item
    return item?.address || item?.formatted_address || item?.name || `Stop ${index}`
  }

  const handleParcelAction = async (stopIndex: number, action: 'arrived' | 'delivered') => {
    if (stopIndex !== nextStopIndex || stopIndex < 1) {
      return
    }
    setParcelStepLoading(true)
    try {
      const updatedRide = await dispatch(rideParcelStopUpdate({
        ride_id: activeRide.id,
        action,
        stop_index: stopIndex,
      })).unwrap()
      setRideDataState(updatedRide)
    } catch (error: any) {
      notificationHelper('', error?.message || 'Could not update this drop. Please try again.', 'error')
    } finally {
      setParcelStepLoading(false)
    }
  }

  const gotoOtherMap = (maptype: any) => {
    const nextIndex=nextStopIndex>0?nextStopIndex:Math.max(itineraryCoordinates.length-1,1);
    const destination=itineraryCoordinates[nextIndex];
    if(maptype==='google') {navigation.navigate('DeliveryNavigation',{title:'Navigate to next drop',destinations:destination?[{...destination,title:itineraryLabel(nextIndex)}]:[]});return;}
    navigation.navigate('MapWebView',{lat:destination?.lat,lng:destination?.lng,type:maptype});
  }

  const handleAddCharge = useCallback((newCharge: any) => {
    setExtraFareCharges(prevCharges => [...prevCharges, newCharge])
  }, [])

  const handleRemoveExtraFare = (id: string) => {
    setExtraFareCharges(prev => prev.filter(charge => charge.id !== id))
  }

  const handleSaveExtraFare = () => {
    extraFareSheetRef.current?.close()
    setShowExtraFareSheet(false)
  }

  const handleExtraFareSheetChange = useCallback((index: number) => {
    setShowExtraFareSheet(index >= 0)
  }, [])

  return (
    <View style={commanStyles.main}>
      {activeRide?.service_category?.service_category_type !== 'rental' ? (
        <View style={styles.mapSection}>
          <Map
            stoplocation={
              activeRide?.location_coordinates &&
                activeRide.location_coordinates?.length > 2
                ? activeRide.location_coordinates
                  .slice(1, -1)
                  .map((item: any) => ({
                    latitude: parseFloat(item.lat),
                    longitude: parseFloat(item.lng),
                  }))
                : [] // empty if no middle points
            }
            Destinationlocation={
              activeRide?.location_coordinates?.[
              activeRide.location_coordinates?.length - 1
              ]
            }
            driverId={activeRide?.driver?.id}
            rideDetails={activeRide}
          />
        </View>
      ) : (
        <View />
      )}
      <View style={styles.extraSection}></View>
      <DeliveryBackButton/>

      <BottomSheetModalProvider>
        {!showExtraFareSheet && (
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open Google Maps navigation" onPress={() => gotoOtherMap('google')} style={{ position: 'absolute', top: 12, right: 14, zIndex: 30, width: 48, height: 48, borderRadius: 24, backgroundColor: isDark ? appColors.darkThemeSub : appColors.white, borderWidth: 1.5, borderColor: isDark ? '#71665A' : '#5B5148', alignItems: 'center', justifyContent: 'center', elevation: 3 }}>
            <Icons.GoogleMap />
          </TouchableOpacity>
        )}

        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={0}
          snapPoints={['52%', '72%']}
          enableDynamicSizing={false}
          enablePanDownToClose={false}
          enableContentPanningGesture={true}
          enableHandlePanningGesture={true}
          handleIndicatorStyle={{
            backgroundColor: appColors.primary,
            width: '13%',
          }}
          backgroundStyle={{
            backgroundColor: isDark ? appColors.bgDark : appColors.white,
          }}
         android_keyboardInputMode="adjustResize" >
          <BottomSheetScrollView style={{flex:1}} contentContainerStyle={{padding:10,paddingBottom:16,gap:7}} keyboardShouldPersistTaps="handled">
            {rideData?.service_category?.service_category_type === 'rental' ? (
              <View
                style={[
                  styles.rideDataMainView,
                  { flexDirection: viewRtlStyle },
                ]}
              ></View>
            ) : null}
            <View style={{width:'100%',gap:12}}>
              <View
                style={[
                  {padding:7,borderRadius:14,borderWidth:1.5},
                  { backgroundColor: colors.card, borderColor: isDark ? '#71665A' : '#5B5148' },
                ]}
              >
                <DriverProfile
                  userDetails={activeRide?.rider}
                  borderRadius={windowHeight(25)}
                  showInfoIcon={true}
                  iconColor={appColors.primary}
                  backgroundColor={appColors.white}
                  rideDetails={activeRide}
                  compact={true}
                />
              </View>
              {isParcelTrip && rideDetailsLoading && (
                <Text style={[styles.parcelStopsTitle, { color: colors.text }]}>
                  Loading booked parcel stops…
                </Text>
              )}
              {isParcelTrip && !rideDetailsLoading && parcelStopCount === 0 && (
                <Text style={[styles.parcelStopsTitle, { color: colors.text }]}>
                  No delivery destinations are saved for this booking.
                </Text>
              )}
              {isParcelTrip && parcelStopCount > 0 && (
                <View style={[styles.parcelStopsCard, { backgroundColor: colors.card, borderColor: isDark ? '#71665A' : '#5B5148' }]}>
                  <View style={styles.parcelStopsHeader}>
                    <Text style={[styles.parcelStopsTitle, { color: colors.text }]}>Parcel stops</Text>
                    <Text style={[styles.parcelStopsCount, { color: appColors.primary }]}>
                      {deliveredStopCount}/{parcelStopCount} delivered
                    </Text>
                  </View>
                  <ScrollView style={styles.parcelStopsList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {parcelStops.map((stop: any, index: number) => {
                      const stopNumber = index + 1
                      const isDelivered = stop?.status === 'delivered'
                      const isNextStop = stopNumber === nextStopIndex
                      return (
                        <View key={`parcel-stop-${stopNumber}`} style={[styles.parcelStopRow, { borderTopColor: colors.border }]}>
                          <Text numberOfLines={1} style={[styles.parcelStopName, { color: colors.text }]}>
                            {`${isGoodsDelivery && stopNumber === parcelStopCount ? 'Final drop' : `Stop ${stopNumber}`}: ${itineraryLabel(stopNumber)}`}
                          </Text>
                          <TouchableOpacity
                            disabled={!isNextStop || isDelivered || parcelStepLoading}
                            onPress={() => handleParcelAction(stopNumber, stop?.arrived_at ? 'delivered' : 'arrived')}
                            style={[
                              styles.parcelStopAction,
                              { backgroundColor: isDelivered ? appColors.primary : isNextStop ? appColors.primary : appColors.lightGray },
                            ]}
                          >
                            <Text style={[styles.parcelStopActionText, { color: isDelivered || isNextStop ? "#17191C" : appColors.primaryFont }]}>
                              {isDelivered ? 'Parcel delivered ✓' : isNextStop ? (stop?.arrived_at ? 'Parcel delivered' : 'Arrived at drop') : 'Waiting'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )
                    })}
                  </ScrollView>
                </View>
              )}
              <View style={{flexDirection:'row',gap:8,width:'100%',alignItems:'stretch'}}>
                <View style={{flex:0.85,minWidth:0}}>
                  {totalAmount > 0 ? (
                    <TouchableOpacity
                      style={{ minHeight: 50, width: '100%', backgroundColor: isDark ? appColors.darkThemeSub : appColors.lightGray, borderRadius: 10, borderWidth: 1.5, borderColor: isDark ? '#71665A' : '#5B5148', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}
                      onPress={() => extraFareSheetRef.current?.present()}
                    >
                      <Text style={{ fontFamily: appFonts.regular, fontSize: 12, color: isDark ? appColors.white : appColors.black }} numberOfLines={1}>{translateData?.extra}</Text>
                      <Text style={{ fontFamily: appFonts.medium, fontSize: 15, color: isDark ? appColors.white : appColors.black }} numberOfLines={1}>{rideData?.currency_symbol}{totalAmount}</Text>
                    </TouchableOpacity>
                  ) : (
                    <Button
                      onPress={() => {
                        extraFareSheetRef.current?.present()
                      }}
                      title={translateData?.addCharge}
                      backgroundColor={
                        isDark ? appColors.darkThemeSub : appColors.lightGray
                      }
                      color={isDark ? appColors.white : appColors.black}
                      borderColor={isDark?'#71665A':'#5B5148'}
                      borderWidth={1.5}
                      margin={0}
                      textStyle={{fontSize:12,textAlign:'center',paddingHorizontal:4}}
                    />
                  )}
                </View>
                <View style={{flex:1.35,minWidth:0}}>
                  <Button
                    onPress={gotoComplete}
                    title={
                      String(activeRide?.payment_method ?? '').toLowerCase() === 'cash' &&
                      String(activeRide?.payment_status ?? '').toUpperCase() !== 'COMPLETED'
                      ? 'Cash received &\ncomplete trip'
                        : translateData.completeRides
                    }
                    backgroundColor={appColors.primary}
                    color={appColors.white}
                    loading={completeLoading || cashPaymentLoading}
                    margin={0}
                    borderColor={isDark?'#71665A':'#5B5148'}
                    borderWidth={1.5}
                    textStyle={{fontSize:13,lineHeight:16,textAlign:'center',paddingHorizontal:5}}
                  />
                </View>
              </View>
            </View>
          </BottomSheetScrollView>
        </BottomSheetModal>

        <BottomSheetModal
          ref={extraFareSheetRef}
          index={1}
          snapPoints={['45%']}
          onChange={handleExtraFareSheetChange}
          handleIndicatorStyle={{
            backgroundColor: appColors.primary,
            width: '13%',
          }}
          backgroundStyle={{
            backgroundColor: isDark ? appColors.bgDark : appColors.white,
          }}
         android_keyboardInputMode="adjustResize" >
          <ExtraFareSheetContent
            translateData={translateData}
            isDark={isDark}
            appColors={appColors}
            colors={colors}
            zoneValue={zoneValue}
            charges={extraFareCharges}
            onAdd={handleAddCharge}
            onRemove={handleRemoveExtraFare}
            onSave={handleSaveExtraFare}
          />
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </View>
  )
}

const ExtraFareSheetContent = React.memo(
  ({
    translateData,
    isDark,
    appColors,
    colors,
    zoneValue,
    charges,
    onAdd,
    onRemove,
    onSave,
  }: any) => {
    const [title, setTitle] = useState('')
    const [amount, setAmount] = useState('')
    const handleSave = () => {
      if (title.trim() && amount.trim()) {
        const amountValue = parseFloat(amount.trim())
        if (!isNaN(amountValue) && amountValue > 0) {
          onAdd({
            id: Date.now().toString(),
            title: title.trim(),
            amount: amountValue.toString(),
          })
        }
      }

      setTitle('')
      setAmount('')
      onSave()
    }

    const inputTextColor = isDark ? appColors.white : appColors.black
    const placeholderColor = isDark ? appColors.darkText : appColors.primaryFont

    const handleAdd = () => {
      if (!title.trim() || !amount.trim()) {
        notificationHelper('', translateData.enterBoth, 'error')
        return
      }

      const amountValue = parseFloat(amount.trim())
      if (isNaN(amountValue) || amountValue <= 0) {
        notificationHelper('', translateData.enterValidAmount, 'error')
        return
      }

      onAdd({
        id: Date.now().toString(),
        title: title.trim(),
        amount: amountValue.toString(),
      })

      setTitle('')
      setAmount('')
    }

    return (
      <BottomSheetView style={styles.extraFareSheetContainer}>
        <Text
          style={[
            styles.extraFareTitle,
            { color: isDark ? appColors.white : appColors.black },
          ]}
        >
          {translateData?.addCharge}
        </Text>

        <View style={styles.inputContainer}>
          <Text
            style={[
              styles.inputLabel,
              { color: isDark ? appColors.white : appColors.primaryFont },
            ]}
          >
            {translateData?.additinoalCharge}
          </Text>
          <View
            style={[
              styles.inputField,
              {
                backgroundColor: isDark
                  ? appColors.darkThemeSub
                  : appColors.lightGray,
                borderColor: colors.border,
              },
            ]}
          >
            <TextInput
              style={[
                styles.textInput,
                { color: isDark ? appColors.white : appColors.black },
              ]}
              placeholder={translateData?.enteradditonalcharge}
              placeholderTextColor={
                isDark ? appColors.darkText : appColors.primaryFont
              }
              value={title}
              onChangeText={setTitle}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text
            style={[
              styles.inputLabel,
              { color: isDark ? appColors.white : appColors.black },
            ]}
          >
            {translateData?.chargeAmount}
          </Text>
          <View
            style={[
              styles.inputField,
              {
                backgroundColor: isDark
                  ? appColors.darkThemeSub
                  : appColors.lightGray,
                borderColor: colors.border,
              },
            ]}
          >
            <TextInput
              style={[
                styles.textInput,
                { color: isDark ? appColors.white : appColors.black },
              ]}
              placeholder={translateData?.chargeAmountplace}
              placeholderTextColor={placeholderColor}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>

        {charges?.length > 0 && (
          <View style={styles.chargesList}>
            <Text
              style={{
                color: colors.text,
                fontFamily: appFonts.medium,
                fontSize: windowWidth(3.9),
                marginBottom: windowHeight(1),
              }}
            >
              {translateData?.yourChareg}
            </Text>
            {charges.map((charge: any) => (
              <View
                key={charge?.id}
                style={[
                  styles.chargeItem,
                  {
                    backgroundColor: isDark
                      ? appColors.darkThemeSub
                      : appColors.lightGray,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chargeText,
                    { color: isDark ? appColors.white : appColors.black },
                  ]}
                >
                  {charge?.title}
                </Text>
                <View style={[styles.chargeRight]}>
                  <Text
                    style={[
                      styles.chargeAmount,
                      { color: isDark ? appColors.white : appColors.black },
                    ]}
                  >
                    {zoneValue?.currency_symbol}
                    {charge?.amount}
                  </Text>
                  <TouchableOpacity
                    onPress={() => onRemove(charge?.id)}
                    style={styles.removeButton}
                  >
                    <Icons.CloseSimple color={appColors.red} size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.addMoreButton,
              {
                backgroundColor: isDark
                  ? appColors.darkThemeSub
                  : appColors.lightGray,
              },
            ]}
            onPress={handleAdd}
          >
            <Text
              style={[
                styles.actionButtonText,
                { color: isDark ? appColors.white : appColors.black },
              ]}
            >
              {translateData.addMore}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.saveButton,
              { backgroundColor: appColors.primary },
            ]}
            onPress={handleSave}
          >
            <Text style={[styles.actionButtonText, { color: appColors.white }]}>
              {translateData.saveCharges}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    )
  },
)
