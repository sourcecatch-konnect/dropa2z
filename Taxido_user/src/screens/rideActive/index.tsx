import {mapVehicleMarker} from '../../design/mapVehicleMarkers';
import {BrandLoader} from '../../design/BrandLogo';
import {PickupCard} from '../../design/PickupCard';
import {reportBookingRouteEta} from '../../utils/bookingSignals';
import {View, TouchableOpacity, Modal, Linking, ActivityIndicator, Image, Platform} from 'react-native';
import {Text} from '../../design/Typography';
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import ContentLoader, { Rect } from "react-content-loader/native";
import {
  SolidLine,
  Button,
  notificationHelper,
  Map,
} from "@src/commonComponent";
import styles from "./styles";
import {
  Call,
  Message,
  CloseIcon,
  Shield,
  ClockSmall,
  DollarCoin,
  Info,
} from "@utils/icons";
import {useRoute,useIsFocused} from "@react-navigation/native";
import {resumeBooking} from "../../utils/bookingNavigation";
import {bookingSnapshot} from "../../utils/bookingPeople";
import {
  appColors,
  appFonts,
  fontSizes,
  windowHeight,
  windowWidth,
} from "@src/themes";
import { useValues } from "@src/utils/context/index";
import { ModalContect } from "./component/modalContect/index";
import { TexiDetail } from "./component/texiDetails/index";
import { DriverData } from "./component/driverData/index";
import { useDispatch, useSelector } from "react-redux";
import { cancelationDataGet } from "../../api/store/actions/cancelationAction";
import { sosData } from "../../api/store/actions/sosAction";
import {DeliveryBackButton} from '../../design/DeliveryBackButton';
import { allRide, allRides } from "@src/api/store/actions/allRideAction";
import { useAppNavigation } from "@src/utils/navigation";
import { external } from "@src/styles/externalStyle";
import Sound from "react-native-sound";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
  BottomSheetTextInput,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import getEchoInstance,{releaseScopedEcho} from "@src/utils/echo";
import { AppDispatch } from "@src/api/store";
import NativeAdComponent from "@src/commonComponent/ads/google/NativeAdCard";
import { cancelDelivery } from "@src/api/services/allRideService";
import { apiErrorMessage } from "@src/api/responseError";

interface Location {
  latitude: number;
  longitude: number;
}

interface CancelDataItem {
  id: number;
  title: string;
}

import {mergeBookingSnapshot, contactPhone, bookingPhoto} from '../../utils/bookingPeople';

