import {View, Image, TouchableOpacity, NativeModules} from 'react-native';
import {Text} from '../../../../design/Typography';
import {DriverRequestCard} from '../../../../design/DriverRequestCard';
import {offerAvailable} from '../../../../utils/driverOffer';
import React, { useState, useImperativeHandle, forwardRef, useEffect, useRef } from 'react'
import Icons from '../../../../utils/icons/icons'
import styles from './styles'
import { useValues } from '../../../../utils/context'
import { useNavigation, useTheme } from '@react-navigation/native'
import appColors from '../../../../theme/appColors'
import { fontSizes, windowHeight, windowWidth } from '../../../../theme/appConstant'
import CalanderSmall from '../../../../assets/icons/caladerSmall'
import Clock from '../../../../assets/icons/clock'
import { useDispatch, useSelector } from 'react-redux'
import { acceptRequestValue, rejectRequestValue, rideDataGet, rideDataGets } from '../../../../api/store/action'
import { notificationHelper } from '../../../../commonComponents'
import appFonts from '../../../../theme/appFonts'
import { ProgressBar } from '../../../../commonComponents/helper/progressBarHelper'
import { formatDates } from '../../../../utils/functions'
import useSmartLocation from '../../../../commonComponents/helper/locationHelper'
import CustomSlider from '../../../../commonComponents/CustomSlider'
// import Sound from 'react-native-sound' (Removed due to RN 0.82 compatibility issues)
import { AppDispatch } from '../../../../api/store'

