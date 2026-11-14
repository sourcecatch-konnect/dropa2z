import {DeliveryDetailsFields} from './component/DeliveryDetailsFields';
import {deliveryFormErrors} from '../../utils/deliveryForm';
import {useKeyboardState} from '../../utils/useKeyboardState';
import {vehicleChoices} from '../../utils/vehicleChoices';
import {BrandLoader} from '../../design/BrandLogo';
import {View, FlatList, TouchableOpacity, Pressable, BackHandler, Modal, ActivityIndicator, Alert, Keyboard, AppState, Vibration, Platform, Image, Dimensions, KeyboardAvoidingView} from 'react-native';
import {Text, TextInput} from '../../design/Typography';
import {ScrollView as GestureScrollView} from 'react-native-gesture-handler';
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { commonStyles } from "../../styles/commonStyle";
import { external } from "../../styles/externalStyle";
import {
  Button,
  notificationHelper,
  RadioButton,
  SolidLine,
} from "@src/commonComponent";
import { styles } from "./styles";
import { BookRideItem } from "./bookRideItem/index";
import { ModalContainers } from "./modalContainer/index";
import { useValues } from "@src/utils/context";
import { appColors, appFonts, windowWidth } from "@src/themes";
import { fontSizes, windowHeight } from "@src/themes";
import {
  Back,
  NewContact,
  UserFill,
  Forword,
  Card,
  User,
  Close,
  Coupon,
  ArrowDown,
} from "@utils/icons";
import {useRoute,useIsFocused} from "@react-navigation/native";
import {resumeBooking} from "../../utils/bookingNavigation";
import {resolveAcceptedBooking} from "../../utils/acceptedBooking";
import {bookingSnapshot} from "../../utils/bookingPeople";
import { CancelRender } from "../cancelFare/cancelRenderItem/index";
import { useDispatch, useSelector } from "react-redux";
import {
  allDriver,
  allRide,
  allRides,
  couponVerifyData,
  vehicleTypeDataGet,
  findDriverRequestsAction,
} from "../../api/store/actions/index";
import { AppDispatch } from "../../api/store/index";
import { updateRideRequest } from "../../api/store/actions/index";
import { clearValue, getValue, setValue } from "@src/utils/localstorage";
import { useAppNavigation } from "@src/utils/navigation";
import { URL } from "@src/api/config";
import { getInitialVehicleOptions } from "@src/utils/initialVehicleOptions";
import { GoodsVehicleKind, matchesGoodsVehicle, goodsWeightLimit } from "@src/utils/goodsServiceOptions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BottomSheet, {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  openSettings,
} from "react-native-permissions";
import { RideRequestData } from "./type";
import MapScreen from "./mapBooking/index";
import PaymentItem from "./component/paymentRender";
import CouponsBottomSheet from "./component/couponSheet";
import Checkbox from "@src/commonComponent/checkBox";
import LottieView from "lottie-react-native";
import getEchoInstance,{releaseScopedEcho} from "@src/utils/echo";
import {BookingReview} from './component/BookingReview';
import type {DeliveryDetails} from '../../utils/bookingReview';
import {useLiveBookings} from '../../utils/LiveBookingProvider';
import {bookingDeadline} from '../../utils/liveBooking';
import {bookingChanged} from '../../utils/bookingSignals';

const EMPTY_ARRAY: any[] = [];
const EMPTY_PREFERENCES: {[vehicleId: string]: any[]} = {};

