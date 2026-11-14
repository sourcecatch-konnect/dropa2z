import {BrandLoader} from '../../../../../../design/BrandLogo';
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {View, TouchableOpacity, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, ScrollView, Keyboard} from 'react-native';
import {Text, TextInput} from '../../../../../../design/Typography';
import { WebView } from "react-native-webview";
import { useNavigation, useRoute } from "@react-navigation/native";
import darkMapStyle from "@src/screens/darkMapStyle";
import Images from "@utils/images";
import { useValues } from "@src/utils/context/index";
import styles from "./styles";
import { Back, AddressMarker } from "@src/utils/icons";
import {
  appColors,
  appFonts,
  fontSizes,
  windowHeight,
  windowWidth,
} from "@src/themes";
import { Button } from "@src/commonComponent";
import { SaveLocationDataInterface } from "@src/api/interface/saveLocationinterface";
import { addSaveLocation, updateSaveLocation } from "@src/api/store/actions";
import { useDispatch, useSelector } from "react-redux";
import { userSaveLocation } from "@src/api/store/actions/saveLocationAction";
import { external } from "@src/styles/externalStyle";
import useStoredLocation from "@src/components/helper/useStoredLocation";
import { indianCoordinates } from "@src/utils/deliveryPlaces";
import {ReferenceScreen} from '../../../../../../design/ReferenceChrome';
import { searchSavedPlaceAddresses, resolveSavedPlaceAddress, SavedPlacePrediction } from "@src/utils/savedPlaceSearch";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";

interface RouteParams {
  categoryTitle?: string;
  categoryType?: string;
  mode?: string;
  locationID?: number;
  locationDetails?: {
    title?: string;
    type?: string;
    location_coordinates?: {
      lat: number;
      lng: number;
    };
  };
}

const BackButton = React.memo(
  ({
    onPress,
    linearColorStyle,
  }: {
    onPress: () => void;
    linearColorStyle: string;
  }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.backView, { backgroundColor: linearColorStyle }]}>
      <Back />
    </TouchableOpacity>
  ),
);

const AddressInput = React.memo(
  ({
    fetchingAddress,
    currentAddress,
    translateData,
    linearColorStyle,
    textColorStyle,
    viewRTLStyle,
    isDark,
    darkBorder,
    primaryGray,
    searchText,
    onSearchChange,
  }: any) => (
    <View
      style={[
        styles.textInputContainer,
        { backgroundColor: linearColorStyle },
        { flexDirection: viewRTLStyle },
      ]}>
      <View
        style={[styles.addressMarkerIcon, { backgroundColor: linearColorStyle }]}>
        <AddressMarker />
      </View>
      <View
        style={[
          styles.inputLine,
          {
            borderColor: isDark ? darkBorder : primaryGray,
          },
        ]}
      />
      <TextInput
        style={[
          styles.textInput,
          { backgroundColor: linearColorStyle },
          { color: textColorStyle },
        ]}
        accessibilityLabel="Search saved-place address"
        value={searchText ?? currentAddress}
        onChangeText={onSearchChange}
        placeholder={translateData?.searchAddress || "Search an address or move the map"}
        placeholderTextColor={textColorStyle}
        autoCorrect={false}
        selectTextOnFocus
        returnKeyType="search"
      />
    </View>
  ),
);