export const UpcomingRide = forwardRef(function UpcomingRide(
  { ride, gotoRide, gotoInfo, selectDriver, onRideDeclined, onAutoIgnore, handelCall }: any,
  ref,
) {
  const { textRtlStyle, viewRtlStyle, isDark, rtl, Google_Map_Key, notificationValue } = useValues()
  const { colors } = useTheme()
  const { translateData, taxidoSettingData } = useSelector((state: any) => state.setting)
  const isAmbulance = ride?.service?.service_type === 'ambulance';
  const isFindDriver =
    ride?.service?.service_type === 'finddriver' ||
    ride?.service?.id === 5 ||
    ride?.service_id === 5;

  const dispatch = useDispatch<AppDispatch>()
  const { zoneValue } = useSelector((state: any) => state.zoneUpdate)
  const { navigate } = useNavigation<any>()
  const { selfDriver } = useSelector((state: any) => state.account)
  const [declined, setDeclined] = useState<boolean>(false)
  const acceptingRideIds = useRef<Set<string>>(new Set())
  const formattedDate = formatDates(ride?.created_at)
  const { currentLatitude, currentLongitude } = useSmartLocation()
  const [distance, setDistance] = useState<string>('')
  const routeLocations: string[] = Array.isArray(ride?.locations)
    ? ride.locations.filter((location: any) => typeof location === 'string' && location.trim())
    : []
  const hasIntermediateStops = routeLocations.length > 2

  useEffect(() => {
    if (!ride) {
      console.error('[UpcomingRide] unable to get ride request data: ride prop is missing');
    }
  }, [ride]);

  try {
    NativeModules.RNSound.setCategory('Playback', true)
  } catch (e) {
    console.error('Failed to set Sound category in UpcomingRide:', e);
  }

  const playRingtone = () => {
    const key = Math.floor(Math.random() * 10000)
    const filename = 'seatbelt' // Native resource name (lowercase, no extension)

    if (!NativeModules.RNSound) {
      console.error('RNSound native module not found in UpcomingRide')
      return
    }

    try {
      NativeModules.RNSound.prepare(filename, key, {}, (error: any) => {
        if (error) {
          console.error('[UpcomingRide] Sound loading error:', error);
          return
        }
        NativeModules.RNSound.setVolume(key, 1.0, 1.0)
        NativeModules.RNSound.play(key, (success: boolean) => {
          if (!success) {
            console.log('[UpcomingRide] Sound play failed');
          } else {
            console.log('[UpcomingRide] Sound played successfully');
          }
          NativeModules.RNSound.release(key)
        })
      })
    } catch (e) {
      console.error('Failed to initialize seatbelt sound in UpcomingRide:', e);
    }
  }

  const acceptRide = async (rideId: any): Promise<boolean> => {
    const rideRequestKey = String(rideId ?? '')
    if (!rideRequestKey || acceptingRideIds.current.has(rideRequestKey)) {
      return false
    }
    if(!offerAvailable(ride)){onRideDeclined?.(rideId);notificationHelper('','This booking offer is no longer available.','error');return false;}

    acceptingRideIds.current.add(rideRequestKey)
    try {
      const response = await dispatch(
        acceptRequestValue({ ride_request_id: rideId }),
      ).unwrap()
      const rideDetails = [response?.data?.data, response?.data, response?.ride, response]
        .find(value => value?.id)

      if (!rideDetails?.id) {
        throw new Error(
          response?.message || 'The server did not confirm this delivery acceptance.',
        )
      }
      if(rideDetails?.driver?.id&&String(rideDetails.driver.id)!==String(selfDriver?.id))throw Error('This booking has been assigned to another driver.');

      dispatch(rideDataGet(rideDetails.id))

      if (rideDetails?.service_category?.service_category_type === 'rental') {
        onRideDeclined?.(rideId)
        dispatch(rideDataGets())
        notificationHelper(
          translateData.rideAccepted,
          translateData.checkRides,
          'success',
        )
      } else if (ride?.service_category?.service_category_type === 'schedule') {
        dispatch(rideDataGets())
        onRideDeclined?.(rideId)
        notificationHelper('', translateData.rideScheduled, 'success')
      } else {
        playRingtone()
        onRideDeclined(rideId)
        navigate('AcceptFare', {
          ride_Id: rideDetails.id,
          ride_Details: rideDetails,
        })
        dispatch(rideDataGets())
      }

      return true
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'The delivery could not be accepted. Please try again.'
      console.error('[UpcomingRide] Ride acceptance failed:', message)
      if(/already.*(accept|assign)|assigned to another|offer.*expired|request.*(expired|cancelled|canceled)|no longer available/i.test(message))onRideDeclined?.(rideId)
      notificationHelper('', message, 'error')
      return false
    } finally {
      acceptingRideIds.current.delete(rideRequestKey)
    }
  }


  const acceptAmbulance = (rideId: any) => {
    onRideDeclined(rideId)
    const payload: any = {
      ride_request_id: rideId,
    }

    dispatch(acceptRequestValue(payload))
      .unwrap()
      .then(async res => {
        if (res?.id) {
          dispatch(rideDataGet(res?.id)).then(async (res: any) => {
            navigate('AmbulanceTrack', { rideData: res?.payload })
            dispatch(rideDataGets())
          })
        } else {
          notificationHelper('', res?.message, 'error')
        }
      })
      .catch(err => { })
  }

  const acceptFindDriver = (rideId: any) => {
    onRideDeclined(rideId)
    const payload: any = {
      ride_request_id: rideId,
    }

    dispatch(acceptRequestValue(payload))
      .unwrap()
      .then(async res => {
        if (res?.id) {

          dispatch(rideDataGets())
        } else {
          notificationHelper('', res?.message, 'error')
        }
      })
      .catch(err => { })
  }





  const declineRide = async (rideId: any) => {
    const driverId = selfDriver?.id
    if (!rideId || !driverId) {
      console.warn('[UpcomingRide] Missing rideId or driverId for decline', { rideId, driverId });
      return false
    }
    const payload: any = {
      ride_request_id: rideId,
    }
    try{
      await dispatch(rejectRequestValue(payload)).unwrap()
      setDeclined(true)
      onRideDeclined?.(rideId)
      return true
    }catch(error:any){notificationHelper('',error?.message||'Could not decline this booking. Please try again.','error');return false;}
  }

  const calculateDrivingDistance = () => {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${currentLatitude},${currentLongitude}&destinations=${ride?.location_coordinates[0]?.lat},${ride?.location_coordinates[0]?.lng}&mode=driving&units=metric&key=${Google_Map_Key}`
    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
          const distance = data.rows[0].elements[0].distance.text
          setDistance(distance)
        } else {
          setDistance('Error')
        }
      })
      .catch(error => {
        setDistance('Error')
      })
  }

  useEffect(() => {
    if (
      currentLatitude &&
      currentLongitude &&
      ride?.location_coordinates[0]?.lat &&
      ride?.location_coordinates[0]?.lng
    ) {
      calculateDrivingDistance()
    }
  }, [
    currentLatitude,
    currentLongitude,
    ride?.location_coordinates[0]?.lat,
    ride?.location_coordinates[0]?.lng,
  ])

  const endTime = ride?.end_time
  const startTime = ride?.start_time

  let formattedDate1 = ''
  let formattedTime1 = ''
  let formattedDate2 = ''
  let formattedTime2 = ''

  if (startTime) {
    const startDateObj = new Date(startTime.replace(' ', 'T'))
    const options: any = { day: 'numeric', month: 'long' }
    formattedDate1 = startDateObj.toLocaleDateString('en-GB', options)
    let hours = startDateObj.getHours()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    formattedTime1 = `${hours} ${ampm}`
  }

  if (endTime) {
    const endDateObj = new Date(endTime.replace(' ', 'T'))
    const options: any = { day: 'numeric', month: 'long' }
    formattedDate2 = endDateObj.toLocaleDateString('en-GB', options)
    let hours = endDateObj.getHours()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    formattedTime2 = `${hours} ${ampm}`
  }

  const declineRideInternal = () => {
    return declineRide(ride?.id)
  }

  useImperativeHandle(ref, () => ({
    acceptRide,
    decline: declineRideInternal,
    getRideId: () => ride?.id,
  }))

  if(['parcel','freight'].includes(ride?.service?.service_type)||ride?.service_category?.service_category_type==='package')return <DriverRequestCard
    offer={ride} dark={isDark} pickupDistance={distance&&distance!=='Error'?distance:undefined}
    onAccept={()=>acceptRide(ride?.id)} onDecline={()=>declineRide(ride?.id)}
    onExpired={()=>{onRideDeclined?.(ride?.id);notificationHelper('','This booking offer has expired or is no longer available.','error');}}
    onDetails={()=>gotoInfo(ride)} bidding={taxidoSettingData?.cabbooking_values?.activation?.bidding==1&&ride?.service_category?.service_category_type!=='package'}/>

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        if (
          ride?.service?.service_type !== 'ambulance' &&
          taxidoSettingData?.cabbooking_values?.activation?.bidding != 0
        ) {
          gotoRide(ride)
        }
      }}
      disabled={
        ride?.service?.service_type === 'ambulance' ||
        taxidoSettingData?.cabbooking_values?.activation?.bidding == 0
      }
      style={[
        styles.main,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View
        style={[
          styles.top,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        {taxidoSettingData?.cabbooking_values?.activation?.bidding == 0 &&
          !declined &&
          ride?.service_category?.service_category_type !== 'rental' &&
          ride?.service?.service_type !== 'ambulance' &&
          !isFindDriver && (
            <ProgressBar
              onComplete={() => {
                onAutoIgnore(ride?.id)
              }}
            />

          )}
        {ride?.service_category?.service_category_type == 'rental' && (
          <ProgressBar
            onComplete={() => {
              onAutoIgnore(ride?.id)
            }}
          />

        )}
        {ride?.service?.service_type === 'ambulance' && (
          <ProgressBar
            onComplete={() => {
              onAutoIgnore(ride?.id)
            }}
          />

        )}
        {isFindDriver && (
          <ProgressBar
            onComplete={() => {
              onAutoIgnore(ride?.id)
            }}
          />

        )}
        <View style={{ paddingHorizontal: windowWidth(3) }}>
          <View style={[styles.alignment, { flexDirection: viewRtlStyle }]}>
            <View style={[styles.profile, { flexDirection: viewRtlStyle }]}>
              {ride?.rider?.profile_image?.original_url ? (
                <Image
                  source={{ uri: ride?.rider?.profile_image?.original_url }}
                  style={styles.userimage}
                />
              ) : (
                <View style={[styles.userimage, styles.initialsCircle]}>
                  <Text
                    style={{
                      fontSize: fontSizes.FONT4HALF,
                      color: appColors.white,
                      fontFamily: appFonts.bold,
                    }}
                  >
                    {ride?.rider?.name?.charAt(0)?.toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.rideContainer}>
                <Text
                  style={[styles.userName, { color: colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {ride?.rider?.name}
                </Text>
                <View
                  style={[
                    styles.starContainer,
                    {
                      flexDirection: viewRtlStyle,
                      left: rtl ? windowHeight(4) : windowHeight(0.5),
                    },
                  ]}
                >
                  {Array.from({ length: 5 }).map((_, index) => {
                    const fullStarThreshold = index + 1
                    const halfStarThreshold = index + 0.5
                    if (ride?.rider?.rating_count >= fullStarThreshold) {
                      return <Icons.RatingStar key={index} />
                    } else if (ride?.rider?.rating_count >= halfStarThreshold) {
                      return <Icons.RatingHalfStar key={index} />
                    } else {
                      return <Icons.RatingEmptyStar key={index} />
                    }
                  })}
                  <Text
                    style={[
                      styles.text1,
                      {
                        color: isDark ? appColors.white : appColors.primaryFont,
                        left: windowWidth(1),
                      },
                    ]}
                  >
                    {ride?.rider?.rating_count}
                  </Text>
                  <Text
                    style={[
                      styles.text1,
                      {
                        color: isDark
                          ? appColors.white
                          : appColors.secondaryFont,
                        left: windowWidth(2),
                      },
                    ]}
                  >
                    ({ride?.rider?.reviews_count})
                  </Text>
                  {ride?.rider?.reviews_count > 0 && (
                    <>
                      <Text
                        style={[
                          styles.text1,
                          {
                            color: isDark
                              ? appColors.white
                              : appColors.secondaryFont,
                            left: windowWidth(2),
                          },
                        ]}
                      >
                        (
                      </Text>
                      <Text
                        style={[
                          styles.text1,
                          {
                            color: isDark
                              ? appColors.white
                              : appColors.secondaryFont,
                            left: windowWidth(2),
                          },
                        ]}
                      >
                        {ride?.rider?.reviews_count})
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.rate}>
              <Text style={styles.price}>
                {zoneValue?.currency_symbol}
                {ride?.total}
              </Text>
              {ride?.service_category?.service_category_type === 'rental' ? (
                <View
                  style={[
                    styles.distanceValue,
                    { flexDirection: viewRtlStyle },
                  ]}
                >
                  <Icons.DayCalander color={colors.text} />
                  <Text style={[styles.distance, { color: colors.text }]}>
                    {' '}
                    {ride?.no_of_days} {translateData.days}
                  </Text>
                </View>
              ) : (
                <Text
                  style={{
                    color: appColors.primaryFont,
                    fontFamily: appFonts.medium,
                  }}
                >
                  {parseFloat(ride?.distance).toFixed(1)} {ride?.distance_unit}
                </Text>
              )}
            </View>
          </View>
          <View
            style={{
              flexDirection: viewRtlStyle,
              justifyContent: 'space-between',
            }}
          ></View>
          {ride?.service_category?.service_category_type === 'schedule' && (
            <View
              style={[
                styles.scheduleContainer,
                {
                  flexDirection: viewRtlStyle,
                },
              ]}
            >
              <View style={styles.containerSchedule}>
                <Text style={styles.startDateText}>
                  {translateData.startDate}
                </Text>
                <View
                  style={[
                    styles.calanderSmall,
                    { flexDirection: viewRtlStyle },
                  ]}
                >
                  <CalanderSmall />
                  <Text style={styles.formattedDateText}>
                    {' '}
                    {formattedDate.date}
                  </Text>
                </View>
              </View>
              <View
                style={[styles.startContainer, { borderColor: colors.border }]}
              />
              <View style={styles.containerSchedule}>
                <Text style={styles.startTime}>{translateData.startTime}</Text>
                <View
                  style={[
                    styles.scheduleClock,
                    { flexDirection: viewRtlStyle },
                  ]}
                >
                  <Clock />
                  <Text style={styles.formattedDateText}>
                    {' '}
                    {formattedDate.time}
                  </Text>
                </View>
              </View>
            </View>
          )}
          {ride?.service_category?.service_category_type === 'rental' && (
            <>
              <View
                style={[
                  styles.rentalContainer,
                  { flexDirection: viewRtlStyle },
                  { backgroundColor: isDark ? appColors.bgDark : appColors.white }
                ]}
              >
                <View style={styles.containerSchedule}>
                  <Text style={[styles.startTime, { color: isDark ? appColors.white : appColors.black }]}>
                    {translateData.startDate}
                  </Text>
                  <View
                    style={[
                      styles.scheduleClock,

                      { flexDirection: viewRtlStyle },
                    ]}
                  >
                    <CalanderSmall />
                    <Text style={styles.formattedDateText}>
                      {' '}
                      {formattedDate1}
                    </Text>
                  </View>
                </View>
                <View style={[styles.rentalBorder, { borderColor: colors.border }]} />
                <View style={styles.containerSchedule}>
                  <Text style={[styles.startTime, { color: isDark ? appColors.white : appColors.black }]}>
                    {translateData.startTime}
                  </Text>
                  <View
                    style={[
                      styles.scheduleClock,
                      { flexDirection: viewRtlStyle },
                    ]}
                  >
                    <Clock />
                    <Text style={styles.formattedDateText}>
                      {' '}
                      {formattedTime1}
                    </Text>
                  </View>
                </View>
              </View>
              <View
                style={[
                  styles.rentalDateContainer,
                  {
                    flexDirection: viewRtlStyle,
                    backgroundColor: isDark ? appColors.bgDark : appColors.white
                  },
                ]}
              >
                <View style={styles.containerSchedule}>
                  <Text style={[styles.startTime, { color: isDark ? appColors.white : appColors.black }]}>{translateData.endDate}</Text>
                  <View
                    style={[
                      styles.scheduleClock,
                      { flexDirection: viewRtlStyle },
                    ]}
                  >
                    <CalanderSmall />
                    <Text style={styles.formattedDateText}>
                      {' '}
                      {formattedDate2}
                    </Text>
                  </View>
                </View>
                <View
                  style={[styles.rentalBorder, { borderColor: colors.border }]}
                />
                <View style={styles.containerSchedule}>
                  <Text style={[styles.startTime, { color: isDark ? appColors.white : appColors.black }]}>{translateData.endTime}</Text>
                  <View
                    style={[
                      styles.scheduleClock,
                      { flexDirection: viewRtlStyle },
                    ]}
                  >
                    <Clock />
                    <Text style={styles.formattedDateText}>
                      {' '}
                      {formattedTime1}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
          <View style={[styles.mainContainer, { flexDirection: viewRtlStyle }]}>
            <View>
              <Icons.location color={colors.text} />
              {ride?.service?.service_type !== 'ambulance' && (
                <>
                  <View
                    style={[
                      styles.verticaldot,
                      {
                        borderColor: appColors.darkBorderBlack,
                        height: windowHeight(5.5),
                      },
                    ]}
                  />
                  <View style={styles.gps}>
                    <Icons.gps color={colors.text} />
                  </View>
                </>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0, flexShrink: 1 }}>
              {ride?.service?.service_type !== 'ambulance' && (
                <>
                  <Text
                    style={[
                      styles.pickup,
                      { color: colors.text, textAlign: textRtlStyle },
                    ]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {ride?.locations?.[0]}
                  </Text>

                  <Text
                    style={[
                      styles.distance,
                      {
                        color: appColors.secondaryFont,
                        marginTop: windowHeight(1),
                        marginHorizontal: windowWidth(1),
                      },
                    ]}
                  >
                    {' '}
                    {distance} {translateData.away}
                  </Text>
                  <View style={styles.borderContainer}>
                    <View
                      style={[
                        styles.border,
                        {
                          borderColor: colors.border,
                          marginVertical: 0,
                          marginTop: windowHeight(0.5),
                          marginBottom: windowHeight(1),
                        },
                      ]}
                    />
                  </View>
                </>
              )}
              <Text
                style={[
                  styles.drop,
                  { color: colors.text, textAlign: textRtlStyle },
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {ride?.locations?.[ride?.locations?.length - 1]}
              </Text>
            </View>
          </View>
        </View>
        {hasIntermediateStops && (
          <View
            style={{
              marginTop: windowHeight(1),
              paddingHorizontal: windowWidth(2.5),
              paddingVertical: windowHeight(1),
              borderRadius: windowHeight(0.8),
              backgroundColor: isDark ? colors.background : appColors.graybackground,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontFamily: appFonts.medium,
                marginBottom: windowHeight(0.4),
              }}
            >
              {`Full route · ${routeLocations.length - 2} ${routeLocations.length - 2 === 1 ? 'stop' : 'stops'}`}
            </Text>
            {routeLocations.map((location, index) => {
              const lastIndex = routeLocations.length - 1
              const pointLabel = index === 0
                ? 'P'
                : index === lastIndex
                  ? 'D'
                  : String(index)

              return (
                <View
                  key={`${index}-${location}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginTop: index === 0 ? 0 : windowHeight(0.45),
                  }}
                >
                  <View
                    style={{
                      width: windowHeight(2.5),
                      height: windowHeight(2.5),
                      borderRadius: windowHeight(1.25),
                      backgroundColor: index === lastIndex ? appColors.primary : colors.card,
                      borderWidth: 1,
                      borderColor: appColors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: windowWidth(2),
                    }}
                  >
                    <Text style={{ color: index === lastIndex ? appColors.white : appColors.primary, fontSize: fontSizes.FONT2HALF, fontFamily: appFonts.medium }}>
                      {pointLabel}
                    </Text>
                  </View>
                  <Text
                    style={{ color: colors.text, flex: 1, fontFamily: appFonts.regular }}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {location}
                  </Text>
                </View>
              )
            })}
          </View>
        )}
        {taxidoSettingData?.cabbooking_values?.activation?.bidding == 1 &&
          ride?.service_category?.service_category_type != 'package' && ride?.service?.service_type !== 'ambulance' && (
            <Text
              style={{
                textAlign: 'center',
                color: appColors.primary,
                fontFamily: appFonts.medium,
                textDecorationLine: 'underline',
              }}
            >
              {translateData.viewDetails}
            </Text>
          )}
      </View>
      <View style={[styles.bottom, styles.alignment]}>
        {ride?.service?.service_type != 'ambulance' && (
          <>
            {ride?.service?.service_type == 'cab' &&
              (ride?.service_category?.service_category_type == 'ride' ||
                ride?.service_category?.service_category_type == 'intercity') &&
              taxidoSettingData?.cabbooking_values?.activation?.bidding == 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ width: '65%', left: windowWidth(6) }}>
                    <CustomSlider
                      buttonText="Accept"
                      buttonWidth={windowWidth(68)}
                      sliderSize={windowHeight(5)}
                      buttonHeight={windowHeight(6.2)}
                      leftPadding={windowWidth(1)}
                      rightPadding={windowWidth(2.5)}
                      onSwipeSuccess={() => {
                        acceptRide(ride?.id)
                      }}
                    />
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.acceptContainer,
                      {
                        width: '16%',
                        marginBottom: windowHeight(1.5),
                        backgroundColor: appColors.alertRed,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handelCall(ride?.id)}
                  >
                    <Text style={styles.acceptText}>
                      <Icons.Cancel />
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
          </>
        )}
      </View>
      {(ride?.service?.service_type == 'freight' ||
        ride?.service?.service_type == 'parcel' ||
        ride?.service_category?.service_category_type == 'schedule') && (
          <>
            {taxidoSettingData?.cabbooking_values?.activation?.bidding == 1 ? (
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.rentalInfoContainer,
                  {
                    backgroundColor: isDark
                      ? colors.background
                      : appColors.graybackground,
                  },
                ]}
                onPress={() => gotoInfo(ride)}
              >
                <Text style={styles.moreInfo}>{translateData.moreInfo}</Text>
              </TouchableOpacity>
            ) : taxidoSettingData?.cabbooking_values?.activation?.bidding == 0 ? (
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between' }}
              >
                <View style={{ width: '65%', left: windowWidth(6) }}>
                  <CustomSlider
                    buttonText="Accept"
                    buttonWidth={windowWidth(68)}
                    sliderSize={windowHeight(5)}
                    buttonHeight={windowHeight(6.2)}
                    leftPadding={windowWidth(1)}
                    rightPadding={windowWidth(2.5)}
                    onSwipeSuccess={() => {
                      acceptRide(ride?.id)
                    }}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.acceptContainer,
                    {
                      width: '16%',
                      marginBottom: windowHeight(1.5),
                      backgroundColor: appColors.alertRed,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => gotoInfo(ride)}
                >
                  <Text style={styles.acceptText}>!</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        )}

      {ride?.service_category?.service_category_type == 'package' && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: '65%', left: windowWidth(6) }}>
            <CustomSlider
              buttonText="Accept"
              buttonWidth={windowWidth(68)}
              sliderSize={windowHeight(5)}
              buttonHeight={windowHeight(6.2)}
              leftPadding={windowWidth(1)}
              rightPadding={windowWidth(2.5)}
              onSwipeSuccess={() => {
                acceptRide(ride?.id)
              }}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.acceptContainer,
              {
                width: '16%',
                marginBottom: windowHeight(1.5),
                backgroundColor: appColors.alertRed,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => gotoInfo(ride)}
          >
            <Text style={styles.acceptText}>!</Text>
          </TouchableOpacity>
        </View>
      )}

      {ride?.service_category?.service_category_type === 'rental' && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: '65%', left: windowWidth(6) }}>
            <CustomSlider
              buttonText="Accept"
              buttonWidth={windowWidth(68)}
              sliderSize={windowHeight(5)}
              buttonHeight={windowHeight(6.2)}
              leftPadding={windowWidth(1)}
              rightPadding={windowWidth(2.5)}
              onSwipeSuccess={() => {
                if (ride?.is_with_driver == 1) {
                  selectDriver(ride)
                } else {
                  acceptRide(ride?.id)
                }
              }}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.acceptContainer,
              {
                width: '16%',
                marginBottom: windowHeight(1.5),
                backgroundColor: appColors.alertRed,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => gotoInfo(ride)}
          >
            <Text style={styles.acceptText}>!</Text>
          </TouchableOpacity>
        </View>
      )}
      {isAmbulance && (
        <View style={[{ width: '100%', marginTop: windowHeight(1) }]}>
          <CustomSlider
            buttonText={translateData?.Accept}
            buttonWidth={windowWidth(86)}
            sliderSize={windowHeight(5)}
            buttonHeight={windowHeight(6.2)}
            leftPadding={windowWidth(1)}
            rightPadding={windowWidth(2.5)}
            onSwipeSuccess={() => {
              acceptAmbulance(ride?.id)
            }}
          />
        </View>
      )}
      {isFindDriver && (
        <View style={[{ width: '100%', marginTop: windowHeight(1) }]}>
          <CustomSlider
            buttonText={translateData?.Accept}
            buttonWidth={windowWidth(86)}
            sliderSize={windowHeight(5)}
            buttonHeight={windowHeight(6.2)}
            leftPadding={windowWidth(1)}
            rightPadding={windowWidth(2.5)}
            onSwipeSuccess={() => {
              acceptFindDriver(ride?.id)
            }}
          />
        </View>
      )}
    </TouchableOpacity>
  )
})
