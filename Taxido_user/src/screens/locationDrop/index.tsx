import {useKeyboardState} from '../../utils/useKeyboardState';
import React, { useState, useEffect, useRef, useCallback } from "react";
import {TouchableOpacity, View, ScrollView, Modal, Animated, Dimensions, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, FlatList, Alert, Platform,TextInput as NativeTextInput} from 'react-native';
import {Text, TextInput} from '../../design/Typography';
import { History, Calender, AddressMarker, PickLocation, Save, Driving, Gps, Close, Add, Minus, Swap } from "@utils/icons";
import { styles } from "./styles";
import { commonStyles } from "../../styles/commonStyle";
import { external } from "../../styles/externalStyle";
import { SolidLine, Button, Header, InputText } from "@src/commonComponent";
import { useFocusEffect, useRoute, useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { userZone } from "../../api/store/actions/index";
import { vehicleTypeDataGet } from "../../api/store/actions/vehicleTypeAction";
import { getValue, setValue } from "@src/utils/localstorage";
import { appColors, appFonts, fontSizes, windowHeight, windowWidth } from "@src/themes";
import { useAppNavigation } from "@src/utils/navigation";
import { getDistance } from "geolib";
import useSmartLocation from "@src/components/helper/locationHelper";
import { useValues } from "@src/utils/context/index";
import { getGoodsServiceOptions } from "@src/utils/goodsServiceOptions";
import { RECENT_DELIVERY_PLACES_KEY, recentDeliveryPlaces, indianCoordinates } from "@src/utils/deliveryPlaces";
import { matchingSavedPlaces } from "@src/utils/savedPlaceSearch";
import {ReferenceScreen} from '../../design/ReferenceChrome';
import {HomeServiceChoices} from '../../design/HomeServiceChoices';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {recentSearchesToShow} from '../../utils/liveBooking';
import {AddressSuggestionOverlay,AddressSuggestionDismissArea,SuggestionFrame} from '../../components/homeScreen/AddressSuggestionOverlay';
import {HomeAddressCard} from '../../components/homeScreen/HomeAddressCard';
import {SaveSuggestionSheet} from '../../components/homeScreen/SaveSuggestionSheet';
import {moveDeliveryStop} from '../../utils/deliveryStopOrder';
import {SaveCategoryIcons,SaveCategory} from '../../components/homeScreen/SaveCategoryIcons';
import {saveCategorizedPlace} from '../../utils/saveCategorizedPlace';
import {userSaveLocation} from '../../api/store/actions/saveLocationAction';
import {usePlaceCategories} from '../../utils/usePlaceCategories';
import {CreatePlaceCategorySheet} from '../../components/homeScreen/CreatePlaceCategorySheet';
import {DeletePlaceCategorySheet} from '../../components/homeScreen/DeletePlaceCategorySheet';

type LocationDropProps = {
  embedded?: boolean;
  serviceParams?: Record<string, any>;
  inlineFooter?: React.ReactNode;
  inlineHeader?: React.ReactNode | ((editing:boolean)=>React.ReactNode);
  festive?: boolean;
};

type SelectedPlace = {
  id?: string;
  shortAddress: string;
  detailAddress: string;
  fullAddress: string;
  lat: number;
  lng: number;
};

// A broad prefilter only. Places search is country-restricted; the backend
// verifies the country and same-city rule from geocoded address components.
const isWithinIndiaBounds = (lat: number, lng: number) => {
  const latitude = Number(lat), longitude = Number(lng);
  return lat != null && lng != null && Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= 6 && latitude <= 38 && longitude >= 68 && longitude <= 98;
};
const isIndianGeocodeResult = (result: any) =>
  result?.address_components?.some((component: any) =>
    component.types?.includes("country") && component.short_name === "IN");

export function LocationDrop({
  embedded = false,
  serviceParams = {},
  inlineFooter,
  inlineHeader,
  festive=false,
}: LocationDropProps) {
  const insets=useSafeAreaInsets();
  const dispatch = useDispatch();
  const { navigate, replace } = useAppNavigation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const lastFocusedField = useRef("destination");
  const fieldBlurTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(fieldBlurTimer.current)clearTimeout(fieldBlurTimer.current);},[]);
  const suggestionRequest = useRef(0);
  const pickupEdited = useRef(false);
  const route = useRoute();
  const navigation = useNavigation();
  const routeParams = (route.params || {}) as Record<string, any>;
  const params = embedded ? { ...serviceParams, ...routeParams } : routeParams;
  const {
    service_ID: initialServiceId,
    service_name: initialServiceName,
    service_category_ID: initialCategoryId,
    service_category_slug: initialCategorySlug,
    preferredVehicleKind: initialVehicleKind,
    formattedDate,
    formattedTime,
    defultAddress,
    defultCoords,
    selectedAddress,
    fieldValue,
    pinLatitude,
    pinLongitude,
  } = params;
  const { serviceData } = useSelector((state: any) => state.service);
  const { saveLocationDataGet } = useSelector((state: any) => state.saveLocation);
  const serviceOptions = getGoodsServiceOptions(serviceData?.data).filter(
    option => !festive || option.key !== "bike-freight",
  );
  const [selectedServiceKey, setSelectedServiceKey] = useState<string | null>(null);
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);
  const selectedService = serviceOptions.find(option => option.key === selectedServiceKey)
    ?? serviceOptions.find(option => String(option.categoryId) === String(initialCategoryId));
  const service_ID = selectedService?.serviceId ?? initialServiceId;
  const service_name = selectedService?.serviceType ?? initialServiceName;
  const service_category_ID = selectedService?.categoryId ?? initialCategoryId;
  const service_category_slug = selectedService?.categorySlug ?? initialCategorySlug;
  const preferredVehicleKind = selectedService?.vehicleKind ?? initialVehicleKind;
  const [destination, setDestination] = useState<string>("");
  const [stops, setStops] = useState<any[]>([]);
  const [pickupLocation, setPickupLocation] = useState<string>(defultAddress || "");
  const [fieldLength, setFieldLength] = useState<number>(0);
  const [addressData, setAddressData] = useState<string>("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [draggingStops,setDraggingStops]=useState(false);
  const [placeToSave,setPlaceToSave]=useState<any>(null);
  const [autoSaveCategory,setAutoSaveCategory]=useState<SaveCategory|null>(null);
  const savingSuggestion=useRef(false);
  const savedPlaces=Array.isArray(saveLocationDataGet?.data)?saveLocationDataGet.data:[];
  const {categories,addCategory,removeCategory}=usePlaceCategories(savedPlaces);
  const [categoryCreatorOpen,setCategoryCreatorOpen]=useState(false);
  const [categoryDeleteOpen,setCategoryDeleteOpen]=useState(false);
  const overlayRootRef=useRef<View>(null),addressCardRef=useRef<View>(null);
  const [suggestionFrame,setSuggestionFrame]=useState<SuggestionFrame|null>(null);
  const {top:keyboardTop}=useKeyboardState();
  
  const measureSuggestionFrame=useCallback(()=>{
    if(!festive||!activeField)return;
    overlayRootRef.current?.measureInWindow((rootX,rootY,_rootWidth,rootHeight)=>{
      addressCardRef.current?.measureInWindow((x,y,width,height)=>{
        const top=y+height-rootY;
        const visibleHeight=keyboardTop==null?rootHeight:Math.min(rootHeight,keyboardTop-rootY);
        const next={left:x-rootX,top,width,cardTop:y-rootY,maxHeight:Math.max(44,Math.min(210,visibleHeight-top-12))};
        setSuggestionFrame(previous=>previous&&Object.keys(next).every(key=>previous[key]===next[key])?previous:next);
      });
    });
  },[festive,!!activeField,keyboardTop,stops.length]);
  useEffect(()=>{
    const frame=requestAnimationFrame(measureSuggestionFrame);
    return()=>cancelAnimationFrame(frame);
  },[measureSuggestionFrame]);
  const [modalVisible, setModalVisible] = useState(false);


  const [visible, setVisible] = useState(false);
  const screenWidth = Dimensions.get("window").width;
  const translateX = useRef(new Animated.Value(-30)).current;
  const { settingData, taxidoSettingData, translateData } = useSelector(state => state.setting);
  const [recentDatas, setRecentDatas] = useState([]);
  const focusedSuggestions=activeField&&!addressData.trim()
      ? [...savedPlaces.flatMap((item:any)=>{
          const coords=indianCoordinates(item.location_coordinates?.lat,item.location_coordinates?.lng);
          return coords&&item.location?[{id:`saved:${item.id}`,shortAddress:item.location,fullAddress:item.location,detailAddress:item.title,...coords}]:[];
        }),...recentDatas]
      : suggestions;
  const [showAllRecent,setShowAllRecent]=useState(false);
  const visibleRecentDatas=recentSearchesToShow(recentDatas,showAllRecent);
  const [dateError, setDateError] = useState(false);
  const { DateValue, TimeValue, field } = params;
  const [scheduleDate, setScheduleDate] = useState({
    DateValue: DateValue || "",
    TimeValue: TimeValue || "",
  });
  const [proceedLoading, setProceedLoading] = useState(false);
  const { currentLatitude, currentLongitude } = useSmartLocation();
  const [isdesFocused, setIsdesFocused] = useState(false);
  const { linearColorStyle, viewRTLStyle, textColorStyle, bgFullLayout, textRTLStyle, isDark, isRTL, Google_Map_Key } = useValues();
  const [wasAutoFilled, setWasAutoFilled] = useState(false);
  const [destinationFullAddress, setDestinationFullAddress] = useState();
  const [hasNavigated, setHasNavigated] = useState(false);
  const pickupRef = useRef<TextInput>(null);
  const destinationRef = useRef<TextInput>(null);
  const [pickupCoords, setPickupCoords] = useState<{
    lat: number;
    lng: number;
  } | null>({ lat: defultCoords?.lat, lng: defultCoords?.lng });
  const [destinationCoords, setDestinationCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [stopCoords, setStopCoords] = useState<Array<SelectedPlace | null>>([]);
  const [minRadiusKm, setMinRadiusKm] = useState(0);



  useEffect(() => {
    const init = async () => {
      const meters =
        taxidoSettingData?.cabbooking_values?.ride?.min_intracity_radius ?? 0;
      await setMinRadiusKm(meters / 1000);
    };
    init();
  }, [taxidoSettingData?.cabbooking_values?.ride?.min_intracity_radius]);

  const truncateAddress = (address: string, maxLength: number = 20): string => {
    if (!address) return "";
    if (address?.length <= maxLength) return address;
    return address.substring(0, maxLength) + "...";
  };

  const getDisplayValue = (value: string, fieldName: string): string => {
    if (!value) return "";
    // Show full value when field is focused
    if (activeField === fieldName) {
      return value;
    }
    // Show beginning part (first 20 chars) when field is not focused
    return truncateAddress(value, 20);
  };

  const resolveSelectedPlace = async (suggestion): Promise<SelectedPlace | null> => {
    const coordinates = indianCoordinates(suggestion?.lat, suggestion?.lng);
    const lat = coordinates?.lat;
    const lng = coordinates?.lng;
    const shortAddress = suggestion?.shortAddress || "";
    const detailAddress = suggestion?.detailAddress || "";
    const fullAddress =
      suggestion?.fullAddress || [shortAddress, detailAddress].filter(Boolean).join(", ");

    // Keep the coordinates returned for the exact selected Place ID. Never
    // geocode a short label such as "GS Ground" again.
    if (coordinates) {
      return {
        id: suggestion?.id,
        shortAddress,
        detailAddress,
        fullAddress,
        lat: coordinates.lat,
        lng: coordinates.lng,
      };
    }

    // Older saved places may not contain coordinates. Resolve their full
    // address with India country restriction and preserve its exact result.
    if (!fullAddress) return null;
    try {
      const query = fullAddress;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          query,
        )}&components=country:IN&key=${Google_Map_Key}`,
      );
      const data = await response.json();
      const result = (data?.results || []).find(item => {
        const location = item?.geometry?.location;
        return (
          location &&
          isWithinIndiaBounds(location.lat, location.lng) &&
          isIndianGeocodeResult(item)
        );
      });
      if (!result) return null;
      return {
        id: suggestion?.id || result?.place_id,
        shortAddress,
        detailAddress: detailAddress || result.formatted_address,
        fullAddress: result.formatted_address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      };
    } catch (error) {
      console.error("Could not resolve saved place in India:", error);
      return null;
    }
  };

  const rememberPlace = async (place: SelectedPlace) => {
    try {
      const stored = await getValue(RECENT_DELIVERY_PLACES_KEY);
      const next = recentDeliveryPlaces(place, stored);
      await setValue(RECENT_DELIVERY_PLACES_KEY, JSON.stringify(next));
      setRecentDatas(next);
    } catch (_) { /* A storage error must not prevent selecting an address. */ }
  };

  const applySuggestionToField = async (suggestion, targetField = activeField || lastFocusedField.current) => {
    const selectedPlace = await resolveSelectedPlace(suggestion);
    if (!selectedPlace) {
      Alert.alert(
        "Choose an Indian location",
        "This address could not be verified in India. Search and select the exact place, including its city.",
      );
      return;
    }

    if (targetField === "pickupLocation") {
      pickupEdited.current = true;
      setPickupLocation(selectedPlace.shortAddress);
      setPickupCoords({ lat: selectedPlace.lat, lng: selectedPlace.lng });
      setWasAutoFilled(true);
      setActiveField(null);
    } else if (targetField === "destination") {
      setDestination(selectedPlace.shortAddress);
      setDestinationFullAddress(selectedPlace);
      setDestinationCoords({ lat: selectedPlace.lat, lng: selectedPlace.lng });
      setProceedLoading(true);
      setActiveField(null);
    } else if (targetField?.startsWith("stop-")) {
      const stopIndex = parseInt(targetField.split("-")[1], 10) - 1;
      const updatedStops = [...stops];
      updatedStops[stopIndex] = selectedPlace.shortAddress;
      setStops(updatedStops);
      setStopCoords(previous => {
        const updatedCoords = [...previous];
        while (updatedCoords.length < updatedStops.length) updatedCoords.push(null);
        updatedCoords[stopIndex] = selectedPlace;
        return updatedCoords;
      });
      setActiveField(null);
    }
    ++suggestionRequest.current;
    setSuggestions([]);
    lastFocusedField.current = "destination";
    await rememberPlace(selectedPlace);
  };

  useEffect(() => {
    fetchAddressFromCoords(currentLatitude, currentLongitude);
  }, [currentLatitude, currentLongitude]);
  const fetchAddressFromCoords = async (latitude, longitude) => {
    let targetLatitude = latitude;
    let targetLongitude = longitude;
    if (embedded) {
      const selectedLatitude = await getValue("user_latitude_Selected");
      const selectedLongitude = await getValue("user_longitude_Selected");
      if (selectedLatitude && selectedLongitude) {
        targetLatitude = parseFloat(selectedLatitude);
        targetLongitude = parseFloat(selectedLongitude);
      }
    }
    if (!targetLatitude || !targetLongitude) return;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${targetLatitude},${targetLongitude}&key=${Google_Map_Key}&result_type=street_address`;
    try {
      const response = await fetch(url);
      const json = await response.json();
      if (json.status === "OK" && json?.results?.length > 0) {
        const addressComponents = json.results[0].address_components;
        const route = addressComponents.find(comp =>
          comp.types.includes("route"),
        )?.short_name;
        const locality = addressComponents.find(comp =>
          comp.types.includes("locality"),
        )?.short_name;
        const subLocality = addressComponents.find(comp =>
          comp.types.includes("sublocality"),
        )?.short_name;
        const shortAddress = [route, subLocality || locality]
          .filter(Boolean)
          .join(", ");
        const fullAddress = json.results[0]?.formatted_address;
        const useFullAddress =
          taxidoSettingData?.cabbooking_values?.activation?.full_address_location ==
          1;

        if (!pickupLocation && !pickupEdited.current) {
          setPickupLocation(
            useFullAddress
              ? fullAddress
              : shortAddress || json?.results[0]?.formatted_address,
          );
          setPickupCoords({ lat: targetLatitude, lng: targetLongitude });
        }
        setWasAutoFilled(true);
      }
    } catch (error) {
      console.error("Error fetching short address:", error);
    }
  };


  useFocusEffect(
    useCallback(() => {
      if (!embedded && pickupLocation && pickupLocation.trim().length > 0 && wasAutoFilled && !activeField && (!destination || destination.trim().length === 0)) {
        const timer = setTimeout(() => {
          destinationRef.current?.focus();
        }, 500);

        return () => clearTimeout(timer);
      }
    }, [embedded, pickupLocation, wasAutoFilled, activeField, destination]),
  );

  useEffect(() => {
    setScheduleDate({
      DateValue: DateValue || "",
      TimeValue: TimeValue || "",
    });
    if (DateValue && TimeValue) {
      setDateError(false);
    }
  }, [DateValue, TimeValue]);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    const fetchRecentData = async () => {
      try {
        const [stored, legacy] = await Promise.all([
          getValue(RECENT_DELIVERY_PLACES_KEY), getValue("locations"),
        ]);
        if (mounted) setRecentDatas(recentDeliveryPlaces(stored, legacy));
      } catch (error) {
        console.error("Error parsing recent locations:", error);
        if (mounted) setRecentDatas([]);
      }
    };
    fetchRecentData();
    return () => { mounted = false; };
  }, []));



  useEffect(() => {
    if (fieldLength > 3) {
      startAnimation();
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [fieldLength]);

  const startAnimation = () => {
    Animated.sequence([
      Animated.timing(translateX, {
        toValue: screenWidth,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: -30,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: screenWidth,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: -30,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  };

  useEffect(() => {
    if (hasNavigated) return;
    const allStopsValid = stops.every(stop => stop.trim().length > 0);
    const allFieldsFilled =
      pickupLocation.trim().length > 0 &&
      destination?.trim().length > 0 &&
      (stops?.length === 0 || allStopsValid);
    if (activeField === null && allFieldsFilled) {
      setHasNavigated(true);
    }
  }, [activeField, pickupLocation, destination, stops]);

  const fetchAddressSuggestions = async input => {
    const request = ++suggestionRequest.current;
    const savedMatches = activeField ? matchingSavedPlaces(input || '', saveLocationDataGet?.data).map(place => ({
      ...place,
      distanceKm: (getDistance({ latitude: pickupCoords?.lat ?? currentLatitude ?? place.lat, longitude: pickupCoords?.lng ?? currentLongitude ?? place.lng },
        { latitude: place.lat, longitude: place.lng }) / 1000).toFixed(2),
    })) : [];
    if(!activeField || input?.length<3 || savedMatches.length)setSuggestions(savedMatches);
    if (activeField && Google_Map_Key && input?.length >= 3) {
      try {
        const response = await fetch(
          "https://places.googleapis.com/v1/places:autocomplete",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": Google_Map_Key,
              "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text",
            },
            body: JSON.stringify({
              input,
              regionCode: "IN",
              includedRegionCodes: ["in"],
              ...(isWithinIndiaBounds(pickupCoords?.lat ?? currentLatitude, pickupCoords?.lng ?? currentLongitude) ? {
                locationBias: { circle: { center: {
                  latitude: pickupCoords?.lat ?? currentLatitude,
                  longitude: pickupCoords?.lng ?? currentLongitude,
                }, radius: 50000 } },
              } : {}),
            }),
          },
        );
        const data = await response.json();

        if (!response.ok || !data?.suggestions) {
          console.error(
            "Autocomplete API Error:",
            data?.error?.status || response.status,
            data?.error?.message || "",
          );

          // Keep destination search available if the Places service is
          // temporarily unavailable.
          const fallbackQuery = input;
          const geocodeResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fallbackQuery)}&components=country:IN&key=${Google_Map_Key}`,
          );
          const geocodeData = await geocodeResponse.json();
          const fallbackSuggestions = (geocodeData?.results || []).filter(result => {
            const location = result?.geometry?.location;
            return (
              location &&
              isWithinIndiaBounds(location.lat, location.lng) &&
              isIndianGeocodeResult(result)
            );
          }).map(result => {
            const location = result?.geometry?.location;
            const distanceInMeters = location
              ? getDistance(
                  {
                    latitude: currentLatitude || 21.0077,
                    longitude: currentLongitude || 75.5626,
                  },
                  { latitude: location.lat, longitude: location.lng },
                )
              : 0;
            const components = result?.address_components || [];
            const route = components.find(component => component.types?.includes("route"))?.long_name;
            const locality = components.find(component => component.types?.includes("locality"))?.long_name;

            return {
              id: result?.place_id || result?.formatted_address,
              shortAddress: route || locality || result?.formatted_address,
              detailAddress: result?.formatted_address,
              fullAddress: result?.formatted_address,
              lat: location?.lat,
              lng: location?.lng,
              distanceKm: (distanceInMeters / 1000).toFixed(2),
            };
          });
          if (request === suggestionRequest.current) setSuggestions([...savedMatches, ...fallbackSuggestions]);
          return;
        }

        const promises = data.suggestions.map(async suggestion => {
          const prediction = suggestion?.placePrediction;
          const placeDetailsRes = await fetch(
            `https://places.googleapis.com/v1/places/${prediction?.placeId}`,
            {
              headers: {
                "X-Goog-Api-Key": Google_Map_Key,
              "X-Goog-FieldMask": "location,formattedAddress,addressComponents",
              },
            },
          );
          const placeDetailsData = await placeDetailsRes.json();

          const location = placeDetailsData?.location;
          if (
            !location ||
            (!isWithinIndiaBounds(location.latitude, location.longitude) || !placeDetailsData?.addressComponents?.some(component => component.types?.includes("country") && component.shortText === "IN"))
          ) return null;

          const shortAddress =
            prediction?.structuredFormat?.mainText?.text ||
            prediction?.text?.text;
          const detailAddress =
            placeDetailsData?.formattedAddress ||
            prediction?.structuredFormat?.secondaryText?.text ||
            prediction?.text?.text;
          const fullAddress =
            placeDetailsData?.formattedAddress ||
            [shortAddress, detailAddress].filter(Boolean).join(", ");

          const distanceInMeters = getDistance(
            {
              latitude: currentLatitude || 21.0077,
              longitude: currentLongitude || 75.5626,
            },
            { latitude: location?.latitude, longitude: location?.longitude },
          );
          return {
            id: prediction?.placeId,
            shortAddress,
            detailAddress,
            fullAddress,
            lat: location.latitude,
            lng: location.longitude,
            distanceKm: (distanceInMeters / 1000).toFixed(2),
          };
        });

        const places = (await Promise.all(promises)).filter(Boolean);
        const sortedPlaces = places.sort(
          (a, b) => parseFloat(a.distanceKm) - parseFloat(b.distanceKm),
        );
        if (request === suggestionRequest.current) setSuggestions([...savedMatches, ...sortedPlaces]);
      } catch (error) {
        console.error("Error fetching suggestions with distance:", error);
      }
    } else {
      if(request===suggestionRequest.current)setSuggestions(savedMatches);
    }
  };

  const handleRecentClick = async suggestion => {
    Keyboard.dismiss();
    await applySuggestionToField(suggestion);
  };

  const handleSuggestionClick = async suggestion => {
    if(savingSuggestion.current)return;
    savingSuggestion.current=true;
    const category=autoSaveCategory;
    try{
      const place=await resolveSelectedPlace(suggestion);
      if(!place){Alert.alert('Choose a verified address','Search and select the exact location.');return;}
      Keyboard.dismiss();await applySuggestionToField(place);
      if(category){
        if(!await getValue('token')){Alert.alert('Sign in to save places','The address was selected. Sign in to save it to your account.');return;}
        await saveCategorizedPlace(place,category,savedPlaces);
        setAutoSaveCategory(null);
        try{await (dispatch as any)(userSaveLocation()).unwrap();}catch{Alert.alert('Address saved','Reopen Your places to refresh the list.');}
      }
    }catch(e:any){Alert.alert('Address not saved',e?.response?.data?.message||e?.message||'The location is selected. Use the bookmark to try saving it again.');}
    finally{savingSuggestion.current=false;}
  };
  useEffect(() => {
    const timer=setTimeout(()=>fetchAddressSuggestions(addressData),200);
    return()=>{clearTimeout(timer);++suggestionRequest.current;};
  }, [addressData, activeField, Google_Map_Key, saveLocationDataGet]);

  useEffect(() => {
    let length = 0;
    let addressData = "";

    if (activeField === "pickupLocation") {
      length = pickupLocation?.length;
      addressData = pickupLocation;
    } else if (activeField === "destination") {
      length = destination?.length;
      addressData = destination;
    } else if (activeField && activeField.startsWith("stop-")) {
      const stopIndex = parseInt(activeField.split("-")[1], 10) - 1;
      const stopData = stops[stopIndex];
      if (stopData !== undefined) {
        length = stopData?.length;
        addressData = stopData;
      }
    }
    setAddressData(addressData);
    setFieldLength(length);
  }, [stops, pickupLocation, destination, activeField]);

  const coordsData = async () => {
    if (
      !pickupCoords ||
      !isWithinIndiaBounds(pickupCoords.lat, pickupCoords.lng)
    ) {
      Alert.alert("India local deliveries", "Choose a pickup location in India.");
      setProceedLoading(false);
      return;
    }

    try {
      
      const selectedZone=await dispatch(
        userZone({ lat: pickupCoords.lat, lng: pickupCoords.lng }) as any,
      ).unwrap();
      if(!selectedZone?.id){
        setProceedLoading(false);
        Alert.alert('No delivery service area found','Select a pickup location in India and try again.');
        return;
      }
      // Only this explicit Proceed request may advance. Background updates to
      // the shared zone reducer must never open a new parcel-details screen.
      await getVehicleTypes(selectedZone);
    } catch (error) {
      console.error("Could not load the pickup service zone:", error);
      setProceedLoading(false);
      
      Alert.alert(
        "Could not check delivery availability",
        "Check your internet connection and try again.",
      );
    }
  };
  const getVehicleTypes = async (selectedZone: any) => {
    if (!pickupCoords || !destinationCoords) {
      console.warn("Coordinates not ready yet. Please select the route again.");
      setProceedLoading(false);
      Alert.alert(
        "Route needs updating",
        "Select the pickup, every stop, and the destination again.",
      );
      return;
    }

    const selectedStopCoords = Array.isArray(stopCoords) ? stopCoords : [];
    if (
      selectedStopCoords.length !== stops.length ||
      selectedStopCoords.some(coord => !coord)
    ) {
      Alert.alert(
        "Select each stop",
        "Choose every stop from the search results before continuing.",
      );
      setProceedLoading(false);
      return;
    }

    const rawLocations = [pickupCoords, ...selectedStopCoords, destinationCoords];
    if (rawLocations.some(coord => !isWithinIndiaBounds(coord?.lat, coord?.lng))) {
      Alert.alert(
        "India local deliveries",
        "Pickup, stops, and destination must all be in India and within the same city.",
      );
      setProceedLoading(false);
      return;
    }

    // Keep every selected coordinate in order. Filtering a missing stop here
    // would silently shift the remaining points and quote the wrong route.
    const filteredLocations = rawLocations.map(coord => ({
      lat: coord.lat,
      lng: coord.lng,
    }));

    const getFormattedTime = date => {
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");
      return `${hours}:${minutes}:${seconds}`;
    };


    const now = new Date();

    const payload = {
      locations: filteredLocations,
      service_id: service_ID,
      service_category_id: service_category_ID,
      current_time: getFormattedTime(now),
    };

    const fullDestination = destinationFullAddress
      ? destinationFullAddress.fullAddress ||
        `${destinationFullAddress.shortAddress}, ${destinationFullAddress.detailAddress}`
      : destination;

    if (service_name == "cab") {
      try {
        await (dispatch(vehicleTypeDataGet(payload) as any) as any).unwrap();

        if (
          pickupLocation &&
          destinationFullAddress &&
          pickupLocation.trim().length > 0 &&
          Object.keys(destinationFullAddress).length > 0
        ) {
          const locationData = {
            destinationFullAddress,
            stops,
            pickupLocation,
            service_ID,
            zoneValue:selectedZone,
            scheduleDate,
            service_category_ID,
            service_name,
            filteredLocations,
            pickupCoords,
            stopsCoords: selectedStopCoords,
            destinationCoords,
          };
          setValue("locations", JSON.stringify(locationData));
        }

        navigate("BookRide", {
          destination: fullDestination,
          stops,
          pickupLocation,
          service_ID,
          zoneValue:selectedZone,
          scheduleDate,
          service_category_ID,
          service_name,
          filteredLocations,
          pickupCoords,
          destinationCoords,
          stopsCoords: selectedStopCoords,
        });
      } catch (error) {
        console.error("Could not calculate vehicles for the selected route:", error);
        const serverMessage =
          typeof (error as any)?.message === "string"
            ? (error as any).message.trim()
            : "";
        const safeMessage =
          serverMessage && serverMessage.length <= 180 && !/[<>]/.test(serverMessage)
            ? serverMessage
            : "Please try again in a moment. Your selected stops are still saved.";
        Alert.alert(
          "Could not calculate this route",
          safeMessage,
        );
      } finally {
        setProceedLoading(false);
      }
    } else if (service_name == "freight" || service_name == "parcel") {
      navigate("BookRide", {
        destination: fullDestination,
        stops,
        pickupLocation,
        service_ID,
        zoneValue:selectedZone,
        service_name,
        service_category_ID,
        preferredVehicleKind,
        scheduleDate,
        filteredLocations,
        pickupCoords,
        stopsCoords: selectedStopCoords,
        destinationCoords,
      });
      setProceedLoading(false);
    } else {
      setProceedLoading(false);
      Alert.alert(
        "Service unavailable",
        "This service cannot calculate a quote for the selected route.",
      );
    }
  };

  const calculateDistance = (lat1: any, lon1: any, lat2: any, lon2: any) => {
    const R = 6371;
    const toRadians = degree => (degree * Math.PI) / 180;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const outOfCity = () => {
    Alert.alert(`${translateData.outOfCity}`, `${translateData.outOfCityDes}`);
    setProceedLoading(false);
  };

  const insideCity = () => {
    Alert.alert(
      `${translateData.insideCity}`,
      `${translateData.insideCityDes}`,
    );
    setProceedLoading(false);
  };

  const rideBooking = async () => {
    let token: any = "";
    await getValue("token").then(function (value) {
      token = value;
    });
    if (token) {
      if (destination && destination.trim().length > 0) {
        let suggestion = {
          shortAddress: destination.trim(),
          detailAddress: destination.trim(),
        };
        try {
          const stored: any = await getValue("locations");
          let storedLocations = JSON.parse(stored) || [];

          const alreadyExists = storedLocations.some(
            loc =>
              loc.shortAddress.trim().toLowerCase() ===
              suggestion.shortAddress.trim().toLowerCase(),
          );

          if (!alreadyExists) {
            storedLocations.push(suggestion);
            if (storedLocations?.length > 5) {
              storedLocations.shift();
            }
          } else {
          }
        } catch (error) {
          console.error("Error handling locations:", error);
        }
      }

      if (!destination || !pickupLocation) {
        setModalVisible(true);
      } else {
        await coordsData();
      }
    } else {
      let screenName = "LocationDrop";
      setValue("CountinueScreen", screenName);
      replace("SignIn");
    }
  };

  const gotoBook = async () => {

    if (isProcessing) return;
    Keyboard.dismiss();

    setProceedLoading(true);
    setIsProcessing(true);

    try {
      if (
        !pickupCoords?.lat ||
        !pickupCoords?.lng ||
        !destinationCoords?.lat ||
        !destinationCoords?.lng
      ) {
        const missingPickup = !pickupCoords?.lat || !pickupCoords?.lng;
        Alert.alert(
          missingPickup ? 'Select a pickup location' : 'Select a destination',
          `Choose the ${missingPickup ? 'pickup' : 'destination'} from address suggestions, saved locations, or Choose on map before continuing. Typing an address alone does not select its map location.`,
        );
        setProceedLoading(false);
        setIsProcessing(false);
        return;
      }

      const isSchedule =
        ["schedule", "schedule-parcel", "schedule-freight"].includes(
          service_category_slug,
        ) || field === "schedule";

      if (isSchedule) {
        if (!scheduleDate?.DateValue || !scheduleDate?.TimeValue) {
          setProceedLoading(false);
          setDateError(true);
          return;
        } else {
          setDateError(false);
        }
      }

      const distance = calculateDistance(
        pickupCoords?.lat,
        pickupCoords?.lng,
        destinationCoords?.lat,
        destinationCoords?.lng,
      );

      if (["parcel", "freight"].includes(service_name)) {
        // Goods options have their own vehicle-specific category slugs. The
        // selected points are verified again by the backend before quoting.
        await rideBooking();
      } else if (
        ["intercity", "intercity-freight", "intercity-parcel"].includes(
          service_category_slug,
        )
      ) {
        if (distance < minRadiusKm) insideCity();
        else await rideBooking();
      } else if (
        ["ride", "ride-freight", "ride-parcel"].includes(service_category_slug)
      ) {
        if (distance > minRadiusKm) outOfCity();
        else await rideBooking();
      } else if (
        ["schedule", "package", "schedule-freight", "schedule-parcel"].includes(
          service_category_slug,
        )
      ) {
        await rideBooking();
      }
    } catch (error) {
      console.error("Error in gotoBook:", error);
      setProceedLoading(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const gotoSelection = (field?:string) => {
    const targetField = typeof field==='string'?field:activeField || lastFocusedField.current;
    lastFocusedField.current=targetField;
    setAutoSaveCategory(null);
    Keyboard.dismiss();
    const targetCoords = targetField === "pickupLocation" ? pickupCoords
      : targetField.startsWith("stop-") ? stopCoords[parseInt(targetField.split("-")[1], 10) - 1]
      : destinationCoords;
    navigate("LocationSelect", {
      field: targetField,
      screenValue: embedded ? "HomeScreen" : "Ride",
      service_ID: service_ID,
      service_name: service_name,
      service_category_ID: service_category_ID,
      service_category_slug: service_category_slug,
      preferredVehicleKind,
      initialLatitude: targetCoords?.lat ?? pickupCoords?.lat,
      initialLongitude: targetCoords?.lng ?? pickupCoords?.lng,
      formattedDate: formattedDate,
      formattedTime: formattedTime,
    });
  };

  const gotoSaveLocation = async () => {
    let token = "";
    await getValue("token").then(function (value) {
      token = value;
    });

    if (token) {
      navigate("SavedLocation", {
        selectedLocation: embedded ? "homeScreen" : "locationDrop",
        savefield: activeField || lastFocusedField.current,
        service_ID: service_ID,
        service_name: service_name,
        service_category_ID: service_category_ID,
        service_category_slug: service_category_slug,
        preferredVehicleKind,
        formattedDate: formattedDate,
        formattedTime: formattedTime,
      });
    } else {
      let screenName = "LocationDrop";
      if (settingData?.values?.activation?.login_number == 1) {
        setValue("CountinueScreen", screenName);
        replace("SignIn");
      } else if (settingData?.values?.activation?.login_number == 0) {
        setValue("CountinueScreen", screenName);
        replace("SignIn");
      } else {
        replace("SignIn");
      }
    }
  };

  useEffect(() => {
    if (!selectedAddress) return;
    const coordinates = indianCoordinates(pinLatitude, pinLongitude);
    if (coordinates) {
      applySuggestionToField({ shortAddress: selectedAddress, fullAddress: selectedAddress, ...coordinates }, fieldValue || "pickupLocation");
    } else {
      Alert.alert("Choose an Indian location", "Choose a verified map location in India.");
    }
    // Consume the return value once. GPS updates must not reapply an old choice
    // after the customer edits or swaps the endpoints.
    (navigation as any).setParams({ selectedAddress: undefined, fieldValue: undefined, pinLatitude: undefined, pinLongitude: undefined });
  }, [selectedAddress, fieldValue, pinLatitude, pinLongitude]);

  const renderItemRecentData = ({ item: suggestion, index }) => {
    return (
      <TouchableWithoutFeedback
        key={suggestion?.id || suggestion?.destinationFullAddress?.id || index}
        onPress={() => Keyboard.dismiss()}>
        <View style={styles.renderItemRecentView}>
          <TouchableOpacity
            activeOpacity={0.7}
            key={index}
            style={[styles.historyBtn, { flexDirection: viewRTLStyle }]}
            onPress={() => handleRecentClick(suggestion)}>
            <View
              style={[
                styles.historyView,
                {
                  backgroundColor: isDark
                    ? appColors.darkBorder
                    : appColors.lightGray,
                },
              ]}>
              <History />
            </View>
            <View>
              <Text
                style={[
                  styles.locationText,
                  { color: textColorStyle },
                  { textAlign: textRTLStyle },
                ]}>
                {suggestion?.shortAddress?.length > 42
                  ? `${suggestion?.shortAddress.slice(
                    0,
                    42,
                  )}...`
                  : suggestion?.shortAddress}
              </Text>
              <Text
                style={[
                  styles.titleTextDetail,
                  {
                    textAlign: textRTLStyle,
                    marginHorizontal: windowWidth(10),
                  },
                ]}>
                {suggestion?.detailAddress?.length > 42
                  ? `${suggestion?.detailAddress.slice(
                    0,
                    42,
                  )}...`
                  : suggestion?.detailAddress}
              </Text>
            </View>
          </TouchableOpacity>
          {index !== visibleRecentDatas?.length - 1 && (
            <View
              style={[
                styles.bottomLine,
                {
                  borderColor: isDark
                    ? appColors.darkBorder
                    : appColors.lightGray,
                },
              ]}
            />
          )}
        </View>
      </TouchableWithoutFeedback>
    );
  };
  const addStop = () => {
    if (stops?.length < 3) {
      setStops(prevStops => [...prevStops, ""]);
      setStopCoords(previous => [...previous, null]);
    }
  };

  const reorderStops=(from:number,to:number)=>{
    Keyboard.dismiss();++suggestionRequest.current;setSuggestions([]);setActiveField(null);
    const drops=[...stops.map((address,index)=>({address,place:stopCoords[index]})),{address:destination,place:destinationFullAddress||destinationCoords}];
    const reordered=moveDeliveryStop(drops,from,to),last=reordered[reordered.length-1];
    setStops(reordered.slice(0,-1).map(item=>item.address));
    setStopCoords(reordered.slice(0,-1).map(item=>item.place));
    setDestination(last.address);setDestinationCoords(last.place?{lat:last.place.lat,lng:last.place.lng}:null);
    setDestinationFullAddress(last.place?{...last.place,shortAddress:last.address,fullAddress:last.place.fullAddress||last.address}:undefined);
    lastFocusedField.current='destination';setHasNavigated(false);
  };
  const isSuggestionSaved=(place:any)=>String(place.id||'').startsWith('saved:')||savedPlaces.some((item:any)=>String(item.location||'').trim().toLowerCase()===String(place.fullAddress||'').trim().toLowerCase());
  const saveSearchedPlace=async(place:any)=>{
    if(!await getValue('token')){Alert.alert('Sign in to save places','Sign in to keep saved places linked to your account.');return;}
    const resolved=await resolveSelectedPlace(place);if(!resolved){Alert.alert('Choose a verified address','Select an address from search or the map first.');return;}
    Keyboard.dismiss();setPlaceToSave(resolved);
  };

  const removeStop = index => {
    const updatedStops = stops.filter((_, i) => i !== index);
    setStops(updatedStops);
    setStopCoords(previous => previous.filter((_, i) => i !== index));

    if (updatedStops?.length === 0) {
      setActiveField("destination");
    } else if (index === stops?.length - 1) {
      setActiveField(`stop-${updatedStops?.length}`);
    }
  };

  const handleInputChange = (text: any, id: number) => {
    if (id === 1) {
      pickupEdited.current = true;
      setPickupLocation(text);
      setPickupCoords(null);
    } else if (id === 2) {
      setDestination(text);
      setDestinationCoords(null);
      setDestinationFullAddress(undefined);
    } else {
      const stopIndex = id - 3;
      const updatedStops = stops?.map((stop, index) =>
        index + 3 === id ? text : stop,
      );
      setStops(updatedStops);
      setStopCoords(previous => {
        const updatedCoords = [...previous];
        updatedCoords[stopIndex] = null;
        return updatedCoords;
      });
    }
  };

  const handleFocus = id => {
    if(fieldBlurTimer.current){clearTimeout(fieldBlurTimer.current);fieldBlurTimer.current=null;}
    lastFocusedField.current = id === 1 ? "pickupLocation" : id === 2 ? "destination" : `stop-${id - 2}`;
    if (id === 1) {
      setActiveField("pickupLocation");
    } else if (id === 2) {
      setActiveField("destination");
      setIsdesFocused(true);
    } else {
      setActiveField(`stop-${id - 2}`);
    }
  };
  const handleBlur = () => {
    if(fieldBlurTimer.current)clearTimeout(fieldBlurTimer.current);
    fieldBlurTimer.current=setTimeout(()=>{setActiveField(null);fieldBlurTimer.current=null;},120);
  };
  const dismissAddressSuggestions=()=>{
    if(fieldBlurTimer.current){clearTimeout(fieldBlurTimer.current);fieldBlurTimer.current=null;}
    NativeTextInput.State.currentlyFocusedInput()?.blur();
    ++suggestionRequest.current;setSuggestions([]);setActiveField(null);Keyboard.dismiss();
  };

  const handleCloseStop = index => {
    const updatedStops = [...stops];
    updatedStops[index] = "";
    setStops(updatedStops);
    setStopCoords(previous => {
      const updatedCoords = [...previous];
      updatedCoords[index] = null;
      return updatedCoords;
    });
    setIsProcessing(false);
  };

  const handleClosepickup = () => {
    ++suggestionRequest.current;
    pickupEdited.current = true;
    setPickupLocation("");
    setPickupCoords(null);
    setSuggestions([]);
    setWasAutoFilled(false);
    handleFocus(1);
    pickupRef.current?.focus();
    setIsProcessing(false);
  };

  const handleCloseDestination = () => {
    setDestination("");
    setDestinationCoords(null);
    setDestinationFullAddress(undefined);
  };

  const canSwapLocations = Boolean(
    pickupLocation.trim() && destination.trim()
    && pickupCoords && destinationCoords
    && isWithinIndiaBounds(pickupCoords.lat, pickupCoords.lng)
    && isWithinIndiaBounds(destinationCoords.lat, destinationCoords.lng)
    && !isProcessing && !proceedLoading,
  );
  const swapLocations = () => {
    if (!canSwapLocations) return;
    Keyboard.dismiss();
    pickupEdited.current = true;
    const previousPickup = pickupLocation;
    const previousPickupCoords = pickupCoords!;
    setPickupLocation(destinationFullAddress?.fullAddress || destination);
    setPickupCoords(destinationCoords);
    setDestination(previousPickup);
    setDestinationCoords(previousPickupCoords);
    setDestinationFullAddress({
      shortAddress: previousPickup,
      detailAddress: previousPickup,
      fullAddress: previousPickup,
      lat: previousPickupCoords.lat,
      lng: previousPickupCoords.lng,
    });
    setSuggestions([]);
    setActiveField(null);
    setWasAutoFilled(false);
    setHasNavigated(false);
    
  };

  useEffect(() => {
    // Goods bookings stay editable until Proceed, allowing a service change
    // or endpoint swap before requesting a quote for the final route.
    if (!embedded && destinationCoords && !["parcel", "freight"].includes(service_name)) {
      gotoBook();
    } else if (destinationCoords) {
      setProceedLoading(false);
    }
  }, [destinationCoords]);

  const closeModel = () => {
    setModalVisible(false);
    setProceedLoading(false);
  }
  const ScreenChrome = embedded ? React.Fragment : ReferenceScreen;

  return (
    <ScreenChrome><KeyboardAvoidingView
      style={embedded ? { flex: 1, width: "100%" } : styles.main}
      // Android already resizes the window via adjustResize. Applying another
      // height adjustment here makes the form/footer oscillate with the IME.
      enabled={Platform.OS === "ios"}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View ref={overlayRootRef} collapsable={false} onLayout={measureSuggestionFrame} style={styles.main}>
        
        <ScrollView
          scrollEnabled={!draggingStops&&(!festive||!activeField)}
          style={[
            embedded ? { flex: 1, width: "100%" } : styles.main,
            { backgroundColor: linearColorStyle },
          ]}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: festive?16:windowHeight(80) }}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <View>
            {typeof inlineHeader==='function'?inlineHeader(Boolean(activeField)):inlineHeader}
            {!embedded && (
              <Header
                value={translateData.location}
                backgroundColor={
                  isDark ? appColors.darkPrimary : appColors.whiteColor
                }
              />
            )}
            {!festive && selectedService && (
              <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Change service. Selected: ${selectedService.title}`}
                  accessibilityState={{ expanded: serviceMenuOpen }}
                  disabled={isProcessing || proceedLoading}
                  onPress={() => { Keyboard.dismiss(); setServiceMenuOpen(open => !open); }}
                  style={{ flexDirection: viewRTLStyle, alignItems: "center", justifyContent: "space-between", padding: 12, minHeight: 48, borderWidth: 1, borderColor: appColors.border, borderRadius: 10, backgroundColor: isDark ? appColors.darkPrimary : appColors.whiteColor }}>
                  <Text style={{ color: textColorStyle, fontWeight: "600", flex: 1 }}>{selectedService.title}</Text>
                  <Text style={{ color: appColors.primary }}>{serviceMenuOpen ? "Close ▴" : "Change service ▾"}</Text>
                </TouchableOpacity>
                {serviceMenuOpen && (
                  <View style={{ borderWidth: 1, borderColor: appColors.border, borderRadius: 10, marginTop: 4, overflow: "hidden" }}>
                    {serviceOptions.map(option => (
                      <TouchableOpacity
                        key={option.key}
                        accessibilityRole="button"
                        accessibilityLabel={option.title}
                        accessibilityState={{ selected: option.key === selectedService.key }}
                        onPress={() => {
                          setSelectedServiceKey(option.key);
                          setServiceMenuOpen(false);
                          setHasNavigated(false);
                          
                        }}
                        style={{ padding: 14, minHeight: 48, flexDirection: viewRTLStyle, backgroundColor: option.key === selectedService.key ? (isDark ? appColors.darkBorder : appColors.lightGray) : (isDark ? appColors.darkPrimary : appColors.whiteColor) }}>
                        <Text style={{ flex: 1, color: textColorStyle }}>{option.title}</Text>
                        {option.key === selectedService.key && <Text style={{ color: appColors.primary }}>✓</Text>}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
            <View
              style={[
                styles.horizontalView,
                embedded && {
                  paddingTop: windowHeight(5),
                  paddingBottom: windowHeight(5),
                },
                {
                  backgroundColor: isDark
                    ? appColors.darkPrimary
                    : appColors.whiteColor,
                },
              ]}>
              <View ref={addressCardRef} collapsable={false} onLayout={measureSuggestionFrame} style={[styles.pickupdetailsView,festive&&{position:'relative'}]}>
                {festive?<HomeAddressCard dark={isDark} canSwap={canSwapLocations} onSwap={swapLocations} onAddStop={addStop} onRemoveStop={removeStop} onReorder={reorderStops} onDraggingChange={setDraggingStops}
                  pickup={{value:getDisplayValue(pickupLocation,'pickupLocation'),placeholder:translateData.pickupLocationTittle||'Pickup address',inputRef:pickupRef,onChangeText:text=>{handleInputChange(text,1);setWasAutoFilled(false);},onFocus:()=>handleFocus(1),onBlur:handleBlur,onClear:handleClosepickup,onMap:()=>gotoSelection('pickupLocation')}}
                  destination={{value:getDisplayValue(destination,'destination'),placeholder:translateData.enterDestinationPlaceholderText||'Enter destination',inputRef:destinationRef,onChangeText:text=>handleInputChange(text,2),onFocus:()=>handleFocus(2),onBlur:handleBlur,onClear:handleCloseDestination,onMap:()=>gotoSelection('destination')}}
                  stops={stops.map((stop,index)=>({value:getDisplayValue(stop,`stop-${index+1}`),placeholder:translateData.addStopPlaceHolderText||'Add a stop',onChangeText:text=>handleInputChange(text,index+3),onFocus:()=>handleFocus(index+3),onBlur:handleBlur,onClear:()=>handleCloseStop(index),onMap:()=>gotoSelection(`stop-${index+1}`)}))}
                />:<View
                  style={[
                    styles.containers,
                    {
                      backgroundColor: isDark
                        ? appColors.darkPrimary
                        : festive ? '#FFFFFF' : appColors.lightGray,
                      borderColor: isDark
                        ? appColors.darkBorder
                        : appColors.border,
                    },
                  ]}>
                  <View style={festive?{position:'relative',paddingRight:62}:undefined}>
                    {festive&&<TouchableOpacity accessibilityRole="button" accessibilityLabel="Swap pickup and destination" accessibilityState={{disabled:!canSwapLocations}} disabled={!canSwapLocations} onPress={swapLocations} style={{position:'absolute',right:0,top:'50%',transform:[{translateY:-30}],zIndex:2,width:52,minHeight:60,borderRadius:14,backgroundColor:isDark?'#26362D':'#EAF5ED',alignItems:'center',justifyContent:'center',opacity:canSwapLocations?1:.45}}><Swap color="#17191C"/><Text style={{color:isDark?'#FFFFFF':'#157A52',fontWeight:'700',fontSize:12,marginTop:3}}>Swap</Text></TouchableOpacity>}
                    {!festive&&<View style={{ flexDirection: viewRTLStyle, justifyContent: "flex-end" }}>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Swap pickup and destination"
                        accessibilityHint="Select both locations first. Intermediate stops keep their order."
                        accessibilityState={{ disabled: !canSwapLocations }}
                        disabled={!canSwapLocations}
                        onPress={swapLocations}
                        style={{ minWidth: 44, minHeight: 44, flexDirection: viewRTLStyle, alignItems: "center", justifyContent: "center", paddingHorizontal: 10, opacity: canSwapLocations ? 1 : 0.45 }}>
                        <Swap />
                        <Text style={{ color: appColors.primary, marginHorizontal: 6, fontSize: 12 }}>Swap</Text>
                      </TouchableOpacity>
                    </View>}
                    <View
                      style={[
                        styles.inputContainer,
                        festive&&{backgroundColor:isDark?'#25282D':'#F5F8F6',borderRadius:12,minHeight:46,marginVertical:3,paddingHorizontal:4},
                        { flexDirection: viewRTLStyle },
                      ]}>
                      <View
                        style={[
                          styles.iconContainer,
                          {
                            backgroundColor: isDark
                              ? appColors.darkPrimary
                              : appColors.lightGray,
                          },
                        ]}>
                        <Gps width={20} height={20} />
                      </View>
                      <View
                        style={[
                          styles.inputWithIcons,
                          { flexDirection: viewRTLStyle },
                        ]}>
                        <TextInput
                          ref={pickupRef}
                          style={[
                            styles.input, festive&&{fontSize:13,height:40,paddingTop:0},
                            {
                              color: isDark
                                ? appColors.whiteColor
                                : appColors.primaryText,
                            },
                            { textAlign: textRTLStyle },
                          ]}
                          placeholderTextColor={
                            isDark
                              ? appColors.darkText
                              : appColors.regularText
                          }
                          placeholder={translateData.pickupLocationTittle}
                          value={getDisplayValue(pickupLocation, "pickupLocation")}
                          onChangeText={text => {
                            handleInputChange(text, 1);
                            setWasAutoFilled(false);
                          }}
                          onFocus={() => {
                            handleFocus(1);
                          }}
                          onBlur={() => {
                            handleBlur();
                          }}
                          textAlignVertical="center"
                          multiline={false}
                          numberOfLines={1}
                        />
                      </View>
                      
                      {pickupLocation?.length >= 1 && (
                        <TouchableOpacity
                          onPress={handleClosepickup}
                          accessibilityRole="button"
                          accessibilityLabel="Clear pickup location"
                          hitSlop={6}
                          style={{minWidth:32,minHeight:44,alignItems:'center',justifyContent:'center'}}
                          activeOpacity={0.7}>
                          <Close />
                        </TouchableOpacity>
                      )}
                    </View>
                    <View
                      style={{
                        borderColor: isDark
                          ? appColors.darkBorder
                          : appColors.border,
                        borderBottomWidth: windowHeight(0.3),
                        width: "86%",
                        marginHorizontal: isRTL
                          ? windowHeight(8)
                          : windowHeight(29),
                      }}
                    />
                    <View
                      style={[
                        styles.line2,
                        {
                          borderColor: isDark
                            ? appColors.regularText
                            : appColors.blackColor,
                        },
                        { left: isRTL ? "96%" : windowHeight(9.9) },
                      ]}
                    />
                    {stops?.map((stop, index) => (
                      <View
                        key={index + 3}
                        style={[
                          styles.inputContainer,
                          festive&&{backgroundColor:isDark?'#25282D':'#F5F8F6',borderRadius:12,minHeight:46,marginVertical:3,paddingHorizontal:4},
                          index === stops?.length - 1 ? {} : { marginBottom: 8 },
                          { flexDirection: viewRTLStyle },
                        ]}>
                        <View style={styles.iconContainer}>
                          <View
                            style={[
                              styles.numberContainer,
                              {
                                backgroundColor: isDark
                                  ? appColors.whiteColor
                                  : appColors.blackColor,
                              },
                            ]}>
                            <Text
                              style={[
                                styles.numberText,
                                {
                                  color: isDark
                                    ? appColors.blackColor
                                    : appColors.whiteColor,
                                },
                              ]}>
                              {index + 1}
                            </Text>
                          </View>
                        </View>

                        <View style={[styles.inputWithIcons,festive&&styles.inlineInputRow]}>
                          <TextInput
                            style={[
                              styles.input, festive&&{fontSize:13,height:40,paddingTop:0},
                              {
                                color: isDark
                                  ? appColors.whiteColor
                                  : appColors.primaryText,
                              },
                              { textAlign: textRTLStyle },
                              {
                                left: isRTL
                                  ? windowHeight(55)
                                  : windowHeight(0),
                              },

                              index === stops?.length - 1
                                ? {}
                                : {
                                  borderBottomWidth: windowHeight(0.9),
                                  borderBottomColor: isDark
                                    ? appColors.darkBorder
                                    : appColors.border,
                                },
                              { textAlign: textRTLStyle },
                              {
                                borderColor: isDark
                                  ? appColors.darkBorder
                                  : appColors.border,
                              },
                            ]}
                            placeholderTextColor={
                              isDark
                                ? appColors.darkText
                                : appColors.regularText
                            }
                            placeholder={
                              translateData.addStopPlaceHolderText
                            }
                            value={getDisplayValue(stop, `stop-${index + 1}`)}
                            onChangeText={text =>
                              handleInputChange(text, index + 3)
                            }
                            onFocus={() => {
                              handleFocus(index + 3);
                            }}
                            onBlur={handleBlur}
                            textAlignVertical="center"
                            multiline={false}
                            numberOfLines={1}
                          />
                          <View
                            style={[
                              styles.addButton,
                              { flexDirection: viewRTLStyle },
                              { right: isRTL ? "85%" : windowHeight(6) },
                              festive&&styles.inlineInputActions,
                            ]}>
                            {stops[index]?.trim() !== "" && (
                              <TouchableOpacity
                                onPress={() => handleCloseStop(index)}
                                accessibilityRole="button"
                                accessibilityLabel={`Clear stop ${index+1}`}
                                style={festive?styles.addressAction:undefined}
                                activeOpacity={0.7}>
                                <Close />
                              </TouchableOpacity>
                            )}
                            {index === stops?.length - 1 && (
                              <>
                                <View style={styles.iconSpacing} />
                                <TouchableOpacity
                                  onPress={() => removeStop(index)}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Remove stop ${index+1}`}
                                  style={festive?styles.addressAction:undefined}
                                  activeOpacity={0.7}>
                                  <Minus
                                    colors={textColorStyle}
                                    width={20}
                                    height={20}
                                  />
                                </TouchableOpacity>
                              </>
                            )
                            }
                          </View >
                        </View >
                        {
                          index < stops?.length && (
                            <View
                              style={[
                                styles.line,
                                { borderColor: appColors.regularText },
                                { left: isRTL ? "96%" : 12 },
                              ]}
                            />
                          )
                        }
                      </View >
                    ))}

                    <View
                      style={[
                        styles.inputContainer,
                        { flexDirection: viewRTLStyle },
                      ]}>
                      <View
                        style={[
                          styles.iconContainer,
                          {
                            backgroundColor: isDark
                              ? appColors.darkPrimary
                              : appColors.lightGray,
                          },
                        ]}>
                        <PickLocation width={20} height={20} />
                      </View>
                      <View style={[styles.inputWithIcons,festive&&styles.inlineInputRow]}>
                        <View style={styles.inputWidth}>
                          <TextInput
                            ref={destinationRef}
                            style={[
                              styles.input, festive&&{fontSize:13,height:40,paddingTop:0},
                              {
                                color: isDark
                                  ? appColors.whiteColor
                                  : appColors.primaryText,
                              },
                              { textAlign: textRTLStyle },
                              {
                                left: isRTL
                                  ? windowHeight(55)
                                  : windowHeight(0),
                              },
                            ]}
                            placeholderTextColor={
                              isDark
                                ? appColors.darkText
                                : appColors.regularText
                            }
                            placeholder={
                              translateData.enterDestinationPlaceholderText
                            }
                            value={getDisplayValue(destination, "destination")}
                            onChangeText={text =>
                              handleInputChange(text, 2)
                            }
                            onFocus={() => {
                              handleFocus(2);
                            }}
                            onBlur={handleBlur}
                            textAlignVertical="center"
                            multiline={false}
                            numberOfLines={1}
                          />
                        </View>
                        <View
                          style={[
                            styles.addButton,
                            { flexDirection: viewRTLStyle },
                            { right: isRTL ? "85%" : windowHeight(6) },
                            festive&&styles.inlineInputActions,
                          ]}>
                          {destination?.length >= 1 && (
                            <TouchableOpacity
                              onPress={handleCloseDestination}
                              accessibilityRole="button"
                              accessibilityLabel="Clear destination"
                              style={festive?styles.addressAction:undefined}
                              activeOpacity={0.7}>
                              <Close />
                            </TouchableOpacity>
                          )}
                          {stops?.length < 3 && (
                            <>
                              <View style={styles.iconSpacing} />
                              <TouchableOpacity
                                onPress={addStop}
                                accessibilityRole="button"
                                accessibilityLabel="Add delivery stop"
                                style={festive?styles.addressAction:undefined}
                                activeOpacity={0.7}>
                                <Add
                                  colors={textColorStyle}
                                  width={20}
                                  height={20}
                                />
                              </TouchableOpacity>
                            </>
                          )}
                        </View >
                      </View >
                    </View >
                  </View >
                </View >}
              </View >
              {(service_category_slug === "schedule" ||
                field === "schedule" ||
                service_category_slug === "schedule-parcel" ||
                service_category_slug === "schedule-freight") && (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() =>
                      navigate("Calander", {
                        fieldValue: "Ride",
                        service_ID: service_ID,
                        service_name: service_name,
                        categoryId: service_category_ID,
                        service_category_slug: service_category_slug,
                        DateValue: formattedDate,
                        TimeValue: formattedTime,
                      })
                    }>
                    <InputText
                      borderColor={
                        isDark ? appColors.darkBorder : appColors.border
                      }
                      backgroundColor={
                        isDark ? appColors.darkPrimary : appColors.lightGray
                      }
                      placeholder={translateData.DateandTextTime}
                      rightIcon={<Calender />}
                      onPress={() =>
                        navigate("Calander", {
                          fieldValue: "Ride",
                          service_ID: service_ID,
                          service_name: service_name,
                          categoryId: service_category_ID,
                          service_category_slug: service_category_slug,
                          DateValue: formattedDate,
                          TimeValue: formattedTime,
                        })
                      }
                      editable={false}
                      value={`${DateValue || "Date"} ${TimeValue || "and Time"
                        }`}
                      warningText={dateError ? "Please Enter Date" : ""}
                    />
                  </TouchableOpacity>
                )}
              {festive && <HomeServiceChoices options={serviceOptions} selectedKey={selectedService?.key} dark={isDark} disabled={isProcessing||proceedLoading} onSelect={key=>{Keyboard.dismiss();setSelectedServiceKey(key);setServiceMenuOpen(false);setHasNavigated(false);}}/>}
              <View
                style={[
                  external.fd_row,
                  external.js_space,
                  { flexDirection: viewRTLStyle },
                ]}>
                {!festive&&<TouchableOpacity
                  onPress={gotoSelection}
                  accessibilityRole="button"
                  accessibilityLabel="Locate on map"
                  activeOpacity={0.7}
                  style={[
                    styles.locationBtn,
                    festive&&{marginTop:12,marginBottom:0,height:46,minHeight:46,borderRadius:14,width:'100%'},
                    {
                      backgroundColor: isDark
                        ? "#3B2B19"
                        : appColors.selectPrimary,
                    },
                    { flexDirection: viewRTLStyle },
                  ]}>
                  <View style={external.mh_5}>
                    <PickLocation />
                  </View>
                  <Text
                    style={[
                      styles.locationBtnText,
                      festive&&{fontSize:fontSizes.FONT20,fontFamily:appFonts.bold},
                      {
                        color: isDark
                          ? appColors.whiteColor
                          : appColors.blackColor,
                      },
                    ]}>
                    {festive&&(!translateData?.locateonmap||/^locate on map$/i.test(translateData.locateonmap.trim()))?'Locate on Map':translateData?.locateonmap}
                  </Text>
                </TouchableOpacity>}
                {!festive && <TouchableOpacity
                  onPress={gotoSaveLocation}
                  activeOpacity={0.7}
                  style={[
                    styles.locationBtn,
                    festive&&{marginTop:12,marginBottom:0,height:46,minHeight:46,borderRadius:14},
                    { backgroundColor: appColors.primary },
                    { flexDirection: viewRTLStyle },
                  ]}>
                  <View style={external.mh_5}>
                    <Save />
                  </View>
                  <Text
                    style={[
                      styles.locationBtnText,
                      festive&&{fontSize:12},
                      { color: appColors.whiteColor },
                    ]}>
                    {translateData?.savedLocation}
                  </Text>
                </TouchableOpacity>}
              </View>
              {
                visible && (
                  <Animated.View
                    style={[styles.bar, { transform: [{ translateX }] }]}
                  />
                )
              }
            </View >
          </View >
          {(service_category_slug === "intercity" ||
            service_category_slug === "schedule") && (
            <View
              style={{ marginTop: windowHeight(35), bottom: windowHeight(20) }}>
                <View style={styles.viewContainerToll}>
                  <Driving />
                  <Text style={styles.fareStyle}>{translateData.note}</Text>
                </View>
            </View>
          )}
          {festive && <View style={{paddingHorizontal:16,paddingVertical:12}}><Button title={`${translateData.proceed || 'Proceed'}  →`} backgroundColor={appColors.primary} textColor="#17191C" onPress={gotoBook} disabled={isProcessing} loading={proceedLoading}/></View>}
          {!festive && <View
            style={[
              styles.recentView,
              {
                height: undefined,
                paddingTop: embedded ? windowHeight(8) : windowHeight(16),
                backgroundColor: isDark
                  ? appColors.bgDark
                  : appColors.lightGray,
              },
              { bottom:0 },
            ]}>
            <View style={{flexDirection:viewRTLStyle,alignItems:'center',justifyContent:'space-between',gap:8}}>
            <Text
              style={[
                commonStyles.mediumText23,
                { color: textColorStyle, textAlign: textRTLStyle,flex:1 },
                festive&&{fontSize:17,fontWeight:'800'},
              ]}>
              {suggestions.length > 0
                ? translateData.addressSuggestion || "Address suggestions"
                : translateData.homeRecentSearch || "Recent Search"}
            </Text>
            {suggestions.length===0&&recentDatas.length>2&&<TouchableOpacity accessibilityRole="button" accessibilityLabel={showAllRecent?'Show fewer recent searches':'View more recent searches'} onPress={()=>setShowAllRecent(value=>!value)} style={{alignSelf:'flex-end',minHeight:44,justifyContent:'center',paddingHorizontal:8}}><Text style={{color:'#FC9F03',fontWeight:'700'}}>{showAllRecent?'View Less':'View More'}</Text></TouchableOpacity>}
            </View>
            <View
              style={[
                styles.mapView,
                {
                  backgroundColor: isDark
                    ? appColors.darkPrimary
                    : appColors.whiteColor,
                },
                {
                  borderColor: isDark
                    ? appColors.darkBorder
                    : appColors.border,
                },
                embedded && { marginTop: windowHeight(8) },
                embedded && suggestions.length>0 && { maxHeight: windowHeight(320) },
                embedded && { marginBottom: 0 },
              ]}>
              {suggestions?.length > 0 ? (
                <FlatList
                  data={suggestions}
                  keyExtractor={(_, index) => index.toString()}
                  style={embedded ? { flexGrow: 0 } : undefined}
                  nestedScrollEnabled={embedded}
                  renderItem={({ item: suggestion, index }) => (
                    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={[
                          styles.suggestionsView,
                          { flexDirection: viewRTLStyle },
                        ]}
                        onPress={() => handleSuggestionClick(suggestion)}
                      >
                        <View
                          style={[
                            styles.addressMArker,
                            {
                              backgroundColor: isDark
                                ? appColors.bgDark
                                : appColors.lightGray,
                            },
                          ]}
                        >
                          <AddressMarker />
                        </View>

                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            width: "90%",
                            marginHorizontal: windowWidth(5)
                          }}
                        >
                          <View>
                            <View
                              style={[
                                { flexDirection: viewRTLStyle },
                                styles.spaceing,
                              ]}
                            >
                              <View>
                                <Text
                                  style={[
                                    styles.titleText,
                                    {
                                      color: textColorStyle,
                                      textAlign: textRTLStyle,
                                    },
                                  ]}
                                >
                                  {suggestion?.shortAddress}
                                </Text>
                                <Text
                                  style={[
                                    styles.titleTextDetail,
                                    { textAlign: textRTLStyle },
                                  ]}
                                >
                                  {suggestion?.detailAddress}
                                </Text>
                              </View>
                            </View>

                            {index !== suggestions?.length - 1 ? (
                              <View style={{ alignSelf: "center" }}>
                                <SolidLine color={bgFullLayout} />
                              </View>
                            ) : null}
                          </View>

                          <View
                            style={{
                              justifyContent: "center",
                              alignItems: "flex-end",
                              marginHorizontal: windowWidth(5),
                            }}
                          >
                            <Text
                              style={{
                                fontFamily: appFonts.medium,
                                color: appColors.primary,
                                width: windowWidth(70),
                                textAlign: isRTL ? "left" : "right",
                              }}
                            >
                              {(
                                taxidoSettingData?.cabbooking_values?.ride?.distance_unit?.toLowerCase() ===
                                  "mile"
                                  ? (parseFloat(suggestion?.distanceKm) || 0) * 0.621371
                                  : parseFloat(suggestion?.distanceKm) || 0
                              ).toFixed(2)}
                            </Text>
                            <Text
                              style={{
                                fontFamily: appFonts.medium,
                                color: appColors.primary,
                                width: windowWidth(60),
                                textAlign: isRTL ? "left" : "right",
                              }}
                            >
                              {taxidoSettingData?.cabbooking_values?.ride?.distance_unit}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </TouchableWithoutFeedback>
                  )}
                  keyboardShouldPersistTaps="always"
                />

              ) : Array.isArray(recentDatas) && recentDatas?.length > 0 ? (
                embedded ? (
                  <View>
                    {visibleRecentDatas.map((item, index) =>
                      renderItemRecentData({ item, index }),
                    )}
                  </View>
                ) : (
                  <FlatList
                    data={visibleRecentDatas}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderItemRecentData}
                    keyboardShouldPersistTaps="always"
                  />
                )
              ) : (
                <View style={styles.addressItemView}>
                  <Text
                    style={[
                      styles.noAddressText,
                      {
                        color: textColorStyle,
                      },
                    ]}>
                    {translateData?.noRecentSearches || "No recent searches yet. Select an address to save it here."}
                  </Text>
                </View>
              )}
            </View>
          </View>
          }
          {embedded && inlineFooter}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={closeModel}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalText}>
                  {translateData.bookingNote}
                </Text>
                <Button
                  title={translateData.close}
                  onPress={closeModel}
                />
              </View>
            </View>
          </Modal>
        </ScrollView >
        
        <SaveSuggestionSheet place={placeToSave} categories={categories} onClose={()=>setPlaceToSave(null)}/>
        <CreatePlaceCategorySheet visible={categoryCreatorOpen} dark={isDark} onClose={()=>{
          setCategoryCreatorOpen(false);setActiveField(lastFocusedField.current);
          setTimeout(()=>{if(lastFocusedField.current==='pickupLocation')pickupRef.current?.focus();else if(lastFocusedField.current==='destination')destinationRef.current?.focus();},250);
        }} onCreate={async name=>{const created=await addCategory(name);setAutoSaveCategory(created);}}/>
        <DeletePlaceCategorySheet visible={categoryDeleteOpen} categories={categories} dark={isDark} onClose={()=>setCategoryDeleteOpen(false)} onDelete={async name=>{await removeCategory(name);if(autoSaveCategory?.toLowerCase()===name.toLowerCase())setAutoSaveCategory(null);}}/>
        {festive&&!!activeField&&<AddressSuggestionDismissArea frame={suggestionFrame} onDismiss={dismissAddressSuggestions}/>}
        {festive&&!!activeField&&<AddressSuggestionOverlay suggestions={focusedSuggestions} onSelect={handleSuggestionClick} onSave={place=>void saveSearchedPlace(place)} isSaved={isSuggestionSaved} frame={suggestionFrame} header={<SaveCategoryIcons dark={isDark} categories={categories} selected={autoSaveCategory} onSelect={setAutoSaveCategory}/>}/>}
        {!festive&&<View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            paddingBottom:16+(embedded?0:insets.bottom),
            backgroundColor: isDark
              ? appColors.darkPrimary
              : appColors.whiteColor,
            borderTopWidth: 1,
            borderColor: isDark ? appColors.darkBorder : appColors.border,
          }}>
          <Button
            title={translateData.proceed}
            onPress={gotoBook}
            disabled={isProcessing}
            loading={proceedLoading}
          />
        </View>}
      </View>
    </KeyboardAvoidingView ></ScreenChrome>
  );
}