const ConfirmButton = React.memo(
  ({ onPress, fetchingAddress, loadingMap, canConfirm = true, translateData, whiteColor }: any) => (
    <TouchableOpacity
      style={[styles.confirmButton,{backgroundColor:'#157A52'}]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={fetchingAddress || loadingMap || !canConfirm}>
      {fetchingAddress ? (
        <BrandLoader size="large" color={whiteColor} />
      ) : (
        <Text style={styles.confirmText}>{translateData.confirmLocation}</Text>
      )}
    </TouchableOpacity>
  ),
);

const PinMarker = React.memo(({ pinImage }: { pinImage: any }) => (
  <View style={styles.pointerMarker}>
    <Image source={pinImage} style={styles.pinImage} />
  </View>
));

export function LocationSave() {
  const {
    isDark,
    linearColorStyle,
    textColorStyle,
    viewRTLStyle,
    textRTLStyle,
    Google_Map_Key,
    bgFullStyle,
  } = useValues();
  const [currentAddress, setCurrentAddress] = useState("");
  const { goBack } = useNavigation();
  const route = useRoute();
  const { mode, locationID, locationDetails, categoryTitle, categoryType } = (route.params ||
    {}) as RouteParams;
  const [locationTitle, setLocationTitle] = useState(
    locationDetails?.title || categoryTitle || "",
  );
  const dispatch = useDispatch();
  const { translateData, taxidoSettingData } = useSelector(
    (state: any) => state.setting,
  );
  const { latitude, longitude } = useStoredLocation();
  const webViewRef = useRef<WebView>(null);
  const [loadingMap, setLoadingMap] = useState(true);
  const [isLocationInitialized, setIsLocationInitialized] = useState(false);
  const [searchText, setSearchText] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SavedPlacePrediction[]>([]);
  const [searchError, setSearchError] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchCoords, setSearchCoords] = useState<{ lat: number; lng: number } | null>(null);
  const saveInFlight = useRef(false);
  const searchSelection = useRef(0);

  const initialLat = searchCoords?.lat ?? (
    mode === "edit" && locationDetails?.location_coordinates?.lat
      ? locationDetails.location_coordinates.lat
      : latitude || 21.0077);
  const initialLng = searchCoords?.lng ?? (
    mode === "edit" && locationDetails?.location_coordinates?.lng
      ? locationDetails.location_coordinates.lng
      : longitude || 75.5626);

  const [titleError, setTitleError] = useState("");
  const [mapCenterCoords, setMapCenterCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [fetchingAddress, setFetchingAddress] = useState(false);
  const addressRequest = useRef(0);
  const [saveLoading, setsaveLoading] = useState(false);
  const saveLocationBottomSheetRef = useRef<BottomSheet>(null);
  const saveLocationSnapPoints = useMemo(() => ["1%", "39%"], []);
  const mapType = taxidoSettingData?.cabbooking_values?.location?.map_provider;

  useEffect(() => {
    let active = true;
    if (searchText == null || searchText.trim().length < 3) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchSavedPlaceAddresses(searchText, Google_Map_Key);
        if (active) setSearchResults(results);
      } catch (error: any) {
        if (active) setSearchError(error.message);
      } finally {
        if (active) setSearchLoading(false);
      }
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [searchText, Google_Map_Key]);

  const selectSearchResult = async (item: SavedPlacePrediction) => {
    const selection = ++searchSelection.current;
    setSearchLoading(true);
    try {
      const place = await resolveSavedPlaceAddress(item.id, Google_Map_Key);
      if (selection !== searchSelection.current) return;
      Keyboard.dismiss();
      ++addressRequest.current;
      setSearchCoords({ lat: place.lat, lng: place.lng });
      setMapCenterCoords({ latitude: place.lat, longitude: place.lng });
      setCurrentAddress(place.fullAddress);
      setFetchingAddress(false);
      setSearchText(null);
      setSearchResults([]);
      setSearchError("");
    } catch (error: any) {
      if (selection === searchSelection.current) setSearchError(error.message);
    } finally {
      if (selection === searchSelection.current) setSearchLoading(false);
    }
  };

  const changeSearch = (text: string) => {
    ++searchSelection.current;
    ++addressRequest.current;
    setSearchText(text);
    setCurrentAddress("");
    setSearchResults([]);
    setSearchError("");
    setFetchingAddress(false);
    setSearchLoading(false);
  };

  // Memoize options to prevent re-creation on each render
  const options = useMemo(
    () => [
      { label: translateData.home, value: "home" },
      { label: translateData.work, value: "work" },
      { label: translateData.other, value: "other" },
    ],
    [translateData.home, translateData.work, translateData.other],
  );

  const validTypes = useMemo(() => options.map(opt => opt.value), [options]);

  const [selectedOption, setSelectedOption] = useState(() =>
    validTypes.includes(locationDetails?.type || "")
      ? locationDetails?.type || ""
      : validTypes.includes(categoryType || '') ? categoryType! : options[0].value,
  );

  // Memoize map HTML to prevent unnecessary re-renders
  const mapHtml = useMemo(
    () => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
      <style>
        html, body, #map { height: 100%; margin: 0; padding: 0; }
        ${isDark ? `body { background-color: #000; }` : ""}
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        let map;
        let debounceTimer;

        function initMap() {
          const initialCoords = { lat: ${initialLat}, lng: ${initialLng} };
          map = new google.maps.Map(document.getElementById('map'), {
            center: initialCoords,
            zoom: 15,
            styles: ${isDark ? JSON.stringify(darkMapStyle) : "[]"},
            disableDefaultUI: true
          });

          map.addListener('center_changed', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              const center = map.getCenter();
              window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: center.lat(), longitude: center.lng() }));
            }, 500);
          });

         // Initial position post
          window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: initialCoords.lat, longitude: initialCoords.lng }));
        }
      </script>
      <script async defer src="https://maps.googleapis.com/maps/api/js?key=${Google_Map_Key}&callback=initMap"></script>
    </body>
    </html>
  `,
    [initialLat, initialLng, Google_Map_Key, isDark],
  );

  const OsmapHtml = useMemo(
    () => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; }
      ${isDark ? `body { background-color: #000; }` : ""}
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
    <script>
      let map;
      let debounceTimer;

      function initMap() {
        const initialCoords = [${initialLat}, ${initialLng}];

        map = L.map('map', {
          center: initialCoords,
          zoom: 15,
          zoomControl: false
        });

        // Tile layer (OpenStreetMap standard)
        const tileLayer = L.tileLayer(
          ${isDark
        ? "'https://tiles.stadiamaps.com/tiles/alidade_dark/{z}/{x}/{y}{r}.png'"
        : "'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'"
      }, 
          {
            attribution: '&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors'
          }
        ).addTo(map);

        // Listen to map move
        map.on('moveend', () => {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            const center = map.getCenter();
            window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: center.lat, longitude: center.lng }));
          }, 500);
        });

        // Initial position post
        window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: initialCoords[0], longitude: initialCoords[1] }));
      }

      // Initialize map
      initMap();
    </script>
  </body>
  </html>
