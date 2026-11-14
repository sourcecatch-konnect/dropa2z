import {BrandLoader} from '../../design/BrandLogo';
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {View, TouchableOpacity, Image, ActivityIndicator, Alert} from 'react-native';
import {Text, TextInput} from '../../design/Typography';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from "@react-navigation/native";
import { Back, AddressMarker } from "@src/utils/icons";
import { appColors } from "@src/themes";
import Images from "@utils/images";
import styles from "./styles";
import { useValues } from "@src/utils/context/index";
import { external } from "@src/styles/externalStyle";
import { useSelector } from "react-redux";
import { setValue } from "@src/utils/localstorage";
import useSmartLocation from "@src/components/helper/locationHelper";
import { indianCoordinates } from "@src/utils/deliveryPlaces";

// Define route params interface
interface RouteParams {
  field?: string;
  screenValue?: string;
  service_ID?: string;
  service_name?: string;
  service_category_ID?: string;
  service_category_slug?: string;
  formattedDate?: string;
  formattedTime?: string;
  initialLatitude?: number;
  initialLongitude?: number;
}

// Memoized components to prevent unnecessary re-renders
const BackButton = React.memo(({ onPress, isDark }: { onPress: () => void; isDark: boolean }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.backView, { backgroundColor: isDark ? appColors.darkPrimary : appColors.whiteColor }]}
  >
    <Back />
  </TouchableOpacity>
));

const MapPointer = React.memo(({ pinImage }: { pinImage: any }) => (
  <View style={styles.pointerMarker} pointerEvents="none">
    <Image source={pinImage} style={styles.pinImage} />
  </View>
));

const AddressInput = React.memo(({
  fetchingAddress,
  currentAddress,
  isDark,
  viewRTLStyle,
}: {
  fetchingAddress: boolean;
  currentAddress: string;
  isDark: boolean;
  viewRTLStyle: "row" | "row-reverse";
}) => (
  <View style={[styles.textInputContainer, { backgroundColor: isDark ? appColors.darkPrimary : appColors.whiteColor, flexDirection: viewRTLStyle }]}>
    <View style={[styles.addressBtnView, { backgroundColor: isDark ? appColors.bgDark : appColors.lightGray }]}>
      <AddressMarker />
    </View>
    <TextInput
      style={[styles.textInput, { color: isDark ? appColors.whiteColor : appColors.blackColor }]}
      value={fetchingAddress ? "Locating..." : currentAddress || "Move map to select location"}
      editable={false}
      multiline
    />
  </View>
));

const ConfirmButton = React.memo(({
  onPress,
  fetchingAddress,
  loadingMap,
  currentAddress,
  translateData
}: {
  onPress: () => void;
  fetchingAddress: boolean;
  loadingMap: boolean;
  currentAddress: string;
  translateData: any;
}) => (
  <TouchableOpacity
    style={styles.confirmButton}
    onPress={onPress}
    disabled={fetchingAddress || loadingMap || !currentAddress}
    activeOpacity={0.8}
  >
    {fetchingAddress ? (
      <BrandLoader size="large" color={appColors.whiteColor} />
    ) : (
      <Text style={styles.confirmText}>{translateData.confirmLocation || "Confirm Location"}</Text>
    )}
  </TouchableOpacity>
));