export function BookRide() {
  const {created:recordCreatedBooking}=useLiveBookings();
  const navigation = useAppNavigation();
  const focused=useIsFocused();
  const focusedRef=useRef(focused);focusedRef.current=focused;
  const acceptingRef=useRef(false);
  const route = useRoute<RideRequestData | any>();
  const { self } = useSelector((state: any) => state.account);
  const routeStopsCoords = route.params?.stopsCoords;
  const {
    pickupLocation,
    stops,
    destination,
    service_ID,
    zoneValue,
    service_category_ID,
    receiverName: initialReceiverName,
    countryCode: initialCountryCode,
    phoneNumber: initialPhoneNumber,
    scheduleDate,
    filteredLocations,
    descriptionText,
    otherContect,
    otherName,
    recipientMode: initialRecipientMode,
    pickupCoords,
    destinationCoords,
    selectedImage: initialSelectedImage,
    parcelWeight: initialParcelWeight,
  } = route.params;
  const [recipientMode,setRecipientMode]=useState<'self'|'other'>(initialRecipientMode === 'other' ? 'other' : 'self');
  const [selectedContactName,setSelectedContactName]=useState(initialRecipientMode === 'other' ? (otherName || initialReceiverName || '') : '');
  const [receiverName,setReceiverName]=useState(initialReceiverName || (initialRecipientMode === 'other' ? (otherName || '') : (self?.name || '')));
  const [countryCode,setCountryCode]=useState(initialCountryCode || (initialRecipientMode === 'other' ? '+91' : (self?.country_code ? (String(self.country_code).startsWith('+') ? String(self.country_code) : `+${self.country_code}`) : '+91')));
  const [phoneNumber,setPhoneNumber]=useState(initialPhoneNumber || (initialRecipientMode === 'other' ? (otherContect || '') : String(self?.phone || '')));
  const [parcelWeight,setParcelWeight]=useState(String(initialParcelWeight||''));
  const [selectedImage,setSelectedImage]=useState(initialSelectedImage||null);
  const [deliveryErrors,setDeliveryErrors]=useState<any>({});
  const [quoteState,setQuoteState]=useState<{key:string;error:string;loading:boolean}>({key:'',error:'',loading:true});
  const [quoteRetry,setQuoteRetry]=useState(0);
  const { countinueRide = false } = route.params ?? {};
  const { countinueRideId = "" } = route.params ?? {};
  const { vehicleIdValue = null } = route.params ?? {};
  const preferredVehicleKind: GoodsVehicleKind | null = route.params?.preferredVehicleKind ?? null;
  const {
    textColorStyle,
    bgContainer,
    textRTLStyle,
    isDark,
    viewRTLStyle,
    Google_Map_Key,
  } = useValues();

  const { translateData, taxidoSettingData, settingData } = useSelector(
    (state: any) => state.setting,
  );
  const [mapType, _setMapType] = useState<string>(
    taxidoSettingData?.cabbooking_values?.location?.map_provider,
  );
  const dispatch = useDispatch<AppDispatch>();
  const [seletedPayment, setSeletedPayment] = useState<string | null>(null);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [bookingFooterHeight,setBookingFooterHeight]=useState(96);
  const deliveryDetailsRef = useRef<DeliveryDetails | null>(null);
  const {visible:isKeyboardVisible}=useKeyboardState();
  const selfAutofillRef = useRef('');
  useEffect(() => {
    if (recipientMode !== 'self') return;
    const identityKey = [self?.id, self?.name, self?.phone, self?.country_code].join('|');
    if (!self?.id || selfAutofillRef.current === identityKey) return;
    selfAutofillRef.current = identityKey;
    if (self?.name) setReceiverName(String(self.name));
    if (self?.phone) setPhoneNumber(String(self.phone));
    if (self?.country_code) {
      setCountryCode(String(self.country_code).startsWith('+') ? String(self.country_code) : `+${self.country_code}`);
    }
  }, [recipientMode, self?.id, self?.name, self?.phone, self?.country_code]);

  
  const [selectedItem, setSelectedItem] = useState<string | number | null>(vehicleIdValue);
  const [selectedItemData, setSelectedItemData] = useState<any>(null);
  const [mapRouteInfo, setMapRouteInfo] = useState<{
    distanceKm: number;
    durationMinutes: number;
  } | null>(null);
  const [isChecked, setIsChecked] = useState<boolean>(initialRecipientMode !== 'other');
  const [stopsCoords, setStopsCoords] = useState<
    Array<{ lat: number; lng: number; fullAddress?: string }>
  >(() => (Array.isArray(routeStopsCoords) ? routeStopsCoords : []));
  const [loading, setLoading] = useState<boolean>(true);
  const [serviceVisible, setServiceVisible] = useState<boolean>(false);
  const ZoneArea = zoneValue?.locations || null;
  const { vehicleTypedata } = useSelector(
    (state: any) => state?.vehicleType || {},
  );
  const isGoodsBooking = ['parcel','freight'].includes(String(route.params?.service_name).toLowerCase()) || !!route.params?.preferredVehicleKind;
  const quoteWeight=Number(parcelWeight)>0?Number(parcelWeight):1;
  const quoteKey=JSON.stringify([filteredLocations,service_ID,service_category_ID,quoteWeight]);
  useEffect(()=>{
    if(!isGoodsBooking || countinueRide){setQuoteState({key:quoteKey,error:'',loading:false});return;}
    let active=true,task:any;
    setQuoteState({key:'',error:'',loading:true});
    setCouponValue(null);setAppliedCouponCode('');setInputValue('');
    const timer=setTimeout(()=>{
      task=dispatch(vehicleTypeDataGet({locations:filteredLocations,service_id:service_ID,service_category_id:service_category_ID,weight:quoteWeight}));
      task.unwrap().then(()=>{if(active)setQuoteState({key:quoteKey,error:'',loading:false});}).catch((error:any)=>{if(active)setQuoteState({key:'',error:error?.message||'Unable to refresh the quote. Please retry.',loading:false});});
    },400);
    return ()=>{active=false;clearTimeout(timer);task?.abort();};
  },[dispatch,isGoodsBooking,countinueRide,quoteKey,quoteRetry]);
  const validateDelivery=()=>{
    if(!isGoodsBooking)return true;
    const maxWeight=goodsWeightLimit(selectedItemData)||goodsWeightLimit(preferredVehicleKind)||Number(taxidoSettingData?.cabbooking_values?.ride?.parcel_weight_limit);
    const errors=deliveryFormErrors({receiverName,phoneNumber,countryCode,parcelWeight},maxWeight);
    setDeliveryErrors(errors);
    if(Object.keys(errors).length){notificationHelper('','Please complete the delivery details below the vehicle list.','error');return false;}
    if(quoteState.loading||quoteState.key!==quoteKey||quoteState.error){notificationHelper('',quoteState.error||'Please wait for the updated quote.','error');return false;}
    return true;
  };
  const hasNavigatedRef = useRef(false);
  const handledCancelledRequestRef = useRef<string | null>(null);
  const { driverData } = useSelector((state: any) => state?.allDriver || {});
  const riderId = self?.id;
  const activePaymentMethods = zoneValue?.payment_method;
  const [fareValue, setFareValue] = useState<any>(0);
  const [Warning, setWarning] = useState<boolean>(false);
  const [distance, _setDistance] = useState<boolean | any>(false);
  const [isExpanding, setIsExpanding] = useState<boolean>(countinueRide);
  const [warningMessage, setWarningMessage] = useState<string>();
  const [rideID, setRideId] = useState(countinueRideId);
  const [driverId, setDriverId] = useState([]);
  const [riderequestId, setRideRequestId] = useState<string | number | any>(countinueRideId||undefined);
  const searchDeadlineRef=useRef<number|undefined>(route.params?.searchExpiresAt);
  const mapRef = useRef<any>(null);
  const [bookLoading, setBookLoading] = useState<boolean>(false);
  const animationRef = useRef<any>(null);
  const [isPulsing, setIsPulsing] = useState<boolean>(countinueRide);
  const TIMER_DURATION =
    taxidoSettingData?.cabbooking_values?.ride?.find_driver_time_limit *
    60 *
    1000;
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const intervalTimeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerCancelledRef = useRef(false);
  const cancelBookingRef=useRef<(sync?:boolean)=>Promise<void>>(async()=>{});
  const stopPulseRef=useRef<()=>Promise<void>>(async()=>{});
  const dataList = useMemo<any[]>(
    () => getInitialVehicleOptions<any>(isGoodsBooking && quoteState.key!==quoteKey ? [] : vehicleTypedata).filter(vehicle =>
      !preferredVehicleKind || matchesGoodsVehicle(vehicle, preferredVehicleKind),
    ),
    [vehicleTypedata, preferredVehicleKind, isGoodsBooking, quoteState.key, quoteKey],
  );
  // The Home screen may carry an older vehicle id while fresh fares are loading.
  // Only the current quote can be used to create a delivery, so resolve selection
  // from the two currently available options (Bike or Auto) before continuing.
  const availableVehicleOptions = useMemo(
    () => vehicleChoices(dataList),
    [dataList],
  );
  const resolvedSelectedVehicle = useMemo(() => {
    const selectedKey = String(
      selectedItemData?.choice_key ?? selectedItemData?.id ?? selectedItem ?? vehicleIdValue ?? "",
    );
    return (
      availableVehicleOptions.find(
        item => String(item.choice_key ?? item.id) === selectedKey,
      ) ??
      (preferredVehicleKind
        ? availableVehicleOptions.find(item => matchesGoodsVehicle(item, preferredVehicleKind))
        : undefined) ??
      availableVehicleOptions[0] ??
      null
    );
  }, [availableVehicleOptions, preferredVehicleKind, selectedItem, selectedItemData?.choice_key, selectedItemData?.id, vehicleIdValue]);
  const driverZoneId = zoneValue?.data?.[0]?.id;
  const availableDriverList = useMemo(() => {
    if (Array.isArray(driverData)) return driverData;
    if (Array.isArray(driverData?.data)) return driverData.data;
    if (Array.isArray(driverData?.data?.data)) return driverData.data.data;
    return [];
  }, [driverData]);
  const nearestAvailableDriver = useMemo(() => {
    if (!isPulsing || !pickupCoords || selectedItem == null) return null;

    const requestedDriverIds = new Set(
      (Array.isArray(driverId) ? driverId : []).map((driver: any) =>
        String(typeof driver === "object" ? driver?.id ?? driver?.driver_id : driver),
      ),
    );
    let nearest: { id: string | number; lat: number; lng: number; distanceKm: number } | null = null;

    for (const driver of availableDriverList) {
      const driverIdValue = driver?.id ?? driver?.driver_id;
      if (
        requestedDriverIds.size > 0 &&
        !requestedDriverIds.has(String(driverIdValue))
      ) {
        continue;
      }

      const vehicleTypeId =
        driver?.vehicle_type_id ?? driver?.vehicle_info?.vehicle_type_id;
      if (String(vehicleTypeId) !== String(selectedItem)) continue;

      const online = driver?.is_online;
      if (online != null && Number(online) !== 1 && online !== true) continue;
      if (Number(driver?.is_on_ride) === 1 || driver?.is_on_ride === true) continue;

      const location = Array.isArray(driver?.location)
        ? driver.location[0]
        : driver?.location ?? driver?.current_location;
      const rawLat = location?.lat ?? location?.latitude ?? driver?.lat ?? driver?.latitude;
      const rawLng = location?.lng ?? location?.longitude ?? driver?.lng ?? driver?.longitude;
      if (rawLat == null || rawLng == null || rawLat === "" || rawLng === "") continue;

      const lat = Number(rawLat);
      const lng = Number(rawLng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

      const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
      const latDelta = toRadians(lat - pickupCoords.lat);
      const lngDelta = toRadians(lng - pickupCoords.lng);
      const a =
        Math.sin(latDelta / 2) ** 2 +
        Math.cos(toRadians(pickupCoords.lat)) *
          Math.cos(toRadians(lat)) *
          Math.sin(lngDelta / 2) ** 2;
      const distanceKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      if (!nearest || distanceKm < nearest.distanceKm) {
        nearest = {
          id: driverIdValue ?? `${lat},${lng}`,
          lat,
          lng,
          distanceKm,
        };
      }
    }

    return nearest;
  }, [availableDriverList, driverId, isPulsing, pickupCoords, selectedItem]);
  const [isValid, setIsValid] = useState<boolean>(true);
  const { goBack } = useAppNavigation();
  const [coupon, setCoupon] = useState<string | null | any>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>(coupon?.code || "");

  const increaseAmount = parseFloat(
    taxidoSettingData?.cabbooking_values?.ride?.increase_amount_range ?? 10,
  );

  const minFare = parseFloat(
    selectedItemData?.charges?.min_bidding_faire_amount,
  );
  const maxFare = parseFloat(
    selectedItemData?.charges?.max_bidding_faire_amount,
  );
  const numericFare = parseFloat(fareValue) || minFare;
  const [couponValue, setCouponValue] = useState<any>();
  const [finalPrices, setFinalPrices] = useState<{ [key: string]: string }>({});
  const mainSheetRef = useRef<BottomSheet>(null);
  const vehicleDetailsSheetRef = useRef<BottomSheetModal>(null);
  const noVehicleSheetRef = useRef<BottomSheetModal>(null);
  const paymentSheetRef = useRef<BottomSheetModal>(null);
  const riderSheetRef = useRef<BottomSheetModal>(null);
  const couponsSheetRef = useRef<BottomSheetModal>(null);

  const [mapBottomPadding, setMapBottomPadding] = useState<number>(0);
  // Keep sheet geometry stable when the keyboard changes; BottomSheetTextInput handles IME movement.
  const mainSnapPoints = useMemo(() => ['55%','88%'], []);
  const vehicleDetailSnapPoints = useMemo(() => ["75%"], ["70%"]);
  const noVehicleSnapPoints = useMemo(() => ["50%"], []);
  const paymentSnapPoints = useMemo(() => ["60%"], []);
  const riderSnapPoints = useMemo(() => ["70%"], []);
  const couponsSnapPoints = useMemo(() => ["30%"], []);

  const webViewRef = useRef<any>(null);
  const [driverbidValue, setDriverBidValue] = useState<any[]>([]);
  const [selectedItem1, setSelectedItem1] = useState<number | null>(null);

  const selectedPrefs: {[vehicleId: string]: any[]} = EMPTY_PREFERENCES;

  const [selectedFinalPrice, setSelectedFinalPrice] = useState<string>("");

  // Track bottom sheet open states
  const [isVehicleDetailsOpen, setIsVehicleDetailsOpen] =
    useState<boolean>(false);
  const [isNoVehicleOpen, setIsNoVehicleOpen] = useState<boolean>(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [isRiderOpen, setIsRiderOpen] = useState<boolean>(false);
  const [isCouponsOpen, setIsCouponsOpen] = useState<boolean>(false);
  const isPreferenceOpen = false;
  const showBookingFooter = !(isVehicleDetailsOpen || isNoVehicleOpen || isPaymentOpen || isRiderOpen || isCouponsOpen || isPreferenceOpen || isExpanding || isKeyboardVisible);

  // Declare all useCallback wrapped functions at the beginning
  const sendToWebView = useCallback(
    (action: any, data = {}) => {
      const payload = JSON.stringify({ action, ...data });
      webViewRef.current?.postMessage(payload);
    },
    [webViewRef],
  );

  const cancelTimer = useCallback(async () => {
    setIsPulsing(false);
    timerCancelledRef.current = true;

    if (intervalTimeRef.current) {
      clearInterval(intervalTimeRef.current);
      intervalTimeRef.current = null;
    }

    await AsyncStorage.removeItem("ride_timer_start");
    setIsTimerRunning(false);
    setRemainingTime(0);
    setIsExpanding(false);
  }, [intervalTimeRef, timerCancelledRef]);

  const handleTimerComplete = useCallback(async () => {
    if (timerCancelledRef.current) return;

    handleCancelRide();
    await stopPulseAnimation();
    setBookLoading(false);

    if (riderequestId) {
      dispatch(
        updateRideRequest({
          payload: { status: "cancelled" },
          ride_id: riderequestId,
        }),
      );
    }
  }, [dispatch, riderequestId]);

  const checkTimer = useCallback(async () => {
    if (timerCancelledRef.current) return;

    const storedStart = await AsyncStorage.getItem("ride_timer_start");
    if (storedStart) {
      const elapsed = Date.now() - parseInt(storedStart, 10);
      const remaining = (searchDeadlineRef.current ?? (parseInt(storedStart,10)+TIMER_DURATION)) - Date.now();

      if (remaining <= 0) {
        setRemainingTime(0);
        await handleTimerComplete();
      } else {
        setRemainingTime(remaining);
      }
    }
  }, [TIMER_DURATION, handleTimerComplete]);

  const checkTimerRef = useRef(checkTimer);
  useEffect(() => {
    checkTimerRef.current = checkTimer;
  }, [checkTimer]);



  

  const preferences = selectedItemData?.vehicle_type_zone?.preferences || [];

  useEffect(() => {
    if (pickupCoords && destinationCoords) {
      sendToWebView("setMarkers", {
        pickup: pickupCoords,
        destination: destinationCoords,
        apiKey: Google_Map_Key,
      });
    }
  }, [pickupCoords, destinationCoords, Google_Map_Key, sendToWebView]);

  useEffect(() => {
    const backAction = () => {
      // Do not leave a live booking request behind when Android Back is
      // pressed.  Keep the rider on this screen; cancellation remains an
      // explicit action from the Cancel Ride control.
      if (isExpanding || isTimerRunning || bookLoading) {
        Alert.alert(
          "Delivery request in progress",
          "Please wait for a driver or use Cancel Delivery to cancel this request.",
          [{ text: "OK" }],
        );
        return true;
      }

      // Check if any bottom sheet is open
      const isAnySheetOpen =
        isVehicleDetailsOpen ||
        isNoVehicleOpen ||
        isPaymentOpen ||
        isRiderOpen ||
        isCouponsOpen ||
        isPreferenceOpen;

      if (isAnySheetOpen) {
        // If any sheet is open, close them all
        vehicleDetailsSheetRef.current?.close();
        noVehicleSheetRef.current?.close();
        paymentSheetRef.current?.close();
        riderSheetRef.current?.close();
        couponsSheetRef.current?.close();

        return true; // Prevent default back behavior
      } else {
        // If no sheet is open, navigate back
        navigation.navigate("MyTabs");
        return true;
      }
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );
    return () => backHandler.remove();
  }, [
    isExpanding,
    isTimerRunning,
    bookLoading,
    navigation,
    isVehicleDetailsOpen,
    isNoVehicleOpen,
    isPaymentOpen,
    isRiderOpen,
    isCouponsOpen,
    isPreferenceOpen,
  ]);

  useEffect(() => {
    if (selectedItemData?.id && finalPrices[selectedItemData.id]) {
      setSelectedFinalPrice(`${finalPrices[selectedItemData.id]}`);
    }
  }, [selectedItemData, finalPrices]);

  useEffect(() => {
    if (
      selectedItemData?.id &&
      !taxidoSettingData?.cabbooking_values?.activation?.bidding
    ) {
      const vehicleId = selectedItemData.id.toString();
      const vehiclePrefs = selectedPrefs[vehicleId] || [];
      const basePrice = Number(selectedItemData?.charges?.total ?? 0);
      const prefsTotal = Array.isArray(vehiclePrefs)
        ? vehiclePrefs.reduce((sum, pref) => sum + Number(pref.price ?? 0), 0)
        : 0;
      const finalPrice = basePrice + prefsTotal;
      setSelectedFinalPrice(`${finalPrice}`);
      setFinalPrices(prev => ({ ...prev, [selectedItemData.id]: finalPrice }));
    }
  }, [
    selectedPrefs,
    selectedItemData?.id,
    taxidoSettingData?.cabbooking_values?.activation?.bidding,
    selectedItemData?.charges?.total,
  ]);

  const handleIncrease = () => {
    Vibration.vibrate(42);
    const newFare = numericFare + increaseAmount;

    if (newFare >= maxFare) {
      setFareValue(String(maxFare.toFixed(2)));
    } else {
      setFareValue(String(newFare.toFixed(2)));
    }
  };

  const handleDecrease = () => {
    Vibration.vibrate(42);
    const newFare = numericFare - increaseAmount;

    if (newFare <= minFare) {
      setFareValue(String(minFare.toFixed(2)));
    } else {
      setFareValue(String(newFare.toFixed(2)));
    }
  };

  const isPlusDisabled = numericFare >= maxFare;
  const isMinusDisabled = numericFare <= minFare;
  const quotedDistance = Number.parseFloat(
    String(selectedItemData?.charges?.total_distance ?? ""),
  );
  const quotedDuration = Number.parseFloat(
    String(selectedItemData?.charges?.duration ?? ""),
  );
  const displayedDistance =
    Number.isFinite(quotedDistance) && quotedDistance > 0
      ? selectedItemData?.charges?.total_distance
      : mapRouteInfo
        ? mapRouteInfo.distanceKm.toFixed(1)
        : "—";
  const displayedDuration =
    Number.isFinite(quotedDuration) && quotedDuration > 0
      ? selectedItemData?.charges?.duration
      : mapRouteInfo
        ? `${Math.max(1, Math.round(mapRouteInfo.durationMinutes))} mins`
        : "— mins";

  useEffect(() => {
    if (selectedItemData?.charges?.total) {
      setFareValue(selectedItemData.charges.total);
    }
  }, [selectedItemData]);

  useEffect(() => {
    setInputValue(coupon?.code || "");
  }, [coupon]);

  useEffect(() => {
    // Keep the booking form fully expanded whenever its mode changes.  The
    // previous loading-based timeout often fired before the sheet mounted, so
    // the first visit stayed at 55% and hid the photo field below the footer.
    const frame = requestAnimationFrame(() => {
      mainSheetRef.current?.snapToIndex(1);
    });

    return () => cancelAnimationFrame(frame);
  }, [isExpanding]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.3}
      />
    ),
    [],
  );

  const fitMapToRoute = useCallback(
    (bottomPadding = 0) => {
      if (mapRef.current && pickupCoords && destinationCoords) {
        const coordinates = [
          { latitude: pickupCoords.lat, longitude: pickupCoords.lng },
          ...stopsCoords.map(stop => ({
            latitude: stop.lat,
            longitude: stop.lng,
          })),
          { latitude: destinationCoords.lat, longitude: destinationCoords.lng },
        ];

        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: {
            top: 100,
            right: 50,
            bottom: bottomPadding + 50,
            left: 50,
          },
          animated: true,
        });
      }
    },
    [pickupCoords, destinationCoords, stopsCoords],
  );

  const handleMainSheetChange = useCallback(
    (index: number) => {
let padding = 0;
      if (index > 0) {
        const snapPoint = mainSnapPoints[index];
        if (typeof snapPoint === "string" && snapPoint.endsWith("%")) {
          padding =
            Dimensions.get("window").height * (parseInt(snapPoint, 10) / 100);
        } else if (typeof snapPoint === "number") {
          padding = snapPoint;
        }
      }
      setMapBottomPadding(padding);
    },
    [mainSnapPoints],
  );

  const handlePaymentSheetChange = useCallback(
    (index: number) => {
      setIsPaymentOpen(index !== -1);
      let padding = 0;
      if (index > -1) {
        const snapPoint = paymentSnapPoints[index];
        if (typeof snapPoint === "string" && snapPoint.endsWith("%")) {
          padding =
            Dimensions.get("window").height * (parseInt(snapPoint, 10) / 100);
        } else if (typeof snapPoint === "number") {
          padding = snapPoint;
        }
      }
      setMapBottomPadding(padding);
    },
    [paymentSnapPoints],
  );

  useEffect(() => {
    fitMapToRoute(mapBottomPadding);
  }, [mapBottomPadding, fitMapToRoute]);

  useEffect(() => {
    // Do not erase an existing selection during the short quote-loading state.
    if (isGoodsBooking && (quoteState.loading || quoteState.key !== quoteKey)) return;
    const selectedVehicle = resolvedSelectedVehicle;
    if (!selectedVehicle) return;

    if (String(selectedItem) !== String(selectedVehicle.id)) {
      setSelectedItem(selectedVehicle.id);
    }
    if (String(selectedItemData?.choice_key ?? selectedItemData?.id) !== String(selectedVehicle.choice_key ?? selectedVehicle.id)) {
      setSelectedItemData(selectedVehicle);
    }
    if (
      taxidoSettingData?.cabbooking_values?.activation?.bidding == 0 &&
      !selectedItemData?.id
    ) {
      const quotedFare = Number(
        selectedVehicle?.charges?.total ??
          (Number(selectedVehicle?.min_per_unit_charge ?? 0) * Number(distance ?? 0)),
      );
      setFareValue(`${Number.isFinite(quotedFare) ? quotedFare : 0}`);
    }
  }, [
    resolvedSelectedVehicle,
    distance,
    isGoodsBooking,
    quoteKey,
    quoteState.key,
    quoteState.loading,
    selectedItem,
    selectedItemData?.choice_key,
    selectedItemData?.id,
    taxidoSettingData?.cabbooking_values?.activation?.bidding,
  ]);

  const startTimer = useCallback(async (resume = false) => {
    const storedStart=resume?await AsyncStorage.getItem('ride_timer_start'):null;
    const start=searchDeadlineRef.current&&Number.isFinite(TIMER_DURATION)?searchDeadlineRef.current-TIMER_DURATION:storedStart?Number(storedStart):Date.now();
    await AsyncStorage.setItem("ride_timer_start", String(start));
    setIsTimerRunning(true);
    timerCancelledRef.current = false;
    checkTimerRef.current();
    if(intervalTimeRef.current)clearInterval(intervalTimeRef.current);
    intervalTimeRef.current = setInterval(() => checkTimerRef.current(), 1000);
  }, [TIMER_DURATION]);

  // Functions are already declared with useCallback above

  useEffect(() => {
    const listener = AppState.addEventListener("change", nextState => {
      if (nextState === "active") {
        checkTimerRef.current();
      }
    });

    return () => {
      listener.remove();
      if (intervalTimeRef.current) {
        clearInterval(intervalTimeRef.current);
      }
    };
  }, []);

  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);

  const renderItemRequest = ({ item }: any) => (
    <CancelRender item={item} pickupLocation={pickupLocation} />
  );

  const formatScheduleDate = ({ DateValue, TimeValue }: any) => {
    if (!DateValue || !TimeValue) return "";
    const [day, month, year] = DateValue.split(" ");
    const monthMap: Record<string, number> = {
      Jan: 1,
      Feb: 2,
      Mar: 3,
      Apr: 4,
      May: 5,
      Jun: 6,
      Jul: 7,
      Aug: 8,
      Sep: 9,
      Oct: 10,
      Nov: 11,
      Dec: 12,
    };

    const monthIndex = monthMap[month];
    if (!monthIndex) {
      return translateData.bookRideInvalidDate;
    }

    const timeParts = TimeValue.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/);
    if (!timeParts) {
      return translateData.bookRideInvalidTime;
    }

    let [_, hours, minutes, period] = timeParts;
    hours =
      period === "PM" && hours !== "12"
        ? +hours + 12
        : hours === "12" && period === "AM"
        ? "00"
        : hours;
    const formattedDate = `${year}-${String(monthIndex).padStart(
      2,
      "0",
    )}-${String(day).padStart(2, "0")} ${String(hours).padStart(
      2,
      "0",
    )}:${minutes}`;
    return formattedDate;
  };

  const scheduleDates = {
    DateValue: scheduleDate?.DateValue,
    TimeValue: scheduleDate?.TimeValue,
  };

  const allLocations = [
    pickupLocation,
    ...(stops || []).map(
      (stop, index) => stopsCoords[index]?.fullAddress || stop,
    ),
    destination,
  ];
  const allLocationCoords = [pickupCoords, ...stopsCoords, destinationCoords];
  const allCoordinatesPresent =
    allLocationCoords.length === (Array.isArray(stops) ? stops.length : 0) + 2 &&
    allLocationCoords.every(
      coordinate =>
        Number.isFinite(coordinate?.lat) && Number.isFinite(coordinate?.lng),
    );
  const selectedVehicleData = dataList.find(item => String(item?.id) === String(selectedItem));
  const minimumCharge = selectedVehicleData?.min_per_unit_charge || null;
  const minChargeRide = minimumCharge * distance;

  useEffect(() => {
    if (!Array.isArray(ZoneArea) || ZoneArea?.length < 2) {
      setServiceVisible(true);
    }
  }, [ZoneArea]);

  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const handlePress = async (reviewCode?: string) => {
    const code = (typeof reviewCode === 'string' ? reviewCode : inputValue).trim();
    if (!code || applyingCoupon) return;
    setApplyingCoupon(true);
    setIsValid(false);
    setCouponValue(null);
    setAppliedCouponCode("");
    setSuccessMessage("");
    try {
      const result = await dispatch(couponVerifyData({
        coupon: code,
        service_id: service_ID,
        vehicle_type_id: selectedItemData?.vehicle_type_zone?.vehicle_type_id,
        locations: filteredLocations,
        service_category_id: String(service_category_ID),
        weight: parcelWeight,
      })).unwrap();
      if (result?.success !== true) throw new Error(result?.message || "This coupon cannot be applied.");
      setCouponValue(result);
      setInputValue(code);
      setAppliedCouponCode(code);
      setIsValid(true);
      setSuccessMessage(translateData.couponsApply || "Coupon applied");
    } catch (error: any) {
      const message = error?.message || "Unable to apply coupon. Please try again.";
      setSuccessMessage(message);
      notificationHelper("", message, "error");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const gotoCoupon = () => {
    navigation.navigate("PromoCodeScreen", { from: "payment", getCoupon });
  };

  const removeCoupon = () => {
    setInputValue("");
    setCouponValue("");
    setCoupon(null);
    setAppliedCouponCode("");
    setIsValid(false);
    setSuccessMessage("");
  };

  const getCoupon = (val: string) => {
    setCoupon(val);
  };

  useEffect(() => {
    if (!driverZoneId) return;

    const refreshAvailableDrivers = () =>
      dispatch(
        allDriver({
          zones: driverZoneId,
          is_online: 1,
          is_on_ride: 0,
        }),
      );

    refreshAvailableDrivers();
    if (!isPulsing) return;

    const refreshInterval = setInterval(refreshAvailableDrivers, 15000);
    return () => clearInterval(refreshInterval);
  }, [dispatch, driverZoneId, isPulsing]);

  const requestContactsPermission = async () => {
    const isSimulator = Platform.OS === "ios" && !process.env.IS_DEVICE;
    try {
      const permission =
        Platform.OS === "ios"
          ? PERMISSIONS.IOS.CONTACTS
          : PERMISSIONS.ANDROID.READ_CONTACTS;

      const goToChooseRider = () =>
        navigation.navigate("ChooseRiderScreen", {
          ...route.params,
          destination,
          stops,
          pickupLocation,
          service_ID,
          zoneValue,
          scheduleDate,
          service_category_ID,
          selectedImage,
          parcelWeight,
          receiverName,countryCode,phoneNumber,
          pickupCoords,
          destinationCoords,
        });

      const status = await check(permission);

      if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
        goToChooseRider();
        return;
      }

      if (status === RESULTS.DENIED) {
        const reqResult = await request(permission);
        if (reqResult === RESULTS.GRANTED || reqResult === RESULTS.LIMITED) {
          goToChooseRider();
        } else {
          Alert.alert(
            "Contacts Permission",
            "Permission is required to pick a contact. You can enable it from Settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => openSettings() },
            ],
          );
        }
        return;
      }

      if (status === RESULTS.BLOCKED) {
        Alert.alert(
          "Contacts Permission Blocked",
          "You have permanently denied contacts permission. Please enable it from Settings.",
          [
            { text: "Open Settings", onPress: () => openSettings() },
            { text: "Cancel", style: "cancel" },
          ],
        );
        return;
      }

      if (status === RESULTS.UNAVAILABLE) {
        if (isSimulator) {
          goToChooseRider();
          return;
        }
        Alert.alert(
          "Contacts Unavailable",
          "Contacts permission is not available on this device.",
        );
        return;
      }
    } catch (err) {
      console.warn("requestContactsPermission error:", err);
    }
  };

  useEffect(() => {
    const expectedStopCount = Array.isArray(stops) ? stops.length : 0;
    const incomingStops = Array.isArray(routeStopsCoords) ? routeStopsCoords : [];
    const isComplete =
      incomingStops.length === expectedStopCount &&
      incomingStops.every(
        coordinate =>
          Number.isFinite(coordinate?.lat) && Number.isFinite(coordinate?.lng),
      );

    if (isComplete) {
      setStopsCoords(incomingStops);
    } else if (expectedStopCount === 0) {
      setStopsCoords([]);
    } else {
      // Never geocode a short stop label again. It can match another city.
      setStopsCoords([]);
      console.error("A selected stop is missing its original selected coordinates.");
    }
    setLoading(false);
  }, [routeStopsCoords, stops]);
  const radioPress = () => {
    setIsChecked(true);
    setRecipientMode('self');
    setSelectedContactName('');
    setReceiverName(String(self?.name || ''));
    setCountryCode(self?.country_code ? (String(self.country_code).startsWith('+') ? String(self.country_code) : `+${self.country_code}`) : '+91');
    setPhoneNumber(String(self?.phone || ''));
    setDeliveryErrors({});
  };

  const chooseRider = () => {
    requestContactsPermission();
  };

  const renderItem = useCallback(
    ({ item }: any) => {
      const vehicleId = item.id.toString();
      const vehiclePrefs = selectedPrefs[vehicleId] || EMPTY_ARRAY;

      return (
        <BookRideItem
          couponsData={couponValue}
          item={item}
          isDisabled={isExpanding}
          showSeats={!preferredVehicleKind && !item?.charges?.is_goods_delivery}
          selectedPrefsValue={vehiclePrefs}
          isSelected={String(selectedItemData?.choice_key ?? selectedItemData?.id ?? vehicleIdValue) === String(item.choice_key ?? item.id)}
          onPress={() => {
            if (!isExpanding) {
              setSelectedItem(item.id);
              setSelectedItemData(item);
              if (
                taxidoSettingData?.cabbooking_values?.activation?.bidding === 0
              ) {
                const basePrice = Number(item?.charges?.total ?? 0);
                const prefsTotal = Array.isArray(vehiclePrefs)
                  ? vehiclePrefs.reduce(
                      (sum, pref) => sum + Number(pref.price ?? 0),
                      0,
                    )
                  : 0;
                const finalPrice = basePrice + prefsTotal;
                setFareValue(`${finalPrice}`);
                setSelectedFinalPrice(`${finalPrice}`);
              }
            }
          }}
          onPressAlternate={() => {
            if (!isExpanding) {
              setSelectedItem(item.id);
              setSelectedItemData(item);
              setIsVehicleDetailsOpen(true);
              vehicleDetailsSheetRef.current?.present();
            }
          }}
          onPriceCalculated={(id: number, price: number | string) => {
            setFinalPrices(prev => {
              if (prev[id] === price) return prev;
              return { ...prev, [id]: price };
            });
          }}
        />
      );
    },
    [
      selectedPrefs,
      selectedItemData?.id,
      selectedItemData?.choice_key,
      isExpanding,
      couponValue,
      taxidoSettingData?.cabbooking_values?.activation?.bidding,
    ],
  );

  const paymentData = (index: number) => {
    setSelectedItem1(index);
    setSeletedPayment(activePaymentMethods[index].name);
    paymentSheetRef.current?.close();
    mainSheetRef.current?.snapToIndex(1);
  };

  const formattedData = JSON.stringify(
    allCoordinatesPresent
      ? allLocationCoords.map(({ lat, lng }) => ({ lat, lng }))
      : [],
  );

  const forms = {
    location_coordinates: JSON.parse(formattedData),
    locations: allLocations,
    ride_fare:
      taxidoSettingData?.cabbooking_values?.activation?.bidding == 1
        ? String(fareValue)
        : String(selectedFinalPrice),
    service_id: service_ID,
    service_category_id: service_category_ID,
    vehicle_type_id: selectedItemData?.id,
    distance: selectedItemData?.charges?.total_distance,
    distance_unit: zoneValue?.distance_type,
    payment_method: seletedPayment || "cash",
    wallet_balance: null,
    coupon: appliedCouponCode || null,
    description: descriptionText ?? null,
    weight: parcelWeight,
    name: receiverName,
    currency_code: zoneValue?.currency_code,
    country_code: countryCode,
    phone: phoneNumber,
    new_rider:
      recipientMode === 'other' && selectedContactName.trim() && phoneNumber.trim()
        ? {
            name: receiverName,
            phone: phoneNumber,
          }
        : null,

    schedule_time: formatScheduleDate(scheduleDates),
    ...(selectedImage &&
      selectedImage[0] && {
        selectedImage: {
          uri: selectedImage[0]?.uri || null,
          type: selectedImage[0]?.type || null,
          fileName: selectedImage[0]?.fileName || null,
        },
      }),
  };

  const newRiderName = forms.new_rider?.name?.trim();
  const newRiderPhone = forms.new_rider?.phone?.trim();

  const handleBookRide = async () => {
    if(!validateDelivery()) return;
    if (!allCoordinatesPresent) {
      Alert.alert(
        "Route needs updating",
        "Go back and reselect each pickup, stop, and destination in the same Indian city.",
      );
      return;
    }

    Keyboard.dismiss();
    setBookLoading(true);
    sendToWebView("focusPickup");

    if (!selectedVehicleData) {
      setIsNoVehicleOpen(true);
      noVehicleSheetRef.current?.present(1);
      setBookLoading(false);
      return;
    }

    const startRideProcess = async () => {
      if (!isExpanding) {
        const bookingCreated = await BookRideRequest(forms);
        if (!bookingCreated) {
          setBookLoading(false);
          return;
        }

        await startTimer();

        setIsExpanding(true);
        setIsPulsing(true);
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript("startPulsingAnimation();");
        }
        startPulseAnimation();
        setIsPulsing(true);
        focusOnPickup();
        paymentSheetRef.current?.close();
        mainSheetRef.current?.snapToIndex(1);
      }
    };

    if (taxidoSettingData?.cabbooking_values?.activation?.bidding == 1) {
      const roundedMaxFare = Math.round(maxFare * 100) / 100;
      if (fareValue < minFare) {
        setWarning(true);
        setWarningMessage(`${translateData?.maxtobe}  ${minFare.toFixed(2)}`);
        setBookLoading(false);

        return;
      }
      if (fareValue > roundedMaxFare) {
        setWarning(true);
        setWarningMessage(`${translateData?.maxtobe} ${maxFare.toFixed(2)}`);
        setBookLoading(false);
        return;
      }
      setWarning(false);
      await startRideProcess();
    } else {
      await startRideProcess();
    }
  };

  const BookRideRequest = async (forms: any) => {
    const token = await getValue("token");
    try {
      const formData = new FormData();
      forms.location_coordinates.forEach((coord: any, index: number) => {
        formData.append(`location_coordinates[${index}][lat]`, coord.lat);
        formData.append(`location_coordinates[${index}][lng]`, coord.lng);
      });
      forms.locations.forEach((loc: any, index: number) => {
        formData.append(`locations[${index}]`, loc);
      });
      formData.append("ride_fare", forms.ride_fare);
      formData.append("service_id", forms.service_id);
      formData.append("service_category_id", forms.service_category_id);
      formData.append("vehicle_type_id", forms.vehicle_type_id);
      formData.append("distance", forms.distance);
      formData.append("distance_unit", forms.distance_unit);
      formData.append("payment_method", forms.payment_method);
      formData.append("wallet_balance", forms.wallet_balance || "");
      formData.append("coupon", forms.coupon || "");
      formData.append("description", forms.description);
      if (deliveryDetailsRef.current) {
        const details=deliveryDetailsRef.current;
        formData.append('delivery_details[goods_type]',details.goods_type);
        formData.append('delivery_details[restricted_items_confirmed]','1');
        if(details.gstin){formData.append('delivery_details[gstin]',details.gstin);formData.append('delivery_details[business_name]',details.business_name||'');}
      }
      formData.append("weight", forms.weight || "");
      formData.append("parcel_receiver[name]", forms.name || "");
      formData.append("parcel_receiver[phone]", forms.phone || "");
      formData.append(
        "parcel_receiver[country_code]",
        forms.country_code || "",
      );
      formData.append("currency_code", forms.currency_code || "");
      if (newRiderName && newRiderPhone) {
        formData.append("new_rider[name]", newRiderName || "");
        formData.append("new_rider[phone]", newRiderPhone || "");
      }
      formData.append("schedule_time", forms.schedule_time || "");
      if (forms.selectedImage) {
        formData.append("cargo_image", {
          uri: forms.selectedImage.uri || {},
          type: forms.selectedImage.type || {},
          name: forms.selectedImage.fileName || {},
        });
      }

      const response = await fetch(`${URL}/api/rideRequest`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = await response.json();

      // Store ride request ID in local storage

      if (responseData?.id) {
        await setValue(
          "current_ride_request_id",
          JSON.stringify(responseData.id),
        );

        //  MUST await this
        const saved = await getValue("current_ride_request_id");

        if (!saved) {
          console.warn(" Ride ID NOT saved!");
        } else {
        }
      }

      if (responseData?.id && service_category_ID == 4) {
        navigation.navigate("MyTabs");
        notificationHelper("", translateData.reqBook, "success");
      }

      if (response.status == 403) {
        await clearValue();
        navigation.reset({
          index: 0,
          routes: [{ name: "SignIn" }],
        });
        return;
      }

      if (response?.ok) {
        searchDeadlineRef.current=bookingDeadline(responseData,Number(taxidoSettingData?.cabbooking_values?.ride?.find_driver_time_limit));
        recordCreatedBooking(responseData);
        setRideRequestId(responseData?.id);
        setRideId(responseData?.id);
        setDriverId(responseData?.drivers);
        return true;
      } else if (responseData) {
        notificationHelper("", responseData?.message, "error");
        setBookLoading(false);
        return false;
      }
    } catch (error) {
      console.error("BookRideRequest error:", error);
      setBookLoading(false);
      return false;
    }
    return false;
  };

  const handleCancelRide = useCallback(async (syncCancellationWithServer = true) => {
    await cancelTimer();
    await AsyncStorage.removeItem("current_ride_request_id");

    setIsPulsing(false);
    stopPulseAnimation();
    setBookLoading(false);
    setIsExpanding(false);

    if (webViewRef.current) {
      webViewRef.current.injectJavaScript("drawRouteAndMarkers();");
    }
    sendToWebView("fitRoute");

    paymentSheetRef.current?.close();
    mainSheetRef.current?.snapToIndex(1);

    if (riderequestId && syncCancellationWithServer) {
      const payload = {
        status: "cancelled",
      };

      dispatch(updateRideRequest({ payload: payload, ride_id: riderequestId }))
        .then(_res => {
          bookingChanged();
          console.log("Ride Cancelled Successfully", _res);
        })
        .catch(_err => {
          console.log("Ride Cancelled Failed", _err);
        });
    }
  }, [
    cancelTimer,
    dispatch,
    riderequestId,
    taxidoSettingData?.cabbooking_values?.activation?.bidding,
    webViewRef,
    sendToWebView,
    paymentSheetRef,
    mainSheetRef,
  ]);

  const handleAdminDeclinedRequest = useCallback(
    (requestId: string | number | undefined, message?: string) => {
      const cancelledRequestId = String(requestId ?? "");
      if (
        !cancelledRequestId ||
        cancelledRequestId !== String(riderequestId ?? "") ||
        handledCancelledRequestRef.current === cancelledRequestId
      ) {
        return;
      }

      handledCancelledRequestRef.current = cancelledRequestId;
      notificationHelper(
        "",
        message || "Your booking was declined by Admin.",
        "error",
      );
      void handleCancelRide(false);
      dispatch(allRides());
    },
    [dispatch, handleCancelRide, riderequestId],
  );

  const backScreen = () => {
    goBack();
  };

  const gotoHome = () => {
    navigation.navigate("MyTabs");
  };

  const confirmBack = () => {
    goBack();
  };

  const startPulseAnimation = () => {
    setBookLoading(false);
    setIsPulsing(true);
    hasNavigatedRef.current = false;
  };

  const stopPulseAnimation = useCallback(async () => {
    cancelTimer();
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
    setIsPulsing(false);
  }, [animationRef, cancelTimer]);

  useEffect(()=>{
    if(focused)return;
    [vehicleDetailsSheetRef,noVehicleSheetRef,paymentSheetRef,riderSheetRef,couponsSheetRef].forEach(ref=>ref.current?.dismiss());
  },[focused]);

  const handleRideAccepted = useCallback(async(event:any)=>{
    if(!focusedRef.current||hasNavigatedRef.current||acceptingRef.current||!riderequestId)return;
    const incoming=bookingSnapshot(event);
    if(incoming?.ride_request_id&&String(incoming.ride_request_id)!==String(riderequestId))return;
    acceptingRef.current=true;
    try{
      // A personal-channel event can belong to an older delivery. Resolve the
      // current request's ride_id first, then read its current PIN/status.
      const ride=await resolveAcceptedBooking(riderequestId,
        ()=>dispatch(findDriverRequestsAction()).unwrap(),
        id=>dispatch(allRide({ride_id:id})).unwrap());
      if(!ride||!focusedRef.current)return;
      const status=ride?.ride_status?.slug;
      if(!['accepted','arrived','started','in_progress','on_going'].includes(status))return;
      hasNavigatedRef.current=true;
      bookingChanged();dispatch(allRides());
      await stopPulseAnimation();
      if(!focusedRef.current)return;
      if(ride?.service_category?.service_category_type==='schedule'){
        navigation.reset({index:0,routes:[{name:'MyTabs'}]});
        notificationHelper('',translateData.rideScheduled,'success');
      }else if(['started','in_progress','on_going'].includes(status)){
        resumeBooking(navigation,'Payment',{rideId:ride.id});
      }else{
        resumeBooking(navigation,'RideActive',{activeRideOTP:ride,filteredLocations});
      }
    }catch{/* Keep searching; the focused recovery poll will retry. */}
    finally{acceptingRef.current=false;}
  },[dispatch,navigation,riderequestId,stopPulseAnimation,filteredLocations,translateData.rideScheduled]);

  useEffect(() => {
    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, []);

  useEffect(() => {
    if (!focused || !riderequestId || !isPulsing) {
      return;
    }

    let echoInstance: any;
    let disposed=false;
    const scope=`rider-search:${riderequestId}:${Date.now()}`;

    const setupStatusListener = async () => {
      echoInstance = await getEchoInstance(scope);
      if(disposed){releaseScopedEcho(scope,echoInstance);return;}

      if (echoInstance?.connector?.pusher?.connection) {
        const connection = echoInstance.connector.pusher.connection;
        connection.bind("state_change", (states: any) => {
          if (states.current === "failed" || states.current === "unavailable") {
            notificationHelper("", "Connection lost. Retrying...", "error");
          }
        });
      }

      // --- Channel 1: Ride-specific request channel (Bids & Acceptance) ---
      const requestChannel = `ride-request.${riderequestId}`;

      echoInstance
        .private(requestChannel)
        .subscribed(() => {})
        .error((err: any) => {
          notificationHelper(
            "",
            "Subscription failed: " + (err?.message || "Check connection"),
            "error",
          );
        })
        .listen(".bid.new", (e: any) => {
          if(disposed||!focusedRef.current)return;
          const newBid = e.data || e;
          if (newBid) {
            const formattedBid = {
              ...newBid,
              id:
                newBid.id ||
                newBid.bid_id ||
                newBid.driver_id ||
                String(Date.now()),
              ride_request_id: newBid.ride_request_id,
              amount: newBid.amount || newBid.bid_amount,
              driver: {
                id: newBid.driver_id,
                name: newBid.driver_name,
                profile_image_url: newBid.profile_image_url,
                rating_count: newBid.rating_count,
                review_count: newBid.review_count,
              },
            };
            setDriverBidValue((prev: any[]) => {
              const exists = prev.some(
                b =>
                  b.id === formattedBid.id ||
                  (b.driver && b.driver.id === formattedBid.driver.id),
              );
              if (exists) return prev;
              Vibration.vibrate(1000);
              return [formattedBid, ...prev];
            });
          }
        })
        .listen(".bid.accepted", (e: any) => {
          const data = e.data || e;
          if(!disposed&&focusedRef.current)void handleRideAccepted(data);
        });

      // --- Channel 2: Rider's personal channel (Sequential Acceptance) ---
      if (riderId) {
        const riderChannel = `rider.${riderId}`;

        echoInstance
          .private(riderChannel)
          .listen(".ride.accepted", (data: any) => {
            const rideData = data.data || data;
            if(!disposed&&focusedRef.current)void handleRideAccepted(rideData);
          })
          .listen(".ride.no_driver_found", (data: any) => {
            if(disposed||!focusedRef.current)return;
            notificationHelper(
              "",
              translateData.noDriverFound || "No driver found",
              "error",
            );
            handleCancelRide(false);
          })
          .listen(".ride.request.cancelled", (data: any) => {
            if(disposed||!focusedRef.current)return;
            const cancellation = data.data || data;
            handleAdminDeclinedRequest(
              cancellation?.ride_request_id,
              cancellation?.message,
            );
          });
      }
    };

    setupStatusListener();

    return () => {
      disposed=true;
      releaseScopedEcho(scope,echoInstance);
    };
  }, [
    focused,
    riderequestId,
    isPulsing,
    riderId,
    handleRideAccepted,
    handleCancelRide,
    handleAdminDeclinedRequest,
    translateData.noDriverFound,
  ]);

  // Recover ride acceptance if the private realtime event is missed. The
  // rider's request exposes ride_id after acceptance; the ride endpoint then
  // provides the OTP required by the active ride screen.
  useEffect(() => {
    if (!focused || !riderequestId || !isPulsing) return;

    let disposed = false;
    let checking = false;

    const recoverAcceptedRide = async () => {
      if (disposed || checking || hasNavigatedRef.current) return;
      checking = true;

      try {
        const requestResult = await dispatch(findDriverRequestsAction()).unwrap();
        const requestItems = Array.isArray(requestResult?.data)
          ? requestResult.data
          : Array.isArray(requestResult)
            ? requestResult
            : [];
        const currentRequest = requestItems.find(
          (request: any) => String(request?.id) === String(riderequestId),
        );
        const requestStatus = String(currentRequest?.status || "").toLowerCase();
        if (requestStatus === "cancelled" || requestStatus === "canceled") {
          handleAdminDeclinedRequest(
            riderequestId,
            "Your booking was declined or cancelled.",
          );
          return;
        }
        const acceptedRideId = currentRequest?.ride_id;

        if (!acceptedRideId || disposed || hasNavigatedRef.current) return;

        const rideResult = await dispatch(
          allRide({ ride_id: Number(acceptedRideId) }),
        ).unwrap();
        const acceptedRide = rideResult?.data?.data ?? rideResult?.data;

        if (acceptedRide?.otp && !disposed) {
          handleRideAccepted(acceptedRide);
        }
      } catch (error) {
        console.warn("Ride acceptance recovery check failed:", error);
      } finally {
        checking = false;
      }
    };

    void recoverAcceptedRide();
    const interval = setInterval(() => {
      void recoverAcceptedRide();
    }, 10000);

    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, [dispatch, focused, handleAdminDeclinedRequest, handleRideAccepted, isPulsing, riderequestId]);

  // --- Channel 3: Driver-specific channels for ride cancellation ---
  useEffect(() => {
    if (!focused || !isPulsing || !Array.isArray(driverId) || driverId.length === 0) {
      return;
    }

    let echoInstance: any;

    const setupCancellationListeners = async () => {
      echoInstance = await getEchoInstance();

      driverId.forEach((id: any) => {
        echoInstance
          .private(`driver-ride-request-${id}`)
          .listen(".cancel.bidding.ride.request", (payload: any) => {
            if(!focusedRef.current)return;
            console.log("Ride Request Cancelled:", payload);

            Alert.alert(
              "Delivery Cancelled",
              `Ride #${
                payload?.ride_number || riderequestId
              } has been cancelled by the rider.`,
              [{ text: "OK" }],
            );

            handleCancelRide();
          });
      });
    };

    setupCancellationListeners();

    return () => {
      if (echoInstance && Array.isArray(driverId)) {
        driverId.forEach((id: any) => {
          echoInstance.leave(`driver-ride-request-${id}`);
        });
      }
    };
  }, [focused,isPulsing, driverId, riderequestId, handleCancelRide]);

  useEffect(() => {
    const checkForOngoingRide = async () => {
      // Only auto-resume if explicitly requested via countinueRide param
      // or if we want to support auto-resume on fresh entry (comment out countinueRide check if so)
      if (!countinueRide) return;

      try {
        const storedRideId = countinueRideId || await AsyncStorage.getItem(
          "current_ride_request_id",
        );
        if (storedRideId) {
          setRideId(storedRideId);
          setRideRequestId(storedRideId);
          setIsExpanding(true);
          setIsTimerRunning(true);
          if(!searchDeadlineRef.current)searchDeadlineRef.current=bookingDeadline({created_at:route.params?.searchStartedAt},Number(taxidoSettingData?.cabbooking_values?.ride?.find_driver_time_limit));
          startTimer(true);
        }
      } catch (error) {
        console.error("Error checking for ongoing ride:", error);
      }
    };

    checkForOngoingRide();
  }, [startTimer, countinueRide,countinueRideId]);

  if (!focused || !pickupCoords || !destinationCoords) {
    return null;
  }

  const focusOnPickup = () => {
    if (pickupCoords?.lat && pickupCoords?.lng && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: pickupCoords?.lat,
          longitude: pickupCoords?.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        1000,
      );
    }
  };

  const renderPaymentItem = ({ item, index }: any) => (
    <PaymentItem
      item={item}
      index={index}
      isDark={isDark}
      viewRTLStyle={viewRTLStyle}
      textColorStyle={textColorStyle}
      textRTLStyle={textRTLStyle}
      selectedItem1={selectedItem1}
      paymentData={paymentData}
      activePaymentMethodsLength={activePaymentMethods.length}
    />
  );

  return (
    <BottomSheetModalProvider>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[external.fx_1, { backgroundColor: bgContainer }]}
      >
        <Modal
          transparent={true}
          visible={serviceVisible}
          animationType="slide"
          onRequestClose={goBack}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <LottieView
                source={require("../../assets/images/gif/noService.json")}
                style={styles.serviceImg}
              />
              <Text
                style={[
                  styles.modalText,
                  {
                    color: isDark
                      ? appColors.whiteColor
                      : appColors.primaryText,
                  },
                ]}
              >
                {translateData.noService}
              </Text>
              <Text
                style={[
                  styles.modalDetail,
                  {
                    color: isDark
                      ? appColors.whiteColor
                      : appColors.primaryText,
                  },
                ]}
              >
                {translateData.noServiceDes}
              </Text>
              <View
                style={[
                  styles.buttonContainer,
                  { flexDirection: viewRTLStyle },
                ]}
              >
                <Button title={translateData.goBack} onPress={confirmBack} />
              </View>
            </View>
          </View>
        </Modal>

        {loading ? (
          <View>
            <BrandLoader size="large" color={appColors.primary} />
          </View>
        ) : (
          <>
            <View style={[commonStyles.flexContainer]}>
              {isPulsing ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.backBtn,

                    { backgroundColor: bgContainer },
                    {
                      borderColor: isDark
                        ? appColors.darkBorder
                        : appColors.border,
                    },
                  ]}
                  onPress={gotoHome}
                >
                  <ArrowDown />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[
                    styles.backBtn,

                    { backgroundColor: bgContainer },
                    {
                      borderColor: isDark
                        ? appColors.darkBorder
                        : appColors.border,
                    },
                  ]}
                  onPress={backScreen}
                >
                  <Back />
                </TouchableOpacity>
              )}
              <View style={styles.ridekm}>
                <View
                  style={[
                    styles.ridekmView,
                    {
                      flexDirection: viewRTLStyle,
                      alignItems: "center",
                      justifyContent: "center",
                      marginHorizontal: windowWidth(4),
                    },
                  ]}
                >
                  <>
                    <Text style={styles.ridekmText}>
                      {displayedDistance}
                    </Text>
                    <Text
                      style={[
                        styles.ridekmText,
                        { marginHorizontal: windowWidth(1.5) },
                      ]}
                    >
                      {selectedItemData?.charges?.distance_unit}
                    </Text>
                  </>
                </View>
                <View
                  style={[
                    styles.ridekmMainView,
                    { backgroundColor: bgContainer },
                  ]}
                >
                  <Text>
                    <Text style={styles.rideMinText}>
                      {displayedDuration}
                    </Text>
                  </Text>
                </View>
              </View>
              <View style={{ flex: 0.61 }}>
                <MapScreen
                  ref={mapRef}
                  mapType={mapType}
                  pickupCoords={pickupCoords}
                  stopsCoords={stopsCoords}
                  destinationCoords={destinationCoords}
                  isDark={isDark}
                  Google_Map_Key={Google_Map_Key}
                  isPulsing={isPulsing}
                  mapBottomPadding={mapBottomPadding}
                  nearbyVehicle={nearestAvailableDriver}
                  vehicleMarkerImage={
                    selectedItemData?.vehicle_map_icon_url ||
                    selectedItemData?.vehicle_type?.vehicle_map_icon_url
                  }
                  vehicleLabel={
                    selectedItemData?.name ||
                    selectedItemData?.vehicle_type?.name ||
                    "vehicle"
                  }
                  onRouteInfo={setMapRouteInfo}
                />
              </View>
            </View>

            {driverbidValue?.length > 0 ? (
              <View
                style={[external.mt_10, external.mh_15, styles.bidContainer]}
              >
                <FlatList
                  renderItem={renderItemRequest}
                  data={driverbidValue}
                  removeClippedSubviews={true}
                  keyExtractor={(item, index) =>
                    (item?.id || item?.driver_id || index).toString()
                  }
                />
              </View>
            ) : null}
          </>
        )}

        <BottomSheet
          ref={mainSheetRef}
          index={1}
          snapPoints={mainSnapPoints}
          bottomInset={isExpanding ? 0 : bookingFooterHeight}
          enableDynamicSizing={false}
          onChange={handleMainSheetChange}
          enablePanDownToClose={false}
          enableContentPanningGesture={isExpanding}
          backgroundStyle={{ backgroundColor: bgContainer }}
          handleIndicatorStyle={styles.mainBottomSheet}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
         android_keyboardInputMode="adjustResize" >
            <BottomSheetScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" nestedScrollEnabled showsVerticalScrollIndicator persistentScrollbar style={{flex:1}} contentContainerStyle={{paddingBottom:20}}>
              <View
                style={[
                  styles.selectedOptionView,
                  { flexDirection: viewRTLStyle },
                ]}
              >
                <Text
                  style={[
                    styles.carType,
                    { color: textColorStyle, textAlign: textRTLStyle },
                  ]}
                >
                  {isExpanding
                    ? translateData.searchDriver
                    : "Choose a Vehicle"}
                </Text>
                {isExpanding && (
                  <View
                    style={[styles.mainSheet, { flexDirection: viewRTLStyle }]}
                  >
                    {isTimerRunning ? (
                      <View style={styles.timerContainer}>
                        <Text style={styles.timerText}>
                          {minutes}:{seconds.toString().padStart(2, "0")}s
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.loaderContainer}></View>
                    )}
                  </View>
                )}
              </View>
              {isGoodsBooking&&!isExpanding&&quoteState.loading&&<Text accessibilityLiveRegion="polite" style={{paddingHorizontal:18,paddingVertical:12,color:textColorStyle}}>Calculating vehicles and fares...</Text>}
              {isGoodsBooking&&!isExpanding&&!!quoteState.error&&<View accessibilityLiveRegion="polite" style={{marginHorizontal:18,marginBottom:12,padding:14,borderRadius:16,backgroundColor:isDark?'#332719':'#FFF4E5'}}>
                <Text style={{fontFamily:appFonts.medium,color:textColorStyle}}>{/same city|could not identify this city|location verification|select a nearby address/i.test(quoteState.error) ? 'Route not available' : 'Vehicle fares unavailable'}</Text>
                <Text style={{marginTop:6,color:textColorStyle}}>{quoteState.error}</Text>
                <TouchableOpacity accessibilityRole="button" onPress={()=>/same city|could not identify this city|location verification|select a nearby address/i.test(quoteState.error) ? goBack() : setQuoteRetry(value=>value+1)} style={{paddingVertical:12}}><Text style={{fontFamily:appFonts.medium,color:isDark?'#FFBE60':'#A64B00'}}>{/same city|could not identify this city|location verification|select a nearby address/i.test(quoteState.error) ? 'Change delivery location' : 'Retry vehicle fares'}</Text></TouchableOpacity>
              </View>}
              <View style={styles.vehicleContainer}>
                {vehicleChoices(dataList).map((item:any,index:number)=><React.Fragment key={String(item.choice_key??item.id)}>{renderItem({item})}</React.Fragment>)}

              </View>

              {isGoodsBooking&&!isExpanding&&<>
                <DeliveryDetailsFields value={{receiverName,phoneNumber,countryCode,parcelWeight}} onChange={(key,value)=>{({receiverName:setReceiverName,phoneNumber:setPhoneNumber,countryCode:setCountryCode,parcelWeight:setParcelWeight})[key](value);}} image={selectedImage} onImage={setSelectedImage} dark={isDark} errors={deliveryErrors} disabled={bookLoading}/>

              </>}

              {taxidoSettingData?.cabbooking_values?.activation?.bidding ==
                1 && (
                <View style={[external.mh_10]}>
                  <Text
                    style={[
                      styles.title,
                      {
                        color: isDark
                          ? appColors.whiteColor
                          : appColors.primaryText,
                        textAlign: textRTLStyle,
                      },
                    ]}
                  >
                    {translateData.offerYourFare}
                  </Text>
                  <View
                    style={[
                      styles.inputcontainer,
                      {
                        backgroundColor: isDark
                          ? appColors.darkBorder
                          : appColors.lightGray,
                        flexDirection: viewRTLStyle,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.plusBtn,
                        isMinusDisabled && { opacity: 0.4 },
                      ]}
                      onPress={handleDecrease}
                      disabled={isMinusDisabled}
                    >
                      <Text>-{increaseAmount}</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={[styles.textInput, { color: textColorStyle }]}
                      value={String(fareValue)}
                      onChangeText={text => setFareValue(text)}
                      keyboardType="number-pad"
                      placeholder={String(minFare)}
                      placeholderTextColor={appColors.regularText}
                    />
                    <TouchableOpacity
                      style={[
                        styles.plusBtn,
                        isPlusDisabled && { opacity: 0.4 },
                      ]}
                      onPress={handleIncrease}
                      disabled={isPlusDisabled}
                    >
                      <Text>+{increaseAmount}</Text>
                    </TouchableOpacity>
                  </View>
                  {Warning && (
                    <Text style={styles.warningText}>{warningMessage}</Text>
                  )}
                </View>
              )}

              {isExpanding && (
                <View style={styles.cancelBtn}>
                  <Button
                    title={translateData.cancelRide}
                    onPress={handleCancelRide}
                    loading={bookLoading}
                    disabled={bookLoading}
                    backgroundColor={appColors.alertRed}
                    textColor={appColors.whiteColor}
                  />
                </View>
              )}
            </BottomSheetScrollView>

        </BottomSheet>

        <BottomSheetModal
          ref={vehicleDetailsSheetRef}
          snapPoints={vehicleDetailSnapPoints}
          backgroundStyle={{
            backgroundColor: isDark ? bgContainer : appColors.lightGray,
          }}
          handleIndicatorStyle={{
            backgroundColor: isDark
              ? appColors.whiteColor
              : appColors.primaryText,
            width: windowWidth(40),
          }}
          backdropComponent={renderBackdrop}
          onChange={index => setIsVehicleDetailsOpen(index !== -1)}
         android_keyboardInputMode="adjustResize" >
          <BottomSheetView style={external.fx_1}>
            <ModalContainers
              distance={distance}
              selectedItemData={selectedItemData}
              onPress={() => vehicleDetailsSheetRef.current?.close()}
              minChargeRide={minChargeRide}
              couponsData={couponValue}
            />
          </BottomSheetView>
        </BottomSheetModal>

        <BottomSheetModal
          ref={noVehicleSheetRef}
          snapPoints={noVehicleSnapPoints}
          backgroundStyle={{ backgroundColor: bgContainer }}
          handleIndicatorStyle={{
            backgroundColor: isDark
              ? appColors.whiteColor
              : appColors.primaryText,
            width: windowWidth(40),
          }}
          backdropComponent={renderBackdrop}
          onChange={index => setIsNoVehicleOpen(index !== -1)}
         android_keyboardInputMode="adjustResize" >
          <View
            style={{
              flex: 1,
              padding: 20,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={[styles.modalText, { color: textColorStyle }]}>
              {translateData.selectVehicleType}
            </Text>
            <View
              style={[
                styles.buttonContainer,
                { justifyContent: "center", marginTop: windowHeight(18) },
              ]}
            >
              <Button
                title={translateData.modelCloseBtn}
                onPress={() => noVehicleSheetRef.current?.close()}
              />
            </View>
          </View>
        </BottomSheetModal>

        <BottomSheetModal
          ref={paymentSheetRef}
          index={0}
          snapPoints={paymentSnapPoints}
          onChange={handlePaymentSheetChange}
          enablePanDownToClose={true}
          backgroundStyle={{ backgroundColor: bgContainer }}
          handleIndicatorStyle={{
            backgroundColor: isDark
              ? appColors.whiteColor
              : appColors.primaryText,
            width: windowWidth(40),
          }}
          backdropComponent={renderBackdrop}
         android_keyboardInputMode="adjustResize" >
          <BottomSheetView style={styles.switchContainer}>
            <View>
              <View
                style={[
                  styles.switchRiderView,
                  { flexDirection: viewRTLStyle },
                ]}
              >
                <Text
                  style={[
                    commonStyles.mediumText23,
                    { color: textColorStyle, textAlign: textRTLStyle },
                  ]}
                >
                  {translateData.paymentMethodSelect}
                </Text>
                <TouchableOpacity
                  onPress={() => paymentSheetRef.current?.close()}
                  activeOpacity={0.7}
                  style={{ bottom: windowHeight(1.7) }}
                >
                  <Close />
                </TouchableOpacity>
              </View>
            </View>
            <BottomSheetFlatList
              data={activePaymentMethods}
              renderItem={renderPaymentItem}
              keyExtractor={(item, index) => index.toString()}
            />
          </BottomSheetView>
        </BottomSheetModal>

        <BottomSheetModal
          ref={riderSheetRef}
          index={0}
          enableDynamicSizing={false}
          snapPoints={riderSnapPoints}
          backgroundStyle={{ backgroundColor: bgContainer }}
          handleIndicatorStyle={{
            backgroundColor: isDark
              ? appColors.whiteColor
              : appColors.primaryText,
            width: windowWidth(40),
          }}
          backdropComponent={renderBackdrop}
          onChange={index => setIsRiderOpen(index !== -1)}
         android_keyboardInputMode="adjustResize" >
          <BottomSheetView style={[styles.switchContainer]}>
            <View>
              <View
                style={[
                  styles.switchRiderView,
                  { flexDirection: viewRTLStyle },
                ]}
              >
                <Text
                  style={[
                    commonStyles.mediumText23,
                    { color: textColorStyle, textAlign: textRTLStyle },
                  ]}
                >
                  {translateData.talkingRide}
                </Text>
                <TouchableOpacity
                  onPress={() => riderSheetRef.current?.close()}
                  activeOpacity={0.7}
                  style={{ bottom: windowHeight(1.7) }}
                >
                  <Close />
                </TouchableOpacity>
              </View>
              <Text
                style={[
                  commonStyles.regularText,
                  external.mt_3,
                  {
                    fontSize: fontSizes.FONT16,
                    lineHeight: windowHeight(14),
                    textAlign: textRTLStyle,
                  },
                ]}
              >
                {translateData.notice}
              </Text>
            </View>
            <View style={[external.mt_20]}>
              <View
                style={[
                  external.fd_row,
                  external.ai_center,
                  external.js_space,
                  { flexDirection: viewRTLStyle },
                ]}
              >
                <View
                  style={[
                    { flexDirection: viewRTLStyle, right: windowWidth(3) },
                  ]}
                >
                  <UserFill />
                  <Text
                    style={[
                      commonStyles.mediumTextBlack12,
                      {
                        fontSize: fontSizes.FONT19,
                        marginHorizontal: windowWidth(8),
                      },
                      {
                        color: isDark
                          ? appColors.whiteColor
                          : appColors.primaryText,
                      },
                    ]}
                  >
                    {translateData.myself}
                  </Text>
                </View>
                <Pressable style={styles.pressable}>
                  <RadioButton
                    onPress={radioPress}
                    checked={isChecked}
                    color={appColors.primary}
                  />
                </Pressable>
              </View>
              <SolidLine marginVertical={14} />
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  external.fd_row,
                  external.js_space,
                  { flexDirection: viewRTLStyle, marginTop: windowHeight(1) },
                ]}
                onPress={chooseRider}
              >
                <View style={[external.fd_row, external.ai_center]}>
                  <NewContact />
                  <Text
                    style={[
                      styles.chooseAnotherAccount,
                      { marginLeft: windowWidth(10) },
                    ]}
                  >
                    {translateData.contact}
                  </Text>
                </View>
                <Forword />
              </TouchableOpacity>
            </View>
          </BottomSheetView>
        </BottomSheetModal>
        

        <CouponsBottomSheet
          ref={couponsSheetRef}
          couponsSnapPoints={couponsSnapPoints}
          bgContainer={bgContainer}
          isDark={isDark}
          textColorStyle={textColorStyle}
          textRTLStyle={textRTLStyle}
          viewRTLStyle={viewRTLStyle}
          translateData={translateData}
          inputValue={inputValue}
          setInputValue={(value: string) => { setInputValue(value); setAppliedCouponCode(""); setCouponValue(null); setIsValid(false); setSuccessMessage(""); }}
          handlePress={handlePress}
          isValid={isValid}
          couponValue={couponValue}
          successMessage={successMessage}
          removeCoupon={removeCoupon}
          gotoCoupon={gotoCoupon}
          onChange={index => setIsCouponsOpen(index !== -1)}
        />

        {showBookingFooter && (
          <View onLayout={event=>{const height=event.nativeEvent.layout.height;setBookingFooterHeight(previous=>Math.abs(previous-height)>1?height:previous);}} style={[styles.bookBtn, { backgroundColor: bgContainer }]}>
            <View style={{paddingBottom:10,flexShrink:0}}>
              <GestureScrollView
                horizontal
                nestedScrollEnabled
                disallowInterruption
                showsHorizontalScrollIndicator
                persistentScrollbar
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={[
                  styles.cardView,
                  { flexDirection: viewRTLStyle },
                ]}
                style={{ height: 64, flexGrow: 0 }}
              >
                
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    if (bookLoading || isTimerRunning) {
                      notificationHelper(
                        "",
                        translateData.waitBooking,
                        "error",
                      );
                      return;
                    }
                    setIsPaymentOpen(true);
                    paymentSheetRef.current?.present();
                  }}
                  style={[
                    styles.switchUser,
                    {
                      flexDirection: viewRTLStyle,
                      minWidth: windowWidth(120),
                      marginRight: windowWidth(8),
                      backgroundColor: isDark
                        ? appColors.darkHeader
                        : appColors.lightGray,
                    },
                  ]}
                >
                  <View style={styles.userIcon}>
                    <Card />
                  </View>
                  <Text style={[styles.selectText, { color: textColorStyle }]}>
                    {seletedPayment
                      ? seletedPayment?.length > 6
                        ? `${seletedPayment.substring(0, 6)}...`
                        : seletedPayment
                      : translateData.payment}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    if (bookLoading || isTimerRunning) {
                      notificationHelper(
                        "",
                        translateData.waitBooking,
                        "error",
                      );
                      return;
                    }
                    setIsRiderOpen(true);
                    riderSheetRef?.current?.present();
                  }}
                  style={[
                    styles.switchUser,
                    {
                      flexDirection: viewRTLStyle,
                      minWidth: windowWidth(120),
                      marginRight: windowWidth(8),
                      backgroundColor: isDark
                        ? appColors.darkHeader
                        : appColors.lightGray,
                    },
                  ]}
                >
                  <View style={styles.userIcon}>
                    <User size={28} />
                  </View>
                  <Text style={[styles.selectText, { color: textColorStyle }]}>
                    {recipientMode === 'other' && selectedContactName
                      ? selectedContactName.length > 12
                        ? `${selectedContactName.substring(0, 12)}...`
                        : selectedContactName
                      : translateData.myself}
                  </Text>
                </TouchableOpacity>
                {taxidoSettingData?.cabbooking_values?.activation
                  ?.coupon_enable == 1 &&
                  taxidoSettingData?.cabbooking_values?.activation?.bidding ==
                    0 && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        if (bookLoading || isTimerRunning) {
                          notificationHelper(
                            "",
                            translateData.waitBooking,
                            "error",
                          );
                          return;
                        }
                        setIsCouponsOpen(true);
                        couponsSheetRef.current?.present();
                      }}
                      style={[
                        styles.switchUser,
                        {
                          flexDirection: viewRTLStyle,
                          minWidth: windowWidth(120),
                          marginRight: windowWidth(8),
                          backgroundColor: isDark
                            ? appColors.darkHeader
                            : appColors.lightGray,
                        },
                      ]}
                    >
                      <View style={styles.userIcon}>
                        <Coupon />
                      </View>
                      <Text
                        style={[styles.selectText, { color: textColorStyle }]}
                      >
                        {translateData.coupons}
                      </Text>
                    </TouchableOpacity>
                  )}
              </GestureScrollView>
            </View>
            <Button
              title={preferredVehicleKind || resolvedSelectedVehicle?.charges?.is_goods_delivery ? 'Review Booking' : `Book ${resolvedSelectedVehicle?.name ?? ''}`}
              onPress={() => {
                if(preferredVehicleKind || resolvedSelectedVehicle?.charges?.is_goods_delivery){
                  if(!resolvedSelectedVehicle?.id){notificationHelper('','Vehicle fares are still loading. Please wait a moment.','error');return;}
                  if(String(selectedItemData?.id) !== String(resolvedSelectedVehicle.id)){
                    setSelectedItem(resolvedSelectedVehicle.id);
                    setSelectedItemData(resolvedSelectedVehicle);
                  }
                  if(!validateDelivery())return;
                  Keyboard.dismiss();
                  setReviewVisible(true);
                }else handleBookRide();
              }}
              loading={bookLoading}
              disabled={bookLoading}
            />
          </View>
        )}
        <BookingReview visible={reviewVisible} vehicle={selectedItemData} locations={allLocations} receiver={receiverName} weight={parcelWeight}
          coupon={couponValue} couponCode={appliedCouponCode} couponEnabled={Number(taxidoSettingData?.cabbooking_values?.activation?.coupon_enable)===1}
          couponLoading={applyingCoupon} couponMessage={successMessage} finalPrice={taxidoSettingData?.cabbooking_values?.activation?.bidding==1?fareValue:Number(selectedItemData?.charges?.total||0)+(selectedPrefs[String(selectedItemData?.id)]||[]).reduce((sum:number,pref:any)=>sum+Number(pref.price||0),0)}
          payment={seletedPayment||'cash'} busy={bookLoading} onClose={()=>setReviewVisible(false)} onApplyCoupon={handlePress} onRemoveCoupon={removeCoupon}
          onConfirm={details=>{deliveryDetailsRef.current=details;setReviewVisible(false);handleBookRide();}}/>
      </KeyboardAvoidingView>
    </BottomSheetModalProvider>
  );
}