`,
    [initialLat, initialLng, isDark],
  );
  const mapSource = useMemo(() => ({ html: mapType === 'osm' ? OsmapHtml : mapHtml }), [mapType, OsmapHtml, mapHtml]);

  // Memoize fetchAddress to prevent recreation
  const fetchAddress = useCallback(
    async (lat: number, lng: number) => {
      const request = ++addressRequest.current;
      setCurrentAddress("");
      if (!indianCoordinates(lat, lng)) {
        setFetchingAddress(false);
        return;
      }
      if (!Google_Map_Key) {
        console.warn("[fetchAddress] Missing Google Map Key");
        setFetchingAddress(false);
        return;
      }

      try {
        setFetchingAddress(true);
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${Google_Map_Key}`;
        const res = await fetch(url);
        const json = await res.json();

        if (request !== addressRequest.current) return;
        const result = json.results?.find((item: any) => item.address_components?.some(
          (component: any) => component.types?.includes('country') && component.short_name === 'IN',
        ));
        if (json.status === 'OK' && result?.formatted_address) {
          const formattedAddress = result.formatted_address;
          setCurrentAddress(formattedAddress);
        }
      } catch (err) {
        console.error("[fetchAddress] Error:", err);
      } finally {
        if (request === addressRequest.current) setFetchingAddress(false);
      }
    },
    [Google_Map_Key],
  );

  // Optimize useEffect dependencies
  useEffect(() => {
    if (!isLocationInitialized) {
      setMapCenterCoords({ latitude: initialLat, longitude: initialLng });
      fetchAddress(initialLat, initialLng);
      setIsLocationInitialized(true);
    }
  }, [initialLat, initialLng, isLocationInitialized, fetchAddress]);

  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const coords = JSON.parse(event.nativeEvent.data);
        if (!Number.isFinite(coords?.latitude) || !Number.isFinite(coords?.longitude)) return;
        setMapCenterCoords(coords);
        fetchAddress(coords.latitude, coords.longitude);
      } catch (_) { /* Ignore map messages that are not coordinates. */ }
    },
    [fetchAddress],
  );

  const handleConfirmLocation = useCallback(() => {
    if (searchText !== null || searchLoading || !currentAddress || !mapCenterCoords || fetchingAddress || loadingMap) {
      Alert.alert(
        "Location Not Ready",
        "Wait for address to load or move map.",
      );
      return;
    }
    saveLocationBottomSheetRef.current?.expand();
  }, [currentAddress, mapCenterCoords, fetchingAddress, loadingMap, searchText, searchLoading]);

  const goback = useCallback(() => {
    goBack();
  }, [goBack]);

  const addAddress = useCallback(async () => {
    if (saveInFlight.current) return;
    setsaveLoading(true);
    if (!locationTitle?.trim()) {
      setTitleError(translateData.addressRequired || "Please Enter Your Title");
      setsaveLoading(false);
      return;
    }
    if (searchText !== null || searchLoading || !currentAddress || !indianCoordinates(mapCenterCoords?.latitude, mapCenterCoords?.longitude) || fetchingAddress || loadingMap) {
      Alert.alert("Location Not Ready", "Please wait for a valid address before saving.");
      setsaveLoading(false);
      return;
    }
    setTitleError("");

    const payload: SaveLocationDataInterface = {
      title: locationTitle.trim(),
      location: currentAddress,
      type: selectedOption,
      location_coordinates: {
        lat: mapCenterCoords?.latitude,
        lng: mapCenterCoords?.longitude,
      },
    } as SaveLocationDataInterface;

    // Fix TypeScript error by casting dispatch
    const action =
      mode === "edit"
        ? updateSaveLocation({ data: payload, locationID: locationID || 0 })
        : addSaveLocation(payload);

    saveInFlight.current = true;
    try {
      await (dispatch as any)(action).unwrap();

      try {
        await (dispatch as any)(userSaveLocation()).unwrap();
      } catch (refreshError) {
        console.error("Location saved, but saved locations failed to refresh:", refreshError);
        Alert.alert(
          "Location Saved",
          "The location was saved, but the list could not refresh. Reopen Saved Locations to try again.",
          [
            {
              text: "OK",
              onPress: () => {
                saveLocationBottomSheetRef.current?.close();
                goBack();
              },
            },
          ],
        );
        return;
      }

      saveLocationBottomSheetRef.current?.close();
      goBack();
    } catch (error: any) {
      console.error(
        `Error ${mode === "edit" ? "updating" : "adding"} location:`,
        error,
      );
      Alert.alert(
        "Error",
        error?.message ||
          `Failed to ${mode === "edit" ? "update" : "add"} location. Please try again.`,
      );
    } finally {
      saveInFlight.current = false;
      setsaveLoading(false);
    }
  }, [
    locationTitle,
    fetchingAddress,
    loadingMap,
    searchText,
    searchLoading,
    currentAddress,
    selectedOption,
    mapCenterCoords,
    mode,
    locationID,
    dispatch,
    goBack,
    translateData.addressRequired,
  ]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleBottomSheetClose = useCallback(() => {
    if (mode !== "edit") {
      setLocationTitle("");
    }
    setTitleError("");
  }, [mode]);

  // Memoize bottom sheet content to prevent unnecessary re-renders
  const bottomSheetContent = useMemo(
    () => (
      <BottomSheetView style={bottomSheetStyles.contentContainer}>
        <Text style={[styles.title, { color: textColorStyle }]}>
          {translateData.addNewLocation}
        </Text>
        <View style={styles.container}>
          <View style={[styles.optionContain, { flexDirection: viewRTLStyle }]}>
            {options.map(option => (
              <TouchableOpacity
                activeOpacity={0.7}
                key={option.value}
                style={[
                  [
                    styles.optionContainer,
                    { flexDirection: viewRTLStyle },
                    {
                      borderColor: isDark
                        ? appColors.darkBorder
                        : appColors.border,
                      backgroundColor: isDark
                        ? appColors.darkPrimary
                        : appColors.whiteColor,
                    },
                  ],
                  selectedOption === option.value &&
                  styles.selectedOptionContainer,
                ]}
                onPress={() => setSelectedOption(option.value)}>
                <View
                  style={[
                    styles.radioButton,
                    selectedOption === option.value &&
                    styles.selectedOptionRadio,
                  ]}>
                  {selectedOption === option.value && (
                    <View style={styles.radioSelected} />
                  )}
                </View>
                <Text
                  style={[
                    styles.optionLabel,
                    {
                      color: isDark
                        ? appColors.whiteColor
                        : appColors.primaryText,
                    },
                    selectedOption === option.value &&
                    styles.selectedOptionLabel,
                  ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text
            style={{
              color: isDark ? appColors.whiteColor : appColors.primaryText,
              fontFamily: appFonts.medium,
              marginTop: windowHeight(8),
              textAlign: textRTLStyle,
            }}>
            {translateData.addressTitle}
          </Text>
          <BottomSheetTextInput
            placeholder={translateData.enterYouTitleeeee}
            placeholderTextColor={appColors.regularText}
            style={[
              styles.titleInput,
              { color: textColorStyle },
              { borderColor: isDark ? appColors.darkBorder : appColors.border },
              { textAlign: textRTLStyle },
            ]}
            value={locationTitle}
            onChangeText={text => {
              setLocationTitle(text);
              if (!text.trim()) {
                setTitleError(
                  translateData.addressRequired || "Title is required",
                );
              } else {
                setTitleError("");
              }
            }}
          />

          {titleError ? (
            <Text
              style={{
                color: appColors.textRed,
                fontSize: fontSizes.FONT14SMALL,
                fontFamily: appFonts.medium,
              }}>
              {titleError}
            </Text>
          ) : null}
        </View>
        <View style={[styles.btnContainer, { flexDirection: viewRTLStyle }]}>
          <Button
            backgroundColor={appColors.lightButton}
            onPress={() => saveLocationBottomSheetRef.current?.close()}
            textColor={appColors.primary}
            title={translateData.cancel}
            width={"48%"}
          />
          <Button
            backgroundColor={appColors.primary}
            onPress={addAddress}
            textColor={appColors.whiteColor}
            title={translateData.save}
            width={"48%"}
            loading={saveLoading}
          />
        </View>
      </BottomSheetView>
    ),
    [
      textColorStyle,
      translateData.addNewLocation,
      translateData.addressTitle,
      translateData.enterYouTitleeeee,
      translateData.cancel,
      translateData.save,
      viewRTLStyle,
      options,
      selectedOption,
      isDark,
      locationTitle,
      titleError,
      saveLoading,
      addAddress,
      textRTLStyle,
      translateData.addressRequired,
    ],
  );

  return (
    <ReferenceScreen><View style={external.main}>
      <View style={{ flexDirection: "row" }}>
        <BackButton onPress={goback} linearColorStyle={linearColorStyle} />
        <AddressInput
          fetchingAddress={fetchingAddress || searchLoading}
          currentAddress={currentAddress}
          translateData={translateData}
          linearColorStyle={linearColorStyle}
          textColorStyle={textColorStyle}
          viewRTLStyle={viewRTLStyle}
          isDark={isDark}
          darkBorder={appColors.darkBorder}
          primaryGray={appColors.primaryGray}
          searchText={searchText}
          onSearchChange={changeSearch}
        />
      </View>
      {searchText !== null && (
        <ScrollView keyboardShouldPersistTaps="handled" style={{ position: 'absolute', top: windowHeight(55), left: windowWidth(10), right: windowWidth(10), maxHeight: windowHeight(220), zIndex: 10, elevation: 8, borderRadius: 8, backgroundColor: bgFullStyle }}>
          {searchLoading && <BrandLoader color={appColors.primary} />}
          {!!searchError && <Text style={{ padding: 12, color: textColorStyle }}>{searchError}</Text>}
          {!searchLoading && !searchError && searchText.trim().length >= 3 && searchResults.length === 0 && <Text style={{ padding: 12, color: textColorStyle }}>No matching addresses. Try a fuller address or choose on the map.</Text>}
          {searchResults.map(item => (
            <TouchableOpacity key={item.id} accessibilityRole="button" accessibilityLabel={`Select ${item.label}`} onPress={() => selectSearchResult(item)} style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: appColors.border }}>
              <Text style={{ color: textColorStyle }}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => { Keyboard.dismiss(); changeSearch(''); setSearchText(null); if (mapCenterCoords) fetchAddress(mapCenterCoords.latitude, mapCenterCoords.longitude); }} style={{ padding: 14 }}>
            <Text style={{ color: appColors.primary }}>Choose on map</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
      <View style={styles.mapView}>
        {loadingMap && (
          <BrandLoader
            style={StyleSheet.absoluteFill}
            size="large"
            color={appColors.primary}
          />
        )}
        <WebView
          ref={webViewRef}
          source={mapSource}
          onLoadStart={() => setLoadingMap(true)}
          onLoadEnd={() => setLoadingMap(false)}
          onMessage={handleWebViewMessage}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <BrandLoader
              style={StyleSheet.absoluteFill}
              size="large"
              color={appColors.primary}
            />
          )}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <ConfirmButton
        onPress={handleConfirmLocation}
        fetchingAddress={fetchingAddress || searchLoading}
        canConfirm={searchText === null && Boolean(currentAddress)}
        loadingMap={loadingMap}
        translateData={translateData}
        whiteColor={appColors.whiteColor}
      />
      <PinMarker pinImage={Images.pin} />

      <BottomSheet
        ref={saveLocationBottomSheetRef}
        index={-1}
        snapPoints={saveLocationSnapPoints}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        keyboardBlurBehavior="restore"
        onChange={index => {
          if (index === -1) {
            handleBottomSheetClose();
          }
        }}
        style={{ zIndex: 5 }}
        handleIndicatorStyle={{
          backgroundColor: appColors.primary,
          width: "13%",
        }}
        backgroundStyle={{ backgroundColor: bgFullStyle }} android_keyboardInputMode="adjustResize" >
        {bottomSheetContent}
      </BottomSheet>
    </View></ReferenceScreen>
  );
}

const bottomSheetStyles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingHorizontal: windowWidth(18),
    paddingTop: windowHeight(15),
  },
  closeButton: {
    position: "absolute",
    right: windowWidth(5),
    top: windowHeight(2),
    zIndex: 10,
    padding: windowWidth(2),
  },
});