export function LocationSelect() {
  const { isDark, viewRTLStyle, Google_Map_Key } = useValues();
  const webViewRef = useRef<WebView>(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { field, screenValue, service_ID, service_name, service_category_ID, service_category_slug, preferredVehicleKind, formattedDate, formattedTime, initialLatitude, initialLongitude } = (route.params || {}) as RouteParams & { preferredVehicleKind?: string };
  const { currentLatitude, currentLongitude } = useSmartLocation();
  const [initialCoords, setInitialCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapCenterCoords, setMapCenterCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentAddress, setCurrentAddress] = useState("");
  const [loadingMap, setLoadingMap] = useState(true);
  const [fetchingAddress, setFetchingAddress] = useState(false);
  const [addressError, setAddressError] = useState("");
  const addressRequest = useRef(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { translateData, taxidoSettingData } = useSelector((state: any) => state.setting);
  const mapType = taxidoSettingData?.cabbooking_values?.location?.map_provider;

  useEffect(() => {
    // Initialize once; later GPS fixes must not reset a map the user is moving.
    if (initialCoords) return;
    const selected = indianCoordinates(initialLatitude, initialLongitude)
      || indianCoordinates(currentLatitude, currentLongitude);
    if (selected) {
      const coords = { latitude: selected.lat, longitude: selected.lng };
      setInitialCoords(coords);
      setMapCenterCoords(coords);
      setLoadingMap(false);
    } else {
      // Show India for manual selection rather than inventing a GPS location.
      const timer = setTimeout(() => {
        const fallbackCoords = { latitude: 22.5937, longitude: 78.9629 };
        setInitialCoords(fallbackCoords);
        setAddressError("Location unavailable. Move the map to choose your address.");
        setLoadingMap(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentLatitude, currentLongitude, initialLatitude, initialLongitude, initialCoords]);

  // Memoize fetchAddress to prevent recreation
  const fetchAddress = useCallback(async (lat: number, lng: number) => {
    const request = ++addressRequest.current;
    setCurrentAddress("");
    setAddressError("");
    if (!Google_Map_Key) {
      setAddressError("Address service is not configured. Please contact support.");
      setFetchingAddress(false);
      return;
    }

    setFetchingAddress(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${Google_Map_Key}`
      );
      const json = await response.json();
      if (request !== addressRequest.current) return;
      const bestResult = json.results?.find((result: any) => result.address_components?.some(
        (component: any) => component.types?.includes('country') && component.short_name === 'IN',
      ));
      if (json.status === 'OK' && bestResult?.formatted_address) {
        const cleanedAddress = bestResult?.formatted_address;
        setCurrentAddress(cleanedAddress);
      } else {
        console.warn("[fetchAddress] Geocoding API returned no results:", json.status);
        setAddressError("No Indian address found here. Move the map and try again.");
      }

    } catch (error) {
      console.error("[fetchAddress] Failed to fetch address:", error);
      if (request === addressRequest.current) setAddressError("Unable to load the address. Check your connection and move the map to retry.");
    } finally {
      if (request === addressRequest.current) setFetchingAddress(false);
    }
  }, [Google_Map_Key]);

  useEffect(() => {
    if (mapCenterCoords) {
      if (debounceTimerRef?.current) clearTimeout(debounceTimerRef?.current);

      debounceTimerRef.current = setTimeout(() => {
        fetchAddress(mapCenterCoords?.latitude, mapCenterCoords?.longitude);
      }, 800);
    }
    return () => {
      if (debounceTimerRef?.current) clearTimeout(debounceTimerRef?.current);
    };
  }, [mapCenterCoords, fetchAddress]);

  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event?.nativeEvent?.data);
      if (data?.type !== 'mapMove') return;
      const { lat, lng } = data?.payload || {};
      ++addressRequest.current;
      setCurrentAddress("");
      if (!indianCoordinates(lat, lng)) {
        setMapCenterCoords(null);
        setFetchingAddress(false);
        setAddressError("Please select an address in India.");
        return;
      }
      setFetchingAddress(true);
      setAddressError("");
      setMapCenterCoords({ latitude: Number(lat), longitude: Number(lng) });
    } catch (_) { /* Ignore messages unrelated to map coordinates. */ }
  }, []);

  const handleConfirmLocation = useCallback(async () => {
    if (!currentAddress || !mapCenterCoords || fetchingAddress || loadingMap) {
      Alert.alert(translateData.locationNotReady, translateData.locationDescription);
      return;
    }
    if (screenValue === "HomeScreen") {
      if (!field || field === "pickupLocation") {
        await setValue('user_latitude_Selected', mapCenterCoords?.latitude.toString());
        await setValue('user_longitude_Selected', mapCenterCoords?.longitude.toString());
      }
      (navigation as any).navigate("MyTabs", {
        screen: "HomeScreen",
        params: {
          selectedAddress: currentAddress,
          fieldValue: field || "pickupLocation",
          pinLatitude: mapCenterCoords?.latitude,
          pinLongitude: mapCenterCoords?.longitude,
          ...(service_ID ? { service_ID, service_name, service_category_ID, service_category_slug, preferredVehicleKind, formattedDate, formattedTime } : {}),
        },
      });
      return;
    }
    (navigation as any).navigate(screenValue, {
      selectedAddress: currentAddress,
      fieldValue: field,
      pinLatitude: mapCenterCoords?.latitude,
      pinLongitude: mapCenterCoords?.longitude,
      service_ID,
      service_name,
      service_category_ID,
      service_category_slug,
      preferredVehicleKind,
      formattedDate,
      formattedTime,
    });
  }, [currentAddress, mapCenterCoords, fetchingAddress, loadingMap, screenValue, field, navigation, service_ID, service_name, service_category_ID, service_category_slug, preferredVehicleKind, formattedDate, formattedTime]);

  const getMapHTML = useCallback((coords: { latitude: number; longitude: number }, mapType: string, isDark: boolean) => {
    if (mapType === 'osm') {
      const darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      const lightTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      const tileUrl = isDark ? darkTileUrl : lightTileUrl;

      return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
          <style>
            body, html, #map {
              margin: 0;
              padding: 0;
              height: 100%;
              width: 100%;
              background-color: ${isDark ? appColors.blackColor : appColors.whiteColor};
            }
          </style>
      </head>
      <body>
          <div id="map"></div>
          <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
          <script>
              function initMap() {
                  const map = L.map('map', {
                      center: [${coords?.latitude}, ${coords?.longitude}],
                      zoom: 16,
                      zoomControl: false
                  });

                  L.tileLayer('${tileUrl}', {
                      attribution: '© OpenStreetMap contributors'
                  }).addTo(map);

                  map.on('moveend', function() {
                      const center = map.getCenter();
                      const message = {
                          type: 'mapMove',
                          payload: { lat: center.lat, lng: center.lng }
                      };
                      window.ReactNativeWebView.postMessage(JSON.stringify(message));
                  });
              }
              initMap();
          </script>
      </body>
      </html>
    `;
    }

    // Google Maps implementation (existing code)
    const darkTheme = [
      { elementType: "geometry", stylers: [{ color: "#212121" }] },
      { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
      {
        featureType: "administrative",
        elementType: "geometry",
        stylers: [{ color: "#757575" }]
      },
      {
        featureType: "poi",
        elementType: "geometry",
        stylers: [{ color: "#282828" }]
      },
      {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#181818" }]
      },
      {
        featureType: "road",
        elementType: "geometry.fill",
        stylers: [{ color: "#2c2c2c" }]
      },
      {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#8a8a8a" }]
      },
      {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f2f2f" }]
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#000000" }]
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#3d3d3d" }]
      }
    ];

    const mapThemeStyles = isDark ? darkTheme : [];
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body, html, #map {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            background-color: ${isDark ? "#000" : "#fff"};
          }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            function initMap() {
                const map = new google.maps.Map(document.getElementById('map'), {
                    center: { lat: ${coords?.latitude}, lng: ${coords?.longitude} },
                    zoom: 16,
                    disableDefaultUI: true,
                    styles: ${JSON.stringify(mapThemeStyles)}
                });

                map.addListener('idle', () => {
                    const center = map.getCenter();
                    const message = {
                        type: 'mapMove',
                        payload: { lat: center.lat(), lng: center.lng() }
                    };
                    window.ReactNativeWebView.postMessage(JSON.stringify(message));
                });
            }
        </script>
        <script async defer src="https://maps.googleapis.com/maps/api/js?key=${Google_Map_Key}&callback=initMap"></script>
    </body>
    </html>
  `;
  }, [Google_Map_Key]);

  // Memoize the WebView source to prevent unnecessary reloads
  const webViewSource = useMemo(() => {
    return initialCoords ? { html: getMapHTML(initialCoords, mapType, isDark) } : { html: '' };
  }, [initialCoords, getMapHTML, mapType, isDark]);

  // Memoize loading state component
  const loadingComponent = useMemo(() => (
    <View style={styles.loaderContainer}>
      <BrandLoader size="large" color={appColors.primary} />
    </View>
  ), []);

  return (
    <View style={external.main}>
      <BackButton onPress={() => navigation.goBack()} isDark={isDark} />

      {loadingMap ? (
        loadingComponent
      ) : initialCoords ? (
        <>
          <WebView
            ref={webViewRef}
            style={styles.mapView}
            source={webViewSource}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          />
          <MapPointer pinImage={Images.pin} />
        </>
      ) : (
        loadingComponent
      )}

      <AddressInput
        fetchingAddress={fetchingAddress}
        currentAddress={addressError || currentAddress}
        isDark={isDark}
        viewRTLStyle={viewRTLStyle}
      />

      <ConfirmButton
        onPress={handleConfirmLocation}
        fetchingAddress={fetchingAddress}
        loadingMap={loadingMap}
        currentAddress={currentAddress}
        translateData={translateData}
      />
    </View>
  );
}