export function RideActive() {
  const dispatch = useDispatch<AppDispatch>();
  const route = useRoute();
  const focused=useIsFocused();
  const focusedRef=useRef(focused);focusedRef.current=focused;
  const { activeRideOTP: routeRide, filteredLocations }: any = route?.params || {};
  const { rideData } = useSelector((state: any) => state.allRide);
  const [livePickup,setLivePickup]=useState<any>(null);
  const activeRideOTP = mergeBookingSnapshot(mergeBookingSnapshot(routeRide, rideData),livePickup);
  const [driverLocation, setDriverLocation] = useState<Location | null>(
    activeRideOTP?.driver?.lat && activeRideOTP?.driver?.lng
      ? {
        latitude: parseFloat(activeRideOTP.driver.lat),
        longitude: parseFloat(activeRideOTP.driver.lng),
      }
      : null,
  );
  const [isArriving, setIsArriving] = useState(true);
  const [_driverArrivedTime, setDriverArrivedTime] = useState<
    string | undefined
  >();
  const {
    textColorStyle,
    linearColorStyle,
    bgFullStyle,
    textRTLStyle,
    viewRTLStyle,
    notificationValue,
    isDark,
  } = useValues();
  const [modalVisible, setModalVisible] = useState(false);
  const navigation=useAppNavigation();
  const {navigate}=navigation;
  const { canceldata, loading: reasonsLoading } = useSelector((state: any) => state.cancelationReason);
  const cancelReasons: CancelDataItem[] = Array.isArray(canceldata?.data)
    ? canceldata.data : Array.isArray(canceldata) ? canceldata : [];
  const [customCancelReason, setCustomCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const cancelInFlight = useRef(false);
  const { sosValue } = useSelector((state: any) => state.sos);
  const { translateData, taxidoSettingData } = useSelector(
    (state: any) => state.setting,
  );
  const location = useMemo<Location | null>(() => {
    const pickup = activeRideOTP?.location_coordinates?.[0];
    if (!pickup) return null;

    const latitude = Number(pickup.latitude ?? pickup.lat);
    const longitude = Number(pickup.longitude ?? pickup.lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return { latitude, longitude };
  }, [
    activeRideOTP?.location_coordinates?.[0]?.latitude,
    activeRideOTP?.location_coordinates?.[0]?.longitude,
    activeRideOTP?.location_coordinates?.[0]?.lat,
    activeRideOTP?.location_coordinates?.[0]?.lng,
  ]);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPointsMain = useMemo(() => {
    const adsEnabled =
      taxidoSettingData?.cabbooking_values?.ads?.native_enable == 1;
    const isIos = Platform.OS === "ios";

    const collapsed = isIos ? "47%" : "42.5%";
    let expanded;

    if (adsEnabled) {
      expanded = isIos ? "85%" : "74%";
    } else {
      expanded = isIos ? "56%" : "51%";
    }

    return [collapsed, expanded];
  }, [taxidoSettingData?.cabbooking_values?.ads?.native_enable]);
  const ambulanceRef = useRef<BottomSheetModal>(null);
  const driverInfoSheetRef = useRef<BottomSheetModal>(null);
  const sosSheetRef = useRef<BottomSheetModal>(null);
  const driverWaitSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["38%"], []);
  const sosSnapPoints = useMemo(() => ["40%"], []);
  const driverWaitSnappoints = useMemo(() => ["29%"], []);
  const isSoundPlayingRef = useRef(false);
  const { zoneValue } = useSelector((state: any) => state.zone);
  useEffect(() => {
    if (activeRideOTP?.ride_status?.slug == "arrived") {
      setIsArriving(false);
      setDriverArrivedTime(activeRideOTP?.updated_at);
    } else if (activeRideOTP?.ride_status?.slug == "accepted") {
      setIsArriving(true);
    }
  }, [activeRideOTP?.ride_status?.slug,activeRideOTP?.updated_at]);
  useEffect(() => {
    if(!focused)return;
    if(zoneValue?.id)dispatch(sosData({zone_id:zoneValue.id} as any));
    bottomSheetRef.current?.present();
    return()=>{
      [bottomSheetRef,ambulanceRef,driverInfoSheetRef,sosSheetRef,driverWaitSheetRef].forEach(ref=>ref.current?.dismiss());
    };
  }, [dispatch,zoneValue?.id,focused]);

  const playArrivalSound = useCallback(() => {
    if (isSoundPlayingRef.current) return;
    isSoundPlayingRef.current = true;
    try {
      const sound = new Sound(
        "https://res.cloudinary.com/dwsbvqylx/video/upload/v1748766815/mixkit-happy-bells-notification-937_tbin83.wav",
        undefined,
        error => {
          if (error) {
            isSoundPlayingRef.current = false;
            return;
          }
          sound.play(success => {
            if (success) {
            } else {
            }
            sound.release();
            isSoundPlayingRef.current = false;
          });
          setTimeout(() => {
            sound.stop(() => {
              sound.release();
              isSoundPlayingRef.current = false;
            });
          }, 5000);
        },
      );
    } catch (err) {
      isSoundPlayingRef.current = false;
    }
  }, []);

  const hasNavigatedRef = useRef(false);

  const resetTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setWaitingTime("0 min");
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const { vehicleTypedata } = useSelector(
    (state: any) => state?.vehicleType || {},
  );

  const selectedVehicle = vehicleTypedata?.find(
    (v: any) =>
      v?.name?.trim()?.toLowerCase() ===
      activeRideOTP?.vehicle_type?.name?.trim()?.toLowerCase() ||
      v?.slug?.trim()?.toLowerCase() ===
      activeRideOTP?.vehicle_type?.name?.trim()?.toLowerCase(),
  );

  useEffect(() => {
    if(!focused||!routeRide?.id)return;
    hasNavigatedRef.current=false;
    let disposed=false,busy=false,echoInstance:any=null;
    const rideId=Number(routeRide.id),scope=`rider-pickup:${rideId}:${Date.now()}`;
    const receive=(response:any)=>{
      if(disposed||!focusedRef.current||hasNavigatedRef.current)return;
      const current=bookingSnapshot(response);
      if(Number(current?.id)!==rideId)return;
      setLivePickup(previous=>mergeBookingSnapshot(Number(previous?.id)===rideId?previous:routeRide,current));
      const status=current?.ride_status?.slug?.toLowerCase();
      if(['started','in_progress','on_going'].includes(status)){
        hasNavigatedRef.current=true;resetTimer();
        bottomSheetRef.current?.dismiss();
        resumeBooking(navigation,'Payment',{rideId});
      }else if(status==='arrived'){
        setIsArriving(false);setDriverArrivedTime(current.updated_at);playArrivalSound();
      }else if(['cancelled','canceled','completed'].includes(status)){
        hasNavigatedRef.current=true;resetTimer();bottomSheetRef.current?.dismiss();
        dispatch(allRides());navigation.navigate('MyTabs');
      }
    };
    const refresh=async()=>{
      if(disposed||busy)return;busy=true;
      try{
        const result=await dispatch(allRide({ride_id:rideId})).unwrap();
        if(result?.status>=200&&result.status<300)receive(result.data);
      }catch{/* Preserve the last confirmed pickup during a connection failure. */}
      finally{busy=false;}
    };
    void refresh();
    const timer=setInterval(refresh,5000);
    void(async()=>{
      try{
        const echo=await getEchoInstance(scope);
        if(disposed){releaseScopedEcho(scope,echo);return;}
        echoInstance=echo;
        echo?.private(`ride-status.${rideId}`).listen('.ride.status',receive);
      }catch{/* The focused polling fallback remains available. */}
    })();
    return()=>{disposed=true;clearInterval(timer);releaseScopedEcho(scope,echoInstance);};
  },[routeRide?.id,focused,dispatch,navigation,playArrivalSound]);

  const zoneId = activeRideOTP?.zone?.id;

  useEffect(() => {
    if (zoneId) {
      dispatch(sosData({ zone_id: zoneId } as any));
    }
  }, [dispatch, zoneId]);

  useEffect(() => {
    dispatch(cancelationDataGet());
  }, [dispatch]);

  // Simple distance calculation using Haversine formula
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Earth's radius in kilometers
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    [],
  );

  const handlePickupDuration = useCallback((seconds: number) => {
    reportBookingRouteEta(activeRideOTP?.id,'pickup',seconds);
    if (typeof seconds === 'number' && Number.isFinite(seconds) && seconds >= 0) setArrivalTime(`${Math.max(1, Math.ceil(seconds / 60))} min`);
    else setArrivalTime('ETA unavailable');
  }, [activeRideOTP?.id]);

  // Function to calculate estimated arrival time
  const calculateEstimatedArrivalTime = useCallback(
    (arrivalTimeString: string) => {
      // Check if we're still calculating
      if (arrivalTimeString === "Calculating...") {
        return "...";
      }

      // Extract minutes from the string (e.g., "5 min" -> 5)
      const minutesMatch = arrivalTimeString.match(/(\d+)/);
      if (!minutesMatch) {
        return "...";
      }

      const minutes = parseInt(minutesMatch[1]);
      const now = new Date();
      const estimatedArrival = new Date(now.getTime() + minutes * 60000); // Add minutes to current time

      // Format time in 12-hour format with AM/PM
      let hours = estimatedArrival.getHours();
      const minutesFormatted = estimatedArrival
        .getMinutes()
        .toString()
        .padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'

      return `${hours}:${minutesFormatted} ${ampm}`;
    },
    [],
  );

  const handlePreeCancel = () => {
    if (!cancelInFlight.current) {
      setLoader(false);
      setCancelError("");
    }
    ambulanceRef.current?.present();
  };

  const driverData = () => {
    navigate("DriverInfos", { driverInfo: activeRideOTP?.driver, rideInfo: activeRideOTP });
  };

  const gotoChat = (activeRideOTP: any) => {
    navigate("ChatScreen", {
      driverId: activeRideOTP?.driver?.id,
      riderId: activeRideOTP?.rider?.id,
      rideId: activeRideOTP?.id,
      driverName: activeRideOTP?.driver?.name,
      driverImage: activeRideOTP?.driver?.profile_image_url,
    });
  };

  const handleCall = (activeRideOTP: any) => {
    const phoneNumber = contactPhone(activeRideOTP?.driver);
    if (phoneNumber) Linking.openURL(`tel:${phoneNumber}`).catch(() => undefined);
  };

  const handleSOSPress = () => {
    bottomSheetRef.current?.close();
    setTimeout(() => {
      sosSheetRef.current?.present();
    }, 100);
  };

  const handleContactPress = (item: any) => {
    Linking.openURL(`tel:${item?.phone}`);
  };

  const [loader, setLoader] = useState<boolean>(false);

  const gotoHome = async () => {
    if (cancelInFlight.current) return;
    const reason = customCancelReason.trim() || selectedItem?.title?.trim();
    if (!reason) {
      setCancelError("Select a reason or enter your reason below.");
      return;
    }
    cancelInFlight.current = true;
    setCancelError("");
    setLoader(true);
    try {
      await cancelDelivery(activeRideOTP?.id, reason);
      ambulanceRef.current?.dismiss();
      resetTimer();
      dispatch(allRides());
      navigate("MyTabs");
    } catch (error) {
      setCancelError(apiErrorMessage(error, "Could not cancel this delivery. Please try again."));
    } finally {
      cancelInFlight.current = false;
      setLoader(false);
    }
  };

  const bottomSheetClose = () => {
    if (cancelInFlight.current) return;
    setCancelError("");
    ambulanceRef.current?.close();
  };
  const [selectedId, setSelectedId] = useState(null);
  const [selectedItem, setSelectedItem] = useState<CancelDataItem | null>(null);
  const [arrivalTime, setArrivalTime] = useState("Calculating...");

  const handleSelect = (item: any) => {
    if (cancelInFlight.current) return;
    setCustomCancelReason("");
    setCancelError("");
    if (selectedId === item.id) {
      setSelectedId(null);
      setSelectedItem(null);
    } else {
      setSelectedId(item.id);
      setSelectedItem(item);
    }
  };

  const handleConfirm = () => {
    gotoHome();
  };

  const [waitingTime, setWaitingTime] = useState("1 min");
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    const status = activeRideOTP?.ride_status?.slug;
    const updatedAt = activeRideOTP?.updated_at;

    // Clear previous timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Only start timer if arrived
    if (status === "arrived" && updatedAt) {
      let arrivalTimeMs: number;

      if (typeof updatedAt === "string") {
        // ISO string format
        arrivalTimeMs = new Date(updatedAt).getTime();
      } else {
        // Unknown format
        console.error("Unknown timestamp format:", updatedAt);
        setWaitingTime("1 min");
        return;
      }

      // Check if arrivalTime is valid
      if (isNaN(arrivalTimeMs)) {
        console.error("Invalid arrival time:", updatedAt);
        setWaitingTime("1 min");
        return;
      }

      // Set initial waiting time
      const initialDiffMs = Date.now() - arrivalTimeMs;
      const initialTotalMinutes = Math.max(
        1,
        Math.floor(initialDiffMs / (1000 * 60)),
      );
      let formattedInitial: string;
      if (initialTotalMinutes < 60) {
        formattedInitial = `${initialTotalMinutes} min`;
      } else {
        const hours = Math.floor(initialTotalMinutes / 60);
        const minutes = initialTotalMinutes % 60;
        if (minutes === 0) {
          formattedInitial = `${hours} hr`;
        } else {
          formattedInitial = `${hours} hr ${minutes} min`;
        }
      }
      setWaitingTime(formattedInitial);

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const diffMs = now - arrivalTimeMs;

        // Handle negative time differences
        if (diffMs < 0) {
          setWaitingTime("1 min");
          return;
        }

        // Convert milliseconds to minutes, with minimum of 1
        const totalMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));

        // Format as "X min" or "X hr Y min" for longer waits
        let formatted: string;
        if (totalMinutes < 60) {
          formatted = `${totalMinutes} min`;
        } else {
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          if (minutes === 0) {
            formatted = `${hours} hr`;
          } else {
            formatted = `${hours} hr ${minutes} min`;
          }
        }

        setWaitingTime(formatted);
      }, 1000);
    } else {
      // if not arrived or ride completed, stop timer
      setWaitingTime("1 min");
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeRideOTP?.ride_status?.slug, activeRideOTP?.updated_at]);

  const handleDriverTime = () => {
    bottomSheetRef.current?.close();
    driverWaitSheetRef.current?.present();
  };

  if(!focused)return null;
  return (
    <View style={external.main}>
        <DeliveryBackButton />
      <TouchableOpacity
        onPress={handleSOSPress}
        style={{
          height: windowHeight(30),
          width: windowWidth(110),
          zIndex: 1,
          backgroundColor: isDark ? appColors.bgDark : appColors.whiteColor,
          top: windowHeight(10),
          right: windowHeight(15),
          position: "absolute",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: windowHeight(5),
          borderWidth: 1,
          borderColor: isDark ? appColors.darkBorder : appColors.border,
        }}
      >
        <Shield color={appColors.primary} />
        <Text
          style={{
            fontFamily: appFonts.medium,
            color: isDark ? appColors.whiteColor : appColors.primaryText,
            marginHorizontal: windowWidth(8),
          }}
        >
          {translateData?.safety}
        </Text>
      </TouchableOpacity>
      <View style={styles.mapSection}>
        {activeRideOTP?.location_coordinates?.[0] ? (
          <Map
            markerImage={mapVehicleMarker(activeRideOTP?.vehicle_type,activeRideOTP?.vehicle_type?.vehicle_map_icon_url)}
            userLocation={activeRideOTP?.location_coordinates?.[0] || ""}
            driverId={activeRideOTP?.driver?.id || ""}
            driverLocation={driverLocation}
            setDriverLocation={setDriverLocation}
            onDurationChange={handlePickupDuration}
          />
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: isDark ? appColors.bgDark : appColors.whiteColor,
            }}
          >
            <BrandLoader size="large" color={appColors.primary} />
          </View>
        )}
      </View>
      <View style={{ flex: 0.3, backgroundColor: linearColorStyle }} />
      <BottomSheetModalProvider>
        <BottomSheetModal
          ref={bottomSheetRef}
          index={1}
          snapPoints={snapPointsMain}
          enableDynamicSizing={false}
          enablePanDownToClose={false}
          enableDismissOnClose={false}
          handleIndicatorStyle={{
            backgroundColor: appColors.primary,
            width: "13%",
          }}
          backgroundStyle={{
            backgroundColor: isDark ? appColors.bgDark : appColors.whiteColor,
          }}
         android_keyboardInputMode="adjustResize" >
          <BottomSheetScrollView contentContainerStyle={{padding:14,paddingBottom:28,gap:12}} keyboardShouldPersistTaps="handled">
            {activeRideOTP?.ride_status?.slug==='arrived' ? <>
              <PickupCard role="rider" dark={isDark} name={activeRideOTP?.driver?.name} photo={bookingPhoto(activeRideOTP?.driver)} rating={Number(activeRideOTP?.driver?.rating_count)} vehicle={activeRideOTP?.vehicle_type?.name} plate={activeRideOTP?.plate_number||activeRideOTP?.vehicle_type?.plate_number} pickup={activeRideOTP?.locations?.[0]} onPerson={driverData} onCall={contactPhone(activeRideOTP?.driver)?()=>handleCall(activeRideOTP):undefined} onMessage={activeRideOTP?.driver?.id?()=>gotoChat(activeRideOTP):undefined}>
                <TexiDetail compact otp={activeRideOTP?.otp} vehicleData={activeRideOTP}/>
              </PickupCard>
              <Button title={translateData.cancelRide||'Cancel delivery'} backgroundColor={isDark?appColors.darkHeader:appColors.primaryGray} textColor={appColors.regularText} onPress={handlePreeCancel}/>
            </> : <>

            <View
              style={{
                width: "100%",
                height: windowHeight(45),
                justifyContent: "flex-end",
              }}
            >
              {isArriving ? (
                <View
                  style={{
                    marginHorizontal: windowWidth(15),
                    height: windowHeight(45),
                    borderRadius: windowHeight(6),
                    alignItems: "center",
                  }}
                >
                  {arrivalTime === "Calculating..." ? (
                    <ContentLoader
                      speed={1}
                      width={windowWidth(200)}
                      height={windowHeight(15)}
                      viewBox={`0 0 ${windowWidth(200)} ${windowHeight(30)}`}
                      backgroundColor={
                        isDark ? appColors.darkHeader : "#f3f3f3"
                      }
                      foregroundColor={isDark ? appColors.bgDark : "#ecebeb"}
                    >
                      <Rect
                        x="20"
                        y="0"
                        rx="4"
                        ry="4"
                        width={windowWidth(160)}
                        height={windowHeight(25)}
                      />
                    </ContentLoader>
                  ) : (
                    <Text
                      style={{
                        fontFamily: appFonts.bold,
                        fontSize: fontSizes.FONT22,
                        color: isDark
                          ? appColors.whiteColor
                          : appColors.primaryText,
                      }}
                    >
                      {translateData?.PickupIn} {arrivalTime}
                    </Text>
                  )}
                  {arrivalTime === "Calculating..." ? (
                    <ContentLoader
                      speed={1}
                      width={windowWidth(250)}
                      height={windowHeight(15)}
                      viewBox={`0 0 ${windowWidth(250)} ${windowHeight(20)}`}
                      backgroundColor={
                        isDark ? appColors.darkHeader : "#f3f3f3"
                      }
                      foregroundColor={isDark ? appColors.bgDark : "#ecebeb"}
                      style={{ marginTop: windowHeight(5) }}
                    >
                      <Rect
                        x="20"
                        y="0"
                        rx="4"
                        ry="4"
                        width={windowWidth(200)}
                        height={windowHeight(15)}
                      />
                    </ContentLoader>
                  ) : (
                    <Text
                      style={{
                        fontFamily: appFonts.regular,
                        color: appColors.regularText,
                        marginTop: windowHeight(5),
                      }}
                    >
                      {translateData?.departBy}{" "}
                      {calculateEstimatedArrivalTime(arrivalTime)}{" "}
                      {translateData?.tomet} {activeRideOTP?.driver?.name}
                    </Text>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleDriverTime}
                  activeOpacity={0.7}
                  style={{
                    marginHorizontal: windowWidth(15),
                    height: windowHeight(45),
                    borderRadius: windowHeight(6),
                    alignItems: "center",
                  }}
                >
                  <View style={{ flexDirection: "row" }}>
                    <Text
                      style={{
                        fontFamily: appFonts.bold,
                        fontSize: fontSizes.FONT22,
                        color: isDark
                          ? appColors.whiteColor
                          : appColors.primaryText,
                      }}
                    >
                      {translateData?.driverWait} {waitingTime}
                    </Text>
                    <View
                      style={{
                        justifyContent: "center",
                        marginHorizontal: windowHeight(5),
                      }}
                    >
                      <Info
                        color={
                          isDark ? appColors.whiteColor : appColors.blackColor
                        }
                      />
                    </View>
                  </View>
                  <Text
                    style={{
                      fontFamily: appFonts.regular,
                      color: isDark
                        ? appColors.darkText
                        : appColors.regularText,
                      marginTop: windowHeight(5),
                    }}
                  >
                    {translateData?.driverNote}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.card}>
              <View
                style={[
                  styles.subContainer,
                  {
                    backgroundColor: isDark
                      ? appColors.bgDark
                      : appColors.whiteColor,
                  },
                ]}
              >
                <TexiDetail
                  otp={activeRideOTP?.otp}
                  vehicleData={activeRideOTP}
                />
                <SolidLine
                  color={isDark ? appColors.darkBorder : appColors.border}
                />
                <View
                  style={[
                    styles.profileContainer,
                    { flexDirection: viewRTLStyle },
                  ]}
                >
                  <DriverData
                    driverData={driverData}
                    driverDetail={activeRideOTP?.driver}
                    rideData={activeRideOTP}
                  />
                  <Modal
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => {
                      setModalVisible(false);
                    }}
                  >
                    <ModalContect onpress={() => setModalVisible(false)} />
                  </Modal>
                </View>
                <View
                  style={{
                    flexDirection: viewRTLStyle,
                    marginHorizontal: windowWidth(15),
                    justifyContent: "space-between",
                    marginTop: windowHeight(8),
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.message,
                      {
                        backgroundColor: isDark
                          ? appColors.darkHeader
                          : appColors.lightGray,
                        height: windowHeight(40),
                        width: windowWidth(365),
                      },
                    ]}
                    onPress={() => gotoChat(activeRideOTP)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        marginHorizontal: windowWidth(10),
                        fontFamily: appFonts.regular,
                        color: appColors.regularText,
                      }}
                    >
                      {translateData.sendMessage}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.call,
                      {
                        backgroundColor: appColors.primary,
                      },
                    ]}
                    onPress={() => handleCall(activeRideOTP)}
                  >
                    <Call color={appColors.whiteColor} />
                  </TouchableOpacity>
                </View>
                {taxidoSettingData?.cabbooking_values?.ads?.native_enable == 1 && (
                  <View
                    style={{
                      marginHorizontal: windowWidth(15),
                      marginTop: windowHeight(12),
                    }}
                  >
                    <NativeAdComponent
                      heights={windowHeight(150)}
                      adsHeight={windowHeight(60)}
                    />
                  </View>
                )}
                <View style={styles.cancelBtnView}>
                  <Button
                    title={translateData.cancelRide}
                    backgroundColor={
                      isDark ? appColors.darkHeader : appColors.primaryGray
                    }
                    textColor={appColors.regularText}
                    onPress={handlePreeCancel}
                  />
                </View>
              </View>
            </View>

            </>}
          </BottomSheetScrollView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
      <BottomSheetModalProvider>
        <BottomSheetModal
          ref={driverInfoSheetRef}
          index={1}
          enablePanDownToClose
          handleIndicatorStyle={{
            backgroundColor: appColors.primary,
            width: "13%",
          }}
          snapPoints={snapPoints}
          backdropComponent={props => (
            <BottomSheetBackdrop {...props} pressBehavior="close" />
          )}
          backgroundStyle={{
            backgroundColor: isDark ? appColors.bgDark : appColors.lightGray,
          }}
         android_keyboardInputMode="adjustResize" >
          <BottomSheetView>
            <View
              style={[styles.subContainer, { backgroundColor: bgFullStyle }]}
            >
              <View
                style={[
                  styles.profileContainer,
                  { flexDirection: viewRTLStyle },
                ]}
              >
                <DriverData
                  driverData={driverData}
                  driverDetail={activeRideOTP?.driver}
                  rideData={activeRideOTP}
                />
                <View style={{ flexDirection: viewRTLStyle }}>
                  <TouchableOpacity
                    style={styles.message}
                    onPress={() => gotoChat(activeRideOTP)}
                    activeOpacity={0.7}
                  >
                    <Message />
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.call}
                    onPress={handlePreeCancel}
                  >
                    <Call />
                  </TouchableOpacity>
                </View>
                <Modal
                  transparent={true}
                  visible={modalVisible}
                  onRequestClose={() => {
                    setModalVisible(false);
                  }}
                >
                  <ModalContect onpress={() => setModalVisible(false)} />
                </Modal>
              </View>
              <SolidLine />
              <TexiDetail
                otp={activeRideOTP?.otp}
                vehicleData={activeRideOTP}
              />
              <SolidLine />
              <View
                style={[
                  styles.cancelBtnView,
                  {
                    flexDirection: viewRTLStyle,
                  },
                ]}
              >
                <Button
                  title={translateData.cancelRide}
                  width={350}
                  backgroundColor={
                    isDark ? appColors.darkHeader : appColors.primaryGray
                  }
                  textColor={appColors.regularText}
                  onPress={handlePreeCancel}
                />
              </View>
            </View>
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
      <BottomSheetModalProvider>
        <BottomSheetModal
          ref={ambulanceRef}
          index={1}
          enablePanDownToClose
          handleIndicatorStyle={{
            backgroundColor: appColors.primary,
            width: "13%",
          }}
          snapPoints={snapPoints}
          backdropComponent={props => (
            <BottomSheetBackdrop {...props} pressBehavior="close" />
          )}
          backgroundStyle={{
            backgroundColor: isDark ? appColors.bgDark : appColors.whiteColor,
          }}
         android_keyboardInputMode="adjustResize" >
          <BottomSheetView>
            <View style={styles.modalBg}>
              <View style={[styles.modalBgMain]}>
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexDirection: viewRTLStyle,
                  }}
                >
                  <Text style={[styles.cancelTitle, { color: textColorStyle }]}>
                    {translateData.whyCancel}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.closeIcon}
                    onPress={bottomSheetClose}
                  >
                    <CloseIcon fill={appColors.blackColor} />
                  </TouchableOpacity>
                </View>
                {reasonsLoading && <BrandLoader color={appColors.primary} />}
                {!reasonsLoading && cancelReasons.length === 0 && (
                  <Text style={{ color: textColorStyle, marginBottom: 8 }}>
                    Please enter your cancellation reason below.
                  </Text>
                )}
                {cancelReasons.map((item: CancelDataItem) => (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    key={item.id}
                    style={[
                      styles.container2,
                      {
                        backgroundColor:
                          selectedId === item.id
                            ? appColors.dotLight
                            : isDark
                              ? appColors.darkHeader
                              : appColors.lightGray,
                        flexDirection: viewRTLStyle,
                        borderWidth: selectedId === item.id ? 1 : 0,
                        borderColor:
                          selectedId === item.id
                            ? appColors.primary
                            : "transparent",
                      },
                    ]}
                    onPress={() => handleSelect(item)}
                  >
                    <View style={styles.textContainer}>
                      <Text
                        style={[
                          styles.text,
                          {
                            color: textColorStyle,
                            textAlign: textRTLStyle,
                          },
                        ]}
                      >
                        {item?.title}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

                <BottomSheetTextInput
                  accessibilityLabel="Cancellation reason"
                  placeholder={cancelReasons.length ? "Or enter another reason" : "Enter your cancellation reason"}
                  placeholderTextColor={appColors.regularText}
                  value={customCancelReason}
                  editable={!loader}
                  maxLength={500}
                  onChangeText={value => {
                    setCustomCancelReason(value);
                    setSelectedId(null);
                    setSelectedItem(null);
                    setCancelError("");
                  }}
                  style={{ color: textColorStyle, borderColor: appColors.border, borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 8, minHeight: 48 }}
                />
                {!!cancelError && <Text accessibilityRole="alert" style={{ color: appColors.alertRed, marginTop: 8 }}>{cancelError}</Text>}
                <View style={{ marginTop: windowHeight(8) }}>
                  <Button
                    backgroundColor={appColors.primary}
                    title={translateData.confirm || "Confirm cancellation"}
                    onPress={handleConfirm}
                    loading={loader}
                    disabled={!customCancelReason.trim() && !selectedItem?.title}
                  />
                </View>
              </View>
            </View>
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
      <BottomSheetModalProvider>
        <BottomSheetModal
          ref={sosSheetRef}
          index={1}
          snapPoints={sosSnapPoints}
          enablePanDownToClose={true}
          onDismiss={() => bottomSheetRef.current?.snapToIndex(1)}
          backdropComponent={props => (
            <BottomSheetBackdrop
              {...props}
              disappearsOnIndex={-1}
              appearsOnIndex={0}
            />
          )}
          handleIndicatorStyle={{
            backgroundColor: appColors.primary,
            width: "13%",
          }}
          backgroundStyle={{
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            backgroundColor: isDark ? appColors.bgDark : appColors.whiteColor,
          }}
         android_keyboardInputMode="adjustResize" >
          <BottomSheetView style={{ width: "100%" }}>
            <Text
              style={{
                fontSize: fontSizes.FONT22,
                color: isDark ? appColors.whiteColor : appColors.blackColor,
                fontFamily: appFonts.bold,
                textAlign: "center",
              }}
            >
              {translateData.keepYourselfSafe}
            </Text>
          </BottomSheetView>
          <View style={{ marginTop: windowHeight(20) }}>
            {sosValue?.data?.map((item: any) => (
              <View
                key={item.id.toString()}
                style={{
                  marginHorizontal: windowWidth(18),
                  borderRadius: windowHeight(5),
                }}
              >
                <TouchableOpacity
                  style={[
                    {
                      marginTop: windowHeight(10),
                      padding: windowHeight(10),
                      backgroundColor: isDark
                        ? appColors.darkHeader
                        : appColors.lightGray,
                    },
                  ]}
                  onPress={() => handleContactPress(item)}
                >
                  <View style={{ flexDirection: viewRTLStyle }}>
                    <Image
                      source={{ uri: item.sos_image_url }}
                      style={{
                        height: windowHeight(17),
                        width: windowHeight(17),
                        resizeMode: "contain",
                      }}
                    />
                    <View
                      style={{
                        height: windowHeight(15),
                        width: windowWidth(1.5),
                        backgroundColor: isDark
                          ? appColors.darkBorder
                          : appColors.border,
                        marginHorizontal: windowWidth(12),
                      }}
                    />
                    <Text
                      style={{
                        fontFamily: appFonts.medium,
                        color: isDark
                          ? appColors.darkText
                          : appColors.primaryText,
                      }}
                    >
                      {item?.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </BottomSheetModal>
      </BottomSheetModalProvider>
      <BottomSheetModalProvider>
        <BottomSheetModal
          ref={driverWaitSheetRef}
          index={1}
          snapPoints={driverWaitSnappoints}
          enablePanDownToClose={true}
          onDismiss={() => bottomSheetRef.current?.snapToIndex(1)}
          backdropComponent={props => (
            <BottomSheetBackdrop
              {...props}
              disappearsOnIndex={-1}
              appearsOnIndex={0}
            />
          )}
          handleIndicatorStyle={{
            backgroundColor: appColors.primary,
            width: "13%",
          }}
          backgroundStyle={{
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            backgroundColor: isDark ? appColors.bgDark : appColors.whiteColor,
          }}
         android_keyboardInputMode="adjustResize" >
          <BottomSheetView
            style={{ width: "100%", paddingHorizontal: windowWidth(15) }}
          >
            <View>
              <Text
                style={{
                  fontFamily: appFonts.medium,
                  fontSize: fontSizes.FONT23,
                  textAlign: "center",
                  color: isDark ? appColors.whiteColor : appColors.blackColor,
                }}
              >
                {translateData.driverWaits}
              </Text>
              <Text
                style={{
                  fontFamily: appFonts.regular,
                  color: isDark ? appColors.darkText : appColors.regularText,
                  textAlign: "center",
                  marginTop: windowHeight(5),
                }}
              >
                {translateData.driverWaitDetail}
              </Text>
            </View>
            <View
              style={{
                borderWidth: 1,
                borderColor: isDark ? appColors.darkBorder : appColors.border,
                borderRadius: windowHeight(5),
                marginTop: windowHeight(18),
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  padding: windowHeight(12),
                }}
              >
                <View style={{ flexDirection: "row" }}>
                  <ClockSmall
                    color={isDark ? appColors.darkText : appColors.gray}
                  />
                  <Text
                    style={{
                      fontFamily: appFonts.regular,
                      color: isDark ? appColors.darkText : appColors.gray,
                      marginHorizontal: windowWidth(10),
                    }}
                  >
                    {translateData.freeTimes}:
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: appFonts.medium,
                    color: appColors.primary,
                  }}
                >
                  {
                    selectedVehicle?.vehicle_type_zone
                      ?.free_waiting_time_before_start_ride
                  }{" "}
                  {translateData?.minute}
                </Text>
              </View>
              <View
                style={{
                  borderBottomWidth: 1,
                  borderColor: isDark ? appColors.darkBorder : appColors.border,
                }}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  padding: windowHeight(12),
                }}
              >
                <View style={{ flexDirection: "row" }}>
                  <DollarCoin
                    color={isDark ? appColors.darkText : appColors.gray}
                  />
                  <Text
                    style={{
                      fontFamily: appFonts.regular,
                      color: isDark ? appColors.darkText : appColors.gray,
                      marginHorizontal: windowWidth(10),
                    }}
                  >
                    {translateData.chargePerMin}:
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: appFonts.medium,
                    color: appColors.primary,
                  }}
                >
                  {selectedVehicle?.currency_symbol}{" "}
                  {selectedVehicle?.vehicle_type_zone?.per_minute_charge}{" "}
                  {translateData?.perminute}
                </Text>
              </View>
            </View>
          </BottomSheetView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </View>
  );
}
export default RideActive;
